const express = require('express');
const { getDatabase } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Estatísticas gerais do usuário
router.get('/', (req, res) => {
  const userId = req.user.id;
  const db = getDatabase();

  // Total de metas
  db.get('SELECT COUNT(*) as total FROM goals WHERE user_id = ?', [userId], (err, totalResult) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }

    // Metas concluídas
    db.get('SELECT COUNT(*) as completed FROM goals WHERE user_id = ? AND completed = 1', [userId], (err, completedResult) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
      }

      // Porcentagem de conclusão
      const total = totalResult.total || 0;
      const completed = completedResult.completed || 0;
      const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

      res.json({
        total,
        completed,
        pending: total - completed,
        completionRate: parseFloat(completionRate)
      });
    });
  });
});

// Estatísticas por período (semanal/mensal)
router.get('/period', (req, res) => {
  const { startDate, endDate } = req.query;
  const userId = req.user.id;
  const db = getDatabase();

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate e endDate são obrigatórios' });
  }

  const query = `
    SELECT 
      date,
      COUNT(*) as total,
      SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
    FROM goals
    WHERE user_id = ? AND date BETWEEN ? AND ?
    GROUP BY date
    ORDER BY date ASC
  `;

  db.all(query, [userId, startDate, endDate], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar estatísticas do período' });
    }
    res.json(results);
  });
});

// Streak (sequência de dias consecutivos com metas concluídas)
router.get('/streak', (req, res) => {
  const userId = req.user.id;
  const db = getDatabase();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Buscar todos os dias únicos com pelo menos uma meta concluída
  const completedQuery = `
    SELECT DISTINCT date 
    FROM goals 
    WHERE user_id = ? AND completed = 1 AND date <= ?
    ORDER BY date DESC
  `;

  // Buscar freezes usados
  const freezesQuery = `
    SELECT date 
    FROM streak_freezes 
    WHERE user_id = ?
  `;

  // Buscar total de dias estudados (milestone permanente)
  const totalDaysQuery = `
    SELECT COUNT(DISTINCT date) as total_days
    FROM goals 
    WHERE user_id = ? AND completed = 1
  `;

  db.all(completedQuery, [userId, todayStr], (err, completedResults) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao calcular streak' });
    }

    db.all(freezesQuery, [userId], (err, freezesResults) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar freezes' });
      }

      db.get(totalDaysQuery, [userId], (err, totalDaysResult) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao calcular total de dias' });
        }

        if (completedResults.length === 0) {
          return res.json({ 
            currentStreak: 0, 
            longestStreak: 0,
            totalDaysStudied: 0,
            freezesUsed: 0,
            freezesAvailable: 2
          });
        }

        // Converter resultados para Set de strings de data para busca rápida
        const datesSet = new Set(completedResults.map(r => r.date));
        const freezesSet = new Set(freezesResults.map(f => f.date));

        // Calcular streak atual (dias consecutivos até hoje ou ontem)
        let currentStreak = 0;
        let checkDate = new Date(today);
        
        // Verificar se há metas concluídas hoje ou freeze hoje
        let checkDateStr = checkDate.toISOString().split('T')[0];
        const hasToday = datesSet.has(checkDateStr) || freezesSet.has(checkDateStr);
        
        // Se não tem hoje, começar a contar de ontem
        if (!hasToday) {
          checkDate.setDate(checkDate.getDate() - 1);
          checkDateStr = checkDate.toISOString().split('T')[0];
        }
        
        // Contar dias consecutivos para trás (considerando freezes)
        while (datesSet.has(checkDateStr) || freezesSet.has(checkDateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
          checkDateStr = checkDate.toISOString().split('T')[0];
        }

        // Calcular maior streak de todos os tempos
        let longestStreak = 1;
        let tempStreak = 1;
        
        // Ordenar datas em ordem crescente para calcular o maior streak
        const sortedDates = completedResults.map(r => r.date).sort((a, b) => {
          const dateA = new Date(a);
          const dateB = new Date(b);
          return dateA - dateB;
        });
        
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(sortedDates[i - 1]);
          const currDate = new Date(sortedDates[i]);
          const diffTime = currDate - prevDate;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Dias consecutivos
            tempStreak++;
          } else {
            // Quebrou a sequência
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        // Calcular freezes disponíveis (2 por mês)
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const monthlyFreezes = freezesResults.filter(f => {
          const freezeDate = new Date(f.date);
          return freezeDate.getMonth() === thisMonth && 
                 freezeDate.getFullYear() === thisYear;
        });

        const totalDaysStudied = totalDaysResult?.total_days || 0;

        res.json({
          currentStreak,
          longestStreak,
          totalDaysStudied,
          freezesUsed: monthlyFreezes.length,
          freezesAvailable: Math.max(0, 2 - monthlyFreezes.length)
        });
      });
    });
  });
});

// Estatísticas por tag
router.get('/by-tag', (req, res) => {
  const userId = req.user.id;
  const db = getDatabase();

  const query = `
    SELECT 
      tag,
      COUNT(*) as total,
      SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
    FROM goals
    WHERE user_id = ? AND tag IS NOT NULL
    GROUP BY tag
    ORDER BY total DESC
  `;

  db.all(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar estatísticas por tag' });
    }
    res.json(results);
  });
});

module.exports = router;
