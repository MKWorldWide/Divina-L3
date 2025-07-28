#!/bin/bash
set -e

# This script sets up Kubernetes secrets from environment variables
# Usage: ./scripts/setup-k8s-secrets.sh <environment>

ENVIRONMENT=${1:-staging}
SECRETS_FILE="k8s/${ENVIRONMENT}/secrets/gamedin-secrets.yaml"

if [ ! -f "$SECRETS_FILE" ]; then
  echo "Error: Secrets file not found at $SECRETS_FILE"
  exit 1
fi

# Create a temporary file for the processed secrets
temp_file=$(mktemp)

# Process the secrets file, replacing environment variables
envsubst < "$SECRETS_FILE" > "$temp_file"

# Apply the secrets to the cluster
kubectl apply -f "$temp_file" --namespace="${ENVIRONMENT}" --validate=false

# Clean up
rm -f "$temp_file"

echo "Secrets have been applied to the ${ENVIRONMENT} namespace"
