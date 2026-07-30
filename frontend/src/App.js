import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PriceChart from './components/PriceChart';
import MetricsCard from './components/MetricsCard';
import ErrorTrend from './components/ErrorTrend';
import PredictionsTable from './components/PredictionsTable';
import './App.css';


function App() {
  const [prices, setPrices] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const fetchData = useCallback (async (manual = false) => {
  if (manual) setRefreshing(true);

  try {
    const [pricesRes, metricsRes] = await Promise.all([
      axios.get(`${API}/prices?limit=100`),
      axios.get(`${API}/metrics`)
    ]);

    setPrices(pricesRes.data.data);
    setMetrics(metricsRes.data);
    setLoading(false);
    setLastUpdate(new Date());
    setIsOnline(true);
  } catch (error) {
    console.error("Error fetching data:", error);
    setIsOnline(false);
    setLoading(false);
  } finally {
    setRefreshing(false);
  }
},[API]);

  useEffect(() => {
  fetchData();
  const interval = setInterval(() => fetchData(), 300000);

  return () => clearInterval(interval);
}, [fetchData]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <div className="loading-text">Initializing Analytics Engine</div>
        <div className="loading-subtext">Connecting to data pipeline…</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">₿</div>
            <div className="title-group">
              <h1>Crypto Forecaster</h1>
              <p className="subtitle">AI-Powered Prediction System · BTC/USD</p>
            </div>
          </div>
          <div className="status-section">
            <div className="status-top-row">
              <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                <span className="status-dot"></span>
                <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </div>
              <button
                className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
                onClick={() => fetchData(true)}
                disabled={refreshing}
                title="Refresh data"
              >⟳</button>
            </div>
            {lastUpdate && (
              <div className="last-update">
                Updated {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container">
        <MetricsCard metrics={metrics} />
        {prices.length > 0 && (
          <ErrorTrend data={prices} metrics={metrics} />
        )}
        <PriceChart data={prices} />
        {prices.length > 0 && (
          <PredictionsTable data={prices} />
        )}
      </div>

      <footer className="footer">
        <div className="footer-content">
          <span>Powered by Machine Learning</span>
          <span className="separator">|</span>
          <span>Real-time Analysis</span>
          <span className="separator">|</span>
          <span>© 2024 Crypto Forecaster</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
