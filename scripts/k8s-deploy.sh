#!/bin/bash
set -e

# This script handles Kubernetes deployments with proper AWS authentication
# It's designed to work with GitHub's OIDC provider for AWS authentication

# Default values
ENVIRONMENT="staging"
NAMESPACE="gamedin-${ENVIRONMENT}"
KUBE_CONFIG="/tmp/kubeconfig"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --environment|-e)
      ENVIRONMENT="$2"
      NAMESPACE="gamedin-${ENVIRONMENT}"
      shift # past argument
      shift # past value
      ;;
    --kubeconfig|-k)
      KUBE_CONFIG="$2"
      shift # past argument
      shift # past value
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "Deploying to ${ENVIRONMENT} environment in namespace ${NAMESPACE}"

# Create directory for kubeconfig
mkdir -p "$(dirname "${KUBE_CONFIG}")"

# Get kubeconfig from AWS EKS
if [ -n "${AWS_REGION}" ] && [ -n "${EKS_CLUSTER_NAME}" ]; then
  echo "Generating kubeconfig for EKS cluster ${EKS_CLUSTER_NAME} in ${AWS_REGION}"
  
  # Use aws eks update-kubeconfig to generate kubeconfig
  aws eks update-kubeconfig \
    --region "${AWS_REGION}" \
    --name "${EKS_CLUSTER_NAME}" \
    --kubeconfig "${KUBE_CONFIG}" \
    --alias "gamedin-${ENVIRONMENT}"
    
  # Verify cluster access
  if ! KUBECONFIG="${KUBE_CONFIG}" kubectl cluster-info; then
    echo "Failed to access EKS cluster"
    exit 1
  fi
  
  # Create namespace if it doesn't exist
  if ! KUBECONFIG="${KUBE_CONFIG}" kubectl get namespace "${NAMESPACE}" >/dev/null 2>&1; then
    echo "Creating namespace ${NAMESPACE}"
    KUBECONFIG="${KUBE_CONFIG}" kubectl create namespace "${NAMESPACE}" || true
  fi
  
  # Set context namespace
  KUBECONFIG="${KUBE_CONFIG}" kubectl config set-context --current --namespace="${NAMESPACE}"
  
  # Deploy Kubernetes manifests
  echo "Deploying Kubernetes manifests..."
  KUBECONFIG="${KUBE_CONFIG}" kubectl apply -f "k8s/${ENVIRONMENT}/"
  
  # Wait for deployments to be ready
  echo "Waiting for deployments to be ready..."
  KUBECONFIG="${KUBE_CONFIG}" kubectl wait --for=condition=available \
    --timeout=300s \
    -n "${NAMESPACE}" \
    deployment/gamedin-dapp \
    deployment/gamedin-node
    
  # Show deployment status
  echo "Deployment status:"
  KUBECONFIG="${KUBE_CONFIG}" kubectl get all -n "${NAMESPACE}"
  
  echo "Deployment to ${ENVIRONMENT} completed successfully!"
else
  echo "AWS_REGION and EKS_CLUSTER_NAME must be set"
  exit 1
fi
