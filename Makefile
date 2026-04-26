.PHONY: help install deploy-infra deploy-lambda build-backend deploy-backend start-local clean

help:
	@echo "Available commands:"
	@echo "  make install         - Install all dependencies"
	@echo "  make deploy-infra    - Deploy AWS infrastructure with Terraform"
	@echo "  make deploy-lambda   - Package and deploy Lambda function"
	@echo "  make build-backend   - Build Docker image for backend"
	@echo "  make deploy-backend  - Deploy backend to ECS"
	@echo "  make start-local     - Start local development environment"
	@echo "  make clean           - Clean build artifacts"

install:
	pip install -r requirements.txt
	cd frontend && npm install

deploy-infra:
	cd infrastructure && terraform init && terraform apply

deploy-lambda:
	bash deploy_lambda.sh

build-backend:
	docker build -t crypto-backend .

deploy-backend:
	aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(AWS_ACCOUNT_ID).dkr.ecr.us-east-1.amazonaws.com
	docker tag crypto-backend:latest $(AWS_ACCOUNT_ID).dkr.ecr.us-east-1.amazonaws.com/crypto-backend:latest
	docker push $(AWS_ACCOUNT_ID).dkr.ecr.us-east-1.amazonaws.com/crypto-backend:latest

start-local:
	docker-compose up

clean:
	rm -rf __pycache__ *.pyc
	rm -rf frontend/node_modules frontend/build
	rm -rf ingestion/package lambda_deployment.zip
	cd infrastructure && terraform destroy
