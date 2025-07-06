# GameDin L3 + AthenaMist AI AWS Deployment Script (PowerShell)
# This script deploys the complete infrastructure to AWS using Terraform

param(
    [string]$Environment = "production",
    [string]$AwsRegion = "us-west-2",
    [string]$DomainName = "gamedin-l3.com"
)

# Error handling
$ErrorActionPreference = "Stop"

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$White = "White"

# Logging functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$TerraformDir = $ScriptDir

# Check if running in the correct directory
if (-not (Test-Path "$TerraformDir\main.tf")) {
    Write-Error "Terraform configuration not found. Please run this script from the terraform directory."
    exit 1
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check AWS CLI
    try {
        aws --version | Out-Null
        Write-Success "AWS CLI is installed"
    }
    catch {
        Write-Error "AWS CLI is not installed. Please install it first."
        exit 1
    }
    
    # Check Terraform
    try {
        terraform version | Out-Null
        Write-Success "Terraform is installed"
    }
    catch {
        Write-Error "Terraform is not installed. Please install it first."
        exit 1
    }
    
    # Check kubectl
    try {
        kubectl version --client | Out-Null
        Write-Success "kubectl is installed"
    }
    catch {
        Write-Error "kubectl is not installed. Please install it first."
        exit 1
    }
    
    # Check AWS credentials
    try {
        aws sts get-caller-identity | Out-Null
        Write-Success "AWS credentials are configured"
    }
    catch {
        Write-Error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    }
    
    # Check Terraform version
    $TfVersion = (terraform version -json | ConvertFrom-Json).terraform_version
    $RequiredVersion = "1.0.0"
    if ([version]$TfVersion -lt [version]$RequiredVersion) {
        Write-Error "Terraform version $TfVersion is too old. Please upgrade to version $RequiredVersion or higher."
        exit 1
    }
    
    Write-Success "All prerequisites are satisfied"
}

# Function to create S3 backend for Terraform state
function Set-TerraformBackend {
    Write-Info "Setting up Terraform backend..."
    
    $BucketName = "gamedin-l3-terraform-state"
    
    # Check if bucket exists
    try {
        aws s3api head-bucket --bucket $BucketName 2>$null
        Write-Info "S3 bucket already exists: $BucketName"
    }
    catch {
        Write-Info "Creating S3 bucket for Terraform state: $BucketName"
        aws s3api create-bucket `
            --bucket $BucketName `
            --region $AwsRegion `
            --create-bucket-configuration LocationConstraint=$AwsRegion
        
        # Enable versioning
        aws s3api put-bucket-versioning `
            --bucket $BucketName `
            --versioning-configuration Status=Enabled
        
        # Enable encryption
        aws s3api put-bucket-encryption `
            --bucket $BucketName `
            --server-side-encryption-configuration '{
                "Rules": [
                    {
                        "ApplyServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            }'
        
        # Block public access
        aws s3api put-public-access-block `
            --bucket $BucketName `
            --public-access-block-configuration `
                BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
        
        Write-Success "S3 bucket created and configured"
    }
}

# Function to create DynamoDB table for Terraform state locking
function Set-TerraformLockTable {
    Write-Info "Setting up DynamoDB table for Terraform state locking..."
    
    $TableName = "gamedin-l3-terraform-locks"
    
    # Check if table exists
    try {
        aws dynamodb describe-table --table-name $TableName 2>$null
        Write-Info "DynamoDB table already exists: $TableName"
    }
    catch {
        Write-Info "Creating DynamoDB table for Terraform state locking: $TableName"
        aws dynamodb create-table `
            --table-name $TableName `
            --attribute-definitions AttributeName=LockID,AttributeType=S `
            --key-schema AttributeName=LockID,KeyType=HASH `
            --billing-mode PAY_PER_REQUEST `
            --region $AwsRegion
        
        # Wait for table to be active
        aws dynamodb wait table-exists --table-name $TableName
        Write-Success "DynamoDB table created"
    }
}

# Function to generate Terraform variables
function New-TerraformVars {
    Write-Info "Generating Terraform variables..."
    
    # Generate secure passwords
    $DbPassword = -join ((33..126) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    $MqPassword = -join ((33..126) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    $GrafanaPassword = -join ((33..126) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    
    # Create terraform.tfvars file
    $TfVars = @"
# GameDin L3 + AthenaMist AI AWS Deployment Variables
aws_region = "$AwsRegion"
environment = "$Environment"
domain_name = "$DomainName"

# Database Configuration
db_password = "$DbPassword"
db_instance_class = "db.r6g.xlarge"
db_allocated_storage = 100
db_max_allocated_storage = 1000

# Message Queue Configuration
mq_password = "$MqPassword"
mq_instance_type = "mq.t3.micro"

# EKS Configuration
eks_cluster_version = "1.28"

# Application Configuration
app_replicas = {
  api_gateway    = 3
  gaming_engine  = 2
  ai_services    = 2
  frontend       = 2
  bridge_relayer = 2
}

app_resources = {
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

# Monitoring Configuration
monitoring_enabled = true
grafana_admin_password = "$GrafanaPassword"
prometheus_retention_days = 30

# Alerting Configuration
alert_email_addresses = ["alerts@gamedin-l3.com"]
sns_topic_name = "gamedin-l3-alerts"

# Backup Configuration
backup_enabled = true
backup_retention_days = 30
backup_schedule = "0 2 * * *"

# Security Configuration
enable_encryption = true
enable_vpc_flow_logs = true
enable_cloudtrail = true

# Cost Optimization
enable_spot_instances = false
enable_autoscaling = true

# Performance Configuration
enable_cdn = true
cdn_price_class = "PriceClass_100"

# Logging Configuration
log_retention_days = 30
enable_structured_logging = true
log_level = "info"

# Container Registry
container_registry = "gcr.io/gamedin-l3"
image_tag = "latest"

# SSL/TLS Configuration
enable_ssl_redirect = true

# Common Tags
common_tags = {
  Project     = "GameDin-L3"
  Environment = "$Environment"
  ManagedBy   = "Terraform"
  Owner       = "GameDin-Team"
  CostCenter  = "Gaming"
  DataClass   = "Confidential"
}
"@
    
    $TfVars | Out-File -FilePath "$TerraformDir\terraform.tfvars" -Encoding UTF8
    Write-Success "Terraform variables generated"
    
    # Save passwords to a secure file
    $Secrets = @"
# GameDin L3 + AthenaMist AI Deployment Secrets
# Generated on: $(Get-Date)
# Environment: $Environment

Database Password: $DbPassword
Message Queue Password: $MqPassword
Grafana Admin Password: $GrafanaPassword

# IMPORTANT: Keep this file secure and do not commit it to version control
"@
    
    $Secrets | Out-File -FilePath "$TerraformDir\secrets.txt" -Encoding UTF8
    Write-Warning "Secrets saved to secrets.txt (keep this file secure!)"
}

# Function to initialize Terraform
function Initialize-Terraform {
    Write-Info "Initializing Terraform..."
    
    Push-Location $TerraformDir
    
    # Initialize Terraform
    terraform init `
        -backend-config="bucket=gamedin-l3-terraform-state" `
        -backend-config="key=$Environment/terraform.tfstate" `
        -backend-config="region=$AwsRegion" `
        -backend-config="dynamodb_table=gamedin-l3-terraform-locks" `
        -backend-config="encrypt=true"
    
    Pop-Location
    Write-Success "Terraform initialized"
}

# Function to validate Terraform configuration
function Test-TerraformConfig {
    Write-Info "Validating Terraform configuration..."
    
    Push-Location $TerraformDir
    
    # Validate configuration
    terraform validate
    
    # Plan the deployment
    terraform plan -out=tfplan
    
    Pop-Location
    Write-Success "Terraform configuration validated"
}

# Function to deploy infrastructure
function Deploy-Infrastructure {
    Write-Info "Deploying infrastructure..."
    
    Push-Location $TerraformDir
    
    # Apply the Terraform plan
    terraform apply tfplan
    
    Pop-Location
    Write-Success "Infrastructure deployed successfully"
}

# Function to configure kubectl
function Set-KubectlConfig {
    Write-Info "Configuring kubectl for EKS cluster..."
    
    Push-Location $TerraformDir
    
    # Get cluster name from Terraform output
    $ClusterName = terraform output -raw cluster_name 2>$null
    if (-not $ClusterName) {
        $ClusterName = "gamedin-l3-$Environment"
    }
    
    Pop-Location
    
    # Update kubeconfig
    aws eks update-kubeconfig --region $AwsRegion --name $ClusterName
    
    # Verify connection
    try {
        kubectl cluster-info | Out-Null
        Write-Success "kubectl configured successfully"
    }
    catch {
        Write-Error "Failed to configure kubectl"
        exit 1
    }
}

# Function to deploy Kubernetes applications
function Deploy-KubernetesApps {
    Write-Info "Deploying Kubernetes applications..."
    
    # Create namespace
    kubectl create namespace gamedin-l3 --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy applications
    Deploy-DatabaseMigration
    Deploy-CoreServices
    Deploy-MonitoringStack
    Deploy-IngressController
    Deploy-Applications
    
    Write-Success "Kubernetes applications deployed"
}

# Function to deploy database migration
function Deploy-DatabaseMigration {
    Write-Info "Deploying database migration..."
    
    # Create database migration job
    $MigrationJob = @"
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
  namespace: gamedin-l3
spec:
  template:
    spec:
      containers:
      - name: migration
        image: gcr.io/gamedin-l3/db-migration:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
      restartPolicy: Never
  backoffLimit: 3
"@
    
    $MigrationJob | kubectl apply -f -
    
    # Wait for migration to complete
    kubectl wait --for=condition=complete job/db-migration -n gamedin-l3 --timeout=300s
}

# Function to deploy core services
function Deploy-CoreServices {
    Write-Info "Deploying core services..."
    
    # Deploy database service
    kubectl apply -f "$ProjectRoot\k8s\database.yaml"
    
    # Deploy Redis service
    kubectl apply -f "$ProjectRoot\k8s\redis.yaml"
    
    # Deploy message queue service
    kubectl apply -f "$ProjectRoot\k8s\message-queue.yaml"
    
    # Wait for services to be ready
    kubectl wait --for=condition=ready pod -l app=database -n gamedin-l3 --timeout=300s
    kubectl wait --for=condition=ready pod -l app=redis -n gamedin-l3 --timeout=300s
    kubectl wait --for=condition=ready pod -l app=message-queue -n gamedin-l3 --timeout=300s
}

# Function to deploy monitoring stack
function Deploy-MonitoringStack {
    Write-Info "Deploying monitoring stack..."
    
    # Add Helm repositories
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add grafana https://grafana.github.io/helm-charts
    helm repo update
    
    # Deploy Prometheus
    helm install prometheus prometheus-community/kube-prometheus-stack `
        --namespace gamedin-l3 `
        --create-namespace `
        --set prometheus.prometheusSpec.retention=30d `
        --set grafana.adminPassword="$(Get-Content "$TerraformDir\secrets.txt" | Select-String "Grafana Admin Password" | ForEach-Object { $_.ToString().Split(':')[1].Trim() })" `
        --wait
    
    # Deploy custom dashboards
    kubectl apply -f "$ProjectRoot\k8s\monitoring\"
}

# Function to deploy ingress controller
function Deploy-IngressController {
    Write-Info "Deploying ingress controller..."
    
    # Add NGINX ingress repository
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update
    
    # Deploy NGINX ingress controller
    helm install ingress-nginx ingress-nginx/ingress-nginx `
        --namespace ingress-nginx `
        --create-namespace `
        --set controller.service.type=LoadBalancer `
        --set controller.ingressClassResource.name=nginx `
        --wait
}

# Function to deploy applications
function Deploy-Applications {
    Write-Info "Deploying GameDin L3 applications..."
    
    # Deploy API Gateway
    kubectl apply -f "$ProjectRoot\k8s\api-gateway.yaml"
    
    # Deploy Gaming Engine
    kubectl apply -f "$ProjectRoot\k8s\gaming-engine.yaml"
    
    # Deploy AI Services
    kubectl apply -f "$ProjectRoot\k8s\ai-services.yaml"
    
    # Deploy Frontend
    kubectl apply -f "$ProjectRoot\k8s\frontend.yaml"
    
    # Deploy Bridge Relayer
    kubectl apply -f "$ProjectRoot\k8s\bridge-relayer.yaml"
    
    # Wait for applications to be ready
    kubectl wait --for=condition=ready pod -l app=api-gateway -n gamedin-l3 --timeout=300s
    kubectl wait --for=condition=ready pod -l app=gaming-engine -n gamedin-l3 --timeout=300s
    kubectl wait --for=condition=ready pod -l app=ai-services -n gamedin-l3 --timeout=300s
    kubectl wait --for=condition=ready pod -l app=frontend -n gamedin-l3 --timeout=300s
    kubectl wait --for=condition=ready pod -l app=bridge-relayer -n gamedin-l3 --timeout=300s
}

# Function to run health checks
function Test-HealthChecks {
    Write-Info "Running health checks..."
    
    # Check EKS cluster
    kubectl get nodes
    
    # Check pods
    kubectl get pods -n gamedin-l3
    
    # Check services
    kubectl get svc -n gamedin-l3
    
    # Check ingress
    kubectl get ingress -n gamedin-l3
    
    # Test API endpoints
    $ApiEndpoint = kubectl get svc api-gateway -n gamedin-l3 -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
    if ($ApiEndpoint) {
        Write-Info "Testing API endpoint: $ApiEndpoint"
        try {
            Invoke-WebRequest -Uri "http://$ApiEndpoint/health" -UseBasicParsing | Out-Null
            Write-Success "API health check passed"
        }
        catch {
            Write-Warning "API health check failed"
        }
    }
    
    Write-Success "Health checks completed"
}

# Function to display deployment information
function Show-DeploymentInfo {
    Write-Info "Deployment completed successfully!"
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor $Green
    Write-Host "GameDin L3 + AthenaMist AI AWS Deployment" -ForegroundColor $Green
    Write-Host "==========================================" -ForegroundColor $Green
    Write-Host ""
    Write-Host "Environment: $Environment" -ForegroundColor $White
    Write-Host "Region: $AwsRegion" -ForegroundColor $White
    Write-Host "Domain: $DomainName" -ForegroundColor $White
    Write-Host ""
    Write-Host "Access URLs:" -ForegroundColor $Yellow
    Write-Host "- Frontend: https://$DomainName" -ForegroundColor $White
    Write-Host "- API: https://api.$DomainName" -ForegroundColor $White
    Write-Host "- Monitoring: https://monitoring.$DomainName" -ForegroundColor $White
    Write-Host ""
    Write-Host "Credentials:" -ForegroundColor $Yellow
    $Secrets = Get-Content "$TerraformDir\secrets.txt"
    $DbPassword = ($Secrets | Select-String "Database Password").ToString().Split(':')[1].Trim()
    $GrafanaPassword = ($Secrets | Select-String "Grafana Admin Password").ToString().Split(':')[1].Trim()
    Write-Host "- Database password: $DbPassword" -ForegroundColor $White
    Write-Host "- Grafana admin password: $GrafanaPassword" -ForegroundColor $White
    Write-Host ""
    Write-Host "Useful Commands:" -ForegroundColor $Yellow
    Write-Host "- View logs: kubectl logs -f -n gamedin-l3" -ForegroundColor $White
    Write-Host "- Access shell: kubectl exec -it -n gamedin-l3 <pod-name> -- /bin/bash" -ForegroundColor $White
    Write-Host "- Scale services: kubectl scale deployment <deployment> -n gamedin-l3 --replicas=<number>" -ForegroundColor $White
    Write-Host ""
    Write-Host "Terraform Commands:" -ForegroundColor $Yellow
    Write-Host "- View outputs: terraform output" -ForegroundColor $White
    Write-Host "- Destroy infrastructure: terraform destroy" -ForegroundColor $White
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor $Green
}

# Function to cleanup on failure
function Remove-InfrastructureOnFailure {
    Write-Error "Deployment failed. Cleaning up..."
    
    Push-Location $TerraformDir
    
    # Destroy infrastructure
    terraform destroy -auto-approve
    
    Pop-Location
    Write-Warning "Infrastructure destroyed due to deployment failure"
}

# Main deployment function
function Start-Deployment {
    Write-Info "Starting GameDin L3 + AthenaMist AI AWS deployment..."
    Write-Info "Environment: $Environment"
    Write-Info "Region: $AwsRegion"
    Write-Info "Domain: $DomainName"
    
    # Set error handling
    $ErrorActionPreference = "Stop"
    
    try {
        # Run deployment steps
        Test-Prerequisites
        Set-TerraformBackend
        Set-TerraformLockTable
        New-TerraformVars
        Initialize-Terraform
        Test-TerraformConfig
        Deploy-Infrastructure
        Set-KubectlConfig
        Deploy-KubernetesApps
        Test-HealthChecks
        Show-DeploymentInfo
        
        Write-Success "Deployment completed successfully!"
    }
    catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        Remove-InfrastructureOnFailure
        exit 1
    }
}

# Run main function
Start-Deployment 