# GameDin L3 + AthenaMist AI AWS Infrastructure
# Main Terraform configuration for production deployment

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }
  
  backend "s3" {
    bucket = "gamedin-l3-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-west-2"
  }
}

# AWS Provider Configuration
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "GameDin-L3"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "GameDin-Team"
    }
  }
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"
  
  environment    = var.environment
  vpc_cidr       = var.vpc_cidr
  azs            = var.availability_zones
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets
  
  enable_nat_gateway = true
  single_nat_gateway = false
  enable_vpn_gateway = false
}

# EKS Cluster
module "eks" {
  source = "./modules/eks"
  
  cluster_name    = "gamedin-l3-${var.environment}"
  cluster_version = "1.28"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  cluster_endpoint_public_access = true
  cluster_endpoint_public_access_cidrs = ["0.0.0.0/0"]
  
  eks_managed_node_groups = {
    general = {
      desired_capacity = 3
      max_capacity     = 10
      min_capacity     = 1
      
      instance_types = ["t3.large", "t3.xlarge"]
      capacity_type  = "ON_DEMAND"
      
      labels = {
        Environment = var.environment
        NodeGroup   = "general"
      }
      
      tags = {
        ExtraTag = "eks-node-group"
      }
    }
    
    gaming = {
      desired_capacity = 2
      max_capacity     = 8
      min_capacity     = 1
      
      instance_types = ["c5.xlarge", "c5.2xlarge"]
      capacity_type  = "ON_DEMAND"
      
      labels = {
        Environment = var.environment
        NodeGroup   = "gaming"
        Gaming      = "true"
      }
      
      taints = [{
        key    = "gaming"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
    
    ai = {
      desired_capacity = 2
      max_capacity     = 6
      min_capacity     = 1
      
      instance_types = ["g4dn.xlarge", "g4dn.2xlarge"]
      capacity_type  = "ON_DEMAND"
      
      labels = {
        Environment = var.environment
        NodeGroup   = "ai"
        AI          = "true"
      }
      
      taints = [{
        key    = "ai"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }
}

# RDS PostgreSQL Database
module "rds" {
  source = "./modules/rds"
  
  identifier = "gamedin-l3-${var.environment}"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r6g.xlarge"
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_encrypted     = true
  
  db_name  = "gamedin"
  username = "gamedin_admin"
  password = var.db_password
  
  vpc_security_group_ids = [module.rds_security_group.security_group_id]
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  deletion_protection = true
  skip_final_snapshot = false
  
  tags = {
    Environment = var.environment
    Service     = "database"
  }
}

# ElastiCache Redis
module "redis" {
  source = "./modules/redis"
  
  cluster_id = "gamedin-l3-${var.environment}"
  
  node_type           = "cache.r6g.large"
  num_cache_nodes     = 2
  parameter_group_name = "default.redis7"
  
  port = 6379
  
  subnet_group_name = module.vpc.elasticache_subnet_group_name
  security_group_ids = [module.redis_security_group.security_group_id]
  
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  tags = {
    Environment = var.environment
    Service     = "cache"
  }
}

# Amazon MQ (RabbitMQ)
module "mq" {
  source = "./modules/mq"
  
  broker_name = "gamedin-l3-${var.environment}"
  
  engine_type        = "RabbitMQ"
  engine_version     = "3.11.20"
  host_instance_type = "mq.t3.micro"
  
  deployment_mode = "CLUSTER_MULTI_AZ"
  
  subnet_ids = module.vpc.private_subnets
  security_groups = [module.mq_security_group.security_group_id]
  
  username = "gamedin_admin"
  password = var.mq_password
  
  encryption_enabled = true
  
  tags = {
    Environment = var.environment
    Service     = "message-queue"
  }
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  name = "gamedin-l3-${var.environment}"
  
  vpc_id          = module.vpc.vpc_id
  subnets         = module.vpc.public_subnets
  security_groups = [module.alb_security_group.security_group_id]
  
  enable_deletion_protection = true
  
  access_logs = {
    bucket = module.s3_logs.s3_bucket_id
  }
  
  tags = {
    Environment = var.environment
    Service     = "load-balancer"
  }
}

# S3 Buckets
module "s3_logs" {
  source = "./modules/s3"
  
  bucket_name = "gamedin-l3-logs-${var.environment}-${random_string.bucket_suffix.result}"
  
  versioning_enabled = true
  encryption_enabled = true
  
  lifecycle_rules = [
    {
      id      = "log_retention"
      enabled = true
      
      expiration = {
        days = 90
      }
    }
  ]
  
  tags = {
    Environment = var.environment
    Service     = "logs"
  }
}

module "s3_backups" {
  source = "./modules/s3"
  
  bucket_name = "gamedin-l3-backups-${var.environment}-${random_string.bucket_suffix.result}"
  
  versioning_enabled = true
  encryption_enabled = true
  
  lifecycle_rules = [
    {
      id      = "backup_retention"
      enabled = true
      
      expiration = {
        days = 365
      }
    }
  ]
  
  tags = {
    Environment = var.environment
    Service     = "backups"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application_logs" {
  name              = "/aws/eks/gamedin-l3-${var.environment}/application"
  retention_in_days = 30
  
  tags = {
    Environment = var.environment
    Service     = "logs"
  }
}

resource "aws_cloudwatch_log_group" "system_logs" {
  name              = "/aws/eks/gamedin-l3-${var.environment}/system"
  retention_in_days = 30
  
  tags = {
    Environment = var.environment
    Service     = "logs"
  }
}

# Security Groups
module "alb_security_group" {
  source = "./modules/security_group"
  
  name        = "gamedin-l3-alb-${var.environment}"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.vpc.vpc_id
  
  ingress_rules = [
    {
      port        = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "HTTP"
    },
    {
      port        = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "HTTPS"
    }
  ]
  
  egress_rules = [
    {
      port        = 0
      protocol    = "-1"
      cidr_blocks = ["0.0.0.0/0"]
      description = "All outbound traffic"
    }
  ]
}

module "rds_security_group" {
  source = "./modules/security_group"
  
  name        = "gamedin-l3-rds-${var.environment}"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = module.vpc.vpc_id
  
  ingress_rules = [
    {
      port            = 5432
      protocol        = "tcp"
      security_groups = [module.eks.cluster_security_group_id]
      description     = "PostgreSQL from EKS"
    }
  ]
}

module "redis_security_group" {
  source = "./modules/security_group"
  
  name        = "gamedin-l3-redis-${var.environment}"
  description = "Security group for ElastiCache Redis"
  vpc_id      = module.vpc.vpc_id
  
  ingress_rules = [
    {
      port            = 6379
      protocol        = "tcp"
      security_groups = [module.eks.cluster_security_group_id]
      description     = "Redis from EKS"
    }
  ]
}

module "mq_security_group" {
  source = "./modules/security_group"
  
  name        = "gamedin-l3-mq-${var.environment}"
  description = "Security group for Amazon MQ"
  vpc_id      = module.vpc.vpc_id
  
  ingress_rules = [
    {
      port            = 5671
      protocol        = "tcp"
      security_groups = [module.eks.cluster_security_group_id]
      description     = "RabbitMQ AMQPS from EKS"
    },
    {
      port            = 15671
      protocol        = "tcp"
      security_groups = [module.eks.cluster_security_group_id]
      description     = "RabbitMQ Management from EKS"
    }
  ]
}

# Route 53 DNS
module "route53" {
  source = "./modules/route53"
  
  domain_name = var.domain_name
  environment = var.environment
  
  alb_dns_name = module.alb.lb_dns_name
  alb_zone_id  = module.alb.lb_zone_id
  
  certificate_arn = module.acm.certificate_arn
}

# ACM Certificate
module "acm" {
  source = "./modules/acm"
  
  domain_name = var.domain_name
  environment = var.environment
  
  subject_alternative_names = [
    "*.${var.domain_name}",
    "api.${var.domain_name}",
    "app.${var.domain_name}",
    "monitoring.${var.domain_name}"
  ]
}

# CloudWatch Alarms
module "cloudwatch_alarms" {
  source = "./modules/cloudwatch_alarms"
  
  environment = var.environment
  
  rds_instance_id = module.rds.db_instance_id
  alb_arn_suffix  = module.alb.lb_arn_suffix
  
  sns_topic_arn = module.sns.topic_arn
}

# SNS Topic for Alerts
module "sns" {
  source = "./modules/sns"
  
  topic_name = "gamedin-l3-alerts-${var.environment}"
  
  email_addresses = var.alert_email_addresses
  
  tags = {
    Environment = var.environment
    Service     = "alerts"
  }
}

# Random string for unique bucket names
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Outputs
output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "cluster_iam_role_name" {
  description = "IAM role name associated with EKS cluster"
  value       = module.eks.cluster_iam_role_name
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "db_instance_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = module.rds.db_instance_endpoint
}

output "redis_endpoint" {
  description = "The connection endpoint for the Redis cluster"
  value       = module.redis.cache_nodes
}

output "mq_broker_endpoints" {
  description = "The endpoints for the MQ broker"
  value       = module.mq.broker_endpoints
}

output "alb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = module.alb.lb_dns_name
}

output "domain_name" {
  description = "The domain name for the application"
  value       = var.domain_name
}

output "certificate_arn" {
  description = "The ARN of the SSL certificate"
  value       = module.acm.certificate_arn
} 