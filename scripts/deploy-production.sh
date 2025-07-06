#!/bin/bash

# GameDin L3 + AthenaMist AI Production Deployment Script
# This script deploys the complete gaming blockchain ecosystem to production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="gamedin-l3"
NAMESPACE="gamedin-production"
REGISTRY="gcr.io/gamedin-l3"
VERSION=$(git describe --tags --always)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Environment variables
export KUBECONFIG=${KUBECONFIG:-~/.kube/config}
export DOCKER_REGISTRY=${DOCKER_REGISTRY:-$REGISTRY}
export IMAGE_TAG=${IMAGE_TAG:-$VERSION}

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Starting pre-deployment checks..."
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed or not in PATH"
    fi
    
    # Check if docker is available
    if ! command -v docker &> /dev/null; then
        error "docker is not installed or not in PATH"
    fi
    
    # Check if helm is available
    if ! command -v helm &> /dev/null; then
        error "helm is not installed or not in PATH"
    fi
    
    # Check Kubernetes cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster"
    fi
    
    # Check if namespace exists
    if ! kubectl get namespace $NAMESPACE &> /dev/null; then
        log "Creating namespace $NAMESPACE"
        kubectl create namespace $NAMESPACE
    fi
    
    # Check required secrets
    required_secrets=(
        "gamedin-db-credentials"
        "gamedin-redis-credentials"
        "gamedin-jwt-secret"
        "gamedin-ai-api-keys"
        "gamedin-blockchain-keys"
        "gamedin-monitoring-credentials"
    )
    
    for secret in "${required_secrets[@]}"; do
        if ! kubectl get secret $secret -n $NAMESPACE &> /dev/null; then
            error "Required secret $secret not found in namespace $NAMESPACE"
        fi
    done
    
    log "Pre-deployment checks completed successfully"
}

# Build and push Docker images
build_and_push_images() {
    log "Building and pushing Docker images..."
    
    # Build API Gateway
    log "Building API Gateway image..."
    docker build -t $DOCKER_REGISTRY/api-gateway:$IMAGE_TAG -f docker/api-gateway.Dockerfile .
    docker push $DOCKER_REGISTRY/api-gateway:$IMAGE_TAG
    
    # Build Gaming Engine
    log "Building Gaming Engine image..."
    docker build -t $DOCKER_REGISTRY/gaming-engine:$IMAGE_TAG -f docker/gaming-engine.Dockerfile .
    docker push $DOCKER_REGISTRY/gaming-engine:$IMAGE_TAG
    
    # Build AI Services
    log "Building AI Services image..."
    docker build -t $DOCKER_REGISTRY/ai-services:$IMAGE_TAG -f docker/ai-services.Dockerfile .
    docker push $DOCKER_REGISTRY/ai-services:$IMAGE_TAG
    
    # Build Frontend DApp
    log "Building Frontend DApp image..."
    docker build -t $DOCKER_REGISTRY/frontend:$IMAGE_TAG -f docker/frontend.Dockerfile ./gdi-dapp
    docker push $DOCKER_REGISTRY/frontend:$IMAGE_TAG
    
    # Build Bridge Relayer
    log "Building Bridge Relayer image..."
    docker build -t $DOCKER_REGISTRY/bridge-relayer:$IMAGE_TAG -f docker/bridge-relayer.Dockerfile .
    docker push $DOCKER_REGISTRY/bridge-relayer:$IMAGE_TAG
    
    # Build Monitoring Stack
    log "Building Monitoring Stack images..."
    docker build -t $DOCKER_REGISTRY/monitoring:$IMAGE_TAG -f docker/monitoring.Dockerfile ./monitoring
    docker push $DOCKER_REGISTRY/monitoring:$IMAGE_TAG
    
    log "All Docker images built and pushed successfully"
}

# Deploy infrastructure components
deploy_infrastructure() {
    log "Deploying infrastructure components..."
    
    # Deploy PostgreSQL
    log "Deploying PostgreSQL..."
    helm upgrade --install postgresql bitnami/postgresql \
        --namespace $NAMESPACE \
        --set postgresqlPassword.secretName=gamedin-db-credentials \
        --set postgresqlPassword.secretKey=password \
        --set postgresqlDatabase=gamedin \
        --set persistence.size=100Gi \
        --set resources.requests.memory=1Gi \
        --set resources.requests.cpu=500m \
        --set resources.limits.memory=4Gi \
        --set resources.limits.cpu=2 \
        --wait --timeout=10m
    
    # Deploy Redis
    log "Deploying Redis..."
    helm upgrade --install redis bitnami/redis \
        --namespace $NAMESPACE \
        --set auth.secretName=gamedin-redis-credentials \
        --set persistence.size=50Gi \
        --set resources.requests.memory=512Mi \
        --set resources.requests.cpu=250m \
        --set resources.limits.memory=2Gi \
        --set resources.limits.cpu=1 \
        --wait --timeout=10m
    
    # Deploy RabbitMQ for message queuing
    log "Deploying RabbitMQ..."
    helm upgrade --install rabbitmq bitnami/rabbitmq \
        --namespace $NAMESPACE \
        --set auth.password.secretName=gamedin-rabbitmq-credentials \
        --set persistence.size=20Gi \
        --set resources.requests.memory=512Mi \
        --set resources.requests.cpu=250m \
        --set resources.limits.memory=2Gi \
        --set resources.limits.cpu=1 \
        --wait --timeout=10m
    
    log "Infrastructure components deployed successfully"
}

# Deploy smart contracts
deploy_smart_contracts() {
    log "Deploying smart contracts..."
    
    # Deploy to Ethereum mainnet
    log "Deploying to Ethereum mainnet..."
    npx hardhat run scripts/deploy-mainnet.ts --network mainnet
    
    # Deploy to Polygon
    log "Deploying to Polygon..."
    npx hardhat run scripts/deploy-polygon.ts --network polygon
    
    # Deploy to BSC
    log "Deploying to BSC..."
    npx hardhat run scripts/deploy-bsc.ts --network bsc
    
    # Verify contracts on Etherscan
    log "Verifying contracts on Etherscan..."
    npx hardhat verify --network mainnet
    npx hardhat verify --network polygon
    npx hardhat verify --network bsc
    
    log "Smart contracts deployed and verified successfully"
}

# Deploy core services
deploy_core_services() {
    log "Deploying core services..."
    
    # Deploy API Gateway
    log "Deploying API Gateway..."
    kubectl apply -f k8s/api-gateway.yaml -n $NAMESPACE
    
    # Deploy Gaming Engine
    log "Deploying Gaming Engine..."
    kubectl apply -f k8s/gaming-engine.yaml -n $NAMESPACE
    
    # Deploy AI Services
    log "Deploying AI Services..."
    kubectl apply -f k8s/ai-services.yaml -n $NAMESPACE
    
    # Deploy Bridge Relayer
    log "Deploying Bridge Relayer..."
    kubectl apply -f k8s/bridge-relayer.yaml -n $NAMESPACE
    
    # Deploy Frontend DApp
    log "Deploying Frontend DApp..."
    kubectl apply -f k8s/frontend.yaml -n $NAMESPACE
    
    # Wait for deployments to be ready
    log "Waiting for core services to be ready..."
    kubectl wait --for=condition=available --timeout=10m deployment/api-gateway -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=10m deployment/gaming-engine -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=10m deployment/ai-services -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=10m deployment/bridge-relayer -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=10m deployment/frontend -n $NAMESPACE
    
    log "Core services deployed successfully"
}

# Deploy monitoring stack
deploy_monitoring() {
    log "Deploying monitoring stack..."
    
    # Deploy Prometheus
    log "Deploying Prometheus..."
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace $NAMESPACE \
        --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
        --set grafana.adminPassword.secretName=gamedin-monitoring-credentials \
        --set grafana.adminPassword.secretKey=admin-password \
        --wait --timeout=10m
    
    # Deploy Grafana dashboards
    log "Deploying Grafana dashboards..."
    kubectl apply -f monitoring/grafana-dashboards.yaml -n $NAMESPACE
    
    # Deploy AlertManager
    log "Deploying AlertManager..."
    kubectl apply -f monitoring/alertmanager.yaml -n $NAMESPACE
    
    # Deploy custom metrics
    log "Deploying custom metrics..."
    kubectl apply -f monitoring/custom-metrics.yaml -n $NAMESPACE
    
    log "Monitoring stack deployed successfully"
}

# Deploy ingress and load balancer
deploy_ingress() {
    log "Deploying ingress and load balancer..."
    
    # Deploy NGINX Ingress Controller
    log "Deploying NGINX Ingress Controller..."
    helm upgrade --install nginx-ingress ingress-nginx/ingress-nginx \
        --namespace $NAMESPACE \
        --set controller.replicaCount=3 \
        --set controller.resources.requests.memory=256Mi \
        --set controller.resources.requests.cpu=100m \
        --set controller.resources.limits.memory=1Gi \
        --set controller.resources.limits.cpu=500m \
        --wait --timeout=10m
    
    # Deploy Ingress rules
    log "Deploying Ingress rules..."
    kubectl apply -f k8s/ingress.yaml -n $NAMESPACE
    
    # Deploy SSL certificates
    log "Deploying SSL certificates..."
    kubectl apply -f k8s/certificates.yaml -n $NAMESPACE
    
    log "Ingress and load balancer deployed successfully"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Create migration job
    kubectl apply -f k8s/migrations.yaml -n $NAMESPACE
    
    # Wait for migration to complete
    log "Waiting for database migrations to complete..."
    kubectl wait --for=condition=complete --timeout=10m job/db-migration -n $NAMESPACE
    
    # Check migration status
    if [ $? -eq 0 ]; then
        log "Database migrations completed successfully"
    else
        error "Database migrations failed"
    fi
}

# Health checks
health_checks() {
    log "Running health checks..."
    
    # Check API Gateway
    log "Checking API Gateway health..."
    API_GATEWAY_URL=$(kubectl get svc api-gateway -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if ! curl -f http://$API_GATEWAY_URL/health; then
        error "API Gateway health check failed"
    fi
    
    # Check Gaming Engine
    log "Checking Gaming Engine health..."
    GAMING_ENGINE_URL=$(kubectl get svc gaming-engine -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if ! curl -f http://$GAMING_ENGINE_URL/health; then
        error "Gaming Engine health check failed"
    fi
    
    # Check AI Services
    log "Checking AI Services health..."
    AI_SERVICES_URL=$(kubectl get svc ai-services -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if ! curl -f http://$AI_SERVICES_URL/health; then
        error "AI Services health check failed"
    fi
    
    # Check Frontend
    log "Checking Frontend health..."
    FRONTEND_URL=$(kubectl get svc frontend -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if ! curl -f http://$FRONTEND_URL; then
        error "Frontend health check failed"
    fi
    
    # Check database connectivity
    log "Checking database connectivity..."
    kubectl exec -n $NAMESPACE deployment/api-gateway -- pg_isready -h postgresql
    
    # Check Redis connectivity
    log "Checking Redis connectivity..."
    kubectl exec -n $NAMESPACE deployment/api-gateway -- redis-cli -h redis ping
    
    log "All health checks passed successfully"
}

# Performance testing
performance_testing() {
    log "Running performance tests..."
    
    # Run load tests
    log "Running load tests..."
    kubectl apply -f k8s/load-test.yaml -n $NAMESPACE
    
    # Wait for load test to complete
    kubectl wait --for=condition=complete --timeout=30m job/load-test -n $NAMESPACE
    
    # Get test results
    kubectl logs job/load-test -n $NAMESPACE > load-test-results-$TIMESTAMP.log
    
    log "Performance tests completed. Results saved to load-test-results-$TIMESTAMP.log"
}

# Security scanning
security_scanning() {
    log "Running security scans..."
    
    # Run container security scan
    log "Scanning container images for vulnerabilities..."
    for image in api-gateway gaming-engine ai-services frontend bridge-relayer; do
        trivy image $DOCKER_REGISTRY/$image:$IMAGE_TAG --severity HIGH,CRITICAL --format json > security-scan-$image-$TIMESTAMP.json
    done
    
    # Run Kubernetes security scan
    log "Scanning Kubernetes manifests for security issues..."
    kubesec scan k8s/ > kubesec-results-$TIMESTAMP.json
    
    # Run network policy validation
    log "Validating network policies..."
    kubectl apply -f k8s/network-policies.yaml -n $NAMESPACE
    
    log "Security scanning completed"
}

# Post-deployment tasks
post_deployment_tasks() {
    log "Running post-deployment tasks..."
    
    # Create backup schedule
    log "Setting up backup schedule..."
    kubectl apply -f k8s/backup-cronjob.yaml -n $NAMESPACE
    
    # Set up log aggregation
    log "Setting up log aggregation..."
    kubectl apply -f k8s/logging.yaml -n $NAMESPACE
    
    # Configure auto-scaling
    log "Configuring auto-scaling..."
    kubectl apply -f k8s/autoscaling.yaml -n $NAMESPACE
    
    # Set up monitoring alerts
    log "Setting up monitoring alerts..."
    kubectl apply -f monitoring/alerts.yaml -n $NAMESPACE
    
    log "Post-deployment tasks completed"
}

# Display deployment information
display_deployment_info() {
    log "Deployment completed successfully!"
    
    echo -e "${CYAN}"
    echo "=========================================="
    echo "GameDin L3 + AthenaMist AI Production"
    echo "=========================================="
    echo "Namespace: $NAMESPACE"
    echo "Version: $VERSION"
    echo "Timestamp: $TIMESTAMP"
    echo ""
    echo "Access URLs:"
    echo "Frontend: https://app.gamedin-l3.com"
    echo "API Gateway: https://api.gamedin-l3.com"
    echo "Grafana: https://monitoring.gamedin-l3.com"
    echo "Prometheus: https://prometheus.gamedin-l3.com"
    echo ""
    echo "Smart Contract Addresses:"
    echo "Ethereum Mainnet:"
    kubectl get configmap contract-addresses -n $NAMESPACE -o jsonpath='{.data.ethereum}'
    echo ""
    echo "Polygon:"
    kubectl get configmap contract-addresses -n $NAMESPACE -o jsonpath='{.data.polygon}'
    echo ""
    echo "BSC:"
    kubectl get configmap contract-addresses -n $NAMESPACE -o jsonpath='{.data.bsc}'
    echo ""
    echo "Monitoring:"
    echo "Dashboard: https://grafana.gamedin-l3.com"
    echo "Alerts: Check AlertManager for active alerts"
    echo ""
    echo "Documentation:"
    echo "API Docs: https://docs.gamedin-l3.com"
    echo "Deployment Guide: https://docs.gamedin-l3.com/deployment"
    echo "=========================================="
    echo -e "${NC}"
}

# Rollback function
rollback() {
    error "Deployment failed. Rolling back..."
    
    # Rollback deployments
    kubectl rollout undo deployment/api-gateway -n $NAMESPACE
    kubectl rollout undo deployment/gaming-engine -n $NAMESPACE
    kubectl rollout undo deployment/ai-services -n $NAMESPACE
    kubectl rollout undo deployment/frontend -n $NAMESPACE
    kubectl rollout undo deployment/bridge-relayer -n $NAMESPACE
    
    # Wait for rollback to complete
    kubectl wait --for=condition=available --timeout=10m deployment/api-gateway -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=10m deployment/gaming-engine -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=10m deployment/ai-services -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=10m deployment/frontend -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=10m deployment/bridge-relayer -n $NAMESPACE
    
    error "Rollback completed. Please check logs for issues."
}

# Main deployment function
main() {
    log "Starting GameDin L3 + AthenaMist AI production deployment..."
    
    # Set up error handling
    trap rollback ERR
    
    # Run deployment steps
    pre_deployment_checks
    build_and_push_images
    deploy_infrastructure
    deploy_smart_contracts
    deploy_core_services
    deploy_monitoring
    deploy_ingress
    run_migrations
    health_checks
    performance_testing
    security_scanning
    post_deployment_tasks
    
    # Display deployment information
    display_deployment_info
    
    log "Production deployment completed successfully!"
}

# Run main function
main "$@" 