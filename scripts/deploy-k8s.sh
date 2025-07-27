#!/bin/bash
set -e

# Check for required environment variables
for var in ECR_REGISTRY IMAGE_TAG ENVIRONMENT; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set"
    exit 1
  fi
done

# Set namespace based on environment
if [ "$ENVIRONMENT" = "production" ]; then
  NAMESPACE="production"
  INGRESS_HOST="gamedin.xyz"
else
  NAMESPACE="staging"
  INGRESS_HOST="staging.gamedin.xyz"
fi

# Create namespace if it doesn't exist
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Deploy using kustomize
kustomize edit set image \
  gamedin-dapp=${ECR_REGISTRY}/gamedin/${ENVIRONMENT}/dapp:${IMAGE_TAG} \
  gamedin-node=${ECR_REGISTRY}/gamedin/${ENVIRONMENT}/node:${IMAGE_TAG}

kustomize build . | envsubst | kubectl apply -f -

# Wait for deployments to be ready
kubectl rollout status deployment/gamedin-dapp -n $NAMESPACE --timeout=300s
kubectl rollout status deployment/gamedin-node -n $NAMESPACE --timeout=300s

echo "Deployment to $ENVIRONMENT environment completed successfully!"
echo "Access the application at: https://$INGRESS_HOST"
