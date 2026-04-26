# Deployment Checklist

Use this checklist to ensure successful deployment of the crypto forecasting system.

## Pre-Deployment

### AWS Setup
- [ ] AWS Account created
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] IAM user with admin permissions
- [ ] Default region set (recommend: us-east-1)

### API Keys
- [ ] CoinMarketCap API key obtained (https://coinmarketcap.com/api/)
- [ ] API key tested and verified
- [ ] Confirmed Basic Plan (10,000 credits/month)

### Local Environment
- [ ] Python 3.11+ installed (`python --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Docker installed (`docker --version`)
- [ ] Terraform installed (`terraform --version`)
- [ ] Git installed

### Project Setup
- [ ] Repository cloned/downloaded
- [ ] `.env` file created from `.env.template`
- [ ] All environment variables filled in
- [ ] Dependencies installed (`pip install -r requirements.txt`)

## Infrastructure Deployment

### Terraform
- [ ] Navigate to `infrastructure/` directory
- [ ] Run `terraform init`
- [ ] Run `terraform plan` and review
- [ ] Run `terraform apply` and confirm
- [ ] Save outputs to file
- [ ] Verify resources in AWS Console:
  - [ ] Kinesis stream created
  - [ ] DynamoDB table created
  - [ ] S3 bucket created
  - [ ] Lambda function created
  - [ ] EventBridge rule created
  - [ ] ECR repository created
  - [ ] ECS cluster created

### Lambda Function
- [ ] Navigate to `ingestion/` directory
- [ ] Create deployment package
- [ ] Upload to Lambda
- [ ] Test Lambda function manually
- [ ] Verify EventBridge trigger is active
- [ ] Check CloudWatch logs for successful execution

### Kinesis Stream
- [ ] Verify stream is ACTIVE
- [ ] Check shard count (should be 1)
- [ ] Confirm retention period (24 hours)

### DynamoDB
- [ ] Table created with correct name
- [ ] Partition key is 'timestamp' (String)
- [ ] Billing mode is Pay-per-request
- [ ] Check table is empty initially

## Application Deployment

### Backend (Local Testing)
- [ ] Navigate to `backend/` directory
- [ ] Install dependencies
- [ ] Run `python app.py`
- [ ] Verify server starts on port 8000
- [ ] Test endpoints:
  - [ ] http://localhost:8000/health
  - [ ] http://localhost:8000/prices
  - [ ] http://localhost:8000/metrics
  - [ ] http://localhost:8000/docs

### Frontend (Local Testing)
- [ ] Navigate to `frontend/` directory
- [ ] Run `npm install`
- [ ] Create `.env.local` from `.env.example`
- [ ] Run `npm start`
- [ ] Verify app opens in browser
- [ ] Check console for errors
- [ ] Verify API connection

### Docker Compose (Alternative)
- [ ] Run `docker-compose up`
- [ ] Verify both services start
- [ ] Test frontend at http://localhost:3000
- [ ] Test backend at http://localhost:8000

## PySpark Streaming

### Local Spark (Testing)
- [ ] Install PySpark (`pip install pyspark`)
- [ ] Run test: `python test_system.py`
- [ ] Verify feature engineering works
- [ ] Check no errors in output

### EMR Deployment (Production)
- [ ] Upload code to S3
- [ ] Edit `setup_emr.sh` with your details
- [ ] Run EMR setup script
- [ ] Monitor cluster creation in AWS Console
- [ ] Verify Spark job is running
- [ ] Check CloudWatch logs

## Data Validation

### Wait for Data Collection (10-15 minutes)
- [ ] Lambda has run at least 2-3 times
- [ ] Check Kinesis stream metrics (incoming records)
- [ ] Verify DynamoDB has records
- [ ] Check record count: `aws dynamodb scan --table-name crypto-predictions --select COUNT`

### Verify Data Flow
- [ ] Lambda logs show successful API calls
- [ ] Kinesis shows incoming records
- [ ] DynamoDB contains predictions
- [ ] Backend API returns data
- [ ] Frontend displays charts

## Production Deployment

### Backend to ECS
- [ ] Build Docker image
- [ ] Push to ECR
- [ ] Create ECS task definition
- [ ] Create ECS service
- [ ] Configure load balancer (optional)
- [ ] Set up auto-scaling
- [ ] Configure health checks
- [ ] Test production endpoint

### Frontend to S3
- [ ] Run `npm run build`
- [ ] Create S3 bucket for static hosting
- [ ] Enable static website hosting
- [ ] Upload build files
- [ ] Configure CloudFront (optional)
- [ ] Set up custom domain (optional)
- [ ] Test production URL

## Monitoring Setup

### CloudWatch
- [ ] Create dashboard for key metrics
- [ ] Set up alarms:
  - [ ] Lambda errors
  - [ ] Kinesis throttling
  - [ ] DynamoDB capacity
  - [ ] ECS task health
- [ ] Configure SNS notifications
- [ ] Test alarm triggers

### Cost Monitoring
- [ ] Enable AWS Cost Explorer
- [ ] Set up billing alerts
- [ ] Create budget ($50/month recommended)
- [ ] Tag all resources appropriately

## Security Hardening

### IAM
- [ ] Review Lambda execution role
- [ ] Review ECS task role
- [ ] Remove unnecessary permissions
- [ ] Enable MFA on AWS account

### Secrets
- [ ] Move API keys to Secrets Manager
- [ ] Update Lambda to use Secrets Manager
- [ ] Rotate credentials
- [ ] Remove hardcoded secrets

### Network
- [ ] Configure VPC for ECS (optional)
- [ ] Set up security groups
- [ ] Enable VPC Flow Logs
- [ ] Configure WAF (optional)

### Encryption
- [ ] Enable S3 bucket encryption
- [ ] Enable DynamoDB encryption
- [ ] Use HTTPS for all endpoints
- [ ] Enable CloudTrail

## Testing & Validation

### Functional Tests
- [ ] API returns correct data format
- [ ] Charts display properly
- [ ] Metrics calculate correctly
- [ ] Auto-refresh works (5 minutes)
- [ ] Error handling works

### Performance Tests
- [ ] API response time < 200ms
- [ ] Frontend loads < 3 seconds
- [ ] No memory leaks
- [ ] Concurrent users supported

### Load Tests
- [ ] Test with multiple API calls
- [ ] Verify DynamoDB handles load
- [ ] Check ECS auto-scaling
- [ ] Monitor costs during load

## Documentation

- [ ] Update README with production URLs
- [ ] Document any custom configurations
- [ ] Create runbook for common issues
- [ ] Document backup/restore procedures
- [ ] Create architecture diagram

## Post-Deployment

### Day 1
- [ ] Monitor all services for 24 hours
- [ ] Check CloudWatch logs regularly
- [ ] Verify data is flowing correctly
- [ ] Test all endpoints multiple times

### Week 1
- [ ] Review cost reports
- [ ] Analyze prediction accuracy
- [ ] Collect user feedback
- [ ] Optimize as needed

### Month 1
- [ ] Review monthly costs
- [ ] Analyze system performance
- [ ] Plan improvements
- [ ] Update documentation

## Rollback Plan

If something goes wrong:

1. **Stop Lambda**: Disable EventBridge rule
2. **Stop Spark**: Terminate EMR cluster
3. **Stop Backend**: Stop ECS service
4. **Preserve Data**: Don't delete DynamoDB table
5. **Review Logs**: Check CloudWatch for errors
6. **Fix Issues**: Address problems
7. **Redeploy**: Follow checklist again

## Cleanup (When Done)

To remove all resources and stop charges:

```bash
cd infrastructure
terraform destroy
```

Manually delete:
- [ ] CloudWatch log groups
- [ ] S3 bucket contents
- [ ] ECR images
- [ ] Any custom resources

## Success Criteria

✅ Lambda runs every 5 minutes without errors
✅ Data flows from API → Kinesis → Spark → DynamoDB
✅ Backend API returns valid data
✅ Frontend displays charts correctly
✅ Predictions are being made
✅ Metrics are calculated
✅ Total cost < $50/month
✅ System runs for 7 days without intervention

---

**Status**: [ ] Not Started | [ ] In Progress | [ ] Completed

**Deployment Date**: _______________

**Deployed By**: _______________

**Production URL**: _______________

**Notes**: 
_______________________________________________
_______________________________________________
_______________________________________________
