import React, { useState, useEffect } from 'react';
import { experimentAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import './ResultsDashboard.css';

interface ResultsDashboardProps {
  experimentId: number;
  onBack: () => void;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ experimentId, onBack }) => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [experimentId]);

  const loadResults = async () => {
    try {
      const data = await experimentAPI.getResults(experimentId);
      setResults(data);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading results...</div>;
  }

  if (!results) {
    return <div className="error">Failed to load results</div>;
  }

  const { experiment, variants, metrics } = results;

  // Prepare chart data for conversions
  const conversionChartData = Object.keys(variants).map((variantName) => {
    const variant = variants[variantName];
    const conversionMetric = Object.keys(variant.events).find(e => e === 'conversion');
    return {
      variant: variantName,
      users: variant.users,
      conversions: conversionMetric ? variant.events[conversionMetric].unique_users : 0,
      rate: conversionMetric ? (variant.events[conversionMetric].unique_users / variant.users * 100) : 0,
    };
  });

  return (
    <div className="results-dashboard">
      <div className="results-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <div>
          <h1>{experiment.name}</h1>
          <p className="experiment-status">Status: {experiment.status}</p>
        </div>
      </div>

      {experiment.hypothesis && (
        <div className="hypothesis-section">
          <h3>Hypothesis</h3>
          <p>{experiment.hypothesis}</p>
        </div>
      )}

      <div className="variants-overview">
        <h2>Variants Overview</h2>
        <div className="variant-cards">
          {Object.keys(variants).map((variantName) => (
            <div key={variantName} className="variant-card">
              <h3>{variantName}</h3>
              <div className="stat">
                <div>
                  <div className="stat-value">{variants[variantName].users}</div>
                  <div className="stat-label">Users</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversion Rate Chart */}
      <div className="chart-section">
        <h2>Conversion Rate Comparison</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={conversionChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="variant" />
            <YAxis label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value: any) => `${value.toFixed(2)}%`} />
            <Legend />
            <Bar dataKey="rate" fill="#3b82f6" name="Conversion Rate (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Users vs Conversions Chart */}
      <div className="chart-section">
        <h2>Users vs Conversions</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={conversionChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="variant" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="users" fill="#10b981" name="Total Users" />
            <Bar dataKey="conversions" fill="#6366f1" name="Conversions" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {metrics && metrics.length > 0 && (
        <div className="metrics-section">
          <h2>Statistical Analysis</h2>
          
          {metrics.map((metric: any) => (
            <div key={metric.metric} className="metric-card">
              <div className="metric-header">
                <h3>{metric.metric}</h3>
                {metric.is_significant !== undefined && (
                  <span className={`significance-badge ${metric.is_significant ? 'significant' : 'not-significant'}`}>
                    {metric.is_significant ? '✓ Statistically Significant' : '✗ Not Significant'}
                  </span>
                )}
              </div>
              
              <div className="metric-comparison">
                <div className="metric-item">
                  <span className="metric-variant">Control</span>
                  <span className="metric-value">
                    {(metric.control_rate * 100).toFixed(2)}%
                  </span>
                  <span className="metric-count">
                    ({metric.control_conversions} / {metric.control_users} conversions)
                  </span>
                </div>

                <div className="metric-item">
                  <span className="metric-variant">Treatment</span>
                  <span className="metric-value">
                    {(metric.treatment_rate * 100).toFixed(2)}%
                  </span>
                  <span className="metric-count">
                    ({metric.treatment_conversions} / {metric.treatment_users} conversions)
                  </span>
                </div>

                <div className={`lift-indicator ${metric.lift >= 0 ? 'positive' : 'negative'}`}>
                  <div>
                    <div className="lift-value">{metric.lift.toFixed(2)}%</div>
                    <div className="lift-label">Lift</div>
                  </div>
                </div>
              </div>

              {/* Statistical Details */}
              <div className="stats-details">
                <div className="stat-item">
                  <span className="stat-label">P-Value:</span>
                  <span className="stat-value">{metric.p_value?.toFixed(4) || 'N/A'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Z-Score:</span>
                  <span className="stat-value">{metric.z_score?.toFixed(4) || 'N/A'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Confidence:</span>
                  <span className="stat-value">
                    {metric.p_value ? `${((1 - metric.p_value) * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="interpretation">
                <strong>Interpretation:</strong>
                {metric.is_significant ? (
                  <p>
                    The difference in conversion rates is <strong>statistically significant</strong> (p &lt; 0.05). 
                    {metric.lift > 0 
                      ? ' The treatment variant performs significantly better than control.'
                      : ' The control variant performs significantly better than treatment.'}
                  </p>
                ) : (
                  <p>
                    The difference is <strong>not statistically significant</strong> (p ≥ 0.05). 
                    We cannot confidently conclude that one variant performs better than the other. 
                    Consider running the test longer to gather more data.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsDashboard;