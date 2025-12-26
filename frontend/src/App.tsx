import React, { useState } from 'react';
import ExperimentDashboard from './components/ExperimentDashboard';
import CreateExperiment from './components/CreateExperiment';
import ResultsDashboard from './components/ResultsDashboard';
import './App.css';

type View = 'dashboard' | 'create' | 'results';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedExperimentId, setSelectedExperimentId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewResults = (id: number) => {
    setSelectedExperimentId(id);
    setCurrentView('results');
  };

  const handleCreateNew = () => {
    setCurrentView('create');
  };

  const handleBack = () => {
    setCurrentView('dashboard');
    setRefreshKey(prev => prev + 1);
  };

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">⚡ A/B Testing Platform</h1>
      </header>

      <main className="app-main">
        {currentView === 'dashboard' && (
          <ExperimentDashboard
            key={refreshKey}
            onViewResults={handleViewResults}
            onCreateNew={handleCreateNew}
          />
        )}

        {currentView === 'create' && (
          <CreateExperiment
            onClose={handleBack}
            onSuccess={handleCreateSuccess}
          />
        )}

        {currentView === 'results' && selectedExperimentId && (
          <ResultsDashboard
            experimentId={selectedExperimentId}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
}

export default App;