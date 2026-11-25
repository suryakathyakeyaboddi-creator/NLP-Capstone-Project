import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  Copy, 
  Check, 
  FileText, 
  Sparkles,
  Info,
  ExternalLink
} from 'lucide-react';
import { ClaimVerificationItem } from '../types';

interface VerificationViewProps {
  finalSummary: string;
  abstractiveSummary: string;
  claims: ClaimVerificationItem[];
  factualConsistencyScore: number;
  originalText: string;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  finalSummary,
  abstractiveSummary,
  claims,
  factualConsistencyScore,
  originalText
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<ClaimVerificationItem | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(finalSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const supportedCount = claims.filter(c => c.status === 'Supported').length;
  const unsupportedCount = claims.filter(c => c.status === 'Unsupported').length;
  const uncertainCount = claims.filter(c => c.status === 'Uncertain').length;
  const totalClaims = claims.length;

  return (
    <div className="space-y-6">
      {/* Module 3 Header Card */}
      <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>MODULE 3 DEEP DIVE</span>
          </div>
          <h3 className="text-lg font-bold text-white">
            Factual Consistency Verification & Grounded Optimization
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Claim decomposition → NLI source alignment → Entailment/contradiction classification → Automated grounding correction.
          </p>
        </div>

        {/* Factual Consistency Score Gauge */}
        <div className="flex items-center space-x-4 bg-slate-900/90 border border-slate-800 p-3 rounded-xl font-mono">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="4"
                className={factualConsistencyScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}
                fill="transparent"
                strokeDasharray={138}
                strokeDashoffset={138 - (138 * factualConsistencyScore) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xs font-bold text-white">
              {factualConsistencyScore}%
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-mono">
              Factual Score (FCS)
            </span>
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-emerald-400 font-bold">{supportedCount} Supported</span>
              <span className="text-slate-600">•</span>
              <span className="text-red-400 font-bold">{unsupportedCount} Inconsistent</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-bold">{uncertainCount} Uncertain</span>
            </div>
          </div>
        </div>
      </div>

      {/* Final Optimized Summary Output Card */}
      <div className="glass-panel rounded-xl p-5 border border-emerald-500/30 shadow-lg shadow-emerald-950/20">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Final Factually Grounded Summary
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              ({finalSummary.split(' ').filter(Boolean).length} words)
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

        <p className="text-sm text-slate-100 leading-relaxed font-sans">
          {finalSummary || 'No verified summary produced yet.'}
        </p>

        {/* Methodology notice */}
        <div className="mt-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-300">Scoring Methodology Note:</strong> Factual Consistency Score (FCS) represents NLI entailment probability and entity alignment across source document spans, distinguishing model confidence estimates from absolute ground truth. Formula: <code className="text-cyan-300 font-mono">FCS = [(N_sup * 1.0 + N_unc * 0.5) / N_tot] * 100%</code>.
          </p>
        </div>
      </div>

      {/* Claim-Level Verification Matrix */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">
              Atomic Claim Entailment & Evidence Breakdown
            </h4>
            <p className="text-xs text-slate-400">
              Each claim proposition parsed from the abstractive draft is verified against source evidence spans.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {totalClaims} Claims Evaluated
          </span>
        </div>

        <div className="space-y-3">
          {claims.map((claim) => {
            const isSupported = claim.status === 'Supported';
            const isUnsupported = claim.status === 'Unsupported';
            const isUncertain = claim.status === 'Uncertain';

            return (
              <div
                key={claim.claim_id}
                onClick={() => setSelectedClaim(selectedClaim?.claim_id === claim.claim_id ? null : claim)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSupported
                    ? 'bg-slate-900/60 border-emerald-500/25 hover:border-emerald-500/50'
                    : isUnsupported
                    ? 'bg-red-500/10 border-red-500/40 hover:border-red-500/60'
                    : 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    {isSupported && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {isUnsupported && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    {isUncertain && <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />}

                    <span className="font-mono text-xs font-bold text-slate-300">
                      Claim #{claim.claim_id}
                    </span>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isSupported
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isUnsupported
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {claim.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <span className="text-slate-400">
                      Entailment Score: <strong className="text-white">{(claim.entailment_score * 100).toFixed(1)}%</strong>
                    </span>
                    <span className="text-slate-500">
                      Evidence: Sent #{claim.evidence_sentence_index}
                    </span>
                  </div>
                </div>

                {/* Claim Statement */}
                <p className="text-xs text-slate-200 font-sans mb-3 pl-6 leading-relaxed">
                  "{claim.claim_text}"
                </p>

                {/* Evidence Quote */}
                <div className="ml-6 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="text-cyan-400 flex items-center space-x-1">
                      <FileText className="w-3 h-3" />
                      <span>Source Evidence Span (Sentence #{claim.evidence_sentence_index}):</span>
                    </span>
                  </div>
                  <p className="text-slate-300 font-sans italic">
                    "{claim.evidence_text}"
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                    <strong className="text-slate-300">Analysis:</strong> {claim.explanation}
                  </p>
                </div>

                {/* Inconsistency Correction Diff (if corrected) */}
                {claim.was_corrected && claim.suggested_correction && (
                  <div className="ml-6 mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs">
                    <div className="flex items-center space-x-1.5 text-emerald-400 font-mono text-[11px] font-bold mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Automated Factual Grounding Applied:</span>
                    </div>
                    <p className="text-emerald-200 font-sans">
                      {claim.suggested_correction}
                    </p>
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
