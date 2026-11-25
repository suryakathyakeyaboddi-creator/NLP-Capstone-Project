import os
import torch
import requests
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/config", tags=["Configuration & Models Status"])

class TestConnectionRequest(BaseModel):
    api_url: str
    api_key: Optional[str] = None
    model_name: Optional[str] = "qwen2.5:7b"

@router.get("/status")
async def get_system_model_status():
    from ..services.trainer import ModelTrainerService
    device_name = "cuda" if torch.cuda.is_available() else "cpu"
    trainer = ModelTrainerService()
    training_status = trainer.get_training_status()
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    
    return {
        "status": "online",
        "device": device_name,
        "torch_version": torch.__version__,
        "groq_configured": bool(groq_key),
        "groq_model": os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
        "groq_fallback_model": os.getenv("GROQ_FALLBACK_MODEL", "llama-3.3-70b-versatile"),
        "checkpoints_present": training_status["checkpoints_present"],
        "is_trained": training_status["is_trained"],
        "pipeline_modules": {
            "module_1_extractive": {
                "name": "GAN + TLSTM Extractive Selector with RL",
                "encoder": "DistilBERT (768-dim, distilbert-base-uncased)",
                "sequence_model": "Bi-directional Temporal-LSTM (TLSTM, 2-layer, 512-dim)",
                "gan_generator": "Residual MLP with LayerNorm & Temperature Scaling",
                "gan_discriminator": "Bilinear Document Salience Scorer",
                "rl_policy": "REINFORCE Contextual Agent with Moving Average Baseline",
                "checkpoints_loaded": training_status["checkpoints_present"],
                "ready": True
            },
            "module_2_abstractive": {
                "name": "LLM-Based Abstractive Generation & Redundancy Filter",
                "redundancy_model": "all-MiniLM-L6-v2 (sentence-transformers)",
                "llm_provider": "Groq API (openai/gpt-oss-120b)" if groq_key else "Discourse Synthesizer (Demo Mode)",
                "supported_llms": ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile", "qwen2.5", "llama3"],
                "groq_active": bool(groq_key),
                "ready": True
            },
            "module_3_verification": {
                "name": "Factual Consistency Verification & Grounded Correction",
                "nli_model": "cross-encoder/nli-deberta-v3-base",
                "claim_decomposition": "Syntactic Clause & Dependency Segmentation",
                "correction_engine": "Groq-constrained rewriting" if groq_key else "Evidence-grounded refiner",
                "scoring_formula": "[(N_supported + 0.5 * N_uncertain) / N_total] * 100%",
                "ready": True
            }
        },
        "default_llm_api": os.getenv("LLM_API_URL", "http://localhost:11434/v1")
    }

@router.get("/training-status")
async def get_model_training_status():
    from ..services.trainer import ModelTrainerService
    return ModelTrainerService().get_training_status()

@router.post("/train-models")
async def trigger_model_training(epochs: int = 15):
    from ..services.trainer import ModelTrainerService
    trainer = ModelTrainerService()
    report = trainer.run_training(num_epochs=epochs)
    return report

@router.post("/test-llm")
async def test_llm_connection(req: TestConnectionRequest):
    headers = {"Content-Type": "application/json"}
    if req.api_key:
        headers["Authorization"] = f"Bearer {req.api_key}"
        
    endpoint = req.api_url.rstrip("/")
    if not endpoint.endswith("/chat/completions"):
        endpoint = f"{endpoint}/chat/completions"
        
    payload = {
        "model": req.model_name or "llama3:8b",
        "messages": [{"role": "user", "content": "Respond with 'NeuroSum LLM Connection Verified.'"}],
        "max_tokens": 15
    }
    
    try:
        res = requests.post(endpoint, json=payload, headers=headers, timeout=5)
        if res.status_code == 200:
            return {"success": True, "message": "Connection established successfully!", "response": res.json()}
        return {"success": False, "status_code": res.status_code, "error": res.text}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/sample-documents")
async def get_sample_research_documents():
    return []
