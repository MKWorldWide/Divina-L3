# Istio Service Mesh Module

This Terraform module deploys and configures Istio service mesh for the GameDin L3 blockchain platform. It provides a production-grade service mesh with features like traffic management, security, and observability.

## Features

- **Service Mesh**: Deploys Istio control plane and data plane components
- **Ingress/Egress Gateways**: Configurable gateways for managing ingress and egress traffic
- **TLS Termination**: Automatic TLS certificate management with cert-manager
- **Observability**: Integrated with Prometheus, Grafana, Jaeger, and Kiali
- **Security**: mTLS, RBAC, and network policies
- **Multi-cluster Support**: Ready for multi-cluster mesh configuration
- **CNI Integration**: Optional CNI plugin for improved networking

## Prerequisites

- Kubernetes cluster (EKS, GKE, AKS, or self-managed)
- `kubectl` configured to access your cluster
- `istioctl` (will be installed automatically)
- Terraform 1.0+ and Kubernetes provider 2.0+

## Usage

```hcl
module "istio" {
  source = "./modules/istio"
  
  # Basic Configuration
  istio_version = "1.16.0"
  cluster_name  = "gamedin-cluster"
  
  # Feature Flags
  enable_auto_injection   = true
  enable_tracing          = true
  enable_egress_gateway   = true
  enable_ingress_gateway  = true
  enable_sidecar_injector = true
  
  # Namespace Configuration
  namespaces_for_sidecar_injection = ["default", "gaming", "ai"]
  
  # Ingress Configuration
  ingress_host = "*.gamedin.io"
  
  # Resource Configuration
  istiod_resources = {
    requests = {
      cpu    = "500m"
      memory = "1024Mi"
    }
    limits = {
      cpu    = "2000m"
      memory = "2048Mi"
    }
  }
  
  # Add any custom Istio resources
  gateways = [
    {
      name      = "gaming-gateway"
      namespace = "gaming"
      selector  = {
        istio = "ingressgateway"
      }
      servers = [
        {
          port = {
            number   = 80
            name     = "http"
            protocol = "HTTP"
          }
          hosts = ["*.gamedin.io"]
        }
      ]
    }
  ]
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| istio_version | Version of Istio to install | `string` | `"1.16.0"` | no |
| cluster_name | Name of the EKS cluster | `string` | `"gamedin-cluster"` | no |
| enable_auto_injection | Enable automatic sidecar injection | `bool` | `true` | no |
| enable_tracing | Enable distributed tracing | `bool` | `true` | no |
| enable_egress_gateway | Enable Istio Egress Gateway | `bool` | `true` | no |
| enable_ingress_gateway | Enable Istio Ingress Gateway | `bool` | `true` | no |
| namespaces_for_sidecar_injection | List of namespaces to enable automatic sidecar injection | `list(string)` | `["default", "gaming", "ai"]` | no |
| istiod_resources | Resource requests and limits for Istiod | `map` | See variables.tf | no |
| ingress_gateway_resources | Resource requests and limits for Ingress Gateway | `map` | See variables.tf | no |
| egress_gateway_resources | Resource requests and limits for Egress Gateway | `map` | See variables.tf | no |

## Outputs

| Name | Description |
|------|-------------|
| istio_version | The version of Istio that was installed |
| istiod_endpoint | The endpoint for the Istiod control plane |
| ingress_gateway_endpoint | The endpoint for the Istio Ingress Gateway |
| egress_gateway_endpoint | The endpoint for the Istio Egress Gateway |
| kiali_dashboard_url | The URL for the Kiali dashboard |
| jaeger_tracing_url | The URL for the Jaeger tracing UI |
| grafana_dashboard_url | The URL for the Grafana dashboards |
| prometheus_endpoint | The endpoint for Prometheus metrics |

## Security Considerations

- **mTLS**: Mutual TLS is enabled by default for service-to-service communication
- **Network Policies**: Network policies restrict traffic between namespaces
- **RBAC**: Role-based access control is enforced for all Istio components
- **Secret Management**: Sensitive data is stored in Kubernetes secrets

## Monitoring and Observability

The module includes the following monitoring components:

- **Prometheus**: For metrics collection and alerting
- **Grafana**: For visualization of metrics
- **Jaeger**: For distributed tracing
- **Kiali**: For service mesh visualization

## Upgrading

To upgrade Istio:

1. Update the `istio_version` variable
2. Run `terraform plan` to review changes
3. Run `terraform apply` to apply the upgrade

## Troubleshooting

### Common Issues

1. **Sidecar Injection Fails**
   - Verify the namespace has the `istio-injection=enabled` label
   - Check the istio-sidecar-injector pod logs

2. **Ingress Gateway Not Working**
   - Verify the LoadBalancer service has an external IP
   - Check the istio-ingressgateway pod logs

3. **mTLS Issues**
   - Verify the `PeerAuthentication` resource is configured correctly
   - Check the istiod logs for policy validation errors

### Logs

View Istio component logs:

```bash
# Istiod logs
kubectl logs -n istio-system -l app=istiod

# Ingress Gateway logs
kubectl logs -n istio-system -l app=istio-ingressgateway

# Egress Gateway logs
kubectl logs -n istio-system -l app=istio-egressgateway
```

## License

This module is licensed under the MIT License - see the LICENSE file for details.
