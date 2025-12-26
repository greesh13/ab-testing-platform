import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ab_testing',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const initDatabase = async () => {
  // Create experiments table
  await query(`
    CREATE TABLE IF NOT EXISTS experiments (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      hypothesis TEXT,
      status VARCHAR(50) DEFAULT 'draft',
      variants JSONB NOT NULL,
      metrics JSONB NOT NULL,
      traffic_allocation DECIMAL DEFAULT 1.0,
      created_at TIMESTAMP DEFAULT NOW(),
      started_at TIMESTAMP,
      ended_at TIMESTAMP
    )
  `);

  // Create user_assignments table
  await query(`
    CREATE TABLE IF NOT EXISTS user_assignments (
      id SERIAL PRIMARY KEY,
      experiment_id INTEGER REFERENCES experiments(id),
      user_id VARCHAR(255) NOT NULL,
      variant VARCHAR(100) NOT NULL,
      assigned_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(experiment_id, user_id)
    )
  `);

  // Create events table
  await query(`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      experiment_id INTEGER REFERENCES experiments(id),
      user_id VARCHAR(255) NOT NULL,
      variant VARCHAR(100) NOT NULL,
      event_name VARCHAR(255) NOT NULL,
      event_properties JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Create indexes
  await query(`
    CREATE INDEX IF NOT EXISTS idx_user_assignments_exp 
    ON user_assignments(experiment_id, user_id)
  `);
  
  await query(`
    CREATE INDEX IF NOT EXISTS idx_events_exp 
    ON events(experiment_id, event_name, created_at)
  `);

  console.log('Database initialized successfully');
};

export default pool;