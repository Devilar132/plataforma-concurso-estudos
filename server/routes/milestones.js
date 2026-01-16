const express = require('express');
const { getDatabase } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Obter milestones do usuário
router.get('/', (req, res) => {
  const userId = req.user.id;
  const db = getDatabase();

  db.all(
    'SELECT * FROM milestones WHERE user_id = ? ORDER BY achieved_at DESC',
    [userId],
    (err, milestones) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar milestones' });
      }
      res.json(milestones || []);
    }
  );
});

// Verificar e criar milestones automaticamente
router.post('/check', (req, res) => {
  const userId = req.user.id;
  const db = getDatabase();

  // Buscar total de dias estudados
  db.get(
    `SELECT COUNT(DISTINCT date) as total_days
     FROM goals 
     WHERE user_id = ? AND completed = 1`,
    [userId],
    (err, totalResult) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao calcular milestones' });
      }

      const totalDays = totalResult?.total_days || 0;
      const newMilestones = [];

      // Verificar milestones de dias totais
      const milestonesToCheck = [
        { type: 'total_days', value: 7, description: '7 dias estudados' },
        { type: 'total_days', value: 30, description: '30 dias estudados' },
        { type: 'total_days', value: 100, description: '100 dias estudados' },
        { type: 'total_days', value: 365, description: '1 ano de estudos!' }
      ];

      // Buscar milestones existentes
      db.all(
        'SELECT milestone_type, value FROM milestones WHERE user_id = ?',
        [userId],
        (err, existing) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao verificar milestones' });
          }

          const existingSet = new Set(
            existing.map(m => `${m.milestone_type}_${m.value}`)
          );

          // Verificar cada milestone
          milestonesToCheck.forEach(milestone => {
            const key = `${milestone.type}_${milestone.value}`;
            if (totalDays >= milestone.value && !existingSet.has(key)) {
              newMilestones.push(milestone);
            }
          });

            // Criar novos milestones
            if (newMilestones.length > 0) {
              let completed = 0;
              const total = newMilestones.length;

              newMilestones.forEach((m, index) => {
                db.run(
                  'INSERT INTO milestones (user_id, milestone_type, value) VALUES (?, ?, ?)',
                  [userId, m.type, m.value],
                  function(err) {
                    if (err && !err.message.includes('UNIQUE constraint')) {
                      // Ignorar erro de duplicata, mas logar outros
                      console.error('Erro ao criar milestone:', err);
                    }
                    
                    completed++;
                    if (completed === total) {
                      res.json({
                        newMilestones: newMilestones.map(m => ({
                          type: m.type,
                          value: m.value,
                          description: m.description
                        })),
                        totalDays
                      });
                    }
                  }
                );
              });
            } else {
              res.json({
                newMilestones: [],
                totalDays
              });
            }
        }
      );
    }
  );
});

module.exports = router;
