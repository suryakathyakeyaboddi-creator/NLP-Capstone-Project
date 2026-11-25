import React from 'react';
import { 
  Cpu, 
  Layers, 
  FileText, 
  BarChart3, 
  BookOpen, 
  Sparkles,
  CheckCircle2,
  Database,
  Award,
  Clock,
  Sun,
  Moon
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemStatus?: any;
  theme?: 'dark' | 'light';
  setTheme?: (t: 'dark' | 'light') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  systemStatus,
  theme = 'dark',
  setTheme
}) => {
  const navItems = [
    { id: 'landing', label: 'Overview', icon: Sparkles },
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'workspace', label: 'Workspace', icon: FileText, highlight: true },
    { id: 'benchmarking', label: 'Benchmarking', icon: Award },
    { id: 'experiments', label: 'Experiments', icon: Clock },
    { id: 'reports', label: 'Research Report', icon: FileText },
    { id: 'comparison', label: 'Results', icon: Layers },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'methodology', label: 'Methodology', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cyan-500/20 bg-slate-950/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => setActiveTab('landing')}
          className="flex items-center space-x-3 cursor-pointer group shrink-0"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/30 to-violet-600/30 border border-cyan-400/40 shadow-lg shadow-cyan-500/10 group-hover:border-cyan-400 group-hover:shadow-cyan-500/30 transition-all duration-300">
            <Cpu className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
                NEUROSUM AI
              </span>
              <span className="text-[9px] uppercase font-semibold tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Research Lab
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden xl:block tracking-wide">
              Hybrid Summarization & Factual Verification Framework
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                } ${item.highlight && !isActive ? 'border border-cyan-500/20 text-cyan-400' : ''}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* System Status Indicator */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-300 hidden sm:inline font-mono text-[11px]">
              {systemStatus?.device === 'cuda' ? 'GPU' : 'PyTorch'}
            </span>
            <span className="text-emerald-400 font-semibold font-mono text-[11px]">Online</span>
          </div>

          {/* Theme Toggle (Light / Dark) */}
          {setTheme && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-cyan-400 transition-all flex items-center justify-center shadow-sm cursor-pointer"
              title={theme === 'dark' ? "Switch to Light Theme" : "Switch to Dark Theme"}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-600 hover:-rotate-12 transition-transform" />
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('workspace')}
            className="lg:hidden p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile / Compact nav subbar */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950/90 py-2 px-2 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 text-[10px] whitespace-nowrap rounded font-mono ${
                isActive ? 'text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
