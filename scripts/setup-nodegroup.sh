#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if eksctl is installed
if ! command -v eksctl &> /dev/null; then
    echo "eksctl is not installed. Please install it first."
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "kubectl is not installed. Please install it first."
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}AWS Account ID: $AWS_ACCOUNT_ID${NC}"

# Function to create node group
create_nodegroup() {
    local env=$1
    local cluster_name="gamedin-${env}"
    
    echo -e "${GREEN}Creating node group for ${cluster_name}...${NC}"
    
    # Create node group using eksctl
    eksctl create nodegroup \
        --cluster ${cluster_name} \
        --region us-west-2 \
        --name standard-workers \
        --node-type t3.medium \
        --nodes 2 \
        --nodes-min 1 \
        --nodes-max 4 \
        --node-volume-size 50 \
        --managed \
        --asg-access \
        --external-dns-access \
        --full-ecr-access \
        --appmesh-access \
        --alb-ingress-access
    
    echo -e "${GREEN}Node group created successfully for ${cluster_name}!${NC}"
}

# Function to install add-ons
install_addons() {
    local env=$1
    local cluster_name="gamedin-${env}"
    
    echo -e "${GREEN}Installing add-ons for ${cluster_name}...${NC}"
    
    # Update kubeconfig
    aws eks update-kubeconfig --name ${cluster_name} --region us-west-2 --alias ${cluster_name}
    
    # Install metrics server
    echo -e "${YELLOW}Installing metrics server...${NC}"
    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
    
    # Create IAM OIDC provider
    echo -e "${YELLOW}Creating IAM OIDC provider...${NC}"
    eksctl utils associate-iam-oidc-provider --cluster ${cluster_name} --approve
    
    # Install cert-manager
    echo -e "${YELLOW}Installing cert-manager...${NC}"
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.11.0/cert-manager.yaml
    
    echo -e "${GREEN}Add-ons installed successfully for ${cluster_name}!${NC}"
}

# Main script
echo -e "${GREEN}Starting EKS node group and add-ons setup...${NC}"

# Create node group for staging
create_nodegroup "staging"

# Install add-ons for staging
install_addons "staging"

echo -e "${GREEN}EKS node group and add-ons setup completed successfully!${NC}"
