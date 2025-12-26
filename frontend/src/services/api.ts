import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Experiment {
  id?: number;
  name: string;
  description?: string;
  hypothesis?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: Array<{ name: string; weight: number }>;
  metrics: Array<{ name: string; type: 'conversion' | 'revenue' | 'custom' }>;
  traffic_allocation: number;
  created_at?: string;
  started_at?: string;
  ended_at?: string;
}

export interface EventPayload {
  experiment_id: number;
  user_id: string;
  variant: string;
  event_name: string;
  event_properties?: Record<string, any>;
}

export const experimentAPI = {
  createExperiment: async (experiment: Experiment) => {
    const response = await api.post('/experiments', experiment);
    return response.data;
  },

  getExperiments: async () => {
    const response = await api.get('/experiments');
    return response.data;
  },

  getExperiment: async (id: number) => {
    const response = await api.get(`/experiments/${id}`);
    return response.data;
  },

  updateExperimentStatus: async (id: number, status: string) => {
    const response = await api.patch(`/experiments/${id}/status`, { status });
    return response.data;
  },

  assignUserToVariant: async (experimentId: number, userId: string) => {
    const response = await api.post(`/experiments/${experimentId}/assign`, { userId });
    return response.data;
  },

  trackEvent: async (event: EventPayload) => {
    const response = await api.post('/events', event);
    return response.data;
  },

  getResults: async (id: number) => {
    const response = await api.get(`/experiments/${id}/results`);
    return response.data;
  },
};

export default api;