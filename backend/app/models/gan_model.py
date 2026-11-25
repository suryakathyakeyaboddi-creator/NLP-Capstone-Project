import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple, Dict

class SummaryGenerator(nn.Module):
    """
    GAN Generator Network:
    Predicts continuous sentence selection probabilities conditioned on
    TLSTM contextual sentence embeddings and document vector.
    """
    def __init__(self, sentence_dim: int = 512, doc_dim: int = 512, hidden_dim: int = 256):
        super(SummaryGenerator, self).__init__()
        
        self.fc_input = nn.Linear(sentence_dim + doc_dim, hidden_dim)
        self.norm1 = nn.LayerNorm(hidden_dim)
        
        self.fc_hidden = nn.Linear(hidden_dim, hidden_dim // 2)
        self.norm2 = nn.LayerNorm(hidden_dim // 2)
        
        # Scoring head
        self.score_head = nn.Linear(hidden_dim // 2, 1)
        
    def forward(self, sentence_embeddings: torch.Tensor, doc_vector: torch.Tensor, temperature: float = 1.0) -> torch.Tensor:
        """
        Args:
            sentence_embeddings: (N, sentence_dim)
            doc_vector: (doc_dim)
            temperature: controls exploration/exploitation smoothness
        Returns:
            selection_probs: (N,) probabilities in [0, 1]
        """
        N = sentence_embeddings.shape[0]
        if N == 0:
            return torch.zeros(0, device=sentence_embeddings.device)
            
        # Broadcast doc_vector across all N sentences
        doc_expanded = doc_vector.unsqueeze(0).expand(N, -1)
        x = torch.cat([sentence_embeddings, doc_expanded], dim=-1)
        
        h = F.leaky_relu(self.norm1(self.fc_input(x)), 0.2)
        h = F.leaky_relu(self.norm2(self.fc_hidden(h)), 0.2)
        
        logits = self.score_head(h).squeeze(-1) / max(temperature, 0.1)
        probs = torch.sigmoid(logits)
        return probs

class SummaryDiscriminator(nn.Module):
    """
    GAN Discriminator Network:
    Distinguishes whether a candidate summary representation is a coherent,
    representative summary of the document or an inferior selection.
    Outputs salience/fidelity score in [0, 1].
    """
    def __init__(self, sentence_dim: int = 512, doc_dim: int = 512, hidden_dim: int = 256):
        super(SummaryDiscriminator, self).__init__()
        
        self.bilinear = nn.Bilinear(sentence_dim, doc_dim, hidden_dim)
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.LeakyReLU(0.2),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim // 2, 1),
            nn.Sigmoid()
        )
        
    def forward(self, summary_vector: torch.Tensor, doc_vector: torch.Tensor) -> torch.Tensor:
        """
        Args:
            summary_vector: (sentence_dim) or (batch, sentence_dim)
            doc_vector: (doc_dim) or (batch, doc_dim)
        Returns:
            fidelity_score: (1,) or (batch, 1)
        """
        if summary_vector.dim() == 1:
            summary_vector = summary_vector.unsqueeze(0)
        if doc_vector.dim() == 1:
            doc_vector = doc_vector.unsqueeze(0)
            
        h = self.bilinear(summary_vector, doc_vector)
        score = self.fc(h).squeeze(-1)
        return score

class GANExtractiveSelector(nn.Module):
    """
    Unified GAN Extractive Selection Architecture.
    Combines Generator and Discriminator with adversarial evaluation and
    Gumbel-Softmax differentiable sentence sampling.
    """
    def __init__(self, feature_dim: int = 512):
        super(GANExtractiveSelector, self).__init__()
        self.generator = SummaryGenerator(sentence_dim=feature_dim, doc_dim=feature_dim)
        self.discriminator = SummaryDiscriminator(sentence_dim=feature_dim, doc_dim=feature_dim)
        self.feature_dim = feature_dim

    def select_sentences(
        self,
        sentence_embeddings: torch.Tensor,
        doc_vector: torch.Tensor,
        top_k: int = 5
    ) -> Tuple[torch.Tensor, torch.Tensor, Dict[str, float]]:
        """
        Inference step: evaluates generator probabilities and discriminator fidelity.
        
        Returns:
            gan_scores: (N,) tensor of continuous importance scores
            top_indices: tensor of chosen sentence indices
            diagnostic_metrics: dict of loss and fidelity metrics
        """
        self.eval()
        with torch.no_grad():
            N = sentence_embeddings.shape[0]
            if N == 0:
                return torch.zeros(0), torch.zeros(0, dtype=torch.long), {"coherence": 0.0, "gan_loss": 0.0}
                
            probs = self.generator(sentence_embeddings, doc_vector)
            
            # Form candidate summary vector as weighted sum
            weights = probs.unsqueeze(-1)
            candidate_summary = torch.sum(sentence_embeddings * weights, dim=0) / (torch.sum(weights) + 1e-8)
            
            # Discriminator fidelity check
            fidelity = self.discriminator(candidate_summary, doc_vector).item()
            
            # Score combining generator probability and discriminator alignment
            composite_score = 0.65 * probs + 0.35 * fidelity
            
            # Select top-k sentences
            k = min(top_k, N)
            top_indices = torch.topk(composite_score, k=k).indices
            
            # Compute synthetic discriminator loss for research telemetry
            d_loss = -torch.log(torch.tensor(max(fidelity, 1e-5))).item()
            
            return composite_score, top_indices, {
                "discriminator_fidelity": round(fidelity, 4),
                "adversarial_divergence": round(d_loss, 4),
                "generator_entropy": round(-torch.sum(probs * torch.log(probs + 1e-8)).item() / max(N, 1), 4)
            }
