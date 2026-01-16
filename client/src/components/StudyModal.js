import React, { useState } from 'react';
import { X, Clock, Book, Play } from 'lucide-react';
import PomodoroTimer from './PomodoroTimer';
import { sessionsService } from '../services/sessions';
import { showSuccess, showError } from '../utils/toast';
import { getContextualPhrase } from '../utils/motivational';
import './StudyModal.css';

const StudyModal = ({ isOpen, onClose, onSessionComplete, todayGoals }) => {
  const [mode, setMode] = useState('timer'); // 'timer' ou 'manual'
  const [selectedSubject, setSelectedSubject] = useState('');
  const [formData, setFormData] = useState({
    hours: '',
    minutes: '',
    subject: '',
    notes: ''
  });

  const subjects = [...new Set(todayGoals?.map(g => g.tag).filter(Boolean) || [])];
  const today = new Date().toISOString().split('T')[0];

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      const hours = parseFloat(formData.hours) || 0;
      const minutes = parseInt(formData.minutes) || 0;
      const totalMinutes = Math.round(hours * 60) + minutes;

      if (totalMinutes <= 0) {
        showError('É necessário informar pelo menos 1 minuto de estudo');
        return;
      }

      const session = await sessionsService.create({
        date: today,
        minutes: totalMinutes,
        subject: formData.subject || selectedSubject || null,
        notes: formData.notes || null
      });

      const totalHours = totalMinutes / 60;
      const phrase = getContextualPhrase({ type: 'study_hours', hours: totalHours });
      showSuccess(phrase || 'Horas registradas com sucesso!');
      
      setFormData({
        hours: '',
        minutes: '',
        subject: '',
        notes: ''
      });
      
      if (onSessionComplete) {
        // Passar dados da sessão para verificar meta de horas
        onSessionComplete(session);
      }
      onClose();
    } catch (error) {
      showError(error.response?.data?.error || 'Erro ao registrar horas');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay study-modal-overlay" onClick={onClose}>
      <div className="modal-content study-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Iniciar Estudo</h2>
          <button onClick={onClose} className="modal-close">
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
              {subjects.length > 0 && (
                <div className="subject-selector">
                  <label>Matéria/Tema (opcional)</label>
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
              )}

              <PomodoroTimer
                subject={selectedSubject}
                onSessionComplete={(session) => {
                  if (onSessionComplete) onSessionComplete(session);
                  onClose();
                }}
              />
            </div>
          ) : (
            <div className="manual-section">
              <form onSubmit={handleManualSubmit}>
                {subjects.length > 0 && (
                  <div className="form-group">
                    <label htmlFor="subject">Matéria/Tema (opcional)</label>
                    <select
                      id="subject"
                      value={formData.subject || selectedSubject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="hours">Horas</label>
                    <input
                      type="number"
                      id="hours"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                      min="0"
                      max="24"
                      step="0.5"
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="minutes">Minutos</label>
                    <input
                      type="number"
                      id="minutes"
                      value={formData.minutes}
                      onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
                      min="0"
                      max="59"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notas (opcional)</label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    placeholder="Anotações sobre a sessão de estudo..."
                  />
                </div>

                <div className="form-actions">
                  <button type="button" onClick={onClose} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    <Play size={18} />
                    Registrar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyModal;
