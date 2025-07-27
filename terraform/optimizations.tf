/**
 * GameDin L3 - Infrastructure Optimizations
 * 
 * This file contains optimizations for the GameDin L3 infrastructure.
 */

# Enable EKS Cluster Autoscaler
module "cluster_autoscaler" {
  source = "./modules/eks-cluster-autoscaler"
  
  cluster_name                     = module.eks.cluster_name
  cluster_identity_oidc_issuer     = module.eks.cluster_oidc_issuer_url
  cluster_identity_oidc_issuer_arn = module.eks.oidc_provider_arn
  
  scale_down_utilization_threshold = 0.5
  scale_down_delay_after_add      = "10m"
  enable_gpu_autoscaling          = true
  enable_spot_instances           = true
  
  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Karpenter for efficient node provisioning
module "karpenter" {
  source = "./modules/karpenter"
  
  cluster_name     = module.eks.cluster_name
  cluster_endpoint = module.eks.cluster_endpoint
  cluster_ca_data  = module.eks.cluster_certificate_authority_data
  
  spot_enabled = true
  spot_max_pct = 90
  default_instance_types = ["m5.large", "m5a.large"]
  gpu_instance_types = ["g4dn.xlarge"]
  
  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Enable AWS Backup
module "backup" {
  source = "./modules/aws-backup"
  
  vault_name = "gamedin-l3-${var.environment}-backup-vault"
  plan_name  = "gamedin-l3-${var.environment}-backup-plan"
  
  rules = [
    {
      name                = "daily-backup"
      schedule           = "cron(0 5 * * ? *)"
      start_window       = 60
      completion_window  = 180
      
      lifecycle = {
        cold_storage_after = 30
        delete_after       = 365
      }
    }
  ]
  
  selection_tags = [
    {
      type  = "STRINGEQUALS"
      key   = "Backup"
      value = "true"
    }
  ]
  
  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Enable GuardDuty
resource "aws_guardduty_detector" "this" {
  enable = true
  
  datasources {
    s3_logs { enable = true }
    kubernetes { audit_logs { enable = true }}
    malware_protection { 
      scan_ec2_instance_with_findings {
        ebs_volumes { enable = true }
      }
    }
  }
  
  tags = {
    Name        = "gamedin-l3-guardduty"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Enable VPC Flow Logs
resource "aws_flow_log" "vpc_flow_logs" {
  log_destination      = aws_cloudwatch_log_group.flow_logs.arn
  log_destination_type = "cloud-watch-logs"
  traffic_type         = "ALL"
  vpc_id               = module.vpc.vpc_id
  
  tags = {
    Name        = "gamedin-l3-vpc-flow-logs"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/aws/vpc-flow-logs/gamedin-l3-${var.environment}"
  retention_in_days = 365
  
  tags = {
    Name        = "gamedin-l3-flow-logs"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Enable AWS X-Ray
resource "aws_xray_sampling_rule" "default" {
  rule_name      = "default"
  priority       = 1000
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.1
  service_name   = "*"
  service_type   = "*"
  host           = "*"
  http_method    = "*"
  url_path      = "*"
  
  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Enable EBS encryption by default
resource "aws_ebs_encryption_by_default" "enabled" {
  enabled = true
}

# Outputs for the optimizations
output "cluster_autoscaler_arn" {
  description = "ARN of the cluster autoscaler IAM role"
  value       = module.cluster_autoscaler.iam_role_arn
}

output "karpenter_node_iam_role_arn" {
  description = "ARN of the Karpenter node IAM role"
  value       = module.karpenter.node_iam_role_arn
}

output "backup_vault_arn" {
  description = "ARN of the backup vault"
  value       = module.backup.backup_vault_arn
}
