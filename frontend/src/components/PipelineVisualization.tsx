import React, { useState } from 'react';
import { 
  FileText, 
  Binary, 
  Cpu, 
  Workflow, 
  Filter, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { PipelineStageStatus } from '../types';

interface PipelineVisualizationProps {
  stages?: PipelineStageStatus[];
  isLoading: boolean;
  currentStep?: number;
  activeModuleTab: number;
  setActiveModuleTab: (tab: number) => void;
}

export const PipelineVisualization: React.FC<PipelineVisualizationProps> = ({
  stages,
  isLoading,
  currentStep = 0,
  activeModuleTab,
  setActiveModuleTab,
}) => {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  const pipelineNodes = [
    {
      id: 0,
      moduleNumber: 1,
      title: 'Preprocessing & DistilBERT + TLSTM',
      subtitle: 'Noise removal, sentence tokenization & 768-d contextual sequence encoding',
      icon: Binary,
      color: 'from-cyan-500 to-blue-500',
      glow: 'shadow-cyan-500/20',
      border: 'border-cyan-500/40',
      tabIndex: 0,
      details: 'spaCy boundary disambiguation, DistilBERT multi-head pooling, Bi-directional Temporal LSTM recurrence modeling cross-sentence narrative context.'
    },
    {
      id: 1,
      moduleNumber: 1,
      title: 'GAN + Reinforcement Learning Selection',
      subtitle: 'Adversarial generator/discriminator & REINFORCE policy credit assignment',
      icon: Cpu,
      color: 'from-blue-500 to-indigo-500',
      glow: 'shadow-blue-500/20',
      border: 'border-blue-500/40',
      tabIndex: 0,
      details: 'Generator ranks sentence probabilities, Discriminator computes global cohesion loss, RL Agent maximizes semantic coverage while penalizing budget deviations.'
    },
    {
      id: 2,
      moduleNumber: 2,
      title: 'Semantic Redundancy Filtering',
      subtitle: 'Pairwise cosine similarity matrix & MMR informational deduplication',
      icon: Filter,
      color: 'from-indigo-500 to-violet-500',
      glow: 'shadow-indigo-500/20',
      border: 'border-indigo-500/40',
      tabIndex: 1,
      details: 'Evaluates M_ij = cos(v_i, v_j). Prunes overlapping statements exceeding similarity threshold tau to guarantee diverse, non-repetitive prompt context.'
    },
    {
      id: 3,
      moduleNumber: 2,
      title: 'LLM Abstractive Generation',
      subtitle: 'Llama / Qwen / Local Transformer fluent discourse synthesis',
      icon: Sparkles,
      color: 'from-violet-500 to-purple-500',
      glow: 'shadow-violet-500/20',
      border: 'border-violet-500/40',
      tabIndex: 1,
      details: 'Synthesizes fluid, coherent narrative discourse conditioned on filtered extractive propositions under strict length constraints.'
    },
    {
      id: 4,
      moduleNumber: 3,
      title: 'Factual Consistency Verification',
      subtitle: 'Claim decomposition, NLI source entailment & grounded optimization',
      icon: ShieldCheck,
      color: 'from-emerald-500 to-teal-500',
      glow: 'shadow-emerald-500/20',
      border: 'border-emerald-500/40',
      tabIndex: 2,
      details: 'Segments summary into atomic factual claims, searches source evidence spans, calculates FCS metric, and corrects unsupported statements into grounded facts.'
    }
  ];

  return (
    <div className="w-full glass-panel rounded-2xl p-6 border border-cyan-500/20 shadow-2xl relative overflow-hidden">
      {/* Background neon ambient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1">
            <Workflow className="w-4 h-4" />
            <span>Hybrid Pipeline Architecture</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-wide">
            Three-Module AI Execution Flow
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry and state tracking across extractive, abstractive, and verification modules.
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center space-x-3">
          {isLoading ? (
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Executing Pipeline...</span>
            </div>
          ) : stages && stages.length > 0 ? (
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>All 3 Modules Completed</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>Ready for Submission</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Pipeline Track */}
      <div className="relative">
        {/* Connecting Line */}
        <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-0.5 bg-gradient-to-r from-cyan-500/30 via-violet-500/30 to-emerald-500/30 -translate-y-1/2 z-0" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
          {pipelineNodes.map((node, index) => {
            const Icon = node.icon;
            const isCompleted = stages && stages.length > 0;
            const isCurrent = isLoading && currentStep === index;
            const isExpanded = expandedStage === index;

            return (
              <div
                key={node.id}
                className={`flex flex-col rounded-xl p-4 transition-all duration-300 backdrop-blur-md cursor-pointer ${
                  isCompleted
                    ? 'bg-slate-900/85 border border-cyan-500/30 shadow-lg shadow-cyan-950/40 hover:border-cyan-400/60'
                    : isCurrent
                    ? 'bg-slate-900/90 border border-cyan-400 shadow-xl shadow-cyan-500/20 ring-1 ring-cyan-400 animate-pulse'
                    : 'bg-slate-950/60 border border-slate-800/80 hover:border-slate-700'
                }`}
                onClick={() => {
                  setActiveModuleTab(node.tabIndex);
                  setExpandedStage(isExpanded ? null : index);
                }}
              >
                {/* Node Top Row: Icon + Module Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-lg bg-gradient-to-br ${node.color} text-white shadow-md ${node.glow}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/60">
                    Mod {node.moduleNumber}
                  </span>
                </div>

                {/* Node Title & Subtitle */}
                <h4 className="text-sm font-semibold text-white tracking-wide mb-1 leading-snug">
                  {node.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3 line-clamp-2">
                  {node.subtitle}
                </p>

                {/* Progress / Status Tag */}
                <div className="mt-auto pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  {isCompleted ? (
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  ) : isCurrent ? (
                    <span className="text-cyan-400 animate-pulse flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Computing...</span>
                    </span>
                  ) : (
                    <span className="text-slate-500">Standby</span>
                  )}

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedStage(isExpanded ? null : index);
                    }}
                    className="text-slate-400 hover:text-cyan-300"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Expandable Technical Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-700/50 leading-relaxed animate-fadeIn">
                    <p className="font-semibold text-cyan-300 mb-1">Algorithmic Function:</p>
                    <p>{node.details}</p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModuleTab(node.tabIndex);
                      }}
                      className="mt-2 text-[10px] text-cyan-400 hover:underline block font-mono"
                    >
                      → Jump to Module Deep-Dive Tab
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
