from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ..database.db import list_experiments, get_experiment_by_id

router = APIRouter(prefix="/experiments", tags=["Experiment History & Version Comparison"])

class CompareExperimentsRequest(BaseModel):
    experiment_ids: List[str]

@router.get("/history")
async def get_experiments_history(limit: int = Query(50, ge=1, le=100)):
    try:
        return list_experiments(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{experiment_id}")
async def get_single_experiment(experiment_id: str):
    exp = get_experiment_by_id(experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    return exp

@router.post("/compare")
async def compare_experiments(req: CompareExperimentsRequest):
    if len(req.experiment_ids) < 2:
        raise HTTPException(status_code=400, detail="Please select at least two experiments to compare.")

    experiments = []
    for exp_id in req.experiment_ids:
        exp = get_experiment_by_id(exp_id)
        if exp:
            experiments.append(exp)

    if len(experiments) < 2:
        raise HTTPException(status_code=404, detail="Could not retrieve the specified experiments for comparison.")

    # Calculate version-to-version diffs between baseline (first) and subsequent experiments
    baseline = experiments[0]
    comparisons = []

    for exp in experiments:
        sm = exp.get("summary_metrics", {})
        mC = sm.get("model_c_proposed_hybrid", {})
        
        comparisons.append({
            "id": exp["id"],
            "name": exp["name"],
            "model_version": exp["model_version"],
            "dataset_name": exp["dataset_name"],
            "llm_provider": exp["llm_provider"],
            "created_at": exp["created_at"],
            "metrics": {
                "rouge1": mC.get("rouge1", 0),
                "rouge2": mC.get("rouge2", 0),
                "rougeL": mC.get("rougeL", 0),
                "bertscore": mC.get("bertscore", 0),
                "factual_consistency": mC.get("factual_consistency", 0),
                "redundancy_pct": mC.get("redundancy_pct", 0),
                "avg_processing_time_ms": mC.get("avg_processing_time_ms", 0)
            },
            "config": exp.get("config", {})
        })

    # Relative diffs compared to the first experiment
    base_m = comparisons[0]["metrics"]
    diffs = []
    for idx, c in enumerate(comparisons):
        if idx == 0:
            diffs.append({
                "experiment_id": c["id"],
                "is_baseline": True,
                "relative_diffs": {}
            })
        else:
            rel = {}
            for k, val in c["metrics"].items():
                base_val = base_m.get(k, 0)
                diff = val - base_val
                pct = round((diff / max(abs(base_val), 1e-6)) * 100.0, 2)
                rel[k] = {
                    "absolute_diff": round(diff, 3),
                    "percentage_change": pct,
                    "trend": "improved" if diff > 0 and k != "redundancy_pct" and k != "avg_processing_time_ms" else ("improved" if diff < 0 and (k == "redundancy_pct" or k == "avg_processing_time_ms") else "degraded")
                }
            diffs.append({
                "experiment_id": c["id"],
                "is_baseline": False,
                "relative_diffs": rel
            })

    return {
        "experiments": comparisons,
        "diff_analysis": diffs,
        "best_overall": max(comparisons, key=lambda x: x["metrics"]["rougeL"])
    }
