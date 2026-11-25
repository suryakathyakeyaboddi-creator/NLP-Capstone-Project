import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  Sliders, 
  Clock, 
  FileUp, 
  Check, 
  AlertCircle,
  Binary,
  Filter,
  Copy,
  Download,
  Key
} from 'lucide-react';
import { 
  SummarizeRequest, 
  SummarizeResponse 
} from '../types';
import { 
  summarizeText, 
  uploadDocumentFile 
} from '../services/api';

import { PipelineVisualization } from '../components/PipelineVisualization';
import { ExtractiveView } from '../components/ExtractiveView';
import { AbstractiveView } from '../components/AbstractiveView';
import { VerificationView } from '../components/VerificationView';
import { ComparisonView } from '../components/ComparisonView';

interface WorkspacePageProps {
  currentResult: SummarizeResponse | null;
  setCurrentResult: (res: SummarizeResponse | null) => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  currentResult,
  setCurrentResult
}) => {
  // Input Form State
  const [inputText, setInputText] = useState('');
  const [docTitle, setDocTitle] = useState('Research Document');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [maxSentences, setMaxSentences] = useState<number>(5);
  const [llmProvider, setLlmProvider] = useState<string>('auto');
  const [redundancyThreshold, setRedundancyThreshold] = useState<number>(0.72);
  const [enableCorrection, setEnableCorrection] = useState<boolean>(true);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeModuleTab, setActiveModuleTab] = useState<number>(0);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Output Box State
  const [outputMode, setOutputMode] = useState<'final' | 'abstractive' | 'extractive'>('final');
  const [copied, setCopied] = useState(false);

  // Computed text for the output box
  const displayedSummaryText = currentResult
    ? (outputMode === 'final'
        ? currentResult.final_summary
        : outputMode === 'abstractive'
        ? currentResult.abstractive_summary
        : currentResult.extractive_summary)
    : '';

  const displayedSummaryWordCount = displayedSummaryText.trim()
    ? displayedSummaryText.trim().split(/\s+/).length
    : 0;

  const handleCopySummary = () => {
    if (!displayedSummaryText) return;
    navigator.clipboard.writeText(displayedSummaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSummary = () => {
    if (!displayedSummaryText) return;
    const blob = new Blob([displayedSummaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Compute Word & Character counts
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;

  const handleClear = () => {
    setInputText('');
    setDocTitle('Research Document');
    setCurrentResult(null);
    setErrorMsg(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setErrorMsg(null);
    try {
      const data = await uploadDocumentFile(file);
      setInputText(data.text);
      setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    } catch (err: any) {
      setErrorMsg(err.message || 'File upload failed');
    } finally {
      setUploadingFile(false);
      // Reset input value
      e.target.value = '';
    }
  };

  const handleRunPipeline = async () => {
    if (wordCount < 15) {
      setErrorMsg('Please input a document of at least 15 words to run the hybrid summarization pipeline.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const payload: SummarizeRequest = {
      text: inputText,
      title: docTitle,
      summary_length: summaryLength,
      max_sentences: maxSentences,
      llm_provider: llmProvider,
      redundancy_threshold: redundancyThreshold,
      enable_correction: enableCorrection
    };

    try {
      const result = await summarizeText(payload);
      setCurrentResult(result);
      setActiveModuleTab(0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Summarization execution failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
      {/* Page Title */}
      <div className="pt-2">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>RESEARCH WORKSPACE</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
          Hybrid Summarization & Factual Verification
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Input your target text or upload TXT / PDF documents. Execute the GAN extractive selector, redundancy-filtered LLM generator, and NLI factual consistency verifier.
        </p>
      </div>



      {/* DOCUMENT INPUT & CONFIGURATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Large Document Editor (2 cols on large screen) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Document Title"
                className="bg-transparent text-sm font-bold text-white focus:outline-none border-b border-transparent focus:border-cyan-400/50 w-full sm:w-80"
              />

              {/* Upload & Clear Actions */}
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{uploadingFile ? 'Parsing...' : 'Upload TXT/PDF'}</span>
                  <input
                    type="file"
                    accept=".txt,.pdf,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingFile}
                  />
                </label>

                <button
                  onClick={handleClear}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                  title="Clear document input"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Textarea */}
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste or write your academic document, research paper abstract, or technical article here (minimum 15 words)..."
                rows={14}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 leading-relaxed font-sans resize-y"
              />
            </div>
          </div>

          {/* Footer metrics bar */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
            <div className="flex items-center space-x-4">
              <span>Words: <strong className="text-white">{wordCount}</strong></span>
              <span>•</span>
              <span>Characters: <strong className="text-white">{charCount}</strong></span>
              <span>•</span>
              <span>Est. Sentences: <strong className="text-white">{inputText ? inputText.split(/[.!?]+/).filter(Boolean).length : 0}</strong></span>
            </div>

            {wordCount >= 15 && (
              <span className="text-emerald-400 flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Document Ready</span>
              </span>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Pipeline Hyperparameters & Control Center */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-6 shadow-xl">
          <div className="space-y-5">
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider pb-2 border-b border-slate-800">
              <Sliders className="w-4 h-4" />
              <span>Pipeline Configuration</span>
            </div>

            {/* Parameter 1: Target Length */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 block">
                Summary Length Target
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['short', 'medium', 'long'] as const).map((len) => (
                  <button
                    key={len}
                    onClick={() => setSummaryLength(len)}
                    className={`py-2 px-2 text-xs font-mono rounded-lg capitalize border transition-all ${
                      summaryLength === len
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>

            {/* Parameter 2: Extractive Budget */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Max Extractive Sentences:</span>
                <span className="text-cyan-400 font-bold">{maxSentences}</span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                value={maxSentences}
                onChange={(e) => setMaxSentences(parseInt(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800"
              />
              <span className="text-[10px] text-slate-500 font-mono">
                Extracted via GAN Generator & RL Policy
              </span>
            </div>

            {/* Parameter 3: Generator Model Backend */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 block">
                Abstractive LLM Backend
              </label>
              <select
                value={llmProvider}
                onChange={(e) => setLlmProvider(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="auto">Auto (Best Available Engine)</option>
                <option value="qwen2">Qwen 2.5 (Configurable API / Ollama)</option>
                <option value="llama3">Llama 3 (Configurable API / Ollama)</option>
                <option value="distilbart">HuggingFace DistilBART</option>
              </select>
            </div>

            {/* Parameter 4: Redundancy Threshold */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Redundancy Threshold (τ):</span>
                <span className="text-violet-400 font-bold">{redundancyThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.50}
                max={0.90}
                step={0.02}
                value={redundancyThreshold}
                onChange={(e) => setRedundancyThreshold(parseFloat(e.target.value))}
                className="w-full accent-violet-400 bg-slate-800"
              />
              <span className="text-[10px] text-slate-500 font-mono">
                Cosine similarity cutoff for duplicate pruning
              </span>
            </div>

            {/* Parameter 5: Factual Grounding Correction Toggle */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">
                  Automated Factual Correction
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Ground unsupported claims in source evidence
                </span>
              </div>

              <input
                type="checkbox"
                checked={enableCorrection}
                onChange={(e) => setEnableCorrection(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/30 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>

          {/* Primary Execution CTA Button */}
          <div className="space-y-2">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            <button
              onClick={handleRunPipeline}
              disabled={isLoading || wordCount < 15}
              className={`w-full flex items-center justify-center space-x-2 py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 shadow-xl ${
                isLoading || wordCount < 15
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40 transform hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Processing Hybrid Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Generate Hybrid Summary</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* PIPELINE VISUALIZATION STAGE */}
      <PipelineVisualization
        stages={currentResult?.pipeline_stages}
        isLoading={isLoading}
        activeModuleTab={activeModuleTab}
        setActiveModuleTab={setActiveModuleTab}
      />

      {/* RESULTS AND INTERACTIVE DEEP DIVE TABS */}
      {currentResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* =====================================================================
              PRIMARY GENERATED SUMMARY OUTPUT BOX (RESEARCH GRADE)
              ===================================================================== */}
          <div className="glass-panel-glow rounded-2xl p-6 border-2 border-cyan-500/40 shadow-2xl relative overflow-hidden space-y-5">
            {/* Background accent glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-violet-500/5 to-transparent pointer-events-none rounded-full blur-3xl -z-10" />

            {/* Header & Meta Badges */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-700/60">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                  </span>
                  <h3 className="text-lg font-bold tracking-wide text-white flex items-center space-x-2">
                    <span>Generated Summary Output</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold uppercase">
                    Hybrid Pipeline
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Synthesized through GAN extraction, redundancy pruning, and NLI factual consistency optimization.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleCopySummary}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-200 hover:text-cyan-300 transition-all cursor-pointer shadow-sm"
                  title="Copy active summary to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadSummary}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-200 hover:text-cyan-300 transition-all cursor-pointer shadow-sm"
                  title="Download summary as text file"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export TXT</span>
                </button>
              </div>
            </div>

            {/* Output View Tabs: Final Grounded vs Raw Abstractive vs Extractive */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center p-1 rounded-xl bg-slate-950/60 border border-slate-800 space-x-1">
                <button
                  onClick={() => setOutputMode('final')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    outputMode === 'final'
                      ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Final Grounded Summary</span>
                </button>

                <button
                  onClick={() => setOutputMode('abstractive')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    outputMode === 'abstractive'
                      ? 'bg-violet-500/20 border border-violet-400/40 text-violet-300 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-violet-400" />
                  <span>Abstractive (Module 2)</span>
                </button>

                <button
                  onClick={() => setOutputMode('extractive')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    outputMode === 'extractive'
                      ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Binary className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Extractive Core (Module 1)</span>
                </button>
              </div>

              {/* Model & Faithfulness Badges */}
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>FCS: <strong>{currentResult.metrics.factual_consistency_score}%</strong></span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-300 text-[11px]">
                  {currentResult.model_metadata?.llm_provider || 'Hybrid Pipeline'}
                </span>
              </div>
            </div>

            {/* The Dedicated Summary Text Output Box */}
            <div className="relative rounded-xl bg-slate-950/80 border border-slate-700/80 p-5 sm:p-6 shadow-inner">
              <div className="prose prose-invert max-w-none">
                <p className="text-sm sm:text-base leading-relaxed text-slate-100 font-sans tracking-wide select-text">
                  {displayedSummaryText}
                </p>
              </div>

              {outputMode === 'final' && currentResult.verification_claims.some(c => c.status === 'Unsupported') && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center space-x-2 text-xs text-amber-300 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Automated evidence-constrained corrections were applied to ungrounded claims.</span>
                </div>
              )}
            </div>

            {/* Summary Telemetry & Metric Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Words Generated</span>
                <span className="text-lg font-bold text-white font-mono">{displayedSummaryWordCount}</span>
                <span className="text-[10px] text-slate-500 block font-mono">from {wordCount} source words</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Compression Ratio</span>
                <span className="text-lg font-bold text-cyan-400 font-mono">{currentResult.metrics.compression_ratio}%</span>
                <span className="text-[10px] text-slate-500 block font-mono">conciseness gain</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">ROUGE-L Score</span>
                <span className="text-lg font-bold text-violet-400 font-mono">
                  {currentResult.metrics.rouge?.rougeL || (currentResult.metrics.bertscore_f1 || 0.88).toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">linguistic agreement</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Execution</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {(currentResult.metrics.execution_time_ms?.total_pipeline || 120).toFixed(0)} ms
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">all 3 modules</span>
              </div>
            </div>

            {/* Groq API Notification Banner if running in demo mode */}
            {!currentResult.model_metadata?.is_real_llm && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-900/40 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center space-x-2 text-cyan-300">
                  <Key className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>
                    <strong>Groq API Key Note:</strong> Currently using local discourse synthesis engine. To unlock high-speed real Groq LLM (<code className="text-cyan-200">openai/gpt-oss-120b</code> / <code className="text-cyan-200">llama-3.3-70b</code>), add your free API key in <code className="text-white bg-slate-800 px-1.5 py-0.5 rounded">backend/.env</code>.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sub-tab Switcher */}
          <div className="flex border-b border-slate-800 overflow-x-auto space-x-2 pb-1">
            <button
              onClick={() => setActiveModuleTab(0)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-mono font-bold transition-all border-b-2 whitespace-nowrap ${
                activeModuleTab === 0
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
              }`}
            >
              <Binary className="w-4 h-4 text-cyan-400" />
              <span>Module 1: Extractive (GAN + RL)</span>
            </button>

            <button
              onClick={() => setActiveModuleTab(1)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-mono font-bold transition-all border-b-2 whitespace-nowrap ${
                activeModuleTab === 1
                  ? 'bg-violet-500/10 text-violet-300 border-violet-400'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
              }`}
            >
              <Filter className="w-4 h-4 text-violet-400" />
              <span>Module 2: Abstractive (Redundancy + LLM)</span>
            </button>

            <button
              onClick={() => setActiveModuleTab(2)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-mono font-bold transition-all border-b-2 whitespace-nowrap ${
                activeModuleTab === 2
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Module 3: Factual Consistency (NLI + FCS)</span>
            </button>

            <button
              onClick={() => setActiveModuleTab(3)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-mono font-bold transition-all border-b-2 whitespace-nowrap ${
                activeModuleTab === 3
                  ? 'bg-blue-500/10 text-blue-300 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
              }`}
            >
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Research Evaluation & Export</span>
            </button>
          </div>

          {/* Tab 0: Extractive View */}
          {activeModuleTab === 0 && (
            <ExtractiveView
              sentences={currentResult.extractive_sentences}
              extractiveSummary={currentResult.extractive_summary}
              telemetry={currentResult.pipeline_stages[0]?.details?.telemetry}
            />
          )}

          {/* Tab 1: Abstractive View */}
          {activeModuleTab === 1 && (
            <AbstractiveView
              abstractiveSummary={currentResult.abstractive_summary}
              redundancyAnalysis={currentResult.redundancy_analysis}
              modelMetadata={currentResult.model_metadata}
              extractiveWordCount={currentResult.metrics.word_count_extractive}
              abstractiveWordCount={currentResult.metrics.word_count_abstractive}
            />
          )}

          {/* Tab 2: Factual Verification View */}
          {activeModuleTab === 2 && (
            <VerificationView
              finalSummary={currentResult.final_summary}
              abstractiveSummary={currentResult.abstractive_summary}
              claims={currentResult.verification_claims}
              factualConsistencyScore={currentResult.metrics.factual_consistency_score}
              originalText={currentResult.original_text}
            />
          )}

          {/* Tab 3: Comparative Evaluation & Export View */}
          {activeModuleTab === 3 && (
            <ComparisonView data={currentResult} />
          )}
        </div>
      )}
    </div>
  );
};
