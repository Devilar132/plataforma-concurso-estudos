import React from 'react';
import { Clock, Trophy, Sparkles } from 'lucide-react';
import Confetti from './Confetti';
import { formatMinutes } from '../utils/timeFormatter';
import './HoursGoalCelebration.css';

const HoursGoalCelebration = ({ isOpen, onClose, hoursStudied = 0, goalHours = 2.0 }) => {
  if (!isOpen) return null;
  
  // Garantir que os valores são números válidos
  const hours = parseFloat(hoursStudied) || 0;
  const goal = parseFloat(goalHours) || 2.0;

  return (
    <>
      <div className="hours-goal-overlay" onClick={onClose}>
        <div className="hours-goal-modal" onClick={(e) => e.stopPropagation()}>
          <div className="hours-goal-content">
            <div className="hours-goal-icon">
              <Trophy size={80} />
              <div className="sparkles">
                <Sparkles size={24} className="sparkle sparkle-1" />
                <Sparkles size={24} className="sparkle sparkle-2" />
                <Sparkles size={24} className="sparkle sparkle-3" />
              </div>
            </div>
            
            <h2>🎉 Meta de Horas Batida!</h2>
            
            <div className="hours-goal-stats">
              <div className="stat-box">
                <Clock size={32} />
                <div>
                  <div className="stat-value">{formatMinutes(Math.round(hours * 60))}</div>
                  <div className="stat-label">Estudadas hoje</div>
                </div>
              </div>
              
              <div className="stat-divider">→</div>
              
              <div className="stat-box goal">
                <Trophy size={32} />
                <div>
                  <div className="stat-value">{formatMinutes(Math.round(goal * 60))}</div>
                  <div className="stat-label">Meta diária</div>
                </div>
              </div>
            </div>
            
            <p className="hours-goal-message">
              Parabéns! Você completou sua meta de {formatMinutes(Math.round(goal * 60))} de estudo hoje! 
              Continue assim e mantenha a consistência! 🚀
            </p>
            
            <button onClick={onClose} className="btn-primary btn-celebration">
              Continuar Estudando
            </button>
          </div>
        </div>
      </div>
      <Confetti show={isOpen} />
    </>
  );
};

export default HoursGoalCelebration;
