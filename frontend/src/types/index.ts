// Core Summarization Types
export interface SentenceScoreItem {
  index: number;
  text: string;
  importance_score: number;
  distilbert_norm: number;
  tlstm_salience: number;
  gan_score: number;
  rl_reward: number;
  selected: boolean;
  rank: number;
}

export interface RedundancyPair {
  sentence_idx_a: number;
  sentence_idx_b: number;
  text_a: string;
  text_b: string;
  similarity: number;
  threshold: number;
  dropped_index: number;
  retained_index: number;
}

export interface RemovedSentence {
  index: number;
  text: string;
  reason: string;
}

export interface RedundancyAnalysis {
  cleaned_sentences: string[];
  removed_sentences: RemovedSentence[];
  similarity_matrix: number[][];
  redundancy_pairs: RedundancyPair[];
  initial_redundancy_avg: number;
  post_redundancy_avg: number;
  redundancy_reduction_rate: number;
  initial_count: number;
  retained_count: number;
}

export interface ClaimVerificationItem {
  claim_id: number;
  claim_text: string;
  status: 'Supported' | 'Unsupported' | 'Uncertain';
  entailment_score: number;
  evidence_sentence_index: number;
  evidence_text: string;
  explanation: string;
  suggested_correction: string | null;
  was_corrected: boolean;
}

export interface RougeMetrics {
  rouge1: number;
  rouge2: number;
  rougeL: number;
  precision_r1?: number;
  recall_r1?: number;
  evaluated_against?: string;
}

export interface EvaluationMetrics {
  rouge: RougeMetrics;
  semantic_similarity: number;
  bertscore_f1?: number | null;
  compression_ratio: number;
  factual_consistency_score: number;
  supported_claims_count: number;
  total_claims_count: number;
  redundancy_reduction_rate: number;
  word_count_original: number;
  word_count_extractive: number;
  word_count_abstractive: number;
  word_count_final: number;
  execution_time_ms: {
    module1_extractive: number;
    module2_abstractive: number;
    module3_verification: number;
    total_pipeline: number;
  };
}

export interface PipelineStageStatus {
  stage: string;
  status: 'completed' | 'running' | 'failed' | 'pending';
  duration_ms: number;
  details: Record<string, any>;
}

export interface SummarizeResponse {
  id: string;
  title: string;
  original_text: string;
  extractive_summary: string;
  abstractive_summary: string;
  final_summary: string;
  extractive_sentences: SentenceScoreItem[];
  redundancy_analysis: RedundancyAnalysis;
  verification_claims: ClaimVerificationItem[];
  metrics: EvaluationMetrics;
  pipeline_stages: PipelineStageStatus[];
  model_metadata: {
    llm_provider: string;
    is_real_llm: boolean;
    distilbert_weights_real: boolean;
  };
}

export interface SummarizeRequest {
  text: string;
  title?: string;
  summary_length?: 'short' | 'medium' | 'long';
  max_sentences?: number;
  llm_provider?: string;
  redundancy_threshold?: number;
  enable_correction?: boolean;
  custom_api_url?: string;
  custom_api_key?: string;
  model_name?: string;
}

export interface HistorySummaryItem {
  id: string;
  title: string;
  word_count: number;
  created_at: string;
  metrics: EvaluationMetrics;
  final_summary: string;
}

export interface DashboardAnalytics {
  total_documents_processed: number;
  total_summaries_generated: number;
  total_experiments?: number;
  total_datasets?: number;
  average_compression_ratio: number;
  average_factual_consistency: number;
  average_rouge1: number;
  average_rouge2: number;
  average_rougeL: number;
  has_real_records: boolean;
}

export interface SampleDocument {
  id: string;
  title: string;
  category: string;
  text: string;
}

// -------------------------------------------------------------
// NEW: Dataset Management Types
// -------------------------------------------------------------
export interface DatasetListItem {
  id: string;
  name: string;
  format: string;
  row_count: number;
  column_count: number;
  text_column: string | null;
  summary_column: string | null;
  is_split: boolean;
  train_count: number;
  val_count: number;
  test_count: number;
  stats: {
    missing_values?: Record<string, number>;
    duplicate_rows?: number;
    text_stats?: {
      avg_document_words?: number;
      min_document_words?: number;
      max_document_words?: number;
      median_document_words?: number;
    };
  };
  created_at: string;
}

export interface DatasetMeta {
  id: string;
  filename: string;
  original_name: string;
  format: string;
  row_count: number;
  column_count: number;
  columns: string[];
  text_column: string | null;
  summary_column: string | null;
  id_column: string | null;
  train_indices: number[];
  val_indices: number[];
  test_indices: number[];
  split_ratios: { train: number; val: number; test: number };
  random_seed: number;
  file_path: string;
  stats: any;
}

export interface DatasetPreviewResponse {
  dataset_id: string;
  dataset_name: string;
  format: string;
  total_rows: number;
  total_columns: number;
  columns: string[];
  page: number;
  page_size: number;
  records: Record<string, any>[];
  text_column: string | null;
  summary_column: string | null;
  id_column: string | null;
  stats: any;
}

export interface DatasetSplitRequest {
  dataset_id: string;
  train_ratio?: number;
  val_ratio?: number;
  test_ratio?: number;
  random_seed?: number;
  text_column?: string;
  summary_column?: string;
}

export interface DatasetSplitResponse {
  train_indices: number[];
  val_indices: number[];
  test_indices: number[];
  train_count: number;
  val_count: number;
  test_count: number;
  total_count: number;
  ratios: { train: number; val: number; test: number };
  random_seed: number;
  text_column: string;
  summary_column: string;
}

// -------------------------------------------------------------
// NEW: 3-Model Benchmark Types
// -------------------------------------------------------------
export interface ModelBenchmarkSummary {
  name: string;
  paradigm: string;
  rouge1: number;
  rouge2: number;
  rougeL: number;
  bertscore: number;
  factual_consistency: number;
  redundancy_pct: number;
  compression_ratio: number;
  avg_processing_time_ms: number;
  is_proposed_model?: boolean;
}

export interface PerDocumentBenchmarkResult {
  document_index: number;
  title: string;
  word_count_original: number;
  has_gold_reference: boolean;
  model_a_extractive: {
    summary: string;
    rouge1: number;
    rouge2: number;
    rougeL: number;
    fcs: number;
    time_ms: number;
  };
  model_b_abstractive: {
    summary: string;
    rouge1: number;
    rouge2: number;
    rougeL: number;
    fcs: number;
    time_ms: number;
  };
  model_c_proposed_hybrid: {
    summary: string;
    rouge1: number;
    rouge2: number;
    rougeL: number;
    fcs: number;
    claims_count?: number;
    corrections_made?: boolean;
    time_ms: number;
  };
}

export interface BenchmarkExperiment {
  id: string;
  name: string;
  dataset_id: string;
  dataset_name: string;
  model_version: string;
  llm_provider: string;
  config: Record<string, any>;
  models_evaluated: Record<string, string>;
  summary_metrics: {
    model_a_extractive: ModelBenchmarkSummary;
    model_b_abstractive: ModelBenchmarkSummary;
    model_c_proposed_hybrid: ModelBenchmarkSummary;
  };
  per_document_results: PerDocumentBenchmarkResult[];
  best_model: string;
  best_models_breakdown?: Record<string, string>;
  notes: string;
  processing_time_ms: number;
  created_at: string;
}

export interface BenchmarkRunProgress {
  id: string;
  experiment_name: string;
  dataset_id: string;
  status: 'running' | 'completed' | 'failed';
  progress_pct: number;
  current_index: number;
  total_items: number;
  current_stage: string;
  results?: BenchmarkExperiment;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------------
// NEW: Experiments History & Comparison Types
// -------------------------------------------------------------
export interface ExperimentHistoryItem {
  id: string;
  name: string;
  dataset_name: string;
  model_version: string;
  llm_provider: string;
  summary_metrics: {
    model_a_extractive?: ModelBenchmarkSummary;
    model_b_abstractive?: ModelBenchmarkSummary;
    model_c_proposed_hybrid?: ModelBenchmarkSummary;
  };
  best_model: string;
  processing_time_ms: number;
  created_at: string;
}

export interface ExperimentDiffItem {
  experiment_id: string;
  is_baseline: boolean;
  relative_diffs: Record<string, {
    absolute_diff: number;
    percentage_change: number;
    trend: 'improved' | 'degraded';
  }>;
}

export interface ExperimentComparisonResponse {
  experiments: {
    id: string;
    name: string;
    model_version: string;
    dataset_name: string;
    llm_provider: string;
    created_at: string;
    metrics: Record<string, number>;
    config: Record<string, any>;
  }[];
  diff_analysis: ExperimentDiffItem[];
  best_overall: any;
}

// -------------------------------------------------------------
// NEW: Research Report Types
// -------------------------------------------------------------
export interface ResearchReportData {
  project_title: string;
  report_id: string;
  generated_at: string;
  dataset_info: {
    name: string;
    total_rows: number;
    test_partition_size: number;
    split_distribution: { train: string; validation: string; test: string };
    prevent_data_leakage: boolean;
  };
  experimental_methodology: {
    model_version: string;
    llm_provider: string;
    evaluation_metrics: string[];
    claim_verification_method: string;
  };
  summary_results_table: {
    approach: string;
    paradigm: string;
    rouge1: number;
    rouge2: number;
    rougeL: number;
    bertscore: number;
    factual_consistency: string;
    redundancy: string;
    compression: string;
    latency_ms: string;
    is_proposed?: boolean;
  }[];
  findings_discussion: string;
  limitations: string;
  per_document_breakdown?: PerDocumentBenchmarkResult[];
  custom_notes?: string;
}
