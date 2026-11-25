import uuid
import time
from fastapi import APIRouter, HTTPException
from ..schemas.request import SummarizeRequest
from ..schemas.response import SummarizeResponse, EvaluationMetrics, PipelineStageStatus
from ..services.sentence_selection import SentenceSelectionService
from ..services.summary_generator import AbstractiveGeneratorService
from ..services.factual_verification import FactualVerificationService
from ..services.evaluation import ResearchEvaluationService
from ..database.db import save_summarization_record

router = APIRouter(prefix="/summarize", tags=["Summarization Pipeline"])

sentence_selector = SentenceSelectionService()
abstractive_generator = AbstractiveGeneratorService()
verifier = FactualVerificationService()
evaluator = ResearchEvaluationService()

@router.post("", response_model=SummarizeResponse)
async def run_hybrid_summarization_pipeline(request: SummarizeRequest):
    record_id = str(uuid.uuid4())
    pipeline_stages = []
    
    total_start = time.time()
    
    # -------------------------------------------------------------
    # STAGE 1: GAN-Based Extractive Summarization + RL
    # -------------------------------------------------------------
    s1_start = time.time()
    try:
        extractive_res = sentence_selector.process(
            document_text=request.text,
            max_sentences=request.max_sentences
        )
        s1_duration = (time.time() - s1_start) * 1000
        pipeline_stages.append(PipelineStageStatus(
            stage="GAN-Based Extractive Summarization",
            status="completed",
            duration_ms=round(s1_duration, 2),
            details={
                "selected_count": len(extractive_res["selected_sentences"]),
                "total_candidate_sentences": len(extractive_res["all_sentences"]),
                "telemetry": extractive_res["telemetry"]
            }
        ))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Module 1 (Extractive) failed: {str(e)}")

    # -------------------------------------------------------------
    # STAGE 2: LLM-Based Abstractive Generation + Redundancy Filter
    # -------------------------------------------------------------
    s2_start = time.time()
    try:
        abstractive_res = abstractive_generator.process(
            extracted_sentences=extractive_res["selected_sentences"],
            original_document=request.text,
            summary_length=request.summary_length,
            redundancy_threshold=request.redundancy_threshold,
            llm_provider=request.llm_provider,
            custom_api_url=request.custom_api_url,
            custom_api_key=request.custom_api_key,
            model_name=request.model_name
        )
        s2_duration = (time.time() - s2_start) * 1000
        pipeline_stages.append(PipelineStageStatus(
            stage="LLM Abstractive Generation & Redundancy Filter",
            status="completed",
            duration_ms=round(s2_duration, 2),
            details={
                "provider": abstractive_res["llm_metadata"]["provider_used"],
                "filtered_count": len(abstractive_res["redundancy_analysis"]["removed_sentences"]),
                "redundancy_reduction_rate": abstractive_res["redundancy_analysis"]["redundancy_reduction_rate"]
            }
        ))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Module 2 (Abstractive) failed: {str(e)}")

    # -------------------------------------------------------------
    # STAGE 3: Factual Consistency Verification & Optimization
    # -------------------------------------------------------------
    s3_start = time.time()
    try:
        verification_res = verifier.verify_and_optimize(
            original_document=request.text,
            abstractive_summary=abstractive_res["abstractive_summary"],
            enable_correction=request.enable_correction
        )
        s3_duration = (time.time() - s3_start) * 1000
        pipeline_stages.append(PipelineStageStatus(
            stage="Factual Consistency Verification & Correction",
            status="completed",
            duration_ms=round(s3_duration, 2),
            details={
                "factual_consistency_score": verification_res["factual_consistency_score"],
                "supported_claims": verification_res["supported_count"],
                "unsupported_claims": verification_res["unsupported_count"],
                "uncertain_claims": verification_res["uncertain_count"],
                "corrections_applied": verification_res["has_corrections"]
            }
        ))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Module 3 (Verification) failed: {str(e)}")

    # -------------------------------------------------------------
    # METRICS EVALUATION & RECORDING
    # -------------------------------------------------------------
    eval_res = evaluator.evaluate(
        original_text=request.text,
        summary_text=verification_res["final_summary"]
    )
    
    total_time = (time.time() - total_start) * 1000
    
    metrics = EvaluationMetrics(
        rouge=eval_res["rouge"],
        semantic_similarity=eval_res["semantic_similarity"],
        bertscore_f1=eval_res["bertscore_f1"],
        compression_ratio=eval_res["compression_ratio"],
        factual_consistency_score=verification_res["factual_consistency_score"],
        supported_claims_count=verification_res["supported_count"],
        total_claims_count=verification_res["total_claims"],
        redundancy_reduction_rate=abstractive_res["redundancy_analysis"]["redundancy_reduction_rate"],
        word_count_original=eval_res["word_count_original"],
        word_count_extractive=len(extractive_res["extractive_summary"].split()),
        word_count_abstractive=len(abstractive_res["abstractive_summary"].split()),
        word_count_final=eval_res["word_count_summary"],
        execution_time_ms={
            "module1_extractive": round(s1_duration, 2),
            "module2_abstractive": round(s2_duration, 2),
            "module3_verification": round(s3_duration, 2),
            "total_pipeline": round(total_time, 2)
        }
    )

    # Save to SQLite database
    record_dict = {
        "id": record_id,
        "title": request.title or "Research Document",
        "original_text": request.text,
        "word_count": eval_res["word_count_original"],
        "extractive_summary": extractive_res["extractive_summary"],
        "abstractive_summary": abstractive_res["abstractive_summary"],
        "final_summary": verification_res["final_summary"],
        "extractive_sentences": extractive_res["all_sentences"],
        "redundancy_analysis": abstractive_res["redundancy_analysis"],
        "verification_claims": verification_res["claims"],
        "metrics": metrics.dict(),
        "model_settings": {
            "summary_length": request.summary_length,
            "max_sentences": request.max_sentences,
            "llm_provider": request.llm_provider,
            "redundancy_threshold": request.redundancy_threshold,
            "enable_correction": request.enable_correction
        }
    }
    try:
        save_summarization_record(record_dict)
    except Exception as e:
        print(f"Warning: Failed to save record to DB: {e}")

    return SummarizeResponse(
        id=record_id,
        title=request.title or "Research Document",
        original_text=request.text,
        extractive_summary=extractive_res["extractive_summary"],
        abstractive_summary=abstractive_res["abstractive_summary"],
        final_summary=verification_res["final_summary"],
        extractive_sentences=extractive_res["all_sentences"],
        redundancy_analysis=abstractive_res["redundancy_analysis"],
        verification_claims=verification_res["claims"],
        metrics=metrics,
        pipeline_stages=pipeline_stages,
        model_metadata={
            "llm_provider": abstractive_res["llm_metadata"]["provider_used"],
            "is_real_llm": abstractive_res["llm_metadata"]["is_real_llm"],
            "distilbert_weights_real": extractive_res["telemetry"]["is_real_weights"]
        }
    )
