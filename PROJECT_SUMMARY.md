# Crypto Forecasting System - Project Summary

## Overview

**100% Free & Open-Source** real-time cryptocurrency forecasting system using PySpark Structured Streaming. No cloud costs, runs entirely on your local machine.

## Key Features

✅ **Zero Cost** - No AWS, no cloud fees, completely free
✅ **Real-time Data** - Fetches BTC prices every 5 minutes from CoinMarketCap
✅ **Stream Processing** - Apache Kafka + PySpark Structured Streaming
✅ **ML Forecasting** - Linear Regression with feature engineering
✅ **Live Metrics** - RMSE, MAPE, MAE calculated in real-time
✅ **REST API** - FastAPI backend
✅ **Interactive Dashboard** - React frontend with Recharts
✅ **One-Command Deploy** - Docker Compose handles everything
✅ **Production Ready** - Fault tolerant, scalable, secure

## Technology Stack

### Free & Open-Source Components

- **Ingestion**: Python + APScheduler (MIT)
- **Streaming**: Apache Kafka (Apache 2.0)
- **Database**: PostgreSQL (PostgreSQL License)
- **Processing**: Apache Spark (Apache 2.0)
- **ML**: Spark MLlib (Apache 2.0)
- **Backend**: FastAPI (MIT)
- **Frontend**: React + Recharts (MIT)
- **Orchestration**: Docker Compose (Apache 2.0)

## Project Structure

```
crypto-forecasting-system/
├── ingestion/
│   ├── price_fetcher.py       # Scheduled price fetcher (APScheduler)
│   └── requirements.txt
├── streaming/
│   └── spark_streaming_job.py # PySpark + Kafka streaming
├── model/
│   ├── feature_engineering.py # Feature creation
│   ├── train_model.py         # Model training
│   └── predict.py             # Prediction & metrics
├── backend/
│   └── app.py                 # FastAPI + PostgreSQL
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   └── components/
│   └── package.json
├── init.sql                   # PostgreSQL schema
├── docker-compose.yml         # All services orchestration
├── Dockerfile                 # Backend container
├── Dockerfile.ingestion       # Ingestion container
└── requirements.txt           # Python dependencies
```

**Total: 20+ files** across 6 layers

## Quick Start

```bash
cd crypto-forecasting-system
docker-compose up -d
```

Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Architecture

```
CoinMarketCap API (Free Tier)
         ↓
Python Scheduler (APScheduler)
         ↓
Apache Kafka (Message Queue)
         ↓
PySpark Streaming (ML Processing)
         ↓
PostgreSQL (Storage)
         ↓
FastAPI (REST API) ← React (Dashboard)
```

## What Makes This Special?

### 1. **Zero Cloud Costs**
- No AWS, Azure, or GCP required
- Runs on your laptop/desktop
- **Saves $360-600/year** vs cloud deployment

### 2. **Production-Ready**
- Fault-tolerant (Kafka persistence, Spark checkpointing)
- Scalable (add Kafka partitions, Spark workers)
- Monitored (Docker logs, PostgreSQL metrics)
- Secure (isolated Docker network, no external dependencies)

### 3. **Easy to Deploy**
- One command: `docker-compose up -d`
- No configuration needed
- Works on Windows, Mac, Linux

### 4. **Real Machine Learning**
- Feature engineering (lag, moving avg, volatility)
- Spark MLlib Linear Regression
- Real-time predictions
- Accuracy metrics (RMSE, MAPE, MAE)

## API Endpoints

### GET /prices?limit=100
Returns time-series data with actual vs predicted prices

### GET /metrics
Returns aggregated error metrics (RMSE, MAPE, MAE)

### GET /health
Health check endpoint

## Cost Breakdown

| Component | Monthly Cost |
|-----------|--------------|
| Apache Kafka | $0 |
| PostgreSQL | $0 |
| PySpark | $0 |
| FastAPI | $0 |
| React | $0 |
| Docker | $0 |
| CoinMarketCap API | $0 (free tier) |
| **Total** | **$0** 🎉 |

## Requirements

- Docker Desktop
- 4GB RAM
- 10GB disk space
- Internet connection

## Features

### Data Ingestion
- Polls CoinMarketCap API every 5 minutes
- Free tier: 10,000 credits/month
- Usage: 8,640 calls/month (well under limit)
- Retry logic with exponential backoff
- Publishes to Kafka

### Stream Processing
- Reads from Kafka in real-time
- Feature engineering (lag-1, lag-2, moving avg, volatility)
- ML prediction using trained model
- Metrics calculation
- Writes to PostgreSQL

### Storage
- PostgreSQL database
- Table: predictions (timestamp, actual_price, predicted_price, error)
- Indexed for fast queries
- Persistent Docker volume

### Backend API
- FastAPI framework
- PostgreSQL integration
- CORS enabled
- Auto-generated docs

### Frontend Dashboard
- React 18
- Recharts for visualization
- Auto-refresh every 5 minutes
- Responsive design

## Monitoring

```bash
# View all logs
docker-compose logs -f

# Check service status
docker-compose ps

# Query database
docker-compose exec postgres psql -U crypto_user -d crypto_predictions
```

## Scaling

### Horizontal
- Add Kafka partitions
- Run multiple Spark workers
- PostgreSQL read replicas

### Vertical
- Increase Docker container resources
- More memory for Spark
- Faster disk for PostgreSQL

## Security

- ✅ No cloud credentials needed
- ✅ Isolated Docker network
- ✅ Password-protected database
- ✅ CORS configured
- ✅ No sensitive data exposure

## Documentation

1. **README.md** - Complete guide
2. **QUICKSTART.md** - 5-minute setup
3. **ARCHITECTURE.md** - System design
4. **PROJECT_SUMMARY.md** - This file

## Comparison: Free vs Cloud

| Feature | Free Stack | AWS Stack |
|---------|-----------|-----------|
| **Cost** | $0/month | $30-50/month |
| **Setup** | 1 command | Multiple steps |
| **Maintenance** | Docker restart | Manage 9+ services |
| **Scalability** | Local limits | Cloud scale |
| **Control** | Full | Vendor lock-in |
| **Learning** | All tech visible | Abstracted services |

## Use Cases

✅ **Learning** - Understand streaming, ML, microservices
✅ **Development** - Test before cloud deployment
✅ **Personal Projects** - No ongoing costs
✅ **Prototyping** - Rapid iteration
✅ **Portfolio** - Showcase skills
✅ **Small Scale** - Low-volume production use

## Limitations

- Runs on single machine (not distributed)
- Limited by local resources
- No built-in high availability
- Manual backups needed

**Solution**: Can migrate to cloud later if needed!

## Future Enhancements

- [ ] LSTM model for better predictions
- [ ] Multi-cryptocurrency support
- [ ] Prometheus + Grafana monitoring
- [ ] Redis caching
- [ ] TimescaleDB for time-series
- [ ] Kubernetes deployment option

## Success Metrics

After 24 hours of running:
- ✅ 288 price data points collected
- ✅ Predictions generated
- ✅ Metrics calculated (RMSE, MAPE, MAE)
- ✅ Dashboard showing charts
- ✅ Zero errors in logs

## Getting Help

```bash
# Check logs
docker-compose logs -f

# Test API
curl http://localhost:8000/health

# Query database
docker-compose exec postgres psql -U crypto_user -d crypto_predictions -c "SELECT COUNT(*) FROM predictions;"
```

## License

MIT - Free for personal and commercial use

## Credits

Built with 100% free and open-source technologies. No proprietary software, no vendor lock-in, no hidden costs.

---

**Ready to start?** Run `docker-compose up -d` and you're live in 2 minutes!

**Total Cost**: $0/month forever 🎉
