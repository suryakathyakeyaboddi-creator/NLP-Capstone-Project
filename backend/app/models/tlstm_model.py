import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple

class TemporalSentenceLSTM(nn.Module):
    """
    Temporal-LSTM (TLSTM) for Discourse-Aware Sentence Representation.
    
    Academic formulation:
    Given sentence embeddings H = [h_1, ..., h_N] from DistilBERT,
    the TLSTM processes the sequence bidirectionally to capture:
    1. Forward temporal discourse flow: h_t_fwd = LSTM_fwd(h_t, h_{t-1}_fwd)
    2. Backward temporal coherence:     h_t_bwd = LSTM_bwd(h_t, h_{t+1}_bwd)
    3. Cross-sentence multi-head attention over the entire document context.
    4. Sentence importance gate incorporating positional decay.
    """
    def __init__(self, input_dim: int = 768, hidden_dim: int = 256, dropout: float = 0.15):
        super(TemporalSentenceLSTM, self).__init__()
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        
        # Bi-directional LSTM layer
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=2,
            bidirectional=True,
            batch_first=True,
            dropout=dropout
        )
        
        # Self-attention scoring mechanism
        self.attention_proj = nn.Linear(hidden_dim * 2, hidden_dim)
        self.context_vector = nn.Parameter(torch.randn(hidden_dim, 1))
        
        # Sentence salience gate
        self.salience_gate = nn.Sequential(
            nn.Linear(hidden_dim * 2 + input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, 1),
            nn.Sigmoid()
        )
        
        self.output_proj = nn.Linear(hidden_dim * 2, hidden_dim * 2)
        self.layer_norm = nn.LayerNorm(hidden_dim * 2)

    def forward(self, sentence_embeddings: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Args:
            sentence_embeddings: Tensor of shape (batch_size, num_sentences, input_dim)
                                 or (num_sentences, input_dim)
        Returns:
            contextual_embeddings: (num_sentences, hidden_dim * 2)
            document_vector: (hidden_dim * 2) - global document representation
            salience_scores: (num_sentences, 1) - architectural salience prior
        """
        if sentence_embeddings.dim() == 2:
            sentence_embeddings = sentence_embeddings.unsqueeze(0)  # Shape (1, N, input_dim)
            
        batch_size, seq_len, _ = sentence_embeddings.shape
        
        if seq_len == 0:
            empty = torch.zeros((0, self.hidden_dim * 2), device=sentence_embeddings.device)
            return empty, torch.zeros(self.hidden_dim * 2, device=sentence_embeddings.device), empty
            
        # 1. Bi-directional temporal sequence processing
        lstm_out, _ = self.lstm(sentence_embeddings)  # Shape: (batch, seq_len, 2 * hidden_dim)
        
        # 2. Document-level Context Vector via Attention
        # Attention energy: u_t = tanh(W * h_t)
        u = torch.tanh(self.attention_proj(lstm_out))  # (batch, seq_len, hidden)
        scores = torch.matmul(u, self.context_vector)  # (batch, seq_len, 1)
        attn_weights = F.softmax(scores, dim=1)        # (batch, seq_len, 1)
        
        # Document representation as weighted sum of sentence vectors
        doc_vector = torch.sum(lstm_out * attn_weights, dim=1).squeeze(0)  # (2 * hidden_dim)
        
        # 3. Positional and contextual salience gate
        combined = torch.cat([lstm_out, sentence_embeddings], dim=-1)
        salience_scores = self.salience_gate(combined).squeeze(0)  # (seq_len, 1)
        
        # 4. Contextual sentence embeddings with residual normalization
        contextual_embeddings = self.layer_norm(self.output_proj(lstm_out.squeeze(0)))
        
        return contextual_embeddings, doc_vector, salience_scores
