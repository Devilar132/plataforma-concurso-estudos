import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { showSuccess, showError } from '../utils/toast';
import { sessionsService } from '../services/sessions';
import { getRandomPhrase } from '../utils/motivational';

const PomodoroContext = createContext();

export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within PomodoroProvider');
  }
  return context;
};

export const PomodoroProvider = ({ children }) => {
  const [minutes, setMinutes] = useState(45);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionType, setSessionType] = useState('study'); // study, shortBreak, longBreak
  const [initialDuration, setInitialDuration] = useState(45);
  const [showFloating, setShowFloating] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const hasLoadedStateRef = useRef(false);
  const isCompletingRef = useRef(false); // Flag para evitar múltiplas chamadas de handleComplete

  const sessionTypes = {
    study: { duration: 45, label: 'Foco Máximo' },
    shortBreak: { duration: 10, label: 'Pausa' },
    longBreak: { duration: 15, label: 'Descanso' }
  };

  // Salvar estado do timer no localStorage
  const saveTimerState = useCallback((state) => {
    try {
      localStorage.setItem('pomodoro_timer_state', JSON.stringify({
        ...state,
        savedAt: Date.now()
      }));
    } catch (error) {
      console.error('Erro ao salvar estado do timer:', error);
    }
  }, []);

  // Carregar estado do timer do localStorage
  const loadTimerState = useCallback(() => {
    try {
      const saved = localStorage.getItem('pomodoro_timer_state');
      if (!saved) {
        return null;
      }

      const state = JSON.parse(saved);
      const now = Date.now();
      const elapsed = Math.floor((now - state.savedAt) / 1000); // segundos decorridos

      // Se passou mais de 24 horas, descartar estado salvo
      if (elapsed > 86400) {
        localStorage.removeItem('pomodoro_timer_state');
        return null;
      }

      // Se o timer estava rodando, calcular novo tempo baseado no tempo decorrido
      if (state.isRunning && !state.isComplete) {
        // Se temos o startTime original, usar ele para calcular o tempo total decorrido
        if (state.startTime) {
          const totalElapsedFromStart = Math.floor((now - state.startTime) / 1000);
          const totalSecondsInitial = state.initialDuration * 60;
          const newRemainingSeconds = Math.max(0, totalSecondsInitial - totalElapsedFromStart);
          
          if (newRemainingSeconds === 0) {
            // Timer completou
            return {
              ...state,
              minutes: 0,
              seconds: 0,
              isRunning: false,
              isComplete: true
            };
          }

          return {
            ...state,
            minutes: Math.floor(newRemainingSeconds / 60),
            seconds: newRemainingSeconds % 60,
            isRunning: true,
            startTime: state.startTime // Manter o startTime original
          };
        } else {
          // Se não temos startTime, calcular baseado no tempo restante salvo
          const savedRemainingSeconds = state.minutes * 60 + state.seconds;
          const newRemainingSeconds = Math.max(0, savedRemainingSeconds - elapsed);
          
          if (newRemainingSeconds === 0) {
            return {
              ...state,
              minutes: 0,
              seconds: 0,
              isRunning: false,
              isComplete: true
            };
          }

          // Calcular startTime baseado no tempo total decorrido
          const totalElapsedFromStart = (state.initialDuration * 60) - newRemainingSeconds;
          const startTime = now - (totalElapsedFromStart * 1000);

          return {
            ...state,
            minutes: Math.floor(newRemainingSeconds / 60),
            seconds: newRemainingSeconds % 60,
            isRunning: true,
            startTime: startTime
          };
        }
      }

      return state;
    } catch (error) {
      console.error('Erro ao carregar estado do timer:', error);
      localStorage.removeItem('pomodoro_timer_state');
      return null;
    }
  }, []);

  // Carregar estado salvo ao montar
  useEffect(() => {
    const savedState = loadTimerState();
    if (savedState) {
      // IMPORTANTE: Definir startTime ANTES de setar os estados
      // Isso garante que quando o useEffect do timer executar, o startTime já estará definido
      if (savedState.startTime) {
        startTimeRef.current = savedState.startTime;
      }
      
      // Aplicar o estado recuperado
      setInitialDuration(savedState.initialDuration);
      setSessionType(savedState.sessionType);
      setMinutes(savedState.minutes);
      setSeconds(savedState.seconds);
      setIsComplete(savedState.isComplete);
      
      // Se estava rodando, continuar de onde parou
      if (savedState.isRunning && !savedState.isComplete) {
        setIsRunning(true);
      }
      
      // Marcar que já carregou o estado DEPOIS de aplicar tudo
      hasLoadedStateRef.current = true;
    } else {
      // Se não há estado salvo, marcar como carregado imediatamente
      hasLoadedStateRef.current = true;
    }

    // Salvar estado antes de fechar a página
    const handleBeforeUnload = () => {
      const currentState = {
        minutes,
        seconds,
        isRunning,
        isComplete,
        sessionType,
        initialDuration,
        startTime: startTimeRef.current || (isRunning ? Date.now() - ((initialDuration * 60 - (minutes * 60 + seconds)) * 1000) : null)
      };
      saveTimerState(currentState);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Calcular tempo estudado em minutos (baseado no startTime para precisão)
  const getStudiedMinutes = useCallback(() => {
    if (!startTimeRef.current || !isRunning) {
      // Se não está rodando, calcular baseado no tempo restante atual
      const totalSecondsRemaining = minutes * 60 + seconds;
      const totalSecondsInitial = initialDuration * 60;
      const studiedSeconds = totalSecondsInitial - totalSecondsRemaining;
      // Usar Math.round para arredondar corretamente (não floor que perde minutos)
      return Math.max(0, Math.round(studiedSeconds / 60));
    }
    
    // Se está rodando, calcular baseado no startTime (mais preciso)
    const now = Date.now();
    const totalElapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
    // Usar Math.round para arredondar corretamente
    return Math.max(0, Math.round(totalElapsedSeconds / 60));
  }, [minutes, seconds, initialDuration, isRunning]);

  // Registrar sessão de estudo (mantido para compatibilidade, mas não usado quando onSessionComplete está presente)
  const registerStudySession = useCallback(async (studiedMinutes) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Proteção: evitar que a MESMA completude seja registrada múltiplas vezes
    // Usar timestamp preciso + random para identificar completudes únicas
    const completionId = `pomodoro_context_completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const currentCompletionId = sessionStorage.getItem('pomodoro_context_current_completion_id');
    
    // Se já está registrando uma completude (proteção contra chamadas simultâneas)
    if (currentCompletionId) {
      const completionData = JSON.parse(currentCompletionId);
      const timeDiff = Date.now() - completionData.timestamp;
      
      // Se foi há menos de 3 segundos, é provavelmente a mesma completude
      if (timeDiff < 3000 && completionData.minutes === studiedMinutes) {
        console.log('PomodoroContext.registerStudySession: Completude já está sendo registrada, ignorando duplicata');
        return;
      }
    }
    
    // Marcar esta completude como sendo registrada AGORA
    sessionStorage.setItem('pomodoro_context_current_completion_id', JSON.stringify({
      id: completionId,
      minutes: studiedMinutes,
      timestamp: Date.now()
    }));
    
    console.log('PomodoroContext.registerStudySession: Criando sessão de', studiedMinutes, 'minutos');
    
    try {
      const session = await sessionsService.create({
        date: today,
        minutes: studiedMinutes,
        subject: 'Pomodoro'
      });
      
      console.log('PomodoroContext.registerStudySession: Sessão criada com sucesso', session);
      
      // Limpar após 5 segundos (permite nova sessão, mas evita duplicação da mesma)
      setTimeout(() => {
        sessionStorage.removeItem('pomodoro_context_current_completion_id');
      }, 5000);
      
      const phrase = getRandomPhrase('pomodoroCompleted');
      showSuccess(phrase || `🎉 ${studiedMinutes} minutos de estudo registrados!`);
    } catch (error) {
      console.error('Erro ao registrar sessão de estudo:', error);
      // Se der erro, limpar para permitir tentar novamente
      sessionStorage.removeItem('pomodoro_context_current_completion_id');
      showError('Erro ao registrar sessão de estudo');
    }
  }, []);

  const handleComplete = useCallback(async () => {
    // Prevenir múltiplas chamadas simultâneas da MESMA completude
    if (isCompletingRef.current) {
      console.log('PomodoroContext.handleComplete: Já está processando completude, ignorando');
      return;
    }
    
    // Se já está completo, não processar novamente (evita loop)
    if (isComplete) {
      return;
    }
    
    isCompletingRef.current = true;
    
    try {
      setIsComplete(true);
      setIsRunning(false);
      startTimeRef.current = null;
      localStorage.removeItem('pomodoro_timer_state');
      
      // Se for sessão de estudo, salvar horas
      // Mas só se não houver callback externo (verificado via flag no sessionStorage)
      if (sessionType === 'study') {
        const studiedMinutes = getStudiedMinutes();
        if (studiedMinutes > 0) {
          // Verificar se há callback externo (PomodoroTimer com onSessionComplete)
          const hasExternalCallback = sessionStorage.getItem('pomodoro_has_callback') === 'true';
          if (!hasExternalCallback) {
            await registerStudySession(studiedMinutes);
          }
        }
      } else {
        showSuccess(`⏰ Pausa concluída! Hora de voltar aos estudos!`);
      }
    } finally {
      // Resetar flag após um delay para permitir reset futuro
      setTimeout(() => {
        isCompletingRef.current = false;
      }, 2000); // 2 segundos é suficiente
    }
  }, [sessionType, getStudiedMinutes, registerStudySession, isComplete]);

  // Salvar estado quando mudar (mas só depois de carregar o estado inicial)
  useEffect(() => {
    // Não salvar antes de carregar o estado salvo, para evitar sobrescrever
    if (!hasLoadedStateRef.current) {
      return;
    }
    
    saveTimerState({
      minutes,
      seconds,
      isRunning,
      isComplete,
      sessionType,
      initialDuration,
      startTime: startTimeRef.current
    });
  }, [minutes, seconds, isRunning, isComplete, sessionType, initialDuration, saveTimerState]);

  // Efeito para o timer - calcula baseado em startTime para funcionar mesmo em background
  useEffect(() => {
    if (isRunning) {
      // Se não tem startTime, significa que acabou de começar AGORA (não foi carregado)
      // Nesse caso, calcular startTime baseado no tempo já decorrido
      if (!startTimeRef.current) {
        const totalSecondsElapsed = (initialDuration * 60) - (minutes * 60 + seconds);
        startTimeRef.current = Date.now() - (totalSecondsElapsed * 1000);
      }
      
      // Função para calcular e atualizar o tempo baseado no startTime
      const updateTimer = () => {
        if (!startTimeRef.current || isCompletingRef.current) return;
        
        const now = Date.now();
        const totalElapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
        const totalSecondsInitial = initialDuration * 60;
        const remainingSeconds = Math.max(0, totalSecondsInitial - totalElapsedSeconds);
        
        if (remainingSeconds <= 0 && !isCompletingRef.current) {
          // Parar o intervalo antes de chamar handleComplete
          clearInterval(intervalRef.current);
          // Garantir que minutos e segundos sejam 0 antes de completar
          setMinutes(0);
          setSeconds(0);
          handleComplete();
          return;
        }
        
        const newMinutes = Math.floor(remainingSeconds / 60);
        const newSeconds = remainingSeconds % 60;
        
        // Só atualizar se mudou (evita re-renders desnecessários)
        setMinutes(prev => prev !== newMinutes ? newMinutes : prev);
        setSeconds(prev => prev !== newSeconds ? newSeconds : prev);
      };
      
      // Atualizar imediatamente
      updateTimer();
      
      // Atualizar a cada segundo (mas o cálculo é sempre baseado no startTime)
      intervalRef.current = setInterval(updateTimer, 100);
    } else {
      clearInterval(intervalRef.current);
      // Não limpar startTime quando pausar, para manter o histórico
    }

    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, handleComplete, initialDuration]); // minutes e seconds removidos intencionalmente para evitar loops

  // Atualizar duração quando o tipo de sessão muda
  // Só atualizar se não estiver carregando estado salvo
  useEffect(() => {
    if (!isRunning && hasLoadedStateRef.current) {
      const duration = sessionTypes[sessionType].duration;
      setMinutes(duration);
      setSeconds(0);
      setIsComplete(false);
      setInitialDuration(duration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionType]);

  // Mostrar flutuante quando timer está rodando
  useEffect(() => {
    setShowFloating(isRunning && !isComplete);
  }, [isRunning, isComplete]);

  // Atualizar timer quando a aba volta ao foco (para corrigir tempo perdido em background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isRunning && startTimeRef.current) {
        // Quando a aba volta ao foco, recalcular o tempo baseado no startTime
        const now = Date.now();
        const totalElapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
        const totalSecondsInitial = initialDuration * 60;
        const remainingSeconds = Math.max(0, totalSecondsInitial - totalElapsedSeconds);
        
        if (remainingSeconds === 0) {
          handleComplete();
        } else {
          const newMinutes = Math.floor(remainingSeconds / 60);
          const newSeconds = remainingSeconds % 60;
          setMinutes(newMinutes);
          setSeconds(newSeconds);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, initialDuration]);

  const startPause = () => {
    if (isComplete) {
      reset();
    } else {
      // Quando iniciar, definir startTime se não existir
      if (!isRunning && !startTimeRef.current) {
        const totalSecondsElapsed = (initialDuration * 60) - (minutes * 60 + seconds);
        startTimeRef.current = Date.now() - (totalSecondsElapsed * 1000);
      }
      setIsRunning(!isRunning);
    }
  };

  const reset = () => {
    setIsRunning(false);
    setIsComplete(false);
    setMinutes(sessionTypes[sessionType].duration);
    setSeconds(0);
    startTimeRef.current = null;
    isCompletingRef.current = false; // Resetar flag de completude
    // Limpar proteções de completude para permitir nova sessão
    sessionStorage.removeItem('pomodoro_context_current_completion_id');
    sessionStorage.removeItem('pomodoro_current_completion_id');
    localStorage.removeItem('pomodoro_timer_state');
    console.log('PomodoroContext.reset: Timer resetado, todas as proteções limpas');
  };

  const changeSessionType = (type) => {
    if (!isRunning) {
      setSessionType(type);
    }
  };

  const formatTime = (mins, secs) => {
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const value = {
    minutes,
    seconds,
    isRunning,
    isComplete,
    sessionType,
    showFloating,
    sessionTypes,
    startPause,
    reset,
    changeSessionType,
    formatTime,
    getStudiedMinutes,
    initialDuration
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
};
