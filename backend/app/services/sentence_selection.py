import os
import time
import torch
import logging
import numpy as np
from typing import List, Dict, Any, Tuple
from ..models.distilbert_model import DistilBERTSentenceEncoder
from ..models.tlstm_model import TemporalSentenceLSTM
from ..models.gan_model import GANExtractiveSelector
from ..models.rl_agent import RLSummarizationAgent
from .preprocessing import TextPreprocessor

logger = logging.getLogger(__name__)

class SentenceSelectionService:
    """
    MODULE 1: GAN-Based Extractive Summarization with Reinforcement Learning.
    
    Academic Architecture:
    1. Sentence Tokenization & Text Preprocessing (NLTK + spaCy)
    2. DistilBERT Sentence Feature Encoding (768-dim)
    3. TLSTM (Temporal-LSTM) Discourse Context Modeling
    4. GAN Generator & Discriminator Sentence Salience Scoring
    5. Reinforcement Learning Policy Refinement (REINFORCE Coverage vs Redundancy)
    6. Ranked Sentence Selection & Composition
    """
    def __init__(self, checkpoints_dir: str = None):
        self.encoder = DistilBERTSentenceEncoder()
        # TLSTM takes 768 from DistilBERT, outputs 512 (256 * 2)
        self.tlstm = TemporalSentenceLSTM(input_dim=768, hidden_dim=256)
        self.gan_selector = GANExtractiveSelector(feature_dim=512)
        self.rl_agent = RLSummarizationAgent(state_dim=512, hidden_dim=128)
        
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.checkpoints_dir = checkpoints_dir or os.path.join(base_dir, "checkpoints")
        self.checkpoints_loaded = self._load_saved_checkpoints()

    def _load_saved_checkpoints(self) -> bool:
        """Loads trained model weights from checkpoints directory if present."""
        try:
            device = "cuda" if torch.cuda.is_available() else "cpu"
            tlstm_p = os.path.join(self.checkpoints_dir, "tlstm.pt")
            gen_p = os.path.join(self.checkpoints_dir, "gan_generator.pt")
            disc_p = os.path.join(self.checkpoints_dir, "gan_discriminator.pt")
            rl_p = os.path.join(self.checkpoints_dir, "rl_agent.pt")

            loaded = False
            if os.path.isfile(tlstm_p):
                self.tlstm.load_state_dict(torch.load(tlstm_p, map_location=device))
                loaded = True
            if os.path.isfile(gen_p):
                self.gan_selector.generator.load_state_dict(torch.load(gen_p, map_location=device))
                loaded = True
            if os.path.isfile(disc_p):
                self.gan_selector.discriminator.load_state_dict(torch.load(disc_p, map_location=device))
                loaded = True
            if os.path.isfile(rl_p):
                self.rl_agent.load_state_dict(torch.load(rl_p, map_location=device))
                loaded = True

            if loaded:
                logger.info(f"Loaded trained research checkpoints from {self.checkpoints_dir}")
                self.tlstm.eval()
                self.gan_selector.eval()
                self.rl_agent.eval()
            return loaded
        except Exception as e:
            logger.warning(f"Could not load checkpoints ({e}). Running in research dynamic mode.")
            return False

    def process(self, document_text: str, max_sentences: int = 5) -> Dict[str, Any]:
        start_time = time.time()
        
        # 1. Preprocess & Segment
        doc_analysis = TextPreprocessor.analyze_document(document_text)
        sentences = doc_analysis["sentences"]
        
        if not sentences:
            return {
                "extractive_summary": "",
                "selected_sentences": [],
                "all_sentences": [],
                "execution_time_ms": 0.0,
                "telemetry": {}
            }
            
        N = len(sentences)
        target_k = min(max_sentences, N)
        
        # 2. DistilBERT Encoding
        t0 = time.time()
        bert_tensors, bert_numpy = self.encoder.encode(sentences)
        bert_time = (time.time() - t0) * 1000
        
        # DistilBERT magnitude norm
        bert_norms = np.linalg.norm(bert_numpy, axis=1) if N > 0 else np.zeros(0)
        bert_norm_normalized = (bert_norms / max(np.max(bert_norms) if len(bert_norms) > 0 and np.max(bert_norms) > 0 else 1.0, 1e-6)).tolist()
        
        # 3. TLSTM Contextual Sequence Modeling
        t1 = time.time()
        with torch.no_grad():
            context_embeddings, doc_vector, salience_scores = self.tlstm(bert_tensors)
        tlstm_time = (time.time() - t1) * 1000
        tlstm_salience = salience_scores.squeeze(-1).cpu().numpy().tolist() if N > 0 else []
        
        # 4. GAN-based Sentence Scoring
        t2 = time.time()
        gan_scores_tensor, gan_top_indices, gan_metrics = self.gan_selector.select_sentences(
            context_embeddings,
            doc_vector,
            top_k=target_k
        )
        gan_time = (time.time() - t2) * 1000
        gan_scores = gan_scores_tensor.cpu().numpy().tolist() if N > 0 else []
        
        # 5. Reinforcement Learning Optimization
        t3 = time.time()
        rl_rewards_tensor, rl_selected_indices, rl_metrics = self.rl_agent.optimize_selection(
            context_embeddings,
            doc_vector,
            gan_scores_tensor,
            target_budget=target_k
        )
        rl_time = (time.time() - t3) * 1000
        rl_rewards = rl_rewards_tensor.cpu().numpy().tolist() if N > 0 else []
        
        # 6. Hybrid Score Synthesis
        # W1: DistilBERT norm (0.15), W2: TLSTM salience (0.25), W3: GAN score (0.35), W4: RL reward (0.25)
        hybrid_scores = []
        for i in range(N):
            s_bert = bert_norm_normalized[i] if i < len(bert_norm_normalized) else 0.5
            s_tlstm = tlstm_salience[i] if i < len(tlstm_salience) else 0.5
            s_gan = gan_scores[i] if i < len(gan_scores) else 0.5
            s_rl = rl_rewards[i] if i < len(rl_rewards) else 0.5
            
            # Positional prior: academic articles front-load salient statements
            pos_weight = 1.0 + 0.15 * np.exp(-0.2 * i)
            
            score = (0.15 * s_bert + 0.25 * s_tlstm + 0.35 * s_gan + 0.25 * s_rl) * pos_weight
            hybrid_scores.append(round(float(score), 4))
            
        # Determine final selected indices
        ranked_order = np.argsort(-np.array(hybrid_scores))
        chosen_set = set(ranked_order[:target_k])
        
        # Format structured output with ranks
        sentence_items = []
        ranks = {idx: rank + 1 for rank, idx in enumerate(ranked_order)}
        
        for i, text in enumerate(sentences):
            sentence_items.append({
                "index": i,
                "text": text,
                "importance_score": hybrid_scores[i],
                "distilbert_norm": round(bert_norm_normalized[i] if i < len(bert_norm_normalized) else 0.5, 4),
                "tlstm_salience": round(tlstm_salience[i] if i < len(tlstm_salience) else 0.5, 4),
                "gan_score": round(gan_scores[i] if i < len(gan_scores) else 0.5, 4),
                "rl_reward": round(rl_rewards[i] if i < len(rl_rewards) else 0.5, 4),
                "selected": i in chosen_set,
                "rank": ranks[i]
            })
            
        # Extractive summary preserves chronological discourse order of selected sentences
        selected_in_order = [s for s in sentence_items if s["selected"]]
        selected_in_order.sort(key=lambda x: x["index"])
        extractive_summary_text = " ".join([s["text"] for s in selected_in_order])
        
        total_time = (time.time() - start_time) * 1000
        
        return {
            "extractive_summary": extractive_summary_text,
            "selected_sentences": [s["text"] for s in selected_in_order],
            "all_sentences": sentence_items,
            "execution_time_ms": round(total_time, 2),
            "telemetry": {
                "distilbert_encoding_time_ms": round(bert_time, 2),
                "tlstm_processing_time_ms": round(tlstm_time, 2),
                "gan_selection_time_ms": round(gan_time, 2),
                "rl_optimization_time_ms": round(rl_time, 2),
                "gan_metrics": gan_metrics,
                "rl_metrics": rl_metrics,
                "is_real_weights": self.encoder.is_real_weights,
                "checkpoints_loaded": self.checkpoints_loaded
            }
        }
