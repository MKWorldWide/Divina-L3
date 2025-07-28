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
  
  # Setup secrets
  echo "Setting up secrets..."
  ./scripts/setup-k8s-secrets.sh "${ENVIRONMENT}"
  
  # Deploy Kubernetes manifests
  echo "Deploying Kubernetes manifests..."
  KUBECONFIG="${KUBE_CONFIG}" kubectl apply -f "k8s/${ENVIRONMENT}/"
  
  # Wait for deployments to be ready
  echo "Waiting for deployments to be ready..."
  for DEPLOYMENT in $(KUBECONFIG="${KUBE_CONFIG}" kubectl get deployments -n "${NAMESPACE}" -o name); do
    echo "Waiting for ${DEPLOYMENT}..."
    KUBECONFIG="${KUBE_CONFIG}" kubectl rollout status "${DEPLOYMENT}" -n "${NAMESPACE}" --timeout=300s
    if [ $? -ne 0 ]; then
      echo "Error: ${DEPLOYMENT} deployment failed"
      echo "Debugging information:"
      KUBECONFIG="${KUBE_CONFIG}" kubectl describe "${DEPLOYMENT}" -n "${NAMESPACE}"
      KUBECONFIG="${KUBE_CONFIG}" kubectl logs "${DEPLOYMENT}" -n "${NAMESPACE}" --tail=50
      exit 1
    fi
  done
  
  # Show deployment status
  echo "Deployment status:"
  KUBECONFIG="${KUBE_CONFIG}" kubectl get all -n "${NAMESPACE}"
  
  echo "Deployment to ${ENVIRONMENT} completed successfully!"
else
  echo "AWS_REGION and EKS_CLUSTER_NAME must be set"
  exit 1
fi
