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

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const goal = await goalsService.getById(id, userId);
      if (!goal) {
        return res.status(404).json({ error: 'Meta não encontrada' });
      }

      res.json(goal);
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

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const errors = validateGoal(req.body, true);
      
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const goal = await goalsService.update(id, userId, req.body);
      if (!goal) {
        return res.status(404).json({ error: 'Meta não encontrada' });
      }

      res.json(goal);
    } catch (error) {
      next(error);
    }
  }

  async toggle(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const goal = await goalsService.toggle(id, userId);
      if (!goal) {
        return res.status(404).json({ error: 'Meta não encontrada' });
      }

      res.json(goal);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const deleted = await goalsService.delete(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: 'Meta não encontrada' });
      }

      res.json({ message: 'Meta deletada com sucesso' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GoalsController();
