import React from 'react';
import './MetricsCard.css';

/* Minimal inline SVG icons — no external dependency needed */
const Icons = {
  rmse: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  mape: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  mae: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  count: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  trophy: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
};

const MetricsCard = ({ metrics }) => {
  const getAccuracyLevel = (mape) => {
    if (mape < 1) return { level: 'Excellent', color: '#22C55E' };
    if (mape < 3) return { level: 'Healthy',   color: '#22C55E' };
    if (mape < 5) return { level: 'Fair',       color: '#F59E0B' };
    return             { level: 'Poor',         color: '#EF4444' };
  };

  const accuracy = getAccuracyLevel(metrics.mape || 0);
  const weights  = metrics.weights    || { lr: 0.33, ema: 0.33, lstm: 0.34 };
  const mrmse    = metrics.model_rmse || { lr: 0,    ema: 0,    lstm: 0    };

  const models = [
    { key: 'lr',   label: 'Linear Regression', color: '#3B82F6' },
    { key: 'ema',  label: 'EMA',               color: '#22C55E' },
    { key: 'lstm', label: 'LSTM',              color: '#8B5CF6' },
  ];

  /* Best model = highest weight */
  const bestModel = models.reduce((best, m) =>
    (weights[m.key] || 0) > (weights[best.key] || 0) ? m : best
  , models[0]);

  const cards = [
    { cls: 'rmse',  icon: Icons.rmse,  accent: '#3B82F6', label: 'Ensemble RMSE',  value: `$${metrics.rmse || 0}`,       desc: 'Root Mean Squared Error',          unit: 'USD'   },
    { cls: 'mape',  icon: Icons.mape,  accent: '#8B5CF6', label: 'MAPE',           value: `${metrics.mape || 0}`,        desc: 'Mean Absolute Percentage Error',   unit: '%'     },
    { cls: 'mae',   icon: Icons.mae,   accent: '#22C55E', label: 'MAE',            value: `$${metrics.mae || 0}`,        desc: 'Mean Absolute Error',              unit: 'USD'   },
    { cls: 'count', icon: Icons.count, accent: '#F59E0B', label: 'Predictions',    value: `${metrics.count || 0}`,       desc: 'Total Predictions Made',           unit: 'total' },
  ];

  return (
    <div className="metrics-container">

      {/* ── Header ── */}
      <div className="metrics-header">
        <div>
          <h2 className="metrics-title">Performance Metrics</h2>
          <p className="metrics-subtitle">Ensemble model evaluation · Real-time</p>
        </div>
        <div className="accuracy-pill" style={{ '--pill-color': accuracy.color }}>
          <span className="pill-dot" style={{ background: accuracy.color }}></span>
          {accuracy.level}
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="metrics-grid">
        {cards.map(c => (
          <div className={`metric-card ${c.cls}`} key={c.cls} style={{ '--accent': c.accent }}>
            <div className="card-accent-strip"></div>
            <div className="card-body">
              <div className="card-top">
                <span className="card-label">{c.label}</span>
                <span className="card-icon" style={{ color: c.accent }}>{c.icon}</span>
              </div>
              <div className="card-value mono">{c.value}<span className="card-unit">{c.unit}</span></div>
              <div className="card-desc">{c.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Dynamic Weights Panel ── */}
      <div className="weights-panel">
        <div className="weights-header">
          <div>
            <span className="weights-title">Dynamic Model Weights</span>
            <span className="weights-subtitle">Auto-adjusted based on recent RMSE</span>
          </div>
          <div className="best-model-badge" style={{ '--bm-color': bestModel.color }}>
            <span className="bm-icon">{Icons.trophy}</span>
            <span className="bm-label">Best:</span>
            <span className="bm-name" style={{ color: bestModel.color }}>{bestModel.label}</span>
          </div>
        </div>

        <div className="weights-grid">
          {models.map(m => (
            <div className="weight-row" key={m.key}>
              <div className="weight-meta">
                <span className="weight-name" style={{ color: m.color }}>{m.label}</span>
                <span className="weight-rmse mono">RMSE ${mrmse[m.key] || 0}</span>
              </div>
              <div className="weight-bar-track">
                <div
                  className="weight-bar-fill"
                  style={{ width: `${((weights[m.key] || 0) * 100).toFixed(1)}%`, background: m.color }}
                ></div>
              </div>
              <span className="weight-pct mono" style={{ color: m.color }}>
                {((weights[m.key] || 0) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default MetricsCard;
