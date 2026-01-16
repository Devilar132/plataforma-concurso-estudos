import React, { useState } from 'react';
import { usePomodoro } from '../contexts/PomodoroContext';
import { Play, Pause, X, Minimize2, Maximize2 } from 'lucide-react';
import './FloatingTimer.css';

const FloatingTimer = () => {
  const {
    minutes,
    seconds,
    isRunning,
    sessionType,
    showFloating,
    startPause,
    reset,
    formatTime,
    sessionTypes
  } = usePomodoro();

  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!showFloating) return null;

  const progress = ((minutes * 60 + seconds) / (sessionTypes[sessionType].duration * 60)) * 100;

  return (
    <div className={`floating-timer ${isMinimized ? 'minimized' : ''} ${isExpanded ? 'expanded' : ''}`}>
      <div className="floating-timer-header">
        <div className="floating-timer-title">
          <span className="floating-timer-label">{sessionTypes[sessionType].label}</span>
          {!isMinimized && (
            <span className="floating-timer-time">{formatTime(minutes, seconds)}</span>
          )}
        </div>
        <div className="floating-timer-actions">
          {!isMinimized && (
            <button
              className="floating-timer-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Minimizar' : 'Expandir'}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}
          <button
            className="floating-timer-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            className="floating-timer-btn floating-timer-btn-close"
            onClick={reset}
            title="Parar timer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="floating-timer-content">
          {isExpanded && (
            <div className="floating-timer-progress-bar">
              <div
                className="floating-timer-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <div className="floating-timer-controls">
            <button
              className="floating-timer-btn-main"
              onClick={startPause}
              title={isRunning ? 'Pausar' : 'Continuar'}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
            </button>
            {isExpanded && (
              <button
                className="floating-timer-btn-secondary"
                onClick={reset}
                title="Reiniciar"
              >
                Reiniciar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingTimer;
