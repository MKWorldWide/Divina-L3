#!/bin/bash
set -e

# This script handles AWS authentication and ECR login
# It's designed to work with GitHub's OIDC provider for AWS authentication

# Check if running in GitHub Actions
if [ -n "$GITHUB_ACTIONS" ]; then
  echo "Running in GitHub Actions environment"
  
  # Configure AWS credentials using OIDC
  # These values should be set in your GitHub organization secrets
  AWS_REGION="${AWS_REGION:-us-west-2}"
  AWS_ROLE_ARN="${AWS_ROLE_ARN}"
  AWS_WEB_IDENTITY_TOKEN_FILE="/tmp/awscreds"
  
  # Get OIDC token from GitHub
  if [ -n "${ACTIONS_ID_TOKEN_REQUEST_TOKEN}" ] && [ -n "${ACTIONS_ID_TOKEN_REQUEST_URL}" ]; then
    echo "Getting OIDC token from GitHub..."
    OIDC_TOKEN=$(curl -sLS "${ACTIONS_ID_TOKEN_REQUEST_URL}" \
      -H "User-Agent: actions/oidc-client" \
      -H "Authorization: Bearer ${ACTIONS_ID_TOKEN_REQUEST_TOKEN}" | jq -r '.value')
    
    if [ -z "${OIDC_TOKEN}" ]; then
      echo "Failed to get OIDC token"
      exit 1
    fi
    
    # Write the token to a file for AWS CLI
    echo "${OIDC_TOKEN}" > "${AWS_WEB_IDENTITY_TOKEN_FILE}"
    
    # Configure AWS credentials
    echo "Configuring AWS credentials..."
    aws configure set profile.ci.region "${AWS_REGION}"
    aws configure set profile.ci.role_arn "${AWS_ROLE_ARN}"
    aws configure set profile.ci.web_identity_token_file "${AWS_WEB_IDENTITY_TOKEN_FILE}"
    
    # Set environment variables for AWS CLI
    export AWS_PROFILE=ci
    export AWS_DEFAULT_REGION="${AWS_REGION}"
    
    # Get caller identity to verify authentication
    echo "AWS caller identity:"
    aws sts get-caller-identity
    
    # Login to ECR
    echo "Logging in to Amazon ECR..."
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    aws ecr get-login-password --region "${AWS_REGION}" | \
      docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    
    # Set output variables for later steps
    echo "ECR_REGISTRY=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com" >> $GITHUB_ENV
    echo "AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}" >> $GITHUB_ENV
  else
    echo "OIDC token not available. Falling back to access key authentication."
    
    # Fall back to access key authentication if OIDC is not available
    if [ -n "${AWS_ACCESS_KEY_ID}" ] && [ -n "${AWS_SECRET_ACCESS_KEY}" ]; then
      aws configure set aws_access_key_id "${AWS_ACCESS_KEY_ID}"
      aws configure set aws_secret_access_key "${AWS_SECRET_ACCESS_KEY}"
      aws configure set region "${AWS_REGION}"
      
      # Login to ECR
      AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
      aws ecr get-login-password --region "${AWS_REGION}" | \
        docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
      
      # Set output variables for later steps
      echo "ECR_REGISTRY=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com" >> $GITHUB_ENV
      echo "AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}" >> $GITHUB_ENV
    else
      echo "No valid AWS credentials provided"
      exit 1
    fi
  fi
else
  echo "Not running in GitHub Actions. Using local AWS configuration."
  # Use local AWS configuration
  aws sts get-caller-identity
fi

echo "AWS authentication successful"
