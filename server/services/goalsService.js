const { getDatabase } = require('../database');

class GoalsService {
  async getAll(userId, filters = {}) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      let query = 'SELECT * FROM goals WHERE user_id = ?';
      const params = [userId];

      if (filters.date) {
        query += ' AND date = ?';
        params.push(filters.date);
      } else if (filters.startDate && filters.endDate) {
        query += ' AND date BETWEEN ? AND ?';
        params.push(filters.startDate, filters.endDate);
      }

      query += ' ORDER BY date DESC, created_at DESC';

      db.all(query, params, (err, goals) => {
        if (err) {
          reject(new Error('Erro ao buscar metas'));
        } else {
          resolve(goals);
        }
      });
    });
  }

  async getById(id, userId) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.get(
        'SELECT * FROM goals WHERE id = ? AND user_id = ?',
        [id, userId],
        (err, goal) => {
          if (err) {
            reject(new Error('Erro ao buscar meta'));
          } else {
            resolve(goal);
          }
        }
      );
    });
  }

  async create(userId, goalData) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const { title, description, tag, date, notes } = goalData;

      db.run(
        'INSERT INTO goals (user_id, title, description, tag, date, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, title, description || null, tag || null, date, notes || null],
        function(err) {
          if (err) {
            reject(new Error('Erro ao criar meta'));
          } else {
            db.get('SELECT * FROM goals WHERE id = ?', [this.lastID], (err, goal) => {
              if (err) {
                reject(new Error('Erro ao buscar meta criada'));
              } else {
                resolve(goal);
              }
            });
          }
        }
      );
    });
  }

  async update(id, userId, goalData) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      
      // Verificar se a meta pertence ao usuário
      db.get('SELECT * FROM goals WHERE id = ? AND user_id = ?', [id, userId], (err, goal) => {
        if (err) {
          return reject(new Error('Erro ao verificar meta'));
        }
        if (!goal) {
          return resolve(null);
        }

        const { title, description, tag, date, completed, notes } = goalData;
        const updates = [];
        const values = [];

        if (title !== undefined) {
          updates.push('title = ?');
          values.push(title);
        }
        if (description !== undefined) {
          updates.push('description = ?');
          values.push(description);
        }
        if (tag !== undefined) {
          updates.push('tag = ?');
          values.push(tag);
        }
        if (date !== undefined) {
          updates.push('date = ?');
          values.push(date);
        }
        if (completed !== undefined) {
          const today = new Date().toISOString().split('T')[0];
          if (completed && goal.date !== today) {
            return reject(new Error('Só é permitido marcar metas do dia atual como concluídas'));
          }
          updates.push('completed = ?');
          values.push(completed ? 1 : 0);
        }
        if (notes !== undefined) {
          updates.push('notes = ?');
          values.push(notes);
        }

        if (updates.length === 0) {
          return resolve(goal);
        }

        values.push(id, userId);
        const query = `UPDATE goals SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;

        db.run(query, values, function(err) {
          if (err) {
            reject(new Error('Erro ao atualizar meta'));
          } else {
            db.get('SELECT * FROM goals WHERE id = ?', [id], (err, updatedGoal) => {
              if (err) {
                reject(new Error('Erro ao buscar meta atualizada'));
              } else {
                resolve(updatedGoal);
              }
            });
          }
        });
      });
    });
  }

  async toggle(id, userId) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const today = new Date().toISOString().split('T')[0];

      db.get('SELECT completed, date FROM goals WHERE id = ? AND user_id = ?', [id, userId], (err, goal) => {
        if (err) {
          return reject(new Error('Erro ao verificar meta'));
        }
        if (!goal) {
          return resolve(null);
        }

        const willBeCompleted = !goal.completed;
        if (willBeCompleted && goal.date !== today) {
          return reject(new Error('Só é permitido marcar metas do dia atual como concluídas'));
        }

        const newCompleted = goal.completed ? 0 : 1;

        db.run(
          'UPDATE goals SET completed = ? WHERE id = ? AND user_id = ?',
          [newCompleted, id, userId],
          function(err) {
            if (err) {
              reject(new Error('Erro ao atualizar meta'));
            } else {
              db.get('SELECT * FROM goals WHERE id = ?', [id], (err, updatedGoal) => {
                if (err) {
                  reject(new Error('Erro ao buscar meta atualizada'));
                } else {
                  resolve(updatedGoal);
                }
              });
            }
          }
        );
      });
    });
  }

  async delete(id, userId) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();

      db.get('SELECT id FROM goals WHERE id = ? AND user_id = ?', [id, userId], (err, goal) => {
        if (err) {
          return reject(new Error('Erro ao verificar meta'));
        }
        if (!goal) {
          return resolve(null);
        }

        db.run('DELETE FROM goals WHERE id = ? AND user_id = ?', [id, userId], function(err) {
          if (err) {
            reject(new Error('Erro ao deletar meta'));
          } else {
            resolve({ success: true });
          }
        });
      });
    });
  }
}

module.exports = new GoalsService();
