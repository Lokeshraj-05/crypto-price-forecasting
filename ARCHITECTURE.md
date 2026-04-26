# System Architecture - Free & Open-Source Stack

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA INGESTION LAYER                         │
│                                                                       │
│  ┌──────────────┐         ┌─────────────┐        ┌──────────────┐  │
│  │CoinMarketCap │────────▶│Python Service│───────▶│    Kafka     │  │
│  │     API      │ 5 min   │(APScheduler) │        │   Topic      │  │
│  └──────────────┘         └─────────────┘        └──────────────┘  │
│                                                                       │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │
                                    │ Stream
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      STREAM PROCESSING LAYER                         │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              PySpark Structured Streaming                     │  │
│  │  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │Feature Eng     │─▶│ML Prediction │─▶│Metrics Calc     │  │  │
│  │  │- Lag features  │  │- Linear Reg  │  │- RMSE, MAPE     │  │  │
│  │  │- Moving avg    │  │              │  │- Absolute error │  │  │
│  │  │- Volatility    │  │              │  │                 │  │  │
│  │  └────────────────┘  └──────────────┘  └─────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │
                                    │ Write
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          STORAGE LAYER                               │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                        PostgreSQL                             │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ Table: predictions                                     │  │  │
│  │  │ PK: timestamp                                          │  │  │
│  │  │ Columns: actual_price, predicted_price, error          │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Local Filesystem                           │  │
│  │  - ML Models (./models/)                                     │  │
│  │  - Checkpoints (./checkpoints/)                              │  │
│  │  - Training Data (./training-data/)                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │
                                    │ Query
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                              │
│                                                                       │
│  ┌──────────────────────┐              ┌──────────────────────┐    │
│  │   FastAPI Backend    │              │   React Frontend     │    │
│  │   (Docker)           │◀────────────▶│   (Node.js)          │    │
│  │                      │   REST API   │                      │    │
│  │  Endpoints:          │              │  Components:         │    │
│  │  - GET /prices       │              │  - PriceChart        │    │
│  │  - GET /metrics      │              │  - MetricsCard       │    │
│  │  - GET /health       │              │  - Auto-refresh      │    │
│  └──────────────────────┘              └──────────────────────┘    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Why These Technologies?

| Component | Technology | Why Free & Open-Source |
|-----------|-----------|------------------------|
| **Ingestion** | Python + APScheduler | Built-in Python, no licensing |
| **Message Queue** | Apache Kafka | Apache 2.0 license, industry standard |
| **Database** | PostgreSQL | PostgreSQL license, most popular open-source DB |
| **Stream Processing** | Apache Spark | Apache 2.0 license |
| **ML** | Spark MLlib | Included with Spark |
| **Backend** | FastAPI | MIT license |
| **Frontend** | React | MIT license |
| **Charts** | Recharts | MIT license |
| **Container** | Docker | Apache 2.0 license |

## Data Flow

1. **Ingestion (Every 5 minutes)**
   - APScheduler triggers Python function
   - Function calls CoinMarketCap API (free tier: 10,000 credits/month)
   - Fetches BTC price data
   - Publishes to Kafka topic

2. **Processing (Real-time)**
   - PySpark reads from Kafka
   - Applies feature engineering
   - Makes predictions using trained model
   - Calculates error metrics
   - Writes to PostgreSQL

3. **Serving (On-demand)**
   - FastAPI queries PostgreSQL
   - Returns JSON to frontend
   - React displays charts
   - Auto-refreshes every 5 minutes

## Component Details

### Ingestion Service
- **Runtime**: Python 3.11
- **Scheduler**: APScheduler (cron-like)
- **Trigger**: Every 5 minutes
- **Output**: Kafka topic `crypto-prices`
- **Cost**: $0 (runs in Docker container)

### Kafka
- **Version**: Confluent Platform 7.5.0
- **Brokers**: 1 (scalable)
- **Topics**: crypto-prices
- **Retention**: 24 hours
- **Cost**: $0 (runs locally)

### PostgreSQL
- **Version**: 15 Alpine
- **Database**: crypto_predictions
- **Table**: predictions
- **Storage**: Docker volume (persistent)
- **Cost**: $0 (runs locally)

### PySpark Job
- **Platform**: Local Spark or standalone cluster
- **Packages**: spark-sql-kafka
- **Checkpoint**: Local filesystem
- **Mode**: Continuous processing
- **Cost**: $0 (runs on your machine)

### Backend (FastAPI)
- **Runtime**: Python 3.11
- **Framework**: FastAPI
- **Port**: 8000
- **Database**: PostgreSQL via psycopg2
- **Cost**: $0 (Docker container)

### Frontend (React)
- **Runtime**: Node.js 18
- **Framework**: React 18
- **Charts**: Recharts
- **Port**: 3000
- **Refresh**: 5-minute interval
- **Cost**: $0 (Docker container)

## Scalability

### Horizontal Scaling
- Add Kafka partitions for higher throughput
- Run multiple Spark workers
- Use PostgreSQL read replicas

### Vertical Scaling
- Increase Docker container resources
- Allocate more memory to Spark
- Use faster disk for PostgreSQL

## Fault Tolerance

- **Ingestion**: APScheduler automatic retries
- **Kafka**: Message persistence (24-hour retention)
- **Spark**: Checkpointing for exactly-once semantics
- **PostgreSQL**: ACID compliance, WAL logging
- **Docker**: Restart policies (unless-stopped)

## Monitoring

### Docker Logs
```bash
docker-compose logs -f [service]
```

### Kafka Monitoring
```bash
# List topics
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Consumer lag
docker-compose exec kafka kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group spark-streaming
```

### PostgreSQL Monitoring
```bash
# Connection count
docker-compose exec postgres psql -U crypto_user -d crypto_predictions -c "SELECT count(*) FROM pg_stat_activity;"

# Table size
docker-compose exec postgres psql -U crypto_user -d crypto_predictions -c "SELECT pg_size_pretty(pg_total_relation_size('predictions'));"
```

## Security

- ✅ No cloud credentials needed
- ✅ All services run in isolated Docker network
- ✅ PostgreSQL password-protected
- ✅ API key hardcoded (free tier, no sensitive data)
- ✅ CORS configured for localhost only
- ✅ No external ports exposed (except 3000, 8000)

## Cost Comparison

### This Architecture (Free)
- **Total**: $0/month
- Kafka: $0 (local)
- PostgreSQL: $0 (local)
- Compute: $0 (your machine)
- Storage: $0 (local disk)

### AWS Architecture (Previous)
- **Total**: $30-50/month
- Kinesis: $11/month
- DynamoDB: $5/month
- Lambda: Free tier
- ECS: $15/month
- S3: $1/month

**Savings: $30-50/month = $360-600/year** 💰

## Resource Requirements

### Minimum
- CPU: 2 cores
- RAM: 4GB
- Disk: 10GB
- Network: Broadband internet

### Recommended
- CPU: 4 cores
- RAM: 8GB
- Disk: 20GB SSD
- Network: Stable connection

## Docker Compose Services

```yaml
services:
  zookeeper      # Kafka coordination
  kafka          # Message streaming
  postgres       # Data storage
  ingestion      # Price fetcher
  backend        # FastAPI
  frontend       # React app
```

## Deployment Options

### Option 1: Docker Compose (Recommended)
```bash
docker-compose up -d
```
- Easiest setup
- All services managed
- Production-ready

### Option 2: Manual Installation
- Install Kafka, PostgreSQL separately
- Run Python services manually
- More control, more setup

### Option 3: Kubernetes (Advanced)
- Convert docker-compose to k8s manifests
- Use Helm charts
- Enterprise-grade scaling

## Performance

- **Latency**: < 100ms API response
- **Throughput**: 1 prediction per 5 minutes (scalable to 1000s/sec)
- **Storage**: ~1MB per 1000 predictions
- **Memory**: ~2GB total for all services

## Future Enhancements

- [ ] Prometheus + Grafana monitoring
- [ ] Redis caching layer
- [ ] TimescaleDB for time-series optimization
- [ ] Apache Airflow for workflow orchestration
- [ ] MinIO for S3-compatible object storage
- [ ] Traefik for reverse proxy

---

**100% Free & Open-Source** - No vendor lock-in, no cloud costs, full control.
