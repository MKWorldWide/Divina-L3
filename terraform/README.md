# GameDin L3 + AthenaMist AI AWS Infrastructure

This directory contains the Terraform configuration for deploying the complete GameDin L3 + AthenaMist AI ecosystem to AWS.

## 🏗️ Architecture Overview

The infrastructure is designed for high availability, scalability, and performance with the following components:

### Core Infrastructure
- **VPC** with public, private, and database subnets across multiple AZs
- **EKS Cluster** with specialized node groups for gaming, AI, and general workloads
- **RDS PostgreSQL** with Multi-AZ deployment and automated backups
- **ElastiCache Redis** for caching and session management
- **Amazon MQ (RabbitMQ)** for message queuing
- **Application Load Balancer** with SSL termination
- **Route 53** for DNS management
- **ACM** for SSL certificate management

### Security & Monitoring
- **CloudWatch** for logging and monitoring
- **CloudTrail** for audit logging
- **VPC Flow Logs** for network monitoring
- **SNS** for alerting
- **IAM** roles and policies with least privilege access
- **KMS** for encryption at rest and in transit

### Application Stack
- **API Gateway** - RESTful API service
- **Gaming Engine** - Real-time gaming engine with WebSocket support
- **AI Services** - NovaSanctum and AthenaMist AI integration
- **Frontend** - React DApp interface
- **Bridge Relayer** - Cross-chain bridge service
- **Monitoring Stack** - Prometheus, Grafana, and custom dashboards

## 🚀 Quick Start

### Prerequisites

1. **AWS CLI** installed and configured
2. **Terraform** version 1.0.0 or higher
3. **kubectl** for Kubernetes management
4. **Helm** for package management
5. **jq** for JSON processing

### Installation

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install Terraform
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
curl https://get.helm.sh/helm-v3.12.0-linux-amd64.tar.gz | tar xz
sudo mv linux-amd64/helm /usr/local/bin/
```

### Configuration

1. **Configure AWS credentials:**
```bash
aws configure
```

2. **Set environment variables:**
```bash
export ENVIRONMENT=production
export AWS_REGION=us-west-2
export DOMAIN_NAME=gamedin-l3.com
```

3. **Run the deployment script:**
```bash
chmod +x deploy-aws.sh
./deploy-aws.sh
```

## 📁 Directory Structure

```
terraform/
├── main.tf                 # Main Terraform configuration
├── variables.tf            # Variable definitions
├── outputs.tf              # Output definitions
├── deploy-aws.sh           # Deployment script
├── README.md               # This file
├── modules/                # Terraform modules
│   ├── vpc/               # VPC and networking
│   ├── eks/               # EKS cluster
│   ├── rds/               # RDS database
│   ├── redis/             # ElastiCache Redis
│   ├── mq/                # Amazon MQ
│   ├── alb/               # Application Load Balancer
│   ├── s3/                # S3 buckets
│   ├── route53/           # Route 53 DNS
│   ├── acm/               # SSL certificates
│   ├── cloudwatch_alarms/ # CloudWatch alarms
│   ├── sns/               # SNS topics
│   └── security_group/    # Security groups
└── k8s/                   # Kubernetes manifests
    ├── database.yaml
    ├── redis.yaml
    ├── message-queue.yaml
    ├── api-gateway.yaml
    ├── gaming-engine.yaml
    ├── ai-services.yaml
    ├── frontend.yaml
    ├── bridge-relayer.yaml
    └── monitoring/
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Environment name (production/staging/development) | `production` |
| `AWS_REGION` | AWS region for deployment | `us-west-2` |
| `DOMAIN_NAME` | Domain name for the application | `gamedin-l3.com` |

### Terraform Variables

Key variables can be customized in `terraform.tfvars`:

```hcl
# Database Configuration
db_instance_class = "db.r6g.xlarge"
db_allocated_storage = 100
db_max_allocated_storage = 1000

# EKS Configuration
eks_cluster_version = "1.28"

# Application Replicas
app_replicas = {
  api_gateway    = 3
  gaming_engine  = 2
  ai_services    = 2
  frontend       = 2
  bridge_relayer = 2
}

# Resource Limits
app_resources = {
  api_gateway = {
    requests = { cpu = "500m", memory = "1Gi" }
    limits   = { cpu = "2", memory = "4Gi" }
  }
  # ... other services
}
```

## 🎮 Gaming Infrastructure

### EKS Node Groups

The EKS cluster includes specialized node groups:

1. **General Node Group** (`t3.large/t3.xlarge`)
   - API Gateway, Frontend, Bridge Relayer
   - Auto-scaling: 1-10 instances

2. **Gaming Node Group** (`c5.xlarge/c5.2xlarge`)
   - Gaming Engine with high CPU performance
   - Auto-scaling: 1-8 instances
   - Taints to ensure gaming workloads only

3. **AI Node Group** (`g4dn.xlarge/g4dn.2xlarge`)
   - AI Services with GPU acceleration
   - Auto-scaling: 1-6 instances
   - Taints to ensure AI workloads only

### Performance Optimizations

- **CPU Optimization**: Gaming nodes use compute-optimized instances
- **GPU Acceleration**: AI nodes include NVIDIA GPUs for ML workloads
- **Network Optimization**: Enhanced networking enabled
- **Storage**: GP3 volumes for better performance
- **Auto-scaling**: Cluster autoscaler for dynamic scaling

## 🤖 AI Integration

### NovaSanctum AI
- Fraud detection and prevention
- Player behavior analysis
- Game outcome prediction
- Real-time risk assessment

### AthenaMist AI
- Strategic game analysis
- Player optimization recommendations
- Performance prediction
- Advanced game intelligence

### Unified AI Service
- Orchestration between AI services
- Caching and optimization
- Consensus mechanisms
- Performance metrics

## 🔒 Security Features

### Network Security
- VPC with private subnets for all workloads
- Security groups with least privilege access
- Network ACLs for additional protection
- VPC Flow Logs for network monitoring

### Data Security
- Encryption at rest (RDS, S3, EBS)
- Encryption in transit (TLS 1.2+)
- KMS key management
- Secrets Manager for sensitive data

### Access Control
- IAM roles with least privilege
- Service accounts for Kubernetes
- RBAC for cluster access
- CloudTrail for audit logging

## 📊 Monitoring & Observability

### CloudWatch
- Application logs
- System metrics
- Custom dashboards
- Automated alerting

### Prometheus & Grafana
- Application metrics
- Infrastructure monitoring
- Custom dashboards
- Performance analytics

### Custom Dashboards
- Gaming performance metrics
- AI service performance
- Blockchain transaction monitoring
- Economic metrics
- System health overview

## 🔄 Deployment Process

### 1. Infrastructure Deployment
```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan -out=tfplan

# Apply infrastructure
terraform apply tfplan
```

### 2. Application Deployment
```bash
# Configure kubectl
aws eks update-kubeconfig --region us-west-2 --name gamedin-l3-production

# Deploy applications
kubectl apply -f k8s/
```

### 3. Verification
```bash
# Check cluster status
kubectl get nodes
kubectl get pods -n gamedin-l3

# Test endpoints
curl -f https://api.gamedin-l3.com/health
```

## 🚨 Troubleshooting

### Common Issues

1. **Terraform State Lock**
```bash
# If state is locked, force unlock
terraform force-unlock <lock-id>
```

2. **EKS Cluster Issues**
```bash
# Check cluster status
aws eks describe-cluster --name gamedin-l3-production --region us-west-2

# Update kubeconfig
aws eks update-kubeconfig --region us-west-2 --name gamedin-l3-production
```

3. **Pod Issues**
```bash
# Check pod logs
kubectl logs -f <pod-name> -n gamedin-l3

# Describe pod for details
kubectl describe pod <pod-name> -n gamedin-l3
```

4. **Database Connection Issues**
```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier gamedin-l3-production

# Test connection
kubectl exec -it <pod-name> -n gamedin-l3 -- psql $DATABASE_URL
```

### Log Locations

- **Application Logs**: `/aws/eks/gamedin-l3-production/application`
- **System Logs**: `/aws/eks/gamedin-l3-production/system`
- **Container Logs**: `/aws/eks/gamedin-l3-production/containers`
- **VPC Flow Logs**: `/aws/vpc/flowlogs/production`

## 💰 Cost Optimization

### Instance Types
- Use Spot instances for non-critical workloads
- Right-size instances based on actual usage
- Enable auto-scaling to scale down during low usage

### Storage Optimization
- Use GP3 volumes for better performance/cost ratio
- Enable lifecycle policies for S3 buckets
- Use intelligent tiering for infrequently accessed data

### Monitoring Costs
- Set up billing alerts
- Monitor resource utilization
- Use cost allocation tags
- Regular cost reviews

## 🔄 Updates & Maintenance

### Infrastructure Updates
```bash
# Update Terraform modules
terraform init -upgrade

# Plan and apply updates
terraform plan -out=tfplan
terraform apply tfplan
```

### Application Updates
```bash
# Update container images
kubectl set image deployment/<deployment> <container>=<new-image> -n gamedin-l3

# Rollback if needed
kubectl rollout undo deployment/<deployment> -n gamedin-l3
```

### Security Updates
- Regular security patches
- Dependency updates
- Certificate renewals
- Security group reviews

## 📞 Support

For issues and questions:

1. Check the troubleshooting section
2. Review CloudWatch logs
3. Check Terraform documentation
4. Contact the GameDin team

## 📄 License

This infrastructure is part of the GameDin L3 project and is licensed under the same terms as the main project.

---

**Note**: This infrastructure is designed for production use with high availability and security. Always test changes in a staging environment before applying to production. 