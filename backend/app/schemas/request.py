from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=20, description="Input document to be summarized")
    title: Optional[str] = Field("Research Document", description="Optional document title")
    summary_length: Optional[str] = Field("medium", description="Desired length: 'short', 'medium', or 'long'")
    max_sentences: Optional[int] = Field(5, ge=1, le=25, description="Max extractive sentences to select")
    llm_provider: Optional[str] = Field("auto", description="LLM provider: 'auto', 'distilbart', 'qwen2', 'llama3', 'openai_compatible'")
    redundancy_threshold: Optional[float] = Field(0.72, ge=0.4, le=0.95, description="Cosine similarity threshold for redundancy pruning")
    enable_correction: Optional[bool] = Field(True, description="Enable automatic factual contradiction correction in Module 3")
    custom_api_url: Optional[str] = Field(None, description="Custom LLM API URL (Ollama, vLLM, OpenAI format)")
    custom_api_key: Optional[str] = Field(None, description="Custom API key if required")
    model_name: Optional[str] = Field(None, description="Target model name for API (e.g., qwen2.5-7b-instruct, llama-3-8b)")

class ExtractiveOnlyRequest(BaseModel):
    text: str = Field(..., min_length=20)
    max_sentences: Optional[int] = Field(5, ge=1, le=25)
    gan_epochs_warmup: Optional[int] = Field(1, ge=0, le=10)

class AbstractiveOnlyRequest(BaseModel):
    extracted_sentences: List[str] = Field(..., min_length=1)
    original_text: Optional[str] = None
    redundancy_threshold: Optional[float] = Field(0.72, ge=0.4, le=0.95)
    summary_length: Optional[str] = Field("medium")
    llm_provider: Optional[str] = Field("auto")
    custom_api_url: Optional[str] = None
    custom_api_key: Optional[str] = None

class VerificationOnlyRequest(BaseModel):
    original_text: str = Field(..., min_length=20)
    summary_text: str = Field(..., min_length=10)
    enable_correction: Optional[bool] = Field(True)

class ModelSettingsUpdateRequest(BaseModel):
    active_llm: str
    custom_api_url: Optional[str] = None
    custom_api_key: Optional[str] = None
    temperature: Optional[float] = 0.3
    redundancy_threshold: Optional[float] = 0.72
