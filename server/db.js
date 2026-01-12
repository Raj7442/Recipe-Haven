const { Pool } = require('pg');

let pool;
let dbReady = false;

// Initialize pool with better error handling
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  
  // Test connection on startup
  pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
    dbReady = false;
  });
} catch (err) {
  console.error('Failed to create PostgreSQL pool:', err);
  dbReady = false;
}

async function init() {
  if (!pool) {
    console.log('⚠️  PostgreSQL pool not available, running in fallback mode');
    return;
  }
  
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS recipes (
          id SERIAL PRIMARY KEY,
          owner_id TEXT NOT NULL,
          title TEXT NOT NULL,
          image TEXT,
          calories NUMERIC,
          ingredients JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Add index for better performance on owner_id queries
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_recipes_owner_id ON recipes(owner_id);
      `);

      dbReady = true;
      console.log('✅ PostgreSQL database initialized successfully');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('⚠️  PostgreSQL init failed:', err.message);
    console.log('📝 App will run in fallback mode (localStorage only)');
    dbReady = false;
  }
}

module.exports = { pool, init, get dbReady() { return dbReady; } }; 
