import time
from typing import List, Dict, Any, Optional
from .redundancy_filter import SemanticRedundancyFilter
from ..models.llm_model import LLMAbstractiveGenerator

class AbstractiveGeneratorService:
    """
    MODULE 2: LLM-Based Abstractive Generation with Redundancy Filtering.
    
    Academic Workflow:
    1. Receive extractive summary candidate sentences from Module 1.
    2. Compute dense semantic similarity matrix.
    3. Prune semantically redundant units exceeding threshold tau.
    4. Construct structured, grounding-constrained contextual prompt.
    5. Pass content to LLM (Llama / Qwen / DistilBART / Discourse Synthesizer).
    6. Return fluent, coherent, and concise abstractive summary.
    """
    def __init__(self):
        self.redundancy_filter = SemanticRedundancyFilter()
        self.llm_generator = LLMAbstractiveGenerator()

    def process(
        self,
        extracted_sentences: List[str],
        original_document: Optional[str] = None,
        summary_length: str = "medium",
        redundancy_threshold: float = 0.72,
        llm_provider: str = "auto",
        custom_api_url: Optional[str] = None,
        custom_api_key: Optional[str] = None,
        model_name: Optional[str] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        
        # 1. Redundancy Filtering
        t0 = time.time()
        redundancy_res = self.redundancy_filter.filter(
            extracted_sentences,
            threshold=redundancy_threshold
        )
        filter_time = (time.time() - t0) * 1000
        
        cleaned_sentences = redundancy_res["cleaned_sentences"]
        if not cleaned_sentences:
            cleaned_sentences = extracted_sentences  # Fallback if over-pruned
            
        # 2. LLM Abstractive Synthesis
        t1 = time.time()
        llm_res = self.llm_generator.generate(
            cleaned_sentences=cleaned_sentences,
            original_document=original_document,
            summary_length=summary_length,
            provider_override=llm_provider,
            custom_url=custom_api_url,
            custom_key=custom_api_key,
            model_name=model_name
        )
        generation_time = (time.time() - t1) * 1000
        
        total_time = (time.time() - start_time) * 1000
        
        extractive_text = " ".join(extracted_sentences)
        extractive_words = len(extractive_text.split())
        abstractive_text = llm_res["summary_text"]
        abstractive_words = len(abstractive_text.split())
        
        return {
            "abstractive_summary": abstractive_text,
            "redundancy_analysis": redundancy_res,
            "llm_metadata": {
                "provider_used": llm_res["provider_used"],
                "is_real_llm": llm_res["is_real_llm"],
                "prompt_used": llm_res["prompt"],
                "token_stats": llm_res.get("token_stats", {}),
                "generation_time_ms": round(generation_time, 2),
                "filter_time_ms": round(filter_time, 2)
            },
            "word_count_comparison": {
                "extractive_word_count": extractive_words,
                "abstractive_word_count": abstractive_words,
                "compression_ratio_relative": round((1.0 - abstractive_words / max(extractive_words, 1)) * 100.0, 1)
            },
            "execution_time_ms": round(total_time, 2)
        }
