import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Clock, CheckCircle2 } from 'lucide-react';
import { usePomodoro } from '../contexts/PomodoroContext';
import { showError } from '../utils/toast';
import { sessionsService } from '../services/sessions';
import { getRandomPhrase } from '../utils/motivational';
import ConfirmDialog from './ConfirmDialog';
import './PomodoroTimer.css';

const PomodoroTimer = ({ onSessionComplete, subject }) => {
  const {
    minutes,
    seconds,
    isRunning,
    isComplete,
    sessionType,
    sessionTypes,
    startPause,
    reset,
    changeSessionType,
    formatTime,
    getStudiedMinutes,
    initialDuration
  } = usePomodoro();

  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const audioRef = useRef(null);
  const hasRegisteredRef = useRef(false);

  // Sinalizar para o contexto que há callback externo (evita registro duplicado)
  useEffect(() => {
    if (onSessionComplete) {
      sessionStorage.setItem('pomodoro_has_callback', 'true');
    } else {
      sessionStorage.removeItem('pomodoro_has_callback');
    }
    return () => {
      sessionStorage.removeItem('pomodoro_has_callback');
    };
  }, [onSessionComplete]);

  // Registrar sessão de estudo (com proteção contra duplicação)
  const registerStudySession = useCallback(async (studiedMinutes, subjectParam = null) => {
    // Verificar se já registrou esta sessão (proteção adicional)
    // Usar uma chave baseada no tempo estudado e timestamp aproximado (arredondado para minutos)
    const now = Date.now();
    const minuteTimestamp = Math.floor(now / 60000) * 60000; // Arredondar para o minuto
    const sessionKey = `pomodoro_session_${minuteTimestamp}_${studiedMinutes}`;
    const lastSessionKey = sessionStorage.getItem('pomodoro_last_session_key');
    
    // Se for a mesma sessão (mesmo minuto e mesma duração), não registrar novamente
    if (lastSessionKey && lastSessionKey === sessionKey) {
      console.log('Sessão já registrada, ignorando duplicata');
      return null;
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const session = await sessionsService.create({
        date: today,
        minutes: studiedMinutes,
        subject: subjectParam || subject || 'Pomodoro'
      });
      
      // Marcar como registrada (válido por 2 minutos para evitar duplicatas)
      sessionStorage.setItem('pomodoro_last_session_key', sessionKey);
      setTimeout(() => {
        sessionStorage.removeItem('pomodoro_last_session_key');
      }, 120000); // 2 minutos
      
      if (onSessionComplete) {
        onSessionComplete(session);
      }
      return session;
    } catch (error) {
      console.error('Erro ao registrar sessão de estudo:', error);
      showError('Erro ao registrar sessão de estudo');
      return null;
    }
  }, [onSessionComplete, subject]);

  // Registrar sessão quando timer completa automaticamente
  // Só registra se tiver callback (onSessionComplete), caso contrário deixa o contexto fazer
  useEffect(() => {
    if (isComplete && sessionType === 'study' && onSessionComplete && !hasRegisteredRef.current) {
      const studiedMinutes = getStudiedMinutes();
      if (studiedMinutes > 0) {
        hasRegisteredRef.current = true;
        // Usar setTimeout para evitar conflito com o contexto e garantir execução única
        const timeoutId = setTimeout(() => {
          registerStudySession(studiedMinutes, subject).catch(err => {
            console.error('Erro ao registrar sessão:', err);
            // Se der erro, permitir tentar novamente
            hasRegisteredRef.current = false;
          });
        }, 200);
        
        // Cleanup para evitar múltiplas execuções
        return () => clearTimeout(timeoutId);
      }
    }
    
    // Reset quando timer é resetado
    if (!isComplete && !isRunning) {
      hasRegisteredRef.current = false;
    }
  }, [isComplete, sessionType, onSessionComplete, getStudiedMinutes, subject, isRunning, registerStudySession]);

  // Finalizar sessão manualmente
  const handleFinishEarly = () => {
    if (sessionType === 'study' && isRunning) {
      const studiedMinutes = getStudiedMinutes();
      if (studiedMinutes > 0) {
        setShowFinishConfirm(true);
      } else {
        showError('Aguarde pelo menos 1 minuto antes de finalizar');
      }
    }
  };

  const handleConfirmFinish = async () => {
    const studiedMinutes = getStudiedMinutes();
    reset();
    setShowFinishConfirm(false);
    
    if (sessionType === 'study' && studiedMinutes > 0) {
      hasRegisteredRef.current = true;
      await registerStudySession(studiedMinutes, subject);
      // Callback já é chamado dentro de registerStudySession
    }
  };

  const handleReset = () => {
    reset();
  };

  const progress = ((minutes * 60 + seconds) / (sessionTypes[sessionType].duration * 60)) * 100;

  return (
    <div className="pomodoro-timer">
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
      <div className="timer-header">
        <Clock size={24} />
        <h3>Timer Pomodoro</h3>
      </div>
      
      <div className="timer-type-selector">
        {Object.entries(sessionTypes).map(([key, value]) => (
          <button
            key={key}
            className={`timer-type-btn ${sessionType === key ? 'active' : ''}`}
            onClick={() => {
              if (!isRunning) changeSessionType(key);
            }}
            disabled={isRunning}
          >
            {value.label}
          </button>
        ))}
      </div>

      <div className="timer-circle">
        <svg className="timer-svg" viewBox="0 0 200 200">
          <circle
            className="timer-circle-bg"
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="var(--border-light)"
            strokeWidth="8"
          />
          <circle
            className="timer-circle-progress"
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={sessionType === 'study' ? 'var(--secondary)' : 'var(--success)'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
            transform="rotate(-90 100 100)"
          />
        </svg>
        <div className="timer-display">
          <div className="timer-time">{formatTime(minutes, seconds)}</div>
          <div className="timer-label">{sessionTypes[sessionType].label}</div>
        </div>
      </div>

      <div className="timer-controls">
        <button
          className="timer-btn timer-btn-reset"
          onClick={handleReset}
          disabled={isRunning && !isComplete}
          title="Reiniciar"
        >
          <RotateCcw size={20} />
        </button>
        <button
          className="timer-btn timer-btn-main"
          onClick={startPause}
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} />}
        </button>
        {sessionType === 'study' && isRunning && getStudiedMinutes() > 0 && (
          <button
            className="timer-btn timer-btn-finish"
            onClick={handleFinishEarly}
            title="Finalizar agora"
          >
            <CheckCircle2 size={20} />
          </button>
        )}
      </div>

      {isComplete && (
        <div className="timer-complete">
          <div className="complete-message">
            {sessionType === 'study' ? '🎉 Sessão concluída!' : '⏰ Pausa concluída!'}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showFinishConfirm}
        onClose={() => setShowFinishConfirm(false)}
        onConfirm={handleConfirmFinish}
        title="Finalizar Sessão de Estudo"
        message={`Deseja finalizar a sessão agora? Serão registrados ${getStudiedMinutes()} minutos de estudo.`}
        confirmText="Finalizar"
        cancelText="Continuar"
        variant="info"
      />
    </div>
  );
};

export default PomodoroTimer;
