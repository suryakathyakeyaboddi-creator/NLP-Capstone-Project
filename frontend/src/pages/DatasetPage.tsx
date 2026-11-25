import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Upload, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Sparkles, 
  FileSpreadsheet, 
  Trash2, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  PieChart,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  DatasetListItem, 
  DatasetPreviewResponse, 
  DatasetSplitResponse 
} from '../types';
import { 
  fetchDatasetList, 
  uploadDatasetFile, 
  fetchDatasetPreview, 
  splitDataset, 
  cleanDataset 
} from '../services/api';

interface DatasetPageProps {
  onGoToBenchmark: (datasetId: string) => void;
}

export const DatasetPage: React.FC<DatasetPageProps> = ({ onGoToBenchmark }) => {
  const [datasets, setDatasets] = useState<DatasetListItem[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [preview, setPreview] = useState<DatasetPreviewResponse | null>(null);
  
  // Column Selection
  const [textColumn, setTextColumn] = useState<string>('');
  const [summaryColumn, setSummaryColumn] = useState<string>('');
  const [idColumn, setIdColumn] = useState<string>('');

  // Splitting Controls
  const [trainRatio, setTrainRatio] = useState<number>(0.70);
  const [valRatio, setValRatio] = useState<number>(0.15);
  const [testRatio, setTestRatio] = useState<number>(0.15);
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [splitResult, setSplitResult] = useState<DatasetSplitResponse | null>(null);

  // States
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [isSplitting, setIsSplitting] = useState<boolean>(false);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadDatasetList = async () => {
    try {
      const list = await fetchDatasetList();
      setDatasets(list);
      if (list.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(list[0].id);
      }
    } catch (e: any) {
      console.error('Failed to load datasets:', e);
    }
  };

  useEffect(() => {
    loadDatasetList();
  }, []);

  // When selectedDatasetId changes, load preview
  useEffect(() => {
    if (!selectedDatasetId) return;

    setIsLoadingPreview(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    fetchDatasetPreview(selectedDatasetId, page, pageSize)
      .then((res) => {
        setPreview(res);
        setTextColumn(res.text_column || (res.columns.length > 0 ? res.columns[0] : ''));
        setSummaryColumn(res.summary_column || (res.columns.length > 1 ? res.columns[1] : ''));
        setIdColumn(res.id_column || '');
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Failed to load dataset preview.');
      })
      .finally(() => {
        setIsLoadingPreview(false);
      });
  }, [selectedDatasetId, page]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const meta = await uploadDatasetFile(file);
      await loadDatasetList();
      setSelectedDatasetId(meta.id);
      setPage(1);
      setSuccessMsg(`Dataset "${file.name}" uploaded successfully with ${meta.row_count} rows.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Dataset upload failed.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSplitDataset = async () => {
    if (!selectedDatasetId) return;
    setIsSplitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await splitDataset({
        dataset_id: selectedDatasetId,
        train_ratio: trainRatio,
        val_ratio: valRatio,
        test_ratio: testRatio,
        random_seed: randomSeed,
        text_column: textColumn,
        summary_column: summaryColumn
      });
      setSplitResult(res);
      await loadDatasetList();
      setSuccessMsg(`Dataset partitioned: ${res.train_count} Train (${Math.round(res.ratios.train * 100)}%), ${res.val_count} Val (${Math.round(res.ratios.val * 100)}%), ${res.test_count} Test (${Math.round(res.ratios.test * 100)}%). Data leakage strictly prevented.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Dataset split failed.');
    } finally {
      setIsSplitting(false);
    }
  };

  const handleCleanDataset = async () => {
    if (!selectedDatasetId) return;
    setIsCleaning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await cleanDataset(selectedDatasetId, true, true, 5);
      await loadDatasetList();
      // Reload preview
      const updatedPreview = await fetchDatasetPreview(selectedDatasetId, 1, pageSize);
      setPreview(updatedPreview);
      setSuccessMsg(`Data cleaned successfully. Removed ${res.dropped_rows} invalid / duplicate rows. Total active rows: ${res.cleaned_rows}.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Cleaning failed.');
    } finally {
      setIsCleaning(false);
    }
  };

  const selectedMeta = datasets.find(d => d.id === selectedDatasetId);

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>DATASET MANAGEMENT & SPLITTING</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Dataset Ingestion & Experimental Partitions
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload CSV, XLSX, TXT, and PDF datasets. Inspect preview slices via Pandas, detect duplicates, and configure disjoint Train/Val/Test partitions.
          </p>
        </div>

        {/* Upload Action */}
        <label className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono cursor-pointer transition-all shadow-md shadow-cyan-500/20">
          <Upload className="w-4 h-4 text-slate-950" />
          <span>{isUploading ? 'Parsing via Pandas...' : 'Upload Dataset (CSV/XLSX/PDF)'}</span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.txt,.pdf"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* DATASET SELECTION & STATS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Dataset Selector */}
        <div className="md:col-span-1 glass-panel rounded-xl p-4 border border-slate-800 space-y-3">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block">
            Select Active Dataset:
          </span>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {datasets.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedDatasetId(d.id);
                  setPage(1);
                }}
                className={`w-full text-left p-2.5 rounded-lg text-xs font-mono transition-colors ${
                  selectedDatasetId === d.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <div className="truncate text-slate-200">{d.name}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span>{d.row_count} rows</span>
                  <span className="uppercase">{d.format}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Dataset Statistics Card */}
        <div className="md:col-span-3 glass-panel rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-300 font-bold flex items-center space-x-1.5">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <span>Dataset Diagnostics: {selectedMeta?.name || 'No Dataset Selected'}</span>
              </span>
              <button
                onClick={handleCleanDataset}
                disabled={isCleaning || !selectedDatasetId}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors"
                title="Remove invalid and duplicate rows"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{isCleaning ? 'Cleaning...' : 'Clean Invalid & Duplicates'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-center">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">TOTAL ROWS</span>
                <span className="text-cyan-400 font-bold text-base">{selectedMeta?.row_count ?? 0}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">COLUMNS</span>
                <span className="text-blue-400 font-bold text-base">{selectedMeta?.column_count ?? 0}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">DUPLICATE ROWS</span>
                <span className={`font-bold text-base ${selectedMeta?.stats?.duplicate_rows ? 'text-red-400' : 'text-emerald-400'}`}>
                  {selectedMeta?.stats?.duplicate_rows ?? 0}
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">AVG DOC WORDS</span>
                <span className="text-violet-400 font-bold text-base">
                  {selectedMeta?.stats?.text_stats?.avg_document_words ?? '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick info footer */}
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Memory Mode: Safe Chunked Pagination (First {pageSize} rows in memory)</span>
            {selectedMeta?.is_split ? (
              <span className="text-emerald-400 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Split: {selectedMeta.train_count} Train / {selectedMeta.val_count} Val / {selectedMeta.test_count} Test</span>
              </span>
            ) : (
              <span className="text-amber-400">Partitioning Required for Benchmarking</span>
            )}
          </div>
        </div>
      </div>

      {/* COLUMN SELECTOR & RESEARCH SPLITTING SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Column Configuration */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider pb-2 border-b border-slate-800">
            <Sliders className="w-4 h-4" />
            <span>Target Column Mapping</span>
          </div>

          <p className="text-xs text-slate-400">
            Select which dataset column contains the input document text and which contains the reference/ground-truth summary.
          </p>

          <div className="space-y-3 font-mono text-xs">
            {/* Document/Text Column */}
            <div>
              <label className="text-slate-300 block mb-1">
                Document / Source Text Column: <span className="text-red-400">*</span>
              </label>
              <select
                value={textColumn}
                onChange={(e) => setTextColumn(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Select Document Text Column --</option>
                {preview?.columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference Summary Column */}
            <div>
              <label className="text-slate-300 block mb-1">
                Reference Summary Column (Gold Target for ROUGE):
              </label>
              <select
                value={summaryColumn}
                onChange={(e) => setSummaryColumn(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Optional: Select Reference Summary --</option>
                {preview?.columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            {/* ID Column */}
            <div>
              <label className="text-slate-300 block mb-1">
                Optional Document ID Column:
              </label>
              <select
                value={idColumn}
                onChange={(e) => setIdColumn(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Optional: Auto-generate Index --</option>
                {preview?.columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right: Research Dataset Splitting */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-violet-400 font-mono text-xs uppercase tracking-wider pb-2 border-b border-slate-800">
              <PieChart className="w-4 h-4" />
              <span>Research Dataset Partitioning</span>
            </div>

            <p className="text-xs text-slate-400">
              Configurable split ratios for training, validation, and testing. Enforces disjoint partitioning to prevent test data leakage.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block text-[10px] uppercase">
                    Train Ratio: {Math.round(trainRatio * 100)}%
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.4"
                    max="0.85"
                    value={trainRatio}
                    onChange={(e) => setTrainRatio(parseFloat(e.target.value) || 0.70)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-[10px] uppercase">
                    Val Ratio: {Math.round(valRatio * 100)}%
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="0.3"
                    value={valRatio}
                    onChange={(e) => setValRatio(parseFloat(e.target.value) || 0.15)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-[10px] uppercase">
                    Test Ratio: {Math.round(testRatio * 100)}%
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="0.3"
                    value={testRatio}
                    onChange={(e) => setTestRatio(parseFloat(e.target.value) || 0.15)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block text-[10px] uppercase mb-1">
                  Random Seed (Ensures strict experimental reproducibility):
                </label>
                <input
                  type="number"
                  value={randomSeed}
                  onChange={(e) => setRandomSeed(parseInt(e.target.value) || 42)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>

              {/* Visual Split Ratio Bar */}
              <div className="pt-2">
                <span className="text-[10px] text-slate-500 block mb-1">PARTITION DISTRIBUTION:</span>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="bg-cyan-500 h-full" style={{ width: `${trainRatio * 100}%` }} title="Train" />
                  <div className="bg-blue-500 h-full" style={{ width: `${valRatio * 100}%` }} title="Validation" />
                  <div className="bg-emerald-500 h-full" style={{ width: `${testRatio * 100}%` }} title="Test" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span className="text-cyan-400">■ Train ({Math.round(trainRatio * 100)}%)</span>
                  <span className="text-blue-400">■ Val ({Math.round(valRatio * 100)}%)</span>
                  <span className="text-emerald-400">■ Test ({Math.round(testRatio * 100)}%)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleSplitDataset}
              disabled={isSplitting || !selectedDatasetId || !textColumn}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs font-mono transition-all flex items-center justify-center space-x-2 ${
                isSplitting || !selectedDatasetId || !textColumn
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>{isSplitting ? 'Splitting Partitions...' : 'Execute Research Split'}</span>
            </button>

            {selectedMeta?.is_split && (
              <button
                onClick={() => onGoToBenchmark(selectedDatasetId!)}
                className="py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center space-x-1.5 shadow-md shadow-cyan-500/20"
              >
                <span>Proceed to Benchmark</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DATASET PREVIEW SLICE TABLE */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Dataset Preview Slice (Safe Chunking)
            </h3>
            <p className="text-xs text-slate-400">
              Showing page {page} of {Math.ceil((preview?.total_rows || 1) / pageSize)} ({preview?.total_rows ?? 0} total records). Full dataset remains in backend storage.
            </p>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center space-x-2 font-mono text-xs">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-slate-400">Page {page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil((preview?.total_rows || 1) / pageSize)}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoadingPreview ? (
          <div className="text-center py-12 text-slate-400 font-mono text-xs animate-pulse">
            Loading dataset preview...
          </div>
        ) : preview?.records && preview.records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                  <th className="py-2.5 px-3">#</th>
                  {preview.columns.map((col) => (
                    <th
                      key={col}
                      className={`py-2.5 px-3 whitespace-nowrap ${
                        col === textColumn
                          ? 'text-cyan-400 font-bold'
                          : col === summaryColumn
                          ? 'text-violet-400 font-bold'
                          : ''
                      }`}
                    >
                      {col} {col === textColumn ? '(Text)' : col === summaryColumn ? '(Ref)' : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {preview.records.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 text-slate-300">
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-xs">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    {preview.columns.map((col) => (
                      <td key={col} className="py-2.5 px-3 max-w-xs truncate text-xs">
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-slate-600 italic">null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 font-mono text-xs">
            No dataset records to preview.
          </div>
        )}
      </div>
    </div>
  );
};
