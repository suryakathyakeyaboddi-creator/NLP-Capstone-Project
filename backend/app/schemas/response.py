from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class SentenceScoreItem(BaseModel):
    index: int
    text: str
    importance_score: float
    distilbert_norm: float
    tlstm_salience: float
    gan_score: float
    rl_reward: float
    selected: bool
    rank: int

class RedundancyItem(BaseModel):
    sentence_idx_a: int
    sentence_idx_b: int
    text_a: str
    text_b: str
    similarity: float
    is_redundant: bool
    action: str  # "retained" or "filtered"

class ClaimVerificationItem(BaseModel):
    claim_id: int
    claim_text: str
    status: str  # "Supported", "Unsupported", "Uncertain"
    entailment_score: float
    evidence_sentence_index: int
    evidence_text: str
    explanation: str
    suggested_correction: Optional[str] = None
    was_corrected: bool = False

class RougeMetrics(BaseModel):
    rouge1: float
    rouge2: float
    rougeL: float
    precision_r1: Optional[float] = 0.0
    recall_r1: Optional[float] = 0.0

class EvaluationMetrics(BaseModel):
    rouge: RougeMetrics
    semantic_similarity: float
    bertscore_f1: Optional[float] = None
    compression_ratio: float
    factual_consistency_score: float
    supported_claims_count: int
    total_claims_count: int
    redundancy_reduction_rate: float
    word_count_original: int
    word_count_extractive: int
    word_count_abstractive: int
    word_count_final: int
    execution_time_ms: Dict[str, float]

class PipelineStageStatus(BaseModel):
    stage: str
    status: str  # "completed", "running", "failed"
    duration_ms: float
    details: Dict[str, Any]

class SummarizeResponse(BaseModel):
    id: str
    title: str
    original_text: str
    extractive_summary: str
    abstractive_summary: str
    final_summary: str
    extractive_sentences: List[SentenceScoreItem]
    redundancy_analysis: Dict[str, Any]
    verification_claims: List[ClaimVerificationItem]
    metrics: EvaluationMetrics
    pipeline_stages: List[PipelineStageStatus]
    model_metadata: Dict[str, Any]
