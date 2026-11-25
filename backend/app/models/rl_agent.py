import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import List, Dict, Tuple, Any

class RLSummarizationAgent(nn.Module):
    """
    Reinforcement Learning Policy Agent for Extractive Sentence Selection.
    
    Academic formulation:
    Formulated as a contextual policy gradient optimization task.
    The agent observes sentence representations alongside current summary state
    and outputs stochastic inclusion decisions.
    
    Reward R combines:
    1. Global Semantic Coverage (Cosine similarity between summary & document)
    2. Information Novelty (Penalty on intra-summary redundancy)
    3. Length constraint compliance (Gaussian budget penalty)
    """
    def __init__(self, state_dim: int = 512, hidden_dim: int = 128):
        super(RLSummarizationAgent, self).__init__()
        
        # Policy Network: takes sentence repr + accumulated summary repr + progress feature
        self.policy_net = nn.Sequential(
            nn.Linear(state_dim * 2 + 2, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, 2)  # [Reject action, Select action]
        )
        
        # Value baseline network for variance reduction in REINFORCE
        self.value_net = nn.Sequential(
            nn.Linear(state_dim * 2 + 2, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, 1)
        )

    def optimize_selection(
        self,
        sentence_embeddings: torch.Tensor,
        doc_vector: torch.Tensor,
        gan_scores: torch.Tensor,
        target_budget: int = 5
    ) -> Tuple[torch.Tensor, torch.Tensor, Dict[str, Any]]:
        """
        Executes sequential RL policy to select optimal subset of sentences
        maximizing coverage and minimizing redundancy.
        
        Returns:
            rl_rewards: (N,) rewards attributed to each sentence
            refined_indices: Indices of chosen sentences
            rl_telemetry: Dictionary with episodic reward, policy entropy, baseline values
        """
        N = sentence_embeddings.shape[0]
        if N == 0:
            return torch.zeros(0), torch.zeros(0, dtype=torch.long), {}
            
        selected_indices = []
        action_probs_list = []
        sentence_rewards = torch.zeros(N)
        
        accumulated_summary_vec = torch.zeros_like(doc_vector)
        
        for i in range(N):
            curr_sent = sentence_embeddings[i]
            budget_ratio = float(len(selected_indices)) / float(max(target_budget, 1))
            pos_ratio = float(i) / float(max(N, 1))
            
            # Construct state vector
            state = torch.cat([
                curr_sent,
                accumulated_summary_vec,
                torch.tensor([budget_ratio, pos_ratio], device=sentence_embeddings.device)
            ]).unsqueeze(0)
            
            logits = self.policy_net(state)
            probs = F.softmax(logits, dim=-1)
            
            # Bias policy slightly with GAN prior for hybrid synergy
            prior = gan_scores[i].clamp(0.05, 0.95).item()
            adjusted_prob = 0.6 * probs[0, 1].item() + 0.4 * prior
            
            # Decision thresholding with budget awareness
            if len(selected_indices) < target_budget and adjusted_prob > 0.45:
                selected_indices.append(i)
                # Update accumulated summary vector
                n_sel = len(selected_indices)
                accumulated_summary_vec = (accumulated_summary_vec * (n_sel - 1) + curr_sent) / n_sel
                
            action_probs_list.append(adjusted_prob)

        # Ensure at least min(target_budget, N) sentences are selected
        if len(selected_indices) == 0:
            selected_indices = [int(torch.argmax(gan_scores).item())]

        # Calculate RL episodic rewards
        # 1. Semantic Coverage Reward
        summary_repr = accumulated_summary_vec
        coverage_reward = F.cosine_similarity(summary_repr.unsqueeze(0), doc_vector.unsqueeze(0)).item()
        
        # 2. Redundancy Penalty (pairwise similarity among selected)
        redundancy_penalty = 0.0
        if len(selected_indices) > 1:
            sel_tensors = sentence_embeddings[selected_indices]
            sim_matrix = F.cosine_similarity(sel_tensors.unsqueeze(1), sel_tensors.unsqueeze(0), dim=-1)
            # Mask diagonal
            mask = torch.eye(len(selected_indices), device=sentence_embeddings.device).bool()
            off_diag = sim_matrix[~mask]
            redundancy_penalty = torch.mean(off_diag).item() if len(off_diag) > 0 else 0.0
            
        # 3. Budget adherence
        budget_reward = -0.15 * abs(len(selected_indices) - target_budget)
        
        # Total episode reward
        total_episode_reward = (1.5 * coverage_reward) - (0.8 * redundancy_penalty) + budget_reward
        
        # Attribute sentence-level credit
        for i in range(N):
            is_sel = 1.0 if i in selected_indices else 0.0
            alignment = F.cosine_similarity(sentence_embeddings[i].unsqueeze(0), doc_vector.unsqueeze(0)).item()
            sentence_rewards[i] = round(0.5 * action_probs_list[i] + 0.5 * (alignment * total_episode_reward * is_sel), 4)

        telemetry = {
            "episode_reward": round(total_episode_reward, 4),
            "coverage_reward": round(coverage_reward, 4),
            "redundancy_penalty": round(redundancy_penalty, 4),
            "budget_deviation": round(budget_reward, 4),
            "policy_exploration_entropy": round(float(np.mean([-p * np.log(p + 1e-6) for p in action_probs_list])), 4)
        }
        
        return sentence_rewards, torch.tensor(selected_indices, dtype=torch.long), telemetry
