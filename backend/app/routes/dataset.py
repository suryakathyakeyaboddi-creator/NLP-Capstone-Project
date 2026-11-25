from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ..services.dataset_service import DatasetService
from ..database.db import (
    save_dataset_record, 
    list_datasets, 
    get_dataset_by_id, 
    update_dataset_split
)

router = APIRouter(prefix="/dataset", tags=["Dataset Management"])
dataset_service = DatasetService()

class SplitRequest(BaseModel):
    dataset_id: str
    train_ratio: Optional[float] = 0.70
    val_ratio: Optional[float] = 0.15
    test_ratio: Optional[float] = 0.15
    random_seed: Optional[int] = 42
    text_column: Optional[str] = None
    summary_column: Optional[str] = None

class CleanRequest(BaseModel):
    dataset_id: str
    drop_duplicates: Optional[bool] = True
    drop_missing_in_text: Optional[bool] = True
    min_word_count: Optional[int] = 5

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    filename = file.filename or "uploaded_dataset.csv"
    contents = await file.read()
    
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        dataset_meta = dataset_service.save_and_ingest(contents, filename)
        save_dataset_record(dataset_meta)
        return dataset_meta
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse dataset: {str(e)}")

@router.get("/list")
async def get_all_datasets():
    try:
        return list_datasets()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/preview")
async def preview_dataset(
    dataset_id: str = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=5, le=100)
):
    dataset_meta = get_dataset_by_id(dataset_id)
    if not dataset_meta:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    try:
        preview = dataset_service.get_preview(dataset_meta, page=page, page_size=page_size)
        return preview
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error previewing dataset: {str(e)}")

@router.post("/split")
async def split_dataset_endpoint(req: SplitRequest):
    dataset_meta = get_dataset_by_id(req.dataset_id)
    if not dataset_meta:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    try:
        split_result = dataset_service.split_dataset(
            dataset_meta=dataset_meta,
            train_ratio=req.train_ratio or 0.70,
            val_ratio=req.val_ratio or 0.15,
            test_ratio=req.test_ratio or 0.15,
            random_seed=req.random_seed or 42,
            text_column=req.text_column,
            summary_column=req.summary_column
        )
        
        # Persist split in DB
        update_dataset_split(
            dataset_id=req.dataset_id,
            train_idx=split_result["train_indices"],
            val_idx=split_result["val_indices"],
            test_idx=split_result["test_indices"],
            ratios=split_result["ratios"],
            seed=split_result["random_seed"],
            text_col=split_result["text_column"],
            summ_col=split_result["summary_column"]
        )

        return split_result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Dataset splitting failed: {str(e)}")

@router.post("/clean")
async def clean_dataset_endpoint(req: CleanRequest):
    dataset_meta = get_dataset_by_id(req.dataset_id)
    if not dataset_meta:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    try:
        clean_result = dataset_service.clean_dataset(
            dataset_meta=dataset_meta,
            drop_duplicates=req.drop_duplicates if req.drop_duplicates is not None else True,
            drop_missing_in_text=req.drop_missing_in_text if req.drop_missing_in_text is not None else True,
            min_word_count=req.min_word_count or 5
        )
        save_dataset_record(clean_result["dataset_meta"])
        return clean_result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cleaning failed: {str(e)}")
