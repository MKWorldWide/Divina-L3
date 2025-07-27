# Istio Service Mesh Module for GameDin L3

# Download and install Istio CLI
resource "null_resource" "download_istio" {
  provisioner "local-exec" {
    command = <<-EOT
      curl -L https://istio.io/downloadIstio | ISTIO_VERSION=${var.istio_version} sh -
      mv istio-${var.istio_version}/bin/istioctl /usr/local/bin/istioctl
      chmod +x /usr/local/bin/istioctl
    EOT
  }

  triggers = {
    istio_version = var.istio_version
  }
}

# Create Istio Operator configuration
resource "local_file" "istio_operator" {
  filename = "${path.module}/files/istio-operator.yaml"
  content = templatefile("${path.module}/templates/istio-operator.yaml.tpl", {
    istio_version           = var.istio_version
    enable_auto_injection   = var.enable_auto_injection
    enable_tracing          = var.enable_tracing
    enable_egress_gateway   = var.enable_egress_gateway
    enable_ingress_gateway  = var.enable_ingress_gateway
    enable_sidecar_injector = var.enable_sidecar_injector
    mesh_id                 = var.mesh_id
    cluster_name            = var.cluster_name
    cluster_network        = var.cluster_network
    enable_multi_cluster    = var.enable_multi_cluster
    enable_cni              = var.enable_cni
    enable_cert_manager     = var.enable_cert_manager
    enable_gateway_api      = var.enable_gateway_api
    enable_external_istiod  = var.enable_external_istiod
    enable_istio_cni        = var.enable_istio_cni
    enable_istio_operator   = var.enable_istio_operator
  })

  depends_on = [null_resource.download_istio]
}

# Install Istio using the operator
resource "null_resource" "install_istio" {
  provisioner "local-exec" {
    command = <<-EOT
      kubectl create namespace istio-system --dry-run=client -o yaml | kubectl apply -f -
      istioctl install -f ${local_file.istio_operator.filename} -y
    EOT
  }

  depends_on = [local_file.istio_operator]
}

# Enable sidecar injection for namespaces
resource "null_resource" "enable_sidecar_injection" {
  for_each = toset(var.namespaces_for_sidecar_injection)
  
  provisioner "local-exec" {
    command = <<-EOT
      kubectl label namespace ${each.value} istio-injection=enabled --overwrite
    EOT
  }

  depends_on = [null_resource.install_istio]
}

# Install Istio addons if enabled
resource "null_resource" "install_addons" {
  count = var.install_addons ? 1 : 0
  
  provisioner "local-exec" {
    command = <<-EOT
      kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-${var.istio_version}/samples/addons/prometheus.yaml
      kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-${var.istio_version}/samples/addons/grafana.yaml
      kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-${var.istio_version}/samples/addons/jaeger.yaml
      kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-${var.istio_version}/samples/addons/kiali.yaml
    EOT
  }

  depends_on = [null_resource.install_istio]
}

# Configure Istio Ingress Gateway
resource "kubernetes_ingress_v1" "istio_ingress" {
  count = var.enable_ingress_gateway ? 1 : 0
  
  metadata {
    name      = "istio-ingress"
    namespace = "istio-system"
    annotations = merge(
      {
        "kubernetes.io/ingress.class" = "istio"
      },
      var.ingress_annotations
    )
  }

  spec {
    rule {
      host = var.ingress_host
      http {
        path {
          path = "/*"
          backend {
            service {
              name = "istio-ingressgateway"
              port {
                number = 80
              }
            }
          }
        }
      }
    }
  }

  depends_on = [null_resource.install_istio]
}

# Configure Istio Egress Gateway
resource "kubernetes_ingress_v1" "istio_egress" {
  count = var.enable_egress_gateway ? 1 : 0
  
  metadata {
    name      = "istio-egress"
    namespace = "istio-system"
    annotations = merge(
      {
        "kubernetes.io/ingress.class" = "istio"
      },
      var.egress_annotations
    )
  }

  spec {
    rule {
      host = var.egress_host
      http {
        path {
          path = "/*"
          backend {
            service {
              name = "istio-egressgateway"
              port {
                number = 80
              }
            }
          }
        }
      }
    }
  }

  depends_on = [null_resource.install_istio]
}

# Create Istio Gateway resources
resource "kubernetes_manifest" "gateway" {
  for_each = { for idx, gw in var.gateways : gw.name => gw }
  
  manifest = {
    apiVersion = "networking.istio.io/v1alpha3"
    kind       = "Gateway"
    metadata = {
      name      = each.value.name
      namespace = each.value.namespace
    }
    spec = {
      selector = {
        istio = each.value.selector
      }
      servers = each.value.servers
    }
  }

  depends_on = [null_resource.install_istio]
}

# Create VirtualService resources
resource "kubernetes_manifest" "virtual_service" {
  for_each = { for idx, vs in var.virtual_services : vs.name => vs }
  
  manifest = {
    apiVersion = "networking.istio.io/v1alpha3"
    kind       = "VirtualService"
    metadata = {
      name      = each.value.name
      namespace = each.value.namespace
    }
    spec = each.value.spec
  }

  depends_on = [null_resource.install_istio]
}

# Create DestinationRule resources
resource "kubernetes_manifest" "destination_rule" {
  for_each = { for idx, dr in var.destination_rules : dr.name => dr }
  
  manifest = {
    apiVersion = "networking.istio.io/v1alpha3"
    kind       = "DestinationRule"
    metadata = {
      name      = each.value.name
      namespace = each.value.namespace
    }
    spec = each.value.spec
  }

  depends_on = [null_resource.install_istio]
}

# Create ServiceEntry resources
resource "kubernetes_manifest" "service_entry" {
  for_each = { for idx, se in var.service_entries : se.name => se }
  
  manifest = {
    apiVersion = "networking.istio.io/v1alpha3"
    kind       = "ServiceEntry"
    metadata = {
      name      = each.value.name
      namespace = each.value.namespace
    }
    spec = each.value.spec
  }

  depends_on = [null_resource.install_istio]
}

# Create AuthorizationPolicy resources
resource "kubernetes_manifest" "authorization_policy" {
  for_each = { for idx, ap in var.authorization_policies : ap.name => ap }
  
  manifest = {
    apiVersion = "security.istio.io/v1beta1"
    kind       = "AuthorizationPolicy"
    metadata = {
      name      = each.value.name
      namespace = each.value.namespace
    }
    spec = each.value.spec
  }

  depends_on = [null_resource.install_istio]
}

# Create PeerAuthentication resources
resource "kubernetes_manifest" "peer_authentication" {
  for_each = { for idx, pa in var.peer_authentications : pa.name => pa }
  
  manifest = {
    apiVersion = "security.istio.io/v1beta1"
    kind       = "PeerAuthentication"
    metadata = {
      name      = each.value.name
      namespace = each.value.namespace
    }
    spec = each.value.spec
  }

  depends_on = [null_resource.install_istio]
}

# Create RequestAuthentication resources
resource "kubernetes_manifest" "request_authentication" {
  for_each = { for idx, ra in var.request_authentications : ra.name => ra }
  
  manifest = {
    apiVersion = "security.istio.io/v1beta1"
    kind       = "RequestAuthentication"
    metadata = {
      name      = each.value.name
      namespace = each.value.namespace
    }
    spec = each.value.spec
  }

  depends_on = [null_resource.install_istio]
}

# Create Sidecar resources
resource "kubernetes_manifest" "sidecar" {
  for_each = { for idx, sc in var.sidecars : sc.name => sc }
  
  manifest = {
    apiVersion = "networking.istio.io/v1alpha3"
    kind       = "Sidecar"
    metadata = {
      name      = each.value.name
      namespace = each.value.namespace
    }
    spec = each.value.spec
  }

  depends_on = [null_resource.install_istio]
}

# Create EnvoyFilter resources
resource "kubernetes_manifest" "envoy_filter" {
  for_each = { for idx, ef in var.envoy_filters : ef.name => ef }
  
  manifest = {
    apiVersion = "networking.istio.io/v1alpha3"
    kind       = "EnvoyFilter"
    metadata = {
      name      = each.value.name
      namespace = each.value.namespace
    }
    spec = each.value.spec
  }

  depends_on = [null_resource.install_istio]
}

# Create WorkloadEntry resources
resource "kubernetes_manifest" "workload_entry" {
  for_each = { for idx, we in var.workload_entries : we.name => we }
  
  manifest = {
    apiVersion = "networking.istio.io/v1alpha3"
    kind       = "WorkloadEntry"
    metadata = {
      name      = each.value.name
      namespace = each.value.namespace
    }
    spec = each.value.spec
  }

  depends_on = [null_resource.install_istio]
}

# Create WorkloadGroup resources
resource "kubernetes_manifest" "workload_group" {
  for_each = { for idx, wg in var.workload_groups : wg.name => wg }
  
  manifest = {
    apiVersion = "networking.istio.io/v1alpha3"
    kind       = "WorkloadGroup"
    metadata = {
      name      = each.value.name
      namespace = each.value.namespace
    }
    spec = each.value.spec
  }

  depends_on = [null_resource.install_istio]
}

# Create Telemetry resources
resource "kubernetes_manifest" "telemetry" {
  for_each = { for idx, t in var.telemetries : t.name => t }
  
  manifest = {
    apiVersion = "telemetry.istio.io/v1alpha1"
    kind       = "Telemetry"
    metadata = {
      name      = each.value.name
      namespace = each.value.namespace
    }
    spec = each.value.spec
  }

  depends_on = [null_resource.install_istio]
}

# Create WasmPlugin resources
resource "kubernetes_manifest" "wasm_plugin" {
  for_each = { for idx, wp in var.wasm_plugins : wp.name => wp }
  
  manifest = {
    apiVersion = "extensions.istio.io/v1alpha1"
    kind       = "WasmPlugin"
    metadata = {
      name      = each.value.name
      namespace = each.value.namespace
    }
    spec = each.value.spec
  }

  depends_on = [null_resource.install_istio]
}
