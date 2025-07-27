# Istio Module Outputs

output "istio_version" {
  description = "The version of Istio that was installed"
  value       = var.istio_version
}

output "istiod_endpoint" {
  description = "The endpoint for the Istiod control plane"
  value       = "istiod.istio-system.svc.cluster.local:15012"
}

output "ingress_gateway_endpoint" {
  description = "The endpoint for the Istio Ingress Gateway"
  value       = "istio-ingressgateway.istio-system.svc.cluster.local:80"
}

output "egress_gateway_endpoint" {
  description = "The endpoint for the Istio Egress Gateway"
  value       = var.enable_egress_gateway ? "istio-egressgateway.istio-system.svc.cluster.local:80" : null
}

output "kiali_dashboard_url" {
  description = "The URL for the Kiali dashboard"
  value       = "http://kiali.istio-system.svc.cluster.local:20001"
}

output "jaeger_tracing_url" {
  description = "The URL for the Jaeger tracing UI"
  value       = "http://tracing.istio-system.svc.cluster.local:80"
}

output "grafana_dashboard_url" {
  description = "The URL for the Grafana dashboards"
  value       = "http://grafana.istio-system.svc.cluster.local:3000"
}

output "prometheus_endpoint" {
  description = "The endpoint for Prometheus metrics"
  value       = "prometheus.istio-system.svc.cluster.local:9090"
}

output "istio_ingress_gateway_load_balancer" {
  description = "The load balancer hostname for the Istio Ingress Gateway"
  value       = var.enable_ingress_gateway ? "istio-ingressgateway.istio-system.svc.cluster.local" : null
}

output "istio_egress_gateway_load_balancer" {
  description = "The load balancer hostname for the Istio Egress Gateway"
  value       = var.enable_egress_gateway ? "istio-egressgateway.istio-system.svc.cluster.local" : null
}

output "istio_cni_enabled" {
  description = "Whether Istio CNI is enabled"
  value       = var.enable_istio_cni
}

output "auto_injection_enabled" {
  description = "Whether automatic sidecar injection is enabled"
  value       = var.enable_auto_injection
}

output "tracing_enabled" {
  description = "Whether distributed tracing is enabled"
  value       = var.enable_tracing
}

output "istio_operator_enabled" {
  description = "Whether the Istio Operator is enabled"
  value       = var.enable_istio_operator
}

output "gateway_api_enabled" {
  description = "Whether the Kubernetes Gateway API is enabled"
  value       = var.enable_gateway_api
}

output "cert_manager_integration_enabled" {
  description = "Whether cert-manager integration is enabled"
  value       = var.enable_cert_manager
}

output "istio_ingress_gateway_external_ip" {
  description = "The external IP address of the Istio Ingress Gateway"
  value       = var.enable_ingress_gateway ? "${kubernetes_service.istio_ingress[0].status.0.load_balancer.0.ingress.0.hostname}" : null
}
