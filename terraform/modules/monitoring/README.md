# GameDin L3 Monitoring Module

This Terraform module sets up a comprehensive monitoring stack for the GameDin L3 application, including Prometheus, Grafana, and Jaeger for distributed tracing.

## Features

- **Prometheus** - Metrics collection and alerting
- **Grafana** - Visualization and dashboards
- **Jaeger** - Distributed tracing
- **Kube State Metrics** - Kubernetes cluster metrics
- **Node Exporter** - Node-level metrics
- **Pre-configured Dashboards** - For application and infrastructure monitoring

## Prerequisites

- Kubernetes cluster (EKS, GKE, AKS, or self-hosted)
- `kubectl` configured to access your cluster
- Helm 3.x installed
- Terraform 1.0+

## Usage

```hcl
module "monitoring" {
  source = "./modules/monitoring"

  environment = "production"
  domain_name = "example.com"
  
  # Storage configuration
  storage_class = "gp2"
  prometheus_storage_size = "50Gi"
  
  # Alerting
  alertmanager_slack_webhook = "https://hooks.slack.com/services/..."
  alertmanager_email = "alerts@example.com"
  
  # Enable additional features
  enable_istio = true
  enable_thanos = true
  enable_loki = true
  enable_tempo = true
}
```

## Components

### Prometheus
- Scrapes metrics from Kubernetes services and pods
- Configures service discovery for dynamic monitoring
- Sets up alert rules and alertmanager configuration

### Grafana
- Pre-configured dashboards for:
  - Kubernetes cluster health
  - Application metrics
  - Node resource usage
  - API performance
- Data source configuration for Prometheus and Loki

### Jaeger
- Distributed tracing for microservices
- Storage backends: memory, Elasticsearch, or Cassandra
- Integration with OpenTelemetry

## Configuration

### Variables

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| environment | Deployment environment (e.g., production, staging) | string | `"production"` | yes |
| domain_name | Base domain for ingresses | string | `""` | no |
| storage_class | Storage class for persistent volumes | string | `"gp2"` | no |
| prometheus_storage_size | Storage size for Prometheus | string | `"50Gi"` | no |
| prometheus_retention | Data retention period for Prometheus | string | `"15d"` | no |
| jaeger_storage_type | Storage type for Jaeger | string | `"memory"` | no |
| jaeger_storage_size | Storage size for Jaeger | string | `"20Gi"` | no |
| enable_istio | Enable Istio integration | bool | `false` | no |
| enable_thanos | Enable Thanos for long-term metrics storage | bool | `false` | no |
| enable_loki | Enable Loki for logs | bool | `false` | no |
| enable_tempo | Enable Grafana Tempo for traces | bool | `false` | no |
| enable_alertmanager | Enable AlertManager for alerts | bool | `true` | no |
| alertmanager_slack_webhook | Slack webhook URL for alerts | string | `""` | no |
| alertmanager_email | Email for alert notifications | string | `""` | no |

### Outputs

| Name | Description |
|------|-------------|
| grafana_url | URL to access Grafana |
| prometheus_url | URL to access Prometheus |
| jaeger_url | URL to access Jaeger UI |
| alertmanager_url | URL to access AlertManager |

## Dashboards

### Application Dashboard
- Request rates
- Error rates
- Latency percentiles
- Throughput
- Resource usage

### Kubernetes Cluster Dashboard
- Node resource usage
- Pod status
- Cluster capacity
- API server metrics

## Alerting

Pre-configured alerts for:
- High error rates
- High latency
- Resource saturation
- Pod restarts
- Node failures

## Development

### Adding New Dashboards
1. Create a new JSON file in the `dashboards/` directory
2. The dashboard will be automatically loaded by Grafana

### Adding Service Monitors
1. Create a new YAML file in the `service-monitors/` directory
2. The service monitor will be automatically applied

## Troubleshooting

### Common Issues

#### Prometheus Not Scraping Targets
- Check service monitor selectors
- Verify pod annotations include `prometheus.io/scrape: "true"`
- Check Prometheus logs: `kubectl logs -n monitoring prometheus-prometheus-0`

#### Grafana Login Issues
- Default credentials: admin/prom-operator
- Check if the Grafana pod is running: `kubectl get pods -n monitoring | grep grafana`

#### Jaeger Not Showing Traces
- Verify your application is instrumented with OpenTelemetry
- Check Jaeger collector logs: `kubectl logs -n monitoring -l app.kubernetes.io/name=jaeger`

## License

This module is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
