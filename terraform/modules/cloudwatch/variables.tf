# CloudWatch Module Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "alert_emails" {
  description = "List of email addresses for alerts"
  type        = list(string)
  default     = []
}

variable "alert_phone_numbers" {
  description = "List of phone numbers for SMS alerts"
  type        = list(string)
  default     = []
}

variable "alb_name_suffix" {
  description = "Load balancer name suffix for metrics"
  type        = string
  default     = ""
}

variable "ecs_service_name" {
  description = "ECS service name for metrics"
  type        = string
  default     = ""
}

variable "ecs_cluster_name" {
  description = "ECS cluster name for metrics"
  type        = string
  default     = ""
}

variable "rds_instance_id" {
  description = "RDS instance ID for metrics"
  type        = string
  default     = ""
}

variable "redis_cluster_id" {
  description = "Redis cluster ID for metrics"
  type        = string
  default     = ""
}

variable "static_assets_bucket_name" {
  description = "S3 bucket name for static assets metrics"
  type        = string
  default     = ""
}

variable "route53_health_check_id" {
  description = "Route53 health check ID for metrics"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
} 