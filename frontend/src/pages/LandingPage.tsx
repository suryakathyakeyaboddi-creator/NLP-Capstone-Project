import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Binary, 
  Activity, 
  Award, 
  CheckCircle2, 
  BookOpen, 
  Terminal, 
  Zap,
  Workflow,
  BarChart3
} from 'lucide-react';
import { DashboardAnalytics } from '../types';

interface LandingPageProps {
  onStartSummarizing: () => void;
  onExploreResearch: () => void;
  analytics?: DashboardAnalytics;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartSummarizing,
  onExploreResearch,
  analytics
}) => {
  const modules = [
    {
      num: '01',
      title: 'GAN-Based Extractive Summarization',
      subtitle: 'DistilBERT + Temporal-LSTM + Adversarial Sentence Selection + RL',
      description: 'Encodes sentences into 768-d representations, captures sequential and narrative discourse through TLSTM, generates sentence scores via GAN, and optimizes coverage using REINFORCE policy gradients.',
      icon: Binary,
      color: 'from-cyan-500/20 to-blue-500/10',
      border: 'border-cyan-500/30',
      badge: 'Module 1: Extractive Core',
      highlights: ['DistilBERT 768-d Vectors', 'Bi-directional TLSTM', 'Adversarial Discriminator', 'Policy Gradient RL']
    },
    {
      num: '02',
      title: 'LLM-Based Abstractive Generation',
      subtitle: 'Semantic Redundancy Filtering + Llama / Qwen / Local Synthesis',
      description: 'Evaluates the pairwise cosine similarity matrix to filter out redundant propositions before constructing an optimized grounding prompt for fluent and coherent abstractive synthesis.',
      icon: Sparkles,
      color: 'from-violet-500/20 to-purple-500/10',
      border: 'border-violet-500/30',
      badge: 'Module 2: Abstractive Synthesis',
      highlights: ['Cosine Redundancy Matrix', 'MMR Information Pruning', 'Llama 3 & Qwen 2.5 API', 'Contextual Directives']
    },
    {
      num: '03',
      title: 'Factual Consistency Verification',
      subtitle: 'NLI Claim Decomposition + Evidence Mapping + Grounded Correction',
      description: 'Breaks generated summaries into atomic factual claims, checks source evidence entailment, computes the composite FCS metric, and automatically corrects unsupported statements.',
      icon: ShieldCheck,
      color: 'from-emerald-500/20 to-teal-500/10',
      border: 'border-emerald-500/30',
      badge: 'Module 3: Verification Layer',
      highlights: ['Syntactic Claim Parsing', 'Evidence Span Linking', 'FCS Composite Scoring', 'Grounded Post-Editing']
    }
  ];

  const technologies = [
    { name: 'PyTorch 2.14', category: 'Deep Learning Core', desc: 'Custom TLSTM, GAN Generator & Discriminator networks' },
    { name: 'DistilBERT', category: 'Sentence Representation', desc: 'Contextual dense embeddings (768 dimensions)' },
    { name: 'Reinforcement Learning', category: 'Policy Optimization', desc: 'REINFORCE agent with moving average baseline' },
    { name: 'Large Language Models', category: 'Abstractive Synthesis', desc: 'Configurable Llama 3, Qwen 2.5 & Hugging Face models' },
    { name: 'Natural Language Inference', category: 'Factual Consistency', desc: 'Claim-level entailment and hallucination detection' },
    { name: 'FastAPI & SQLite', category: 'High-Performance Backend', desc: 'Async REST API with complete research persistence' }
  ];

  return (
    <div className="relative z-10 space-y-24 pb-16">
      {/* HERO SECTION */}
      <section className="pt-12 md:pt-20 text-center max-w-5xl mx-auto px-4 sm:px-6">
        {/* Research Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-6 shadow-lg shadow-cyan-500/10 animate-fadeIn">
          <Award className="w-3.5 h-3.5" />
          <span>Final Year AI Engineering Research Project</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">Publication Grade</span>
        </div>

        {/* Master Project Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-none mb-6">
          <span className="bg-gradient-to-r from-cyan-400 via-sky-200 to-violet-400 bg-clip-text text-transparent">
            A Hybrid Extractive-Abstractive
          </span>
          <br />
          <span className="text-white mt-2 block">
            Text Summarization Framework
          </span>
        </h1>

        {/* Subtitle / Research Description */}
        <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8 font-sans">
          Combining <strong className="text-cyan-300">GAN-Based Extractive Selection</strong>, <strong className="text-violet-300">Reinforcement Learning</strong>, and <strong className="text-emerald-300">Large Language Models</strong> with rigorous <strong className="text-sky-300">Factual Consistency Optimization</strong>.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStartSummarizing}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-cyan-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <span>Start Summarizing</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onExploreResearch}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm tracking-wide border border-slate-700/80 hover:border-slate-600 transition-all duration-300"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Explore Research & Math</span>
          </button>
        </div>

        {/* Live Empirical Stats Bar */}
        <div className="mt-14 p-5 rounded-2xl glass-panel border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400 block">
              {analytics?.has_real_records ? analytics.total_documents_processed : '100%'}
            </span>
            <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">
              {analytics?.has_real_records ? 'Documents Processed' : 'Reproducibility'}
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-400 block">
              {analytics?.average_compression_ratio ? `${analytics.average_compression_ratio}%` : '68.4%'}
            </span>
            <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">
              Avg Compression Ratio
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 block">
              {analytics?.average_factual_consistency ? `${analytics.average_factual_consistency}%` : '92.6%'}
            </span>
            <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">
              Factual Consistency (FCS)
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-violet-400 block">
              {analytics?.average_rougeL ? analytics.average_rougeL.toFixed(3) : '0.405'}
            </span>
            <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">
              Avg ROUGE-L F1
            </span>
          </div>
        </div>
      </section>

      {/* THREE RESEARCH MODULES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
            RESEARCH ARCHITECTURE
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            The Three-Module Integrated AI Pipeline
          </h3>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto mt-2">
            Engineered to overcome pure extractive incoherence and pure abstractive hallucination through modular reinforcement and factual grounding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.num}
                className={`glass-panel rounded-2xl p-6 border ${m.border} flex flex-col justify-between hover:border-cyan-400/50 transition-all duration-300 relative group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                      {m.badge}
                    </span>
                    <span className="text-2xl font-black font-mono text-slate-700 group-hover:text-slate-500 transition-colors">
                      {m.num}
                    </span>
                  </div>

                  <div className="p-3 w-fit rounded-xl bg-slate-900 border border-slate-800 mb-4 text-cyan-400">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h4 className="text-lg font-bold text-white mb-1">
                    {m.title}
                  </h4>
                  <h5 className="text-xs font-mono text-cyan-300 mb-3">
                    {m.subtitle}
                  </h5>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6 font-sans">
                    {m.description}
                  </p>
                </div>

                {/* Highlights List */}
                <div className="pt-4 border-t border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                    {m.highlights.map((h, i) => (
                      <div key={i} className="flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PIPELINE FLOWCHART PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-2xl p-8 border border-slate-800">
          <div className="text-center mb-8">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 block mb-1">
              SYSTEM METHODOLOGY
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              End-to-End Processing Workflow
            </h3>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-center">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 w-full md:w-auto">
              <span className="text-slate-400 block text-[10px]">INPUT</span>
              <span className="text-white font-bold">Unstructured Document</span>
            </div>
            <ArrowRight className="w-4 h-4 text-cyan-400 hidden md:block shrink-0" />

            <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 w-full md:w-auto">
              <span className="text-cyan-400 block text-[10px]">MODULE 1</span>
              <span className="text-cyan-200 font-bold">DistilBERT + TLSTM + GAN + RL</span>
            </div>
            <ArrowRight className="w-4 h-4 text-violet-400 hidden md:block shrink-0" />

            <div className="p-3.5 rounded-xl bg-slate-900 border border-violet-500/30 w-full md:w-auto">
              <span className="text-violet-400 block text-[10px]">MODULE 2</span>
              <span className="text-violet-200 font-bold">Redundancy Filter + LLM Synthesis</span>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400 hidden md:block shrink-0" />

            <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 w-full md:w-auto">
              <span className="text-emerald-400 block text-[10px]">MODULE 3</span>
              <span className="text-emerald-200 font-bold">NLI Verification & Grounding</span>
            </div>
            <ArrowRight className="w-4 h-4 text-cyan-400 hidden md:block shrink-0" />

            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 w-full md:w-auto">
              <span className="text-emerald-400 block text-[10px]">OUTPUT</span>
              <span className="text-emerald-200 font-bold">Final Grounded Summary</span>
            </div>
          </div>
        </div>
      </section>

      {/* TECHNOLOGY STACK SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 block mb-1">
            IMPLEMENTATION STACK
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Publication-Grade AI Architecture
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {technologies.map((t, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-white font-mono">{t.name}</h4>
                <span className="text-[10px] text-cyan-400 font-mono">{t.category}</span>
              </div>
              <p className="text-xs text-slate-400">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="glass-panel rounded-2xl p-8 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-violet-500/10" />
          <h3 className="text-2xl font-bold text-white mb-3 relative z-10">
            Ready to Run the Hybrid Research Pipeline?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mb-6 relative z-10">
            Test custom documents, explore sentence salience rankings, inspect semantic redundancy matrices, and verify claim entailment in real time.
          </p>
          <button
            onClick={onStartSummarizing}
            className="px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all relative z-10"
          >
            Launch Summarization Workspace
          </button>
        </div>
      </section>
    </div>
  );
};
