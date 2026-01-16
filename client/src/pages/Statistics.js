import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Calendar, TrendingUp, Flame, Target, Award } from 'lucide-react';
import { authService } from '../services/auth';
import { statsService } from '../services/stats';
import { showError } from '../utils/toast';
import { getContextualPhrase } from '../utils/motivational';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';
import './Statistics.css';

const Statistics = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [periodData, setPeriodData] = useState([]);
  const [tagData, setTagData] = useState([]);
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  const [period, setPeriod] = useState('week'); // week, month
  const [loading, setLoading] = useState(true);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, navigate]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      let startDate, endDate;
      const today = new Date();

      if (period === 'week') {
        startDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        endDate = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      } else {
        startDate = format(startOfMonth(today), 'yyyy-MM-dd');
        endDate = format(endOfMonth(today), 'yyyy-MM-dd');
      }

      const [generalStats, periodStats, streakData, tagsStats] = await Promise.all([
        statsService.getGeneral(),
        statsService.getPeriod(startDate, endDate),
        statsService.getStreak(),
        statsService.getByTag()
      ]);

      setStats(generalStats);
      setStreak(streakData);
      setTagData(tagsStats || []);

      // Formatar dados do período para gráfico
      const formattedData = periodStats.map(item => ({
        date: format(new Date(item.date), 'dd/MM'),
        total: item.total,
        completed: item.completed,
        pending: item.total - item.completed,
        completionRate: item.total > 0 ? ((item.completed / item.total) * 100).toFixed(0) : 0
      }));

      setPeriodData(formattedData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      showError('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="statistics-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <div className="statistics-wrapper">
        <header className="statistics-header">
        <div className="header-content">
          <div className="header-left">
            <Link to="/dashboard" className="btn-back">
              <ArrowLeft size={20} />
            </Link>
            <h1>Estatísticas</h1>
          </div>
          <div className="header-actions-desktop">
            <div className="period-selector">
              <button
                onClick={() => setPeriod('week')}
                className={`period-btn ${period === 'week' ? 'active' : ''}`}
              >
                Semana
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`period-btn ${period === 'month' ? 'active' : ''}`}
              >
                Mês
              </button>
            </div>
          </div>
          <div className="header-actions-mobile">
            <div className="period-selector-mobile">
              <button
                onClick={() => setPeriod('week')}
                className={`period-btn ${period === 'week' ? 'active' : ''}`}
              >
                Semana
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`period-btn ${period === 'month' ? 'active' : ''}`}
              >
                Mês
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="statistics-main">
        <div className="statistics-content">
          {/* Cards de Resumo */}
          <section className="summary-cards">
            <div className="summary-card">
              <div className="summary-card-icon">
                <Target size={24} />
              </div>
              <div className="summary-card-content">
                <h3>Total de Metas</h3>
                <div className="summary-card-value">{stats?.total || 0}</div>
                <p>{stats?.completed || 0} concluídas</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-card-icon" style={{ background: 'var(--success)' }}>
                <TrendingUp size={24} />
              </div>
              <div className="summary-card-content">
                <h3>Taxa de Conclusão</h3>
                <div className="summary-card-value">{stats?.completionRate || 0}%</div>
                <p>de metas completadas</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-card-icon" style={{ background: 'var(--primary)' }}>
                <Flame size={24} />
              </div>
              <div className="summary-card-content">
                <h3>Sequência Atual</h3>
                <div className="summary-card-value">{streak.currentStreak}</div>
                <p>Recorde: {streak.longestStreak} dias</p>
                {streak.currentStreak > 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    {getContextualPhrase({ type: 'good_streak', streak: streak.currentStreak })}
                  </p>
                )}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-card-icon" style={{ background: 'var(--secondary)' }}>
                <Award size={24} />
              </div>
              <div className="summary-card-content">
                <h3>Pendentes</h3>
                <div className="summary-card-value">{stats?.pending || 0}</div>
                <p>metas para concluir</p>
              </div>
            </div>
          </section>

          {/* Gráfico de Linha - Progresso ao Longo do Tempo */}
          <section className="chart-section">
            <div className="chart-card">
              <h2>Progresso {period === 'week' ? 'Semanal' : 'Mensal'}</h2>
              {periodData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={periodData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-secondary)" />
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
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#10B981"
                      strokeWidth={3}
                      name="Concluídas"
                      dot={{ fill: '#10B981', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pending"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      name="Pendentes"
                      dot={{ fill: '#F59E0B', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data">
                  <Calendar size={48} />
                  <p>Nenhum dado disponível para este período</p>
                </div>
              )}
            </div>
          </section>

          {/* Gráfico de Barras - Taxa de Conclusão */}
          <section className="chart-section">
            <div className="chart-card">
              <h2>Taxa de Conclusão por Dia</h2>
              {periodData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={periodData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-secondary)" />
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
                      formatter={(value) => `${value}%`}
                    />
                    <Bar dataKey="completionRate" fill="#4F46E5" radius={[8, 8, 0, 0]} name="Taxa de Conclusão (%)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data">
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </div>
          </section>

          {/* Gráfico de Pizza - Metas por Tag */}
          {tagData.length > 0 && (
            <section className="chart-section">
              <div className="chart-card">
                <h2>Distribuição por Matéria/Tag</h2>
                <div className="pie-chart-container">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={tagData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="total"
                      >
                        {tagData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="tag-legend">
                  {tagData.map((tag, index) => (
                    <div key={tag.tag} className="tag-legend-item">
                      <div
                        className="tag-color"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span>{tag.tag}</span>
                      <span className="tag-count">{tag.total} metas ({tag.completed} concluídas)</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
      </div>
    </div>
  );
};

export default Statistics;
