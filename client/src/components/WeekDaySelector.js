import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './WeekDaySelector.css';

const WeekDaySelector = ({ selectedDate, onDateChange }) => {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const scrollContainerRef = useRef(null);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira como início
    return new Date(d.setDate(diff));
  };

  const generateWeekDays = (weekOffset) => {
    const baseDate = new Date(today);
    baseDate.setDate(today.getDate() + (weekOffset * 7));
    const startOfWeek = getStartOfWeek(baseDate);
    
    const weekDays = [];
    const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      weekDays.push({
        date: dateStr,
        dayName: dayNames[i],
        dayNumber: date.getDate(),
        isToday: dateStr === todayStr,
        isPast: dateStr < todayStr,
        isFuture: dateStr > todayStr
      });
    }
    
    return weekDays;
  };

  // Gerar múltiplas semanas para scroll
  const weeks = [];
  for (let i = -2; i <= 2; i++) {
    weeks.push({
      offset: i,
      days: generateWeekDays(i)
    });
  }

  const handlePreviousWeek = () => {
    setCurrentWeekOffset(currentWeekOffset - 1);
    // Scroll suave para a esquerda
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const handleNextWeek = () => {
    setCurrentWeekOffset(currentWeekOffset + 1);
    // Scroll suave para a direita
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Scroll para a semana atual quando necessário
  useEffect(() => {
    if (scrollContainerRef.current) {
      const selectedDay = scrollContainerRef.current.querySelector(`[data-date="${selectedDate}"]`);
      if (selectedDay) {
        setTimeout(() => {
          selectedDay.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }, 100);
      }
    }
  }, [selectedDate]);

  // Atualizar offset baseado na data selecionada
  useEffect(() => {
    const selectedDateObj = new Date(selectedDate);
    const todayObj = new Date(todayStr);
    const diffDays = Math.floor((selectedDateObj - todayObj) / (1000 * 60 * 60 * 24));
    const weekDiff = Math.floor(diffDays / 7);
    if (weekDiff >= -2 && weekDiff <= 2 && weekDiff !== currentWeekOffset) {
      setCurrentWeekOffset(weekDiff);
    }
  }, [selectedDate, todayStr, currentWeekOffset]);

  return (
    <div className="week-day-selector-container">
      <button
        className="week-nav-button week-nav-prev"
        onClick={handlePreviousWeek}
        aria-label="Semana anterior"
      >
        <ChevronLeft size={20} />
      </button>
      
      <div className="week-day-selector" ref={scrollContainerRef}>
        {weeks.map((week, weekIndex) => (
          <div key={week.offset} className="week-row">
            {week.days.map((day) => (
              <button
                key={day.date}
                data-date={day.date}
                className={`day-button ${selectedDate === day.date ? 'active' : ''} ${day.isToday ? 'today' : ''} ${day.isPast ? 'past' : ''} ${day.isFuture ? 'future' : ''}`}
                onClick={() => !day.isFuture && onDateChange(day.date)}
                disabled={day.isFuture}
                title={day.isFuture ? 'Não é possível selecionar datas futuras' : ''}
              >
                <span className="day-name">{day.dayName}</span>
                <span className="day-number">{day.dayNumber}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      
      <button
        className="week-nav-button week-nav-next"
        onClick={handleNextWeek}
        disabled={currentWeekOffset >= 2}
        aria-label="Próxima semana"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default WeekDaySelector;
