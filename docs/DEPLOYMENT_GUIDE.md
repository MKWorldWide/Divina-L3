# GameDin L3 + AthenaMist AI Deployment Guide

## 🚀 Complete Deployment Guide

This guide provides comprehensive instructions for deploying the GameDin L3 + AthenaMist AI ecosystem across all environments (development, staging, and production).

## 📋 Prerequisites

### Required Tools
- **AWS CLI** v2.0+ with configured credentials
- **Terraform** v1.0+ 
- **Docker** v20.0+ with Docker Compose
- **kubectl** v1.28+
- **Node.js** v18+ and npm
- **Git** for version control
- **PowerShell** (Windows) or **Bash** (Linux/macOS)

### Required Accounts
- **AWS Account** with appropriate permissions
- **GitHub Account** for repository access
- **Domain Registrar** for custom domain
- **Docker Hub** or **AWS ECR** for container registry

### AWS Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "eks:*",
        "rds:*",
        "elasticache:*",
        "s3:*",
        "route53:*",
        "cloudwatch:*",
        "iam:*",
        "ecs:*",
        "elasticloadbalancing:*",
        "wafv2:*",
        "acm:*",
        "secretsmanager:*",
        "ssm:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🏗️ Infrastructure Deployment

### Step 1: Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/M-K-World-Wide/Divina-L3.git
cd Divina-L3

# Navigate to terraform directory
cd terraform
```

### Step 2: Configure Environment Variables

Create environment-specific configuration files:

#### Development Environment
```bash
# Create dev configuration
cat > terraform.tfvars.dev << EOF
project_name = "gamedin-l3-dev"
environment  = "dev"
aws_region   = "us-east-1"
domain_name  = "dev.gamedin-l3.com"

# VPC Configuration
vpc_cidr_block = "10.0.0.0/16"
azs = ["us-east-1a", "us-east-1b", "us-east-1c"]

# EKS Configuration
eks_cluster_version = "1.28"
eks_node_groups = {
  general = {
    instance_types = ["t3.small"]
    min_size       = 1
    max_size       = 2
    desired_size   = 1
  }
  gaming = {
    instance_types = ["t3.medium"]
    min_size       = 1
    max_size       = 2
    desired_size   = 1
  }
  ai = {
    instance_types = ["t3.large"]
    min_size       = 1
    max_size       = 1
    desired_size   = 1
  }
}

# RDS Configuration
rds_instance_class = "db.t3.micro"
rds_allocated_storage = 20

# Monitoring Configuration
alert_emails = ["dev-team@gamedin-l3.com"]
EOF
```

#### Staging Environment
```bash
# Create staging configuration
cat > terraform.tfvars.staging << EOF
project_name = "gamedin-l3-staging"
environment  = "staging"
aws_region   = "us-east-1"
domain_name  = "staging.gamedin-l3.com"

# VPC Configuration
vpc_cidr_block = "10.1.0.0/16"
azs = ["us-east-1a", "us-east-1b", "us-east-1c"]

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
    max_size       = 3
    desired_size   = 2
  }
  ai = {
    instance_types = ["g4dn.xlarge"]
    min_size       = 1
    max_size       = 2
    desired_size   = 1
  }
}

# RDS Configuration
rds_instance_class = "db.t3.small"
rds_allocated_storage = 50

# Monitoring Configuration
alert_emails = ["staging-team@gamedin-l3.com"]
EOF
```

#### Production Environment
```bash
# Create production configuration
cat > terraform.tfvars.prod << EOF
project_name = "gamedin-l3-prod"
environment  = "prod"
aws_region   = "us-east-1"
domain_name  = "gamedin-l3.com"

# VPC Configuration
vpc_cidr_block = "10.2.0.0/16"
azs = ["us-east-1a", "us-east-1b", "us-east-1c"]

# EKS Configuration
eks_cluster_version = "1.28"
eks_node_groups = {
  general = {
    instance_types = ["t3.large"]
    min_size       = 2
    max_size       = 5
    desired_size   = 3
  }
  gaming = {
    instance_types = ["c5.xlarge"]
    min_size       = 2
    max_size       = 10
    desired_size   = 4
  }
  ai = {
    instance_types = ["g4dn.2xlarge"]
    min_size       = 2
    max_size       = 5
    desired_size   = 3
  }
}

# RDS Configuration
rds_instance_class = "db.r5.large"
rds_allocated_storage = 200

# Monitoring Configuration
alert_emails = ["ops@gamedin-l3.com", "alerts@gamedin-l3.com"]
alert_phone_numbers = ["+1234567890"]
EOF
```

### Step 3: Deploy Infrastructure

#### Using PowerShell Script (Recommended)

```powershell
# Development deployment
.\deploy.ps1 -Environment dev -Region us-east-1 -ProjectName gamedin-l3-dev -DomainName dev.gamedin-l3.com

# Staging deployment
.\deploy.ps1 -Environment staging -Region us-east-1 -ProjectName gamedin-l3-staging -DomainName staging.gamedin-l3.com

# Production deployment
.\deploy.ps1 -Environment prod -Region us-east-1 -ProjectName gamedin-l3-prod -DomainName gamedin-l3.com -SkipConfirmation
```

#### Using Manual Terraform Commands

```bash
# Set environment
export ENVIRONMENT="dev"  # or staging, prod

# Copy configuration
cp terraform.tfvars.$ENVIRONMENT terraform.tfvars

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -out=tfplan

# Apply deployment
terraform apply tfplan
```

### Step 4: Verify Infrastructure

```bash
# Check EKS cluster
aws eks describe-cluster --name gamedin-l3-$ENVIRONMENT-cluster --region us-east-1

# Update kubeconfig
aws eks update-kubeconfig --name gamedin-l3-$ENVIRONMENT-cluster --region us-east-1

# Verify nodes
kubectl get nodes

# Check services
kubectl get services --all-namespaces
```

## 🐳 Application Deployment

### Step 1: Build Docker Images

```bash
# Navigate to project root
cd ..

# Build application image
docker build -t gamedin/app:latest -f Dockerfile.app .

# Build API image
docker build -t gamedin/api:latest -f Dockerfile.api .

# Tag for registry
docker tag gamedin/app:latest $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/gamedin/app:latest
docker tag gamedin/api:latest $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/gamedin/api:latest
```

### Step 2: Push to Container Registry

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Push images
docker push $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/gamedin/app:latest
docker push $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/gamedin/api:latest
```

### Step 3: Deploy Applications

#### Using Kubernetes Manifests

```bash
# Create namespace
kubectl create namespace gamedin-l3

# Apply secrets
kubectl apply -f k8s/secrets.yaml

# Apply configmaps
kubectl apply -f k8s/configmaps.yaml

# Deploy applications
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/api-deployment.yaml

# Deploy services
kubectl apply -f k8s/app-service.yaml
kubectl apply -f k8s/api-service.yaml

# Deploy ingress
kubectl apply -f k8s/ingress.yaml
```

#### Using Helm Charts

```bash
# Add Helm repository
helm repo add gamedin https://charts.gamedin-l3.com

# Install application
helm install gamedin-l3 gamedin/gamedin-l3 \
  --namespace gamedin-l3 \
  --set environment=$ENVIRONMENT \
  --set image.repository=$AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/gamedin \
  --set image.tag=latest
```

### Step 4: Verify Application Deployment

```bash
# Check pods
kubectl get pods -n gamedin-l3

# Check services
kubectl get services -n gamedin-l3

# Check ingress
kubectl get ingress -n gamedin-l3

# Test application
curl -I https://$DOMAIN_NAME/health
curl -I https://api.$DOMAIN_NAME/health
```

## 🔗 Smart Contract Deployment

### Step 1: Setup Blockchain Environment

```bash
# Install Hardhat
npm install -g hardhat

# Navigate to contracts directory
cd contracts

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### Step 2: Configure Networks

Edit `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    ethereum: {
      url: process.env.ETHEREUM_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
```

### Step 3: Deploy Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost

# Deploy to testnet
npx hardhat run scripts/deploy.js --network polygon

# Deploy to mainnet
npx hardhat run scripts/deploy.js --network ethereum

# Verify contracts
npx hardhat verify --network polygon CONTRACT_ADDRESS
```

### Step 4: Update Configuration

```bash
# Update contract addresses in configuration
kubectl create configmap contract-addresses \
  --from-literal=GAMING_CORE_ADDRESS=0x... \
  --from-literal=GDI_TOKEN_ADDRESS=0x... \
  --from-literal=BRIDGE_ADDRESS=0x... \
  --from-literal=NFT_MARKETPLACE_ADDRESS=0x... \
  --from-literal=AI_ORACLE_ADDRESS=0x... \
  -n gamedin-l3
```

## 🤖 AI Services Deployment

### Step 1: Setup AI Environment

```bash
# Navigate to AI services directory
cd src/ai

# Install Python dependencies
pip install -r requirements.txt

# Setup AI model storage
aws s3 sync models/ s3://gamedin-l3-ai-models-$ENVIRONMENT/
```

### Step 2: Deploy AI Services

```bash
# Deploy NovaSanctum AI
kubectl apply -f k8s/nova-sanctum-deployment.yaml

# Deploy AthenaMist AI
kubectl apply -f k8s/athena-mist-deployment.yaml

# Deploy Unified AI Service
kubectl apply -f k8s/unified-ai-deployment.yaml
```

### Step 3: Verify AI Services

```bash
# Check AI service pods
kubectl get pods -n gamedin-l3 -l app=ai-service

# Test AI endpoints
curl -X POST https://api.$DOMAIN_NAME/ai/nova-sanctum/analyze \
  -H "Content-Type: application/json" \
  -d '{"player_id": "123", "game_data": {...}}'

curl -X POST https://api.$DOMAIN_NAME/ai/athena-mist/strategize \
  -H "Content-Type: application/json" \
  -d '{"player_id": "123", "game_context": {...}}'
```

## 📊 Monitoring Setup

### Step 1: Deploy Monitoring Stack

```bash
# Deploy Prometheus
kubectl apply -f k8s/monitoring/prometheus.yaml

# Deploy Grafana
kubectl apply -f k8s/monitoring/grafana.yaml

# Deploy AlertManager
kubectl apply -f k8s/monitoring/alertmanager.yaml
```

### Step 2: Configure Dashboards

```bash
# Import Grafana dashboards
kubectl port-forward svc/grafana 3000:3000 -n monitoring

# Access Grafana at http://localhost:3000
# Default credentials: admin/admin
# Import dashboard JSON files from monitoring/dashboards/
```

### Step 3: Setup Alerts

```bash
# Apply alert rules
kubectl apply -f k8s/monitoring/alerts/

# Configure notification channels
# Add Slack, email, or PagerDuty integrations
```

## 🔒 Security Configuration

### Step 1: SSL Certificate Setup

```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name $DOMAIN_NAME \
  --subject-alternative-names "*.$DOMAIN_NAME" \
  --validation-method DNS

# Add DNS validation records
# Follow AWS console instructions to add CNAME records
```

### Step 2: WAF Configuration

```bash
# Apply WAF rules
kubectl apply -f k8s/security/waf-rules.yaml

# Configure rate limiting
kubectl apply -f k8s/security/rate-limiting.yaml
```

### Step 3: Secrets Management

```bash
# Store sensitive data in AWS Secrets Manager
aws secretsmanager create-secret \
  --name gamedin-l3/$ENVIRONMENT/database-url \
  --secret-string "postgresql://user:pass@host:port/db"

aws secretsmanager create-secret \
  --name gamedin-l3/$ENVIRONMENT/jwt-secret \
  --secret-string "your-jwt-secret-here"

aws secretsmanager create-secret \
  --name gamedin-l3/$ENVIRONMENT/redis-url \
  --secret-string "redis://host:port"
```

## 🧪 Testing and Validation

### Step 1: Run Integration Tests

```bash
# Navigate to tests directory
cd tests

# Run all tests
npm test

# Run specific test suites
npm run test:integration
npm run test:ai
npm run test:blockchain
```

### Step 2: Load Testing

```bash
# Install Artillery
npm install -g artillery

# Run load tests
artillery run load-tests/scenarios.yml

# Monitor performance
artillery run --output results.json load-tests/scenarios.yml
artillery report results.json
```

### Step 3: Security Testing

```bash
# Run security scans
npm audit

# Run container security scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image gamedin/app:latest

# Run infrastructure security scan
terraform-compliance -p terraform/ -f compliance/
```

## 📈 Performance Optimization

### Step 1: Database Optimization

```sql
-- Create indexes for performance
CREATE INDEX idx_player_games ON games(player_id, created_at);
CREATE INDEX idx_game_results ON game_results(game_id, result);
CREATE INDEX idx_ai_predictions ON ai_predictions(player_id, timestamp);

-- Analyze table statistics
ANALYZE games;
ANALYZE game_results;
ANALYZE ai_predictions;
```

### Step 2: Cache Configuration

```bash
# Configure Redis caching
kubectl apply -f k8s/caching/redis-config.yaml

# Setup application caching
kubectl apply -f k8s/caching/app-cache.yaml
```

### Step 3: CDN Setup

```bash
# Configure CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json

# Update DNS records
kubectl apply -f k8s/cdn/dns-records.yaml
```

## 🔄 CI/CD Pipeline Setup

### Step 1: GitHub Actions Configuration

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy GameDin L3

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker build -t gamedin/app:${{ github.sha }} .
          docker build -t gamedin/api:${{ github.sha }} .

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          aws eks update-kubeconfig --name gamedin-l3-prod-cluster
          kubectl set image deployment/app app=gamedin/app:${{ github.sha }}
          kubectl set image deployment/api api=gamedin/api:${{ github.sha }}
```

### Step 2: Automated Testing

```bash
# Setup automated testing
kubectl apply -f k8s/testing/test-automation.yaml

# Configure test schedules
kubectl apply -f k8s/testing/test-schedules.yaml
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Infrastructure Issues

**EKS Cluster Not Ready**
```bash
# Check cluster status
aws eks describe-cluster --name gamedin-l3-$ENVIRONMENT-cluster

# Check node groups
aws eks describe-nodegroup --cluster-name gamedin-l3-$ENVIRONMENT-cluster --nodegroup-name general

# Troubleshoot nodes
kubectl describe nodes
kubectl get events --sort-by='.lastTimestamp'
```

**RDS Connection Issues**
```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier gamedin-l3-$ENVIRONMENT-rds

# Test connection
kubectl run test-db --rm -it --image postgres -- psql -h $RDS_ENDPOINT -U $DB_USER -d $DB_NAME
```

#### Application Issues

**Pods Not Starting**
```bash
# Check pod status
kubectl get pods -n gamedin-l3

# Check pod logs
kubectl logs -f deployment/app -n gamedin-l3
kubectl logs -f deployment/api -n gamedin-l3

# Check pod events
kubectl describe pod <pod-name> -n gamedin-l3
```

**Service Not Accessible**
```bash
# Check service status
kubectl get services -n gamedin-l3

# Check ingress
kubectl get ingress -n gamedin-l3
kubectl describe ingress -n gamedin-l3

# Test service connectivity
kubectl run test-curl --rm -it --image curlimages/curl -- curl -I http://app-service:3000/health
```

#### AI Service Issues

**AI Models Not Loading**
```bash
# Check model storage
aws s3 ls s3://gamedin-l3-ai-models-$ENVIRONMENT/

# Check AI service logs
kubectl logs -f deployment/nova-sanctum -n gamedin-l3
kubectl logs -f deployment/athena-mist -n gamedin-l3
```

#### Blockchain Issues

**Smart Contract Deployment Failed**
```bash
# Check deployment logs
npx hardhat run scripts/deploy.js --network polygon --verbose

# Verify contract addresses
npx hardhat verify --network polygon CONTRACT_ADDRESS
```

### Performance Issues

**High Latency**
```bash
# Check application metrics
kubectl top pods -n gamedin-l3

# Check database performance
kubectl exec -it deployment/app -n gamedin-l3 -- pg_stat_statements

# Check Redis performance
kubectl exec -it deployment/redis -n gamedin-l3 -- redis-cli info memory
```

**Memory Issues**
```bash
# Check memory usage
kubectl top nodes
kubectl top pods -n gamedin-l3

# Check for memory leaks
kubectl logs -f deployment/app -n gamedin-l3 | grep -i memory
```

## 📞 Support and Maintenance

### Monitoring and Alerting

- **CloudWatch Dashboards**: Real-time monitoring
- **SNS Notifications**: Email and SMS alerts
- **Grafana Dashboards**: Custom metrics visualization
- **Prometheus Alerts**: Automated alerting

### Backup and Recovery

- **Automated Backups**: Daily RDS backups
- **S3 Replication**: Cross-region data replication
- **Disaster Recovery**: Multi-AZ deployment
- **Point-in-Time Recovery**: RDS point-in-time restore

### Maintenance Windows

- **Security Updates**: Monthly security patches
- **Performance Optimization**: Weekly performance reviews
- **Capacity Planning**: Monthly capacity analysis
- **Cost Optimization**: Monthly cost reviews

---

This deployment guide provides comprehensive instructions for deploying the GameDin L3 + AthenaMist AI ecosystem. Follow the steps carefully and ensure all prerequisites are met before proceeding with deployment. 