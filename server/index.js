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
const adminRoutes = require('./routes/admin'); // Rota temporária para correções

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Configurar CORS para aceitar requisições do frontend em produção
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  'https://plataforma-concurso-estudos.vercel.app' // URL do Vercel
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc) em desenvolvimento
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // Em produção, verificar se origin está na lista ou permitir todas temporariamente
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      // Log para debug
      console.log('CORS: Origin recebida:', origin);
      console.log('CORS: Origens permitidas:', allowedOrigins);
      // Permitir todas por enquanto para garantir funcionamento
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // Para navegadores legados
};

app.use(cors(corsOptions));

// Tratar preflight requests explicitamente
app.options('*', cors(corsOptions));
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
  app.use('/api/admin', adminRoutes); // Rota temporária - REMOVER após uso!
  
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
