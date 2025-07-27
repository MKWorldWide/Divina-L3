# Distributed Tracing Outputs
output "jaeger_ui_url" {
  description = "URL for the Jaeger UI"
  value       = var.enable_jaeger_tracing ? "http://${kubernetes_service.jaeger_collector.metadata[0].name}.${kubernetes_namespace.monitoring.metadata[0].name}.svc.cluster.local:16686" : ""
}

output "otlp_grpc_endpoint" {
  description = "OTLP gRPC endpoint for sending traces"
  value       = "${kubernetes_service.opentelemetry_collector.metadata[0].name}.${kubernetes_namespace.monitoring.metadata[0].name}.svc.cluster.local:4317"
}

output "otlp_http_endpoint" {
  description = "OTLP HTTP endpoint for sending traces"
  value       = "http://${kubernetes_service.opentelemetry_collector.metadata[0].name}.${kubernetes_namespace.monitoring.metadata[0].name}.svc.cluster.local:4318"
}

output "xray_daemon_service_account" {
  description = "Name of the X-Ray daemon service account"
  value       = kubernetes_service_account.xray_daemon.metadata[0].name
}

output "opentelemetry_collector_service_account" {
  description = "Name of the OpenTelemetry Collector service account"
  value       = kubernetes_service_account.opentelemetry_collector.metadata[0].name
}

output "jaeger_collector_endpoint" {
  description = "Jaeger collector endpoint"
  value       = "${kubernetes_service.jaeger_collector.metadata[0].name}.${kubernetes_namespace.monitoring.metadata[0].name}.svc.cluster.local:14250"
}

output "distributed_tracing_status" {
  description = "Status of distributed tracing components"
  value = {
    jaeger_enabled    = var.enable_jaeger_tracing
    xray_enabled      = var.enable_xray_tracing
    collector_replicas = var.opentelemetry_collector_replicas
    storage_class     = var.jaeger_storage_class
    storage_size      = var.jaeger_storage_size
  }
}

# Monitoring Outputs
output "grafana_url" {
  description = "URL for Grafana dashboard"
  value       = "http://${kubernetes_service.grafana.status.0.load_balancer.0.ingress.0.hostname}:3000"
}

output "prometheus_url" {
  description = "URL for Prometheus UI"
  value       = "http://${kubernetes_service.prometheus.status.0.load_balancer.0.ingress.0.hostname}:9090"
}

output "alertmanager_url" {
  description = "URL for AlertManager UI"
  value       = var.enable_alertmanager ? "http://${kubernetes_service.alertmanager.status.0.load_balancer.0.ingress.0.hostname}:9093" : ""
}

output "kibana_url" {
  description = "URL for Kibana UI (if enabled)"
  value       = var.enable_logging ? "http://${kubernetes_service.kibana.status.0.load_balancer.0.ingress.0.hostname}:5601" : ""
}

output "monitoring_namespace" {
  description = "Name of the monitoring namespace"
  value       = kubernetes_namespace.monitoring.metadata[0].name
}

output "tracing_documentation_url" {
  description = "URL for distributed tracing documentation"
  value       = "https://gamedin.io/docs/monitoring/tracing"
}
