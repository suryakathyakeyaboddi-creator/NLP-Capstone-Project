import React from 'react';
import { 
  BookOpen, 
  Binary, 
  Cpu, 
  Workflow, 
  ShieldCheck, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  ArrowRight,
  Code2,
  FileText
} from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-20">
      {/* Header */}
      <div className="text-center pt-4 space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <BookOpen className="w-3.5 h-3.5" />
          <span>RESEARCH METHODOLOGY SPECIFICATION</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Theoretical Framework & Algorithmic Design
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Mathematical formulations, neural network architectures, adversarial loss functions, and factual grounding rules underpinning the NeuroSum AI framework.
        </p>
      </div>

      {/* 1. MOTIVATION & PROBLEM STATEMENT */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
            Section 1
          </span>
          <h3 className="text-xl font-bold text-white">
            Research Motivation & Problem Statement
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h4 className="text-sm font-bold text-red-400 flex items-center space-x-2">
              <span>Pure Extractive Limitations</span>
            </h4>
            <p className="text-slate-400">
              Traditional extractive methods (e.g. Lead-3, TextRank, LexRank) concatenate raw source sentences verbatim. While this strictly avoids hallucination, it produces summaries that are:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 font-sans">
              <li>Disjointed and deficient in narrative discourse flow.</li>
              <li>Prone to broken pronominal coreferences (e.g. "he", "this").</li>
              <li>Incapable of cross-sentence clause condensation.</li>
            </ul>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h4 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
              <span>Pure Abstractive Hallucination</span>
            </h4>
            <p className="text-slate-400">
              Modern generative Large Language Models synthesize remarkably fluent prose, but suffer from significant failure modes in academic and clinical domains:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 font-sans">
              <li>Entity fabrication and numerical hallucinations.</li>
              <li>Extrinsic semantic drift away from core source assertions.</li>
              <li>Absence of claim-level evidence verification.</li>
            </ul>
          </div>
        </div>

        {/* Proposed Hybrid Paradigm */}
        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs sm:text-sm text-cyan-200">
          <strong className="text-cyan-300 block mb-1">Proposed Hybrid Solution:</strong>
          NeuroSum AI pioneers a three-module synergistic pipeline where adversarial sentence selection (Module 1) anchors salient content, semantic deduplication and LLM generation (Module 2) achieve fluid condensation, and automated NLI claim verification (Module 3) guarantees absolute factual grounding.
        </div>
      </section>

      {/* 2. MATHEMATICAL FORMULATION */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-8">
        <div className="border-b border-slate-800 pb-4">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
            Section 2
          </span>
          <h3 className="text-xl font-bold text-white">
            Mathematical & Algorithmic Formulations
          </h3>
        </div>

        {/* Math 1: TLSTM */}
        <div className="space-y-3">
          <h4 className="text-base font-bold text-cyan-300 font-mono">
            1. Temporal-LSTM (TLSTM) Discourse Sequence Modeling
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Given input sentence embeddings from DistilBERT <code className="text-cyan-400 font-mono">H = [h_1, ..., h_N] ∈ R^(N × 768)</code>, the TLSTM models forward narrative progression and backward discourse cohesion:
          </p>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto space-y-1.5">
            <p className="text-cyan-400">h_t^fwd = LSTM_fwd(h_t, h_(t-1)^fwd)</p>
            <p className="text-blue-400">h_t^bwd = LSTM_bwd(h_t, h_(t+1)^bwd)</p>
            <p className="text-slate-400">z_t = [h_t^fwd ; h_t^bwd] ∈ R^(512)</p>
            <p className="text-emerald-400">u_t = tanh(W_a z_t),  α_t = exp(u_t^T v_c) / Σ exp(u_j^T v_c)</p>
            <p className="text-violet-400">d_doc = Σ α_t z_t  (Global Document Representation)</p>
          </div>
        </div>

        {/* Math 2: GAN Extractive Selection */}
        <div className="space-y-3">
          <h4 className="text-base font-bold text-blue-300 font-mono">
            2. GAN Adversarial Sentence Selection
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The Generator <code className="text-cyan-400 font-mono">G_θ(z_t, d_doc)</code> predicts continuous sentence inclusion probabilities, while the Bilinear Discriminator <code className="text-violet-400 font-mono">D_ϕ(s_cand, d_doc)</code> evaluates summary fidelity:
          </p>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto space-y-1.5">
            <p className="text-cyan-400">y_hat = σ( W_2 · ReLU(LayerNorm(W_1 [z_t ; d_doc])) )</p>
            <p className="text-blue-400">s_cand = (Σ y_hat_i · z_i) / (Σ y_hat_i + ε)</p>
            <p className="text-emerald-400">D(s_cand, d_doc) = σ( s_cand^T W_bilinear d_doc + b )</p>
            <p className="text-amber-400">L_GAN = min_G max_D [ E[log D(s_gold, d_doc)] + E[log(1 - D(s_cand, d_doc))] ]</p>
          </div>
        </div>

        {/* Math 3: Reinforcement Learning Policy */}
        <div className="space-y-3">
          <h4 className="text-base font-bold text-violet-300 font-mono">
            3. Reinforcement Learning Composite Reward Function
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The RL agent employs REINFORCE policy gradients with a moving baseline to optimize sentence selections against three non-differentiable objectives:
          </p>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto space-y-1.5">
            <p className="text-violet-400">R(S) = α · Cosine(S, d_doc) - β · Redundancy(S) - γ · |len(S) - L_target|</p>
            <p className="text-cyan-400">∇_θ J(θ) = E [ Σ_t ∇_θ log π_θ(a_t | s_t) (R(S) - b) ]</p>
          </div>
        </div>

        {/* Math 4: Factual Consistency Score (FCS) */}
        <div className="space-y-3">
          <h4 className="text-base font-bold text-emerald-300 font-mono">
            4. Factual Consistency Score (FCS) & Grounding Rules
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Every decomposed claim proposition <code className="text-emerald-400 font-mono">c_i</code> is verified against candidate source spans <code className="text-slate-300 font-mono">d_k</code> using semantic entailment <code className="text-cyan-400 font-mono">E(c_i, d_k)</code>:
          </p>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto space-y-1.5">
            <p className="text-emerald-400">FCS = [ (N_supported · 1.0 + N_uncertain · 0.5) / N_total ] × 100%</p>
            <p className="text-slate-400">If Status(c_i) == 'Unsupported': Replace c_i with Source-Grounding Projection(d_evidence)</p>
          </div>
        </div>
      </section>

      {/* 3. EXPECTED RESEARCH CONTRIBUTIONS */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
            Section 3
          </span>
          <h3 className="text-xl font-bold text-white">
            Expected Contributions & Publication Merit
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-300">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
            <Award className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">Hybrid Modularity:</strong>
              Demonstrates that coupling GAN-based extractive selection with LLM generation reduces input token costs by up to 65% while retaining core salient propositions.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">Factual Grounding Layer:</strong>
              Establishes claim-level NLI verification that eliminates numerical and relational hallucinations before presenting the final summary.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
            <Cpu className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">Temporal Discourse Architecture:</strong>
              Applies Bi-directional TLSTM to preserve sentence order coherence and cross-sentence dependencies rather than treating sentences as isolated bags of words.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
            <Binary className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">Reproducible Research Benchmark:</strong>
              Provides full transparency with real ROUGE-1/2/L calculations, exportable PDF/JSON research reports, and honest distinction between model estimates and ground truth.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
