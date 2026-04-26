# File Index & Navigation Guide

Complete reference for all files in the crypto forecasting system.

## 📚 Documentation Files

| File | Purpose | When to Use |
|------|---------|-------------|
| **README.md** | Complete project documentation | First read, comprehensive guide |
| **QUICKSTART.md** | 15-minute setup guide | Fast deployment |
| **ARCHITECTURE.md** | System architecture details | Understanding design |
| **PROJECT_SUMMARY.md** | High-level overview | Quick reference |
| **DEPLOYMENT_CHECKLIST.md** | Step-by-step deployment | Production deployment |
| **FILE_INDEX.md** | This file | Finding specific files |

## 🔧 Configuration Files

| File | Purpose | Action Required |
|------|---------|-----------------|
| **.env.template** | Environment variables template | Copy to .env and fill in |
| **requirements.txt** | Python dependencies | `pip install -r requirements.txt` |
| **docker-compose.yml** | Local development setup | `docker-compose up` |
| **Dockerfile** | Backend container definition | `docker build -t crypto-backend .` |
| **Makefile** | Common commands | `make help` |
| **.gitignore** | Git ignore rules | Auto-used by Git |

## 📥 Ingestion Layer

### ingestion/
| File | Purpose | Lines | Key Functions |
|------|---------|-------|---------------|
| **lambda_coinmarketcap.py** | Lambda function for API polling | ~80 | `lambda_handler()`, `get_session_with_retry()` |
| **requirements.txt** | Lambda dependencies | ~3 | - |

**Key Features:**
- CoinMarketCap API integration
- Retry logic with exponential backoff
- Kinesis data stream publishing
- Error handling

**Environment Variables:**
- `CMC_API_KEY` - CoinMarketCap API key
- `KINESIS_STREAM_NAME` - Target Kinesis stream
- `AWS_REGION` - AWS region

## 🌊 Streaming Layer

### streaming/
| File | Purpose | Lines | Key Functions |
|------|---------|-------|---------------|
| **spark_streaming_job.py** | PySpark streaming job | ~100 | `main()`, `write_to_dynamodb()` |

**Key Features:**
- Kinesis stream reading
- Real-time feature engineering
- ML prediction
- DynamoDB writing
- Checkpointing

**Environment Variables:**
- `KINESIS_STREAM_NAME` - Source stream
- `MODEL_PATH` - S3 path to trained model
- `DYNAMODB_TABLE` - Target table
- `CHECKPOINT_LOCATION` - S3 checkpoint path

## 🤖 Model Layer

### model/
| File | Purpose | Lines | Key Functions |
|------|---------|-------|---------------|
| **feature_engineering.py** | Feature creation | ~30 | `add_features()`, `prepare_features()` |
| **train_model.py** | Model training | ~40 | `train_model()` |
| **predict.py** | Prediction & metrics | ~40 | `predict()`, `calculate_metrics()` |

**Features Created:**
- `lag_1` - Previous price
- `lag_2` - Price 2 steps ago
- `moving_avg_5` - 5-period moving average
- `rolling_volatility` - Rolling standard deviation

**Metrics Calculated:**
- RMSE - Root Mean Squared Error
- MAPE - Mean Absolute Percentage Error
- MAE - Mean Absolute Error

## 🔌 Backend Layer

### backend/
| File | Purpose | Lines | Key Endpoints |
|------|---------|-------|---------------|
| **app.py** | FastAPI application | ~100 | `/prices`, `/metrics`, `/health` |

**Endpoints:**

1. **GET /prices?limit=100**
   - Returns: Actual vs predicted prices
   - Response: JSON with timestamp, prices, error

2. **GET /metrics**
   - Returns: Aggregated error metrics
   - Response: RMSE, MAPE, MAE, count

3. **GET /health**
   - Returns: Health status
   - Response: {"status": "healthy"}

4. **GET /** 
   - Returns: API info
   - Response: Welcome message

**Dependencies:**
- FastAPI - Web framework
- boto3 - AWS SDK
- uvicorn - ASGI server

## 🎨 Frontend Layer

### frontend/

#### Configuration
| File | Purpose |
|------|---------|
| **package.json** | NPM dependencies and scripts |
| **.env.example** | Environment variables template |

#### Public Assets
| File | Purpose |
|------|---------|
| **public/index.html** | HTML template |

#### Source Code
| File | Purpose | Lines | Key Components |
|------|---------|-------|----------------|
| **src/index.js** | Entry point | ~10 | Root render |
| **src/App.js** | Main component | ~50 | Data fetching, layout |
| **src/App.css** | Main styles | ~80 | Layout, colors |
| **src/index.css** | Global styles | ~15 | Reset, fonts |

#### Components
| File | Purpose | Lines | Props |
|------|---------|-------|-------|
| **components/PriceChart.js** | Line chart | ~30 | `data` |
| **components/MetricsCard.js** | Metrics display | ~40 | `metrics` |

**Key Features:**
- Real-time chart updates
- Auto-refresh every 5 minutes
- Responsive design
- Error handling

**Dependencies:**
- React 18
- Recharts (charting)
- Axios (HTTP client)

## 🏗️ Infrastructure Layer

### infrastructure/
| File | Purpose | Lines | Resources Created |
|------|---------|-------|-------------------|
| **main.tf** | Terraform main config | ~200 | All AWS resources |
| **variables.tf** | Terraform variables | ~20 | Input variables |
| **ecs-task-definition.json** | ECS task config | ~50 | Container definition |
| **setup_emr.sh** | EMR cluster script | ~20 | EMR cluster |

**AWS Resources Created:**
- Kinesis Data Stream (1 shard)
- DynamoDB Table (pay-per-request)
- S3 Bucket (models, checkpoints)
- Lambda Function (Python 3.11)
- EventBridge Rule (5-minute schedule)
- IAM Roles (Lambda, EMR, ECS)
- ECS Cluster
- ECR Repository

**Terraform Commands:**
```bash
terraform init      # Initialize
terraform plan      # Preview changes
terraform apply     # Deploy
terraform destroy   # Remove all
terraform output    # Show outputs
```

## 🧪 Testing & Deployment

| File | Purpose | Usage |
|------|---------|-------|
| **test_system.py** | System tests | `python test_system.py` |
| **deploy_lambda.sh** | Lambda deployment | `bash deploy_lambda.sh` |

**Test Coverage:**
- Feature engineering validation
- API endpoint testing
- Data flow verification

## 📊 File Statistics

### Total Files: 28

**By Category:**
- Documentation: 6 files
- Configuration: 6 files
- Python Code: 8 files
- JavaScript/React: 7 files
- Infrastructure: 4 files
- Shell Scripts: 2 files

**By Language:**
- Python: ~500 lines
- JavaScript: ~300 lines
- Terraform: ~250 lines
- Markdown: ~2000 lines
- JSON: ~100 lines
- Shell: ~50 lines

## 🔍 Quick Find

### "I want to..."

**...understand the system**
→ Start with PROJECT_SUMMARY.md, then README.md

**...deploy quickly**
→ Follow QUICKSTART.md

**...understand architecture**
→ Read ARCHITECTURE.md

**...deploy to production**
→ Use DEPLOYMENT_CHECKLIST.md

**...modify API endpoints**
→ Edit backend/app.py

**...change the UI**
→ Edit frontend/src/App.js and components/

**...adjust features**
→ Edit model/feature_engineering.py

**...change infrastructure**
→ Edit infrastructure/main.tf

**...modify Lambda function**
→ Edit ingestion/lambda_coinmarketcap.py

**...adjust Spark job**
→ Edit streaming/spark_streaming_job.py

**...add dependencies**
→ Update requirements.txt or package.json

**...configure environment**
→ Edit .env file

## 🎯 Common Tasks

### Add New Cryptocurrency
1. Edit `ingestion/lambda_coinmarketcap.py` - Add symbol to API call
2. Edit `streaming/spark_streaming_job.py` - Handle multiple symbols
3. Update DynamoDB schema if needed

### Change Polling Frequency
1. Edit `infrastructure/main.tf` - Update EventBridge schedule
2. Edit `frontend/src/App.js` - Update refresh interval

### Add New Features
1. Edit `model/feature_engineering.py` - Add feature calculation
2. Edit `model/train_model.py` - Include in training
3. Retrain model

### Change ML Model
1. Edit `model/train_model.py` - Replace LinearRegression
2. Update `model/predict.py` if needed
3. Retrain and redeploy

### Add New API Endpoint
1. Edit `backend/app.py` - Add new route
2. Update frontend to consume it
3. Update documentation

### Modify UI
1. Edit `frontend/src/components/` - Update components
2. Edit `frontend/src/App.css` - Update styles
3. Test locally with `npm start`

## 📞 Support

**Issues?** Check these files in order:
1. QUICKSTART.md - Common setup issues
2. README.md - Troubleshooting section
3. DEPLOYMENT_CHECKLIST.md - Deployment issues

**Need to understand?**
1. PROJECT_SUMMARY.md - High-level overview
2. ARCHITECTURE.md - Detailed design
3. Source code comments

## 🔄 Update Frequency

| File Type | Update When |
|-----------|-------------|
| Documentation | Major changes, new features |
| Configuration | Environment changes |
| Python Code | Bug fixes, features |
| Frontend | UI changes, new features |
| Infrastructure | AWS resource changes |
| Tests | New features added |

---

**Last Updated**: 2024
**Version**: 1.0.0
**Maintainer**: Senior Cloud Data Engineer
