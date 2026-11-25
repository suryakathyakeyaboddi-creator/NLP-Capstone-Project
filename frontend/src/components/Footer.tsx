import React from 'react';
import { Cpu, ShieldCheck, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-10 px-4 sm:px-6 lg:px-8 mt-20 relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Col 1 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span className="text-base font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              NEUROSUM AI
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Final Year Engineering AI Research Project implementing a publication-grade hybrid extractive-abstractive summarization framework with factual consistency optimization.
          </p>
          <div className="flex items-center space-x-2 text-[11px] text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Factual Verification Layer Enabled</span>
          </div>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
            Research Architecture
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>Module 1: GAN + RL Extractive Selector</li>
            <li>Module 2: LLM Abstractive Synthesis</li>
            <li>Module 3: NLI Factual Grounding & FCS</li>
            <li>Evaluation: ROUGE-1/2/L & BERTScore</li>
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
            Core Technologies
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>PyTorch 2.14 & DistilBERT Embeddings</li>
            <li>Bi-directional Temporal LSTM (TLSTM)</li>
            <li>Reinforcement Learning (REINFORCE)</li>
            <li>FastAPI & SQLite Research Store</li>
          </ul>
        </div>

        {/* Col 4 */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
            Academic Project
          </h4>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold">
              <Award className="w-4 h-4" />
              <span>Final Year NLP Project</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Department of Computer Science & Engineering. Designed for academic review, benchmark replication, and conference presentation.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <p>© 2026 NeuroSum AI. Research Framework for Academic Demonstration.</p>
        <div className="flex items-center space-x-4 mt-3 sm:mt-0 font-mono text-[11px]">
          <span>REST API: v1.0.0</span>
          <span>•</span>
          <span>Status: Operational</span>
        </div>
      </div>
    </footer>
  );
};
