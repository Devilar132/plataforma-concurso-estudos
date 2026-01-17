import React from 'react';
import { Trophy, Award, Star } from 'lucide-react';
import Confetti from './Confetti';
import './MilestoneCelebration.css';

const MilestoneCelebration = ({ isOpen, onClose, milestone }) => {
  if (!isOpen || !milestone) return null;

  const getMilestoneIcon = (type) => {
    switch (type) {
      case '7_days':
      case '30_days':
      case '100_days':
        return <Trophy size={64} />;
      case 'first_week':
      case 'first_month':
        return <Award size={64} />;
      default:
        return <Star size={64} />;
    }
  };

  const getMilestoneMessage = (type, value) => {
    const messages = {
      '7_days': '🎉 7 dias consecutivos! Você está no caminho certo!',
      '30_days': '🏆 30 dias consecutivos! Você é uma inspiração!',
      '100_days': '👑 100 dias consecutivos! LENDÁRIO!',
      'first_week': '⭐ Primeira semana completa! Continue assim!',
      'first_month': '💎 Primeiro mês completo! Dedicação exemplar!',
      'total_days': `🔥 ${value} dias estudados no total! Progresso incrível!`
    };
    return messages[type] || `🎊 Conquista desbloqueada!`;
  };

  return (
    <>
      <div className="milestone-overlay" onClick={onClose}>
        <div className="milestone-modal" onClick={(e) => e.stopPropagation()}>
          <div className="milestone-content">
            <div className="milestone-icon">
              {getMilestoneIcon(milestone.type)}
            </div>
            <h2>{getMilestoneMessage(milestone.type, milestone.value)}</h2>
            <p className="milestone-description">
              {milestone.description || 'Parabéns por manter a consistência!'}
            </p>
            <button onClick={onClose} className="btn-primary btn-milestone">
              Continuar
            </button>
          </div>
        </div>
      </div>
      <Confetti show={isOpen} />
    </>
  );
};

export default MilestoneCelebration;
