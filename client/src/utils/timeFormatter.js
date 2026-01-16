/**
 * Formata minutos em uma string legível
 * Se for <= 60 minutos, mostra apenas minutos
 * Se for > 60 minutos, mostra horas e minutos
 * 
 * @param {number} minutes - Total de minutos
 * @returns {string} - String formatada (ex: "45 min", "1h 30min", "2h")
 */
export const formatMinutes = (minutes) => {
  const totalMinutes = Math.round(minutes || 0);
  
  if (totalMinutes <= 60) {
    return `${totalMinutes} min`;
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
};

/**
 * Formata horas decimais em uma string legível
 * Converte horas para minutos e formata
 * 
 * @param {number} hours - Total de horas (decimal)
 * @returns {string} - String formatada
 */
export const formatHours = (hours) => {
  const minutes = Math.round((hours || 0) * 60);
  return formatMinutes(minutes);
};
