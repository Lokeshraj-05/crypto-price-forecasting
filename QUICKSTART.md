# Quick Start Guide - 2 Minutes

Get the crypto forecasting system running in 2 minutes with **zero configuration**.

## Prerequisites

- ✅ Python 3.8+ installed
- ✅ Node.js 18+ installed (for frontend)

That's it! No Docker, no databases to install.

## Step 1: Install Python Dependencies (30 seconds)

```bash
cd crypto-forecasting-system
pip install -r requirements.txt
```

## Step 2: Start Services (30 seconds)

Open 3 terminal windows:

**Terminal 1 - Ingestion Service:**
```bash
python ingestion/price_fetcher.py
```

**Terminal 2 - Backend API:**
```bash
python -m uvicorn backend.app:app --reload
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm install
npm start
```

## Step 3: Access Application (10 seconds)

Open your browser:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## What's Happening?

1. ✅ Ingestion service fetches BTC price every 5 minutes
2. ✅ Data stored in `crypto_data.db` (SQLite)
3. ✅ Backend generates predictions using moving average
4. ✅ Frontend displays interactive charts

## Wait for Data

The system needs **10-15 minutes** to collect initial data:
- First fetch happens immediately
- Then every 5 minutes
- After 3-4 fetches, you'll see predictions

## Check It's Working

### View Database
```bash
sqlite3 crypto_data.db "SELECT COUNT(*) FROM raw_prices;"
```

### Test API
```bash
curl http://localhost:8000/health
curl http://localhost:8000/prices?limit=5
curl http://localhost:8000/metrics
```

### Check Logs
Look at Terminal 1 output:
```
Stored in SQLite: BTC price $43250.50
```

## Troubleshooting

### No data appearing?
Wait 10-15 minutes. Check Terminal 1 for errors.

### Backend won't start?
```bash
pip install fastapi uvicorn numpy
```

### Frontend won't start?
```bash
cd frontend
rm -rf node_modules
npm install
```

## Stop the System

Press `Ctrl+C` in each terminal window.

## Database Location

All data is stored in: `crypto_data.db`

To reset everything:
```bash
rm crypto_data.db
```

## Cost

**$0/month** - Everything runs locally for free! 🎉

## Next Steps

1. ✅ Let it run for 1 hour to collect data
2. ✅ Open http://localhost:3000 to see charts
3. ✅ Check metrics at http://localhost:8000/metrics
4. ✅ Customize predictions in `backend/app.py`

---

**That's it!** No Docker, no complex setup. Just Python + SQLite.
