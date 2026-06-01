import React from 'react';

function StatCard({ label, value, accent = 'primary' }) {
  return (
    <div className={`stat-card stat-card-${accent}`}>
      <div className="stat-card-top">
        <div className="stat-label">{label}</div>
        <span className="stat-accent" aria-hidden="true" />
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export default StatCard;
