#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to install Helm
install_helm() {
    if ! command -v helm &> /dev/null; then
        echo -e "${YELLOW}Installing Helm...${NC}"
        curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
        chmod 700 get_helm.sh
        ./get_helm.sh
        rm get_helm.sh
        echo -e "${GREEN}Helm installed successfully!${NC}"
    else
        echo -e "${GREEN}Helm is already installed.${NC}"
    fi
}

# Function to install metrics-server
install_metrics_server() {
    local context=$1
    echo -e "${YELLOW}Installing metrics-server...${NC}"
    
    # Add metrics-server repo
    helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
    helm repo update
    
    # Install metrics-server
    helm upgrade --install metrics-server metrics-server/metrics-server \
        --namespace kube-system \
        --kube-context ${context} \
        --set args={--kubelet-insecure-tls} \
        --wait \
        --timeout 5m
    
    echo -e "${GREEN}metrics-server installed successfully!${NC}"
}

# Function to install AWS Load Balancer Controller
install_alb_controller() {
    local context=$1
    local cluster_name=$2
    local region=$3
    
    echo -e "${YELLOW}Installing AWS Load Balancer Controller...${NC}"
    
    # Add EKS charts
    helm repo add eks https://aws.github.io/eks-charts
    helm repo update
    
    # Install AWS Load Balancer Controller
    helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
        --namespace kube-system \
        --kube-context ${context} \
        --set clusterName=${cluster_name} \
        --set serviceAccount.create=false \
        --set serviceAccount.name=aws-load-balancer-controller \
        --set region=${region} \
        --set vpcId=$(aws eks describe-cluster --name ${cluster_name} --region ${region} --query 'cluster.resourcesVpcConfig.vpcId' --output text) \
        --wait \
        --timeout 5m
    
    echo -e "${GREEN}AWS Load Balancer Controller installed successfully!${NC}"
}

# Function to install cert-manager
install_cert_manager() {
    local context=$1
    echo -e "${YELLOW}Installing cert-manager...${NC}"
    
    # Add Jetstack repo
    helm repo add jetstack https://charts.jetstack.io
    helm repo update
    
    # Install cert-manager
    helm upgrade --install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --kube-context ${context} \
        --version v1.11.0 \
        --set installCRDs=true \
        --wait \
        --timeout 5m
    
    echo -e "${GREEN}cert-manager installed successfully!${NC}"
}

# Main script
echo -e "${GREEN}Starting Kubernetes add-ons installation...${NC}"

# Install Helm if not installed
install_helm

# Set cluster context
CONTEXT="gamedin-staging"
CLUSTER_NAME="gamedin-staging"
REGION="us-west-2"

# Install add-ons
install_metrics_server ${CONTEXT}
install_alb_controller ${CONTEXT} ${CLUSTER_NAME} ${REGION}
install_cert_manager ${CONTEXT}

echo -e "${GREEN}All add-ons installed successfully!${NC}"
