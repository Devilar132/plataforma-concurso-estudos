import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Clock, CheckCircle2 } from 'lucide-react';
import { usePomodoro } from '../contexts/PomodoroContext';
import { showError } from '../utils/toast';
import { sessionsService } from '../services/sessions';
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

  // Registrar sessão de estudo (com proteção contra duplicação da MESMA completude)
  const registerStudySession = useCallback(async (studiedMinutes, subjectParam = null) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Proteção: evitar que a MESMA completude seja registrada múltiplas vezes
    // Usar timestamp preciso + random para identificar completudes únicas
    const completionId = `pomodoro_completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const currentCompletionId = sessionStorage.getItem('pomodoro_current_completion_id');
    
    // Se já está registrando uma completude (proteção contra chamadas simultâneas)
    if (currentCompletionId) {
      const completionData = JSON.parse(currentCompletionId);
      const timeDiff = Date.now() - completionData.timestamp;
      
      // Se foi há menos de 3 segundos, é provavelmente a mesma completude sendo chamada múltiplas vezes
      if (timeDiff < 3000 && completionData.minutes === studiedMinutes) {
        console.log('PomodoroTimer.registerStudySession: Completude já está sendo registrada, ignorando duplicata');
        return null;
      }
    }
    
    // Marcar esta completude como sendo registrada AGORA
    sessionStorage.setItem('pomodoro_current_completion_id', JSON.stringify({
      id: completionId,
      minutes: studiedMinutes,
      timestamp: Date.now()
    }));
    
    console.log('PomodoroTimer.registerStudySession: Criando sessão de', studiedMinutes, 'minutos');
    
    try {
      const session = await sessionsService.create({
        date: today,
        minutes: studiedMinutes,
        subject: subjectParam || subject || 'Pomodoro'
      });
      
      console.log('PomodoroTimer.registerStudySession: Sessão criada com sucesso', session);
      
      // Limpar após 5 segundos (permite nova sessão, mas evita duplicação da mesma)
      setTimeout(() => {
        sessionStorage.removeItem('pomodoro_current_completion_id');
      }, 5000);
      
      if (onSessionComplete) {
        console.log('PomodoroTimer.registerStudySession: Chamando onSessionComplete');
        onSessionComplete(session);
      }
      return session;
    } catch (error) {
      console.error('PomodoroTimer.registerStudySession: Erro ao registrar sessão:', error);
      // Se der erro, limpar para permitir tentar novamente
      sessionStorage.removeItem('pomodoro_current_completion_id');
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
          registerStudySession(studiedMinutes, subject)
            .then(() => {
              // Sucesso - manter flag para evitar duplicação desta mesma completude
            })
            .catch(err => {
              console.error('Erro ao registrar sessão:', err);
              // Se der erro, permitir tentar novamente
              hasRegisteredRef.current = false;
            });
        }, 300);
        
        // Cleanup para evitar múltiplas execuções
        return () => clearTimeout(timeoutId);
      }
    }
    
    // Reset quando timer é resetado (permite nova sessão)
    // IMPORTANTE: Resetar flag quando timer volta ao estado inicial
    if (!isComplete && !isRunning && minutes === initialDuration && seconds === 0) {
      hasRegisteredRef.current = false;
      // Limpar proteções para permitir nova sessão
      sessionStorage.removeItem('pomodoro_current_completion_id');
      console.log('PomodoroTimer: Timer resetado, permitindo nova sessão');
    }
  }, [isComplete, sessionType, onSessionComplete, getStudiedMinutes, subject, isRunning, registerStudySession, minutes, seconds, initialDuration]);

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
    
    if (sessionType === 'study' && studiedMinutes > 0) {
      hasRegisteredRef.current = true;
      await registerStudySession(studiedMinutes, subject);
      // Callback já é chamado dentro de registerStudySession
    }
    
    reset();
    setShowFinishConfirm(false);
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
