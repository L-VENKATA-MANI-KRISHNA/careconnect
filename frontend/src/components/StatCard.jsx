import React from 'react';

const StatCard = ({ icon, label, value, subtext = null }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon-wrapper">{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {subtext && <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>{subtext}</div>}
      </div>
    </div>
  );
};

export default StatCard;
