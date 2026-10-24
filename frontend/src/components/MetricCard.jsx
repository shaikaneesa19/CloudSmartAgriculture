import React from 'react';

export default function MetricCard({
  label,
  value,
  unit = '',
  subtext,
  type = 'moisture',
  icon,
  badgeText,
  badgeType = 'optimal',
}) {
  return (
    <div className={`stat-card ${type}`}>
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {icon && <div className="stat-icon-wrapper">{icon}</div>}
      </div>

      <div className="stat-value-group">
        <span className="stat-value">{value !== undefined && value !== null ? value : '--'}</span>
        {unit && <span className="stat-unit">{unit}</span>}
        {badgeText && (
          <span className={`badge badge-${badgeType}`} style={{ marginLeft: 'auto' }}>
            {badgeText}
          </span>
        )}
      </div>

      {subtext && <div className="stat-subtext">{subtext}</div>}
    </div>
  );
}
