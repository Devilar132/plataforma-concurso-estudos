const { Pool } = require('pg');
require('dotenv').config();

let pool = null;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'estudos_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20, // connection pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('connect', () => {
      console.log('✅ Conectado ao PostgreSQL');
    });

    pool.on('error', (err) => {
      console.error('❌ Erro no PostgreSQL:', err);
    });
  }
  return pool;
};

const query = async (text, params) => {
  const pool = getPool();
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Erro na query:', error);
    throw error;
  }
};

const getClient = async () => {
  const pool = getPool();
  return await pool.connect();
};

const close = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('PostgreSQL pool fechado');
  }
};

module.exports = {
  getPool,
  query,
  getClient,
  close
};
