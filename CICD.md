# GameDin L3 CI/CD Pipeline

This document outlines the CI/CD workflow for the GameDin L3 project.

## Workflow Overview

The CI/CD pipeline consists of the following jobs:

1. **Test and Lint**: Runs unit and integration tests, lints the codebase
2. **Frontend Build**: Builds and tests the React frontend
3. **Build and Push Images**: Builds and pushes Docker images to Docker Hub
4. **Deploy to Staging**: Deploys to the staging environment (on push to develop or manual trigger)
5. **Deploy to Production**: Deploys to production (on push to main or manual trigger)
6. **Notify**: Sends notifications about the deployment status

## Environment Variables

The following secrets need to be configured in your GitHub repository or organization:

### Required Secrets

- `AWS_ACCESS_KEY_ID`: AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `AWS_ROLE_ARN_STAGING`: IAM role ARN for staging environment
- `AWS_ROLE_ARN_PRODUCTION`: IAM role ARN for production environment
- `DOCKERHUB_USERNAME`: Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token
- `CODECOV_TOKEN`: Codecov upload token
- `FORK_URL`: URL for forking the blockchain (for testing)

## Manual Deployment

You can manually trigger a deployment using the GitHub Actions UI:

1. Go to the "Actions" tab in your repository
2. Select the "GameDin L3 Pipeline" workflow
3. Click "Run workflow"
4. Select the environment (test, staging, or production)
5. Click "Run workflow"

## Local Development

### Prerequisites

- Node.js 20.x
- Docker and Docker Compose
- Hardhat

### Running Locally

1. Install dependencies:
   ```bash
   npm install
   cd gdi-dapp && npm install && cd ..
   ```

2. Start the local development environment:
   ```bash
   docker-compose up -d
   ```

3. Deploy contracts locally:
   ```bash
   npm run deploy:local
   ```

4. Start the frontend development server:
   ```bash
   cd gdi-dapp
   npm start
   ```

## Troubleshooting

### Common Issues

1. **Docker build failures**:
   - Make sure Docker is running
   - Check available disk space
   - Try running `docker system prune` to clean up unused resources

2. **AWS authentication issues**:
   - Verify your AWS credentials have the correct permissions
   - Check that the IAM roles exist and are properly configured

3. **Kubernetes deployment issues**:
   - Verify your kubeconfig is correctly set up
   - Check pod logs with `kubectl logs <pod-name> -n <namespace>`
   - Describe the pod for more details: `kubectl describe pod <pod-name> -n <namespace>`

## Monitoring

- **Staging**: https://staging.gamedin.xyz/monitoring
- **Production**: https://gamedin.xyz/monitoring

## Rollback

To rollback to a previous deployment:

1. Find the commit hash of the previous working version
2. Checkout that commit
3. Run the deployment workflow manually for the desired environment

## Security

- All secrets are stored in GitHub Secrets
- IAM roles use the principle of least privilege
- Kubernetes namespaces are used to isolate environments
- All container images are scanned for vulnerabilities during the build process
