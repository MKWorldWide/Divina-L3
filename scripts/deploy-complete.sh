#!/bin/bash

# GameDin L3 + AthenaMist AI Complete Deployment Script
# This script deploys the entire ecosystem including infrastructure, applications, and services

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="gamedin-l3"
ENVIRONMENT=${1:-"dev"}
AWS_REGION=${2:-"us-east-1"}
DOMAIN_NAME=${3:-"gamedin-l3.com"}
SKIP_CONFIRMATION=${4:-"false"}

# Derived values
FULL_DOMAIN_NAME="${ENVIRONMENT}.${DOMAIN_NAME}"
if [ "$ENVIRONMENT" = "prod" ]; then
    FULL_DOMAIN_NAME="$DOMAIN_NAME"
fi

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    command -v aws >/dev/null 2>&1 || missing_tools+=("AWS CLI")
    command -v terraform >/dev/null 2>&1 || missing_tools+=("Terraform")
    command -v docker >/dev/null 2>&1 || missing_tools+=("Docker")
    command -v kubectl >/dev/null 2>&1 || missing_tools+=("kubectl")
    command -v node >/dev/null 2>&1 || missing_tools+=("Node.js")
    command -v npm >/dev/null 2>&1 || missing_tools+=("npm")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Please install the missing tools and try again."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        log_error "AWS credentials not configured"
        log_info "Please run 'aws configure' and try again."
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

# Initialize deployment
initialize_deployment() {
    log_info "Initializing deployment for environment: $ENVIRONMENT"
    
    # Create deployment directory
    mkdir -p deployments/$ENVIRONMENT
    cd deployments/$ENVIRONMENT
    
    # Set environment variables
    export AWS_REGION=$AWS_REGION
    export ENVIRONMENT=$ENVIRONMENT
    export PROJECT_NAME=$PROJECT_NAME
    export DOMAIN_NAME=$FULL_DOMAIN_NAME
    
    log_success "Deployment initialized"
}

# Deploy infrastructure
deploy_infrastructure() {
    log_info "Deploying infrastructure..."
    
    cd ../../terraform
    
    # Create terraform.tfvars
    cat > terraform.tfvars << EOF
project_name = "$PROJECT_NAME-$ENVIRONMENT"
environment  = "$ENVIRONMENT"
aws_region   = "$AWS_REGION"
domain_name  = "$FULL_DOMAIN_NAME"

# VPC Configuration
vpc_cidr_block = "10.$ENVIRONMENT_NUM.0.0/16"
azs = ["${AWS_REGION}a", "${AWS_REGION}b", "${AWS_REGION}c"]

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

# Redis Configuration
redis_node_type = "cache.t3.micro"
redis_num_cache_nodes = 1

# Monitoring Configuration
alert_emails = ["admin@$DOMAIN_NAME"]
alert_phone_numbers = []

# Tags
tags = {
  Project     = "$PROJECT_NAME"
  Environment = "$ENVIRONMENT"
  ManagedBy   = "Terraform"
  Owner       = "GameDin Team"
}
EOF

    # Initialize Terraform
    terraform init
    
    # Plan deployment
    terraform plan -out=tfplan
    
    # Apply deployment
    terraform apply tfplan
    
    # Get outputs
    CLUSTER_NAME=$(terraform output -raw cluster_name)
    RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
    REDIS_ENDPOINT=$(terraform output -raw redis_endpoint)
    ALB_DNS_NAME=$(terraform output -raw alb_dns_name)
    
    # Update kubeconfig
    aws eks update-kubeconfig --name $CLUSTER_NAME --region $AWS_REGION
    
    log_success "Infrastructure deployed successfully"
}

# Build and push Docker images
build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    cd ../..
    
    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    
    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | \
        docker login --username AWS --password-stdin $ECR_REGISTRY
    
    # Create ECR repositories
    aws ecr create-repository --repository-name $PROJECT_NAME/app --region $AWS_REGION || true
    aws ecr create-repository --repository-name $PROJECT_NAME/api --region $AWS_REGION || true
    aws ecr create-repository --repository-name $PROJECT_NAME/ai-service --region $AWS_REGION || true
    
    # Build images
    docker build -t $PROJECT_NAME/app:latest -f Dockerfile.app .
    docker build -t $PROJECT_NAME/api:latest -f Dockerfile.api .
    docker build -t $PROJECT_NAME/ai-service:latest -f Dockerfile.ai .
    
    # Tag images
    docker tag $PROJECT_NAME/app:latest $ECR_REGISTRY/$PROJECT_NAME/app:latest
    docker tag $PROJECT_NAME/api:latest $ECR_REGISTRY/$PROJECT_NAME/api:latest
    docker tag $PROJECT_NAME/ai-service:latest $ECR_REGISTRY/$PROJECT_NAME/ai-service:latest
    
    # Push images
    docker push $ECR_REGISTRY/$PROJECT_NAME/app:latest
    docker push $ECR_REGISTRY/$PROJECT_NAME/api:latest
    docker push $ECJECT_NAME/ai-service:latest
    
    log_success "Docker images built and pushed successfully"
}

# Deploy smart contracts
deploy_smart_contracts() {
    log_info "Deploying smart contracts..."
    
    cd contracts
    
    # Install dependencies
    npm install
    
    # Setup environment
    cp .env.example .env
    
    # Update .env with deployment values
    sed -i "s/ETHEREUM_RPC_URL=.*/ETHEREUM_RPC_URL=https:\/\/mainnet.infura.io\/v3\/$INFURA_PROJECT_ID/" .env
    sed -i "s/POLYGON_RPC_URL=.*/POLYGON_RPC_URL=https:\/\/polygon-rpc.com/" .env
    sed -i "s/PRIVATE_KEY=.*/PRIVATE_KEY=$DEPLOYER_PRIVATE_KEY/" .env
    
    # Compile contracts
    npx hardhat compile
    
    # Deploy to testnet first
    npx hardhat run scripts/deploy.js --network polygon
    
    # Get contract addresses
    GAMING_CORE_ADDRESS=$(npx hardhat run scripts/get-addresses.js --network polygon | grep GamingCore | cut -d'=' -f2)
    GDI_TOKEN_ADDRESS=$(npx hardhat run scripts/get-addresses.js --network polygon | grep GDIToken | cut -d'=' -f2)
    BRIDGE_ADDRESS=$(npx hardhat run scripts/get-addresses.js --network polygon | grep Bridge | cut -d'=' -f2)
    NFT_MARKETPLACE_ADDRESS=$(npx hardhat run scripts/get-addresses.js --network polygon | grep NFTMarketplace | cut -d'=' -f2)
    AI_ORACLE_ADDRESS=$(npx hardhat run scripts/get-addresses.js --network polygon | grep AIOracle | cut -d'=' -f2)
    
    # Verify contracts
    npx hardhat verify --network polygon $GAMING_CORE_ADDRESS
    npx hardhat verify --network polygon $GDI_TOKEN_ADDRESS
    npx hardhat verify --network polygon $BRIDGE_ADDRESS
    npx hardhat verify --network polygon $NFT_MARKETPLACE_ADDRESS
    npx hardhat verify --network polygon $AI_ORACLE_ADDRESS
    
    log_success "Smart contracts deployed successfully"
}

# Deploy Kubernetes resources
deploy_kubernetes() {
    log_info "Deploying Kubernetes resources..."
    
    cd ../k8s
    
    # Create namespace
    kubectl create namespace $PROJECT_NAME-$ENVIRONMENT --dry-run=client -o yaml | kubectl apply -f -
    
    # Create secrets
    kubectl create secret generic $PROJECT_NAME-secrets \
        --from-literal=database-url="postgresql://user:pass@$RDS_ENDPOINT:5432/gamedin_l3" \
        --from-literal=redis-url="redis://$REDIS_ENDPOINT:6379" \
        --from-literal=jwt-secret="$JWT_SECRET" \
        --from-literal=nova-sanctum-api-key="$NOVA_SANCTUM_API_KEY" \
        --from-literal=athena-mist-api-key="$ATHENA_MIST_API_KEY" \
        --namespace $PROJECT_NAME-$ENVIRONMENT --dry-run=client -o yaml | kubectl apply -f -
    
    # Create configmaps
    kubectl create configmap $PROJECT_NAME-config \
        --from-literal=environment=$ENVIRONMENT \
        --from-literal=domain-name=$FULL_DOMAIN_NAME \
        --from-literal=gaming-core-address=$GAMING_CORE_ADDRESS \
        --from-literal=gdi-token-address=$GDI_TOKEN_ADDRESS \
        --from-literal=bridge-address=$BRIDGE_ADDRESS \
        --from-literal=nft-marketplace-address=$NFT_MARKETPLACE_ADDRESS \
        --from-literal=ai-oracle-address=$AI_ORACLE_ADDRESS \
        --namespace $PROJECT_NAME-$ENVIRONMENT --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy applications
    kubectl apply -f app-deployment.yaml
    kubectl apply -f api-deployment.yaml
    kubectl apply -f ai-service-deployment.yaml
    
    # Deploy services
    kubectl apply -f app-service.yaml
    kubectl apply -f api-service.yaml
    kubectl apply -f ai-service.yaml
    
    # Deploy ingress
    kubectl apply -f ingress.yaml
    
    # Wait for deployments to be ready
    kubectl wait --for=condition=available --timeout=300s deployment/app -n $PROJECT_NAME-$ENVIRONMENT
    kubectl wait --for=condition=available --timeout=300s deployment/api -n $PROJECT_NAME-$ENVIRONMENT
    kubectl wait --for=condition=available --timeout=300s deployment/ai-service -n $PROJECT_NAME-$ENVIRONMENT
    
    log_success "Kubernetes resources deployed successfully"
}

# Deploy monitoring stack
deploy_monitoring() {
    log_info "Deploying monitoring stack..."
    
    # Create monitoring namespace
    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy Prometheus
    kubectl apply -f monitoring/prometheus.yaml
    
    # Deploy Grafana
    kubectl apply -f monitoring/grafana.yaml
    
    # Deploy AlertManager
    kubectl apply -f monitoring/alertmanager.yaml
    
    # Import Grafana dashboards
    kubectl port-forward svc/grafana 3000:3000 -n monitoring &
    GRAFANA_PID=$!
    
    sleep 10
    
    # Import dashboards
    curl -X POST http://admin:admin@localhost:3000/api/dashboards/db \
        -H "Content-Type: application/json" \
        -d @monitoring/dashboards/system-overview.json
    
    curl -X POST http://admin:admin@localhost:3000/api/dashboards/db \
        -H "Content-Type: application/json" \
        -d @monitoring/dashboards/gaming-performance.json
    
    curl -X POST http://admin:admin@localhost:3000/api/dashboards/db \
        -H "Content-Type: application/json" \
        -d @monitoring/dashboards/ai-services.json
    
    kill $GRAFANA_PID
    
    log_success "Monitoring stack deployed successfully"
}

# Setup DNS and SSL
setup_dns_ssl() {
    log_info "Setting up DNS and SSL certificates..."
    
    # Get hosted zone ID
    HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='$DOMAIN_NAME.'].Id" --output text | cut -d'/' -f3)
    
    # Create DNS records
    cat > dns-records.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$FULL_DOMAIN_NAME",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "$ALB_DNS_NAME",
          "EvaluateTargetHealth": true
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.$FULL_DOMAIN_NAME",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "$ALB_DNS_NAME",
          "EvaluateTargetHealth": true
        }
      }
    }
  ]
}
EOF
    
    aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch file://dns-records.json
    
    # Request SSL certificate
    CERTIFICATE_ARN=$(aws acm request-certificate \
        --domain-name $FULL_DOMAIN_NAME \
        --subject-alternative-names "*.$FULL_DOMAIN_NAME" \
        --validation-method DNS \
        --query CertificateArn --output text)
    
    log_info "SSL certificate requested. Please add DNS validation records."
    log_info "Certificate ARN: $CERTIFICATE_ARN"
    
    log_success "DNS and SSL setup initiated"
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Check application health
    APP_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://$FULL_DOMAIN_NAME/health)
    API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://api.$FULL_DOMAIN_NAME/health)
    
    if [ "$APP_HEALTH" = "200" ] && [ "$API_HEALTH" = "200" ]; then
        log_success "Health checks passed"
    else
        log_error "Health checks failed"
        log_error "App health: $APP_HEALTH"
        log_error "API health: $API_HEALTH"
        exit 1
    fi
}

# Run performance tests
run_performance_tests() {
    log_info "Running performance tests..."
    
    cd ../tests
    
    # Install test dependencies
    npm install
    
    # Run load tests
    npm run test:load
    
    # Run stress tests
    npm run test:stress
    
    log_success "Performance tests completed"
}

# Generate deployment report
generate_report() {
    log_info "Generating deployment report..."
    
    cat > deployment-report.md << EOF
# GameDin L3 + AthenaMist AI Deployment Report

## Deployment Summary
- **Environment**: $ENVIRONMENT
- **Region**: $AWS_REGION
- **Domain**: $FULL_DOMAIN_NAME
- **Deployment Time**: $(date)

## Infrastructure
- **EKS Cluster**: $CLUSTER_NAME
- **RDS Endpoint**: $RDS_ENDPOINT
- **Redis Endpoint**: $REDIS_ENDPOINT
- **Load Balancer**: $ALB_DNS_NAME

## Smart Contracts
- **GamingCore**: $GAMING_CORE_ADDRESS
- **GDIToken**: $GDI_TOKEN_ADDRESS
- **Bridge**: $BRIDGE_ADDRESS
- **NFTMarketplace**: $NFT_MARKETPLACE_ADDRESS
- **AIOracle**: $AI_ORACLE_ADDRESS

## Access URLs
- **Application**: https://$FULL_DOMAIN_NAME
- **API**: https://api.$FULL_DOMAIN_NAME
- **Dashboard**: https://dashboard.$FULL_DOMAIN_NAME
- **Monitoring**: https://monitoring.$FULL_DOMAIN_NAME

## Next Steps
1. Configure DNS validation for SSL certificate
2. Set up CI/CD pipeline
3. Configure monitoring alerts
4. Perform security audit
5. Load test the system

## Support
For support, contact the development team or check the documentation.
EOF
    
    log_success "Deployment report generated: deployment-report.md"
}

# Main deployment function
main() {
    log_info "Starting GameDin L3 + AthenaMist AI deployment"
    log_info "Environment: $ENVIRONMENT"
    log_info "Region: $AWS_REGION"
    log_info "Domain: $FULL_DOMAIN_NAME"
    
    # Check if user wants to proceed
    if [ "$SKIP_CONFIRMATION" != "true" ]; then
        read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Run deployment steps
    check_prerequisites
    initialize_deployment
    deploy_infrastructure
    build_and_push_images
    deploy_smart_contracts
    deploy_kubernetes
    deploy_monitoring
    setup_dns_ssl
    run_health_checks
    run_performance_tests
    generate_report
    
    log_success "Deployment completed successfully!"
    log_info "Check deployment-report.md for details"
}

# Handle script arguments
case "${1:-}" in
    "dev"|"staging"|"prod")
        ENVIRONMENT_NUM=$(case $1 in
            "dev") echo "0" ;;
            "staging") echo "1" ;;
            "prod") echo "2" ;;
        esac)
        main
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [environment] [region] [domain] [skip-confirmation]"
        echo "  environment: dev, staging, or prod (default: dev)"
        echo "  region: AWS region (default: us-east-1)"
        echo "  domain: Domain name (default: gamedin-l3.com)"
        echo "  skip-confirmation: true/false (default: false)"
        echo ""
        echo "Examples:"
        echo "  $0 dev"
        echo "  $0 staging us-west-2 staging.gamedin-l3.com"
        echo "  $0 prod us-east-1 gamedin-l3.com true"
        ;;
    *)
        log_error "Invalid environment. Use: dev, staging, or prod"
        log_info "Run '$0 help' for usage information"
        exit 1
        ;;
esac 