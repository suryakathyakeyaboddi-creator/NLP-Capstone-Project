from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, HTTPException
from ..services.evaluation import ResearchEvaluationService

router = APIRouter(prefix="/evaluation", tags=["Evaluation Metrics"])
evaluator = ResearchEvaluationService()

class EvalRequest(BaseModel):
    original_text: str
    summary_text: str
    reference_summary: Optional[str] = None

@router.post("")
async def evaluate_summary(request: EvalRequest):
    try:
        results = evaluator.evaluate(
            original_text=request.original_text,
            summary_text=request.summary_text,
            reference_summary=request.reference_summary
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
