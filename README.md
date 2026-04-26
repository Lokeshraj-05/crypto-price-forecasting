# Crypto Forecasting System

**Ultra-Simple & 100% Free** - Real-time cryptocurrency forecasting using SQLite. No complex setup, just Python!

## Architecture

```
┌─────────────────┐
│ CoinMarketCap   │
│     API         │
└────────┬────────┘
         │ (5 min)
         ▼
┌─────────────────┐      ┌──────────────┐
│  Python Service │─────▶│    SQLite    │
│  (APScheduler)  │      │   Database   │
└─────────────────┘      └──────┬───────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
            ┌──────────────┐      ┌─────────────────┐
            │   FastAPI    │      │  React Frontend │
            │   Backend    │◀─────│   (Recharts)    │
            └──────────────┘      └─────────────────┘
```

## Features

- ✅ **Zero Setup** - Just Python, no Docker, no databases to install
- ✅ **SQLite** - Single file database, no configuration needed
- ✅ **Real-time Data** - Fetches BTC prices every 5 minutes
- ✅ **Simple ML** - Moving average predictions
- ✅ **REST API** - FastAPI backend
- ✅ **Interactive UI** - React dashboard
- ✅ **100% Free** - No cloud costs

## Prerequisites

- Python 3.8+
- Node.js 18+ (for frontend)

## Quick Start (2 Minutes)

### 1. Install Dependencies

```bash
cd crypto-forecasting-system
pip install -r requirements.txt
```

### 2. Start Backend

```bash
# Terminal 1: Start ingestion service
python ingestion/price_fetcher.py

# Terminal 2: Start API server
python -m uvicorn backend.app:app --reload
```

### 3. Start Frontend

```bash
# Terminal 3
cd frontend
npm install
npm start
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: `crypto_data.db` (auto-created)

## How It Works

1. **Ingestion Service** fetches BTC price every 5 minutes from CoinMarketCap
2. **Stores** raw data in SQLite database
3. **Backend API** generates predictions using moving average
4. **Frontend** displays charts with actual vs predicted prices

## Project Structure

```
crypto-forecasting-system/
├── ingestion/
│   └── price_fetcher.py          # Fetches prices every 5 min
├── backend/
│   └── app.py                    # FastAPI + SQLite + predictions
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   └── components/
│   └── package.json
├── requirements.txt
├── crypto_data.db                # SQLite database (auto-created)
└── README.md
```

## API Endpoints

### GET /prices?limit=100
Returns actual vs predicted prices

**Response:**
```json
{
  "count": 50,
  "data": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "actual_price": 43250.50,
      "predicted_price": 43180.25,
      "error": 70.25
    }
  ]
}
```

### GET /metrics
Returns aggregated error metrics

**Response:**
```json
{
  "rmse": 125.50,
  "mape": 0.35,
  "mae": 98.75,
  "count": 288
}
```

### GET /health
Health check

## Database Schema

**Table: raw_prices**
- id (PRIMARY KEY)
- timestamp
- price
- volume_24h
- market_cap
- percent_change_1h
- created_at

**Table: predictions**
- timestamp (PRIMARY KEY)
- actual_price
- predicted_price
- error
- abs_error
- percentage_error
- created_at

## View Database

```bash
# Install SQLite browser or use command line
sqlite3 crypto_data.db

# Query data
SELECT * FROM raw_prices ORDER BY id DESC LIMIT 10;
SELECT * FROM predictions ORDER BY timestamp DESC LIMIT 10;
```

## Configuration

**CoinMarketCap API Key**: Already configured
- Key: `a14d93dd-3ecc-4259-816c-68e07df609f2`
- Limit: 10,000 credits/month
- Usage: 288 calls/day = 8,640/month ✅

**Polling Interval**: Edit `ingestion/price_fetcher.py`
```python
scheduler.add_job(fetch_and_store, 'interval', minutes=5)  # Change minutes here
```

## Prediction Algorithm

Simple moving average of last 5 prices:
```python
predicted_price = mean(last_5_prices)
```

For better predictions, you can implement:
- Weighted moving average
- Exponential smoothing
- Linear regression
- LSTM neural networks

## Monitoring

```bash
# Check how many prices collected
sqlite3 crypto_data.db "SELECT COUNT(*) FROM raw_prices;"

# View latest prices
sqlite3 crypto_data.db "SELECT * FROM raw_prices ORDER BY id DESC LIMIT 5;"

# Check predictions
sqlite3 crypto_data.db "SELECT * FROM predictions ORDER BY timestamp DESC LIMIT 5;"
```

## Troubleshooting

### No data appearing?

Wait 5-10 minutes for initial data collection. Check ingestion service logs.

### Backend error?

Make sure SQLite database is created:
```bash
python -c "import sqlite3; sqlite3.connect('crypto_data.db')"
```

### Frontend not loading?

Check backend is running:
```bash
curl http://localhost:8000/health
```

## Stopping the System

Just press `Ctrl+C` in each terminal window.

## Cost

**Total Cost: $0/month** 🎉

- Python: Free
- SQLite: Free
- CoinMarketCap API: Free tier
- No cloud services
- No Docker needed

## Advantages of SQLite

✅ **Zero Configuration** - No database server to install
✅ **Single File** - Easy to backup, move, or delete
✅ **Fast** - Perfect for small to medium datasets
✅ **Reliable** - ACID compliant, battle-tested
✅ **Portable** - Works on Windows, Mac, Linux
✅ **No Network** - No connection issues

## Scaling

For production with high volume:
- Migrate to PostgreSQL
- Add Redis caching
- Use Apache Kafka for streaming
- Deploy with Docker

But for learning and small-scale use, **SQLite is perfect**!

## Future Enhancements

- [ ] Better ML models (Linear Regression, LSTM)
- [ ] Multi-cryptocurrency support
- [ ] Email/SMS alerts
- [ ] Export to CSV
- [ ] Historical data analysis
- [ ] Backtesting framework

## License

MIT - Free for personal and commercial use

## Support

- Check database: `sqlite3 crypto_data.db`
- Test API: `curl http://localhost:8000/health`
- View logs: Check terminal output

---

**Simple, Fast, Free** - No Docker, No Kafka, No PostgreSQL. Just Python + SQLite! 🚀
