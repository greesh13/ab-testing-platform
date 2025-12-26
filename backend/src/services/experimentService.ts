import { query } from '../config/database';

export interface Experiment {
  id?: number;
  name: string;
  description?: string;
  hypothesis?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: Array<{ name: string; weight: number }>;
  metrics: Array<{ name: string; type: 'conversion' | 'revenue' | 'custom' }>;
  traffic_allocation: number;
}

export interface Event {
  experiment_id: number;
  user_id: string;
  variant: string;
  event_name: string;
  event_properties?: Record<string, any>;
}

// Hash function for consistent variant assignment
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Normal CDF approximation (for p-value calculation)
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

// Calculate statistical significance using Z-test for proportions
function calculateSignificance(
  controlConversions: number,
  controlTotal: number,
  treatmentConversions: number,
  treatmentTotal: number
): { pValue: number; significant: boolean; zScore: number } {
  const p1 = controlConversions / controlTotal;
  const p2 = treatmentConversions / treatmentTotal;
  
  // Pooled proportion
  const pooled = (controlConversions + treatmentConversions) / (controlTotal + treatmentTotal);
  
  // Standard error
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / controlTotal + 1 / treatmentTotal));
  
  // Avoid division by zero
  if (se === 0) {
    return { pValue: 1, significant: false, zScore: 0 };
  }
  
  // Z-score
  const zScore = (p2 - p1) / se;
  
  // Two-tailed p-value approximation
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
  
  // Significant if p < 0.05
  const significant = pValue < 0.05;
  
  return { pValue, significant, zScore };
}

export const experimentService = {
  // Create experiment
  async createExperiment(experiment: Experiment) {
    const result = await query(
      `INSERT INTO experiments (name, description, hypothesis, status, variants, metrics, traffic_allocation)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        experiment.name,
        experiment.description,
        experiment.hypothesis,
        experiment.status,
        JSON.stringify(experiment.variants),
        JSON.stringify(experiment.metrics),
        experiment.traffic_allocation,
      ]
    );
    return result.rows[0];
  },

  // Get all experiments
  async getExperiments() {
    const result = await query('SELECT * FROM experiments ORDER BY created_at DESC');
    return result.rows;
  },

  // Get single experiment
  async getExperiment(id: number) {
    const result = await query('SELECT * FROM experiments WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Update experiment status
  async updateExperimentStatus(id: number, status: string) {
    const updates: Record<string, any> = { status };
    
    if (status === 'running') {
      updates.started_at = new Date();
    } else if (status === 'completed') {
      updates.ended_at = new Date();
    }

    const setClauses = Object.keys(updates)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');

    const result = await query(
      `UPDATE experiments SET ${setClauses} WHERE id = $1 RETURNING *`,
      [id, ...Object.values(updates)]
    );
    return result.rows[0];
  },

  // Assign user to variant
  async assignUserToVariant(experimentId: number, userId: string) {
    // Check if user already assigned
    const existing = await query(
      'SELECT variant FROM user_assignments WHERE experiment_id = $1 AND user_id = $2',
      [experimentId, userId]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0].variant;
    }

    // Get experiment details
    const experiment = await this.getExperiment(experimentId);
    if (!experiment || experiment.status !== 'running') {
      throw new Error('Experiment not running');
    }

    // Check traffic allocation
    const hash = hashString(`${experimentId}-${userId}`);
    const trafficRoll = (hash % 100) / 100;
    
    if (trafficRoll >= experiment.traffic_allocation) {
      return null; // User not in experiment
    }

    // Assign variant based on weights
    const variants = experiment.variants;
    const totalWeight = variants.reduce((sum: number, v: any) => sum + v.weight, 0);
    const roll = (hash % 10000) / 10000;
    
    let cumulativeWeight = 0;
    let assignedVariant = variants[0].name;
    
    for (const variant of variants) {
      cumulativeWeight += variant.weight / totalWeight;
      if (roll < cumulativeWeight) {
        assignedVariant = variant.name;
        break;
      }
    }

    // Save assignment
    await query(
      'INSERT INTO user_assignments (experiment_id, user_id, variant) VALUES ($1, $2, $3)',
      [experimentId, userId, assignedVariant]
    );

    return assignedVariant;
  },

  // Track event
  async trackEvent(event: Event) {
    await query(
      `INSERT INTO events (experiment_id, user_id, variant, event_name, event_properties)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        event.experiment_id,
        event.user_id,
        event.variant,
        event.event_name,
        JSON.stringify(event.event_properties || {}),
      ]
    );
  },

  // Get experiment results
  async getResults(experimentId: number) {
    // Get total users per variant
    const userCounts = await query(
      `SELECT variant, COUNT(DISTINCT user_id) as users
       FROM user_assignments
       WHERE experiment_id = $1
       GROUP BY variant`,
      [experimentId]
    );

    // Get event counts per variant
    const eventCounts = await query(
      `SELECT variant, event_name, COUNT(*) as count, COUNT(DISTINCT user_id) as unique_users
       FROM events
       WHERE experiment_id = $1
       GROUP BY variant, event_name`,
      [experimentId]
    );

    const experiment = await this.getExperiment(experimentId);
    
    // Calculate conversion rates
    const variantResults: Record<string, any> = {};
    
    userCounts.rows.forEach((row: any) => {
      variantResults[row.variant] = {
        users: parseInt(row.users),
        events: {},
      };
    });

    eventCounts.rows.forEach((row: any) => {
      if (variantResults[row.variant]) {
        variantResults[row.variant].events[row.event_name] = {
          count: parseInt(row.count),
          unique_users: parseInt(row.unique_users),
          conversion_rate: parseInt(row.unique_users) / variantResults[row.variant].users,
        };
      }
    });

    // Calculate statistical significance (simplified chi-square test)
    const metrics = experiment.metrics.map((metric: any) => {
      const variants = Object.keys(variantResults);
      const control = variants[0];
      const treatment = variants[1];

      if (!control || !treatment) return null;

      const controlData = variantResults[control]?.events[metric.name];
      const treatmentData = variantResults[treatment]?.events[metric.name];

      if (!controlData || !treatmentData) return null;

      const controlRate = controlData.conversion_rate;
      const treatmentRate = treatmentData.conversion_rate;
      const lift = ((treatmentRate - controlRate) / controlRate) * 100;

      // Calculate statistical significance
      const stats = calculateSignificance(
        controlData.unique_users,
        variantResults[control].users,
        treatmentData.unique_users,
        variantResults[treatment].users
      );

      return {
        metric: metric.name,
        control_rate: controlRate,
        treatment_rate: treatmentRate,
        lift: lift,
        control_conversions: controlData.unique_users,
        treatment_conversions: treatmentData.unique_users,
        control_users: variantResults[control].users,
        treatment_users: variantResults[treatment].users,
        p_value: stats.pValue,
        z_score: stats.zScore,
        is_significant: stats.significant,
      };
    });

    return {
      experiment,
      variants: variantResults,
      metrics: metrics.filter(Boolean),
    };
  },
};