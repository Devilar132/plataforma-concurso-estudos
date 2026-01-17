const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Obter sessões de estudo do usuário
router.get('/', (req, res) => {
  const { date, startDate, endDate } = req.query;
  const userId = req.user.id;
  const db = getDatabase();

  let query = 'SELECT * FROM study_sessions WHERE user_id = ?';
  let params = [userId];

  if (date) {
    query += ' AND date = ?';
    params.push(date);
  } else if (startDate && endDate) {
    query += ' AND date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  query += ' ORDER BY date DESC, created_at DESC';

  db.all(query, params, (err, sessions) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar sessões de estudo' });
    }
    res.json(sessions);
  });
});

// Obter uma sessão específica
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const db = getDatabase();

  db.get('SELECT * FROM study_sessions WHERE id = ? AND user_id = ?', [id, userId], (err, session) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar sessão' });
    }
    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }
    res.json(session);
  });
});

// Criar/atualizar sessão de estudo
router.post('/', [
  body('date').notEmpty().withMessage('Data é obrigatória'),
  body('hours').optional().isFloat({ min: 0, max: 24 }).withMessage('Horas inválidas'),
  body('minutes').optional().isInt({ min: 0, max: 59 }).withMessage('Minutos inválidos')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { date, hours, minutes, subject, notes } = req.body;
  const userId = req.user.id;
  const db = getDatabase();

  // VALIDAÇÃO DE SEGURANÇA: Só permite registrar para hoje
  const today = new Date().toISOString().split('T')[0];
  if (date !== today) {
    return res.status(400).json({ error: 'Só é permitido registrar horas estudadas para o dia atual' });
  }

  // Converter minutos para horas decimais
  // Se minutos foram fornecidos, usar diretamente (mais preciso)
  // Caso contrário, converter horas para minutos
  let totalInputMinutes = 0;
  if (minutes !== undefined && minutes !== null && minutes !== '') {
    // Se minutos foram fornecidos, usar APENAS os minutos (ignorar horas para evitar duplicação)
    totalInputMinutes = parseInt(minutes) || 0;
  } else if (hours !== undefined && hours !== null && hours !== '') {
    // Se não há minutos mas há horas, converter horas para minutos
    const inputHours = parseFloat(hours) || 0;
    totalInputMinutes = Math.round(inputHours * 60);
  }
  
  if (totalInputMinutes <= 0) {
    return res.status(400).json({ error: 'É necessário fornecer minutos ou horas para registrar' });
  }
  
  const totalHours = (totalInputMinutes / 60).toFixed(2);

  // Verificar se já existe sessão para esta data
  db.get('SELECT * FROM study_sessions WHERE user_id = ? AND date = ?', [userId, date], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao verificar sessão existente' });
    }

    if (existing) {
      // IMPORTANTE: Usar APENAS o campo 'minutes' para evitar duplicação
      // O campo 'hours' é calculado, então não usar para somar
      let existingMinutes = parseInt(existing.minutes) || 0;
      
      // Se não houver minutos mas houver hours (dados antigos), converter
      if (existingMinutes === 0 && existing.hours) {
        existingMinutes = Math.round(parseFloat(existing.hours) * 60);
      }
      
      // Somar apenas os minutos (não somar hours novamente!)
      const newTotalMinutes = existingMinutes + totalInputMinutes;
      const newHours = (newTotalMinutes / 60).toFixed(2);
      
      db.run(
        `UPDATE study_sessions 
         SET hours = ?, minutes = ?, 
             subject = COALESCE(?, subject), notes = COALESCE(?, notes)
         WHERE id = ? AND user_id = ?`,
        [newHours, newTotalMinutes, subject, notes, existing.id, userId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar sessão' });
          }
          db.get('SELECT * FROM study_sessions WHERE id = ?', [existing.id], (err, updated) => {
            if (err) {
              return res.status(500).json({ error: 'Erro ao buscar sessão atualizada' });
            }
            res.json(updated);
          });
        }
      );
    } else {
      // Criar nova sessão
      db.run(
        'INSERT INTO study_sessions (user_id, date, hours, minutes, subject, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, date, totalHours, totalInputMinutes, subject || null, notes || null],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Erro ao criar sessão' });
          }
          db.get('SELECT * FROM study_sessions WHERE id = ?', [this.lastID], (err, session) => {
            if (err) {
              return res.status(500).json({ error: 'Erro ao buscar sessão criada' });
            }
            res.status(201).json(session);
          });
        }
      );
    }
  });
});

// Atualizar sessão
router.put('/:id', [
  body('hours').optional().isFloat({ min: 0, max: 24 }),
  body('minutes').optional().isInt({ min: 0, max: 59 })
], (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { date, hours, minutes, subject, notes } = req.body;
  const db = getDatabase();

  db.get('SELECT * FROM study_sessions WHERE id = ? AND user_id = ?', [id, userId], (err, session) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao verificar sessão' });
    }
    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    // VALIDAÇÃO DE SEGURANÇA: Não permite alterar data para passado/futuro
    const today = new Date().toISOString().split('T')[0];
    if (date !== undefined && date !== today) {
      return res.status(400).json({ error: 'Só é permitido registrar horas estudadas para o dia atual' });
    }

    const totalHours = hours !== undefined && minutes !== undefined 
      ? (parseFloat(hours) + (parseInt(minutes) / 60)).toFixed(2)
      : session.hours;

    const updates = [];
    const values = [];

    // Não permitir alterar data (sempre mantém a data original)
    if (hours !== undefined) {
      updates.push('hours = ?');
      values.push(totalHours);
    }
    if (minutes !== undefined) {
      updates.push('minutes = ?');
      values.push(minutes);
    }
    if (subject !== undefined) {
      updates.push('subject = ?');
      values.push(subject);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.json(session);
    }

    values.push(id, userId);
    const query = `UPDATE study_sessions SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;

    db.run(query, values, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar sessão' });
      }
      db.get('SELECT * FROM study_sessions WHERE id = ?', [id], (err, updated) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao buscar sessão atualizada' });
        }
        res.json(updated);
      });
    });
  });
});

// Deletar sessão
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const db = getDatabase();

  db.get('SELECT id FROM study_sessions WHERE id = ? AND user_id = ?', [id, userId], (err, session) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao verificar sessão' });
    }
    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    db.run('DELETE FROM study_sessions WHERE id = ? AND user_id = ?', [id, userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao deletar sessão' });
      }
      res.json({ message: 'Sessão deletada com sucesso' });
    });
  });
});

// Estatísticas de horas
router.get('/stats/summary', (req, res) => {
  const userId = req.user.id;
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];

  // Total de horas (usa APENAS minutos para evitar duplicação, já que hours é calculado a partir de minutes)
  db.get(`
    SELECT 
      COALESCE(SUM(CAST(minutes AS REAL) / 60.0), 0) as total_hours 
    FROM study_sessions 
    WHERE user_id = ?
  `, [userId], (err, totalResult) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }

    // Horas de hoje (usa APENAS minutos para evitar duplicação)
    db.get(`
      SELECT 
        COALESCE(SUM(CAST(minutes AS REAL) / 60.0), 0) as today_hours 
      FROM study_sessions 
      WHERE user_id = ? AND date = ?
    `, [userId, today], (err, todayResult) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
      }

      // Média diária (usa APENAS minutos)
      db.get(`
        SELECT 
          AVG(CAST(minutes AS REAL) / 60.0) as avg_hours,
          COUNT(DISTINCT date) as days_studied 
        FROM study_sessions 
        WHERE user_id = ?
      `, [userId], (err, avgResult) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
        }

        res.json({
          totalHours: parseFloat(totalResult.total_hours || 0).toFixed(2),
          todayHours: parseFloat(todayResult.today_hours || 0).toFixed(2),
          avgHours: parseFloat(avgResult.avg_hours || 0).toFixed(2),
          daysStudied: avgResult.days_studied || 0
        });
      });
    });
  });
});

module.exports = router;
