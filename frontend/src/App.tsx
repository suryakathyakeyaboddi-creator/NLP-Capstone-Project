import React, { useState, useEffect } from 'react';
import { ThreeBackground } from './components/ThreeBackground';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { LandingPage } from './pages/LandingPage';
import { DatasetPage } from './pages/DatasetPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { BenchmarkPage } from './pages/BenchmarkPage';
import { ExperimentsPage } from './pages/ExperimentsPage';
import { ReportPage } from './pages/ReportPage';
import { DashboardPage } from './pages/DashboardPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { MethodologyPage } from './pages/MethodologyPage';

import { SummarizeResponse, DashboardAnalytics } from './types';
import { fetchSystemStatus, fetchAnalytics } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [currentResult, setCurrentResult] = useState<SummarizeResponse | null>(null);
  const [selectedBenchmarkDatasetId, setSelectedBenchmarkDatasetId] = useState<string | null>(null);
  const [selectedReportExperimentId, setSelectedReportExperimentId] = useState<string | null>(null);
  
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | undefined>(undefined);
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('neurosum_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('neurosum_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    } else {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  useEffect(() => {
    fetchSystemStatus()
      .then(status => setSystemStatus(status))
      .catch(err => console.warn('Could not fetch status:', err));

    fetchAnalytics()
      .then(an => setAnalytics(an))
      .catch(err => console.warn('Could not fetch analytics:', err));
  }, []);

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-slate-50 text-slate-900 light-theme' : 'bg-[#030712] text-slate-100'} flex flex-col relative selection:bg-cyan-500/30 selection:text-cyan-500 transition-colors duration-300`}>
      {/* 3D Immersive Animated Neural Background */}
      <ThreeBackground theme={theme} />

      {/* Main Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full relative z-10 pt-4">
        {activeTab === 'landing' && (
          <LandingPage
            onStartSummarizing={() => setActiveTab('workspace')}
            onExploreResearch={() => setActiveTab('methodology')}
            analytics={analytics}
          />
        )}

        {activeTab === 'datasets' && (
          <DatasetPage
            onGoToBenchmark={(datasetId) => {
              setSelectedBenchmarkDatasetId(datasetId);
              setActiveTab('benchmarking');
            }}
          />
        )}

        {activeTab === 'workspace' && (
          <WorkspacePage
            currentResult={currentResult}
            setCurrentResult={setCurrentResult}
          />
        )}

        {activeTab === 'benchmarking' && (
          <BenchmarkPage
            initialDatasetId={selectedBenchmarkDatasetId}
            onGoToReport={(experimentId) => {
              setSelectedReportExperimentId(experimentId);
              setActiveTab('reports');
            }}
            onGoToDatasets={() => setActiveTab('datasets')}
          />
        )}

        {activeTab === 'experiments' && (
          <ExperimentsPage
            onGoToReport={(experimentId) => {
              setSelectedReportExperimentId(experimentId);
              setActiveTab('reports');
            }}
            onGoToBenchmark={() => setActiveTab('benchmarking')}
          />
        )}

        {activeTab === 'reports' && (
          <ReportPage
            experimentId={selectedReportExperimentId}
            onGoBackToBenchmark={() => setActiveTab('benchmarking')}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage
            onSelectSummary={(summary) => {
              setCurrentResult(summary);
              setActiveTab('workspace');
            }}
            onGoToWorkspace={() => setActiveTab('workspace')}
            systemStatus={systemStatus}
          />
        )}

        {activeTab === 'comparison' && (
          <ComparisonPage
            currentResult={currentResult}
            setCurrentResult={setCurrentResult}
            onGoToWorkspace={() => setActiveTab('workspace')}
          />
        )}

        {activeTab === 'methodology' && (
          <MethodologyPage />
        )}
      </main>

      {/* Academic Footer */}
      <Footer />
    </div>
  );
}

export default App;
