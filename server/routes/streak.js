const express = require('express');
const { getDatabase } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Usar Streak Freeze (proteger sequência)
router.post('/freeze', (req, res) => {
  const userId = req.user.id;
  const db = getDatabase();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  // Verificar quantos freezes já foram usados este mês
  const monthStart = new Date(thisYear, thisMonth, 1).toISOString().split('T')[0];
  const monthEnd = new Date(thisYear, thisMonth + 1, 0).toISOString().split('T')[0];
  
  db.all(
    `SELECT date FROM streak_freezes 
     WHERE user_id = ? 
     AND date >= ? 
     AND date <= ?`,
    [userId, monthStart, monthEnd],
    (err, freezes) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao verificar freezes' });
      }

      if (freezes.length >= 2) {
        return res.status(400).json({ 
          error: 'Você já usou todos os freezes deste mês (máximo 2)' 
        });
      }

      // Verificar se já existe freeze para hoje
      db.get(
        'SELECT id FROM streak_freezes WHERE user_id = ? AND date = ?',
        [userId, todayStr],
        (err, existing) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao verificar freeze existente' });
          }

          if (existing) {
            return res.status(400).json({ error: 'Você já usou freeze para hoje' });
          }

          // Criar freeze
          db.run(
            'INSERT INTO streak_freezes (user_id, date) VALUES (?, ?)',
            [userId, todayStr],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Erro ao criar freeze' });
              }

              res.json({ 
                message: 'Streak protegido! Sua sequência continua.',
                freezesRemaining: Math.max(0, 2 - (freezes.length + 1))
              });
            }
          );
        }
      );
    }
  );
});

// Recuperar dia perdido
router.post('/recover', (req, res) => {
  const { date } = req.body;
  const userId = req.user.id;
  const db = getDatabase();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  if (!date) {
    return res.status(400).json({ error: 'Data é obrigatória' });
  }

  // Validar que a data é de até 2 dias atrás
  const recoverDate = new Date(date);
  const daysDiff = Math.floor((today - recoverDate) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 1 || daysDiff > 2) {
    return res.status(400).json({ 
      error: 'Só é possível recuperar dias de até 2 dias atrás' 
    });
  }

  // Verificar se já existe recuperação para esta data
  db.get(
    'SELECT id FROM streak_recoveries WHERE user_id = ? AND date = ?',
    [userId, date],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao verificar recuperação' });
      }

      if (existing) {
        return res.status(400).json({ error: 'Este dia já foi recuperado' });
      }

      // Verificar se já tem meta concluída naquele dia
      db.get(
        'SELECT id FROM goals WHERE user_id = ? AND date = ? AND completed = 1',
        [userId, date],
        (err, goal) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao verificar metas' });
          }

          if (goal) {
            return res.status(400).json({ 
              error: 'Você já tem metas concluídas neste dia' 
            });
          }

          // Criar recuperação
          db.run(
            'INSERT INTO streak_recoveries (user_id, date) VALUES (?, ?)',
            [userId, date],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Erro ao recuperar dia' });
              }

              // Criar meta "fantasma" para manter o streak
              db.run(
                `INSERT INTO goals (user_id, title, date, completed, notes) 
                 VALUES (?, ?, ?, 1, ?)`,
                [userId, 'Dia recuperado', date, 'Dia recuperado via sistema de retomada'],
                function(err) {
                  if (err) {
                    return res.status(500).json({ error: 'Erro ao criar meta de recuperação' });
                  }

                  res.json({ 
                    message: 'Dia recuperado com sucesso! Sua sequência continua.',
                    recoveredDate: date
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Obter informações de retomada (para modal)
router.get('/recovery-info', (req, res) => {
  const userId = req.user.id;
  const db = getDatabase();

  // Buscar streak atual
  db.get(
    `SELECT COUNT(DISTINCT date) as total_days
     FROM goals 
     WHERE user_id = ? AND completed = 1`,
    [userId],
    (err, totalResult) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao calcular informações' });
      }

      // Buscar última data com meta concluída
      db.get(
        `SELECT MAX(date) as last_date
         FROM goals 
         WHERE user_id = ? AND completed = 1`,
        [userId],
        (err, lastDateResult) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao buscar última data' });
          }

          const totalDays = totalResult?.total_days || 0;
          const lastDate = lastDateResult?.last_date;
          
          let daysSinceLastStudy = 0;
          if (lastDate) {
            const last = new Date(lastDate);
            const today = new Date();
            daysSinceLastStudy = Math.floor((today - last) / (1000 * 60 * 60 * 24));
          }

          res.json({
            totalDaysStudied: totalDays,
            lastStudyDate: lastDate,
            daysSinceLastStudy,
            needsRecovery: daysSinceLastStudy > 1
          });
        }
      );
    }
  );
});

module.exports = router;
