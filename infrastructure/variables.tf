variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "cmc_api_key" {
  description = "CoinMarketCap API Key"
  type        = string
  sensitive   = true
}
