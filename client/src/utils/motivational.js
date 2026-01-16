// Frases motivacionais para diferentes situações

export const motivationalPhrases = {
  // Quando completa uma meta
  goalCompleted: [
    "🎯 Excelente! Você está no caminho certo!",
    "🔥 Foco e determinação! Continue assim!",
    "💪 Cada meta concluída te aproxima do seu objetivo!",
    "⭐ Parabéns! Você está construindo sua disciplina!",
    "🚀 Um passo de cada vez, você vai longe!",
    "🏆 Dedicação é a chave do sucesso!",
    "✨ Você está se superando a cada dia!",
    "🎓 Concurseiro de verdade não desiste!"
  ],

  // Quando completa todas as metas do dia
  allGoalsCompleted: [
    "🏅 DIA PERFEITO! Você concluiu todas as metas!",
    "👑 Você é uma máquina de estudos! Continue assim!",
    "💎 Dedicação exemplar! Você está no caminho certo!",
    "🌟 Dia produtivo! Assim que se alcança a aprovação!",
    "🔥 Foco total! Você está se destacando!",
    "⚡ Energia e determinação! Parabéns pelo dia completo!",
    "🎯 Missão cumprida! Você é um verdadeiro guerreiro!",
    "💯 100% de aproveitamento! Isso é disciplina!"
  ],

  // Quando tem um streak bom
  goodStreak: [
    "🔥 Sequência incrível! Você está no fogo!",
    "💪 Dias consecutivos de disciplina! Continue assim!",
    "⭐ Você está construindo um hábito poderoso!",
    "🚀 Consistência é o segredo! Você está no caminho certo!",
    "🏆 Cada dia conta! Você está se superando!",
    "✨ Dedicação contínua! Isso é atitude de aprovado!",
    "🎓 Concurseiro de verdade mantém a disciplina!",
    "💎 Você está se tornando uma referência!"
  ],

  // Quando estuda bastante
  studyHours: [
    "📚 Horas bem investidas! Continue assim!",
    "⏰ Tempo dedicado é tempo ganho! Parabéns!",
    "🎯 Foco e disciplina! Você está no caminho certo!",
    "💪 Cada hora estudada te aproxima da aprovação!",
    "🔥 Dedicação é o que separa os aprovados!",
    "⭐ Você está investindo no seu futuro!",
    "🚀 Consistência é a chave do sucesso!",
    "🏆 Estudos de qualidade! Continue assim!"
  ],

  // Quando completa uma sessão de Pomodoro
  pomodoroCompleted: [
    "⏰ Sessão concluída! Foco máximo alcançado!",
    "🎯 45 minutos de concentração total! Parabéns!",
    "💪 Disciplina em ação! Continue assim!",
    "🔥 Foco e determinação! Você está no caminho certo!",
    "⭐ Cada sessão te aproxima do seu objetivo!",
    "🚀 Dedicação exemplar! Continue estudando!",
    "🏆 Tempo bem investido! Você está se superando!",
    "✨ Disciplina é o que faz a diferença!"
  ],

  // Quando não há metas ou está começando
  emptyState: [
    "🎯 Comece adicionando suas metas de estudo!",
    "💪 Cada jornada começa com o primeiro passo!",
    "🚀 Vamos começar? Adicione sua primeira meta!",
    "⭐ O sucesso começa com a primeira meta!",
    "🔥 Disciplina se constrói dia a dia!",
    "🎓 Concurseiro de verdade começa agora!",
    "💎 Sua aprovação começa hoje!",
    "✨ Vamos construir sua rotina de estudos!"
  ],

  // Quando tem um streak muito alto
  amazingStreak: [
    "👑 LENDÁRIO! Você está em uma sequência incrível!",
    "🔥 FOGO TOTAL! Dias consecutivos de disciplina!",
    "💎 MÁQUINA DE ESTUDOS! Você é uma inspiração!",
    "🏆 CAMPEÃO! Consistência exemplar!",
    "⭐ INCRÍVEL! Você está no caminho certo!",
    "🚀 FENOMENAL! Dedicação de verdadeiro aprovado!",
    "💯 PERFEIÇÃO! Você está se superando!",
    "✨ LENDÁRIO! Isso é atitude de campeão!"
  ],

  // Quando completa muitas horas de estudo
  manyStudyHours: [
    "📚 MUITAS HORAS ESTUDADAS! Você é dedicado!",
    "⏰ Tempo bem investido! Continue assim!",
    "🎯 Foco total! Você está no caminho certo!",
    "💪 Dedicação exemplar! Parabéns!",
    "🔥 Você está se destacando! Continue estudando!",
    "⭐ Horas de qualidade! Isso é disciplina!",
    "🚀 Consistência é o segredo! Você está no caminho certo!",
    "🏆 Estudos de verdadeiro aprovado!"
  ]
};

// Função para obter uma frase aleatória de uma categoria
export const getRandomPhrase = (category) => {
  const phrases = motivationalPhrases[category];
  if (!phrases || phrases.length === 0) return "";
  return phrases[Math.floor(Math.random() * phrases.length)];
};

// Função para obter frase baseada em contexto
export const getContextualPhrase = (context) => {
  switch (context.type) {
    case 'goal_completed':
      return getRandomPhrase('goalCompleted');
    case 'all_goals_completed':
      return getRandomPhrase('allGoalsCompleted');
    case 'good_streak':
      if (context.streak >= 7) {
        return getRandomPhrase('amazingStreak');
      }
      return getRandomPhrase('goodStreak');
    case 'study_hours':
      if (context.hours >= 4) {
        return getRandomPhrase('manyStudyHours');
      }
      return getRandomPhrase('studyHours');
    case 'pomodoro_completed':
      return getRandomPhrase('pomodoroCompleted');
    case 'empty_state':
      return getRandomPhrase('emptyState');
    default:
      return "";
  }
};
