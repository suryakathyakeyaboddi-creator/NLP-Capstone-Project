import uuid
import threading
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ..services.dataset_service import DatasetService
from ..services.benchmark_service import BenchmarkService
from ..database.db import get_dataset_by_id, get_benchmark_run, list_experiments

router = APIRouter(prefix="/benchmark", tags=["Model Benchmarking"])

dataset_service = DatasetService()
benchmark_service = BenchmarkService()

class BenchmarkRunRequest(BaseModel):
    dataset_id: str
    experiment_name: Optional[str] = "Model Comparison Experiment"
    model_version: Optional[str] = "v1.0-hybrid"
    llm_provider: Optional[str] = "auto"
    custom_api_url: Optional[str] = None
    custom_api_key: Optional[str] = None
    max_test_samples: Optional[int] = 10  # Reasonable default for interactive research evaluation

def execute_benchmark_task(
    run_id: str,
    test_records: List[Dict[str, Any]],
    dataset_id: str,
    dataset_name: str,
    experiment_name: str,
    model_version: str,
    llm_provider: str,
    custom_url: Optional[str],
    custom_key: Optional[str]
):
    try:
        benchmark_service.run_benchmark(
            test_records=test_records,
            dataset_id=dataset_id,
            dataset_name=dataset_name,
            experiment_name=experiment_name,
            model_version=model_version,
            llm_provider=llm_provider,
            custom_api_url=custom_url,
            custom_api_key=custom_key,
            run_id=run_id
        )
    except Exception as e:
        print(f"Benchmark run {run_id} error: {e}")

@router.post("/run")
async def start_benchmark(req: BenchmarkRunRequest, background_tasks: BackgroundTasks):
    dataset_meta = get_dataset_by_id(req.dataset_id)
    if not dataset_meta:
        raise HTTPException(status_code=404, detail="Target dataset not found.")

    test_records = dataset_service.get_test_records(dataset_meta, max_samples=req.max_test_samples or 10)
    if not test_records:
        raise HTTPException(status_code=400, detail="No valid test records found in dataset. Please configure dataset columns or split first.")

    run_id = str(uuid.uuid4())
    
    # If small test set (<= 3), we can run synchronously for instant results; otherwise run in background
    if len(test_records) <= 3:
        try:
            results = benchmark_service.run_benchmark(
                test_records=test_records,
                dataset_id=req.dataset_id,
                dataset_name=dataset_meta["original_name"],
                experiment_name=req.experiment_name or "Model Comparison Experiment",
                model_version=req.model_version or "v1.0-hybrid",
                llm_provider=req.llm_provider or "auto",
                custom_api_url=req.custom_api_url,
                custom_api_key=req.custom_api_key,
                run_id=run_id
            )
            return {
                "run_id": run_id,
                "status": "completed",
                "progress_pct": 100.0,
                "results": results
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Benchmarking error: {str(e)}")

    # For larger batches, trigger in background thread
    threading.Thread(
        target=execute_benchmark_task,
        args=(
            run_id,
            test_records,
            req.dataset_id,
            dataset_meta["original_name"],
            req.experiment_name or "Model Comparison Experiment",
            req.model_version or "v1.0-hybrid",
            req.llm_provider or "auto",
            req.custom_api_url,
            req.custom_api_key
        ),
        daemon=True
    ).start()

    return {
        "run_id": run_id,
        "status": "running",
        "total_test_samples": len(test_records),
        "message": f"Benchmarking initiated across {len(test_records)} test documents."
    }

@router.get("/status/{run_id}")
async def get_benchmark_status(run_id: str):
    task = get_benchmark_run(run_id)
    if not task:
        raise HTTPException(status_code=404, detail="Benchmark run ID not found.")
    return task

@router.get("/results")
async def get_benchmark_results(run_id: Optional[str] = Query(None)):
    if run_id:
        task = get_benchmark_run(run_id)
        if not task:
            raise HTTPException(status_code=404, detail="Benchmark run ID not found.")
        return task.get("results") or task

    # Otherwise return latest experiment
    experiments = list_experiments(limit=1)
    if not experiments:
        return {"message": "No benchmark experiments executed yet."}
    from ..database.db import get_experiment_by_id
    latest = get_experiment_by_id(experiments[0]["id"])
    return latest
