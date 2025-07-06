# GameDin L3 + AthenaMist AI Terraform Deployment Script
# PowerShell script for deploying the complete infrastructure

param(
    [string]$Environment = "dev",
    [string]$Region = "us-east-1",
    [string]$ProjectName = "gamedin-l3",
    [string]$DomainName = "gamedin-l3.com",
    [switch]$Destroy = $false,
    [switch]$PlanOnly = $false,
    [switch]$SkipConfirmation = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$White = "White"

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = $White
    )
    Write-Host $Message -ForegroundColor $Color
}

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to validate prerequisites
function Test-Prerequisites {
    Write-ColorOutput "🔍 Checking prerequisites..." $Blue
    
    $prerequisites = @{
        "terraform" = "Terraform"
        "aws" = "AWS CLI"
        "docker" = "Docker"
        "kubectl" = "kubectl"
    }
    
    $missing = @()
    
    foreach ($tool in $prerequisites.GetEnumerator()) {
        if (Test-Command $tool.Key) {
            Write-ColorOutput "✅ $($tool.Value) is installed" $Green
        } else {
            Write-ColorOutput "❌ $($tool.Value) is not installed" $Red
            $missing += $tool.Value
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-ColorOutput "❌ Missing prerequisites: $($missing -join ', ')" $Red
        Write-ColorOutput "Please install the missing tools and try again." $Yellow
        exit 1
    }
    
    # Check AWS credentials
    try {
        aws sts get-caller-identity | Out-Null
        Write-ColorOutput "✅ AWS credentials are configured" $Green
    } catch {
        Write-ColorOutput "❌ AWS credentials are not configured" $Red
        Write-ColorOutput "Please run 'aws configure' and try again." $Yellow
        exit 1
    }
}

# Function to create terraform.tfvars
function New-TerraformVars {
    Write-ColorOutput "📝 Creating terraform.tfvars..." $Blue
    
    $tfvars = @"
# GameDin L3 + AthenaMist AI Terraform Variables
# Generated on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Project Configuration
project_name = "$ProjectName"
environment  = "$Environment"
aws_region   = "$Region"

# Domain Configuration
domain_name = "$DomainName"

# VPC Configuration
vpc_cidr_block = "10.0.0.0/16"
azs = ["${Region}a", "${Region}b", "${Region}c"]

# EKS Configuration
eks_cluster_version = "1.28"
eks_node_groups = {
  general = {
    instance_types = ["t3.medium"]
    min_size       = 1
    max_size       = 3
    desired_size   = 2
  }
  gaming = {
    instance_types = ["c5.large"]
    min_size       = 1
    max_size       = 5
    desired_size   = 2
  }
  ai = {
    instance_types = ["g4dn.xlarge"]
    min_size       = 1
    max_size       = 3
    desired_size   = 1
  }
}

# RDS Configuration
rds_instance_class = "db.t3.micro"
rds_allocated_storage = 20
rds_storage_type = "gp2"
rds_backup_retention_period = 7
rds_backup_window = "03:00-04:00"
rds_maintenance_window = "sun:04:00-sun:05:00"

# Redis Configuration
redis_node_type = "cache.t3.micro"
redis_num_cache_nodes = 1
redis_parameter_group_family = "redis7"

# Amazon MQ Configuration
mq_engine_type = "RabbitMQ"
mq_engine_version = "3.11.20"
mq_host_instance_type = "mq.t3.micro"
mq_deployment_mode = "SINGLE_INSTANCE"

# ECS Configuration
app_image = "gamedin/app:latest"
api_image = "gamedin/api:latest"
app_cpu = 256
app_memory = 512
api_cpu = 512
api_memory = 1024
app_desired_count = 2
api_desired_count = 2

# S3 Bucket Names
static_assets_bucket_name = "$ProjectName-static-assets-$Environment"
logs_bucket_name = "$ProjectName-logs-$Environment"
backups_bucket_name = "$ProjectName-backups-$Environment"
ai_models_bucket_name = "$ProjectName-ai-models-$Environment"
game_assets_bucket_name = "$ProjectName-game-assets-$Environment"

# Monitoring Configuration
alert_emails = ["admin@$DomainName"]
alert_phone_numbers = []

# Tags
tags = {
  Project     = "$ProjectName"
  Environment = "$Environment"
  ManagedBy   = "Terraform"
  Owner       = "GameDin Team"
}
"@

    $tfvars | Out-File -FilePath "terraform.tfvars" -Encoding UTF8
    Write-ColorOutput "✅ terraform.tfvars created" $Green
}

# Function to initialize Terraform
function Initialize-Terraform {
    Write-ColorOutput "🚀 Initializing Terraform..." $Blue
    
    try {
        terraform init -upgrade
        Write-ColorOutput "✅ Terraform initialized successfully" $Green
    } catch {
        Write-ColorOutput "❌ Failed to initialize Terraform" $Red
        exit 1
    }
}

# Function to validate Terraform configuration
function Test-TerraformConfig {
    Write-ColorOutput "🔍 Validating Terraform configuration..." $Blue
    
    try {
        terraform validate
        Write-ColorOutput "✅ Terraform configuration is valid" $Green
    } catch {
        Write-ColorOutput "❌ Terraform configuration validation failed" $Red
        exit 1
    }
}

# Function to format Terraform code
function Format-Terraform {
    Write-ColorOutput "🎨 Formatting Terraform code..." $Blue
    
    try {
        terraform fmt -recursive
        Write-ColorOutput "✅ Terraform code formatted" $Green
    } catch {
        Write-ColorOutput "⚠️  Terraform formatting failed, continuing..." $Yellow
    }
}

# Function to plan Terraform deployment
function Plan-Terraform {
    Write-ColorOutput "📋 Planning Terraform deployment..." $Blue
    
    try {
        if ($Destroy) {
            terraform plan -destroy -out=tfplan
        } else {
            terraform plan -out=tfplan
        }
        Write-ColorOutput "✅ Terraform plan created successfully" $Green
    } catch {
        Write-ColorOutput "❌ Terraform plan failed" $Red
        exit 1
    }
}

# Function to apply Terraform deployment
function Apply-Terraform {
    Write-ColorOutput "🚀 Applying Terraform deployment..." $Blue
    
    if (-not $SkipConfirmation) {
        $confirmation = Read-Host "Do you want to proceed with the deployment? (y/N)"
        if ($confirmation -ne "y" -and $confirmation -ne "Y") {
            Write-ColorOutput "❌ Deployment cancelled by user" $Yellow
            exit 0
        }
    }
    
    try {
        terraform apply tfplan
        Write-ColorOutput "✅ Terraform deployment completed successfully" $Green
    } catch {
        Write-ColorOutput "❌ Terraform deployment failed" $Red
        exit 1
    }
}

# Function to destroy Terraform resources
function Destroy-Terraform {
    Write-ColorOutput "🗑️  Destroying Terraform resources..." $Blue
    
    if (-not $SkipConfirmation) {
        $confirmation = Read-Host "Are you sure you want to destroy all resources? This action cannot be undone! (y/N)"
        if ($confirmation -ne "y" -and $confirmation -ne "Y") {
            Write-ColorOutput "❌ Destruction cancelled by user" $Yellow
            exit 0
        }
    }
    
    try {
        terraform destroy -auto-approve
        Write-ColorOutput "✅ Terraform resources destroyed successfully" $Green
    } catch {
        Write-ColorOutput "❌ Terraform destruction failed" $Red
        exit 1
    }
}

# Function to get Terraform outputs
function Get-TerraformOutputs {
    Write-ColorOutput "📊 Getting Terraform outputs..." $Blue
    
    try {
        $outputs = terraform output -json | ConvertFrom-Json
        
        Write-ColorOutput "`n🎯 Deployment Summary:" $Green
        Write-ColorOutput "================================" $Green
        
        if ($outputs.vpc_id) {
            Write-ColorOutput "VPC ID: $($outputs.vpc_id.value)" $White
        }
        
        if ($outputs.eks_cluster_name) {
            Write-ColorOutput "EKS Cluster: $($outputs.eks_cluster_name.value)" $White
        }
        
        if ($outputs.rds_endpoint) {
            Write-ColorOutput "RDS Endpoint: $($outputs.rds_endpoint.value)" $White
        }
        
        if ($outputs.redis_endpoint) {
            Write-ColorOutput "Redis Endpoint: $($outputs.redis_endpoint.value)" $White
        }
        
        if ($outputs.alb_dns_name) {
            Write-ColorOutput "Load Balancer: $($outputs.alb_dns_name.value)" $White
        }
        
        if ($outputs.domain_name) {
            Write-ColorOutput "Domain: $($outputs.domain_name.value)" $White
        }
        
        if ($outputs.s3_bucket_names) {
            Write-ColorOutput "S3 Buckets:" $White
            foreach ($bucket in $outputs.s3_bucket_names.value.PSObject.Properties) {
                Write-ColorOutput "  - $($bucket.Name): $($bucket.Value)" $White
            }
        }
        
        Write-ColorOutput "`n🔗 Access URLs:" $Green
        Write-ColorOutput "================================" $Green
        Write-ColorOutput "Application: https://$DomainName" $White
        Write-ColorOutput "API: https://api.$DomainName" $White
        Write-ColorOutput "Dashboard: https://dashboard.$DomainName" $White
        Write-ColorOutput "Monitoring: https://monitoring.$DomainName" $White
        
        Write-ColorOutput "`n📋 Next Steps:" $Green
        Write-ColorOutput "================================" $Green
        Write-ColorOutput "1. Configure DNS records to point to the load balancer" $White
        Write-ColorOutput "2. Deploy application containers to ECS" $White
        Write-ColorOutput "3. Configure monitoring and alerting" $White
        Write-ColorOutput "4. Set up CI/CD pipeline" $White
        Write-ColorOutput "5. Configure backup and disaster recovery" $White
        
    } catch {
        Write-ColorOutput "⚠️  Could not retrieve Terraform outputs" $Yellow
    }
}

# Function to clean up temporary files
function Remove-TempFiles {
    Write-ColorOutput "🧹 Cleaning up temporary files..." $Blue
    
    $tempFiles = @("tfplan", "terraform.tfvars")
    
    foreach ($file in $tempFiles) {
        if (Test-Path $file) {
            Remove-Item $file -Force
            Write-ColorOutput "✅ Removed $file" $Green
        }
    }
}

# Main execution
try {
    Write-ColorOutput "🎮 GameDin L3 + AthenaMist AI Infrastructure Deployment" $Green
    Write-ColorOutput "=====================================================" $Green
    Write-ColorOutput "Environment: $Environment" $White
    Write-ColorOutput "Region: $Region" $White
    Write-ColorOutput "Project: $ProjectName" $White
    Write-ColorOutput "Domain: $DomainName" $White
    Write-ColorOutput "Mode: $(if ($Destroy) { 'Destroy' } else { 'Deploy' })" $White
    Write-ColorOutput ""

    # Check prerequisites
    Test-Prerequisites
    
    # Create terraform.tfvars
    New-TerraformVars
    
    # Initialize Terraform
    Initialize-Terraform
    
    # Format and validate
    Format-Terraform
    Test-TerraformConfig
    
    if ($PlanOnly) {
        # Plan only
        Plan-Terraform
        Write-ColorOutput "✅ Plan completed. Review the plan above." $Green
    } elseif ($Destroy) {
        # Destroy resources
        Destroy-Terraform
        Remove-TempFiles
    } else {
        # Deploy resources
        Plan-Terraform
        Apply-Terraform
        Get-TerraformOutputs
        Remove-TempFiles
    }
    
    Write-ColorOutput "`n🎉 Deployment process completed successfully!" $Green
    
} catch {
    Write-ColorOutput "`n❌ Deployment failed with error: $($_.Exception.Message)" $Red
    Write-ColorOutput "Please check the error details above and try again." $Yellow
    exit 1
} 