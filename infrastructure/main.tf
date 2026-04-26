terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Kinesis Data Stream
resource "aws_kinesis_stream" "crypto_stream" {
  name             = "crypto-price-stream"
  shard_count      = 1
  retention_period = 24

  tags = {
    Environment = var.environment
    Project     = "crypto-forecasting"
  }
}

# DynamoDB Table
resource "aws_dynamodb_table" "predictions" {
  name           = "crypto-predictions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "timestamp"

  attribute {
    name = "timestamp"
    type = "S"
  }

  tags = {
    Environment = var.environment
    Project     = "crypto-forecasting"
  }
}

# S3 Bucket for model and checkpoints
resource "aws_s3_bucket" "crypto_bucket" {
  bucket = "crypto-forecasting-${var.environment}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Environment = var.environment
    Project     = "crypto-forecasting"
  }
}

resource "aws_s3_bucket_versioning" "crypto_bucket_versioning" {
  bucket = aws_s3_bucket.crypto_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "crypto-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

resource "aws_iam_role_policy" "lambda_kinesis" {
  name = "lambda-kinesis-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "kinesis:PutRecord",
        "kinesis:PutRecords"
      ]
      Resource = aws_kinesis_stream.crypto_stream.arn
    }]
  })
}

# Lambda Function
resource "aws_lambda_function" "coinmarketcap_ingestion" {
  filename      = "lambda_deployment.zip"
  function_name = "crypto-coinmarketcap-ingestion"
  role          = aws_iam_role.lambda_role.arn
  handler       = "lambda_coinmarketcap.lambda_handler"
  runtime       = "python3.11"
  timeout       = 30

  environment {
    variables = {
      KINESIS_STREAM_NAME = aws_kinesis_stream.crypto_stream.name
      AWS_REGION          = var.aws_region
      CMC_API_KEY         = var.cmc_api_key
    }
  }

  tags = {
    Environment = var.environment
  }
}

# EventBridge Rule for 5-minute schedule
resource "aws_cloudwatch_event_rule" "every_5_minutes" {
  name                = "crypto-ingestion-schedule"
  description         = "Trigger Lambda every 5 minutes"
  schedule_expression = "rate(5 minutes)"
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.every_5_minutes.name
  target_id = "CryptoIngestionLambda"
  arn       = aws_lambda_function.coinmarketcap_ingestion.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.coinmarketcap_ingestion.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.every_5_minutes.arn
}

# IAM Role for EMR/Spark
resource "aws_iam_role" "emr_role" {
  name = "crypto-emr-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "elasticmapreduce.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "emr_service_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonElasticMapReduceRole"
  role       = aws_iam_role.emr_role.name
}

# ECS Cluster for Backend
resource "aws_ecs_cluster" "backend_cluster" {
  name = "crypto-backend-cluster"

  tags = {
    Environment = var.environment
  }
}

# ECR Repository
resource "aws_ecr_repository" "backend" {
  name                 = "crypto-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

data "aws_caller_identity" "current" {}

output "kinesis_stream_name" {
  value = aws_kinesis_stream.crypto_stream.name
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.predictions.name
}

output "s3_bucket_name" {
  value = aws_s3_bucket.crypto_bucket.id
}

output "ecr_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}
