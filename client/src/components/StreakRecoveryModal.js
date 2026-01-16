import React, { useState, useEffect } from 'react';
import { X, Shield, RotateCcw, Flame, AlertCircle } from 'lucide-react';
import { streakService } from '../services/streak';
import { showSuccess, showError } from '../utils/toast';
import './StreakRecoveryModal.css';

const StreakRecoveryModal = ({ isOpen, onClose, onRecoveryComplete, streakData }) => {
  const [recoveryInfo, setRecoveryInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && streakData?.currentStreak === 0) {
      loadRecoveryInfo();
    }
  }, [isOpen, streakData]);

  const loadRecoveryInfo = async () => {
    try {
      const info = await streakService.getRecoveryInfo();
      setRecoveryInfo(info);
    } catch (error) {
      console.error('Erro ao carregar informações de recuperação:', error);
    }
  };

  const handleFreeze = async () => {
    try {
      setLoading(true);
      await streakService.useFreeze();
      showSuccess('🛡️ Streak protegido! Sua sequência continua.');
      if (onRecoveryComplete) onRecoveryComplete();
      onClose();
    } catch (error) {
      showError(error.response?.data?.error || 'Erro ao usar freeze');
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    if (!recoveryInfo?.lastStudyDate) {
      showError('Não há dias anteriores para recuperar');
      return;
    }

    try {
      setLoading(true);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      await streakService.recoverDay(yesterdayStr);
      showSuccess('✅ Dia recuperado! Sua sequência continua.');
      if (onRecoveryComplete) onRecoveryComplete();
      onClose();
    } catch (error) {
      showError(error.response?.data?.error || 'Erro ao recuperar dia');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || streakData?.currentStreak > 0) return null;

  return (
    <div className="modal-overlay streak-recovery-overlay">
      <div className="modal-content streak-recovery-modal">
        <button onClick={onClose} className="modal-close">
          <X size={24} />
        </button>

        <div className="recovery-header">
          <div className="recovery-icon">
            <AlertCircle size={48} />
          </div>
          <h2>🛡️ Proteja sua Sequência!</h2>
          <p className="recovery-subtitle">
            Você perdeu sua sequência, mas ainda pode recuperá-la!
          </p>
        </div>

        {recoveryInfo && (
          <div className="recovery-stats">
            <div className="stat-item">
              <Flame size={20} />
              <div>
                <strong>{recoveryInfo.totalDaysStudied}</strong>
                <span>dias estudados no total</span>
              </div>
            </div>
            {recoveryInfo.daysSinceLastStudy > 0 && (
              <div className="stat-item">
                <AlertCircle size={20} />
                <div>
                  <strong>{recoveryInfo.daysSinceLastStudy}</strong>
                  <span>dias sem estudar</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="recovery-options">
          {streakData?.freezesAvailable > 0 && (
            <button 
              onClick={handleFreeze} 
              className="recovery-option freeze-option"
              disabled={loading}
            >
              <div className="option-icon">
                <Shield size={32} />
              </div>
              <div className="option-content">
                <h3>Usar Streak Freeze</h3>
                <p>Protege hoje e mantém sua sequência</p>
                <small>
                  {streakData.freezesAvailable} {streakData.freezesAvailable === 1 ? 'disponível' : 'disponíveis'} este mês
                </small>
              </div>
            </button>
          )}

          {recoveryInfo?.needsRecovery && (
            <button 
              onClick={handleRecover} 
              className="recovery-option recover-option"
              disabled={loading}
            >
              <div className="option-icon">
                <RotateCcw size={32} />
              </div>
              <div className="option-content">
                <h3>Recuperar Dia Anterior</h3>
                <p>Marca ontem como concluído (1 vez por sequência)</p>
                <small>Permite recuperar até 2 dias atrás</small>
              </div>
            </button>
          )}
        </div>

        <div className="recovery-footer">
          <button 
            onClick={onClose} 
            className="btn-secondary"
            disabled={loading}
          >
            Começar Nova Sequência
          </button>
          <p className="recovery-note">
            💡 Lembre-se: o importante é manter a consistência, não a perfeição!
          </p>
        </div>
      </div>
    </div>
  );
};

export default StreakRecoveryModal;
