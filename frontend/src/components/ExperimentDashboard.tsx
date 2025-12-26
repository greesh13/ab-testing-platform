import React, { useState, useEffect } from 'react';
import { experimentAPI, Experiment } from '../services/api';
import './ExperimentDashboard.css';

interface ExperimentDashboardProps {
  onViewResults: (id: number) => void;
  onCreateNew: () => void;
}

const ExperimentDashboard: React.FC<ExperimentDashboardProps> = ({ onViewResults, onCreateNew }) => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      const data = await experimentAPI.getExperiments();
      setExperiments(data);
    } catch (error) {
      console.error('Failed to load experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await experimentAPI.updateExperimentStatus(id, newStatus);
      loadExperiments();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#10b981';
      case 'paused': return '#f59e0b';
      case 'completed': return '#6366f1';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return <div className="loading">Loading experiments...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Experiments</h1>
        <button className="btn-primary" onClick={onCreateNew}>
          + New Experiment
        </button>
      </div>

      <div className="experiments-grid">
        {experiments.map((exp) => (
          <div key={exp.id} className="experiment-card">
            <div className="card-header">
              <h3>{exp.name}</h3>
              <span 
                className="status-badge" 
                style={{ backgroundColor: getStatusColor(exp.status) }}
              >
                {exp.status}
              </span>
            </div>

            {exp.description && (
              <p className="description">{exp.description}</p>
            )}

            <div className="variants-info">
              <strong>Variants:</strong>
              <div className="variants-list">
                {exp.variants.map((v: any, idx: number) => (
                  <span key={idx} className="variant-tag">
                    {v.name} ({v.weight}%)
                  </span>
                ))}
              </div>
            </div>

            <div className="metrics-info">
              <strong>Metrics:</strong>
              <div className="metrics-list">
                {exp.metrics.map((m: any, idx: number) => (
                  <span key={idx} className="metric-tag">
                    {m.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="card-actions">
              {exp.status === 'draft' && (
                <button
                  className="btn-action"
                  onClick={() => handleStatusChange(exp.id!, 'running')}
                >
                  Start
                </button>
              )}
              
              {exp.status === 'running' && (
                <>
                  <button
                    className="btn-action"
                    onClick={() => handleStatusChange(exp.id!, 'paused')}
                  >
                    Pause
                  </button>
                  <button
                    className="btn-action"
                    onClick={() => handleStatusChange(exp.id!, 'completed')}
                  >
                    Stop
                  </button>
                </>
              )}

              {exp.status === 'paused' && (
                <button
                  className="btn-action"
                  onClick={() => handleStatusChange(exp.id!, 'running')}
                >
                  Resume
                </button>
              )}

              {(exp.status === 'running' || exp.status === 'completed') && (
                <button
                  className="btn-action btn-primary"
                  onClick={() => onViewResults(exp.id!)}
                >
                  Results
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {experiments.length === 0 && (
        <div className="empty-state">
          <p>No experiments yet. Create your first experiment to get started!</p>
        </div>
      )}
    </div>
  );
};

export default ExperimentDashboard;