import React from 'react';
import './StatsCard.css';

const StatsCard = ({ title, value, subtitle, icon, color, badge, badgeLabel }) => {
  return (
    <div className="stats-card">
      <div className="stats-card-header">
        <div className="stats-card-icon" style={{ background: color ? `linear-gradient(135deg, ${color}, ${color}dd)` : undefined }}>
          {icon}
        </div>
      </div>
      <div className="stats-card-content">
        <h3 className="stats-card-title">{title}</h3>
        <div className="stats-card-value">{value}</div>
        {subtitle && <div className="stats-card-subtitle">{subtitle}</div>}
        {(badge || badgeLabel) && (
          <div className="stats-card-footer">
            {badgeLabel && <span className="stats-card-label">{badgeLabel}</span>}
            {badge && <span className="stats-card-badge">{badge}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
