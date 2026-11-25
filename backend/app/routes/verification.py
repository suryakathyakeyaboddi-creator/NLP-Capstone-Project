from fastapi import APIRouter, HTTPException
from ..schemas.request import VerificationOnlyRequest
from ..services.factual_verification import FactualVerificationService

router = APIRouter(prefix="/verification", tags=["Module 3: Verification"])
verifier = FactualVerificationService()

@router.post("")
async def run_verification_module_only(request: VerificationOnlyRequest):
    try:
        result = verifier.verify_and_optimize(
            original_document=request.original_text,
            abstractive_summary=request.summary_text,
            enable_correction=request.enable_correction if request.enable_correction is not None else True
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
