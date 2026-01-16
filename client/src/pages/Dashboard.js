import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Plus, Search, Target, Star, Play, BarChart3, Clock } from 'lucide-react';
import { authService } from '../services/auth';
import { goalsService } from '../services/goals';
import { statsService } from '../services/stats';
import GoalForm from '../components/GoalForm';
import GoalCard from '../components/GoalCard';
import WeekDaySelector from '../components/WeekDaySelector';
import StreakRecoveryModal from '../components/StreakRecoveryModal';
import OnboardingTour from '../components/OnboardingTour';
import StudyModal from '../components/StudyModal';
import Confetti from '../components/Confetti';
import MilestoneCelebration from '../components/MilestoneCelebration';
import HoursGoalCelebration from '../components/HoursGoalCelebration';
import HoursGoalSettings from '../components/HoursGoalSettings';
import { milestonesService } from '../services/milestones';
import { settingsService } from '../services/settings';
import { sessionsService } from '../services/sessions';
import { notificationService } from '../services/notifications';
import { showSuccess, showError } from '../utils/toast';
import { getContextualPhrase, getRandomPhrase } from '../utils/motivational';
import { formatMinutes } from '../utils/timeFormatter';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [filteredGoals, setFilteredGoals] = useState([]);
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [weekData, setWeekData] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastCompletedCount, setLastCompletedCount] = useState(0);
  const [currentMilestone, setCurrentMilestone] = useState(null);
  const [showHoursGoalCelebration, setShowHoursGoalCelebration] = useState(false);
  const [showHoursGoalSettings, setShowHoursGoalSettings] = useState(false);
  const [hoursGoal, setHoursGoal] = useState(2.0);
  const [todayHours, setTodayHours] = useState(0);
  const [lastHoursChecked, setLastHoursChecked] = useState(0);
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const user = authService.getCurrentUser();

  const checkMilestones = useCallback(async () => {
    try {
      const result = await milestonesService.check();
      if (result.newMilestones && result.newMilestones.length > 0) {
        // Mostrar celebração do primeiro milestone novo
        const milestone = result.newMilestones[0];
        setCurrentMilestone({
          type: milestone.type,
          value: milestone.value,
          description: milestone.description
        });
      }
    } catch (error) {
      console.error('Erro ao verificar milestones:', error);
    }
  }, []);

  const loadWeekData = useCallback(async () => {
    if (isLoadingRef.current) return;
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Domingo
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekGoals = await goalsService.getAll(
        null,
        weekStart.toISOString().split('T')[0],
        weekEnd.toISOString().split('T')[0]
      );

      // Agrupar por dia
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayGoals = weekGoals.filter(g => g.date === dateStr);
        const hasCompleted = dayGoals.length > 0 && dayGoals.some(g => g.completed);
        const isToday = dateStr === selectedDate;

        weekDays.push({
          day: dayNames[date.getDay()],
          date: dateStr,
          hasStudy: hasCompleted,
          isToday
        });
      }
      setWeekData(weekDays);
    } catch (error) {
      console.error('Erro ao carregar dados da semana:', error);
    }
  }, [selectedDate]);

  const loadData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      setLoading(true);
      const [goalsData, streakData, settings, todaySessions] = await Promise.all([
        goalsService.getAll(selectedDate),
        statsService.getStreak(),
        settingsService.get().catch(() => ({ daily_hours_goal: 2.0 })),
        sessionsService.getAll(new Date().toISOString().split('T')[0])
      ]);
      setGoals(goalsData);
      setFilteredGoals(goalsData);
      setStreak(streakData);
      
      // Configurar meta de horas
      const goalHours = parseFloat(settings?.daily_hours_goal || 2.0);
      setHoursGoal(goalHours);
      
      // Calcular horas estudadas hoje (usa APENAS minutos para evitar duplicação)
      const today = new Date().toISOString().split('T')[0];
      const todayHoursTotal = Array.isArray(todaySessions) ? todaySessions.reduce((sum, session) => {
        // Usa apenas minutos, pois hours já é calculado a partir de minutes
        const minutes = parseInt(session?.minutes) || 0;
        return sum + (minutes / 60);
      }, 0) : 0;
      setTodayHours(todayHoursTotal);
      
      // Verificar se meta de horas foi batida
      if (goalHours > 0 && todayHoursTotal >= goalHours && lastHoursChecked < goalHours) {
        const celebratedToday = localStorage.getItem(`hoursGoalCelebrated_${today}`);
        if (!celebratedToday) {
          setShowHoursGoalCelebration(true);
          notificationService.notifyHoursGoalCompleted(todayHoursTotal, goalHours);
          localStorage.setItem(`hoursGoalCelebrated_${today}`, 'true');
        }
      }
      setLastHoursChecked(todayHoursTotal);
      
      // Calcular progresso do dia
      const completed = goalsData.filter(g => g.completed).length;
      setProgress({ completed, total: goalsData.length });
      
      // Mostrar confete se todas as metas foram completadas
      if (goalsData.length > 0 && completed === goalsData.length && lastCompletedCount < completed) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        notificationService.notifyAllGoalsCompleted();
      }
      setLastCompletedCount(completed);
      
      // Verificar milestones
      checkMilestones();
      
      // Notificação diária (se tiver metas e for pela manhã)
      const hour = new Date().getHours();
      if (goalsData.length > 0 && hour >= 8 && hour <= 10) {
        const notifiedToday = localStorage.getItem('dailyReminderShown');
        const today = new Date().toISOString().split('T')[0];
        if (notifiedToday !== today) {
          notificationService.notifyDailyReminder(goalsData.length);
          localStorage.setItem('dailyReminderShown', today);
        }
      }
      
      // Mostrar modal de recuperação se streak for 0 e usuário já tem histórico
      if (streakData.currentStreak === 0 && streakData.totalDaysStudied > 0) {
        // Verificar se já mostrou hoje (usar localStorage)
        const lastShown = localStorage.getItem('recoveryModalLastShown');
        const today = new Date().toISOString().split('T')[0];
        if (lastShown !== today) {
          setShowRecoveryModal(true);
          localStorage.setItem('recoveryModalLastShown', today);
        }
      }
      
      // Notificar milestone de streak
      if (streakData.currentStreak > 0 && [7, 30, 100].includes(streakData.currentStreak)) {
        const notifiedKey = `streak-${streakData.currentStreak}-notified`;
        if (!localStorage.getItem(notifiedKey)) {
          notificationService.notifyStreakMilestone(streakData.currentStreak);
          localStorage.setItem(notifiedKey, 'true');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [selectedDate, checkMilestones]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    // Carregar dados apenas uma vez no mount ou quando selectedDate mudar
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadData();
      loadWeekData();
    }
    
    // Verificar se precisa mostrar onboarding
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    if (!onboardingCompleted && goals.length === 0 && !loading) {
      setShowOnboarding(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);
  
  // Carregar dados quando selectedDate mudar
  useEffect(() => {
    if (hasLoadedRef.current && !isLoadingRef.current) {
      loadData();
      loadWeekData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Filtrar metas
  useEffect(() => {
    let filtered = [...goals];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(g => 
        g.title.toLowerCase().includes(query) ||
        (g.description && g.description.toLowerCase().includes(query)) ||
        (g.tag && g.tag.toLowerCase().includes(query))
      );
    }

    setFilteredGoals(filtered);
  }, [goals, searchQuery]);

  const handleCreateGoal = async (goalData) => {
    try {
      await goalsService.create(goalData);
      setShowForm(false);
      setEditingGoal(null);
      showSuccess(getRandomPhrase('goalCompleted') || 'Meta criada com sucesso!');
      hasLoadedRef.current = false; // Forçar recarregar
      loadData();
      loadWeekData();
    } catch (error) {
      showError(error.response?.data?.error || 'Erro ao criar meta');
    }
  };

  const handleUpdateGoal = async (goalData) => {
    try {
      await goalsService.update(editingGoal.id, goalData);
      setEditingGoal(null);
      setShowForm(false);
      showSuccess('Meta atualizada com sucesso!');
      hasLoadedRef.current = false; // Forçar recarregar
      loadData();
      loadWeekData();
    } catch (error) {
      showError(error.response?.data?.error || 'Erro ao atualizar meta');
    }
  };

  const handleToggleGoal = async (id) => {
    try {
      const goal = goals.find(g => g.id === id);
      const today = new Date().toISOString().split('T')[0];
      
      // Validar no frontend também
      if (!goal.completed && goal.date !== today) {
        showError('Só é permitido marcar metas do dia atual como concluídas');
        return;
      }
      
      await goalsService.toggle(id);
      if (!goal.completed) {
        // Meta foi concluída
        const completedGoals = goals.filter(g => g.completed).length + 1;
        const allCompleted = completedGoals === goals.length;
        
        if (allCompleted) {
          showSuccess(getRandomPhrase('allGoalsCompleted'));
          notificationService.notifyAllGoalsCompleted();
        } else {
          showSuccess(getRandomPhrase('goalCompleted'));
          notificationService.notifyGoalCompleted(goal.title);
        }
      } else {
        showSuccess('Meta marcada como pendente');
      }
      hasLoadedRef.current = false; // Forçar recarregar
      loadData();
      loadWeekData();
    } catch (error) {
      showError(error.response?.data?.error || 'Erro ao atualizar meta');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta meta?')) {
      try {
        await goalsService.delete(id);
        showSuccess('Meta excluída com sucesso');
        hasLoadedRef.current = false;
        loadData();
        loadWeekData();
      } catch (error) {
        showError('Erro ao excluir meta');
      }
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setShowForm(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingGoal(null);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-wrapper">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <Shield className="header-icon" size={28} />
              <h1>Metas de Estudos</h1>
            </div>
            <div className="header-actions-desktop">
              <div className="user-info-desktop">
                <span className="user-name-desktop">{user?.name}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          <div className="dashboard-content">
          {/* HERO SECTION */}
          <section className="dashboard-hero">
            <div className="hero-content">
              <div className="hero-main">
                <h1 className="hero-title">
                  Olá, {user?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="hero-subtitle">
                  {streak.currentStreak > 0 
                    ? `🔥 ${streak.currentStreak} dias consecutivos! Continue assim!`
                    : streak.totalDaysStudied > 0
                    ? `Você já estudou ${streak.totalDaysStudied} dias no total. Vamos continuar?`
                    : 'Vamos começar sua jornada de estudos hoje?'}
                </p>
              </div>
              
              <div className="hero-progress">
                <div className="progress-circle-container">
                  <div className="progress-circle">
                    <svg className="progress-svg" viewBox="0 0 120 120">
                      <circle
                        className="progress-bg"
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="var(--border-light)"
                        strokeWidth="8"
                      />
                      <circle
                        className="progress-bar"
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 54}
                        strokeDashoffset={2 * Math.PI * 54 * (1 - (progress.total > 0 ? progress.completed / progress.total : 0))}
                        transform="rotate(-90 60 60)"
                        style={{ 
                          transition: 'stroke-dashoffset 0.5s ease',
                          willChange: 'stroke-dashoffset'
                        }}
                      />
                    </svg>
                    <div className="progress-text">
                      <span className="progress-value">{progress.completed}</span>
                      <span className="progress-total">/ {progress.total}</span>
                    </div>
                  </div>
                  <p className="progress-label">Metas de hoje</p>
                </div>
              </div>
              
              {/* Meta de Horas */}
              <div className="hero-hours-goal">
                <div className="hours-goal-content">
                  <div className="hours-goal-display">
                    <Clock size={20} />
                    <div className="hours-goal-info">
                      <span className="hours-goal-label">Meta diária</span>
                      <div className="hours-goal-progress-text">
                        <span className="hours-studied">
                          {formatMinutes(Math.round(todayHours * 60))}
                        </span>
                        <span className="hours-separator">/</span>
                        <span className="hours-goal-value">
                          {formatMinutes(Math.round(hoursGoal * 60))}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Barra de Progresso */}
                  <div className="hours-progress-container">
                    <div className="hours-progress-bar">
                      <div 
                        className="hours-progress-fill"
                        data-complete={todayHours >= hoursGoal && hoursGoal > 0}
                        style={{ 
                          width: `${(() => {
                            if (hoursGoal <= 0) return 0;
                            const progressPercent = (todayHours / hoursGoal) * 100;
                            return Math.min(progressPercent, 100);
                          })()}%`,
                          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      />
                    </div>
                    <span className="hours-progress-percentage">
                      {(() => {
                        if (hoursGoal <= 0) return 0;
                        const progressPercent = (todayHours / hoursGoal) * 100;
                        return Math.min(Math.round(progressPercent), 100);
                      })()}%
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowHoursGoalSettings(true)}
                  className="btn-hours-goal-edit"
                  title="Configurar meta de horas"
                >
                  Editar
                </button>
              </div>
            </div>
            
            <div className="hero-actions">
              <button 
                onClick={() => setShowStudyModal(true)} 
                className="btn-hero-primary"
              >
                <Play size={24} />
                Iniciar Estudo
              </button>
              <button 
                onClick={() => {
                  setShowForm(true);
                  setEditingGoal(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="btn-hero-secondary"
              >
                <Plus size={20} />
                Nova Meta
              </button>
            </div>
          </section>

          {/* HEATMAP SEMANAL */}
          <section className="dashboard-heatmap">
            <div className="heatmap-header">
              <h3>Esta Semana</h3>
              <Link to="/statistics" className="heatmap-link">
                Ver Estatísticas <BarChart3 size={16} />
              </Link>
            </div>
            <div className="heatmap-grid">
              {weekData.map((day, index) => (
                <div
                  key={index}
                  className={`heatmap-day ${day.hasStudy ? 'active' : ''} ${day.isToday ? 'today' : ''}`}
                  title={`${day.day} - ${day.hasStudy ? 'Estudou' : 'Sem estudos'}`}
                >
                  <span className="day-label">{day.day}</span>
                  {day.hasStudy && <div className="day-indicator" />}
                  {day.isToday && <div className="today-marker" />}
                </div>
              ))}
            </div>
          </section>

          {/* Seção de Estudo Diário */}
          <section className="study-today-section">
            <div className="study-today-header">
              <div>
                <h2>Vamos estudar hoje?</h2>
                <p>
                  {streak.currentStreak > 0 
                    ? getContextualPhrase({ type: 'good_streak', streak: streak.currentStreak })
                    : 'Mantenha o foco e estude diariamente'}
                </p>
              </div>
              <div className="streak-info">
                <div className="streak-item">
                  <Star size={20} />
                  <span>{streak.currentStreak} dias</span>
                </div>
              </div>
            </div>
            <WeekDaySelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </section>

          {/* Formulário de Meta */}
          {showForm && (
            <section className="goal-form-section fade-in">
              <GoalForm
                goal={editingGoal}
                onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
                onCancel={handleCancelForm}
              />
            </section>
          )}

          {/* Botão para Adicionar Meta */}
          {!showForm && (
            <button
              onClick={() => {
                setEditingGoal(null);
                setShowForm(true);
                setTimeout(() => {
                  const formSection = document.querySelector('.goal-form-section');
                  if (formSection) {
                    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }}
              className="btn btn-primary btn-add"
            >
              <Plus size={20} />
              Nova Meta
            </button>
          )}

          {/* Lista de Metas */}
          <section className="goals-section">
            <div className="goals-section-header">
              <h2>Metas do Dia</h2>
              {filteredGoals.length > 0 && (
                <div className="search-filter-inline">
                  <Search size={16} />
                  <input
                    type="search"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input-inline"
                  />
                </div>
              )}
            </div>
            {loading ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Carregando...</p>
              </div>
            ) : filteredGoals.length === 0 ? (
              <div className="empty-state">
                <Target size={64} className="empty-icon" />
                <h3>Nenhuma meta encontrada</h3>
                <p>
                  {goals.length === 0 
                    ? getRandomPhrase('emptyState') || "Nenhuma meta para esta data. Clique em 'Nova Meta' para começar!"
                    : "Nenhuma meta corresponde aos filtros selecionados."}
                </p>
              </div>
            ) : (
              <div className="goals-list">
                {filteredGoals.map((goal, index) => (
                  <div key={goal.id} className="slide-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <GoalCard
                      goal={goal}
                      onToggle={handleToggleGoal}
                      onEdit={handleEditGoal}
                      onDelete={handleDeleteGoal}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
          </div>
        </main>
      </div>
      
      <StreakRecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        onRecoveryComplete={() => {
          hasLoadedRef.current = false;
          loadData();
          loadWeekData();
        }}
        streakData={streak}
      />
      
      <OnboardingTour
        isOpen={showOnboarding}
        onComplete={() => {
          setShowOnboarding(false);
          loadData();
        }}
        hasGoals={goals.length > 0}
      />
      
      <StudyModal
        isOpen={showStudyModal}
        onClose={() => setShowStudyModal(false)}
        onSessionComplete={async (session) => {
          // Recarregar dados primeiro para ter valores atualizados
          await loadData();
          loadWeekData();
          
          // Verificar meta de horas após criar sessão
          if (session) {
            try {
              const today = new Date().toISOString().split('T')[0];
              const updatedSessions = await sessionsService.getAll(today);
              const updatedHours = Array.isArray(updatedSessions) ? updatedSessions.reduce((sum, s) => {
                const h = parseFloat(s?.hours) || 0;
                const m = parseInt(s?.minutes) || 0;
                return sum + h + (m / 60);
              }, 0) : 0;
              
              // Buscar meta atualizada
              const currentSettings = await settingsService.get().catch(() => ({ daily_hours_goal: 2.0 }));
              const currentGoal = parseFloat(currentSettings?.daily_hours_goal || 2.0);
              
              if (currentGoal > 0 && updatedHours >= currentGoal) {
                const celebratedToday = localStorage.getItem(`hoursGoalCelebrated_${today}`);
                if (!celebratedToday) {
                  setShowHoursGoalCelebration(true);
                  setTodayHours(updatedHours);
                  setHoursGoal(currentGoal);
                  notificationService.notifyHoursGoalCompleted(updatedHours, currentGoal);
                  localStorage.setItem(`hoursGoalCelebrated_${today}`, 'true');
                }
              }
            } catch (error) {
              console.error('Erro ao verificar meta de horas:', error);
            }
          }
        }}
        todayGoals={goals.filter(g => g.date === selectedDate)}
      />
      
      <Confetti show={showConfetti} />
      
      <MilestoneCelebration
        isOpen={currentMilestone !== null}
        onClose={() => setCurrentMilestone(null)}
        milestone={currentMilestone}
      />
      
      <HoursGoalCelebration
        isOpen={showHoursGoalCelebration}
        onClose={() => setShowHoursGoalCelebration(false)}
        hoursStudied={todayHours}
        goalHours={hoursGoal}
      />
      
      <HoursGoalSettings
        isOpen={showHoursGoalSettings}
        onClose={() => setShowHoursGoalSettings(false)}
        currentGoal={hoursGoal}
        onUpdate={(newGoal) => {
          setHoursGoal(newGoal);
          loadData();
        }}
      />
    </div>
  );
};

export default Dashboard;
