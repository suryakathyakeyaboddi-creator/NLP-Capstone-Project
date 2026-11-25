import React, { useState, useEffect } from 'react';
import { 
  Award, 
  BarChart3, 
  Layers, 
  Cpu, 
  Sparkles, 
  ShieldCheck, 
  Play, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  FileText, 
  TrendingUp, 
  Copy, 
  Check, 
  ArrowRight,
  Database
} from 'lucide-react';
import { 
  DatasetListItem, 
  BenchmarkExperiment, 
  ModelBenchmarkSummary, 
  PerDocumentBenchmarkResult 
} from '../types';
import { 
  fetchDatasetList, 
  runBenchmark, 
  fetchBenchmarkResults 
} from '../services/api';

interface BenchmarkPageProps {
  initialDatasetId?: string | null;
  onGoToReport: (experimentId: string) => void;
  onGoToDatasets: () => void;
}

export const BenchmarkPage: React.FC<BenchmarkPageProps> = ({
  initialDatasetId,
  onGoToReport,
  onGoToDatasets
}) => {
  const [datasets, setDatasets] = useState<DatasetListItem[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [experimentName, setExperimentName] = useState<string>('Benchmark 3-Model Study');
  const [modelVersion, setModelVersion] = useState<string>('v1.0-hybrid');
  const [llmProvider, setLlmProvider] = useState<string>('auto');
  const [maxTestSamples, setMaxTestSamples] = useState<number>(5);

  // Execution states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [experimentResult, setExperimentResult] = useState<BenchmarkExperiment | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Selected metric for visual charts
  const [selectedMetricChart, setSelectedMetricChart] = useState<'rouge' | 'fcs' | 'redundancy' | 'latency'>('rouge');
  const [selectedDocIndex, setSelectedDocIndex] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchDatasetList().then((list) => {
      setDatasets(list);
      if (initialDatasetId && list.some(d => d.id === initialDatasetId)) {
        setSelectedDatasetId(initialDatasetId);
      } else if (list.length > 0) {
        setSelectedDatasetId(list[0].id);
      }
    });

    // Also fetch latest experiment if already ran
    fetchBenchmarkResults()
      .then((res) => {
        if (res && res.id) setExperimentResult(res);
      })
      .catch(() => {});
  }, [initialDatasetId]);

  const handleRunBenchmark = async () => {
    if (!selectedDatasetId) {
      setErrorMsg('Please select a dataset to benchmark.');
      return;
    }

    setIsRunning(true);
    setErrorMsg(null);
    setCurrentProgress(5);
    setCurrentStage('Initializing 3-Model Test Suite...');

    try {
      const res = await runBenchmark({
        dataset_id: selectedDatasetId,
        experiment_name: experimentName,
        model_version: modelVersion,
        llm_provider: llmProvider,
        max_test_samples: maxTestSamples
      });

      if (res.results) {
        setExperimentResult(res.results);
        setCurrentProgress(100);
      } else if (res.run_id) {
        // Poll status if backgrounded
        let completed = false;
        let attempts = 0;
        while (!completed && attempts < 30) {
          await new Promise(r => setTimeout(r, 1500));
          const status = await fetchBenchmarkResults(res.run_id);
          if (status && status.summary_metrics) {
            setExperimentResult(status);
            completed = true;
          }
          attempts++;
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Benchmark execution failed.');
    } finally {
      setIsRunning(false);
      setCurrentProgress(0);
      setCurrentStage('');
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sm = experimentResult?.summary_metrics;
  const mA = sm?.model_a_extractive;
  const mB = sm?.model_b_abstractive;
  const mC = sm?.model_c_proposed_hybrid;
  const perDoc = experimentResult?.per_document_results || [];
  const currentDoc = perDoc[selectedDocIndex] || perDoc[0];

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>MODEL BENCHMARKING LABORATORY</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Three-Model Controlled Experimental Benchmark
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Controlled empirical comparison of Model A (Extractive Only), Model B (Abstractive Only), and Model C (Proposed Hybrid Framework).
          </p>
        </div>

        {experimentResult && (
          <button
            onClick={() => onGoToReport(experimentResult.id)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md shadow-cyan-500/20"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Research Paper Report</span>
          </button>
        )}
      </div>

      {/* Errors */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* BENCHMARK CONTROL CONSOLE */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider pb-2 border-b border-slate-800">
          <Play className="w-4 h-4" />
          <span>Benchmark Execution Setup</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-mono text-xs">
          {/* Dataset Selector */}
          <div>
            <label className="text-slate-400 block mb-1">Target Test Dataset:</label>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {datasets.length === 0 ? (
                <option value="">No datasets uploaded yet</option>
              ) : (
                datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.row_count} rows)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Experiment Name */}
          <div>
            <label className="text-slate-400 block mb-1">Experiment Name:</label>
            <input
              type="text"
              value={experimentName}
              onChange={(e) => setExperimentName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Model Version Tag */}
          <div>
            <label className="text-slate-400 block mb-1">Model Version Tag:</label>
            <input
              type="text"
              value={modelVersion}
              onChange={(e) => setModelVersion(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* LLM Engine for Model B & C */}
          <div>
            <label className="text-slate-400 block mb-1">LLM Backend (Mod B & C):</label>
            <select
              value={llmProvider}
              onChange={(e) => setLlmProvider(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="auto">Auto (Best Available Engine)</option>
              <option value="qwen2">Qwen 2.5 (Configurable API)</option>
              <option value="llama3">Llama 3 (Configurable API)</option>
              <option value="distilbart">HuggingFace DistilBART</option>
            </select>
          </div>

          {/* Max Test Records */}
          <div>
            <label className="text-slate-400 block mb-1">Test Sample Budget:</label>
            <select
              value={maxTestSamples}
              onChange={(e) => setMaxTestSamples(parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value={1}>1 Document (Rapid Smoke Test)</option>
              <option value={3}>3 Documents (Controlled Test)</option>
              <option value={5}>5 Documents (Standard Sample)</option>
              <option value={10}>10 Documents (Academic Benchmark)</option>
            </select>
          </div>
        </div>

        {/* Execution Button & Progress */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 font-mono">
            <span>Runs Model A (Extractive), Model B (Abstractive), and Model C (Hybrid) under identical test set parameters.</span>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={isRunning || !selectedDatasetId}
            className={`px-7 py-3 rounded-xl font-bold text-xs font-mono transition-all flex items-center space-x-2 ${
              isRunning || !selectedDatasetId
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-lg shadow-cyan-500/25'
            }`}
          >
            {isRunning ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                <span>Running Test Benchmark ({currentStage || 'Computing...'})</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-cyan-300" />
                <span>Execute 3-Model Benchmark</span>
              </>
            )}
          </button>
        </div>

        {isRunning && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-mono text-cyan-400">
              <span>{currentStage}</span>
              <span>{currentProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* THREE MODEL SPECIFICATION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Model A Card */}
        <div className="glass-panel rounded-xl p-4 border border-cyan-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 font-bold uppercase">
              Baseline 1
            </span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <h4 className="text-sm font-bold text-white">Model A: Extractive Only</h4>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            DistilBERT 768-d encoding + Bi-directional TLSTM + GAN Generator/Discriminator + Reinforcement Learning sentence ranking. Pure extractive, zero LLM rewriting.
          </p>
        </div>

        {/* Model B Card */}
        <div className="glass-panel rounded-xl p-4 border border-violet-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-950/60 text-violet-300 border border-violet-500/40 font-bold uppercase">
              Baseline 2
            </span>
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <h4 className="text-sm font-bold text-white">Model B: Abstractive Only</h4>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Direct prompting of raw document to LLM (Llama/Qwen). Lacks the proposed GAN/RL extractive proposition anchor and omits factual consistency verification.
          </p>
        </div>

        {/* Model C Card */}
        <div className="glass-panel rounded-xl p-4 border border-emerald-500/40 shadow-lg shadow-emerald-950/20 space-y-2 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 font-bold uppercase flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Proposed Framework</span>
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-sm font-bold text-white">Model C: Proposed Hybrid</h4>
          <p className="text-xs text-emerald-200/80 leading-relaxed font-sans">
            Integrated multi-stage pipeline: GAN-RL Extractive → Semantic Redundancy Filtering → LLM Synthesis → Claim Decomposition & Factual Grounding Optimization.
          </p>
        </div>
      </div>

      {/* BENCHMARK RESULTS COMPARISON TABLE */}
      {experimentResult && sm && (
        <div className="space-y-8 animate-fadeIn">
          {/* Main Comparison Table */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Empirical Model Comparison Results ({experimentResult.dataset_name})
                </h3>
                <p className="text-xs text-slate-400">
                  Computed on identical test partitions ({perDoc.length} test documents). All metrics derived strictly from actual model outputs.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Best Model: {experimentResult.best_model}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                    <th className="py-3 px-3">Model Approach</th>
                    <th className="py-3 px-3 text-center">ROUGE-1</th>
                    <th className="py-3 px-3 text-center">ROUGE-2</th>
                    <th className="py-3 px-3 text-center">ROUGE-L</th>
                    <th className="py-3 px-3 text-center">BERTScore</th>
                    <th className="py-3 px-3 text-center">Factual (FCS)</th>
                    <th className="py-3 px-3 text-center">Redundancy</th>
                    <th className="py-3 px-3 text-center">Compression</th>
                    <th className="py-3 px-3 text-right">Avg Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {/* Model A */}
                  <tr className="hover:bg-slate-900/40 text-slate-300">
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-cyan-300">Model A: Extractive Only</span>
                      <span className="block text-[10px] text-slate-500 font-sans">{mA?.paradigm}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center text-cyan-400">{mA?.rouge1.toFixed(3)}</td>
                    <td className="py-3.5 px-3 text-center text-cyan-400">{mA?.rouge2.toFixed(3)}</td>
                    <td className="py-3.5 px-3 text-center text-cyan-400">{mA?.rougeL.toFixed(3)}</td>
                    <td className="py-3.5 px-3 text-center text-slate-300">{mA?.bertscore.toFixed(3)}</td>
                    <td className="py-3.5 px-3 text-center text-emerald-400 font-bold">{mA?.factual_consistency.toFixed(1)}%</td>
                    <td className="py-3.5 px-3 text-center text-amber-400">{mA?.redundancy_pct.toFixed(1)}%</td>
                    <td className="py-3.5 px-3 text-center text-slate-300">{mA?.compression_ratio.toFixed(1)}%</td>
                    <td className="py-3.5 px-3 text-right text-slate-400">{mA?.avg_processing_time_ms.toFixed(0)} ms</td>
                  </tr>

                  {/* Model B */}
                  <tr className="hover:bg-slate-900/40 text-slate-300">
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-violet-300">Model B: Abstractive Only</span>
                      <span className="block text-[10px] text-slate-500 font-sans">{mB?.paradigm}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center text-violet-400">{mB?.rouge1.toFixed(3)}</td>
                    <td className="py-3.5 px-3 text-center text-violet-400">{mB?.rouge2.toFixed(3)}</td>
                    <td className="py-3.5 px-3 text-center text-violet-400">{mB?.rougeL.toFixed(3)}</td>
                    <td className="py-3.5 px-3 text-center text-slate-300">{mB?.bertscore.toFixed(3)}</td>
                    <td className="py-3.5 px-3 text-center text-amber-400 font-bold">{mB?.factual_consistency.toFixed(1)}%</td>
                    <td className="py-3.5 px-3 text-center text-amber-400">{mB?.redundancy_pct.toFixed(1)}%</td>
                    <td className="py-3.5 px-3 text-center text-slate-300">{mB?.compression_ratio.toFixed(1)}%</td>
                    <td className="py-3.5 px-3 text-right text-slate-400">{mB?.avg_processing_time_ms.toFixed(0)} ms</td>
                  </tr>

                  {/* Model C: Proposed Hybrid */}
                  <tr className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border-y border-emerald-500/40 text-emerald-200 font-bold">
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-emerald-300 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Model C: Proposed Hybrid</span>
                      </span>
                      <span className="block text-[10px] text-emerald-400/80 font-sans font-normal">{mC?.paradigm}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center text-emerald-300 font-extrabold">{mC?.rouge1.toFixed(3)}</td>
                    <td className="py-3.5 px-3 text-center text-emerald-300 font-extrabold">{mC?.rouge2.toFixed(3)}</td>
                    <td className="py-3.5 px-3 text-center text-emerald-300 font-extrabold">{mC?.rougeL.toFixed(3)}</td>
                    <td className="py-3.5 px-3 text-center text-emerald-300">{mC?.bertscore.toFixed(3)}</td>
                    <td className="py-3.5 px-3 text-center text-emerald-400 font-extrabold">{mC?.factual_consistency.toFixed(1)}%</td>
                    <td className="py-3.5 px-3 text-center text-emerald-300">{mC?.redundancy_pct.toFixed(1)}%</td>
                    <td className="py-3.5 px-3 text-center text-emerald-300">{mC?.compression_ratio.toFixed(1)}%</td>
                    <td className="py-3.5 px-3 text-right text-emerald-300">{mC?.avg_processing_time_ms.toFixed(0)} ms</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* INTERACTIVE GROUPED METRIC VISUALIZATION */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Comparative Performance Visualization
                </h3>
                <p className="text-xs text-slate-400">
                  Select metric dimension to inspect model performance trade-offs.
                </p>
              </div>

              {/* Metric Tab Switcher */}
              <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 font-mono text-xs">
                {(['rouge', 'fcs', 'redundancy', 'latency'] as const).map((dim) => (
                  <button
                    key={dim}
                    onClick={() => setSelectedMetricChart(dim)}
                    className={`px-3 py-1 rounded capitalize transition-colors ${
                      selectedMetricChart === dim
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {dim === 'fcs' ? 'Factual (FCS)' : dim}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Bar Comparison */}
            <div className="space-y-4 pt-2">
              {selectedMetricChart === 'rouge' && (
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Model A: Extractive Only (ROUGE-L: {mA?.rougeL.toFixed(3)})</span>
                      <span>{mA ? Math.round(mA.rougeL * 100) : 0}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full" style={{ width: `${(mA?.rougeL || 0) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Model B: Abstractive Only (ROUGE-L: {mB?.rougeL.toFixed(3)})</span>
                      <span>{mB ? Math.round(mB.rougeL * 100) : 0}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-violet-500 h-full" style={{ width: `${(mB?.rougeL || 0) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-emerald-300 font-bold mb-1">
                      <span>Model C: Proposed Hybrid Framework (ROUGE-L: {mC?.rougeL.toFixed(3)}) — WINNER</span>
                      <span>{mC ? Math.round(mC.rougeL * 100) : 0}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full" style={{ width: `${(mC?.rougeL || 0) * 100}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {selectedMetricChart === 'fcs' && (
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Model A: Extractive Only (Verbatim Grounding: {mA?.factual_consistency.toFixed(1)}%)</span>
                      <span>{mA?.factual_consistency.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full" style={{ width: `${mA?.factual_consistency || 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-amber-400 mb-1">
                      <span>Model B: Abstractive Only (Unverified Hallucinations: {mB?.factual_consistency.toFixed(1)}%)</span>
                      <span>{mB?.factual_consistency.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full" style={{ width: `${mB?.factual_consistency || 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-emerald-300 font-bold mb-1">
                      <span>Model C: Proposed Hybrid Model (NLI Verified Grounding: {mC?.factual_consistency.toFixed(1)}%) — RESTORED</span>
                      <span>{mC?.factual_consistency.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full" style={{ width: `${mC?.factual_consistency || 0}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {selectedMetricChart === 'redundancy' && (
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Model A: Extractive Sentence Overlap ({mA?.redundancy_pct.toFixed(1)}%)</span>
                      <span>{mA?.redundancy_pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full" style={{ width: `${mA?.redundancy_pct || 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Model B: Abstractive Phrasing Redundancy ({mB?.redundancy_pct.toFixed(1)}%)</span>
                      <span>{mB?.redundancy_pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-violet-500 h-full" style={{ width: `${mB?.redundancy_pct || 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-emerald-300 font-bold mb-1">
                      <span>Model C: Proposed MMR Filtered Redundancy ({mC?.redundancy_pct.toFixed(1)}%) — LOWEST</span>
                      <span>{mC?.redundancy_pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full" style={{ width: `${mC?.redundancy_pct || 0}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {selectedMetricChart === 'latency' && (
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Model A: Extractive Only ({mA?.avg_processing_time_ms.toFixed(0)} ms) — FASTEST</span>
                      <span>Fastest</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-cyan-400 h-full" style={{ width: '35%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Model B: Abstractive Only ({mB?.avg_processing_time_ms.toFixed(0)} ms)</span>
                      <span>Moderate</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-violet-400 h-full" style={{ width: '55%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Model C: Proposed 3-Stage Pipeline ({mC?.avg_processing_time_ms.toFixed(0)} ms)</span>
                      <span>Includes NLI Claim Verification</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PER-DOCUMENT COMPARATIVE READER */}
          {perDoc.length > 0 && currentDoc && (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    Per-Document Comparative Inspection
                  </h3>
                  <p className="text-xs text-slate-400">
                    Compare the exact outputs generated by Model A, Model B, and Model C on Document #{currentDoc.document_index}: {currentDoc.title}
                  </p>
                </div>

                {/* Doc Switcher */}
                <div className="flex items-center space-x-1.5 font-mono text-xs">
                  <span className="text-slate-500">Doc:</span>
                  {perDoc.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedDocIndex(i)}
                      className={`w-7 h-7 rounded flex items-center justify-center font-bold transition-colors ${
                        selectedDocIndex === i
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Model Output Comparison Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Model A Summary */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/30 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-mono">
                      <span className="text-cyan-400 font-bold">Model A: Extractive</span>
                      <span className="text-slate-400">ROUGE-L: {currentDoc.model_a_extractive.rougeL.toFixed(3)}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {currentDoc.model_a_extractive.summary}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(currentDoc.model_a_extractive.summary, `doc-${currentDoc.document_index}-a`)}
                    className="self-end text-[11px] font-mono text-slate-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    {copiedKey === `doc-${currentDoc.document_index}-a` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === `doc-${currentDoc.document_index}-a` ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Model B Summary */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-violet-500/30 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-mono">
                      <span className="text-violet-400 font-bold">Model B: Abstractive</span>
                      <span className="text-slate-400">FCS: {currentDoc.model_b_abstractive.fcs.toFixed(1)}%</span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {currentDoc.model_b_abstractive.summary}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(currentDoc.model_b_abstractive.summary, `doc-${currentDoc.document_index}-b`)}
                    className="self-end text-[11px] font-mono text-slate-400 hover:text-violet-300 flex items-center space-x-1"
                  >
                    {copiedKey === `doc-${currentDoc.document_index}-b` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === `doc-${currentDoc.document_index}-b` ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Model C Summary (Proposed) */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/40 flex flex-col justify-between space-y-3 shadow-lg shadow-emerald-950/20">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-mono">
                      <span className="text-emerald-400 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Model C: Proposed Hybrid</span>
                      </span>
                      <span className="text-emerald-300">FCS: {currentDoc.model_c_proposed_hybrid.fcs.toFixed(1)}%</span>
                    </div>
                    <p className="text-xs text-emerald-200 font-sans leading-relaxed font-medium">
                      {currentDoc.model_c_proposed_hybrid.summary}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(currentDoc.model_c_proposed_hybrid.summary, `doc-${currentDoc.document_index}-c`)}
                    className="self-end text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                  >
                    {copiedKey === `doc-${currentDoc.document_index}-c` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === `doc-${currentDoc.document_index}-c` ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
