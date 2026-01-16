class NotificationService {
  constructor() {
    this.permission = null;
    this.checkPermission();
  }

  async checkPermission() {
    if (!('Notification' in window)) {
      return false;
    }
    this.permission = Notification.permission;
    return this.permission === 'granted';
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  async showNotification(title, options = {}) {
    if (!(await this.checkPermission())) {
      return;
    }

    const defaultOptions = {
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      requireInteraction: false,
      ...options
    };

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, defaultOptions);
      } catch (error) {
        // Fallback para notificação simples
        new Notification(title, defaultOptions);
      }
    } else {
      new Notification(title, defaultOptions);
    }
  }

  async notifyDailyReminder(goalsCount) {
    await this.showNotification('📚 Hora de Estudar!', {
      body: `Você tem ${goalsCount} ${goalsCount === 1 ? 'meta' : 'metas'} para hoje. Vamos começar?`,
      tag: 'daily-reminder',
      actions: [
        { action: 'open', title: 'Abrir App' }
      ]
    });
  }

  async notifyStreakAtRisk() {
    await this.showNotification('🔥 Sua sequência está em risco!', {
      body: 'Você não estudou há 2 dias. Volte hoje para manter sua sequência!',
      tag: 'streak-risk',
      requireInteraction: true
    });
  }

  async notifyStreakMilestone(days) {
    await this.showNotification(`🎉 ${days} dias consecutivos!`, {
      body: 'Parabéns! Você está mantendo a disciplina. Continue assim!',
      tag: 'streak-milestone'
    });
  }

  async notifyGoalCompleted(goalTitle) {
    await this.showNotification('✅ Meta Concluída!', {
      body: `Você completou: ${goalTitle}`,
      tag: 'goal-completed'
    });
  }

  async notifyAllGoalsCompleted() {
    await this.showNotification('🏅 Dia Perfeito!', {
      body: 'Você concluiu todas as metas de hoje! Parabéns!',
      tag: 'all-goals-completed',
      requireInteraction: true
    });
  }

  async notifyHoursGoalCompleted(hoursStudied, goalHours) {
    await this.showNotification('🎉 Meta de Horas Batida!', {
      body: `Parabéns! Você completou ${hoursStudied.toFixed(1)}h de ${goalHours.toFixed(1)}h de estudo hoje!`,
      tag: 'hours-goal-completed',
      requireInteraction: true
    });
  }

  // Verificar se usuário não abriu há X dias
  checkInactivity() {
    const lastAccess = localStorage.getItem('lastAccess');
    if (!lastAccess) {
      localStorage.setItem('lastAccess', new Date().toISOString());
      return;
    }

    const daysSinceAccess = (Date.now() - new Date(lastAccess).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceAccess >= 2) {
      this.notifyStreakAtRisk();
    }
  }

  // Atualizar último acesso
  updateLastAccess() {
    localStorage.setItem('lastAccess', new Date().toISOString());
  }
}

export const notificationService = new NotificationService();
