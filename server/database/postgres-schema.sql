-- Schema PostgreSQL para Plataforma de Acompanhamento de Estudos
-- Versão: 2.0
-- Data: 2025-01-15

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de metas
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  is_recovery BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de sessões de estudo
CREATE TABLE IF NOT EXISTS study_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  minutes INTEGER NOT NULL DEFAULT 0,
  hours DECIMAL(4,2) NOT NULL DEFAULT 0,
  subject TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de conquistas
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_type)
);

-- Tabela de streak freezes
CREATE TABLE IF NOT EXISTS streak_freezes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Tabela de recuperações de streak
CREATE TABLE IF NOT EXISTS streak_recoveries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  recovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Tabela de milestones (progresso permanente)
CREATE TABLE IF NOT EXISTS milestones (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  value INTEGER NOT NULL,
  achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, milestone_type, value)
);

-- Tabela de configurações do usuário
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_goals_user_date ON goals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_date ON goals(date);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON study_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON study_sessions(date);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_freezes_user_date ON streak_freezes(user_id, date);
CREATE INDEX IF NOT EXISTS idx_recoveries_user ON streak_recoveries(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user ON milestones(user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE users IS 'Usuários do sistema';
COMMENT ON TABLE goals IS 'Metas diárias de estudo';
COMMENT ON TABLE study_sessions IS 'Sessões de estudo registradas';
COMMENT ON TABLE achievements IS 'Conquistas desbloqueadas pelos usuários';
COMMENT ON TABLE streak_freezes IS 'Freezes usados para proteger sequências';
COMMENT ON TABLE streak_recoveries IS 'Dias recuperados via sistema de retomada';
COMMENT ON TABLE milestones IS 'Milestones permanentes (não zeram)';
COMMENT ON TABLE user_settings IS 'Configurações e preferências do usuário';
