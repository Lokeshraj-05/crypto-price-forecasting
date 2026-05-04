import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PriceChart from './components/PriceChart';
import MetricsCard from './components/MetricsCard';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [prices, setPrices] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const [pricesRes, metricsRes] = await Promise.all([
        axios.get(`${API_URL}/prices?limit=100`),
        axios.get(`${API_URL}/metrics`)
      ]);
      setPrices(pricesRes.data.data);
      setMetrics(metricsRes.data);
      setLoading(false);
      setLastUpdate(new Date());
      setIsOnline(true);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsOnline(false);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <div className="loading-text">INITIALIZING CRYPTO FORECASTING SYSTEM</div>
        <div className="loading-subtext">Connecting to neural network...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="cyber-grid"></div>
      <div className="neon-overlay"></div>
      
      <header className="App-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">₿</div>
            <div className="title-group">
              <h1 className="glitch" data-text="CRYPTO FORECASTER">CRYPTO FORECASTER</h1>
              <p className="subtitle">AI-POWERED PREDICTION SYSTEM</p>
            </div>
          </div>
          <div className="status-section">
            <div className="status-top-row">
              <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                <span className="status-dot"></span>
                <span className="status-text">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
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
                Last Update: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div className="container">
        <MetricsCard metrics={metrics} />
        <PriceChart data={prices} />
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
