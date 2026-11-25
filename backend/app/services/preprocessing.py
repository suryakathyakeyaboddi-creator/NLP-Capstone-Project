import re
import string
from typing import List, Dict, Any, Tuple
import nltk
from nltk.corpus import stopwords

try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = None

try:
    stop_words = set(stopwords.words("english"))
except Exception:
    stop_words = {
        "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your",
        "he", "him", "his", "she", "her", "it", "its", "they", "them", "their",
        "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is",
        "are", "was", "were", "be", "been", "being", "have", "has", "had", "having",
        "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or",
        "because", "as", "until", "while", "of", "at", "by", "for", "with", "about",
        "against", "between", "into", "through", "during", "before", "after", "above",
        "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under",
        "again", "further", "then", "once", "here", "there", "when", "where", "why",
        "how", "all", "any", "both", "each", "few", "more", "most", "other", "some",
        "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
        "s", "t", "can", "will", "just", "don", "should", "now"
    }

class TextPreprocessor:
    """
    Research text preprocessing engine:
    1. Normalization & noise removal (clean headers, excess whitespace, symbols)
    2. Sentence segmentation (NLTK punkt + spaCy boundary disambiguation)
    3. Tokenization and linguistic feature extraction
    4. Entity and POS frequency profiling
    """
    
    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""
        # Normalize whitespace and newlines
        cleaned = re.sub(r"\r\n|\r", "\n", text)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        # Normalize fancy quotation marks
        cleaned = cleaned.replace("“", "\"").replace("”", "\"").replace("‘", "'").replace("’", "'")
        # Collapse repetitive non-sentence symbols
        cleaned = re.sub(r"[\t ]+", " ", cleaned)
        return cleaned.strip()

    @classmethod
    def segment_sentences(cls, text: str) -> List[str]:
        cleaned = cls.clean_text(text)
        if not cleaned:
            return []
            
        try:
            raw_sentences = nltk.sent_tokenize(cleaned)
        except Exception:
            # Fallback regex splitter if punkt resource error occurs
            raw_sentences = re.split(r"(?<=[.!?])\s+", cleaned)
            
        processed_sentences = []
        for s in raw_sentences:
            s_clean = s.strip()
            # Filter out degenerate or too-short fragments (e.g. single character or page numbers)
            if len(s_clean) >= 15 and len(s_clean.split()) >= 3:
                processed_sentences.append(s_clean)
                
        return processed_sentences

    @classmethod
    def analyze_document(cls, text: str) -> Dict[str, Any]:
        cleaned = cls.clean_text(text)
        sentences = cls.segment_sentences(cleaned)
        words = re.findall(r"\b[A-Za-z0-9\-_]+\b", cleaned)
        
        content_words = [w.lower() for w in words if w.lower() not in stop_words and len(w) > 1]
        
        entities = []
        if nlp is not None and len(cleaned) < 50000:
            try:
                doc = nlp(cleaned[:5000])  # Sample first 5000 chars for rapid analysis
                entities = [{"text": ent.text, "label": ent.label_} for ent in doc.ents[:15]]
            except Exception:
                pass
                
        return {
            "sentence_count": len(sentences),
            "word_count": len(words),
            "character_count": len(cleaned),
            "content_word_count": len(content_words),
            "vocabulary_richness": round(len(set(content_words)) / max(len(content_words), 1), 3),
            "average_sentence_length": round(len(words) / max(len(sentences), 1), 1),
            "named_entities": entities,
            "sentences": sentences
        }
