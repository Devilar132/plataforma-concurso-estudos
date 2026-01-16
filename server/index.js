const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./database');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const goalsRoutes = require('./routes/goals');
const statsRoutes = require('./routes/stats');
const sessionsRoutes = require('./routes/sessions');
const streakRoutes = require('./routes/streak');
const milestonesRoutes = require('./routes/milestones');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Configurar CORS para aceitar requisições do frontend em produção
const corsOptions = {
  origin: process.env.FRONTEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

// Inicializar banco de dados antes de iniciar o servidor
initDatabase((err) => {
  if (err) {
    console.error('Erro ao inicializar banco de dados:', err);
    process.exit(1);
  }

  // Rotas
  app.use('/api/auth', authRoutes);
  app.use('/api/goals', goalsRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/sessions', sessionsRoutes);
  app.use('/api/streak', streakRoutes);
  app.use('/api/milestones', milestonesRoutes);
  app.use('/api/settings', settingsRoutes);
  
  // Error handler (deve ser o último middleware)
  app.use(errorHandler);
  
  // Iniciar servidor
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 API disponível em http://localhost:${PORT}/api`);
    if (process.env.DATABASE_URL) {
      console.log('🗄️  Usando PostgreSQL');
    } else {
      console.log('🗄️  Usando SQLite');
    }
  });
});
