import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Brush, ReferenceLine
} from 'recharts';
import './PriceChart.css';

const COLORS = {
  actual:   '#06B6D4',
  ensemble: '#EC4899',
  lr:       '#3B82F6',
  ema:      '#22C55E',
  lstm:     '#8B5CF6',
};

const fmt = (v) => v?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* Short time label: "3:40 PM" */
const shortTime = (ts) => {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch { return ts; }
};

/* ── Bloomberg-style Tooltip ── */
const CustomTooltip = ({ active, payload, visibility }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const rows = [
    { key: 'actual',   label: 'Actual',           show: visibility.actual,                    val: d.actual,   color: COLORS.actual   },
    { key: 'ensemble', label: 'Ensemble',          show: visibility.ensemble,                  val: d.ensemble, color: COLORS.ensemble },
    { key: 'lr',       label: 'Linear Regression', show: visibility.lr   && d.lr   != null,    val: d.lr,       color: COLORS.lr       },
    { key: 'ema',      label: 'EMA',               show: visibility.ema  && d.ema  != null,    val: d.ema,      color: COLORS.ema      },
    { key: 'lstm',     label: 'LSTM',              show: visibility.lstm && d.lstm != null,    val: d.lstm,     color: COLORS.lstm     },
    { key: 'error',    label: 'Prediction Error',  show: true,                                 val: d.error,    color: '#F59E0B'       },
  ];
  return (
    <div className="custom-tooltip">
      <div className="tooltip-header">{d.fullTime}</div>
      <div className="tooltip-divider"/>
      <div className="tooltip-rows">
        {rows.filter(r => r.show).map(r => (
          <div className="tooltip-row" key={r.key}>
            <span className="tooltip-dot" style={{ background: r.color }}/>
            <span className="tooltip-label">{r.label}</span>
            <span className="tooltip-value mono" style={{ color: r.color }}>${fmt(r.val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Custom Brush Traveller (rounded blue handle) ── */
const BrushHandle = ({ x, y, width, height }) => (
  <g>
    <rect x={x} y={y + 2} width={width} height={height - 4} rx={4} ry={4} fill="#3B82F6" stroke="none"/>
    <line x1={x + width / 2 - 2} y1={y + 8} x2={x + width / 2 - 2} y2={y + height - 8} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} strokeLinecap="round"/>
    <line x1={x + width / 2 + 2} y1={y + 8} x2={x + width / 2 + 2} y2={y + height - 8} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} strokeLinecap="round"/>
  </g>
);

const PriceChart = ({ data }) => {
  const [showActual,   setShowActual]   = useState(true);
  const [showEnsemble, setShowEnsemble] = useState(true);
  const [showLR,       setShowLR]       = useState(true);
  const [showEMA,      setShowEMA]      = useState(true);
  const [showLSTM,     setShowLSTM]     = useState(true);
  const [brushRange,   setBrushRange]   = useState(null);
  const lastClickRef = useRef(0);

  const visibility = useMemo(() => ({
    actual: showActual, ensemble: showEnsemble, lr: showLR, ema: showEMA, lstm: showLSTM
  }), [showActual, showEnsemble, showLR, showEMA, showLSTM]);

  const chartData = useMemo(() => data.slice().reverse().map(item => ({
    timestamp: shortTime(item.timestamp),
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

  /* Double-click resets zoom */
  const handleDoubleClick = useCallback(() => {
    setBrushRange(null);
  }, []);

  const handleChartClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClickRef.current < 350) handleDoubleClick();
    lastClickRef.current = now;
  }, [handleDoubleClick]);

  /* Auto-space X-axis: show ~8 labels max */
  const xInterval = useMemo(() => {
    const len = brushRange
      ? brushRange.endIndex - brushRange.startIndex
      : chartData.length;
    return Math.max(1, Math.floor(len / 8));
  }, [chartData.length, brushRange]);

  const toggles = [
    { label: 'Actual',   active: showActual,   set: setShowActual,   color: COLORS.actual   },
    { label: 'Ensemble', active: showEnsemble, set: setShowEnsemble, color: COLORS.ensemble },
    { label: 'LR',       active: showLR,       set: setShowLR,       color: COLORS.lr       },
    { label: 'EMA',      active: showEMA,      set: setShowEMA,      color: COLORS.ema      },
    { label: 'LSTM',     active: showLSTM,     set: setShowLSTM,     color: COLORS.lstm     },
  ];

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div className="chart-title-section">
          <h2 className="chart-title">Price Analysis</h2>
          <div className="chart-subtitle">Hybrid Model — EMA · Linear Regression · LSTM</div>
        </div>
        <div className="chart-controls">
          {toggles.map(t => (
            <button
              key={t.label}
              className={`toggle-btn ${t.active ? 'active' : ''}`}
              style={t.active ? { '--btn-color': t.color } : {}}
              onClick={() => t.set(v => !v)}
            >
              <span className="btn-dot" style={{ background: t.color }}/>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrapper" onClick={handleChartClick}>
        <ResponsiveContainer width="100%" height={560}>
          <LineChart
            data={chartData}
            margin={{ top: 16, right: 24, left: 8, bottom: 16 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" vertical={false}/>
            <XAxis
              dataKey="timestamp"
              stroke="#334155"
              tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              height={40}
              interval={xInterval}
            />
            <YAxis
              stroke="#334155"
              tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `$${v.toLocaleString()}`}
              width={88}
            />
            <Tooltip
              content={renderTooltip}
              cursor={{ stroke: 'rgba(148,163,184,0.25)', strokeWidth: 1, strokeDasharray: '4 3' }}
            />

            {showActual && (
              <Line type="monotone" dataKey="actual" stroke={COLORS.actual} strokeWidth={2.5}
                dot={false} activeDot={{ r: 6, fill: COLORS.actual, stroke: '#0B1120', strokeWidth: 2 }}
                name="Actual" isAnimationActive={true} animationDuration={900} animationEasing="ease-out"/>
            )}
            {showEnsemble && (
              <Line type="monotone" dataKey="ensemble" stroke={COLORS.ensemble} strokeWidth={2} strokeDasharray="6 3"
                dot={false} activeDot={{ r: 6, fill: COLORS.ensemble, stroke: '#0B1120', strokeWidth: 2 }}
                name="Ensemble" isAnimationActive={false}/>
            )}
            {showLR && (
              <Line type="monotone" dataKey="lr" stroke={COLORS.lr} strokeWidth={1.5} strokeDasharray="4 4"
                dot={false} activeDot={{ r: 5, fill: COLORS.lr, stroke: '#0B1120', strokeWidth: 2 }}
                name="Linear Reg" isAnimationActive={false}/>
            )}
            {showEMA && (
              <Line type="monotone" dataKey="ema" stroke={COLORS.ema} strokeWidth={1.5} strokeDasharray="4 4"
                dot={false} activeDot={{ r: 5, fill: COLORS.ema, stroke: '#0B1120', strokeWidth: 2 }}
                name="EMA" isAnimationActive={false}/>
            )}
            {showLSTM && (
              <Line type="monotone" dataKey="lstm" stroke={COLORS.lstm} strokeWidth={1.5} strokeDasharray="4 4"
                dot={false} activeDot={{ r: 5, fill: COLORS.lstm, stroke: '#0B1120', strokeWidth: 2 }}
                name="LSTM" isAnimationActive={false}/>
            )}

            <Brush
              dataKey="timestamp"
              height={24}
              stroke="rgba(148,163,184,0.15)"
              fill="#131f2e"
              travellerWidth={12}
              traveller={<BrushHandle />}
              onChange={(range) => setBrushRange(range)}
              startIndex={brushRange?.startIndex}
              endIndex={brushRange?.endIndex}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-info">
        <span>Toggle models to compare</span>
        <span className="info-sep">·</span>
        <span>Drag brush to zoom</span>
        <span className="info-sep">·</span>
        <span>Double-click to reset zoom</span>
        <span className="info-sep">·</span>
        <span>Ensemble = weighted average of all 3 models</span>
      </div>
    </div>
  );
};

export default PriceChart;
