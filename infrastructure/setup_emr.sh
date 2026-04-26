#!/bin/bash

# EMR Cluster Setup for Spark Streaming

CLUSTER_NAME="crypto-forecasting-cluster"
REGION="us-east-1"
KEY_NAME="your-ec2-key"
SUBNET_ID="subnet-xxxxx"

echo "Creating EMR cluster for Spark Streaming..."

aws emr create-cluster \
  --name "$CLUSTER_NAME" \
  --region $REGION \
  --release-label emr-6.10.0 \
  --applications Name=Spark Name=Hadoop \
  --ec2-attributes KeyName=$KEY_NAME,SubnetId=$SUBNET_ID \
  --instance-type m5.xlarge \
  --instance-count 3 \
  --use-default-roles \
  --log-uri s3://crypto-bucket/emr-logs/ \
  --bootstrap-actions Path=s3://crypto-bucket/bootstrap.sh \
  --steps Type=Spark,Name="Crypto Streaming Job",ActionOnFailure=CONTINUE,Args=[--deploy-mode,cluster,--master,yarn,--packages,org.apache.spark:spark-sql-kinesis_2.12:3.3.0,s3://crypto-bucket/streaming/spark_streaming_job.py] \
  --auto-terminate

echo "EMR cluster creation initiated. Check AWS Console for status."
