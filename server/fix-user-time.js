/**
 * Script para corrigir o tempo de estudo do usuário Recruta132
 * Define o total para 64 minutos (1:04)
 */

const { getDatabase, initDatabase, USE_POSTGRES } = require('./database');

const USER_EMAIL = 'recruta132senhor@gmail.com';
const CORRECT_MINUTES = 64;
const CORRECT_HOURS = (CORRECT_MINUTES / 60).toFixed(2);

async function fixUserTime() {
  console.log('🔧 Iniciando correção do tempo do usuário...');
  
  await new Promise((resolve, reject) => {
    initDatabase((err) => {
      if (err) {
        console.error('❌ Erro ao inicializar banco:', err);
        return reject(err);
      }
      resolve();
    });
  });

  const db = getDatabase();

  try {
    // Encontrar o usuário pelo email
    let user;
    if (USE_POSTGRES) {
      const result = await db.query('SELECT id, email, name FROM users WHERE email = $1', [USER_EMAIL]);
      user = result.rows[0];
    } else {
      user = await new Promise((resolve, reject) => {
        db.get('SELECT id, email, name FROM users WHERE email = ?', [USER_EMAIL], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }

    if (!user) {
      console.error(`❌ Usuário com email ${USER_EMAIL} não encontrado!`);
      
      // Listar todos os usuários para debug
      let allUsers;
      if (USE_POSTGRES) {
        const result = await db.query('SELECT id, email, name FROM users LIMIT 10');
        allUsers = result.rows;
      } else {
        allUsers = await new Promise((resolve, reject) => {
          db.all('SELECT id, email, name FROM users LIMIT 10', (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
      }
      
      console.log('\n📋 Usuários encontrados no banco:');
      allUsers.forEach(u => {
        console.log(`  - ${u.name} (${u.email}) - ID: ${u.id}`);
      });
      
      process.exit(1);
    }

    console.log(`✅ Usuário encontrado: ${user.name} (ID: ${user.id})`);

    // Buscar todas as sessões do usuário
    let allSessions;
    if (USE_POSTGRES) {
      const result = await db.query(
        'SELECT id, date, minutes, hours FROM study_sessions WHERE user_id = $1 ORDER BY date DESC',
        [user.id]
      );
      allSessions = result.rows;
    } else {
      allSessions = await new Promise((resolve, reject) => {
        db.all(
          'SELECT id, date, minutes, hours FROM study_sessions WHERE user_id = ? ORDER BY date DESC',
          [user.id],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
    }

    console.log(`📊 Total de sessões encontradas: ${allSessions.length}`);

    if (allSessions.length === 0) {
      // Se não há sessões, criar uma para hoje
      const today = new Date().toISOString().split('T')[0];
      console.log(`📝 Criando nova sessão para ${today} com ${CORRECT_MINUTES} minutos...`);
      
      if (USE_POSTGRES) {
        await db.query(
          'INSERT INTO study_sessions (user_id, date, minutes, hours) VALUES ($1, $2, $3, $4)',
          [user.id, today, CORRECT_MINUTES, CORRECT_HOURS]
        );
      } else {
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO study_sessions (user_id, date, minutes, hours) VALUES (?, ?, ?, ?)',
            [user.id, today, CORRECT_MINUTES, CORRECT_HOURS],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });
      }
      console.log('✅ Sessão criada com sucesso!');
    } else {
      // Calcular total atual
      const totalMinutes = allSessions.reduce((sum, session) => {
        const minutes = parseInt(session.minutes) || 0;
        return sum + minutes;
      }, 0);

      console.log(`📊 Total atual: ${totalMinutes} minutos (${(totalMinutes / 60).toFixed(2)} horas)`);
      console.log(`🎯 Total correto: ${CORRECT_MINUTES} minutos (${CORRECT_HOURS} horas)`);

      // Se há apenas uma sessão, atualizar ela
      if (allSessions.length === 1) {
        const session = allSessions[0];
        console.log(`📝 Atualizando sessão ID ${session.id}...`);
        
        if (USE_POSTGRES) {
          await db.query(
            'UPDATE study_sessions SET minutes = $1, hours = $2 WHERE id = $3',
            [CORRECT_MINUTES, CORRECT_HOURS, session.id]
          );
        } else {
          await new Promise((resolve, reject) => {
            db.run(
              'UPDATE study_sessions SET minutes = ?, hours = ? WHERE id = ?',
              [CORRECT_MINUTES, CORRECT_HOURS, session.id],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        }
        console.log('✅ Sessão atualizada com sucesso!');
      } else {
        // Se há múltiplas sessões, atualizar a mais recente e deletar as outras
        console.log(`⚠️  Múltiplas sessões encontradas. Atualizando a mais recente e removendo as outras...`);
        
        const mostRecent = allSessions[0];
        const others = allSessions.slice(1);
        
        // Atualizar a mais recente
        if (USE_POSTGRES) {
          await db.query(
            'UPDATE study_sessions SET minutes = $1, hours = $2 WHERE id = $3',
            [CORRECT_MINUTES, CORRECT_HOURS, mostRecent.id]
          );
          
          // Deletar as outras
          if (others.length > 0) {
            const otherIds = others.map(s => s.id);
            await db.query(
              `DELETE FROM study_sessions WHERE id = ANY($1::int[])`,
              [otherIds]
            );
          }
        } else {
          await new Promise((resolve, reject) => {
            db.run(
              'UPDATE study_sessions SET minutes = ?, hours = ? WHERE id = ?',
              [CORRECT_MINUTES, CORRECT_HOURS, mostRecent.id],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          
          // Deletar as outras
          if (others.length > 0) {
            const otherIds = others.map(s => s.id);
            const placeholders = otherIds.map(() => '?').join(',');
            await new Promise((resolve, reject) => {
              db.run(
                `DELETE FROM study_sessions WHERE id IN (${placeholders})`,
                otherIds,
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
          }
        }
        
        console.log(`✅ Sessão mais recente atualizada e ${others.length} sessões antigas removidas!`);
      }
    }

    console.log('✅ Correção concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao corrigir tempo:', error);
    process.exit(1);
  }
}

// Executar
fixUserTime();
