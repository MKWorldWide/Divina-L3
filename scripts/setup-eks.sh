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

# Function to create EKS cluster
create_cluster() {
    local env=$1
    local config_file="eks/${env}-cluster.yaml"
    
    if [ ! -f "$config_file" ]; then
        echo -e "${YELLOW}Config file $config_file not found. Skipping $env cluster creation.${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Creating $env EKS cluster...${NC}"
    # Replace AWS_ACCOUNT_ID placeholder in the config file
    sed -i.bak "s/\${AWS_ACCOUNT_ID}/$AWS_ACCOUNT_ID/g" "$config_file"
    
    # Create the cluster
    eksctl create cluster -f "$config_file"
    
    # Restore the original config file
    mv "${config_file}.bak" "$config_file"
    
    # Update kubeconfig
    aws eks update-kubeconfig --name gamedin-${env} --region us-west-2 --alias gamedin-${env}
    
    echo -e "${GREEN}Successfully created $env EKS cluster!${NC}"
}

# Function to install Kubernetes add-ons
install_addons() {
    local env=$1
    
    echo -e "${GREEN}Installing add-ons for $env cluster...${NC}"
    
    # Switch to the correct context
    kubectl config use-context gamedin-${env}
    
    # Install metrics server
    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
    
    # Install AWS Load Balancer Controller
    kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.4.7/docs/install/v2_4_7_full.yaml
    
    # Install Cert-Manager
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.11.0/cert-manager.yaml
    
    # Install Karpenter (for production only)
    if [ "$env" = "production" ]; then
        kubectl create namespace karpenter
        kubectl create -f https://raw.githubusercontent.com/aws/karpenter/v0.28.0/pkg/apis/crds/karpenter.sh_provisioners.yaml
        kubectl create -f https://raw.githubusercontent.com/aws/karpenter/v0.28.0/pkg/apis/crds/karpenter.k8s.aws_awsnodetemplates.yaml
    fi
    
    echo -e "${GREEN}Successfully installed add-ons for $env cluster!${NC}"
}

# Create staging cluster
create_cluster "staging"
install_addons "staging"

# Create production cluster
create_cluster "production"
install_addons "production"

echo -e "${GREEN}EKS setup completed successfully!${NC}"
echo -e "${YELLOW}IMPORTANT: Please update your GitHub secrets with the following kubeconfigs:${NC}"
echo -e "Staging kubeconfig: $(kubectl config view --minify --flatten --context=gamedin-staging | base64 | tr -d '\n')"
echo -e "Production kubeconfig: $(kubectl config view --minify --flatten --context=gamedin-production | base64 | tr -d '\n')"
