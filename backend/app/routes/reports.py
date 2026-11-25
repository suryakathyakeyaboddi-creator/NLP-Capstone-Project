from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from typing import Optional
from ..database.db import get_experiment_by_id, get_dataset_by_id
from ..services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Research Report Generation"])

class ReportGenerateRequest(BaseModel):
    experiment_id: str
    custom_notes: Optional[str] = None

@router.post("/generate")
async def generate_research_report(req: ReportGenerateRequest):
    exp = get_experiment_by_id(req.experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")

    dataset = get_dataset_by_id(exp.get("dataset_id")) if exp.get("dataset_id") else None
    
    report_data = ReportService.generate_report_data(exp, dataset)
    if req.custom_notes:
        report_data["custom_notes"] = req.custom_notes

    return report_data

@router.get("/export/csv/{experiment_id}")
async def export_experiment_csv(experiment_id: str):
    exp = get_experiment_by_id(experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")

    csv_content = ReportService.export_csv_benchmark(exp)
    filename = f"neurosum_experiment_{experiment_id[:8]}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
