import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Layers, 
  Clock, 
  CheckCircle2, 
  FileSpreadsheet, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { SummarizeResponse } from '../types';
import { exportSummaryToPdf } from '../services/pdfExport';

interface ComparisonViewProps {
  data: SummarizeResponse;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ data }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeComparisonTab, setActiveComparisonTab] = useState<'sideBySide' | 'tabs'>('sideBySide');
  const [selectedTextTab, setSelectedTextTab] = useState<'final' | 'abstractive' | 'extractive' | 'original'>('final');

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadTxt = () => {
    const content = `NEUROSUM AI — RESEARCH SUMMARY REPORT
Title: ${data.title}
Date: ${new Date().toISOString()}

==================================================
1. FINAL OPTIMIZED & FACTUALLY VERIFIED SUMMARY
==================================================
${data.final_summary}

==================================================
2. ABSTRACTIVE SUMMARY (PRE-VERIFICATION)
==================================================
${data.abstractive_summary}

==================================================
3. GAN-SELECTED EXTRACTIVE SUMMARY
==================================================
${data.extractive_summary}

==================================================
RESEARCH EVALUATION METRICS
==================================================
ROUGE-1: ${data.metrics.rouge.rouge1}
ROUGE-2: ${data.metrics.rouge.rouge2}
ROUGE-L: ${data.metrics.rouge.rougeL}
Semantic Cosine Similarity / BERTScore: ${data.metrics.semantic_similarity}
Factual Consistency Score (FCS): ${data.metrics.factual_consistency_score}%
Compression Ratio: ${data.metrics.compression_ratio}%
Word Count: Original (${data.metrics.word_count_original}) -> Final (${data.metrics.word_count_final})
Total Latency: ${data.metrics.execution_time_ms.total_pipeline} ms
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(data.title || 'NeuroSum').toLowerCase().replace(/\s+/g, '_')}_summary.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(data.title || 'NeuroSum').toLowerCase().replace(/\s+/g, '_')}_data.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const m = data.metrics;

  return (
    <div className="space-y-8">
      {/* Header and Download Export Bar */}
      <div className="glass-panel rounded-xl p-5 border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>RESEARCH RESULTS & EVALUATION</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-wide">
            Multifaceted Benchmark Comparison
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Comparative quantitative evaluation computed strictly from system outputs.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportSummaryToPdf(data)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors shadow-md shadow-cyan-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleDownloadTxt}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors border border-slate-700"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export TXT</span>
          </button>
          <button
            onClick={handleDownloadJson}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors border border-slate-700"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-violet-400" />
            <span>JSON Data</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* ROUGE-1 */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">ROUGE-1 F1</span>
          <div className="text-xl font-bold font-mono text-cyan-400">
            {m.rouge.rouge1.toFixed(3)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Unigram overlap</span>
        </div>

        {/* ROUGE-2 */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">ROUGE-2 F1</span>
          <div className="text-xl font-bold font-mono text-blue-400">
            {m.rouge.rouge2.toFixed(3)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Bigram fidelity</span>
        </div>

        {/* ROUGE-L */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">ROUGE-L F1</span>
          <div className="text-xl font-bold font-mono text-indigo-400">
            {m.rouge.rougeL.toFixed(3)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Longest common subseq</span>
        </div>

        {/* BERTScore / Semantic Sim */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Semantic Sim</span>
          <div className="text-xl font-bold font-mono text-violet-400">
            {m.semantic_similarity.toFixed(3)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Dense embedding cosine</span>
        </div>

        {/* Factual Consistency */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">FCS Score</span>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {m.factual_consistency_score}%
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{m.supported_claims_count}/{m.total_claims_count} claims verified</span>
        </div>

        {/* Compression Ratio */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Compression</span>
          <div className="text-xl font-bold font-mono text-amber-400">
            {m.compression_ratio}%
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{m.word_count_original} → {m.word_count_final} words</span>
        </div>
      </div>

      {/* Latency Breakdown Bar */}
      <div className="glass-panel rounded-xl p-4 border border-slate-800 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="flex items-center space-x-1.5 text-slate-300 font-semibold">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>End-to-End Latency Breakdown ({m.execution_time_ms.total_pipeline} ms Total):</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between">
            <span className="text-slate-400">Module 1 (Extractive):</span>
            <span className="text-cyan-400 font-bold">{m.execution_time_ms.module1_extractive} ms</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between">
            <span className="text-slate-400">Module 2 (Abstractive):</span>
            <span className="text-violet-400 font-bold">{m.execution_time_ms.module2_abstractive} ms</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between">
            <span className="text-slate-400">Module 3 (Verification):</span>
            <span className="text-emerald-400 font-bold">{m.execution_time_ms.module3_verification} ms</span>
          </div>
        </div>
      </div>

      {/* 4-Way Document Comparison Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-white tracking-wide">
            Comparative Summary Text Progression
          </h4>
          <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveComparisonTab('sideBySide')}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                activeComparisonTab === 'sideBySide' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
              }`}
            >
              Side-by-Side (4 Columns)
            </button>
            <button
              onClick={() => setActiveComparisonTab('tabs')}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                activeComparisonTab === 'tabs' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
              }`}
            >
              Tabbed Reader
            </button>
          </div>
        </div>

        {activeComparisonTab === 'sideBySide' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* 1. Original Document */}
            <div className="glass-panel rounded-xl p-4 border border-slate-800 flex flex-col h-[420px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 font-mono uppercase">
                  1. Original Source
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {m.word_count_original}w
                </span>
              </div>
              <div className="overflow-y-auto pr-2 text-xs text-slate-400 leading-relaxed font-sans flex-1">
                {data.original_text}
              </div>
            </div>

            {/* 2. Extractive Summary */}
            <div className="glass-panel rounded-xl p-4 border border-cyan-500/30 flex flex-col h-[420px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-cyan-400 font-mono uppercase">
                  2. Extractive Core
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {m.word_count_extractive}w
                  </span>
                  <button
                    onClick={() => handleCopy(data.extractive_summary, 'ext')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedType === 'ext' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto pr-2 text-xs text-slate-300 leading-relaxed font-sans flex-1">
                {data.extractive_summary}
              </div>
            </div>

            {/* 3. Abstractive Summary */}
            <div className="glass-panel rounded-xl p-4 border border-violet-500/30 flex flex-col h-[420px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-violet-400 font-mono uppercase">
                  3. Abstractive Draft
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {m.word_count_abstractive}w
                  </span>
                  <button
                    onClick={() => handleCopy(data.abstractive_summary, 'abs')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedType === 'abs' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto pr-2 text-xs text-slate-300 leading-relaxed font-sans flex-1">
                {data.abstractive_summary}
              </div>
            </div>

            {/* 4. Final Optimized Summary */}
            <div className="glass-panel rounded-xl p-4 border border-emerald-500/40 shadow-lg shadow-emerald-950/20 flex flex-col h-[420px] bg-slate-900/60">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-emerald-400 font-mono uppercase flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>4. Final Grounded</span>
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {m.word_count_final}w
                  </span>
                  <button
                    onClick={() => handleCopy(data.final_summary, 'final')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedType === 'final' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto pr-2 text-xs text-emerald-200 leading-relaxed font-sans flex-1 font-medium">
                {data.final_summary}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-xl p-5 border border-slate-800">
            <div className="flex space-x-2 border-b border-slate-800 pb-3 mb-4">
              <button
                onClick={() => setSelectedTextTab('final')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
                  selectedTextTab === 'final' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Final Grounded ({m.word_count_final}w)
              </button>
              <button
                onClick={() => setSelectedTextTab('abstractive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
                  selectedTextTab === 'abstractive' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Abstractive Draft ({m.word_count_abstractive}w)
              </button>
              <button
                onClick={() => setSelectedTextTab('extractive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
                  selectedTextTab === 'extractive' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Extractive Core ({m.word_count_extractive}w)
              </button>
              <button
                onClick={() => setSelectedTextTab('original')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
                  selectedTextTab === 'original' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Original Source ({m.word_count_original}w)
              </button>
            </div>

            <div className="text-sm leading-relaxed text-slate-200">
              {selectedTextTab === 'final' && data.final_summary}
              {selectedTextTab === 'abstractive' && data.abstractive_summary}
              {selectedTextTab === 'extractive' && data.extractive_summary}
              {selectedTextTab === 'original' && data.original_text}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
