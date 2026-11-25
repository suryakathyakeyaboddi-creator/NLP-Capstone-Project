import {
  SummarizeRequest,
  SummarizeResponse,
  DashboardAnalytics,
  HistorySummaryItem,
  SampleDocument,
  DatasetListItem,
  DatasetMeta,
  DatasetPreviewResponse,
  DatasetSplitRequest,
  DatasetSplitResponse,
  BenchmarkExperiment,
  BenchmarkRunProgress,
  ExperimentHistoryItem,
  ExperimentComparisonResponse,
  ResearchReportData
} from '../types';

const API_BASE = '/api';

// -------------------------------------------------------------
// Core Single Document API
// -------------------------------------------------------------
export async function summarizeText(request: SummarizeRequest): Promise<SummarizeResponse> {
  const response = await fetch(`${API_BASE}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Summarization failed: HTTP ${response.status}`);
  }
  return response.json();
}

export async function uploadDocumentFile(file: File): Promise<{
  filename: string;
  text: string;
  word_count: number;
  sentence_count: number;
  character_count: number;
  vocabulary_richness: number;
}> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Upload failed: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchAnalytics(): Promise<DashboardAnalytics> {
  const response = await fetch(`${API_BASE}/history/analytics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch analytics: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchHistory(): Promise<HistorySummaryItem[]> {
  const response = await fetch(`${API_BASE}/history`);
  if (!response.ok) {
    throw new Error(`Failed to fetch history: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchHistoryDetail(id: string): Promise<SummarizeResponse> {
  const response = await fetch(`${API_BASE}/history/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch record: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchSystemStatus(): Promise<any> {
  const response = await fetch(`${API_BASE}/config/status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch system status: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchSampleDocuments(): Promise<SampleDocument[]> {
  const response = await fetch(`${API_BASE}/config/sample-documents`);
  if (!response.ok) {
    throw new Error(`Failed to fetch sample documents: HTTP ${response.status}`);
  }
  return response.json();
}

export async function testLLM(apiUrl: string, apiKey?: string, modelName?: string): Promise<any> {
  const response = await fetch(`${API_BASE}/config/test-llm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_url: apiUrl,
      api_key: apiKey,
      model_name: modelName
    })
  });
  return response.json();
}

// -------------------------------------------------------------
// NEW: Dataset Management API
// -------------------------------------------------------------
export async function uploadDatasetFile(file: File): Promise<DatasetMeta> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE}/dataset/upload`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Dataset upload failed: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchDatasetList(): Promise<DatasetListItem[]> {
  const response = await fetch(`${API_BASE}/dataset/list`);
  if (!response.ok) {
    throw new Error(`Failed to fetch dataset list: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchDatasetPreview(
  datasetId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<DatasetPreviewResponse> {
  const response = await fetch(`${API_BASE}/dataset/preview?dataset_id=${encodeURIComponent(datasetId)}&page=${page}&page_size=${pageSize}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to preview dataset: HTTP ${response.status}`);
  }
  return response.json();
}

export async function splitDataset(req: DatasetSplitRequest): Promise<DatasetSplitResponse> {
  const response = await fetch(`${API_BASE}/dataset/split`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Splitting dataset failed: HTTP ${response.status}`);
  }
  return response.json();
}

export async function cleanDataset(
  datasetId: string,
  dropDuplicates: boolean = true,
  dropMissingInText: boolean = true,
  minWordCount: number = 5
): Promise<any> {
  const response = await fetch(`${API_BASE}/dataset/clean`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dataset_id: datasetId,
      drop_duplicates: dropDuplicates,
      drop_missing_in_text: dropMissingInText,
      min_word_count: minWordCount
    })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Dataset cleaning failed: HTTP ${response.status}`);
  }
  return response.json();
}

// -------------------------------------------------------------
// NEW: 3-Model Benchmarking API
// -------------------------------------------------------------
export async function runBenchmark(params: {
  dataset_id: string;
  experiment_name?: string;
  model_version?: string;
  llm_provider?: string;
  custom_api_url?: string;
  custom_api_key?: string;
  max_test_samples?: number;
}): Promise<any> {
  const response = await fetch(`${API_BASE}/benchmark/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Benchmark run failed: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchBenchmarkStatus(runId: string): Promise<BenchmarkRunProgress> {
  const response = await fetch(`${API_BASE}/benchmark/status/${runId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch benchmark progress: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchBenchmarkResults(runId?: string): Promise<BenchmarkExperiment> {
  const url = runId ? `${API_BASE}/benchmark/results?run_id=${encodeURIComponent(runId)}` : `${API_BASE}/benchmark/results`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch benchmark results: HTTP ${response.status}`);
  }
  return response.json();
}

// -------------------------------------------------------------
// NEW: Experiments History & Comparison API
// -------------------------------------------------------------
export async function fetchExperimentHistory(limit: number = 50): Promise<ExperimentHistoryItem[]> {
  const response = await fetch(`${API_BASE}/experiments/history?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch experiments: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchExperimentDetail(id: string): Promise<BenchmarkExperiment> {
  const response = await fetch(`${API_BASE}/experiments/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch experiment detail: HTTP ${response.status}`);
  }
  return response.json();
}

export async function compareExperiments(ids: string[]): Promise<ExperimentComparisonResponse> {
  const response = await fetch(`${API_BASE}/experiments/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ experiment_ids: ids })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Experiment comparison failed: HTTP ${response.status}`);
  }
  return response.json();
}

// -------------------------------------------------------------
// NEW: Research Report API
// -------------------------------------------------------------
export async function generateResearchReport(experimentId: string, customNotes?: string): Promise<ResearchReportData> {
  const response = await fetch(`${API_BASE}/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ experiment_id: experimentId, custom_notes: customNotes })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Report generation failed: HTTP ${response.status}`);
  }
  return response.json();
}

export function getReportCsvDownloadUrl(experimentId: string): string {
  return `${API_BASE}/reports/export/csv/${experimentId}`;
}
