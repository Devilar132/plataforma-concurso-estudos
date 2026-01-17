const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { Pool } = require('pg');

const DB_PATH = path.join(__dirname, '../database.sqlite');

// Verificar se deve usar PostgreSQL (produção) ou SQLite (desenvolvimento)
const USE_POSTGRES = !!process.env.DATABASE_URL;

let db = null;
let pgPool = null;

// PostgreSQL
const getPostgresPool = () => {
  if (!pgPool && USE_POSTGRES) {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pgPool.on('connect', () => {
      console.log('✅ Conectado ao PostgreSQL');
    });

    pgPool.on('error', (err) => {
      console.error('❌ Erro no PostgreSQL:', err);
    });
  }
  return pgPool;
};

// SQLite
const getSQLiteDatabase = () => {
  if (!db && !USE_POSTGRES) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
      } else {
        console.log('✅ Conectado ao banco de dados SQLite');
      }
    });
  }
  return db;
};

// Função unificada para obter o banco
const getDatabase = () => {
  if (USE_POSTGRES) {
    return getPostgresPool();
  }
  return getSQLiteDatabase();
};

const initDatabase = (callback) => {
  // Se usar PostgreSQL, executar schema SQL
  if (USE_POSTGRES) {
    const pool = getPostgresPool();
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'database', 'postgres-schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      pool.query(schema)
        .then(() => {
          console.log('📊 Schema PostgreSQL aplicado com sucesso');
          if (callback) callback(null);
        })
        .catch((error) => {
          console.error('Erro ao inicializar PostgreSQL:', error);
          if (callback) callback(error);
        });
    } else {
      console.log('⚠️  Arquivo postgres-schema.sql não encontrado, usando schema padrão');
      if (callback) callback(null);
    }
    return;
  }

  // SQLite (desenvolvimento)
  const db = getDatabase();

  // Usar serialize para garantir que as queries sejam executadas sequencialmente
  db.serialize(() => {
    // Tabela de usuários
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Erro ao criar tabela users:', err.message);
        if (callback) return callback(err);
        return;
      }

      // Tabela de metas
      db.run(`CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        tag TEXT,
        date DATE NOT NULL,
        completed BOOLEAN DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`, (err) => {
        if (err) {
          console.error('Erro ao criar tabela goals:', err.message);
          if (callback) return callback(err);
          return;
        }

        // Tabela de horas estudadas
        db.run(`CREATE TABLE IF NOT EXISTS study_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date DATE NOT NULL,
          hours DECIMAL(4,2) NOT NULL DEFAULT 0,
          minutes INTEGER DEFAULT 0,
          subject TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`, (err) => {
          if (err) {
            console.error('Erro ao criar tabela study_sessions:', err.message);
            if (callback) return callback(err);
            return;
          }

          // Tabela de conquistas
          db.run(`CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            achievement_type TEXT NOT NULL,
            achieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, achievement_type)
          )`, (err) => {
            if (err) {
              console.error('Erro ao criar tabela achievements:', err.message);
              if (callback) return callback(err);
              return;
            }

            // Tabela de streak freezes (proteção de sequência)
            db.run(`CREATE TABLE IF NOT EXISTS streak_freezes (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              date DATE NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id),
              UNIQUE(user_id, date)
            )`, (err) => {
              if (err) {
                console.error('Erro ao criar tabela streak_freezes:', err.message);
                if (callback) return callback(err);
                return;
              }

              // Tabela de recuperações de streak
              db.run(`CREATE TABLE IF NOT EXISTS streak_recoveries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date DATE NOT NULL,
                recovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(user_id, date)
              )`, (err) => {
                if (err) {
                  console.error('Erro ao criar tabela streak_recoveries:', err.message);
                  if (callback) return callback(err);
                  return;
                }

                // Tabela de milestones (progresso permanente)
                db.run(`CREATE TABLE IF NOT EXISTS milestones (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER NOT NULL,
                  milestone_type TEXT NOT NULL,
                  value INTEGER NOT NULL,
                  achieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (user_id) REFERENCES users(id),
                  UNIQUE(user_id, milestone_type, value)
                )`, (err) => {
                  if (err) {
                    console.error('Erro ao criar tabela milestones:', err.message);
                    if (callback) return callback(err);
                    return;
                  }

                  // Tabela de configurações do usuário
                  db.run(`CREATE TABLE IF NOT EXISTS user_settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    daily_hours_goal DECIMAL(4,2) DEFAULT 2.0,
                    theme TEXT DEFAULT 'dark',
                    notifications_enabled BOOLEAN DEFAULT 1,
                    email_notifications BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    UNIQUE(user_id)
                  )`, (err) => {
                    if (err) {
                      console.error('Erro ao criar tabela user_settings:', err.message);
                      if (callback) return callback(err);
                      return;
                    }

                    // Índices para melhor performance
                    db.run(`CREATE INDEX IF NOT EXISTS idx_goals_user_date ON goals(user_id, date)`, (err) => {
                      if (err) {
                        console.error('Erro ao criar índice idx_goals_user_date:', err.message);
                      }

                      db.run(`CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id)`, (err) => {
                        if (err) {
                          console.error('Erro ao criar índice idx_goals_user:', err.message);
                        }

                        db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON study_sessions(user_id, date)`, (err) => {
                          if (err) {
                            console.error('Erro ao criar índice idx_sessions_user_date:', err.message);
                          }

                          db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON study_sessions(user_id)`, (err) => {
                            if (err) {
                              console.error('Erro ao criar índice idx_sessions_user:', err.message);
                            }

                            db.run(`CREATE INDEX IF NOT EXISTS idx_freezes_user_date ON streak_freezes(user_id, date)`, (err) => {
                              if (err) {
                                console.error('Erro ao criar índice idx_freezes_user_date:', err.message);
                              }

                              db.run(`CREATE INDEX IF NOT EXISTS idx_recoveries_user ON streak_recoveries(user_id)`, (err) => {
                                if (err) {
                                  console.error('Erro ao criar índice idx_recoveries_user:', err.message);
                                }

                                db.run(`CREATE INDEX IF NOT EXISTS idx_settings_user ON user_settings(user_id)`, (err) => {
                                  if (err) {
                                    console.error('Erro ao criar índice idx_settings_user:', err.message);
                                    if (callback) return callback(err);
                                  } else {
                                    console.log('📊 Tabelas criadas/verificadas com sucesso');
                                    if (callback) callback(null);
                                  }
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

const closeDatabase = async () => {
  if (USE_POSTGRES && pgPool) {
    await pgPool.end();
    pgPool = null;
    console.log('PostgreSQL pool fechado');
  } else if (db) {
    db.close((err) => {
      if (err) {
        console.error('Erro ao fechar banco de dados:', err.message);
      } else {
        console.log('Banco de dados SQLite fechado');
      }
    });
    db = null;
  }
};

// Exportar adapter também
const { getDatabaseAdapter } = require('./database/adapter');

module.exports = {
  getDatabase,
  getDatabaseAdapter,
  initDatabase,
  closeDatabase,
  USE_POSTGRES
};
