import React from 'react';
import './MetricsCard.css';

const MetricsCard = ({ metrics }) => {
  const getAccuracyLevel = (mape) => {
    if (mape < 1) return { level: 'EXCELLENT', color: '#00ff00' };
    if (mape < 3) return { level: 'GOOD',      color: '#00ffff' };
    if (mape < 5) return { level: 'FAIR',       color: '#ffff00' };
    return             { level: 'POOR',         color: '#ff0000' };
  };

  const accuracy = getAccuracyLevel(metrics.mape || 0);
  const weights  = metrics.weights    || { lr: 0.33, ema: 0.33, lstm: 0.34 };
  const mrmse    = metrics.model_rmse || { lr: 0,    ema: 0,    lstm: 0    };

  const models = [
    { key: 'lr',   label: 'Linear Regression', color: '#0080ff' },
    { key: 'ema',  label: 'EMA',               color: '#ff00ff' },
    { key: 'lstm', label: 'LSTM',              color: '#00ff00' },
  ];

  return (
    <div className="metrics-container">

      {/* ── Header ── */}
      <div className="metrics-header">
        <h2 className="metrics-title">PERFORMANCE METRICS</h2>
        <div className="accuracy-badge" style={{ borderColor: accuracy.color, color: accuracy.color }}>
          <span className="badge-pulse" style={{ background: accuracy.color }}></span>
          {accuracy.level}
        </div>
      </div>

      {/* ── Ensemble summary cards ── */}
      <div className="metrics-grid">
        <div className="metric-card rmse">
          <div className="metric-icon">RMSE</div>
          <div className="metric-content">
            <div className="metric-label">ENSEMBLE RMSE</div>
            <div className="metric-value">${metrics.rmse || 0}<span className="metric-unit">USD</span></div>
            <div className="metric-description">Root Mean Squared Error</div>
          </div>
          <div className="metric-glow rmse-glow"></div>
        </div>

        <div className="metric-card mape">
          <div className="metric-icon">MAPE</div>
          <div className="metric-content">
            <div className="metric-label">MAPE</div>
            <div className="metric-value">{metrics.mape || 0}<span className="metric-unit">%</span></div>
            <div className="metric-description">Mean Absolute Percentage Error</div>
          </div>
          <div className="metric-glow mape-glow"></div>
        </div>

        <div className="metric-card mae">
          <div className="metric-icon">MAE</div>
          <div className="metric-content">
            <div className="metric-label">MAE</div>
            <div className="metric-value">${metrics.mae || 0}<span className="metric-unit">USD</span></div>
            <div className="metric-description">Mean Absolute Error</div>
          </div>
          <div className="metric-glow mae-glow"></div>
        </div>

        <div className="metric-card count">
          <div className="metric-icon">PRED</div>
          <div className="metric-content">
            <div className="metric-label">PREDICTIONS</div>
            <div className="metric-value">{metrics.count || 0}<span className="metric-unit">total</span></div>
            <div className="metric-description">Total Predictions Made</div>
          </div>
          <div className="metric-glow count-glow"></div>
        </div>
      </div>

      {/* ── Dynamic Weights Panel ── */}
      <div className="weights-panel">
        <div className="weights-header">
          <span className="weights-title">DYNAMIC MODEL WEIGHTS</span>
          <span className="weights-subtitle">Auto-adjusted based on recent RMSE</span>
        </div>

        <div className="weights-grid">
          {models.map(m => (
            <div className="weight-row" key={m.key}>
              <div className="weight-meta">
                <span className="weight-name" style={{ color: m.color }}>{m.label}</span>
                <span className="weight-rmse">RMSE: ${mrmse[m.key] || 0}</span>
              </div>
              <div className="weight-bar-track">
                <div
                  className="weight-bar-fill"
                  style={{
                    width: `${((weights[m.key] || 0) * 100).toFixed(1)}%`,
                    background: m.color,
                    boxShadow: `0 0 8px ${m.color}`,
                  }}
                ></div>
              </div>
              <span className="weight-pct" style={{ color: m.color }}>
                {((weights[m.key] || 0) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>

        <div className="weights-note">
          Best performing model gets highest weight automatically
        </div>
      </div>

    </div>
  );
};

export default MetricsCard;
