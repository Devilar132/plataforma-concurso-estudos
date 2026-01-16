const express = require('express');
const goalsController = require('../controllers/goalsController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(authenticateToken);

// Obter metas do usuário (com filtro de data opcional)
router.get('/', goalsController.getAll.bind(goalsController));

// Obter uma meta específica
router.get('/:id', goalsController.getById.bind(goalsController));

// Criar nova meta
router.post('/', goalsController.create.bind(goalsController));

// Atualizar meta
router.put('/:id', goalsController.update.bind(goalsController));

// Marcar meta como concluída/pendente
router.patch('/:id/toggle', goalsController.toggle.bind(goalsController));

// Deletar meta
router.delete('/:id', goalsController.delete.bind(goalsController));

module.exports = router;
