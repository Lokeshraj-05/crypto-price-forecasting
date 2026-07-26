import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import './ErrorTrend.css';

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.88 5.76a1 1 0 0 0 .95.69h6.06l-4.9 3.56a1 1 0 0 0-.36 1.12L17.5 20l-4.9-3.56a1 1 0 0 0-1.18 0L6.5 20l1.87-5.87a1 1 0 0 0-.36-1.12L3.11 9.45h6.06a1 1 0 0 0 .95-.69L12 3z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const WarnIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const fmt2 = (v) => v?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ErrorTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="et-tooltip">
      <div className="et-tooltip-time">{d.time}</div>
      <div className="et-tooltip-row">
        <span className="et-tooltip-label">Error</span>
        <span className="et-tooltip-val" style={{ color: d.color }}>${fmt2(d.error)}</span>
      </div>
    </div>
  );
};

const ErrorTrend = ({ data, metrics }) => {
  const errorData = useMemo(() => {
    const recent = data.slice(0, 30).reverse();
    const errors = recent.map(d => Math.abs(parseFloat(d.error || 0)));
    const avg = errors.length ? errors.reduce((a, b) => a + b, 0) / errors.length : 0;
    const max = errors.length ? Math.max(...errors) : 0;

    return recent.map((item, i) => {
      const err = errors[i];
      const color = err > avg * 1.5 ? '#EF4444' : err > avg * 1.1 ? '#F59E0B' : '#22C55E';
      return {
        time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: err,
        color,
        fill: color,
        threshold: avg,
        spike: max,
      };
    });
  }, [data]);

  const stats = useMemo(() => {
    if (!errorData.length) return { avg: 0, max: 0, min: 0, current: 0, trend: 'stable' };
    const errors = errorData.map(d => d.error);
    const avg = errors.reduce((a, b) => a + b, 0) / errors.length;
    const max = Math.max(...errors);
    const min = Math.min(...errors);
    const current = errors[errors.length - 1] ?? 0;
    const recentHalf = errors.slice(Math.floor(errors.length / 2));
    const recentAvg = recentHalf.reduce((a, b) => a + b, 0) / recentHalf.length;
    const trend = recentAvg < avg * 0.95 ? 'improving' : recentAvg > avg * 1.05 ? 'worsening' : 'stable';
    return { avg, max, min, current, trend };
  }, [errorData]);

  const trendColor = stats.trend === 'improving' ? '#22C55E' : stats.trend === 'worsening' ? '#EF4444' : '#F59E0B';
  const trendLabel = stats.trend === 'improving' ? 'Improving' : stats.trend === 'worsening' ? 'Worsening' : 'Stable';

  /* ── Smart Insights derived from metrics + error stats ── */
  const weights  = metrics.weights    || { lr: 0.33, ema: 0.33, lstm: 0.34 };
  const mrmse    = metrics.model_rmse || { lr: 0,    ema: 0,    lstm: 0    };
  const models   = [
    { key: 'lr',   label: 'Linear Regression' },
    { key: 'ema',  label: 'EMA'               },
    { key: 'lstm', label: 'LSTM'              },
  ];
  const bestByWeight = models.reduce((b, m) => (weights[m.key] || 0) > (weights[b.key] || 0) ? m : b, models[0]);
  const bestByRmse   = models.reduce((b, m) => {
    const rv = mrmse[m.key] || Infinity;
    const bv = mrmse[b.key] || Infinity;
    return rv < bv ? m : b;
  }, models[0]);

  const mape = metrics.mape || 0;
  const accuracyGood = mape < 3;

  const insights = [
    {
      type: 'success',
      icon: <CheckIcon />,
      text: `${bestByWeight.label} holds the highest ensemble weight (${((weights[bestByWeight.key] || 0) * 100).toFixed(1)}%).`,
    },
    {
      type: accuracyGood ? 'success' : 'warning',
      icon: accuracyGood ? <CheckIcon /> : <WarnIcon />,
      text: accuracyGood
        ? `Overall prediction accuracy is high — MAPE at ${mape.toFixed(2)}%.`
        : `Prediction accuracy needs attention — MAPE at ${mape.toFixed(2)}%.`,
    },
    {
      type: stats.trend === 'improving' ? 'success' : stats.trend === 'worsening' ? 'warning' : 'info',
      icon: stats.trend === 'improving' ? <CheckIcon /> : stats.trend === 'worsening' ? <WarnIcon /> : <InfoIcon />,
      text: stats.trend === 'improving'
        ? 'Error trend is decreasing — model performance is improving.'
        : stats.trend === 'worsening'
        ? 'Error trend is increasing — monitor model performance.'
        : 'Error trend is stable across recent predictions.',
    },
    {
      type: 'info',
      icon: <InfoIcon />,
      text: `${bestByRmse.label} achieves the lowest individual RMSE ($${fmt2(mrmse[bestByRmse.key] || 0)}).`,
    },
    {
      type: stats.max > stats.avg * 2 ? 'warning' : 'success',
      icon: stats.max > stats.avg * 2 ? <WarnIcon /> : <CheckIcon />,
      text: stats.max > stats.avg * 2
        ? `Spike detected — max error $${fmt2(stats.max)} is ${(stats.max / stats.avg).toFixed(1)}× the average.`
        : 'No significant error spikes detected in recent predictions.',
    },
  ];

  const insightColors = { success: '#22C55E', info: '#3B82F6', warning: '#F59E0B' };

  /* gradient stops based on trend */
  const gradStart = stats.trend === 'improving' ? '#22C55E' : stats.trend === 'worsening' ? '#EF4444' : '#F59E0B';

  return (
    <div className="et-row">
      {/* ── Error Trend Card ── */}
      <div className="et-card">
        <div className="et-card-header">
          <div>
            <h3 className="et-title">Prediction Error Trend</h3>
            <p className="et-subtitle">Prediction accuracy over recent predictions</p>
          </div>
          <div className="et-trend-pill" style={{ '--tc': trendColor }}>
            <span className="et-trend-dot" style={{ background: trendColor }}></span>
            {trendLabel}
          </div>
        </div>

        <div className="et-chips">
          {[
            { label: 'Average', val: stats.avg, color: '#94A3B8' },
            { label: 'Maximum', val: stats.max, color: '#EF4444' },
            { label: 'Minimum', val: stats.min, color: '#22C55E' },
            { label: 'Current', val: stats.current, color: trendColor },
          ].map(c => (
            <div className="et-chip" key={c.label}>
              <span className="et-chip-label">{c.label}</span>
              <span className="et-chip-val mono" style={{ color: c.color }}>${fmt2(c.val)}</span>
            </div>
          ))}
        </div>

        <div className="et-chart-wrap">
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={errorData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={gradStart} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={gradStart} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" vertical={false}/>
              <XAxis dataKey="time" tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }} stroke="none" interval="preserveStartEnd"/>
              <YAxis tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }} stroke="none" tickFormatter={v => `$${v.toFixed(0)}`} width={48}/>
              <Tooltip content={<ErrorTooltip />}/>
              <Area
                type="monotone"
                dataKey="error"
                stroke={gradStart}
                strokeWidth={1.5}
                fill="url(#errGrad)"
                dot={false}
                activeDot={{ r: 4, fill: gradStart, stroke: '#1B2432', strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Smart Insights Card ── */}
      <div className="et-insights-card">
        <div className="et-insights-header">
          <span className="et-insights-icon"><SparkleIcon /></span>
          <div>
            <h3 className="et-title">Smart Insights</h3>
            <p className="et-subtitle">AI-generated model analysis</p>
          </div>
        </div>
        <div className="et-insights-list">
          {insights.map((ins, i) => (
            <div className="et-insight-row" key={i} style={{ animationDelay: `${i * 0.07}s` }}>
              <span className="et-insight-icon" style={{ color: insightColors[ins.type] }}>{ins.icon}</span>
              <span className="et-insight-text">{ins.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ErrorTrend;
