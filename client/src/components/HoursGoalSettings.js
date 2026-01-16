import React, { useState, useEffect } from 'react';
import { X, Clock, Save } from 'lucide-react';
import { settingsService } from '../services/settings';
import { showSuccess, showError } from '../utils/toast';
import { formatMinutes } from '../utils/timeFormatter';
import './HoursGoalSettings.css';

const HoursGoalSettings = ({ isOpen, onClose, currentGoal, onUpdate }) => {
  const [hours, setHours] = useState(currentGoal || 2.0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHours(currentGoal || 2.0);
    }
  }, [isOpen, currentGoal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hours <= 0 || hours > 24) {
      showError('A meta deve ser entre 15 minutos e 24 horas (1440 minutos)');
      return;
    }

    try {
      setLoading(true);
      await settingsService.update({ daily_hours_goal: hours });
      const totalMinutes = Math.round(hours * 60);
      showSuccess(`Meta de ${formatMinutes(totalMinutes)} configurada com sucesso!`);
      if (onUpdate) onUpdate(hours);
      onClose();
    } catch (error) {
      showError(error.response?.data?.error || 'Erro ao atualizar meta');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay hours-goal-settings-overlay" onClick={onClose}>
      <div className="modal-content hours-goal-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <Clock size={24} className="modal-icon" />
            <h2>Configurar Meta Diária de Horas</h2>
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="hours-goal-form">
          <div className="form-group">
            <label htmlFor="hours-goal">
              Quantos minutos você quer estudar por dia?
            </label>
            <div className="input-wrapper">
              <input
                type="number"
                id="hours-goal"
                min="15"
                max="1440"
                step="15"
                value={Math.round(hours * 60)}
                onChange={(e) => {
                  const minutes = parseInt(e.target.value) || 0;
                  setHours(minutes / 60);
                }}
                required
                className="hours-input"
              />
              <span className="input-suffix">minutos</span>
            </div>
            <small className="form-hint">
              Você pode escolher entre 15 minutos e 24 horas (1440 minutos) por dia
            </small>
          </div>

          <div className="goal-preview">
            <div className="preview-item">
              <span className="preview-label">Meta atual:</span>
              <span className="preview-value">{formatMinutes(Math.round((currentGoal || 2.0) * 60))}</span>
            </div>
            <div className="preview-arrow">→</div>
            <div className="preview-item new">
              <span className="preview-label">Nova meta:</span>
              <span className="preview-value">{formatMinutes(Math.round(hours * 60))}</span>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={18} />
              {loading ? 'Salvando...' : 'Salvar Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HoursGoalSettings;
