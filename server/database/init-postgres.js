const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Ler o schema SQL
const schemaPath = path.join(__dirname, 'postgres-schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initPostgres() {
  try {
    console.log('🔄 Inicializando banco PostgreSQL...');
    
    // Executar o schema
    await pool.query(schema);
    
    console.log('✅ Banco PostgreSQL inicializado com sucesso!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar PostgreSQL:', error);
    await pool.end();
    process.exit(1);
  }
}

initPostgres();
