#!/bin/bash

# GameDin L3 Infrastructure Setup
# Production-ready infrastructure with Docker, Kubernetes, and cloud deployment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🏗️ GameDin L3 Infrastructure Setup${NC}"
echo -e "${PURPLE}===================================${NC}"

# Create Docker configurations
create_docker_configs() {
    echo -e "${YELLOW}🐳 Creating Docker configurations...${NC}"
    
    # Main Dockerfile for L3 node
    cat > infrastructure/docker/Dockerfile.l3-node << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S gamedin && \
    adduser -S gamedin -u 1001

# Set permissions
RUN chown -R gamedin:gamedin /app
USER gamedin

# Expose ports
EXPOSE 8545 8546 9546

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8545/health || exit 1

# Start the node
CMD ["npm", "start"]
EOF

    # Docker Compose for development
    cat > infrastructure/docker/docker-compose.yml << 'EOF'
version: '3.8'

services:
  l3-node:
    build:
      context: ../../l3-node
      dockerfile: ../infrastructure/docker/Dockerfile.l3-node
    ports:
      - "8545:8545"
      - "8546:8546"
    environment:
      - NODE_ENV=development
      - CHAIN_ID=1337420
      - SETTLEMENT_LAYER=base-sepolia
    volumes:
      - l3-data:/app/data
      - ./config:/app/config
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8545/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  bridge-relayer:
    build:
      context: ../../bridge-relayer
      dockerfile: ../infrastructure/docker/Dockerfile.bridge
    environment:
      - NODE_ENV=development
      - L3_RPC_URL=http://l3-node:8545
      - BASE_RPC_URL=${BASE_RPC_URL}
    depends_on:
      - l3-node
    restart: unless-stopped

  real-time-engine:
    build:
      context: ../../real-time-engine
      dockerfile: ../infrastructure/docker/Dockerfile.gaming
    ports:
      - "9546:9546"
    environment:
      - L3_RPC_URL=http://l3-node:8545
      - WEBSOCKET_PORT=9546
    depends_on:
      - l3-node
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=gamedin_l3
      - POSTGRES_USER=gamedin
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

  monitoring:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana:/etc/grafana/provisioning
    restart: unless-stopped

volumes:
  l3-data:
  postgres-data:
  redis-data:
  prometheus-data:
  grafana-data:

networks:
  default:
    name: gamedin-l3-network
EOF

    echo -e "${GREEN}✅ Docker configurations created${NC}"
}

# Create Kubernetes manifests
create_kubernetes_configs() {
    echo -e "${YELLOW}☸️ Creating Kubernetes configurations...${NC}"
    
    mkdir -p infrastructure/kubernetes/{manifests,helm}
    
    # Namespace
    cat > infrastructure/kubernetes/manifests/namespace.yaml << 'EOF'
apiVersion: v1
kind: Namespace
metadata:
  name: gamedin-l3
  labels:
    name: gamedin-l3
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: gamedin-l3-config
  namespace: gamedin-l3
data:
  CHAIN_ID: "1337420"
  SETTLEMENT_LAYER: "base"
  MAX_TPS: "10000"
  ENABLE_GAS_SPONSORING: "true"
  ENABLE_NFT_BATCHING: "true"
EOF

    # L3 Node Deployment
    cat > infrastructure/kubernetes/manifests/l3-node.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gamedin-l3-node
  namespace: gamedin-l3
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gamedin-l3-node
  template:
    metadata:
      labels:
        app: gamedin-l3-node
    spec:
      containers:
      - name: l3-node
        image: gamedin/l3-node:latest
        ports:
        - containerPort: 8545
        - containerPort: 8546
        env:
        - name: NODE_ENV
          value: "production"
        - name: CHAIN_ID
          valueFrom:
            configMapKeyRef:
              name: gamedin-l3-config
              key: CHAIN_ID
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8545
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8545
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: l3-data
          mountPath: /app/data
      volumes:
      - name: l3-data
        persistentVolumeClaim:
          claimName: l3-node-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: gamedin-l3-service
  namespace: gamedin-l3
spec:
  selector:
    app: gamedin-l3-node
  ports:
  - name: rpc
    port: 8545
    targetPort: 8545
  - name: ws
    port: 8546
    targetPort: 8546
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: l3-node-pvc
  namespace: gamedin-l3
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: fast-ssd
EOF

    # Gaming Engine Deployment
    cat > infrastructure/kubernetes/manifests/gaming-engine.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gamedin-real-time-engine
  namespace: gamedin-l3
spec:
  replicas: 5
  selector:
    matchLabels:
      app: gamedin-real-time-engine
  template:
    metadata:
      labels:
        app: gamedin-real-time-engine
    spec:
      containers:
      - name: real-time-engine
        image: gamedin/real-time-engine:latest
        ports:
        - containerPort: 9546
        env:
        - name: L3_RPC_URL
          value: "http://gamedin-l3-service:8545"
        - name: WEBSOCKET_PORT
          value: "9546"
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: gamedin-gaming-service
  namespace: gamedin-l3
spec:
  selector:
    app: gamedin-real-time-engine
  ports:
  - name: websocket
    port: 9546
    targetPort: 9546
  type: LoadBalancer
EOF

    # Helm Chart
    cat > infrastructure/kubernetes/helm/Chart.yaml << 'EOF'
apiVersion: v2
name: gamedin-l3
description: GameDin Layer 3 Gaming Blockchain
type: application
version: 1.0.0
appVersion: 1.0.0
dependencies:
  - name: postgresql
    version: 12.x.x
    repository: https://charts.bitnami.com/bitnami
  - name: redis
    version: 17.x.x
    repository: https://charts.bitnami.com/bitnami
  - name: prometheus
    version: 23.x.x
    repository: https://prometheus-community.github.io/helm-charts
EOF

    echo -e "${GREEN}✅ Kubernetes configurations created${NC}"
}

# Create Terraform infrastructure
create_terraform_configs() {
    echo -e "${YELLOW}🏗️ Creating Terraform configurations...${NC}"
    
    mkdir -p infrastructure/terraform/{modules,environments/{dev,staging,prod}}
    
    # Main Terraform configuration
    cat > infrastructure/terraform/main.tf << 'EOF'
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# EKS Cluster
module "eks" {
  source = "./modules/eks"
  
  cluster_name    = var.cluster_name
  cluster_version = var.kubernetes_version
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  node_groups = {
    gamedin_nodes = {
      desired_capacity = var.node_desired_capacity
      max_capacity     = var.node_max_capacity
      min_capacity     = var.node_min_capacity
      instance_types   = ["c5.2xlarge"]
      
      k8s_labels = {
        Environment = var.environment
        Application = "gamedin-l3"
      }
    }
  }
  
  tags = local.common_tags
}

# VPC
module "vpc" {
  source = "./modules/vpc"
  
  name = "${var.cluster_name}-vpc"
  cidr = var.vpc_cidr
  
  azs             = data.aws_availability_zones.available.names
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  
  tags = local.common_tags
}

# RDS for game data
module "rds" {
  source = "./modules/rds"
  
  identifier = "${var.cluster_name}-gamedb"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r6g.large"
  allocated_storage = 100
  
  db_name  = "gamedin_l3"
  username = "gamedin"
  
  vpc_security_group_ids = [module.security_groups.rds_sg_id]
  db_subnet_group_name   = module.vpc.database_subnet_group
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  tags = local.common_tags
}

# ElastiCache for Redis
module "elasticache" {
  source = "./modules/elasticache"
  
  cluster_id = "${var.cluster_name}-redis"
  
  engine               = "redis"
  node_type           = "cache.r6g.large"
  num_cache_nodes     = 1
  parameter_group_name = "default.redis7"
  port                = 6379
  
  subnet_group_name = module.vpc.elasticache_subnet_group
  security_group_ids = [module.security_groups.redis_sg_id]
  
  tags = local.common_tags
}

# Load Balancer
module "alb" {
  source = "./modules/alb"
  
  name = "${var.cluster_name}-alb"
  
  vpc_id  = module.vpc.vpc_id
  subnets = module.vpc.public_subnets
  
  security_groups = [module.security_groups.alb_sg_id]
  
  tags = local.common_tags
}

locals {
  common_tags = {
    Environment = var.environment
    Project     = "gamedin-l3"
    ManagedBy   = "terraform"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}
EOF

    # Variables
    cat > infrastructure/terraform/variables.tf << 'EOF'
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "vpc_cidr" {
  description = "CIDR for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnets" {
  description = "Private subnet CIDRs"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnets" {
  description = "Public subnet CIDRs"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "node_desired_capacity" {
  description = "Desired number of nodes"
  type        = number
  default     = 3
}

variable "node_max_capacity" {
  description = "Maximum number of nodes"
  type        = number
  default     = 10
}

variable "node_min_capacity" {
  description = "Minimum number of nodes"
  type        = number
  default     = 1
}
EOF

    # Production environment
    cat > infrastructure/terraform/environments/prod/terraform.tfvars << 'EOF'
aws_region  = "us-west-2"
environment = "production"
cluster_name = "gamedin-l3-prod"

# High-performance configuration for production
node_desired_capacity = 5
node_max_capacity     = 20
node_min_capacity     = 3

vpc_cidr = "10.0.0.0/16"
private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
EOF

    echo -e "${GREEN}✅ Terraform configurations created${NC}"
}

# Create monitoring and observability
create_monitoring_configs() {
    echo -e "${YELLOW}📊 Creating monitoring configurations...${NC}"
    
    mkdir -p monitoring/{prometheus,grafana,alerts}
    
    # Prometheus configuration
    cat > monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'gamedin-l3-node'
    static_configs:
      - targets: ['l3-node:8545']
    metrics_path: /metrics
    scrape_interval: 5s

  - job_name: 'gamedin-gaming-engine'
    static_configs:
      - targets: ['real-time-engine:9546']
    metrics_path: /metrics
    scrape_interval: 5s

  - job_name: 'gamedin-bridge'
    static_configs:
      - targets: ['bridge-relayer:8080']
    metrics_path: /metrics
    scrape_interval: 10s

  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
EOF

    # Grafana dashboard for GameDin L3
    cat > monitoring/grafana/gamedin-l3-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "GameDin L3 Performance Dashboard",
    "tags": ["gamedin", "l3", "gaming"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Transactions Per Second",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(gamedin_l3_transactions_total[1m])",
            "legendFormat": "TPS"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "palette-classic"},
            "custom": {"displayMode": "lcd"},
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 5000},
                {"color": "red", "value": 8000}
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "title": "Active Players",
        "type": "stat",
        "targets": [
          {
            "expr": "gamedin_l3_active_players",
            "legendFormat": "Active Players"
          }
        ]
      },
      {
        "id": 3,
        "title": "Game Rewards Distribution",
        "type": "timeseries",
        "targets": [
          {
            "expr": "rate(gamedin_l3_rewards_distributed_total[5m])",
            "legendFormat": "Rewards/min"
          }
        ]
      },
      {
        "id": 4,
        "title": "Node Health",
        "type": "table",
        "targets": [
          {
            "expr": "up{job=\"gamedin-l3-node\"}",
            "legendFormat": "{{instance}}"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
EOF

    # Alert rules
    cat > monitoring/alerts/gamedin-l3-alerts.yml << 'EOF'
groups:
  - name: gamedin-l3-alerts
    rules:
      - alert: GameDinL3NodeDown
        expr: up{job="gamedin-l3-node"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "GameDin L3 node is down"
          description: "GameDin L3 node {{ $labels.instance }} has been down for more than 1 minute."

      - alert: HighTransactionLatency
        expr: gamedin_l3_transaction_latency_seconds > 5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High transaction latency"
          description: "Transaction latency is {{ $value }} seconds on {{ $labels.instance }}"

      - alert: LowTPS
        expr: rate(gamedin_l3_transactions_total[1m]) < 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low TPS detected"
          description: "TPS is only {{ $value }} on GameDin L3"

      - alert: BridgeFailure
        expr: gamedin_l3_bridge_failures_total > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Bridge failure detected"
          description: "Cross-chain bridge has failed {{ $value }} times"

      - alert: SuspiciousActivity
        expr: increase(gamedin_l3_fraud_attempts_total[5m]) > 10
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Suspicious activity detected"
          description: "{{ $value }} fraud attempts detected in the last 5 minutes"
EOF

    echo -e "${GREEN}✅ Monitoring configurations created${NC}"
}

# Create deployment scripts
create_deployment_scripts() {
    echo -e "${YELLOW}🚀 Creating deployment scripts...${NC}"
    
    mkdir -p infrastructure/scripts
    
    # Production deployment script
    cat > infrastructure/scripts/deploy-production.sh << 'EOF'
#!/bin/bash

set -e

echo "🚀 Deploying GameDin L3 to Production"

# Variables
ENVIRONMENT="production"
AWS_REGION="us-west-2"
CLUSTER_NAME="gamedin-l3-prod"

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    command -v terraform >/dev/null 2>&1 || { echo "❌ Terraform is required"; exit 1; }
    command -v kubectl >/dev/null 2>&1 || { echo "❌ kubectl is required"; exit 1; }
    command -v helm >/dev/null 2>&1 || { echo "❌ Helm is required"; exit 1; }
    command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required"; exit 1; }
    
    echo "✅ Prerequisites satisfied"
}

# Deploy infrastructure
deploy_infrastructure() {
    echo "🏗️ Deploying infrastructure..."
    
    cd infrastructure/terraform/environments/prod
    
    terraform init
    terraform plan -var-file=terraform.tfvars
    terraform apply -var-file=terraform.tfvars -auto-approve
    
    # Get cluster credentials
    aws eks update-kubeconfig --region $AWS_REGION --name $CLUSTER_NAME
    
    echo "✅ Infrastructure deployed"
}

# Deploy applications
deploy_applications() {
    echo "📦 Deploying applications..."
    
    # Apply Kubernetes manifests
    kubectl apply -f ../kubernetes/manifests/
    
    # Install Helm chart
    helm upgrade --install gamedin-l3 ../kubernetes/helm/ \
        --namespace gamedin-l3 \
        --create-namespace \
        --set environment=$ENVIRONMENT \
        --set image.tag=latest
    
    echo "✅ Applications deployed"
}

# Setup monitoring
setup_monitoring() {
    echo "📊 Setting up monitoring..."
    
    # Install Prometheus
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        --values ../monitoring/prometheus-values.yaml
    
    # Import Grafana dashboards
    kubectl create configmap grafana-dashboards \
        --from-file=../monitoring/grafana/ \
        --namespace monitoring
    
    echo "✅ Monitoring setup complete"
}

# Main execution
main() {
    check_prerequisites
    deploy_infrastructure
    deploy_applications
    setup_monitoring
    
    echo ""
    echo "🎉 GameDin L3 Production Deployment Complete!"
    echo ""
    echo "📊 Access URLs:"
    echo "• Grafana: kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80"
    echo "• L3 RPC: kubectl port-forward -n gamedin-l3 svc/gamedin-l3-service 8545:8545"
    echo "• Gaming WS: kubectl port-forward -n gamedin-l3 svc/gamedin-gaming-service 9546:9546"
}

main "$@"
EOF

    # Development deployment script
    cat > infrastructure/scripts/deploy-dev.sh << 'EOF'
#!/bin/bash

set -e

echo "🧪 Setting up GameDin L3 Development Environment"

# Start local development environment
start_dev_environment() {
    echo "🚀 Starting development environment..."
    
    # Build all Docker images
    docker-compose -f infrastructure/docker/docker-compose.yml build
    
    # Start all services
    docker-compose -f infrastructure/docker/docker-compose.yml up -d
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to be ready..."
    sleep 30
    
    # Deploy contracts to local network
    cd core
    npm run deploy:local
    
    echo "✅ Development environment ready"
}

# Setup development data
setup_dev_data() {
    echo "📊 Setting up development data..."
    
    # Create test players
    node ../tools/create-test-data.js
    
    # Setup monitoring
    docker-compose -f infrastructure/docker/docker-compose.yml \
        exec prometheus \
        promtool config check /etc/prometheus/prometheus.yml
    
    echo "✅ Development data setup complete"
}

# Main execution
main() {
    start_dev_environment
    setup_dev_data
    
    echo ""
    echo "🎉 GameDin L3 Development Environment Ready!"
    echo ""
    echo "🔗 Local URLs:"
    echo "• L3 RPC: http://localhost:8545"
    echo "• Gaming WebSocket: ws://localhost:9546"
    echo "• Grafana: http://localhost:3000 (admin/admin)"
    echo "• Prometheus: http://localhost:9090"
    echo ""
    echo "📋 Next steps:"
    echo "1. npm run test (Run tests)"
    echo "2. npm run start:frontend (Start web interface)"
    echo "3. Open http://localhost:3000 for monitoring"
}

main "$@"
EOF

    chmod +x infrastructure/scripts/*.sh

    echo -e "${GREEN}✅ Deployment scripts created${NC}"
}

# Main execution
main() {
    echo -e "${PURPLE}🏗️ Creating production-ready infrastructure...${NC}"
    
    create_docker_configs
    create_kubernetes_configs
    create_terraform_configs
    create_monitoring_configs
    create_deployment_scripts
    
    echo ""
    echo -e "${GREEN}🎉 GameDin L3 Infrastructure Setup Complete!${NC}"
    echo ""
    echo -e "${BLUE}📁 Infrastructure Components:${NC}"
    echo -e "• 🐳 Docker configurations for all services"
    echo -e "• ☸️ Kubernetes manifests for production deployment"
    echo -e "• 🏗️ Terraform modules for AWS infrastructure"
    echo -e "• 📊 Prometheus & Grafana monitoring setup"
    echo -e "• 🚀 Automated deployment scripts"
    echo ""
    echo -e "${YELLOW}🚀 Quick Deploy Commands:${NC}"
    echo -e "• Development: ${GREEN}./infrastructure/scripts/deploy-dev.sh${NC}"
    echo -e "• Production: ${GREEN}./infrastructure/scripts/deploy-production.sh${NC}"
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 