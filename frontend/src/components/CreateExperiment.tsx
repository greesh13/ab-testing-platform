import React, { useState } from 'react';
import { experimentAPI } from '../services/api';
import './CreateExperiment.css';

interface CreateExperimentProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateExperiment: React.FC<CreateExperimentProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hypothesis: '',
    traffic_allocation: 1.0,
    variants: [
      { name: 'Control', weight: 50 },
      { name: 'Treatment', weight: 50 },
    ],
    metrics: [
      { name: 'conversion', type: 'conversion' as const },
    ],
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await experimentAPI.createExperiment({
        ...formData,
        status: 'draft',
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create experiment:', error);
      alert('Failed to create experiment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Experiment</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Experiment Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Homepage Hero Test"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What are you testing?"
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Hypothesis</label>
            <textarea
              value={formData.hypothesis}
              onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
              placeholder="We believe that..."
              rows={2}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Experiment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExperiment;