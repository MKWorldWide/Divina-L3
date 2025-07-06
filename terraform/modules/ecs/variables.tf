# ECS Module Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "Security group ID for the ALB"
  type        = string
}

variable "app_image" {
  description = "Docker image for the application"
  type        = string
}

variable "api_image" {
  description = "Docker image for the API"
  type        = string
}

variable "app_cpu" {
  description = "CPU units for the application task"
  type        = number
  default     = 256
}

variable "app_memory" {
  description = "Memory for the application task (MiB)"
  type        = number
  default     = 512
}

variable "api_cpu" {
  description = "CPU units for the API task"
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "Memory for the API task (MiB)"
  type        = number
  default     = 1024
}

variable "app_desired_count" {
  description = "Desired number of application tasks"
  type        = number
  default     = 2
}

variable "api_desired_count" {
  description = "Desired number of API tasks"
  type        = number
  default     = 2
}

variable "app_min_count" {
  description = "Minimum number of application tasks"
  type        = number
  default     = 1
}

variable "app_max_count" {
  description = "Maximum number of application tasks"
  type        = number
  default     = 10
}

variable "api_min_count" {
  description = "Minimum number of API tasks"
  type        = number
  default     = 1
}

variable "api_max_count" {
  description = "Maximum number of API tasks"
  type        = number
  default     = 10
}

variable "s3_bucket_arns" {
  description = "Map of S3 bucket ARNs"
  type = object({
    static_assets = string
    game_assets   = string
    ai_models     = string
  })
}

variable "cloudwatch_log_group_names" {
  description = "Map of CloudWatch log group names"
  type = object({
    application   = string
    api_gateway   = string
  })
}

variable "cloudwatch_log_group_arns" {
  description = "Map of CloudWatch log group ARNs"
  type = object({
    application   = string
    api_gateway   = string
  })
}

variable "database_url_secret_arn" {
  description = "ARN of the database URL secret"
  type        = string
}

variable "redis_url_secret_arn" {
  description = "ARN of the Redis URL secret"
  type        = string
}

variable "jwt_secret_arn" {
  description = "ARN of the JWT secret"
  type        = string
}

variable "secrets_manager_arns" {
  description = "List of Secrets Manager ARNs"
  type        = list(string)
  default     = []
}

variable "ssm_parameter_arns" {
  description = "List of SSM Parameter ARNs"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
} 