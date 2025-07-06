#!/bin/bash

# GameDin L3 + AthenaMist AI AWS Deployment Script
# This script deploys the complete infrastructure to AWS using Terraform

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$SCRIPT_DIR"
ENVIRONMENT="${ENVIRONMENT:-production}"
AWS_REGION="${AWS_REGION:-us-west-2}"
DOMAIN_NAME="${DOMAIN_NAME:-gamedin-l3.com}"

# Check if running in the correct directory
if [[ ! -f "$TERRAFORM_DIR/main.tf" ]]; then
    log_error "Terraform configuration not found. Please run this script from the terraform directory."
    exit 1
fi

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    # Check Terraform version
    TF_VERSION=$(terraform version -json | jq -r '.terraform_version')
    REQUIRED_VERSION="1.0.0"
    if [[ "$(printf '%s\n' "$REQUIRED_VERSION" "$TF_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]]; then
        log_error "Terraform version $TF_VERSION is too old. Please upgrade to version $REQUIRED_VERSION or higher."
        exit 1
    fi
    
    log_success "All prerequisites are satisfied"
}

# Function to create S3 backend for Terraform state
setup_terraform_backend() {
    log_info "Setting up Terraform backend..."
    
    BUCKET_NAME="gamedin-l3-terraform-state"
    
    # Check if bucket exists
    if ! aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
        log_info "Creating S3 bucket for Terraform state: $BUCKET_NAME"
        aws s3api create-bucket \
            --bucket "$BUCKET_NAME" \
            --region "$AWS_REGION" \
            --create-bucket-configuration LocationConstraint="$AWS_REGION"
        
        # Enable versioning
        aws s3api put-bucket-versioning \
            --bucket "$BUCKET_NAME" \
            --versioning-configuration Status=Enabled
        
        # Enable encryption
        aws s3api put-bucket-encryption \
            --bucket "$BUCKET_NAME" \
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
        aws s3api put-public-access-block \
            --bucket "$BUCKET_NAME" \
            --public-access-block-configuration \
                BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
        
        log_success "S3 bucket created and configured"
    else
        log_info "S3 bucket already exists: $BUCKET_NAME"
    fi
}

# Function to create DynamoDB table for Terraform state locking
setup_terraform_lock_table() {
    log_info "Setting up DynamoDB table for Terraform state locking..."
    
    TABLE_NAME="gamedin-l3-terraform-locks"
    
    # Check if table exists
    if ! aws dynamodb describe-table --table-name "$TABLE_NAME" &>/dev/null; then
        log_info "Creating DynamoDB table for Terraform state locking: $TABLE_NAME"
        aws dynamodb create-table \
            --table-name "$TABLE_NAME" \
            --attribute-definitions AttributeName=LockID,AttributeType=S \
            --key-schema AttributeName=LockID,KeyType=HASH \
            --billing-mode PAY_PER_REQUEST \
            --region "$AWS_REGION"
        
        # Wait for table to be active
        aws dynamodb wait table-exists --table-name "$TABLE_NAME"
        log_success "DynamoDB table created"
    else
        log_info "DynamoDB table already exists: $TABLE_NAME"
    fi
}

# Function to generate Terraform variables
generate_terraform_vars() {
    log_info "Generating Terraform variables..."
    
    # Generate secure passwords
    DB_PASSWORD=$(openssl rand -base64 32)
    MQ_PASSWORD=$(openssl rand -base64 32)
    GRAFANA_PASSWORD=$(openssl rand -base64 32)
    
    # Create terraform.tfvars file
    cat > "$TERRAFORM_DIR/terraform.tfvars" << EOF
# GameDin L3 + AthenaMist AI AWS Deployment Variables
aws_region = "$AWS_REGION"
environment = "$ENVIRONMENT"
domain_name = "$DOMAIN_NAME"

# Database Configuration
db_password = "$DB_PASSWORD"
db_instance_class = "db.r6g.xlarge"
db_allocated_storage = 100
db_max_allocated_storage = 1000

# Message Queue Configuration
mq_password = "$MQ_PASSWORD"
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
grafana_admin_password = "$GRAFANA_PASSWORD"
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
  Environment = "$ENVIRONMENT"
  ManagedBy   = "Terraform"
  Owner       = "GameDin-Team"
  CostCenter  = "Gaming"
  DataClass   = "Confidential"
}
EOF
    
    log_success "Terraform variables generated"
    
    # Save passwords to a secure file
    cat > "$TERRAFORM_DIR/secrets.txt" << EOF
# GameDin L3 + AthenaMist AI Deployment Secrets
# Generated on: $(date)
# Environment: $ENVIRONMENT

Database Password: $DB_PASSWORD
Message Queue Password: $MQ_PASSWORD
Grafana Admin Password: $GRAFANA_PASSWORD

# IMPORTANT: Keep this file secure and do not commit it to version control
EOF
    
    chmod 600 "$TERRAFORM_DIR/secrets.txt"
    log_warning "Secrets saved to secrets.txt (keep this file secure!)"
}

# Function to initialize Terraform
initialize_terraform() {
    log_info "Initializing Terraform..."
    
    cd "$TERRAFORM_DIR"
    
    # Initialize Terraform
    terraform init \
        -backend-config="bucket=gamedin-l3-terraform-state" \
        -backend-config="key=$ENVIRONMENT/terraform.tfstate" \
        -backend-config="region=$AWS_REGION" \
        -backend-config="dynamodb_table=gamedin-l3-terraform-locks" \
        -backend-config="encrypt=true"
    
    log_success "Terraform initialized"
}

# Function to validate Terraform configuration
validate_terraform() {
    log_info "Validating Terraform configuration..."
    
    cd "$TERRAFORM_DIR"
    
    # Validate configuration
    terraform validate
    
    # Plan the deployment
    terraform plan -out=tfplan
    
    log_success "Terraform configuration validated"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    log_info "Deploying infrastructure..."
    
    cd "$TERRAFORM_DIR"
    
    # Apply the Terraform plan
    terraform apply tfplan
    
    log_success "Infrastructure deployed successfully"
}

# Function to configure kubectl
configure_kubectl() {
    log_info "Configuring kubectl for EKS cluster..."
    
    # Get cluster name from Terraform output
    CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "gamedin-l3-$ENVIRONMENT")
    
    # Update kubeconfig
    aws eks update-kubeconfig --region "$AWS_REGION" --name "$CLUSTER_NAME"
    
    # Verify connection
    if kubectl cluster-info &>/dev/null; then
        log_success "kubectl configured successfully"
    else
        log_error "Failed to configure kubectl"
        exit 1
    fi
}

# Function to deploy Kubernetes applications
deploy_kubernetes_apps() {
    log_info "Deploying Kubernetes applications..."
    
    # Create namespace
    kubectl create namespace gamedin-l3 --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy applications
    deploy_database_migration
    deploy_core_services
    deploy_monitoring_stack
    deploy_ingress_controller
    deploy_applications
    
    log_success "Kubernetes applications deployed"
}

# Function to deploy database migration
deploy_database_migration() {
    log_info "Deploying database migration..."
    
    # Create database migration job
    cat << EOF | kubectl apply -f -
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
EOF
    
    # Wait for migration to complete
    kubectl wait --for=condition=complete job/db-migration -n gamedin-l3 --timeout=300s
}

# Function to deploy core services
deploy_core_services() {
    log_info "Deploying core services..."
    
    # Deploy database service
    kubectl apply -f "$PROJECT_ROOT/k8s/database.yaml"
    
    # Deploy Redis service
    kubectl apply -f "$PROJECT_ROOT/k8s/redis.yaml"
    
    # Deploy message queue service
    kubectl apply -f "$PROJECT_ROOT/k8s/message-queue.yaml"
    
    # Wait for services to be ready
    kubectl wait --for=condition=ready pod -l app=database -n gamedin-l3 --timeout=300s
    kubectl wait --for=condition=ready pod -l app=redis -n gamedin-l3 --timeout=300s
    kubectl wait --for=condition=ready pod -l app=message-queue -n gamedin-l3 --timeout=300s
}

# Function to deploy monitoring stack
deploy_monitoring_stack() {
    log_info "Deploying monitoring stack..."
    
    # Add Helm repositories
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add grafana https://grafana.github.io/helm-charts
    helm repo update
    
    # Deploy Prometheus
    helm install prometheus prometheus-community/kube-prometheus-stack \
        --namespace gamedin-l3 \
        --create-namespace \
        --set prometheus.prometheusSpec.retention=30d \
        --set grafana.adminPassword="$(terraform output -raw grafana_password)" \
        --wait
    
    # Deploy custom dashboards
    kubectl apply -f "$PROJECT_ROOT/k8s/monitoring/"
}

# Function to deploy ingress controller
deploy_ingress_controller() {
    log_info "Deploying ingress controller..."
    
    # Add NGINX ingress repository
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update
    
    # Deploy NGINX ingress controller
    helm install ingress-nginx ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --create-namespace \
        --set controller.service.type=LoadBalancer \
        --set controller.ingressClassResource.name=nginx \
        --wait
}

# Function to deploy applications
deploy_applications() {
    log_info "Deploying GameDin L3 applications..."
    
    # Deploy API Gateway
    kubectl apply -f "$PROJECT_ROOT/k8s/api-gateway.yaml"
    
    # Deploy Gaming Engine
    kubectl apply -f "$PROJECT_ROOT/k8s/gaming-engine.yaml"
    
    # Deploy AI Services
    kubectl apply -f "$PROJECT_ROOT/k8s/ai-services.yaml"
    
    # Deploy Frontend
    kubectl apply -f "$PROJECT_ROOT/k8s/frontend.yaml"
    
    # Deploy Bridge Relayer
    kubectl apply -f "$PROJECT_ROOT/k8s/bridge-relayer.yaml"
    
    # Wait for applications to be ready
    kubectl wait --for=condition=ready pod -l app=api-gateway -n gamedin-l3 --timeout=300s
    kubectl wait --for=condition=ready pod -l app=gaming-engine -n gamedin-l3 --timeout=300s
    kubectl wait --for=condition=ready pod -l app=ai-services -n gamedin-l3 --timeout=300s
    kubectl wait --for=condition=ready pod -l app=frontend -n gamedin-l3 --timeout=300s
    kubectl wait --for=condition=ready pod -l app=bridge-relayer -n gamedin-l3 --timeout=300s
}

# Function to run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Check EKS cluster
    kubectl get nodes
    
    # Check pods
    kubectl get pods -n gamedin-l3
    
    # Check services
    kubectl get svc -n gamedin-l3
    
    # Check ingress
    kubectl get ingress -n gamedin-l3
    
    # Test API endpoints
    API_ENDPOINT=$(kubectl get svc api-gateway -n gamedin-l3 -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    if [[ -n "$API_ENDPOINT" ]]; then
        log_info "Testing API endpoint: $API_ENDPOINT"
        curl -f "http://$API_ENDPOINT/health" || log_warning "API health check failed"
    fi
    
    log_success "Health checks completed"
}

# Function to display deployment information
display_deployment_info() {
    log_info "Deployment completed successfully!"
    
    echo
    echo "=========================================="
    echo "GameDin L3 + AthenaMist AI AWS Deployment"
    echo "=========================================="
    echo
    echo "Environment: $ENVIRONMENT"
    echo "Region: $AWS_REGION"
    echo "Domain: $DOMAIN_NAME"
    echo
    echo "Access URLs:"
    echo "- Frontend: https://$DOMAIN_NAME"
    echo "- API: https://api.$DOMAIN_NAME"
    echo "- Monitoring: https://monitoring.$DOMAIN_NAME"
    echo
    echo "Credentials:"
    echo "- Database password: $(grep "Database Password" "$TERRAFORM_DIR/secrets.txt" | cut -d: -f2 | xargs)"
    echo "- Grafana admin password: $(grep "Grafana Admin Password" "$TERRAFORM_DIR/secrets.txt" | cut -d: -f2 | xargs)"
    echo
    echo "Useful Commands:"
    echo "- View logs: kubectl logs -f -n gamedin-l3"
    echo "- Access shell: kubectl exec -it -n gamedin-l3 <pod-name> -- /bin/bash"
    echo "- Scale services: kubectl scale deployment <deployment> -n gamedin-l3 --replicas=<number>"
    echo
    echo "Terraform Commands:"
    echo "- View outputs: terraform output"
    echo "- Destroy infrastructure: terraform destroy"
    echo
    echo "=========================================="
}

# Function to cleanup on failure
cleanup_on_failure() {
    log_error "Deployment failed. Cleaning up..."
    
    cd "$TERRAFORM_DIR"
    
    # Destroy infrastructure
    terraform destroy -auto-approve
    
    log_warning "Infrastructure destroyed due to deployment failure"
}

# Main deployment function
main() {
    log_info "Starting GameDin L3 + AthenaMist AI AWS deployment..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Region: $AWS_REGION"
    log_info "Domain: $DOMAIN_NAME"
    
    # Set error handling
    trap cleanup_on_failure ERR
    
    # Run deployment steps
    check_prerequisites
    setup_terraform_backend
    setup_terraform_lock_table
    generate_terraform_vars
    initialize_terraform
    validate_terraform
    deploy_infrastructure
    configure_kubectl
    deploy_kubernetes_apps
    run_health_checks
    display_deployment_info
    
    log_success "Deployment completed successfully!"
}

# Run main function
main "$@" 