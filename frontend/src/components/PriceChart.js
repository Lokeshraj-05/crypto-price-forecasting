import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Brush
} from 'recharts';
import './PriceChart.css';

const fmt = (v) => v?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CustomTooltip = ({ active, payload, visibility }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="custom-tooltip">
      <p className="tooltip-time">{d.fullTime}</p>
      {visibility.actual   && <p className="tooltip-actual">   <span className="tooltip-label">Actual:</span>   <span className="tooltip-value" style={{color:'#00ffff'}}>${fmt(d.actual)}</span></p>}
      {visibility.ensemble && <p className="tooltip-predicted"><span className="tooltip-label">Ensemble:</span> <span className="tooltip-value" style={{color:'#ff00ff'}}>${fmt(d.ensemble)}</span></p>}
      {visibility.lr   && d.lr   && <p className="tooltip-predicted"><span className="tooltip-label">LR:</span>   <span className="tooltip-value" style={{color:'#0080ff'}}>${fmt(d.lr)}</span></p>}
      {visibility.ema  && d.ema  && <p className="tooltip-predicted"><span className="tooltip-label">EMA:</span>  <span className="tooltip-value" style={{color:'#ffff00'}}>${fmt(d.ema)}</span></p>}
      {visibility.lstm && d.lstm && <p className="tooltip-predicted"><span className="tooltip-label">LSTM:</span> <span className="tooltip-value" style={{color:'#00ff00'}}>${fmt(d.lstm)}</span></p>}
      <p className="tooltip-error"><span className="tooltip-label">Error:</span><span className="tooltip-value" style={{color:'#ff8800'}}>${fmt(d.error)}</span></p>
    </div>
  );
};

const PriceChart = ({ data }) => {
  const [showActual,   setShowActual]   = useState(true);
  const [showEnsemble, setShowEnsemble] = useState(true);
  const [showLR,       setShowLR]       = useState(true);
  const [showEMA,      setShowEMA]      = useState(true);
  const [showLSTM,     setShowLSTM]     = useState(true);

  const visibility = useMemo(() => ({
    actual: showActual, ensemble: showEnsemble, lr: showLR, ema: showEMA, lstm: showLSTM
  }), [showActual, showEnsemble, showLR, showEMA, showLSTM]);

  const chartData = useMemo(() => data.slice().reverse().map(item => ({
    timestamp: new Date(item.timestamp).toLocaleTimeString(),
    fullTime:  new Date(item.timestamp).toLocaleString(),
    actual:    parseFloat(item.actual_price),
    ensemble:  parseFloat(item.predicted_price),
    lr:        item.lr_prediction   != null ? parseFloat(item.lr_prediction)   : null,
    ema:       item.ema_prediction  != null ? parseFloat(item.ema_prediction)  : null,
    lstm:      item.lstm_prediction != null ? parseFloat(item.lstm_prediction) : null,
    error:     Math.abs(parseFloat(item.error || 0)),
  })), [data]);

  const renderTooltip = useCallback(
    (props) => <CustomTooltip {...props} visibility={visibility} />,
    [visibility]
  );

  const toggles = [
    { label: 'Actual',    active: showActual,   set: setShowActual,   color: '#00ffff' },
    { label: 'Ensemble',  active: showEnsemble, set: setShowEnsemble, color: '#ff00ff' },
    { label: 'LR',        active: showLR,       set: setShowLR,       color: '#0080ff' },
    { label: 'EMA',       active: showEMA,      set: setShowEMA,      color: '#ffff00' },
    { label: 'LSTM',      active: showLSTM,     set: setShowLSTM,     color: '#00ff00' },
  ];

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div className="chart-title-section">
          <h2 className="chart-title">PRICE ANALYSIS</h2>
          <div className="chart-subtitle">Hybrid Model — EMA + Linear Regression + LSTM</div>
        </div>
        <div className="chart-controls">
          {toggles.map(t => (
            <button
              key={t.label}
              className={`toggle-btn ${t.active ? 'active' : ''}`}
              style={t.active ? { borderColor: t.color, color: t.color, boxShadow: `0 0 10px ${t.color}55` } : {}}
              onClick={() => t.set(!t.active)}
            >
              <span className="btn-indicator" style={{ background: t.color, boxShadow: `0 0 6px ${t.color}` }}></span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={520}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,255,0.08)" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#a0a0b0" tick={{ fill: '#a0a0b0', fontSize: 11 }} angle={-35} textAnchor="end" height={60} interval="preserveStartEnd" />
            <YAxis stroke="#a0a0b0" tick={{ fill: '#a0a0b0', fontSize: 11 }} tickFormatter={v => `$${v.toLocaleString()}`} width={90} />
            <Tooltip content={renderTooltip} />

            {showActual && (
              <Line type="monotone" dataKey="actual" stroke="#00ffff" strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#00ffff', stroke: '#fff', strokeWidth: 2 }}
                name="Actual" filter="url(#glow)" isAnimationActive={false} />
            )}
            {showEnsemble && (
              <Line type="monotone" dataKey="ensemble" stroke="#ff00ff" strokeWidth={2} strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 6, fill: '#ff00ff', stroke: '#fff', strokeWidth: 2 }}
                name="Ensemble" filter="url(#glow)" isAnimationActive={false} />
            )}
            {showLR && (
              <Line type="monotone" dataKey="lr" stroke="#0080ff" strokeWidth={1.5} strokeDasharray="4 4"
                dot={false} activeDot={{ r: 5, fill: '#0080ff' }}
                name="Linear Reg" isAnimationActive={false} />
            )}
            {showEMA && (
              <Line type="monotone" dataKey="ema" stroke="#ffff00" strokeWidth={1.5} strokeDasharray="4 4"
                dot={false} activeDot={{ r: 5, fill: '#ffff00' }}
                name="EMA" isAnimationActive={false} />
            )}
            {showLSTM && (
              <Line type="monotone" dataKey="lstm" stroke="#00ff00" strokeWidth={1.5} strokeDasharray="4 4"
                dot={false} activeDot={{ r: 5, fill: '#00ff00' }}
                name="LSTM" isAnimationActive={false} />
            )}

            <Brush dataKey="timestamp" height={24} stroke="#00ffff44" fill="rgba(0,255,255,0.05)" travellerWidth={8} y={460} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-info">
        <div className="info-item">
          <span className="info-text">Toggle individual models to compare | Brush to zoom</span>
        </div>
        <div className="info-item">
          <span className="info-text">Ensemble = weighted average of all 3 models</span>
        </div>
      </div>
    </div>
  );
};

export default PriceChart;
