from fastapi import APIRouter, HTTPException
from ..database.db import get_recent_summaries, get_summary_by_id, get_dashboard_analytics

router = APIRouter(prefix="/history", tags=["History & Analytics"])

@router.get("")
async def list_recent_history(limit: int = 20):
    try:
        return get_recent_summaries(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics")
async def get_analytics_metrics():
    try:
        return get_dashboard_analytics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{record_id}")
async def get_history_detail(record_id: str):
    record = get_summary_by_id(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Summarization record not found")
    return record
