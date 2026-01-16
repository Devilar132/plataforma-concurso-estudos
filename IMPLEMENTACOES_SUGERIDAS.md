# 🛠️ Implementações Sugeridas - Exemplos Práticos

Este documento contém exemplos de código e estruturas para implementar as melhorias críticas identificadas na análise.

---

## 1. SISTEMA DE RETOMADA DE STREAK

### Problema
Streak quebra → usuário desanima → abandona

### Solução: Streak Freeze + Recovery Day

#### Backend: `server/services/streakService.js`
```javascript
class StreakService {
  /**
   * Calcula streak com suporte a "freeze" e "recovery"
   */
  async calculateStreak(userId, options = {}) {
    const { allowFreeze = true, allowRecovery = true } = options;
    
    // Buscar dias com metas concluídas
    const completedDays = await this.getCompletedDays(userId);
    
    // Buscar freezes usados
    const freezes = await this.getFreezes(userId);
    
    // Calcular streak atual
    let currentStreak = 0;
    let checkDate = new Date();
    const datesSet = new Set(completedDays);
    const freezeSet = new Set(freezes.map(f => f.date));
    
    // Verificar hoje
    const todayStr = checkDate.toISOString().split('T')[0];
    if (!datesSet.has(todayStr) && !freezeSet.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Contar para trás
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      
      if (datesSet.has(dateStr)) {
        currentStreak++;
      } else if (allowFreeze && freezeSet.has(dateStr)) {
        currentStreak++; // Freeze conta como dia válido
      } else {
        break;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return {
      currentStreak,
      longestStreak: await this.getLongestStreak(userId),
      freezesUsed: freezes.length,
      freezesAvailable: Math.max(0, 2 - freezes.length), // 2 por mês
      canRecover: allowRecovery && this.canRecover(userId)
    };
  }
  
  /**
   * Usa um "freeze" para proteger o streak
   */
  async useFreeze(userId, date) {
    const freezes = await this.getFreezes(userId);
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    const monthlyFreezes = freezes.filter(f => {
      const freezeDate = new Date(f.date);
      return freezeDate.getMonth() === thisMonth && 
             freezeDate.getFullYear() === thisYear;
    });
    
    if (monthlyFreezes.length >= 2) {
      throw new Error('Você já usou todos os freezes deste mês');
    }
    
    // Criar freeze
    await db.run(
      'INSERT INTO streak_freezes (user_id, date) VALUES (?, ?)',
      [userId, date]
    );
  }
  
  /**
   * Recupera um dia perdido (1 vez por streak)
   */
  async recoverDay(userId, date) {
    const canRecover = await this.canRecover(userId);
    if (!canRecover) {
      throw new Error('Você já usou sua recuperação para este streak');
    }
    
    // Marcar como recuperado
    await db.run(
      'INSERT INTO streak_recoveries (user_id, date, recovered_at) VALUES (?, ?, ?)',
      [userId, date, new Date().toISOString()]
    );
    
    // Criar meta "fantasma" para aquele dia
    await db.run(
      'INSERT INTO goals (user_id, title, date, completed, is_recovery) VALUES (?, ?, ?, 1, 1)',
      [userId, 'Dia recuperado', date]
    );
  }
}

module.exports = new StreakService();
```

#### Frontend: `client/src/components/StreakRecoveryModal.js`
```javascript
import React, { useState } from 'react';
import { Flame, Shield, RotateCcw } from 'lucide-react';
import { streakService } from '../services/streak';

const StreakRecoveryModal = ({ isOpen, onClose, streakData }) => {
  const [action, setAction] = useState(null); // 'freeze' ou 'recover'
  
  if (!isOpen || streakData.currentStreak > 0) return null;
  
  const handleFreeze = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await streakService.useFreeze(today);
      showSuccess('Streak protegido! Você ainda tem sua sequência.');
      onClose();
    } catch (error) {
      showError(error.message);
    }
  };
  
  const handleRecover = async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      await streakService.recoverDay(yesterdayStr);
      showSuccess('Dia recuperado! Sua sequência continua.');
      onClose();
    } catch (error) {
      showError(error.message);
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content streak-recovery-modal">
        <h2>🛡️ Proteja sua Sequência!</h2>
        <p>
          Você perdeu sua sequência, mas ainda pode recuperá-la!
        </p>
        
        <div className="recovery-options">
          {streakData.freezesAvailable > 0 && (
            <button onClick={handleFreeze} className="recovery-option">
              <Shield size={24} />
              <div>
                <strong>Usar Streak Freeze</strong>
                <p>Protege hoje e mantém sua sequência</p>
                <small>{streakData.freezesAvailable} disponíveis este mês</small>
              </div>
            </button>
          )}
          
          {streakData.canRecover && (
            <button onClick={handleRecover} className="recovery-option">
              <RotateCcw size={24} />
              <div>
                <strong>Recuperar Dia Anterior</strong>
                <p>Marca ontem como concluído (1 vez por sequência)</p>
              </div>
            </button>
          )}
        </div>
        
        <button onClick={onClose} className="btn-secondary">
          Começar Nova Sequência
        </button>
      </div>
    </div>
  );
};
```

---

## 2. ONBOARDING INTERATIVO

### Problema
Usuário novo → dashboard vazio → não sabe o que fazer

### Solução: Tour + Meta de Exemplo

#### Frontend: `client/src/components/OnboardingTour.js`
```javascript
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Target, Clock, BarChart3 } from 'lucide-react';
import { goalsService } from '../services/goals';

const OnboardingTour = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [showExampleGoal, setShowExampleGoal] = useState(false);
  
  const steps = [
    {
      title: 'Bem-vindo! 👋',
      content: 'Vamos configurar sua primeira meta de estudo?',
      target: null
    },
    {
      title: 'Criar Metas',
      content: 'Clique aqui para criar suas metas diárias de estudo',
      target: '.btn-add',
      position: 'bottom'
    },
    {
      title: 'Timer Pomodoro',
      content: 'Use o timer para manter o foco durante os estudos',
      target: '.pomodoro-section',
      position: 'left'
    },
    {
      title: 'Acompanhar Progresso',
      content: 'Veja suas estatísticas e sequência de dias estudados',
      target: '.stats-link',
      position: 'top'
    }
  ];
  
  const createExampleGoal = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await goalsService.create({
        title: 'Revisar Direito Constitucional',
        description: 'Ler capítulo 1 e fazer exercícios',
        tag: 'Direito',
        date: today
      });
      setShowExampleGoal(true);
      setStep(step + 1);
    } catch (error) {
      showError('Erro ao criar meta de exemplo');
    }
  };
  
  if (step >= steps.length) {
    onComplete();
    return null;
  }
  
  const currentStep = steps[step];
  
  return (
    <div className="onboarding-overlay">
      {currentStep.target && (
        <div 
          className="onboarding-highlight"
          style={getHighlightPosition(currentStep.target)}
        />
      )}
      
      <div 
        className="onboarding-tooltip"
        style={getTooltipPosition(currentStep.target, currentStep.position)}
      >
        <div className="tooltip-header">
          <h3>{currentStep.title}</h3>
          <button onClick={() => onComplete()}>
            <X size={20} />
          </button>
        </div>
        
        <p>{currentStep.content}</p>
        
        {step === 0 && (
          <button onClick={createExampleGoal} className="btn-primary">
            Criar Minha Primeira Meta
          </button>
        )}
        
        <div className="tooltip-footer">
          <span>{step + 1} de {steps.length}</span>
          <button onClick={() => setStep(step + 1)}>
            Próximo <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
```

#### Backend: Rota para verificar se precisa de onboarding
```javascript
// server/routes/user.js
router.get('/onboarding-status', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  // Verificar se usuário tem metas
  db.get(
    'SELECT COUNT(*) as count FROM goals WHERE user_id = ?',
    [userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao verificar status' });
      }
      
      const needsOnboarding = result.count === 0;
      
      res.json({
        needsOnboarding,
        hasCompletedOnboarding: !needsOnboarding
      });
    }
  );
});
```

---

## 3. DASHBOARD REESTRUTURADO

### Problema
Hierarquia confusa, não fica claro o que fazer

### Solução: Hero Section + Ações Rápidas

#### Frontend: `client/src/pages/Dashboard.js` (versão melhorada)
```javascript
const Dashboard = () => {
  const [progress, setProgress] = useState({ today: 0, total: 0 });
  const [quickActions, setQuickActions] = useState([]);
  
  return (
    <div className="dashboard">
      {/* HERO SECTION - Grande, destaque */}
      <section className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-main">
            <h1>Olá, {user.name}! 👋</h1>
            <p className="hero-subtitle">
              {streak.currentStreak > 0 
                ? `🔥 ${streak.currentStreak} dias consecutivos!`
                : 'Vamos começar sua sequência hoje?'}
            </p>
          </div>
          
          <div className="hero-progress">
            <div className="progress-circle">
              <CircularProgress 
                value={(progress.today / progress.total) * 100}
                size={120}
              />
              <div className="progress-text">
                <span className="progress-value">{progress.today}</span>
                <span className="progress-total">/ {progress.total}</span>
              </div>
            </div>
            <p className="progress-label">Metas de hoje</p>
          </div>
        </div>
        
        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={handleStartStudy}>
            <Play size={24} />
            Iniciar Estudo
          </button>
          <button className="btn-hero-secondary" onClick={() => setShowForm(true)}>
            <Plus size={20} />
            Nova Meta
          </button>
        </div>
      </section>
      
      {/* HEATMAP SEMANAL */}
      <section className="dashboard-heatmap">
        <h3>Esta Semana</h3>
        <div className="heatmap-grid">
          {weekDays.map((day, index) => (
            <div 
              key={index}
              className={`heatmap-day ${day.hasStudy ? 'active' : ''} ${day.isToday ? 'today' : ''}`}
              title={day.date}
            >
              <span className="day-label">{day.label}</span>
              {day.hasStudy && <div className="day-indicator" />}
            </div>
          ))}
        </div>
      </section>
      
      {/* METAS DE HOJE */}
      <section className="dashboard-goals">
        <div className="section-header">
          <h2>Metas de Hoje</h2>
          <span className="section-count">{goals.length} metas</span>
        </div>
        
        {goals.length === 0 ? (
          <EmptyState onAddGoal={() => setShowForm(true)} />
        ) : (
          <GoalsList goals={goals} />
        )}
      </section>
    </div>
  );
};
```

---

## 4. INTEGRAÇÃO TIMER NO DASHBOARD

### Problema
Timer separado = fricção adicional

### Solução: Modal Integrado

#### Frontend: `client/src/components/StudyModal.js`
```javascript
import React, { useState } from 'react';
import { X, Play, Clock, Book } from 'lucide-react';
import PomodoroTimer from './PomodoroTimer';
import { sessionsService } from '../services/sessions';

const StudyModal = ({ isOpen, onClose, todayGoals }) => {
  const [mode, setMode] = useState('timer'); // 'timer' ou 'manual'
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const subjects = [...new Set(todayGoals.map(g => g.tag).filter(Boolean))];
  
  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`}>
      <div className="modal-content study-modal">
        <div className="modal-header">
          <h2>Iniciar Estudo</h2>
          <button onClick={onClose} className="btn-icon">
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-tabs">
          <button 
            className={`tab ${mode === 'timer' ? 'active' : ''}`}
            onClick={() => setMode('timer')}
          >
            <Clock size={20} />
            Timer Pomodoro
          </button>
          <button 
            className={`tab ${mode === 'manual' ? 'active' : ''}`}
            onClick={() => setMode('manual')}
          >
            <Book size={20} />
            Registrar Manualmente
          </button>
        </div>
        
        <div className="modal-body">
          {mode === 'timer' ? (
            <div className="timer-section">
              <div className="subject-selector">
                <label>Matéria/Tema</label>
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              
              <PomodoroTimer 
                subject={selectedSubject}
                onComplete={onClose}
              />
            </div>
          ) : (
            <ManualEntryForm 
              subjects={subjects}
              onComplete={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};
```

---

## 5. MIGRAÇÃO PARA POSTGRESQL

### Problema
SQLite não escala

### Solução: Schema PostgreSQL + Migração

#### Backend: `server/database/postgres.js`
```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro no PostgreSQL:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool
};
```

#### Migração: `server/migrations/001_initial_schema.sql`
```sql
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

-- Tabela de recuperações
CREATE TABLE IF NOT EXISTS streak_recoveries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  recovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_goals_user_date ON goals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON study_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
```

#### Script de Migração: `server/scripts/migrate-to-postgres.js`
```javascript
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

async function migrate() {
  // Conectar SQLite
  const sqliteDb = new sqlite3.Database(path.join(__dirname, '../../database.sqlite'));
  
  // Conectar PostgreSQL
  const pgPool = new Pool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  
  console.log('🔄 Iniciando migração...');
  
  // Migrar usuários
  const users = await new Promise((resolve, reject) => {
    sqliteDb.all('SELECT * FROM users', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  for (const user of users) {
    await pgPool.query(
      'INSERT INTO users (id, name, email, password, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
      [user.id, user.name, user.email, user.password, user.created_at]
    );
  }
  
  console.log(`✅ Migrados ${users.length} usuários`);
  
  // Migrar metas
  const goals = await new Promise((resolve, reject) => {
    sqliteDb.all('SELECT * FROM goals', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  for (const goal of goals) {
    await pgPool.query(
      'INSERT INTO goals (id, user_id, title, description, tag, date, completed, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING',
      [goal.id, goal.user_id, goal.title, goal.description, goal.tag, goal.date, goal.completed, goal.notes, goal.created_at]
    );
  }
  
  console.log(`✅ Migradas ${goals.length} metas`);
  
  // Migrar sessões
  const sessions = await new Promise((resolve, reject) => {
    sqliteDb.all('SELECT * FROM study_sessions', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  for (const session of sessions) {
    await pgPool.query(
      'INSERT INTO study_sessions (id, user_id, date, minutes, hours, subject, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING',
      [session.id, session.user_id, session.date, session.minutes, session.hours, session.subject, session.notes, session.created_at]
    );
  }
  
  console.log(`✅ Migradas ${sessions.length} sessões`);
  
  sqliteDb.close();
  await pgPool.end();
  
  console.log('✅ Migração concluída!');
}

migrate().catch(console.error);
```

---

## 6. SISTEMA DE NOTIFICAÇÕES

### Problema
Usuário esquece do produto

### Solução: Push Notifications + Email

#### Frontend: `client/src/services/notifications.js`
```javascript
class NotificationService {
  async requestPermission() {
    if (!('Notification' in window)) {
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  async scheduleDailyReminder() {
    const permission = await this.requestPermission();
    if (!permission) return;
    
    // Agendar notificação diária às 8h
    // (usando Service Worker para notificações agendadas)
    
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('📚 Hora de Estudar!', {
        body: 'Você tem metas para hoje. Vamos começar?',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'daily-reminder',
        requireInteraction: false,
        actions: [
          { action: 'open', title: 'Abrir App' },
          { action: 'dismiss', title: 'Depois' }
        ]
      });
    }
  }
  
  async notifyStreakAtRisk() {
    // Notificar se não abriu há 2 dias
    const lastAccess = localStorage.getItem('lastAccess');
    const daysSinceAccess = (Date.now() - lastAccess) / (1000 * 60 * 60 * 24);
    
    if (daysSinceAccess >= 2) {
      await this.showNotification(
        '🔥 Sua sequência está em risco!',
        'Você não estudou há 2 dias. Volte hoje para manter sua sequência!'
      );
    }
  }
  
  async notifyStreakMilestone(days) {
    await this.showNotification(
      `🎉 ${days} dias consecutivos!`,
      `Parabéns! Você está mantendo a disciplina. Continue assim!`
    );
  }
  
  async showNotification(title, body) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png'
      });
    }
  }
}

export const notificationService = new NotificationService();
```

#### Backend: `server/services/emailService.js`
```javascript
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  async sendDailyReminder(user, goals) {
    const html = `
      <h2>Olá, ${user.name}! 👋</h2>
      <p>Você tem <strong>${goals.length}</strong> metas para hoje:</p>
      <ul>
        ${goals.map(g => `<li>${g.title}</li>`).join('')}
      </ul>
      <p><a href="${process.env.APP_URL}/dashboard">Acessar Dashboard</a></p>
    `;
    
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: '📚 Suas metas de estudo de hoje',
      html
    });
  }
  
  async sendWeeklyReport(user, stats) {
    const html = `
      <h2>Relatório Semanal - ${user.name}</h2>
      <p>Esta semana você:</p>
      <ul>
        <li>Completou <strong>${stats.completedGoals}</strong> metas</li>
        <li>Estudou <strong>${stats.totalHours}</strong> horas</li>
        <li>Manteve uma sequência de <strong>${stats.currentStreak}</strong> dias</li>
      </ul>
      <p><a href="${process.env.APP_URL}/statistics">Ver Estatísticas Completas</a></p>
    `;
    
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: '📊 Seu relatório semanal de estudos',
      html
    });
  }
}

module.exports = new EmailService();
```

---

## 7. ARQUITETURA BACKEND REFATORADA

### Estrutura Sugerida

```
server/
├── routes/
│   ├── auth.js          # Apenas roteamento
│   ├── goals.js         # Apenas roteamento
│   └── sessions.js      # Apenas roteamento
├── controllers/
│   ├── authController.js
│   ├── goalsController.js
│   └── sessionsController.js
├── services/
│   ├── authService.js
│   ├── goalsService.js
│   ├── sessionsService.js
│   ├── streakService.js
│   └── emailService.js
├── models/
│   ├── User.js
│   ├── Goal.js
│   └── StudySession.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   └── logger.js
└── utils/
    ├── validators.js
    └── helpers.js
```

#### Exemplo: `server/controllers/goalsController.js`
```javascript
const goalsService = require('../services/goalsService');
const { validateGoal } = require('../utils/validators');

class GoalsController {
  async getAll(req, res, next) {
    try {
      const { date, startDate, endDate } = req.query;
      const userId = req.user.id;
      
      const goals = await goalsService.getAll(userId, { date, startDate, endDate });
      res.json(goals);
    } catch (error) {
      next(error);
    }
  }
  
  async create(req, res, next) {
    try {
      const errors = validateGoal(req.body);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }
      
      const goal = await goalsService.create(req.user.id, req.body);
      res.status(201).json(goal);
    } catch (error) {
      next(error);
    }
  }
  
  // ... outros métodos
}

module.exports = new GoalsController();
```

#### Exemplo: `server/services/goalsService.js`
```javascript
const Goal = require('../models/Goal');
const db = require('../database/postgres');

class GoalsService {
  async getAll(userId, filters = {}) {
    let query = 'SELECT * FROM goals WHERE user_id = $1';
    const params = [userId];
    
    if (filters.date) {
      query += ' AND date = $2';
      params.push(filters.date);
    } else if (filters.startDate && filters.endDate) {
      query += ' AND date BETWEEN $2 AND $3';
      params.push(filters.startDate, filters.endDate);
    }
    
    query += ' ORDER BY date DESC, created_at DESC';
    
    const result = await db.query(query, params);
    return result.rows;
  }
  
  async create(userId, goalData) {
    const { title, description, tag, date, notes } = goalData;
    
    const result = await db.query(
      `INSERT INTO goals (user_id, title, description, tag, date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, title, description, tag, date, notes]
    );
    
    return result.rows[0];
  }
  
  // ... outros métodos
}

module.exports = new GoalsService();
```

---

## 8. ERROR HANDLING ROBUSTO

### Backend: `server/middleware/errorHandler.js`
```javascript
const logger = require('./logger');

function errorHandler(err, req, res, next) {
  // Log do erro
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });
  
  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.details
    });
  }
  
  // Erro de autenticação
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Não autorizado'
    });
  }
  
  // Erro de banco de dados
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      error: 'Registro já existe'
    });
  }
  
  // Erro genérico
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor'
      : err.message
  });
}

module.exports = errorHandler;
```

### Frontend: `client/src/components/ErrorBoundary.js`
```javascript
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log para serviço de monitoramento
    console.error('Error caught by boundary:', error, errorInfo);
    // Enviar para Sentry, LogRocket, etc.
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Ops! Algo deu errado</h2>
          <p>Por favor, recarregue a página ou entre em contato com o suporte.</p>
          <button onClick={() => window.location.reload()}>
            Recarregar Página
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default ErrorBoundary;
```

---

## 📝 NOTAS FINAIS

Estes exemplos são **guias de implementação**. Adapte conforme necessário:

1. **Teste cada mudança** antes de implementar a próxima
2. **Migre gradualmente** (não tudo de uma vez)
3. **Mantenha compatibilidade** durante a transição
4. **Documente** todas as mudanças

**Priorize impacto sobre complexidade. Comece pelo que gera mais retenção.**