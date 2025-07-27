/**
 * GameDin L3 - Advanced Monitoring Stack
 * 
 * This module sets up the monitoring stack including:
 * - Prometheus for metrics collection
 * - Grafana for visualization
 * - Jaeger for distributed tracing
 * - Kube-state-metrics for Kubernetes metrics
 * - Node-exporter for node metrics
 */

# Create monitoring namespace
resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
    labels = {
      name        = "monitoring"
      environment = var.environment
    }
  }
}

# Install kube-prometheus-stack using Helm
resource "helm_release" "kube_prometheus_stack" {
  name       = "kube-prometheus-stack"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  version    = "45.0.0"
  wait       = true
  timeout    = 600

  values = [
    templatefile("${path.module}/values/prometheus-values.yaml", {
      environment = var.environment
      storage_class = var.storage_class
      storage_size  = var.prometheus_storage_size
      retention     = var.prometheus_retention
    })
  ]

  set {
    name  = "prometheus.prometheusSpec.retention"
    value = var.prometheus_retention
  }

  depends_on = [kubernetes_namespace.monitoring]
}

# Install Jaeger Operator using Helm
resource "helm_release" "jaeger_operator" {
  name       = "jaeger-operator"
  repository = "https://jaegertracing.github.io/helm-charts"
  chart      = "jaeger-operator"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  version    = "2.32.0"
  wait       = true
  timeout    = 300

  set {
    name  = "rbac.create"
    value = "true"
  }

  set {
    name  = "rbac.pspEnabled"
    value = "true"
  }

  depends_on = [kubernetes_namespace.monitoring]
}

# Create Jaeger instance
resource "kubernetes_manifest" "jaeger" {
  manifest = yamldecode(templatefile("${path.module}/templates/jaeger.yaml.tpl", {
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    environment = var.environment
    storage_type = var.jaeger_storage_type
  }))

  depends_on = [helm_release.jaeger_operator]
}

# Install Grafana dashboards
resource "kubernetes_config_map" "grafana_dashboards" {
  for_each = fileset("${path.module}/dashboards/", "*.json")
  
  metadata {
    name      = "grafana-dashboard-${replace(each.value, ".json", "")}"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    labels = {
      grafana_dashboard = "1"
    }
  }

  data = {
    (each.value) = file("${path.module}/dashboards/${each.value}")
  }

  depends_on = [helm_release.kube_prometheus_stack]
}

# Create service monitors for application metrics
resource "kubernetes_manifest" "service_monitors" {
  for_each = fileset("${path.module}/service-monitors/", "*.yaml")
  
  manifest = yamldecode(templatefile("${path.module}/service-monitors/${each.value}", {
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    environment = var.environment
  }))

  depends_on = [helm_release.kube_prometheus_stack]
}

# Outputs
output "grafana_url" {
  value       = "http://${kubernetes_service.grafana.status.0.load_balancer.0.ingress.0.hostname}:3000"
  description = "Grafana dashboard URL"
}

output "jaeger_url" {
  value       = "http://${kubernetes_service.jaeger_query.status.0.load_balancer.0.ingress.0.hostname}:16686"
  description = "Jaeger UI URL"
}

output "prometheus_url" {
  value       = "http://${kubernetes_service.prometheus.status.0.load_balancer.0.ingress.0.hostname}:9090"
  description = "Prometheus UI URL"
}
