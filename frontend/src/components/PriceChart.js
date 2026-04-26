import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Brush
} from 'recharts';
import './PriceChart.css';

const PriceChart = ({ data }) => {
  const [showActual,   setShowActual]   = useState(true);
  const [showEnsemble, setShowEnsemble] = useState(true);
  const [showLR,       setShowLR]       = useState(true);
  const [showEMA,      setShowEMA]      = useState(true);
  const [showLSTM,     setShowLSTM]     = useState(true);

  const chartData = data.slice().reverse().map(item => ({
    timestamp: new Date(item.timestamp).toLocaleTimeString(),
    fullTime:  new Date(item.timestamp).toLocaleString(),
    actual:    parseFloat(item.actual_price),
    ensemble:  parseFloat(item.predicted_price),
    lr:        item.lr_prediction   != null ? parseFloat(item.lr_prediction)   : null,
    ema:       item.ema_prediction  != null ? parseFloat(item.ema_prediction)  : null,
    lstm:      item.lstm_prediction != null ? parseFloat(item.lstm_prediction) : null,
    error:     Math.abs(parseFloat(item.error || 0)),
  }));

  const fmt = (v) => v?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <p className="tooltip-time">{d.fullTime}</p>
        {showActual   && <p className="tooltip-actual">   <span className="tooltip-label">Actual:</span>   <span className="tooltip-value" style={{color:'#00ffff'}}>${fmt(d.actual)}</span></p>}
        {showEnsemble && <p className="tooltip-predicted"><span className="tooltip-label">Ensemble:</span> <span className="tooltip-value" style={{color:'#ff00ff'}}>${fmt(d.ensemble)}</span></p>}
        {showLR       && d.lr   && <p className="tooltip-predicted"><span className="tooltip-label">LR:</span>   <span className="tooltip-value" style={{color:'#0080ff'}}>${fmt(d.lr)}</span></p>}
        {showEMA      && d.ema  && <p className="tooltip-predicted"><span className="tooltip-label">EMA:</span>  <span className="tooltip-value" style={{color:'#ffff00'}}>${fmt(d.ema)}</span></p>}
        {showLSTM     && d.lstm && <p className="tooltip-predicted"><span className="tooltip-label">LSTM:</span> <span className="tooltip-value" style={{color:'#00ff00'}}>${fmt(d.lstm)}</span></p>}
        <p className="tooltip-error"><span className="tooltip-label">Error:</span><span className="tooltip-value" style={{color:'#ff8800'}}>${fmt(d.error)}</span></p>
      </div>
    );
  };

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
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
            <XAxis dataKey="timestamp" stroke="#a0a0b0" tick={{ fill: '#a0a0b0', fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#a0a0b0" tick={{ fill: '#a0a0b0', fontSize: 11 }} tickFormatter={v => `$${v.toLocaleString()}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line"
              formatter={v => <span style={{ color: '#ccc', fontSize: '13px' }}>{v}</span>} />

            {showActual && (
              <Line type="monotone" dataKey="actual" stroke="#00ffff" strokeWidth={3}
                dot={{ fill: '#00ffff', r: 3, stroke: '#0a0a0f', strokeWidth: 1 }}
                activeDot={{ r: 6, fill: '#00ffff', stroke: '#fff', strokeWidth: 2 }}
                name="Actual" filter="url(#glow)" />
            )}
            {showEnsemble && (
              <Line type="monotone" dataKey="ensemble" stroke="#ff00ff" strokeWidth={3} strokeDasharray="6 3"
                dot={{ fill: '#ff00ff', r: 3, stroke: '#0a0a0f', strokeWidth: 1 }}
                activeDot={{ r: 6, fill: '#ff00ff', stroke: '#fff', strokeWidth: 2 }}
                name="Ensemble" filter="url(#glow)" />
            )}
            {showLR && (
              <Line type="monotone" dataKey="lr" stroke="#0080ff" strokeWidth={2} strokeDasharray="4 4"
                dot={{ fill: '#0080ff', r: 2 }} activeDot={{ r: 5, fill: '#0080ff' }}
                name="Linear Reg" connectNulls={true} />
            )}
            {showEMA && (
              <Line type="monotone" dataKey="ema" stroke="#ffff00" strokeWidth={2} strokeDasharray="4 4"
                dot={{ fill: '#ffff00', r: 2 }} activeDot={{ r: 5, fill: '#ffff00' }}
                name="EMA" connectNulls={true} />
            )}
            {showLSTM && (
              <Line type="monotone" dataKey="lstm" stroke="#00ff00" strokeWidth={2} strokeDasharray="4 4"
                dot={{ fill: '#00ff00', r: 2 }} activeDot={{ r: 5, fill: '#00ff00' }}
                name="LSTM" connectNulls={true} />
            )}

            <Brush dataKey="timestamp" height={28} stroke="#00ffff" fill="rgba(0,255,255,0.07)" travellerWidth={8} />
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
