import React, { useState } from 'react';
import { 
  Sparkles, 
  Filter, 
  Copy, 
  Check, 
  Layers, 
  Trash2, 
  ArrowRight, 
  Cpu, 
  FileCode,
  Gauge
} from 'lucide-react';
import { RedundancyAnalysis } from '../types';

interface AbstractiveViewProps {
  abstractiveSummary: string;
  redundancyAnalysis: RedundancyAnalysis;
  modelMetadata?: any;
  extractiveWordCount: number;
  abstractiveWordCount: number;
}

export const AbstractiveView: React.FC<AbstractiveViewProps> = ({
  abstractiveSummary,
  redundancyAnalysis,
  modelMetadata,
  extractiveWordCount,
  abstractiveWordCount
}) => {
  const [copied, setCopied] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(abstractiveSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const compressionRate = extractiveWordCount > 0
    ? Math.round((1 - abstractiveWordCount / extractiveWordCount) * 100)
    : 0;

  const simMatrix = redundancyAnalysis?.similarity_matrix || [];

  return (
    <div className="space-y-6">
      {/* Module 2 Header Card */}
      <div className="glass-panel rounded-xl p-5 border border-violet-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-violet-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>MODULE 2 DEEP DIVE</span>
          </div>
          <h3 className="text-lg font-bold text-white">
            LLM-Based Abstractive Generation & Redundancy Filtering
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Cosine similarity matrix evaluation → Information deduplication → Contextual grounding prompt → Coherent abstractive generation.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500 block text-[10px]">REDUNDANCY REDUCTION</span>
            <span className="text-cyan-400 font-bold">
              {redundancyAnalysis?.redundancy_reduction_rate?.toFixed(1) || 0}%
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500 block text-[10px]">WORD COMPRESSION</span>
            <span className="text-emerald-400 font-bold">{compressionRate}%</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500 block text-[10px]">GENERATOR ENGINE</span>
            <span className="text-violet-400 font-bold truncate max-w-[140px] block">
              {modelMetadata?.llm_provider || 'Neural Synthesizer'}
            </span>
          </div>
        </div>
      </div>

      {/* Abstractive Summary Output Card */}
      <div className="glass-panel rounded-xl p-5 border border-violet-500/30 shadow-lg shadow-violet-950/20">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Generated Abstractive Summary
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              ({abstractiveWordCount} words / Extractive: {extractiveWordCount} words)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPromptModal(!showPromptModal)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Prompt</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed font-sans">
          {abstractiveSummary || 'No abstractive summary generated yet.'}
        </p>

        {showPromptModal && (
          <div className="mt-4 p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
            <span className="text-cyan-400 font-semibold block mb-1">Context Prompt Sent to LLM:</span>
            <pre className="whitespace-pre-wrap break-words text-[11px] text-slate-400">
              {modelMetadata?.prompt_used || 'Prompt formatting with extractive propositions and length constraints.'}
            </pre>
          </div>
        )}
      </div>

      {/* Redundancy Analysis & Similarity Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pruned Redundant Sentences Panel */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white tracking-wide">
              Redundancy Pruning Decisions
            </h4>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Extractive sentences flagged for semantic redundancy above similarity threshold τ = 0.72.
          </p>

          {redundancyAnalysis?.removed_sentences && redundancyAnalysis.removed_sentences.length > 0 ? (
            <div className="space-y-3">
              {redundancyAnalysis.removed_sentences.map((r, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs"
                >
                  <div className="flex items-center justify-between text-red-400 font-mono text-[11px] mb-1">
                    <span className="flex items-center space-x-1">
                      <Trash2 className="w-3 h-3" />
                      <span>Dropped Sentence #{r.index + 1}</span>
                    </span>
                    <span className="bg-red-950/80 px-2 py-0.5 rounded text-[10px]">
                      {r.reason}
                    </span>
                  </div>
                  <p className="text-slate-300 font-sans italic">"{r.text}"</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
              <span className="text-emerald-400 font-semibold block mb-1">Zero Excessive Redundancy</span>
              All candidate extractive sentences exhibit low semantic cross-entropy and were retained for contextual synthesis.
            </div>
          )}

          {/* Retained count indicator */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Retained for Prompt:</span>
            <span className="text-emerald-400 font-bold">
              {redundancyAnalysis?.cleaned_sentences?.length || 0} Sentences
            </span>
          </div>
        </div>

        {/* Semantic Similarity Matrix Heatmap */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center space-x-2 mb-3">
            <Layers className="w-4 h-4 text-violet-400" />
            <h4 className="text-sm font-bold text-white tracking-wide">
              Pairwise Cosine Similarity Heatmap
            </h4>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Cross-sentence semantic distance matrix M_ij. Values close to 1.0 indicate redundant proposition content.
          </p>

          {simMatrix.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="grid gap-1 font-mono text-[11px]" style={{ gridTemplateColumns: `auto repeat(${simMatrix.length}, minmax(36px, 1fr))` }}>
                  {/* Header Row */}
                  <div className="text-slate-500 font-bold p-1">S#</div>
                  {simMatrix.map((_, colIdx) => (
                    <div key={colIdx} className="text-center font-bold text-slate-400 p-1">
                      S{colIdx + 1}
                    </div>
                  ))}

                  {/* Matrix Rows */}
                  {simMatrix.map((row, rowIdx) => (
                    <React.Fragment key={rowIdx}>
                      <div className="text-slate-400 font-bold p-1 flex items-center">
                        S{rowIdx + 1}
                      </div>
                      {row.map((val, colIdx) => {
                        const isDiag = rowIdx === colIdx;
                        const isHigh = val >= 0.70 && !isDiag;
                        return (
                          <div
                            key={colIdx}
                            className={`p-1.5 text-center rounded transition-colors ${
                              isDiag
                                ? 'bg-slate-800 text-slate-500 font-normal'
                                : isHigh
                                ? 'bg-red-500/25 text-red-300 font-bold border border-red-500/40'
                                : val > 0.45
                                ? 'bg-cyan-500/15 text-cyan-300'
                                : 'bg-slate-900/60 text-slate-400'
                            }`}
                            title={`Similarity(S${rowIdx + 1}, S${colIdx + 1}) = ${val}`}
                          >
                            {val.toFixed(2)}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500 font-mono">
              Similarity matrix generated upon processing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
