import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Target, Clock, BarChart3 } from 'lucide-react';
import { goalsService } from '../services/goals';
import { showSuccess } from '../utils/toast';
import './OnboardingTour.css';

const OnboardingTour = ({ isOpen, onComplete, hasGoals }) => {
  const [step, setStep] = useState(0);
  const [creatingExample, setCreatingExample] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState(null);
  const highlightRef = useRef(null);

  const steps = [
    {
      id: 'welcome',
      title: 'Bem-vindo! 👋',
      content: 'Vamos configurar sua primeira meta de estudo?',
      action: 'create-example',
      position: 'center'
    },
    {
      id: 'create-goal',
      title: 'Criar Metas',
      content: 'Clique aqui para criar suas metas diárias de estudo',
      target: '.btn-add',
      position: 'bottom',
      offset: { x: 0, y: 10 }
    },
    {
      id: 'timer',
      title: 'Timer Pomodoro',
      content: 'Use o timer para manter o foco durante os estudos',
      target: '.floating-timer',
      position: 'left',
      offset: { x: -10, y: 0 }
    },
    {
      id: 'stats',
      title: 'Acompanhar Progresso',
      content: 'Veja suas estatísticas e sequência de dias estudados',
      target: '.nav-link[href*="statistics"]',
      position: 'top',
      offset: { x: 0, y: -10 }
    }
  ];

  useEffect(() => {
    if (hasGoals && step === 0) {
      // Pular passo de criação se já tem metas
      setStep(1);
    }
  }, [hasGoals, step]);

  useEffect(() => {
    const currentStep = steps[step];
    if (currentStep?.target) {
      const element = document.querySelector(currentStep.target);
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setHighlightedElement(null);
      }
    } else {
      setHighlightedElement(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const createExampleGoal = async () => {
    try {
      setCreatingExample(true);
      const today = new Date().toISOString().split('T')[0];
      await goalsService.create({
        title: 'Revisar Direito Constitucional',
        description: 'Ler capítulo 1 e fazer exercícios',
        tag: 'Direito',
        date: today
      });
      showSuccess('Meta de exemplo criada! 🎉');
      setStep(step + 1);
    } catch (error) {
      console.error('Erro ao criar meta de exemplo:', error);
    } finally {
      setCreatingExample(false);
    }
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen || localStorage.getItem('onboardingCompleted') === 'true') {
    return null;
  }

  const currentStep = steps[step];
  if (!currentStep) return null;

  // Calcular posição do tooltip
  let tooltipStyle = {};
  if (highlightedElement) {
    const rect = highlightedElement.getBoundingClientRect();
    const position = currentStep.position || 'bottom';
    const offset = currentStep.offset || { x: 0, y: 0 };

    switch (position) {
      case 'bottom':
        tooltipStyle = {
          top: `${rect.bottom + window.scrollY + offset.y + 10}px`,
          left: `${rect.left + window.scrollX + offset.x}px`,
          transform: 'translateX(-50%)'
        };
        break;
      case 'top':
        tooltipStyle = {
          bottom: `${window.innerHeight - rect.top - window.scrollY + offset.y + 10}px`,
          left: `${rect.left + window.scrollX + offset.x}px`,
          transform: 'translateX(-50%)'
        };
        break;
      case 'left':
        tooltipStyle = {
          top: `${rect.top + window.scrollY + offset.y}px`,
          right: `${window.innerWidth - rect.left - window.scrollX + offset.x + 10}px`,
          transform: 'translateY(-50%)'
        };
        break;
      case 'right':
        tooltipStyle = {
          top: `${rect.top + window.scrollY + offset.y}px`,
          left: `${rect.right + window.scrollX + offset.x + 10}px`,
          transform: 'translateY(-50%)'
        };
        break;
      default:
        tooltipStyle = {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  } else {
    tooltipStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };
  }

  return (
    <>
      <div className="onboarding-overlay" onClick={handleSkip} />
      
      {highlightedElement && (
        <div
          ref={highlightRef}
          className="onboarding-highlight"
          style={{
            position: 'absolute',
            top: `${highlightedElement.getBoundingClientRect().top + window.scrollY}px`,
            left: `${highlightedElement.getBoundingClientRect().left + window.scrollX}px`,
            width: `${highlightedElement.offsetWidth}px`,
            height: `${highlightedElement.offsetHeight}px`,
            borderRadius: '8px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
            zIndex: 999
          }}
        />
      )}

      <div className="onboarding-tooltip" style={tooltipStyle}>
        <div className="tooltip-header">
          <div className="tooltip-icon">
            {step === 0 && <Target size={24} />}
            {step === 1 && <Target size={24} />}
            {step === 2 && <Clock size={24} />}
            {step === 3 && <BarChart3 size={24} />}
          </div>
          <h3>{currentStep.title}</h3>
          <button onClick={handleSkip} className="tooltip-close">
            <X size={20} />
          </button>
        </div>

        <p className="tooltip-content">{currentStep.content}</p>

        {currentStep.action === 'create-example' && !hasGoals && (
          <button 
            onClick={createExampleGoal} 
            className="btn-primary btn-create-example"
            disabled={creatingExample}
          >
            {creatingExample ? 'Criando...' : 'Criar Minha Primeira Meta'}
          </button>
        )}

        <div className="tooltip-footer">
          <div className="tooltip-progress">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`progress-dot ${index === step ? 'active' : ''} ${index < step ? 'completed' : ''}`}
              />
            ))}
          </div>
          <div className="tooltip-actions">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="btn-secondary btn-sm">
                Voltar
              </button>
            )}
            <button onClick={handleNext} className="btn-primary btn-sm">
              {step === steps.length - 1 ? 'Finalizar' : 'Próximo'} 
              {step < steps.length - 1 && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;
