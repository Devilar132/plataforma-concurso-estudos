const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDatabaseAdapter } = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Registrar novo usuário
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    const db = getDatabaseAdapter();

    // Verificar se email já existe
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Erro no servidor' });
      }
      
      if (user) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Inserir usuário
      db.run(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashedPassword],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Erro ao criar usuário' });
          }

          // Obter ID do usuário criado (this.lastID funciona tanto para SQLite quanto PostgreSQL via adapter)
          const userId = this.lastID;
          
          if (!userId) {
            // Fallback: buscar ID do usuário recém-criado
            db.get('SELECT id FROM users WHERE email = ?', [email], (err, newUser) => {
              if (err || !newUser) {
                return res.status(500).json({ error: 'Erro ao obter ID do usuário' });
              }
              
              const token = jwt.sign(
                { id: newUser.id, email },
                JWT_SECRET,
                { expiresIn: '7d' }
              );

              res.status(201).json({
                message: 'Usuário criado com sucesso',
                token,
                user: { id: newUser.id, name, email }
              });
            });
            return;
          }
          
          // Gerar token
          const token = jwt.sign(
            { id: userId, email },
            JWT_SECRET,
            { expiresIn: '7d' }
          );

          res.status(201).json({
            message: 'Usuário criado com sucesso',
            token,
            user: { id: userId, name, email }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const db = getDatabaseAdapter();

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Erro no servidor' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Email ou senha incorretos' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Email ou senha incorretos' });
      }

      // Gerar token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login realizado com sucesso',
        token,
        user: { id: user.id, name: user.name, email: user.email }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;
