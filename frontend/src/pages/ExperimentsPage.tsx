import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  ArrowRight, 
  BarChart2, 
  FileText, 
  Sliders, 
  Sparkles,
  GitCompare,
  AlertCircle
} from 'lucide-react';
import { 
  ExperimentHistoryItem, 
  ExperimentComparisonResponse 
} from '../types';
import { 
  fetchExperimentHistory, 
  compareExperiments 
} from '../services/api';

interface ExperimentsPageProps {
  onGoToReport: (experimentId: string) => void;
  onGoToBenchmark: () => void;
}

export const ExperimentsPage: React.FC<ExperimentsPageProps> = ({
  onGoToReport,
  onGoToBenchmark
}) => {
  const [history, setHistory] = useState<ExperimentHistoryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ExperimentComparisonResponse | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchExperimentHistory()
      .then((items) => {
        setHistory(items);
        // Pre-select first two if available
        if (items.length >= 2) {
          setSelectedIds([items[0].id, items[1].id]);
        } else if (items.length === 1) {
          setSelectedIds([items[0].id]);
        }
      })
      .catch((e) => setErrorMsg('Failed to load experiment history.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleRunComparison = async () => {
    if (selectedIds.length < 2) {
      setErrorMsg('Please select at least two experiments to perform a version-to-version comparison.');
      return;
    }

    setIsComparing(true);
    setErrorMsg(null);
    try {
      const res = await compareExperiments(selectedIds);
      setComparison(res);
    } catch (e: any) {
      setErrorMsg(e.message || 'Comparison failed.');
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>EXPERIMENT HISTORY & REGISTRY</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Model Versioning & Experiment Progression
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Inspect past experimental runs, compare performance deltas between model iterations, and track ablation improvements.
          </p>
        </div>

        <button
          onClick={onGoToBenchmark}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md shadow-cyan-500/20"
        >
          <span>Run New Benchmark</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Errors */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* EXPERIMENT HISTORY TABLE & SELECTOR */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Persistent Experiment Registry
            </h3>
            <p className="text-xs text-slate-400">
              Select 2 or more checkpoints to compute delta analysis (ROUGE improvement, FCS gain, latency trade-off).
            </p>
          </div>

          <button
            onClick={handleRunComparison}
            disabled={selectedIds.length < 2 || isComparing}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
              selectedIds.length < 2 || isComparing
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>{isComparing ? 'Comparing...' : `Compare Selected (${selectedIds.length})`}</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-400 font-mono text-xs animate-pulse">
            Loading experiment registry...
          </div>
        ) : history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                  <th className="py-3 px-3 w-10 text-center">Select</th>
                  <th className="py-3 px-3">Date & ID</th>
                  <th className="py-3 px-3">Experiment Name</th>
                  <th className="py-3 px-3">Dataset</th>
                  <th className="py-3 px-3">Version</th>
                  <th className="py-3 px-3">LLM</th>
                  <th className="py-3 px-3 text-center">ROUGE-L</th>
                  <th className="py-3 px-3 text-center">FCS Score</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((exp) => {
                  const isChecked = selectedIds.includes(exp.id);
                  const mC = exp.summary_metrics?.model_c_proposed_hybrid;

                  return (
                    <tr
                      key={exp.id}
                      onClick={() => handleToggleSelect(exp.id)}
                      className={`hover:bg-slate-900/40 transition-colors cursor-pointer ${
                        isChecked ? 'bg-cyan-500/10' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(exp.id)}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/30"
                        />
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        <div>{new Date(exp.created_at).toLocaleDateString()}</div>
                        <span className="text-[10px] text-slate-600">{exp.id.substring(0, 8)}</span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-200">
                        {exp.name}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {exp.dataset_name}
                      </td>
                      <td className="py-3 px-3 text-cyan-400">
                        {exp.model_version}
                      </td>
                      <td className="py-3 px-3 text-violet-400">
                        {exp.llm_provider}
                      </td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-bold">
                        {mC?.rougeL?.toFixed(3) ?? '-'}
                      </td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-bold">
                        {mC?.factual_consistency ? `${mC.factual_consistency.toFixed(1)}%` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onGoToReport(exp.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-mono transition-colors"
                        >
                          Report →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500 font-mono text-xs">
            No experiments logged yet. Execute a 3-Model benchmark to register the first checkpoint.
          </div>
        )}
      </div>

      {/* VERSION-TO-VERSION COMPARISON DELTA VIEW */}
      {comparison && (
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/30 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
                <GitCompare className="w-4 h-4" />
                <span>DELTA ANALYSIS</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Version-to-Version Performance Progression
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Baseline: {comparison.experiments[0]?.model_version} ({comparison.experiments[0]?.name})
            </span>
          </div>

          {/* Diffs Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
            {comparison.diff_analysis.map((item, idx) => {
              const exp = comparison.experiments.find(e => e.id === item.experiment_id);
              if (!exp) return null;

              if (item.is_baseline) {
                return (
                  <div key={item.experiment_id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-400 font-bold">{exp.model_version} (Baseline)</span>
                      <span className="text-[10px] text-slate-500">v{idx + 1}</span>
                    </div>
                    <p className="text-slate-300 font-sans">{exp.name}</p>
                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <div>ROUGE-L: <strong className="text-white">{exp.metrics.rougeL?.toFixed(3)}</strong></div>
                      <div>FCS Score: <strong className="text-white">{exp.metrics.factual_consistency?.toFixed(1)}%</strong></div>
                      <div>Latency: <strong className="text-white">{exp.metrics.avg_processing_time_ms?.toFixed(0)} ms</strong></div>
                    </div>
                  </div>
                );
              }

              const diffR = item.relative_diffs["rougeL"];
              const diffF = item.relative_diffs["factual_consistency"];
              const diffT = item.relative_diffs["avg_processing_time_ms"];

              return (
                <div key={item.experiment_id} className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold">{exp.model_version}</span>
                    <span className="text-[10px] text-slate-500">v{idx + 1}</span>
                  </div>
                  <p className="text-slate-200 font-sans">{exp.name}</p>

                  <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1.5">
                    {/* ROUGE-L Delta */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ROUGE-L Gain:</span>
                      <span className={`font-bold flex items-center space-x-1 ${diffR?.percentage_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {diffR?.percentage_change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{diffR?.percentage_change >= 0 ? `+${diffR.percentage_change}%` : `${diffR.percentage_change}%`}</span>
                      </span>
                    </div>

                    {/* FCS Delta */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Factual FCS Gain:</span>
                      <span className={`font-bold flex items-center space-x-1 ${diffF?.percentage_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {diffF?.percentage_change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{diffF?.percentage_change >= 0 ? `+${diffF.percentage_change}%` : `${diffF.percentage_change}%`}</span>
                      </span>
                    </div>

                    {/* Latency Delta */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Latency Delta:</span>
                      <span className="text-slate-300 font-mono">
                        {diffT?.absolute_diff >= 0 ? `+${diffT.absolute_diff}ms` : `${diffT.absolute_diff}ms`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
