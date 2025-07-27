variable "environment" {
  description = "Environment name (e.g., production, staging, development)"
  type        = string
  default     = "production"
}

variable "storage_class" {
  description = "Storage class for persistent volumes"
  type        = string
  default     = "gp2"
}

variable "prometheus_storage_size" {
  description = "Storage size for Prometheus"
  type        = string
  default     = "50Gi"
}

variable "prometheus_retention" {
  description = "Data retention period for Prometheus"
  type        = string
  default     = "15d"
}

variable "jaeger_storage_type" {
  description = "Storage type for Jaeger (memory, badger, elasticsearch, cassandra)"
  type        = string
  default     = "memory"
}

variable "jaeger_storage_size" {
  description = "Storage size for Jaeger when using persistent storage"
  type        = string
  default     = "20Gi"
}

variable "enable_istio" {
  description = "Enable Istio integration"
  type        = bool
  default     = false
}

variable "enable_thanos" {
  description = "Enable Thanos for long-term metrics storage"
  type        = bool
  default     = false
}

variable "thanos_bucket_name" {
  description = "S3 bucket name for Thanos"
  type        = string
  default     = ""
}

variable "thanos_region" {
  description = "AWS region for Thanos bucket"
  type        = string
  default     = ""
}

variable "enable_loki" {
  description = "Enable Loki for logs"
  type        = bool
  default     = false
}

variable "enable_tempo" {
  description = "Enable Grafana Tempo for traces"
  type        = bool
  default     = false
}

variable "enable_alertmanager" {
  description = "Enable AlertManager for alerts"
  type        = bool
  default     = true
}

variable "alertmanager_slack_webhook" {
  description = "Slack webhook URL for AlertManager"
  type        = string
  default     = ""
  sensitive   = true
}

variable "alertmanager_email" {
  description = "Email for AlertManager notifications"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Base domain name for ingresses"
  type        = string
  default     = ""
}

variable "enable_oauth2_proxy" {
  description = "Enable OAuth2 proxy for authentication"
  type        = bool
  default     = false
}

variable "oauth2_proxy_client_id" {
  description = "OAuth2 client ID"
  type        = string
  default     = ""
  sensitive   = true
}

variable "oauth2_proxy_client_secret" {
  description = "OAuth2 client secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "oauth2_proxy_cookie_secret" {
  description = "OAuth2 proxy cookie secret"
  type        = string
  default     = ""
  sensitive   = true
}

# Distributed Tracing Variables
variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "gamedin-cluster"
}

variable "app_name" {
  description = "Name of the application"
  type        = string
  default     = "gamedin"
}

variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
  default     = "us-west-2"
}

variable "aws_access_key_id" {
  description = "AWS access key ID for X-Ray daemon"
  type        = string
  default     = ""
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS secret access key for X-Ray daemon"
  type        = string
  default     = ""
  sensitive   = true
}

variable "aws_session_token" {
  description = "AWS session token for X-Ray daemon"
  type        = string
  default     = ""
  sensitive   = true
}

variable "elasticsearch_password" {
  description = "Password for Elasticsearch used by Jaeger"
  type        = string
  default     = ""
  sensitive   = true
}

variable "jaeger_ingress_enabled" {
  description = "Enable ingress for Jaeger UI"
  type        = bool
  default     = true
}

variable "jaeger_ingress_host" {
  description = "Hostname for Jaeger UI ingress"
  type        = string
  default     = "jaeger.example.com"
}

variable "jaeger_ingress_class" {
  description = "Ingress class for Jaeger UI"
  type        = string
  default     = "nginx"
}

variable "jaeger_storage_class" {
  description = "Storage class for Jaeger persistent volumes"
  type        = string
  default     = "gp2"
}

variable "jaeger_storage_size" {
  description = "Storage size for Jaeger persistent volumes"
  type        = string
  default     = "20Gi"
}

variable "opentelemetry_collector_replicas" {
  description = "Number of OpenTelemetry Collector replicas"
  type        = number
  default     = 2
}

variable "xray_daemon_image" {
  description = "Docker image for AWS X-Ray daemon"
  type        = string
  default     = "amazon/aws-xray-daemon:3.4.0"
}

variable "opentelemetry_collector_image" {
  description = "Docker image for OpenTelemetry Collector"
  type        = string
  default     = "otel/opentelemetry-collector:0.61.0"
}

variable "enable_xray_tracing" {
  description = "Enable AWS X-Ray distributed tracing"
  type        = bool
  default     = true
}

variable "enable_jaeger_tracing" {
  description = "Enable Jaeger distributed tracing"
  type        = bool
  default     = true
}
