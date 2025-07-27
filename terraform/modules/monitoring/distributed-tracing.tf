# Distributed Tracing Configuration for GameDin L3

# Data source for AWS EKS cluster information
data "aws_eks_cluster" "cluster" {
  name = var.cluster_name
}

data "aws_caller_identity" "current" {}

# Jaeger Configuration
resource "kubernetes_config_map" "jaeger_config" {
  metadata {
    name      = "jaeger-config"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
  }

  data = {
    "jaeger.yaml" = <<-EOT
    collector:
      zipkin:
        http-port: 9411
      otlp:
        protocols:
          grpc:
            endpoint: "0.0.0.0:4317"
          http:
            endpoint: "0.0.0.0:4318"
    agent:
      config-file: /etc/jaeger/agent/jaeger-agent.yaml
    EOT
  }
}

# Jaeger Service
resource "kubernetes_service" "jaeger_collector" {
  metadata {
    name      = "jaeger-collector"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    labels = {
      app     = "jaeger"
      app.kubernetes.io/component = "collector"
    }
  }

  spec {
    port {
      name        = "http"
      port        = 14268
      target_port = "http"
    }

    port {
      name        = "grpc"
      port        = 14250
      target_port = "grpc"
    }

    port {
      name        = "otlp-http"
      port        = 4318
      target_port = "otlp-http"
    }

    port {
      name        = "otlp-grpc"
      port        = 4317
      target_port = "otlp-grpc"
    }

    selector = {
      "app.kubernetes.io/instance" = "jaeger"
      "app.kubernetes.io/component" = "collector"
    }

    type = "ClusterIP"
  }
}

# AWS X-Ray Daemon Configuration
resource "kubernetes_config_map" "xray_daemon_config" {
  metadata {
    name      = "xray-daemon-config"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
  }

  data = {
    "config.yaml" = <<-EOT
    TotalBufferSizeMB: 10
    Concurrency: 8
    Endpoint: ""
    Socket:
      UDPAddress: "0.0.0.0:2000"
      TCPAddress: "0.0.0.0:2000"
    LocalMode: true
    Logging:
      LogRotation: true
      LogLevel: "info"
      LogPath: "/var/log/xray/"
    Version: "1.0"
    EOT
  }
}

# IAM Role for X-Ray Daemon
resource "aws_iam_role" "xray_daemon" {
  name = "xray-daemon-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/${replace(data.aws_eks_cluster.cluster.identity[0].oidc[0].issuer, "https://", "")}"
        }
        Condition = {
          StringEquals = {
            "${replace(data.aws_eks_cluster.cluster.identity[0].oidc[0].issuer, "https://", "")}:sub" = "system:serviceaccount:monitoring:xray-daemon"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "xray_daemon" {
  role       = aws_iam_role.xray_daemon.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# X-Ray Daemon Service Account
resource "kubernetes_service_account" "xray_daemon" {
  metadata {
    name      = "xray-daemon"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.xray_daemon.arn
    }
  }
}

# X-Ray Daemon DaemonSet
resource "kubernetes_daemonset" "xray_daemon" {
  metadata {
    name      = "xray-daemon"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    labels = {
      app = "xray-daemon"
    }
  }

  spec {
    selector {
      match_labels = {
        app = "xray-daemon"
      }
    }

    template {
      metadata {
        labels = {
          app = "xray-daemon"
        }
      }

      spec {
        service_account_name = kubernetes_service_account.xray_daemon.metadata[0].name
        
        container {
          name  = "xray-daemon"
          image = "amazon/aws-xray-daemon:3.4.0"
          
          args = [
            "--config=/etc/aws-xray/config.yaml"
          ]
          
          port {
            container_port = 2000
            protocol      = "UDP"
          }
          
          resources {
            limits = {
              cpu    = "100m"
              memory = "256Mi"
            }
            requests = {
              cpu    = "10m"
              memory = "64Mi"
            }
          }
          
          volume_mount {
            name       = "config"
            mount_path = "/etc/aws-xray"
            read_only  = true
          }
          
          liveness_probe {
            exec {
              command = ["wget", "-q", "-O", "-", "http://localhost:2000"]
            }
            initial_delay_seconds = 30
            period_seconds        = 10
            timeout_seconds       = 5
            failure_threshold     = 3
          }
        }
        
        volume {
          name = "config"
          
          config_map {
            name = kubernetes_config_map.xray_daemon_config.metadata[0].name
            
            item {
              key  = "config.yaml"
              path = "config.yaml"
            }
          }
        }
        
        node_selector = {
          "kubernetes.io/os" = "linux"
        }
        
        toleration {
          key      = "xray"
          operator = "Exists"
          effect   = "NoSchedule"
        }
      }
    }
  }
}

# Service Monitor for X-Ray Daemon
resource "kubernetes_manifest" "xray_service_monitor" {
  manifest = yamldecode(<<-EOT
    apiVersion: monitoring.coreos.com/v1
    kind: ServiceMonitor
    metadata:
      name: xray-daemon
      namespace: ${kubernetes_namespace.monitoring.metadata[0].name}
      labels:
        app: xray-daemon
        release: prometheus-stack
    spec:
      selector:
        matchLabels:
          app: xray-daemon
      namespaceSelector:
        matchNames:
          - ${kubernetes_namespace.monitoring.metadata[0].name}
      endpoints:
        - port: xray-daemon
          interval: 15s
          path: /metrics
  EOT
  )

  depends_on = [kubernetes_daemonset.xray_daemon]
}

# OpenTelemetry Collector Configuration
resource "kubernetes_config_map" "otel_collector_config" {
  metadata {
    name      = "otel-collector-config"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
  }

  data = {
    "otel-collector-config.yaml" = <<-EOT
    receivers:
      otlp:
        protocols:
          grpc:
          http:
      jaeger:
        protocols:
          grpc:
          thrift_compact:
          thrift_binary:
          thrift_http:
      zipkin:
      opencensus:
      prometheus:
        config:
          scrape_configs:
            - job_name: 'otel-collector'
              scrape_interval: 10s
              static_configs:
                - targets: ['0.0.0.0:8888']
    processors:
      batch:
      memory_limiter:
        check_interval: 1s
        limit_mib: 512
        spike_limit_mib: 256
      resource:
        attributes:
          - key: service.name
            value: ${var.app_name}
            action: upsert
          - key: environment
            value: ${var.environment}
            action: upsert
    exporters:
      logging:
        loglevel: debug
      otlp:
        endpoint: "jaeger-collector.${kubernetes_namespace.monitoring.metadata[0].name}.svc.cluster.local:4317"
        tls:
          insecure: true
      awsxray:
        region: ${var.aws_region}
    service:
      pipelines:
        traces:
          receivers: [otlp, jaeger, zipkin]
          processors: [batch, memory_limiter]
          exporters: [otlp, awsxray]
        metrics:
          receivers: [otlp, prometheus]
          processors: [batch]
          exporters: [logging]
        logs:
          receivers: [otlp]
          processors: [memory_limiter, batch]
          exporters: [logging]
    EOT
  }
}

# IAM Role for OpenTelemetry Collector
resource "aws_iam_role" "opentelemetry_collector" {
  name = "opentelemetry-collector-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/${replace(data.aws_eks_cluster.cluster.identity[0].oidc[0].issuer, "https://", "")}"
        }
        Condition = {
          StringEquals = {
            "${replace(data.aws_eks_cluster.cluster.identity[0].oidc[0].issuer, "https://", "")}:sub" = "system:serviceaccount:monitoring:opentelemetry-collector"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "opentelemetry_collector" {
  role       = aws_iam_role.opentelemetry_collector.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# OpenTelemetry Collector Service Account
resource "kubernetes_service_account" "opentelemetry_collector" {
  metadata {
    name      = "opentelemetry-collector"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.opentelemetry_collector.arn
    }
  }
}

# OpenTelemetry Collector Deployment
resource "kubernetes_deployment" "opentelemetry_collector" {
  metadata {
    name      = "opentelemetry-collector"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    labels = {
      app = "opentelemetry-collector"
    }
  }

  spec {
    replicas = 2
    
    selector {
      match_labels = {
        app = "opentelemetry-collector"
      }
    }
    
    template {
      metadata {
        labels = {
          app = "opentelemetry-collector"
        }
      }
      
      spec {
        service_account_name = kubernetes_service_account.opentelemetry_collector.metadata[0].name
        
        container {
          name  = "opentelemetry-collector"
          image = "otel/opentelemetry-collector:0.61.0"
          
          args = [
            "--config=/etc/otel-collector-config/otel-collector-config.yaml"
          ]
          
          port {
            container_port = 4317
            name          = "otlp-grpc"
          }
          
          port {
            container_port = 4318
            name          = "otlp-http"
          }
          
          port {
            container_port = 8888
            name          = "metrics"
          }
          
          resources {
            limits = {
              cpu    = "500m"
              memory = "1Gi"
            }
            requests = {
              cpu    = "100m"
              memory = "256Mi"
            }
          }
          
          volume_mount {
            name       = "otel-collector-config"
            mount_path = "/etc/otel-collector-config"
            read_only  = true
          }
          
          liveness_probe {
            http_get {
              path = "/"
              port = 13133
            }
            initial_delay_seconds = 30
            period_seconds        = 10
            timeout_seconds       = 5
            failure_threshold     = 3
          }
          
          readiness_probe {
            http_get {
              path = "/"
              port = 13133
            }
            initial_delay_seconds = 5
            period_seconds        = 10
            timeout_seconds       = 5
            failure_threshold     = 3
          }
        }
        
        volume {
          name = "otel-collector-config"
          
          config_map {
            name = kubernetes_config_map.otel_collector_config.metadata[0].name
            
            items {
              key  = "otel-collector-config.yaml"
              path = "otel-collector-config.yaml"
            }
          }
        }
        
        node_selector = {
          "kubernetes.io/os" = "linux"
        }
      }
    }
  }
}

# OpenTelemetry Collector Service
resource "kubernetes_service" "opentelemetry_collector" {
  metadata {
    name      = "opentelemetry-collector"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    labels = {
      app = "opentelemetry-collector"
    }
  }

  spec {
    port {
      name        = "otlp-grpc"
      port        = 4317
      target_port = "otlp-grpc"
    }
    
    port {
      name        = "otlp-http"
      port        = 4318
      target_port = "otlp-http"
    }
    
    port {
      name        = "metrics"
      port        = 8888
      target_port = "metrics"
    }
    
    selector = {
      app = "opentelemetry-collector"
    }
    
    type = "ClusterIP"
  }
}

# Service Monitor for OpenTelemetry Collector
resource "kubernetes_manifest" "opentelemetry_service_monitor" {
  manifest = yamldecode(<<-EOT
    apiVersion: monitoring.coreos.com/v1
    kind: ServiceMonitor
    metadata:
      name: opentelemetry-collector
      namespace: ${kubernetes_namespace.monitoring.metadata[0].name}
      labels:
        app: opentelemetry-collector
        release: prometheus-stack
    spec:
      selector:
        matchLabels:
          app: opentelemetry-collector
      namespaceSelector:
        matchNames:
          - ${kubernetes_namespace.monitoring.metadata[0].name}
      endpoints:
        - port: metrics
          interval: 15s
          path: /metrics
  EOT
  )

  depends_on = [kubernetes_deployment.opentelemetry_collector]
}

# Outputs
output "jaeger_ui_url" {
  value       = "http://${kubernetes_service.jaeger_collector.metadata[0].name}.${kubernetes_namespace.monitoring.metadata[0].name}.svc.cluster.local:16686"
  description = "Jaeger UI URL"
}

output "otlp_grpc_endpoint" {
  value       = "${kubernetes_service.opentelemetry_collector.metadata[0].name}.${kubernetes_namespace.monitoring.metadata[0].name}.svc.cluster.local:4317"
  description = "OTLP gRPC endpoint for sending traces"
}

output "otlp_http_endpoint" {
  value       = "http://${kubernetes_service.opentelemetry_collector.metadata[0].name}.${kubernetes_namespace.monitoring.metadata[0].name}.svc.cluster.local:4318"
  description = "OTLP HTTP endpoint for sending traces"
}
