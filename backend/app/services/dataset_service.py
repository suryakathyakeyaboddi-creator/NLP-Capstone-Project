import os
import io
import uuid
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
import pypdf

DATASETS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "datasets"))

class DatasetService:
    """
    Research Dataset Management Service:
    - High-throughput ingestion of CSV, XLSX, TXT, and PDF.
    - Memory-efficient preview & chunking via Pandas.
    - Data quality validation: missing values, duplicate detection, encoding verification.
    - Disjoint Train / Val / Test splitting without data leakage.
    """
    def __init__(self):
        os.makedirs(DATASETS_DIR, exist_ok=True)

    def save_and_ingest(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        dataset_id = str(uuid.uuid4())
        ext = os.path.splitext(filename)[1].lower()
        saved_filename = f"{dataset_id}{ext}"
        saved_path = os.path.join(DATASETS_DIR, saved_filename)
        
        with open(saved_path, "wb") as f:
            f.write(file_bytes)

        # Parse with Pandas according to format
        df, fmt = self._load_dataframe(saved_path, ext, file_bytes)
        
        # Quality diagnostics
        row_count = len(df)
        column_count = len(df.columns)
        columns = [str(c) for c in df.columns]

        # Missing values and duplicates
        missing_counts = df.isnull().sum().to_dict()
        duplicate_count = int(df.duplicated().sum())

        # Auto-detect candidate text and summary columns
        text_col, summary_col, id_col = self._detect_columns(columns)

        # Basic word count statistics on text column if detected
        stats = self._compute_quick_stats(df, text_col, summary_col)

        dataset_meta = {
            "id": dataset_id,
            "filename": saved_filename,
            "original_name": filename,
            "format": fmt,
            "row_count": row_count,
            "column_count": column_count,
            "columns": columns,
            "text_column": text_col,
            "summary_column": summary_col,
            "id_column": id_col,
            "train_indices": [],
            "val_indices": [],
            "test_indices": [],
            "split_ratios": {"train": 0.70, "val": 0.15, "test": 0.15},
            "random_seed": 42,
            "file_path": saved_path,
            "stats": {
                "missing_values": {str(k): int(v) for k, v in missing_counts.items()},
                "duplicate_rows": duplicate_count,
                "text_stats": stats
            }
        }

        return dataset_meta

    def get_preview(
        self,
        dataset_meta: Dict[str, Any],
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        saved_path = dataset_meta["file_path"]
        ext = os.path.splitext(saved_path)[1].lower()
        df, _ = self._load_dataframe(saved_path, ext)

        total_rows = len(df)
        start_idx = (page - 1) * page_size
        end_idx = min(start_idx + page_size, total_rows)

        preview_slice = df.iloc[start_idx:end_idx]
        
        # Sanitize for JSON (handle NaN, Inf)
        records = preview_slice.replace({np.nan: None, np.inf: None, -np.inf: None}).to_dict(orient="records")

        return {
            "dataset_id": dataset_meta["id"],
            "dataset_name": dataset_meta["original_name"],
            "format": dataset_meta["format"],
            "total_rows": total_rows,
            "total_columns": len(df.columns),
            "columns": [str(c) for c in df.columns],
            "page": page,
            "page_size": page_size,
            "records": records,
            "text_column": dataset_meta.get("text_column"),
            "summary_column": dataset_meta.get("summary_column"),
            "id_column": dataset_meta.get("id_column"),
            "stats": dataset_meta.get("stats", {})
        }

    def split_dataset(
        self,
        dataset_meta: Dict[str, Any],
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
        random_seed: int = 42,
        text_column: Optional[str] = None,
        summary_column: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes strict, reproducible train/val/test split preventing data leakage.
        """
        saved_path = dataset_meta["file_path"]
        ext = os.path.splitext(saved_path)[1].lower()
        df, _ = self._load_dataframe(saved_path, ext)

        N = len(df)
        if N == 0:
            raise ValueError("Cannot split an empty dataset.")

        # Normalize ratios
        total_ratio = train_ratio + val_ratio + test_ratio
        r_train = train_ratio / total_ratio
        r_val = val_ratio / total_ratio
        r_test = test_ratio / total_ratio

        np.random.seed(random_seed)
        shuffled_indices = np.random.permutation(N).tolist()

        n_train = int(round(N * r_train))
        n_val = int(round(N * r_val))
        
        train_indices = shuffled_indices[:n_train]
        val_indices = shuffled_indices[n_train:n_train + n_val]
        test_indices = shuffled_indices[n_train + n_val:]

        # Edge case handling for small sample datasets
        if not test_indices and N > 2:
            test_indices = [val_indices.pop()] if val_indices else [train_indices.pop()]

        split_meta = {
            "train_indices": train_indices,
            "val_indices": val_indices,
            "test_indices": test_indices,
            "train_count": len(train_indices),
            "val_count": len(val_indices),
            "test_count": len(test_indices),
            "total_count": N,
            "ratios": {
                "train": round(r_train, 3),
                "val": round(r_val, 3),
                "test": round(r_test, 3)
            },
            "random_seed": random_seed,
            "text_column": text_column or dataset_meta.get("text_column"),
            "summary_column": summary_column or dataset_meta.get("summary_column")
        }

        return split_meta

    def clean_dataset(
        self,
        dataset_meta: Dict[str, Any],
        drop_duplicates: bool = True,
        drop_missing_in_text: bool = True,
        min_word_count: int = 5
    ) -> Dict[str, Any]:
        saved_path = dataset_meta["file_path"]
        ext = os.path.splitext(saved_path)[1].lower()
        df, _ = self._load_dataframe(saved_path, ext)
        initial_len = len(df)

        text_col = dataset_meta.get("text_column")

        if drop_duplicates:
            df = df.drop_duplicates()

        if drop_missing_in_text and text_col and text_col in df.columns:
            df = df.dropna(subset=[text_col])
            # Filter out non-strings or too-short entries
            df = df[df[text_col].astype(str).str.split().str.len() >= min_word_count]

        cleaned_len = len(df)
        dropped_count = initial_len - cleaned_len

        # Overwrite file with cleaned version
        if ext == ".csv":
            df.to_csv(saved_path, index=False)
        elif ext in [".xlsx", ".xls"]:
            df.to_excel(saved_path, index=False)

        # Update metadata
        dataset_meta["row_count"] = cleaned_len
        dataset_meta["stats"]["duplicate_rows"] = int(df.duplicated().sum())
        dataset_meta["stats"]["missing_values"] = {str(k): int(v) for k, v in df.isnull().sum().to_dict().items()}
        dataset_meta["train_indices"] = []
        dataset_meta["val_indices"] = []
        dataset_meta["test_indices"] = []

        return {
            "initial_rows": initial_len,
            "cleaned_rows": cleaned_len,
            "dropped_rows": dropped_count,
            "dataset_meta": dataset_meta
        }

    def get_test_records(
        self,
        dataset_meta: Dict[str, Any],
        max_samples: int = 50
    ) -> List[Dict[str, Any]]:
        saved_path = dataset_meta["file_path"]
        ext = os.path.splitext(saved_path)[1].lower()
        df, _ = self._load_dataframe(saved_path, ext)

        test_indices = dataset_meta.get("test_indices", [])
        if not test_indices:
            # Default to first 15% if no explicit split has been performed
            N = len(df)
            test_indices = list(range(max(1, int(N * 0.85)), N))
            if not test_indices:
                test_indices = list(range(N))

        target_indices = test_indices[:max_samples]
        test_df = df.iloc[target_indices]

        text_col = dataset_meta.get("text_column")
        if not text_col or text_col not in df.columns:
            # Auto-detect best text column from df.columns
            detected_text, detected_summ, _ = self._detect_columns([str(c) for c in df.columns])
            text_col = detected_text or (df.columns[-1] if len(df.columns) > 1 else df.columns[0])

        summ_col = dataset_meta.get("summary_column")
        if summ_col and summ_col not in df.columns:
            summ_col = None

        records = []
        for orig_idx, row in test_df.iterrows():
            text_val = str(row[text_col]) if text_col in row and pd.notnull(row[text_col]) else ""
            ref_val = str(row[summ_col]) if (summ_col and summ_col in row and pd.notnull(row[summ_col])) else None
            
            if len(text_val.strip()) > 10:
                records.append({
                    "row_index": int(orig_idx),
                    "document_text": text_val.strip(),
                    "reference_summary": ref_val.strip() if ref_val else None,
                    "title": f"Test Document #{orig_idx + 1}"
                })

        # Fallback: if test indices produced 0 records, try all rows in df
        if not records and len(df) > 0:
            for orig_idx, row in df.iterrows():
                text_val = str(row[text_col]) if text_col in row and pd.notnull(row[text_col]) else ""
                ref_val = str(row[summ_col]) if (summ_col and summ_col in row and pd.notnull(row[summ_col])) else None
                if len(text_val.strip()) > 10:
                    records.append({
                        "row_index": int(orig_idx),
                        "document_text": text_val.strip(),
                        "reference_summary": ref_val.strip() if ref_val else None,
                        "title": f"Test Document #{orig_idx + 1}"
                    })
                if len(records) >= max_samples:
                    break

        return records

    def _load_dataframe(self, path: str, ext: str, raw_bytes: bytes = None) -> Tuple[pd.DataFrame, str]:
        if ext == ".csv":
            try:
                df = pd.read_csv(path, encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(path, encoding="latin1")
            return df, "csv"
        elif ext in [".xlsx", ".xls"]:
            df = pd.read_excel(path)
            return df, "xlsx"
        elif ext == ".pdf":
            # Extract PDF pages into dataframe
            reader = pypdf.PdfReader(path)
            rows = []
            for i, page in enumerate(reader.pages):
                txt = page.extract_text() or ""
                if len(txt.strip()) > 20:
                    rows.append({"page_number": i + 1, "text": txt.strip()})
            df = pd.DataFrame(rows)
            return df, "pdf"
        elif ext in [".txt", ".md"]:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                lines = [line.strip() for line in f if len(line.strip()) > 20]
            df = pd.DataFrame({"document_text": lines})
            return df, "txt"
        else:
            # Fallback csv attempt
            try:
                df = pd.read_csv(path, encoding="utf-8")
                return df, "csv"
            except Exception:
                df = pd.DataFrame({"text": ["Unsupported format"]})
                return df, "unknown"

    def _detect_columns(self, columns: List[str]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        text_candidates = ["document", "text", "article", "content", "body", "input_text", "source", "review", "abstract"]
        summ_candidates = ["summary", "reference_summary", "highlights", "target", "gold_summary", "abstract_summary", "tldr"]
        id_candidates = ["id", "doc_id", "uid", "index", "article_id", "key"]

        text_col = None
        summ_col = None
        id_col = None

        cols_lower = [c.lower() for c in columns]

        for cand in text_candidates:
            for idx, c in enumerate(cols_lower):
                if cand in c:
                    text_col = columns[idx]
                    break
            if text_col:
                break

        for cand in summ_candidates:
            for idx, c in enumerate(cols_lower):
                if cand in c:
                    summ_col = columns[idx]
                    break
            if summ_col:
                break

        for cand in id_candidates:
            for idx, c in enumerate(cols_lower):
                if cand == c or f"{cand}_" in c:
                    id_col = columns[idx]
                    break
            if id_col:
                break

        # Defaults if not detected
        if not text_col and len(columns) > 0:
            text_col = columns[0]
        if not summ_col and len(columns) > 1 and text_col != columns[1]:
            summ_col = columns[1]

        return text_col, summ_col, id_col

    def _compute_quick_stats(self, df: pd.DataFrame, text_col: Optional[str], summ_col: Optional[str]) -> Dict[str, Any]:
        stats = {}
        if text_col and text_col in df.columns:
            lens = df[text_col].dropna().astype(str).str.split().str.len()
            if len(lens) > 0:
                stats["avg_document_words"] = round(float(lens.mean()), 1)
                stats["min_document_words"] = int(lens.min())
                stats["max_document_words"] = int(lens.max())
                stats["median_document_words"] = int(lens.median())

        if summ_col and summ_col in df.columns:
            s_lens = df[summ_col].dropna().astype(str).str.split().str.len()
            if len(s_lens) > 0:
                stats["avg_reference_words"] = round(float(s_lens.mean()), 1)
                stats["median_reference_words"] = int(s_lens.median())

        return stats

    def seed_default_dataset_if_empty(self):
        # No sample data pre-seeded
        return
