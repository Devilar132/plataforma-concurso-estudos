const express = require('express');
const { getDatabase } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Obter configurações do usuário
router.get('/', (req, res) => {
  const userId = req.user.id;
  const db = getDatabase();

  db.get(
    'SELECT * FROM user_settings WHERE user_id = ?',
    [userId],
    (err, settings) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar configurações' });
      }

      // Se não existir, criar com valores padrão
      if (!settings) {
        db.run(
          `INSERT INTO user_settings (user_id, daily_hours_goal) VALUES (?, ?)`,
          [userId, 2.0],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Erro ao criar configurações' });
            }
            db.get('SELECT * FROM user_settings WHERE id = ?', [this.lastID], (err, newSettings) => {
              if (err) {
                return res.status(500).json({ error: 'Erro ao buscar configurações criadas' });
              }
              res.json(newSettings);
            });
          }
        );
      } else {
        res.json(settings);
      }
    }
  );
});

// Atualizar configurações
router.put('/', (req, res) => {
  const userId = req.user.id;
  const db = getDatabase();
  const { daily_hours_goal, theme, notifications_enabled, email_notifications } = req.body;

  // Verificar se existe
  db.get('SELECT id FROM user_settings WHERE user_id = ?', [userId], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao verificar configurações' });
    }

    const updates = [];
    const values = [];

    if (daily_hours_goal !== undefined) {
      updates.push('daily_hours_goal = ?');
      values.push(parseFloat(daily_hours_goal));
    }
    if (theme !== undefined) {
      updates.push('theme = ?');
      values.push(theme);
    }
    if (notifications_enabled !== undefined) {
      updates.push('notifications_enabled = ?');
      values.push(notifications_enabled ? 1 : 0);
    }
    if (email_notifications !== undefined) {
      updates.push('email_notifications = ?');
      values.push(email_notifications ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhuma atualização fornecida' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (existing) {
      // Atualizar
      values.push(userId);
      const query = `UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`;
      
      db.run(query, values, function(err) {
        if (err) {
          return res.status(500).json({ error: 'Erro ao atualizar configurações' });
        }
        db.get('SELECT * FROM user_settings WHERE user_id = ?', [userId], (err, updated) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao buscar configurações atualizadas' });
          }
          res.json(updated);
        });
      });
    } else {
      // Criar
      const defaults = {
        daily_hours_goal: daily_hours_goal !== undefined ? parseFloat(daily_hours_goal) : 2.0,
        theme: theme || 'dark',
        notifications_enabled: notifications_enabled !== undefined ? (notifications_enabled ? 1 : 0) : 1,
        email_notifications: email_notifications !== undefined ? (email_notifications ? 1 : 0) : 0
      };

      db.run(
        `INSERT INTO user_settings (user_id, daily_hours_goal, theme, notifications_enabled, email_notifications)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, defaults.daily_hours_goal, defaults.theme, defaults.notifications_enabled, defaults.email_notifications],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Erro ao criar configurações' });
          }
          db.get('SELECT * FROM user_settings WHERE id = ?', [this.lastID], (err, newSettings) => {
            if (err) {
              return res.status(500).json({ error: 'Erro ao buscar configurações criadas' });
            }
            res.json(newSettings);
          });
        }
      );
    }
  });
});

module.exports = router;
