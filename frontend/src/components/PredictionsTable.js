import React, { useState, useMemo } from 'react';
import './PredictionsTable.css';

const PAGE_SIZE = 10;

const fmt = (v) => v != null
  ? Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  : '—';

const getStatus = (pctErr) => {
  if (pctErr == null) return { label: '—',         cls: 'status-na'       };
  if (pctErr < 1)    return { label: '● Excellent', cls: 'status-excellent' };
  if (pctErr < 3)    return { label: '● Moderate',  cls: 'status-moderate'  };
  return               { label: '● High Error',  cls: 'status-high'      };
};

const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const PredictionsTable = ({ data }) => {
  const [page, setPage] = useState(0);

  const rows = useMemo(() =>
    data.slice().reverse().map(item => ({
      time:       new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      actual:     parseFloat(item.actual_price),
      ensemble:   parseFloat(item.predicted_price),
      lr:         item.lr_prediction   != null ? parseFloat(item.lr_prediction)   : null,
      ema:        item.ema_prediction  != null ? parseFloat(item.ema_prediction)  : null,
      lstm:       item.lstm_prediction != null ? parseFloat(item.lstm_prediction) : null,
      error:      Math.abs(parseFloat(item.error || 0)),
      pctError:   item.percentage_error != null ? parseFloat(item.percentage_error) : null,
    }))
  , [data]);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows   = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="pt-container">
      <div className="pt-header">
        <div>
          <h3 className="pt-title">Recent Predictions</h3>
          <p className="pt-subtitle">Latest prediction history · {rows.length} records</p>
        </div>
        {totalPages > 1 && (
          <div className="pt-pagination">
            <button
              className="pt-page-btn"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            ><ChevronLeft /></button>
            <span className="pt-page-info mono">{page + 1} / {totalPages}</span>
            <button
              className="pt-page-btn"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
            ><ChevronRight /></button>
          </div>
        )}
      </div>

      <div className="pt-scroll">
        <table className="pt-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actual</th>
              <th>Ensemble</th>
              <th style={{ color: '#3B82F6' }}>Linear Reg</th>
              <th style={{ color: '#22C55E' }}>EMA</th>
              <th style={{ color: '#8B5CF6' }}>LSTM</th>
              <th>Error</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => {
              const status = getStatus(row.pctError);
              return (
                <tr key={i} className="pt-row" style={{ animationDelay: `${i * 0.03}s` }}>
                  <td className="pt-time mono">{row.time}</td>
                  <td className="mono" style={{ color: '#06B6D4' }}>${fmt(row.actual)}</td>
                  <td className="mono" style={{ color: '#EC4899' }}>${fmt(row.ensemble)}</td>
                  <td className="mono" style={{ color: '#3B82F6' }}>{row.lr != null ? `$${fmt(row.lr)}` : '—'}</td>
                  <td className="mono" style={{ color: '#22C55E' }}>{row.ema != null ? `$${fmt(row.ema)}` : '—'}</td>
                  <td className="mono" style={{ color: '#8B5CF6' }}>{row.lstm != null ? `$${fmt(row.lstm)}` : '—'}</td>
                  <td className="mono pt-error">${fmt(row.error)}</td>
                  <td><span className={`pt-status ${status.cls}`}>{status.label}</span></td>
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={8} className="pt-empty">No prediction data available yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PredictionsTable;
