from fastapi import APIRouter, HTTPException
from ..schemas.request import ExtractiveOnlyRequest
from ..services.sentence_selection import SentenceSelectionService

router = APIRouter(prefix="/extractive", tags=["Module 1: Extractive"])
sentence_selector = SentenceSelectionService()

@router.post("")
async def run_extractive_module_only(request: ExtractiveOnlyRequest):
    try:
        result = sentence_selector.process(
            document_text=request.text,
            max_sentences=request.max_sentences
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
