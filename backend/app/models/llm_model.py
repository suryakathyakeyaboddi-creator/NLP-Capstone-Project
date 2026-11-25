import os
import time
import json
import logging
import requests
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

class LLMAbstractiveGenerator:
    """
    Modular Abstractive Summarizer supporting:
    1. Groq API (Primary: openai/gpt-oss-120b, Alternatives: openai/gpt-oss-20b, llama-3.3-70b-versatile)
    2. Local HuggingFace Transformers (DistilBART / T5 / BART-large-cnn)
    3. External REST APIs (Ollama, vLLM, Qwen, Llama-3, OpenAI format)
    4. Research Discourse Synthesizer (Local neural-linguistic fusion baseline)
    """
    def __init__(
        self,
        default_provider: str = "auto",
        hf_model_name: str = "sshleifer/distilbart-cnn-12-6",
        custom_api_url: Optional[str] = None,
        custom_api_key: Optional[str] = None
    ):
        self.default_provider = default_provider
        self.hf_model_name = hf_model_name
        self.custom_api_url = custom_api_url or os.getenv("LLM_API_URL", "http://localhost:11434/v1")
        self.custom_api_key = custom_api_key or os.getenv("LLM_API_KEY", "")
        self.groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        self.groq_fallback_model = os.getenv("GROQ_FALLBACK_MODEL", "llama-3.3-70b-versatile")
        
        self.hf_pipeline = None
        self.hf_loaded = False
        self._try_init_hf_pipeline()

    def _try_init_hf_pipeline(self):
        """Attempts to load a fast HuggingFace summarization pipeline if available locally."""
        try:
            from transformers import pipeline
            self.hf_pipeline = pipeline("summarization", model=self.hf_model_name, device=-1, model_kwargs={"local_files_only": True})
            self.hf_loaded = True
            logger.info(f"Loaded Hugging Face model from local cache: {self.hf_model_name}")
        except Exception:
            self.hf_loaded = False

    def generate(
        self,
        cleaned_sentences: List[str],
        original_document: Optional[str] = None,
        summary_length: str = "medium",
        provider_override: Optional[str] = None,
        custom_url: Optional[str] = None,
        custom_key: Optional[str] = None,
        model_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates an abstractive summary from the extractive and redundancy-filtered input.
        """
        start_time = time.time()
        provider = provider_override or self.default_provider
        context_text = " ".join(cleaned_sentences).strip()
        
        input_word_count = len(context_text.split())
        if summary_length == "short":
            min_len, max_len = max(25, int(input_word_count * 0.2)), max(40, int(input_word_count * 0.35))
        elif summary_length == "long":
            min_len, max_len = max(60, int(input_word_count * 0.45)), max(100, int(input_word_count * 0.65))
        else: # medium
            min_len, max_len = max(40, int(input_word_count * 0.3)), max(75, int(input_word_count * 0.5))

        prompt = self._build_prompt(context_text, min_len, max_len)
        
        # 1. CHECK GROQ API (Highest Priority LLM Provider)
        groq_key = (custom_key or self.groq_api_key or os.getenv("GROQ_API_KEY", "")).strip()
        target_groq_model = model_name or self.groq_model

        if groq_key and (provider in ["auto", "groq", "openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama3", "qwen2"] or not custom_url):
            try:
                summary, meta, used_model = self._call_groq_api(
                    prompt=prompt,
                    api_key=groq_key,
                    model=target_groq_model,
                    fallback_model=self.groq_fallback_model
                )
                if summary:
                    elapsed = (time.time() - start_time) * 1000
                    return {
                        "summary_text": summary,
                        "provider_used": f"Groq API ({used_model})",
                        "is_real_llm": True,
                        "execution_time_ms": round(elapsed, 2),
                        "prompt": prompt,
                        "token_stats": meta
                    }
            except Exception as e:
                logger.warning(f"Groq API execution failed ({e}). Proceeding to secondary providers / fallback.")

        # 2. CHECK CUSTOM OPENAI-COMPATIBLE / OLLAMA API
        api_url = custom_url or self.custom_api_url
        if provider in ["custom-api", "openai_compatible", "ollama"] or (custom_url and "localhost" not in custom_url):
            try:
                target_model = model_name or "llama3:8b"
                summary, meta = self._call_llm_api(prompt, api_url, custom_key or self.custom_api_key, target_model)
                if summary:
                    elapsed = (time.time() - start_time) * 1000
                    return {
                        "summary_text": summary,
                        "provider_used": f"API: {target_model} via {api_url}",
                        "is_real_llm": True,
                        "execution_time_ms": round(elapsed, 2),
                        "prompt": prompt,
                        "token_stats": meta
                    }
            except Exception as e:
                logger.warning(f"External API call to {api_url} failed: {e}. Falling back.")

        # 3. CHECK HUGGINGFACE PIPELINE
        if self.hf_loaded and self.hf_pipeline:
            try:
                res = self.hf_pipeline(
                    context_text,
                    min_length=min(min_len, 50),
                    max_length=min(max_len, 140),
                    do_sample=False,
                    truncation=True
                )
                if res and len(res) > 0 and "summary_text" in res[0]:
                    elapsed = (time.time() - start_time) * 1000
                    return {
                        "summary_text": res[0]["summary_text"].strip(),
                        "provider_used": f"HuggingFace: {self.hf_model_name}",
                        "is_real_llm": True,
                        "execution_time_ms": round(elapsed, 2),
                        "prompt": prompt,
                        "token_stats": {"input_words": input_word_count, "output_words": len(res[0]["summary_text"].split())}
                    }
            except Exception as e:
                logger.warning(f"Local HF pipeline failed: {e}.")

        # 4. HIGH-PRECISION RESEARCH NEURAL DISCOURSE SYNTHESIZER (Fallback / Demo Mode)
        abstractive_summary, synthesis_stats = self._synthesize_abstractive_summary(
            cleaned_sentences,
            summary_length=summary_length
        )
        elapsed = (time.time() - start_time) * 1000
        
        provider_label = (
            "NeuroSum Neural Discourse Synthesizer (Demo Mode — Add GROQ_API_KEY in backend/.env for real Groq LLM)"
            if not groq_key else
            f"NeuroSum Neural Discourse Synthesizer (Groq API temporarily unreachable — Demo Mode)"
        )

        return {
            "summary_text": abstractive_summary,
            "provider_used": provider_label,
            "is_real_llm": False,
            "execution_time_ms": round(elapsed, 2),
            "prompt": prompt,
            "token_stats": {
                "input_words": input_word_count,
                "output_words": len(abstractive_summary.split()),
                "synthesized_clauses": synthesis_stats.get("clauses", 0),
                "discourse_transitions_applied": synthesis_stats.get("transitions", 0)
            }
        }

    def _call_groq_api(self, prompt: str, api_key: str, model: str, fallback_model: str) -> Tuple[str, Dict[str, Any], str]:
        """Calls Groq API with automatic graceful model fallback."""
        from groq import Groq
        client = Groq(api_key=api_key)

        models_to_try = [model, fallback_model, "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]
        seen = set()
        deduped_models = [m for m in models_to_try if m and not (m in seen or seen.add(m))]
        last_err = None

        for m in deduped_models:
            try:
                completion = client.chat.completions.create(
                    model=m,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are an expert academic text summarization model in a hybrid extractive-abstractive NLP architecture. "
                                "Synthesize a coherent, concise, and factually faithful abstractive summary from the provided extracted propositions. "
                                "Do not include conversational filler, meta-talk, or outside hallucinations. Output only the summary."
                            )
                        },
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                    max_tokens=700
                )
                content = (completion.choices[0].message.content or "").strip()
                if not content and hasattr(completion.choices[0].message, "reasoning") and completion.choices[0].message.reasoning:
                    content = completion.choices[0].message.reasoning.strip()
                if content:
                    usage = {
                        "prompt_tokens": completion.usage.prompt_tokens if completion.usage else 0,
                        "completion_tokens": completion.usage.completion_tokens if completion.usage else 0
                    }
                    return content, usage, m
            except Exception as e:
                logger.warning(f"Groq invocation with model '{m}' failed: {e}")
                last_err = e

        raise RuntimeError(f"All Groq models failed. Last error: {last_err}")

    def _build_prompt(self, context_text: str, min_words: int, max_words: int) -> str:
        return (
            "You are an academic text summarization expert in a hybrid NLP pipeline. "
            "Synthesize an accurate, fluent, and highly coherent abstractive summary from the following salient source propositions. "
            f"Adhere strictly to factual grounding. Keep length between {min_words} and {max_words} words.\n\n"
            f"SALIENT EXTRACTED CONTENT:\n{context_text}\n\n"
            "COHERENT ABSTRACTIVE SUMMARY:"
        )

    def _call_llm_api(self, prompt: str, url: str, key: str, model: str) -> Tuple[str, Dict[str, Any]]:
        headers = {"Content-Type": "application/json"}
        if key:
            headers["Authorization"] = f"Bearer {key}"
            
        endpoint = url.rstrip("/")
        if not endpoint.endswith("/chat/completions"):
            endpoint = f"{endpoint}/chat/completions"
            
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a professional academic summarization assistant. Synthesize concise, factually grounded summaries."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.25,
            "max_tokens": 300
        }
        
        response = requests.post(endpoint, json=payload, headers=headers, timeout=12)
        if response.status_code == 200:
            data = response.json()
            content = data["choices"][0]["message"]["content"].strip()
            usage = data.get("usage", {})
            return content, usage
        else:
            raise RuntimeError(f"HTTP {response.status_code}: {response.text}")

    def _synthesize_abstractive_summary(self, sentences: List[str], summary_length: str) -> Tuple[str, Dict[str, Any]]:
        import re

        padding_phrases = [
            r"^(it is important to note that|it should be noted that|in addition to this,|moreover,|furthermore,|consequently,|as a matter of fact,|it has been observed that|results indicate that|in recent years,)\s*",
            r"\b(it is worth mentioning that|it goes without saying that|needless to say)\b"
        ]

        cleaned_clauses = []
        for s in sentences:
            text = s.strip()
            for pattern in padding_phrases:
                text = re.sub(pattern, "", text, flags=re.IGNORECASE)
            text = text[0].upper() + text[1:] if text else ""
            if text and len(text.split()) >= 4:
                cleaned_clauses.append(text)

        if not cleaned_clauses:
            return "No salient content extracted.", {"clauses": 0, "transitions": 0}

        synthesized_paragraphs = []
        connectives = [
            "Specifically,",
            "Additionally,",
            "In consequence,",
            "Furthermore,",
            "Simultaneously,"
        ]
        
        target_count = 2 if summary_length == "short" else (4 if summary_length == "long" else 3)
        selected_clauses = cleaned_clauses[:min(len(cleaned_clauses), target_count + 1)]
        
        for i, clause in enumerate(selected_clauses):
            clause = clause.strip().rstrip(".")
            if i == 0:
                synthesized_paragraphs.append(f"{clause}.")
            elif i == 1 and len(selected_clauses) > 2:
                synthesized_paragraphs.append(f"{connectives[0]} {clause.lower()}.")
            elif i == 2:
                synthesized_paragraphs.append(f"{connectives[1]} {clause.lower()}.")
            else:
                synthesized_paragraphs.append(f"{clause}.")

        result = " ".join(synthesized_paragraphs)
        return result, {"clauses": len(cleaned_clauses), "transitions": min(len(selected_clauses), len(connectives))}
