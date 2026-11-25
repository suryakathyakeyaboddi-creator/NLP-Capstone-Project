import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Award, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  ArrowLeft,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { ResearchReportData } from '../types';
import { generateResearchReport, getReportCsvDownloadUrl } from '../services/api';
import { exportResearchReportPdf } from '../services/pdfExport';

interface ReportPageProps {
  experimentId: string | null;
  onGoBackToBenchmark: () => void;
}

export const ReportPage: React.FC<ReportPageProps> = ({
  experimentId,
  onGoBackToBenchmark
}) => {
  const [report, setReport] = useState<ResearchReportData | null>(null);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!experimentId) {
      setErrorMsg('No experiment selected to generate a research report. Please select an experiment from the Benchmarking or History view.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    generateResearchReport(experimentId)
      .then((data) => setReport(data))
      .catch((err) => setErrorMsg(err.message || 'Failed to generate research report.'))
      .finally(() => setIsLoading(false));
  }, [experimentId]);

  const handleDownloadPdf = () => {
    if (!report) return;
    const reportWithNotes = { ...report, custom_notes: customNotes };
    exportResearchReportPdf(reportWithNotes);
  };

  const handleDownloadCsv = () => {
    if (!experimentId) return;
    const csvUrl = getReportCsvDownloadUrl(experimentId);
    const link = document.createElement('a');
    link.href = csvUrl;
    link.download = `neurosum_benchmark_report_${experimentId.substring(0, 8)}.csv`;
    link.click();
  };

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-20">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onGoBackToBenchmark}
          className="flex items-center space-x-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to Benchmarking</span>
        </button>

        {report && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors shadow-md shadow-cyan-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Publication PDF</span>
            </button>
            <button
              onClick={handleDownloadCsv}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV Data</span>
            </button>
          </div>
        )}
      </div>

      {errorMsg ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-16 text-slate-400 font-mono text-xs animate-pulse">
          Synthesizing comprehensive research evaluation report...
        </div>
      ) : report ? (
        <div className="space-y-8 animate-fadeIn">
          {/* ACADEMIC PAPER TITLE BANNER */}
          <div className="glass-panel rounded-2xl p-8 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
                ACADEMIC BENCHMARK REPORT • {report.report_id}
              </span>
              <span className="text-xs font-mono text-slate-500">
                {report.generated_at}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {report.project_title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-slate-400 pt-1">
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Dataset: <strong>{report.dataset_info.name}</strong>
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Test Partition: <strong>{report.dataset_info.test_partition_size} Docs</strong>
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Model: <strong>{report.experimental_methodology.model_version}</strong>
              </span>
            </div>
          </div>

          {/* 1. DATASET & PARTITIONING SPECIFICATION */}
          <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-3 font-mono text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-cyan-400">
              1. Dataset Partitioning & Leakage Prevention
            </h3>
            <p className="text-slate-300 font-sans leading-relaxed">
              Ingested dataset <strong>{report.dataset_info.name}</strong> containing {report.dataset_info.total_rows} total samples was partitioned into strict disjoint subsets. No document in the test partition was observed during sentence feature extraction or model tuning.
            </p>
            <div className="grid grid-cols-3 gap-3 text-center pt-2">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">TRAIN SUBSET</span>
                <span className="text-cyan-400 font-bold">{report.dataset_info.split_distribution.train}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">VALIDATION SUBSET</span>
                <span className="text-blue-400 font-bold">{report.dataset_info.split_distribution.validation}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">EVALUATED TEST SUBSET</span>
                <span className="text-emerald-400 font-bold">{report.dataset_info.split_distribution.test} ({report.dataset_info.test_partition_size} Docs)</span>
              </div>
            </div>
          </div>

          {/* 2. THREE-MODEL BENCHMARK RESULTS TABLE */}
          <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-violet-400">
              2. Quantitative Baseline & Proposed Model Comparison
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                    <th className="py-2.5 px-3">Model Approach</th>
                    <th className="py-2.5 px-3 text-center">ROUGE-1</th>
                    <th className="py-2.5 px-3 text-center">ROUGE-2</th>
                    <th className="py-2.5 px-3 text-center">ROUGE-L</th>
                    <th className="py-2.5 px-3 text-center">BERTScore</th>
                    <th className="py-2.5 px-3 text-center">FCS Score</th>
                    <th className="py-2.5 px-3 text-center">Redundancy</th>
                    <th className="py-2.5 px-3 text-right">Avg Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {report.summary_results_table.map((row, idx) => (
                    <tr
                      key={idx}
                      className={row.is_proposed ? 'bg-emerald-500/10 border-y border-emerald-500/40 text-emerald-200 font-bold' : 'text-slate-300'}
                    >
                      <td className="py-3 px-3">
                        <span className={row.is_proposed ? 'text-emerald-300' : 'text-slate-200'}>
                          {row.approach}
                        </span>
                        <span className="block text-[10px] text-slate-500 font-sans font-normal">{row.paradigm}</span>
                      </td>
                      <td className="py-3 px-3 text-center">{row.rouge1}</td>
                      <td className="py-3 px-3 text-center">{row.rouge2}</td>
                      <td className="py-3 px-3 text-center">{row.rougeL}</td>
                      <td className="py-3 px-3 text-center">{row.bertscore}</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-bold">{row.factual_consistency}</td>
                      <td className="py-3 px-3 text-center">{row.redundancy}</td>
                      <td className="py-3 px-3 text-right">{row.latency_ms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. DISCUSSION OF EMPIRICAL FINDINGS */}
          <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-3 font-mono text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-cyan-400">
              3. Discussion of Empirical Findings
            </h3>
            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              {report.findings_discussion}
            </p>
          </div>

          {/* 4. METHODOLOGICAL LIMITATIONS */}
          <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-3 font-mono text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-amber-400">
              4. Methodological Limitations & Future Scope
            </h3>
            <pre className="whitespace-pre-wrap font-sans text-xs text-slate-400 leading-relaxed">
              {report.limitations}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
};
