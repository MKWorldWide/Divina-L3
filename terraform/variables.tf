# GameDin L3 + AthenaMist AI AWS Deployment Variables

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"
  
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development."
  }
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "gamedin-l3.com"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for the region"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "public_subnets" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnets" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "database_subnets" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
}

variable "elasticache_subnets" {
  description = "CIDR blocks for ElastiCache subnets"
  type        = list(string)
  default     = ["10.0.31.0/24", "10.0.32.0/24", "10.0.33.0/24"]
}

# Database Configuration
variable "db_password" {
  description = "Password for RDS PostgreSQL database"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.db_password) >= 12
    error_message = "Database password must be at least 12 characters long."
  }
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS in GB"
  type        = number
  default     = 1000
}

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes for Redis"
  type        = number
  default     = 2
}

# Message Queue Configuration
variable "mq_password" {
  description = "Password for Amazon MQ RabbitMQ"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.mq_password) >= 12
    error_message = "MQ password must be at least 12 characters long."
  }
}

variable "mq_instance_type" {
  description = "Amazon MQ instance type"
  type        = string
  default     = "mq.t3.micro"
}

# EKS Configuration
variable "eks_cluster_version" {
  description = "EKS cluster version"
  type        = string
  default     = "1.28"
}

variable "eks_node_groups" {
  description = "EKS node group configurations"
  type = map(object({
    instance_types = list(string)
    capacity_type  = string
    desired_size   = number
    max_size       = number
    min_size       = number
    disk_size      = number
  }))
  default = {
    general = {
      instance_types = ["t3.large", "t3.xlarge"]
      capacity_type  = "ON_DEMAND"
      desired_size   = 3
      max_size       = 10
      min_size       = 1
      disk_size      = 50
    }
    gaming = {
      instance_types = ["c5.xlarge", "c5.2xlarge"]
      capacity_type  = "ON_DEMAND"
      desired_size   = 2
      max_size       = 8
      min_size       = 1
      disk_size      = 100
    }
    ai = {
      instance_types = ["g4dn.xlarge", "g4dn.2xlarge"]
      capacity_type  = "ON_DEMAND"
      desired_size   = 2
      max_size       = 6
      min_size       = 1
      disk_size      = 100
    }
  }
}

# Application Configuration
variable "app_replicas" {
  description = "Number of replicas for application deployments"
  type = object({
    api_gateway    = number
    gaming_engine  = number
    ai_services    = number
    frontend       = number
    bridge_relayer = number
  })
  default = {
    api_gateway    = 3
    gaming_engine  = 2
    ai_services    = 2
    frontend       = 2
    bridge_relayer = 2
  }
}

variable "app_resources" {
  description = "Resource requirements for application pods"
  type = object({
    api_gateway = object({
      requests = object({
        cpu    = string
        memory = string
      })
      limits = object({
        cpu    = string
        memory = string
      })
    })
    gaming_engine = object({
      requests = object({
        cpu    = string
        memory = string
      })
      limits = object({
        cpu    = string
        memory = string
      })
    })
    ai_services = object({
      requests = object({
        cpu    = string
        memory = string
      })
      limits = object({
        cpu    = string
        memory = string
      })
    })
    frontend = object({
      requests = object({
        cpu    = string
        memory = string
      })
      limits = object({
        cpu    = string
        memory = string
      })
    })
  })
  default = {
    api_gateway = {
      requests = {
        cpu    = "500m"
        memory = "1Gi"
      }
      limits = {
        cpu    = "2"
        memory = "4Gi"
      }
    }
    gaming_engine = {
      requests = {
        cpu    = "1"
        memory = "2Gi"
      }
      limits = {
        cpu    = "4"
        memory = "8Gi"
      }
    }
    ai_services = {
      requests = {
        cpu    = "2"
        memory = "4Gi"
      }
      limits = {
        cpu    = "8"
        memory = "16Gi"
      }
    }
    frontend = {
      requests = {
        cpu    = "250m"
        memory = "512Mi"
      }
      limits = {
        cpu    = "1"
        memory = "2Gi"
      }
    }
  }
}

# Monitoring Configuration
variable "monitoring_enabled" {
  description = "Enable monitoring stack (Prometheus, Grafana)"
  type        = bool
  default     = true
}

variable "grafana_admin_password" {
  description = "Admin password for Grafana"
  type        = string
  sensitive   = true
  default     = "GameDinL3Secure2024!"
}

variable "prometheus_retention_days" {
  description = "Number of days to retain Prometheus metrics"
  type        = number
  default     = 30
}

# Alerting Configuration
variable "alert_email_addresses" {
  description = "Email addresses for CloudWatch alerts"
  type        = list(string)
  default     = ["alerts@gamedin-l3.com"]
}

variable "sns_topic_name" {
  description = "Name for SNS topic"
  type        = string
  default     = "gamedin-l3-alerts"
}

# Backup Configuration
variable "backup_enabled" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "backup_schedule" {
  description = "Cron expression for backup schedule"
  type        = string
  default     = "0 2 * * *" # Daily at 2 AM
}

# Security Configuration
variable "enable_encryption" {
  description = "Enable encryption for all resources"
  type        = bool
  default     = true
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
}

variable "enable_cloudtrail" {
  description = "Enable CloudTrail for audit logging"
  type        = bool
  default     = true
}

# Cost Optimization
variable "enable_spot_instances" {
  description = "Enable spot instances for cost optimization"
  type        = bool
  default     = false
}

variable "enable_autoscaling" {
  description = "Enable auto-scaling for EKS node groups"
  type        = bool
  default     = true
}

variable "autoscaling_policies" {
  description = "Auto-scaling policies for EKS node groups"
  type = map(object({
    scale_up_threshold   = number
    scale_down_threshold = number
    scale_up_cooldown    = number
    scale_down_cooldown  = number
  }))
  default = {
    general = {
      scale_up_threshold   = 70
      scale_down_threshold = 30
      scale_up_cooldown    = 300
      scale_down_cooldown  = 300
    }
    gaming = {
      scale_up_threshold   = 80
      scale_down_threshold = 20
      scale_up_cooldown    = 180
      scale_down_cooldown  = 600
    }
    ai = {
      scale_up_threshold   = 75
      scale_down_threshold = 25
      scale_up_cooldown    = 300
      scale_down_cooldown  = 300
    }
  }
}

# Tags
variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "GameDin-L3"
    Environment = "production"
    ManagedBy   = "Terraform"
    Owner       = "GameDin-Team"
    CostCenter  = "Gaming"
    DataClass   = "Confidential"
  }
}

# Container Registry
variable "container_registry" {
  description = "Container registry for application images"
  type        = string
  default     = "gcr.io/gamedin-l3"
}

variable "image_tag" {
  description = "Tag for container images"
  type        = string
  default     = "latest"
}

# SSL/TLS Configuration
variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for HTTPS"
  type        = string
  default     = ""
}

variable "enable_ssl_redirect" {
  description = "Enable HTTP to HTTPS redirect"
  type        = bool
  default     = true
}

# Performance Configuration
variable "enable_cdn" {
  description = "Enable CloudFront CDN for frontend"
  type        = bool
  default     = true
}

variable "cdn_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
  
  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.cdn_price_class)
    error_message = "CDN price class must be one of: PriceClass_100, PriceClass_200, PriceClass_All."
  }
}

# Logging Configuration
variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
}

variable "enable_structured_logging" {
  description = "Enable structured logging (JSON format)"
  type        = bool
  default     = true
}

variable "log_level" {
  description = "Log level for applications"
  type        = string
  default     = "info"
  
  validation {
    condition     = contains(["debug", "info", "warn", "error"], var.log_level)
    error_message = "Log level must be one of: debug, info, warn, error."
  }
} 