import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Plus, TrendingUp, Calendar, Award, Target, BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { authService } from '../services/auth';
import { sessionsService } from '../services/sessions';
import PomodoroTimer from '../components/PomodoroTimer';
import { showSuccess, showError } from '../utils/toast';
import { getContextualPhrase } from '../utils/motivational';
import { formatMinutes, formatHours } from '../utils/timeFormatter';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import './StudyHours.css';

const StudyHours = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTimer, setShowTimer] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    date: today, // Sempre hoje, não pode alterar
    hours: '',
    minutes: '',
    subject: '',
    notes: ''
  });

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#8B5CF6'];

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

      const [summaryData, sessionsData, weekSessions] = await Promise.all([
        sessionsService.getSummary(),
        sessionsService.getAll(null, format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')),
        sessionsService.getAll(null, format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd'))
      ]);

      setSummary(summaryData);
      setSessions(sessionsData);

      // Preparar dados da semana para gráfico
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const daySessions = weekSessions.filter(s => s.date === dateStr);
        const totalHours = daySessions.reduce((sum, s) => sum + parseFloat(s.hours || 0), 0);
        weekDays.push({
          day: dayNames[date.getDay()],
          date: format(date, 'dd/MM'),
          hours: parseFloat(totalHours.toFixed(2))
        });
      }
      setWeekData(weekDays);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showError('Erro ao carregar dados de horas estudadas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Converter horas e minutos para apenas minutos antes de enviar
      const hours = parseFloat(formData.hours) || 0;
      const minutes = parseInt(formData.minutes) || 0;
      const totalMinutes = Math.round(hours * 60) + minutes;
      
      if (totalMinutes <= 0) {
        showError('É necessário informar pelo menos 1 minuto de estudo');
        return;
      }
      
      await sessionsService.create({
        date: formData.date,
        minutes: totalMinutes,
        subject: formData.subject || null,
        notes: formData.notes || null
      });
      const totalHours = totalMinutes / 60;
      const phrase = getContextualPhrase({ type: 'study_hours', hours: totalHours });
      showSuccess(phrase || 'Horas registradas com sucesso!');
      setShowForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        hours: '',
        minutes: '',
        subject: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      showError(error.response?.data?.error || 'Erro ao registrar horas');
    }
  };

  const handleSessionComplete = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="study-hours-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="study-hours-page">
      <div className="study-hours-wrapper">
        <header className="study-hours-header">
        <div className="header-content">
          <div className="header-left">
            <Link to="/dashboard" className="btn-back" title="Voltar">
              <ArrowLeft size={20} />
            </Link>
            <h1>Horas de Estudo</h1>
          </div>
          <div className="header-actions-desktop">
            {/* Espaço para ações futuras no desktop */}
          </div>
        </div>
      </header>

      <main className="study-hours-main">
        <div className="study-hours-content">
          {/* Cards de Resumo */}
          <section className="summary-cards">
            <div className="summary-card">
              <div className="summary-card-icon">
                <Clock size={24} />
              </div>
              <div className="summary-card-content">
                <h3>Total Estudado</h3>
                <div className="summary-card-value">
                  {formatHours(summary?.totalHours || 0)}
                </div>
                <p>acumuladas</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-card-icon" style={{ background: 'var(--success)' }}>
                <Calendar size={24} />
              </div>
              <div className="summary-card-content">
                <h3>Hoje</h3>
                <div className="summary-card-value">
                  {formatHours(summary?.todayHours || 0)}
                </div>
                <p>horas estudadas</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-card-icon" style={{ background: 'var(--primary)' }}>
                <TrendingUp size={24} />
              </div>
              <div className="summary-card-content">
                <h3>Média Diária</h3>
                <div className="summary-card-value">
                  {formatHours(summary?.avgHours || 0)}
                </div>
                <p>horas por dia</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-card-icon" style={{ background: 'var(--secondary)' }}>
                <Award size={24} />
              </div>
              <div className="summary-card-content">
                <h3>Dias Estudados</h3>
                <div className="summary-card-value">{summary?.daysStudied || 0}</div>
                <p>dias com estudos</p>
              </div>
            </div>
          </section>

          {/* Timer Pomodoro */}
          <section className="timer-section">
            <div className="section-header">
              <h2>Timer Pomodoro</h2>
              <button
                onClick={() => setShowTimer(!showTimer)}
                className="btn btn-secondary btn-sm"
              >
                {showTimer ? 'Ocultar' : 'Mostrar'} Timer
              </button>
            </div>
            {showTimer && (
              <PomodoroTimer onSessionComplete={handleSessionComplete} />
            )}
          </section>

          {/* Gráfico Semanal */}
          <section className="chart-section">
            <div className="chart-card">
              <h2>Horas Estudadas - Esta Semana</h2>
              {weekData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--surface-light)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text)'
                      }}
                      labelStyle={{ color: 'var(--text)' }}
                      itemStyle={{ color: 'var(--text-secondary)' }}
                      formatter={(value) => {
                        const hours = parseFloat(value || 0);
                        if (hours < 1) {
                          const minutes = Math.round(hours * 60);
                          return `${minutes}min`;
                        }
                        return `${hours.toFixed(2)}h`;
                      }}
                    />
                    <Bar dataKey="hours" fill="#4F46E5" radius={[8, 8, 0, 0]}>
                      {weekData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data">
                  <Clock size={48} />
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </div>
          </section>

          {/* Botões de Ação */}
          <section className="actions-section">
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn btn-primary"
            >
              <Plus size={20} />
              {showForm ? 'Cancelar' : 'Registrar Horas Manualmente'}
            </button>
          </section>

          {/* Formulário de Registro */}
          {showForm && (
            <section className="form-section">
              <div className="form-card">
                <h2>Registrar Horas de Estudo</h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="date">Data</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        const today = new Date().toISOString().split('T')[0];
                        // Só permite hoje
                        if (selectedDate === today) {
                          setFormData({ ...formData, date: selectedDate });
                        }
                      }}
                      max={today}
                      min={today}
                      required
                      readOnly
                      style={{ cursor: 'not-allowed', opacity: 0.7 }}
                      title="Só é permitido registrar horas para o dia atual"
                    />
                    <small style={{ color: 'var(--text-light)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      Apenas registros do dia atual são permitidos
                    </small>
                  </div>
                    <div className="form-group">
                      <label htmlFor="hours">Horas</label>
                      <input
                        type="number"
                        id="hours"
                        name="hours"
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
                        name="minutes"
                        value={formData.minutes}
                        onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
                        min="0"
                        max="59"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject">Matéria/Tema (opcional)</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Ex: Direito Constitucional"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="notes">Notas (opcional)</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows="3"
                      placeholder="Anotações sobre a sessão de estudo..."
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                      Registrar
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {/* Histórico Recente */}
          {sessions.length > 0 && (
            <section className="sessions-section">
              <h2>Sessões Recentes</h2>
              <div className="sessions-list">
                {sessions.slice(0, 10).map((session) => (
                  <div key={session.id} className="session-card">
                    <div className="session-header">
                      <div className="session-date">
                        {new Date(session.date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="session-hours">
                        {(() => {
                          const hours = parseFloat(session.hours || 0);
                          if (hours < 1) {
                            const minutes = Math.round(hours * 60);
                            return `${minutes}min`;
                          }
                          return `${hours.toFixed(2)}h`;
                        })()}
                      </div>
                    </div>
                    {session.subject && (
                      <div className="session-subject">{session.subject}</div>
                    )}
                    {session.notes && (
                      <div className="session-notes">{session.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      </div>
    </div>
  );
};

export default StudyHours;
