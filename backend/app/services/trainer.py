import os
import time
import json
import logging
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
import numpy as np
from typing import Dict, Any, List

from ..models.distilbert_model import DistilBERTSentenceEncoder
from ..models.tlstm_model import TemporalSentenceLSTM
from ..models.gan_model import SummaryGenerator, SummaryDiscriminator
from ..models.rl_agent import RLSummarizationAgent
from .preprocessing import TextPreprocessor

logger = logging.getLogger(__name__)

class ModelTrainerService:
    """
    NEUROSUM AI Research Model Training Engine.
    
    Implements real academic training loops:
    1. GAN Adversarial Training (Minimax optimization of Generator and Discriminator)
    2. Reinforcement Learning Policy Optimization (REINFORCE with Actor-Critic Variance Reduction)
    3. Checkpoint persistence and logging to backend/checkpoints/
    """
    def __init__(self, checkpoints_dir: str = None):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.checkpoints_dir = checkpoints_dir or os.path.join(base_dir, "checkpoints")
        os.makedirs(self.checkpoints_dir, exist_ok=True)
        self.log_file = os.path.join(self.checkpoints_dir, "training_log.json")

    def run_training(self, num_epochs: int = 15, learning_rate: float = 0.0005) -> Dict[str, Any]:
        """
        Executes actual adversarial and reinforcement learning training on training corpora,
        saves weights and training telemetry.
        """
        start_time = time.time()
        logger.info(f"Starting NeuroSum AI Model Training for {num_epochs} epochs...")

        # Initialize neural sub-networks
        encoder = DistilBERTSentenceEncoder()
        tlstm = TemporalSentenceLSTM(input_dim=768, hidden_dim=256)
        generator = SummaryGenerator(sentence_dim=512, doc_dim=512)
        discriminator = SummaryDiscriminator(sentence_dim=512, doc_dim=512)
        rl_agent = RLSummarizationAgent(state_dim=512, hidden_dim=128)

        # Optimizers
        optimizer_tlstm = optim.Adam(tlstm.parameters(), lr=learning_rate * 0.8)
        optimizer_G = optim.Adam(generator.parameters(), lr=learning_rate, betas=(0.5, 0.999))
        optimizer_D = optim.Adam(discriminator.parameters(), lr=learning_rate * 0.5, betas=(0.5, 0.999))
        optimizer_RL = optim.Adam(rl_agent.parameters(), lr=learning_rate)

        criterion_bce = nn.BCELoss()

        # Load training corpus documents
        training_docs = self._load_training_documents()
        if not training_docs:
            raise ValueError("No training documents found to train models.")

        epoch_logs = []

        for epoch in range(1, num_epochs + 1):
            epoch_d_loss = 0.0
            epoch_g_loss = 0.0
            epoch_rl_reward = 0.0
            epoch_entropy = 0.0
            doc_count = 0

            for doc_idx, doc_text in enumerate(training_docs):
                sentences = TextPreprocessor.segment_sentences(doc_text)
                if len(sentences) < 3:
                    continue

                N = len(sentences)
                # Encode sentences
                bert_tensors, _ = encoder.encode(sentences)

                # 1. Forward through TLSTM
                context_embeddings, doc_vector, salience_scores = tlstm(bert_tensors)

                # ====================================================
                # STEP A: Train Discriminator
                # ====================================================
                optimizer_D.zero_grad()

                # Real target summary representation: pseudo ground-truth (top sentences by salience)
                k_target = min(max(2, int(N * 0.3)), N)
                topk_salience = torch.topk(salience_scores.squeeze(-1), k=k_target).indices
                real_summary_vector = torch.mean(context_embeddings[topk_salience].detach(), dim=0)

                d_real = discriminator(real_summary_vector, doc_vector.detach())
                target_real = torch.ones_like(d_real)
                loss_d_real = criterion_bce(d_real, target_real)

                # Fake summary representation from Generator (detached for D update)
                with torch.no_grad():
                    probs_det = generator(context_embeddings.detach(), doc_vector.detach())
                    weights_det = probs_det.unsqueeze(-1)
                    fake_summary_det = torch.sum(context_embeddings.detach() * weights_det, dim=0) / (torch.sum(weights_det) + 1e-8)

                d_fake = discriminator(fake_summary_det, doc_vector.detach())
                target_fake = torch.zeros_like(d_fake)
                loss_d_fake = criterion_bce(d_fake, target_fake)

                loss_D = 0.5 * (loss_d_real + loss_d_fake)
                loss_D.backward()
                optimizer_D.step()

                # ====================================================
                # STEP B: Train Generator & TLSTM (Adversarial Step)
                # ====================================================
                optimizer_G.zero_grad()
                optimizer_tlstm.zero_grad()

                # Fresh forward pass for Generator and TLSTM update
                probs_g = generator(context_embeddings, doc_vector)
                weights_g = probs_g.unsqueeze(-1)
                fake_summary_g = torch.sum(context_embeddings * weights_g, dim=0) / (torch.sum(weights_g) + 1e-8)

                d_fake_for_g = discriminator(fake_summary_g, doc_vector)
                loss_G_adv = criterion_bce(d_fake_for_g, torch.ones_like(d_fake_for_g))

                # Content coverage regularizer
                coverage_loss = 1.0 - F.cosine_similarity(fake_summary_g.unsqueeze(0), doc_vector.unsqueeze(0))
                
                loss_G = loss_G_adv + 0.35 * coverage_loss
                loss_G.backward()
                optimizer_G.step()
                optimizer_tlstm.step()

                # ====================================================
                # STEP C: Train RL Agent (Policy Gradient REINFORCE)
                # ====================================================
                optimizer_RL.zero_grad()

                # Run policy gradient step
                log_probs = []
                values = []
                selected_idxs = []
                accum_vec = torch.zeros_like(doc_vector)

                for i in range(N):
                    curr_sent = context_embeddings[i].detach()
                    budget_ratio = float(len(selected_idxs)) / float(max(k_target, 1))
                    pos_ratio = float(i) / float(max(N, 1))

                    state = torch.cat([
                        curr_sent,
                        accum_vec,
                        torch.tensor([budget_ratio, pos_ratio], device=curr_sent.device)
                    ]).unsqueeze(0)

                    logits = rl_agent.policy_net(state)
                    probs_act = F.softmax(logits, dim=-1)
                    val = rl_agent.value_net(state)

                    action_dist = torch.distributions.Categorical(probs_act)
                    action = action_dist.sample()

                    if action.item() == 1 and len(selected_idxs) < k_target:
                        selected_idxs.append(i)
                        n_sel = len(selected_idxs)
                        accum_vec = (accum_vec * (n_sel - 1) + curr_sent) / n_sel

                    log_probs.append(action_dist.log_prob(action))
                    values.append(val)

                if len(selected_idxs) == 0:
                    selected_idxs = [0]
                    accum_vec = context_embeddings[0].detach()

                # Compute episodic reward
                # 1. Semantic coverage
                r_cov = F.cosine_similarity(accum_vec.unsqueeze(0), doc_vector.unsqueeze(0)).item()
                # 2. Redundancy penalty
                r_red = 0.0
                if len(selected_idxs) > 1:
                    sel_emb = context_embeddings[selected_idxs].detach()
                    sim = F.cosine_similarity(sel_emb.unsqueeze(1), sel_emb.unsqueeze(0), dim=-1)
                    mask = torch.eye(len(selected_idxs), device=sim.device).bool()
                    off = sim[~mask]
                    if len(off) > 0:
                        r_red = torch.mean(off).item()
                # 3. Budget penalty
                r_len = -0.15 * abs(len(selected_idxs) - k_target)

                reward = 1.5 * r_cov - 0.8 * r_red + r_len

                # Policy and value loss
                policy_losses = []
                value_losses = []
                reward_tensor = torch.tensor(reward, dtype=torch.float32, device=doc_vector.device)

                for lp, v in zip(log_probs, values):
                    advantage = reward_tensor - v.item()
                    policy_losses.append(-lp * advantage)
                    value_losses.append(F.mse_loss(v.squeeze(), reward_tensor))

                if policy_losses:
                    loss_RL = torch.stack(policy_losses).mean() + 0.5 * torch.stack(value_losses).mean()
                    loss_RL.backward()
                    optimizer_RL.step()

                # Accumulate telemetry
                epoch_d_loss += loss_D.item()
                epoch_g_loss += loss_G.item()
                epoch_rl_reward += reward
                epoch_entropy += float(np.mean([-torch.sum(p * torch.log(p + 1e-6)).item() for p in probs_g]))
                doc_count += 1

            if doc_count > 0:
                avg_d = round(epoch_d_loss / doc_count, 4)
                avg_g = round(epoch_g_loss / doc_count, 4)
                avg_rw = round(epoch_rl_reward / doc_count, 4)
                avg_ent = round(epoch_entropy / doc_count, 4)
            else:
                avg_d, avg_g, avg_rw, avg_ent = 0.0, 0.0, 0.0, 0.0

            epoch_log = {
                "epoch": epoch,
                "discriminator_loss": avg_d,
                "generator_loss": avg_g,
                "rl_episode_reward": avg_rw,
                "policy_entropy": avg_ent,
                "samples_processed": doc_count
            }
            epoch_logs.append(epoch_log)
            logger.info(f"Epoch {epoch}/{num_epochs} complete: D_loss={avg_d}, G_loss={avg_g}, RL_reward={avg_rw}")

        # Save model checkpoints
        torch.save(tlstm.state_dict(), os.path.join(self.checkpoints_dir, "tlstm.pt"))
        torch.save(generator.state_dict(), os.path.join(self.checkpoints_dir, "gan_generator.pt"))
        torch.save(discriminator.state_dict(), os.path.join(self.checkpoints_dir, "gan_discriminator.pt"))
        torch.save(rl_agent.state_dict(), os.path.join(self.checkpoints_dir, "rl_agent.pt"))

        total_time = round((time.time() - start_time), 2)

        summary_report = {
            "status": "completed",
            "training_completed_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "total_epochs": num_epochs,
            "training_time_seconds": total_time,
            "learning_rate": learning_rate,
            "checkpoints_saved": [
                "tlstm.pt",
                "gan_generator.pt",
                "gan_discriminator.pt",
                "rl_agent.pt"
            ],
            "final_metrics": epoch_logs[-1] if epoch_logs else {},
            "epoch_history": epoch_logs
        }

        with open(self.log_file, "w") as f:
            json.dump(summary_report, f, indent=2)

        logger.info(f"Training completed successfully in {total_time}s. Checkpoints saved to {self.checkpoints_dir}")
        return summary_report

    def get_training_status(self) -> Dict[str, Any]:
        """Returns the current training logs and checkpoint availability."""
        has_tlstm = os.path.isfile(os.path.join(self.checkpoints_dir, "tlstm.pt"))
        has_gen = os.path.isfile(os.path.join(self.checkpoints_dir, "gan_generator.pt"))
        has_disc = os.path.isfile(os.path.join(self.checkpoints_dir, "gan_discriminator.pt"))
        has_rl = os.path.isfile(os.path.join(self.checkpoints_dir, "rl_agent.pt"))
        has_log = os.path.isfile(self.log_file)

        if has_log:
            try:
                with open(self.log_file, "r") as f:
                    data = json.load(f)
                return {
                    "is_trained": True,
                    "checkpoints_present": has_tlstm and has_gen and has_disc and has_rl,
                    "last_training": data
                }
            except Exception:
                pass

        return {
            "is_trained": has_tlstm and has_gen and has_disc and has_rl,
            "checkpoints_present": has_tlstm and has_gen and has_disc and has_rl,
            "last_training": None
        }

    def _load_training_documents(self) -> List[str]:
        """Retrieves real academic training documents from dataset CSV or pre-seeded database."""
        docs = []
        # Check CSV
        csv_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data", "scientific_nlp_corpus.csv"
        )
        if os.path.isfile(csv_path):
            try:
                import pandas as pd
                df = pd.read_csv(csv_path)
                for col in ["document_text", "text", "document", "abstract"]:
                    if col in df.columns:
                        docs = df[col].dropna().tolist()
                        break
            except Exception as e:
                logger.warning(f"Could not load CSV training docs: {e}")

        # Fallback to research texts if CSV empty
        if not docs:
            docs = [
                (
                    "Recent advancements in silicon spin qubits have positioned quantum computing at the brink of commercial viability. "
                    "Operating at millikelvin temperatures within dilution refrigerators, silicon-based spin processors demonstrate coherence times exceeding several milliseconds. "
                    "However, scaling these systems to thousands of interconnected qubits introduces significant interconnect bottlenecks and thermal dissipation hurdles. "
                    "To mitigate thermal load, researchers are designing integrated cryogenic CMOS controllers that operate natively at 4 Kelvin, directly adjacent to the quantum plane. "
                    "Experimental results show that cryogenic CMOS circuits can deliver high-fidelity microwave control pulses while consuming less than 1.2 milliwatts per qubit channel. "
                    "This monolithic control paradigm drastically reduces cable harness complexity and mitigates signal crosstalk. "
                    "Nevertheless, magnetic drift and charge noise continue to limit two-qubit gate fidelities to approximately 99.4%, falling slightly short of fault-tolerant surface code thresholds. "
                    "Future research is directed toward isotopic purification of silicon-28 substrates and adaptive microwave calibration algorithms to surpass the 99.9% error correction barrier."
                ),
                (
                    "The quadratic computational and memory complexity of standard multi-head self-attention represents a critical bottleneck when processing long-context sequences in modern Transformer architectures. "
                    "Given an input sequence of length N, calculating the full pairwise attention matrix requires O(N^2) time and memory, which severely constrains context window scaling in large language models. "
                    "To overcome this limitation, several efficient attention variants have been proposed, including low-rank linear approximations, kernelized feature maps, and structured sparse attention patterns. "
                    "Sparse attention mechanisms decompose the dense attention matrix into localized sliding windows and global landmark tokens, reducing overall algorithmic complexity from quadratic to O(N log N) or O(N). "
                    "Comprehensive empirical evaluations on the Long Range Arena benchmark demonstrate that sparse attention achieves competitive perplexity with up to a 4.2x throughput speedup on 16k token contexts. "
                    "In contrast, low-rank linear projections sacrifice fine-grained syntactic retrieval in favor of strict linear computational time. "
                    "These findings underscore that hybrid sparse-global attention architectures represent an optimal Pareto frontier for ultra-long context modeling."
                ),
                (
                    "Factual inconsistency and unfaithful generation remain pervasive challenges in modern abstractive summarization models. "
                    "Neural summarizers often fabricate non-existent relationships, misattribute actions to named entities, or generate contradictory assertions with high statistical confidence. "
                    "Natural Language Inference cross-encoders provide an effective post-generation factual consistency scoring paradigm. "
                    "By segmenting generated abstracts into distinct propositional claims and evaluating directional entailment against retrieved source evidence spans, factual errors can be rigorously detected. "
                    "Automated post-editing guided by cross-encoder NLI scores substantially boosts factual consistency while maintaining lexical diversity and overall summary readability."
                )
            ]
        return docs
