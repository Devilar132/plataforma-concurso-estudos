import React from 'react';
import './SkeletonLoader.css';

export const SkeletonCard = ({ height = '200px' }) => (
  <div className="skeleton-card" style={{ height }}>
    <div className="skeleton-line skeleton-line-title"></div>
    <div className="skeleton-line"></div>
    <div className="skeleton-line skeleton-line-short"></div>
  </div>
);

export const SkeletonStatsCard = () => (
  <div className="skeleton-stats-card">
    <div className="skeleton-icon"></div>
    <div className="skeleton-content">
      <div className="skeleton-line skeleton-line-label"></div>
      <div className="skeleton-line skeleton-line-value"></div>
    </div>
  </div>
);

export const SkeletonGoalCard = () => (
  <div className="skeleton-goal-card">
    <div className="skeleton-header">
      <div className="skeleton-checkbox"></div>
      <div className="skeleton-actions">
        <div className="skeleton-icon-small"></div>
        <div className="skeleton-icon-small"></div>
      </div>
    </div>
    <div className="skeleton-body">
      <div className="skeleton-line skeleton-line-title"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line skeleton-line-short"></div>
    </div>
  </div>
);

export default SkeletonLoader;
