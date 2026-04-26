#!/bin/bash

# Lambda Deployment Script

echo "Creating Lambda deployment package..."

cd ingestion

# Create package directory
rm -rf package
mkdir package

# Install dependencies
pip install requests boto3 urllib3 -t package/

# Copy Lambda function
cp lambda_coinmarketcap.py package/

# Create zip file
cd package
zip -r ../lambda_deployment.zip .
cd ..

echo "Deployment package created: lambda_deployment.zip"

# Upload to Lambda (optional)
read -p "Upload to Lambda? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    read -p "Enter Lambda function name: " FUNCTION_NAME
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://lambda_deployment.zip
    echo "Lambda function updated!"
fi
