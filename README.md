# NEUROSUM AI
### A Hybrid Extractive-Abstractive Text Summarization Framework Using Reinforcement Learning and Large Language Models with Factual Consistency Optimization
**Academic Research Platform & Experimentation Laboratory**

---

## 1. Project Overview & Research Motivation

**NEUROSUM AI** is a final-year engineering AI/NLP research platform that implements a controlled experimental environment for hybrid text summarization and factual verification.

The platform addresses the central dilemma of modern text summarization:
1. **Extractive summaries** retain factual fidelity but lack narrative discourse fluency, cross-sentence clause condensation, and coreference resolution.
2. **Abstractive Large Language Models (LLMs)** synthesize remarkably fluent prose but frequently hallucinate facts, invent numerical values, and drift from source assertions.

NEUROSUM AI couples a three-stage sequential hybrid pipeline with a comprehensive academic dataset management, splitting, 3-model benchmarking, and experiment versioning laboratory:
1. **Module 1 — GAN-Based Extractive Summarization**: DistilBERT embeddings (768-d) and Bi-directional Temporal-LSTM (TLSTM) sequence modeling feed into a Generator-Discriminator network with policy-gradient Reinforcement Learning (REINFORCE) to select high-salience propositions.
2. **Module 2 — LLM-Based Abstractive Generation**: Evaluates a pairwise semantic cosine similarity matrix to filter out redundant propositions before passing an optimized grounding prompt to an LLM (Qwen 2.5, Llama 3, or Local Neural Synthesis).
3. **Module 3 — Factual Consistency Verification**: Decomposes the abstractive draft into atomic factual claims, searches source evidence spans via dense semantic alignment, calculates the Factual Consistency Score (FCS), and automatically post-edits unsupported claims into source-grounded statements.

---

## 2. Research Experimentation & Benchmarking Suite

NEUROSUM AI functions as a full-fledged academic experimentation laboratory:

### A. Dataset Management & Safe Chunked Processing
- Supported formats: **CSV**, **XLSX**, **TXT**, **PDF**.
- High-throughput ingestion using **Python Pandas**.
- Memory-efficient safe chunked preview (first 20 rows paginated) preventing client browser memory exhaustion.
- Automated column detection for Document Text, Reference Summary (Gold), and Document ID.
- Data diagnostics: Missing values detection, duplicate row analysis, and one-click data cleaning.

### B. Strict Research Dataset Splitting
- Configurable **Train (70%)**, **Validation (15%)**, and **Testing (15%)** split ratios with configurable random seed.
- Enforces strict disjoint partitioning to **guarantee zero data leakage**.
- Dedicated test split reserved strictly for final 3-model benchmark evaluations.

### C. Controlled 3-Model Benchmarking
- **Model A (Extractive Only)**: DistilBERT + TLSTM + GAN + RL sentence selection, no LLM rewriting.
- **Model B (Abstractive Only)**: Direct LLM generation on raw text without extractive proposition selection.
- **Model C (Proposed Hybrid Framework)**: Full NeuroSum pipeline (Extractive GAN-RL → Redundancy Pruning → LLM Synthesis → NLI Verification & Grounding).
- Interactive comparative analytics:
  - ROUGE-1, ROUGE-2, ROUGE-L (Precision, Recall, F1)
  - BERTScore / Semantic Cosine Similarity
  - Factual Consistency Score (FCS %)
  - Semantic Redundancy (%)
  - Compression Ratio (%)
  - Inference Latency (ms)
- Interactive grouped bar charts, best-performing model identification, and per-document comparative reader.

### D. Experiment History & Version-to-Version Comparison
- Persistent storage of every benchmark run in SQLite.
- Multi-experiment selector: compare 2 or more checkpoints side-by-side.
- Automated delta calculation showing performance gains or regressions ($\pm \Delta\%$ ROUGE-L, $\pm \Delta\%$ FCS).

### E. Publication-Grade Research Report Generation
- Comprehensive IEEE/ACM-style formatted research report.
- Includes Project Title, Dataset Partitioning, Quantitative 3-Model Comparison Table, Discussion of Findings, and Methodological Limitations.
- Dual export: **Downloadable PDF Report** and **Downloadable CSV Data**.

---

## 3. Technology Stack

- **Frontend**:
  - React 19 + TypeScript + Vite 8
  - Tailwind CSS + Framer Motion
  - Three.js (Interactive 3D Neural Particle Network Background)
  - Lucide React Icons
  - jsPDF (Publication-Grade Summary and Research Report PDF Export)
- **Backend**:
  - Python 3.14
  - FastAPI (High-performance async REST API)
  - Uvicorn ASGI Server
  - SQLite (Persistent history, datasets, and experiment storage)
- **AI & NLP Stack**:
  - PyTorch 2.14
  - DistilBERT (`transformers`)
  - Bi-directional Temporal LSTM (TLSTM)
  - GAN Generator & Bilinear Discriminator
  - Contextual Policy Gradient RL Agent (REINFORCE)
  - spaCy (`en_core_web_sm`) & NLTK (`punkt`, `stopwords`)
  - Pandas & OpenPyXL (Dataset ingestion & quality validation)
  - scikit-learn & SciPy (Cosine similarity matrices & MMR)
  - `rouge-score` (ROUGE-1, ROUGE-2, ROUGE-L Precision, Recall, F1)
  - PyPDF (Native PDF document parsing)

---

## 4. REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/summarize` | Full single-document hybrid pipeline |
| `POST` | `/api/dataset/upload` | Upload and parse CSV/XLSX/TXT/PDF dataset |
| `GET` | `/api/dataset/list` | List all ingested datasets |
| `GET` | `/api/dataset/preview` | Safe chunked paginated preview and diagnostics |
| `POST` | `/api/dataset/split` | Perform train/val/test disjoint split |
| `POST` | `/api/dataset/clean` | Drop duplicate and invalid rows |
| `POST` | `/api/benchmark/run` | Run Model A vs Model B vs Model C benchmark |
| `GET` | `/api/benchmark/results` | Fetch benchmark results |
| `GET` | `/api/experiments/history` | List experiment checkpoints |
| `POST` | `/api/experiments/compare` | Version-to-version delta comparison |
| `GET` | `/api/experiments/{id}` | Fetch full experiment record |
| `POST` | `/api/reports/generate` | Generate publication research report data |
| `GET` | `/api/reports/export/csv/{id}` | Export benchmark experiment as CSV |

---

## 5. Execution Instructions

### Option A: One-Click Launcher (Windows)
Double-click `run_all.bat`. It will:
1. Start the FastAPI backend on `http://localhost:8000`.
2. Start the Vite React frontend on `http://localhost:5173`.
3. Open `http://localhost:5173` automatically in your web browser.

### Option B: Manual Execution
#### 1. Backend Server
```bash
cd "E:\SUBJECTS\NLP\IMPLEMENTATION FOR NLP"
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger API documentation: `http://localhost:8000/docs`

#### 2. Frontend Server
```bash
cd "E:\SUBJECTS\NLP\IMPLEMENTATION FOR NLP\frontend"
npm run dev
```
Open `http://localhost:5173` in your browser.
