from fastapi import APIRouter, HTTPException
from ..schemas.request import AbstractiveOnlyRequest
from ..services.summary_generator import AbstractiveGeneratorService

router = APIRouter(prefix="/abstractive", tags=["Module 2: Abstractive"])
abstractive_generator = AbstractiveGeneratorService()

@router.post("")
async def run_abstractive_module_only(request: AbstractiveOnlyRequest):
    try:
        result = abstractive_generator.process(
            extracted_sentences=request.extracted_sentences,
            original_document=request.original_text,
            summary_length=request.summary_length or "medium",
            redundancy_threshold=request.redundancy_threshold or 0.72,
            llm_provider=request.llm_provider or "auto",
            custom_api_url=request.custom_api_url,
            custom_api_key=request.custom_api_key
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
