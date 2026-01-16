/**
 * Rota temporária de admin para correções
 * ATENÇÃO: Remover após uso ou proteger com autenticação adequada
 */

const express = require('express');
const { getDatabase } = require('../database');
const { USE_POSTGRES } = require('../database');

const router = express.Router();

// Rota temporária para corrigir tempo do usuário
// ATENÇÃO: Proteger com autenticação em produção!
router.post('/fix-user-time', async (req, res) => {
  try {
    const { email, minutes } = req.body;
    
    if (!email || !minutes) {
      return res.status(400).json({ error: 'Email e minutos são obrigatórios' });
    }

    const db = getDatabase();
    const correctHours = (parseInt(minutes) / 60).toFixed(2);

    // Encontrar usuário
    let user;
    if (USE_POSTGRES) {
      const result = await db.query('SELECT id, email, name FROM users WHERE email = $1', [email]);
      user = result.rows[0];
    } else {
      user = await new Promise((resolve, reject) => {
        db.get('SELECT id, email, name FROM users WHERE email = ?', [email], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar sessões do usuário
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

    if (allSessions.length === 0) {
      // Criar nova sessão
      const today = new Date().toISOString().split('T')[0];
      if (USE_POSTGRES) {
        await db.query(
          'INSERT INTO study_sessions (user_id, date, minutes, hours) VALUES ($1, $2, $3, $4)',
          [user.id, today, parseInt(minutes), correctHours]
        );
      } else {
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO study_sessions (user_id, date, minutes, hours) VALUES (?, ?, ?, ?)',
            [user.id, today, parseInt(minutes), correctHours],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });
      }
      return res.json({ 
        success: true, 
        message: `Sessão criada com ${minutes} minutos para ${user.name}` 
      });
    } else {
      // Atualizar sessão mais recente
      const mostRecent = allSessions[0];
      const others = allSessions.slice(1);

      if (USE_POSTGRES) {
        await db.query(
          'UPDATE study_sessions SET minutes = $1, hours = $2 WHERE id = $3',
          [parseInt(minutes), correctHours, mostRecent.id]
        );
        
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
            [parseInt(minutes), correctHours, mostRecent.id],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
        
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

      return res.json({ 
        success: true, 
        message: `Tempo corrigido para ${minutes} minutos. ${others.length} sessões antigas removidas.`,
        user: user.name,
        sessionsUpdated: 1,
        sessionsDeleted: others.length
      });
    }
  } catch (error) {
    console.error('Erro ao corrigir tempo:', error);
    return res.status(500).json({ error: 'Erro ao corrigir tempo do usuário' });
  }
});

module.exports = router;
