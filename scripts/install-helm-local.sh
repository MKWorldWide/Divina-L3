#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to install Helm locally
install_helm_local() {
    if ! command -v helm &> /dev/null; then
        echo -e "${YELLOW}Installing Helm locally...${NC}"
        mkdir -p ~/bin
        curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
        chmod 700 get_helm.sh
        HELM_INSTALL_DIR=~/bin ./get_helm.sh --no-sudo
        rm get_helm.sh
        export PATH="$HOME/bin:$PATH"
        echo -e "${GREEN}Helm installed locally!${NC}"
    else
        echo -e "${GREEN}Helm is already installed.${NC}"
    fi
}

# Function to install metrics-server
install_metrics_server() {
    local context=$1
    echo -e "${YELLOW}Installing metrics-server...${NC}"
    
    # Add metrics-server repo
    helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/ --kube-context ${context}
    helm repo update --kube-context ${context}
    
    # Create namespace if it doesn't exist
    kubectl create namespace metrics-server --dry-run=client -o yaml | kubectl apply -f - --context ${context}
    
    # Install metrics-server
    helm upgrade --install metrics-server metrics-server/metrics-server \
        --namespace metrics-server \
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
    
    # Create IAM OIDC provider
    eksctl utils associate-iam-oidc-provider --cluster ${cluster_name} --region ${region} --approve
    
    # Create IAM policy
    curl -o iam-policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.4.7/docs/install/iam_policy.json
    
    # Create IAM policy if it doesn't exist
    if ! aws iam get-policy --policy-arn arn:aws:iam::${AWS_ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy --region ${region} &> /dev/null; then
        aws iam create-policy \
            --policy-name AWSLoadBalancerControllerIAMPolicy \
            --policy-document file://iam-policy.json \
            --region ${region}
    fi
    
    # Create service account
    eksctl create iamserviceaccount \
        --cluster=${cluster_name} \
        --namespace=kube-system \
        --name=aws-load-balancer-controller \
        --attach-policy-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy \
        --override-existing-serviceaccounts \
        --region ${region} \
        --approve
    
    # Add EKS charts
    helm repo add eks https://aws.github.io/eks-charts --kube-context ${context}
    helm repo update --kube-context ${context}
    
    # Install AWS Load Balancer Controller
    helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
        -n kube-system \
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
    helm repo add jetstack https://charts.jetstack.io --kube-context ${context}
    helm repo update --kube-context ${context}
    
    # Create namespace
    kubectl create namespace cert-manager --dry-run=client -o yaml | kubectl apply -f - --context ${context}
    
    # Install cert-manager
    helm upgrade --install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --kube-context ${context} \
        --version v1.11.0 \
        --set installCRDs=true \
        --wait \
        --timeout 5m
    
    echo -e "${GREEN}cert-manager installed successfully!${NC}"
}

# Main script
echo -e "${GREEN}Starting Kubernetes add-ons installation...${NC}"

# Set cluster context
CONTEXT="gamedin-staging"
CLUSTER_NAME="gamedin-staging"
REGION="us-west-2"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Install Helm locally
install_helm_local

# Make sure kubectl is configured
aws eks update-kubeconfig --name ${CLUSTER_NAME} --region ${REGION} --alias ${CONTEXT}

# Install add-ons
install_metrics_server ${CONTEXT}
install_alb_controller ${CONTEXT} ${CLUSTER_NAME} ${REGION}
install_cert_manager ${CONTEXT}

echo -e "${GREEN}All add-ons installed successfully!${NC}"
