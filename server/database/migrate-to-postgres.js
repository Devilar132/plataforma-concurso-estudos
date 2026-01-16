const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const SQLITE_DB_PATH = path.join(__dirname, '../../database.sqlite');

async function migrate() {
  console.log('🔄 Iniciando migração de SQLite para PostgreSQL...\n');

  // Conectar SQLite
  const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH, (err) => {
    if (err) {
      console.error('❌ Erro ao conectar ao SQLite:', err);
      process.exit(1);
    }
  });

  // Conectar PostgreSQL
  const pgPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'estudos_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    // Testar conexão PostgreSQL
    await pgPool.query('SELECT NOW()');
    console.log('✅ Conectado ao PostgreSQL\n');

    // Ler dados do SQLite
    console.log('📖 Lendo dados do SQLite...');

    // Migrar usuários
    const users = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM users ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`   - ${users.length} usuários encontrados`);

    for (const user of users) {
      await pgPool.query(
        `INSERT INTO users (id, name, email, password, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [user.id, user.name, user.email, user.password, user.created_at]
      );
    }
    console.log('✅ Usuários migrados\n');

    // Migrar metas
    const goals = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM goals ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`   - ${goals.length} metas encontradas`);

    for (const goal of goals) {
      await pgPool.query(
        `INSERT INTO goals (id, user_id, title, description, tag, date, completed, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT DO NOTHING`,
        [
          goal.id,
          goal.user_id,
          goal.title,
          goal.description,
          goal.tag,
          goal.date,
          goal.completed === 1 || goal.completed === true,
          goal.notes,
          goal.created_at
        ]
      );
    }
    console.log('✅ Metas migradas\n');

    // Migrar sessões
    const sessions = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM study_sessions ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`   - ${sessions.length} sessões encontradas`);

    for (const session of sessions) {
      await pgPool.query(
        `INSERT INTO study_sessions (id, user_id, date, minutes, hours, subject, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [
          session.id,
          session.user_id,
          session.date,
          session.minutes || 0,
          session.hours || 0,
          session.subject,
          session.notes,
          session.created_at
        ]
      );
    }
    console.log('✅ Sessões migradas\n');

    // Migrar conquistas (se existirem)
    const achievements = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM achievements ORDER BY id', (err, rows) => {
        if (err) {
          // Tabela pode não existir ainda
          resolve([]);
        } else {
          resolve(rows);
        }
      });
    });

    if (achievements.length > 0) {
      console.log(`   - ${achievements.length} conquistas encontradas`);
      for (const achievement of achievements) {
        await pgPool.query(
          `INSERT INTO achievements (id, user_id, achievement_type, achieved_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [achievement.id, achievement.user_id, achievement.achievement_type, achievement.achieved_at]
        );
      }
      console.log('✅ Conquistas migradas\n');
    }

    // Resetar sequências do PostgreSQL
    console.log('🔄 Ajustando sequências...');
    await pgPool.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))");
    await pgPool.query("SELECT setval('goals_id_seq', (SELECT MAX(id) FROM goals))");
    await pgPool.query("SELECT setval('study_sessions_id_seq', (SELECT MAX(id) FROM study_sessions))");
    console.log('✅ Sequências ajustadas\n');

    sqliteDb.close();
    await pgPool.end();

    console.log('✅ Migração concluída com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Configure as variáveis de ambiente do PostgreSQL');
    console.log('   2. Atualize server/database.js para usar PostgreSQL');
    console.log('   3. Teste a aplicação com o novo banco');
  } catch (error) {
    console.error('❌ Erro durante migração:', error);
    sqliteDb.close();
    await pgPool.end();
    process.exit(1);
  }
}

// Executar migração
if (require.main === module) {
  migrate();
}

module.exports = { migrate };
