/**
 * Database Adapter - Abstrai diferenças entre SQLite e PostgreSQL
 * Permite que o código funcione com ambos os bancos
 */

const { USE_POSTGRES, getDatabase } = require('../database');

class DatabaseAdapter {
  constructor(db) {
    this.db = db;
    this.isPostgres = USE_POSTGRES;
  }

  // Executar query e retornar um único resultado
  get(query, params, callback) {
    if (this.isPostgres) {
      // PostgreSQL usa $1, $2, $3... ao invés de ?
      const pgQuery = this.convertQuery(query);
      this.db.query(pgQuery, params)
        .then(result => {
          callback(null, result.rows[0] || null);
        })
        .catch(err => callback(err));
    } else {
      // SQLite
      this.db.get(query, params, callback);
    }
  }

  // Executar query e retornar múltiplos resultados
  all(query, params, callback) {
    if (this.isPostgres) {
      const pgQuery = this.convertQuery(query);
      this.db.query(pgQuery, params)
        .then(result => {
          callback(null, result.rows);
        })
        .catch(err => callback(err));
    } else {
      // SQLite
      this.db.all(query, params, callback);
    }
  }

  // Executar query sem retornar resultados (INSERT, UPDATE, DELETE)
  run(query, params, callback) {
    if (this.isPostgres) {
      const pgQuery = this.convertQuery(query);
      // Se for INSERT, adicionar RETURNING id
      let finalQuery = pgQuery;
      if (query.toUpperCase().includes('INSERT INTO')) {
        const tableMatch = query.match(/INSERT INTO\s+(\w+)/i);
        if (tableMatch && !query.includes('RETURNING')) {
          finalQuery = pgQuery.replace(/;?\s*$/, '') + ' RETURNING id';
        }
      }
      
      this.db.query(finalQuery, params)
        .then(result => {
          // Criar objeto mockThis para compatibilidade com SQLite
          const mockThis = {
            lastID: result.rows[0]?.id || null
          };
          if (callback) {
            // Chamar callback como se fosse SQLite (com this.lastID)
            callback.call(mockThis, null);
          }
        })
        .catch(err => {
          if (callback) {
            const mockThis = { lastID: null };
            callback.call(mockThis, err);
          }
        });
    } else {
      // SQLite
      this.db.run(query, params, function(err) {
        if (callback) callback.call(this, err);
      });
    }
  }

  // Converter query SQLite (?) para PostgreSQL ($1, $2, $3...)
  convertQuery(query) {
    if (!this.isPostgres) return query;
    
    let paramIndex = 1;
    return query.replace(/\?/g, () => `$${paramIndex++}`);
  }

  // Serialize (apenas para SQLite, no-op para PostgreSQL)
  serialize(callback) {
    if (this.isPostgres) {
      // PostgreSQL não precisa de serialize
      if (callback) callback();
    } else {
      this.db.serialize(callback);
    }
  }
}

// Factory function para criar adapter
const getDatabaseAdapter = () => {
  const db = getDatabase();
  return new DatabaseAdapter(db);
};

module.exports = { getDatabaseAdapter, DatabaseAdapter };
