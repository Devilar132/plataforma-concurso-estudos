import React, { useEffect } from 'react';
import './Confetti.css';

const Confetti = ({ show, onComplete }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="confetti-container">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            backgroundColor: [
              '#3b82f6',
              '#10b981',
              '#f59e0b',
              '#ef4444',
              '#8b5cf6',
              '#06b6d4'
            ][Math.floor(Math.random() * 6)]
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
