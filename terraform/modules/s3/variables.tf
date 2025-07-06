# S3 Module Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "static_assets_bucket_name" {
  description = "Name of the S3 bucket for static assets"
  type        = string
}

variable "logs_bucket_name" {
  description = "Name of the S3 bucket for logs"
  type        = string
}

variable "backups_bucket_name" {
  description = "Name of the S3 bucket for backups"
  type        = string
}

variable "ai_models_bucket_name" {
  description = "Name of the S3 bucket for AI models"
  type        = string
}

variable "game_assets_bucket_name" {
  description = "Name of the S3 bucket for game assets"
  type        = string
}

variable "enable_cloudwatch_alarms" {
  description = "Enable CloudWatch alarms for S3 buckets"
  type        = bool
  default     = true
}

variable "alarm_actions" {
  description = "List of ARNs for alarm actions (SNS topics, etc.)"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
} 