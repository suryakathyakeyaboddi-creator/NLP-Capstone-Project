import React, { useState } from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sliders, 
  BarChart2, 
  Zap, 
  Award, 
  Hash,
  Info
} from 'lucide-react';
import { SentenceScoreItem } from '../types';

interface ExtractiveViewProps {
  sentences: SentenceScoreItem[];
  extractiveSummary: string;
  telemetry?: any;
}

export const ExtractiveView: React.FC<ExtractiveViewProps> = ({
  sentences,
  extractiveSummary,
  telemetry
}) => {
  const [copied, setCopied] = useState(false);
  const [filterSelectedOnly, setFilterSelectedOnly] = useState(false);
  const [hoveredSentenceIdx, setHoveredSentenceIdx] = useState<number | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(extractiveSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayedSentences = filterSelectedOnly
    ? sentences.filter(s => s.selected)
    : sentences;

  const selectedCount = sentences.filter(s => s.selected).length;

  return (
    <div className="space-y-6">
      {/* Module 1 Header Card */}
      <div className="glass-panel rounded-xl p-5 border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            <span>MODULE 1 DEEP DIVE</span>
          </div>
          <h3 className="text-lg font-bold text-white">
            GAN-Based Extractive Summarization with Reinforcement Learning
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            DistilBERT 768-d sentence encoding → Bi-directional Temporal-LSTM context → GAN Generator/Discriminator → REINFORCE policy credit assignment.
          </p>
        </div>

        {/* Telemetry Stats */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-500 block text-[10px]">CANDIDATE / SELECTED</span>
            <span className="text-cyan-400 font-bold">{sentences.length} Total / {selectedCount} Selected</span>
          </div>
          {telemetry?.gan_metrics?.discriminator_fidelity && (
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <span className="text-slate-500 block text-[10px]">DISCRIMINATOR FIDELITY</span>
              <span className="text-emerald-400 font-bold">{(telemetry.gan_metrics.discriminator_fidelity * 100).toFixed(1)}%</span>
            </div>
          )}
          {telemetry?.rl_metrics?.episode_reward && (
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <span className="text-slate-500 block text-[10px]">RL EPISODE REWARD</span>
              <span className="text-violet-400 font-bold">{telemetry.rl_metrics.episode_reward.toFixed(3)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Extractive Summary Text Output Card */}
      <div className="glass-panel rounded-xl p-5 border border-cyan-500/30 shadow-lg shadow-cyan-950/20">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Synthesized Extractive Summary
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              ({extractiveSummary.split(' ').filter(Boolean).length} words)
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed font-sans">
          {extractiveSummary || 'No extractive summary generated yet.'}
        </p>
      </div>

      {/* Interactive Sentence Ranking & Feature Breakdown Table */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">
              Sentence Salience Scoring & Multi-Feature Decomposition
            </h4>
            <p className="text-xs text-slate-400">
              Inspect how DistilBERT embeddings, TLSTM discourse, GAN generator, and RL policy score each sentence.
            </p>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-xs font-mono text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filterSelectedOnly}
                onChange={(e) => setFilterSelectedOnly(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/30"
              />
              <span>Show Selected Only ({selectedCount})</span>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                <th className="py-2.5 px-3">Idx</th>
                <th className="py-2.5 px-3 w-1/2 font-sans font-semibold">Sentence Text</th>
                <th className="py-2.5 px-3 text-center">DistilBERT</th>
                <th className="py-2.5 px-3 text-center">TLSTM</th>
                <th className="py-2.5 px-3 text-center">GAN Score</th>
                <th className="py-2.5 px-3 text-center">RL Reward</th>
                <th className="py-2.5 px-3 text-center">Hybrid Score</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedSentences.map((s) => {
                const isSelected = s.selected;
                return (
                  <tr
                    key={s.index}
                    onMouseEnter={() => setHoveredSentenceIdx(s.index)}
                    onMouseLeave={() => setHoveredSentenceIdx(null)}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/10 hover:bg-cyan-500/15'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <td className="py-3 px-3 text-slate-400 font-bold">
                      #{s.index + 1}
                    </td>
                    <td className="py-3 px-3 font-sans text-xs text-slate-200 leading-normal">
                      {s.text}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-300 font-mono">
                      {s.distilbert_norm.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-300 font-mono">
                      {s.tlstm_salience.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center text-cyan-400 font-mono font-semibold">
                      {s.gan_score.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center text-violet-400 font-mono font-semibold">
                      {s.rl_reward.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <span className="font-bold text-white">{s.importance_score.toFixed(3)}</span>
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isSelected ? 'bg-cyan-400' : 'bg-slate-600'}`}
                            style={{ width: `${Math.min(100, s.importance_score * 80)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isSelected ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Rank #{s.rank}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">
                          Rank #{s.rank}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
