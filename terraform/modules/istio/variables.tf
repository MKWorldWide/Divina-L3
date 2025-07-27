# Istio Module Variables

# Basic Configuration
variable "istio_version" {
  description = "Version of Istio to install"
  type        = string
  default     = "1.16.0"
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "gamedin-cluster"
}

variable "mesh_id" {
  description = "Mesh ID for multi-cluster mesh"
  type        = string
  default     = "gamedin-mesh"
}

variable "cluster_network" {
  description = "Network name for multi-cluster mesh"
  type        = string
  default     = "gamedin-network"
}

# Feature Flags
variable "enable_auto_injection" {
  description = "Enable automatic sidecar injection"
  type        = bool
  default     = true
}

variable "enable_tracing" {
  description = "Enable distributed tracing"
  type        = bool
  default     = true
}

variable "enable_egress_gateway" {
  description = "Enable Istio Egress Gateway"
  type        = bool
  default     = true
}

variable "enable_ingress_gateway" {
  description = "Enable Istio Ingress Gateway"
  type        = bool
  default     = true
}

variable "enable_sidecar_injector" {
  description = "Enable automatic sidecar injection"
  type        = bool
  default     = true
}

variable "enable_multi_cluster" {
  description = "Enable multi-cluster configuration"
  type        = bool
  default     = false
}

variable "enable_cni" {
  description = "Enable Istio CNI plugin"
  type        = bool
  default     = true
}

variable "enable_cert_manager" {
  description = "Enable cert-manager integration"
  type        = bool
  default     = true
}

variable "enable_gateway_api" {
  description = "Enable Kubernetes Gateway API support"
  type        = bool
  default     = true
}

variable "enable_external_istiod" {
  description = "Use external Istiod control plane"
  type        = bool
  default     = false
}

variable "enable_istio_cni" {
  description = "Enable Istio CNI (Container Network Interface)"
  type        = bool
  default     = true
}

variable "enable_istio_operator" {
  description = "Enable Istio Operator"
  type        = bool
  default     = true
}

variable "install_addons" {
  description = "Install Istio addons (Kiali, Jaeger, Grafana, Prometheus)"
  type        = bool
  default     = true
}

# Namespace Configuration
variable "namespaces_for_sidecar_injection" {
  description = "List of namespaces to enable automatic sidecar injection"
  type        = list(string)
  default     = ["default", "gaming", "ai"]
}

# Ingress Configuration
variable "ingress_host" {
  description = "Hostname for Istio Ingress Gateway"
  type        = string
  default     = "*.gamedin.io"
}

variable "ingress_annotations" {
  description = "Annotations for Istio Ingress Gateway"
  type        = map(string)
  default     = {}
}

# Egress Configuration
variable "egress_host" {
  description = "Hostname for Istio Egress Gateway"
  type        = string
  default     = "egress.gamedin.io"
}

variable "egress_annotations" {
  description = "Annotations for Istio Egress Gateway"
  type        = map(string)
  default     = {}
}

# Resource Configuration
variable "istiod_resources" {
  description = "Resource requests and limits for Istiod"
  type = object({
    requests = object({
      cpu    = string
      memory = string
    })
    limits = object({
      cpu    = string
      memory = string
    })
  })
  default = {
    requests = {
      cpu    = "500m"
      memory = "1024Mi"
    }
    limits = {
      cpu    = "2000m"
      memory = "2048Mi"
    }
  }
}

variable "ingress_gateway_resources" {
  description = "Resource requests and limits for Ingress Gateway"
  type = object({
    requests = object({
      cpu    = string
      memory = string
    })
    limits = object({
      cpu    = string
      memory = string
    })
  })
  default = {
    requests = {
      cpu    = "100m"
      memory = "128Mi"
    }
    limits = {
      cpu    = "1000m"
      memory = "1024Mi"
    }
  }
}

variable "egress_gateway_resources" {
  description = "Resource requests and limits for Egress Gateway"
  type = object({
    requests = object({
      cpu    = string
      memory = string
    })
    limits = object({
      cpu    = string
      memory = string
    })
  })
  default = {
    requests = {
      cpu    = "100m"
      memory = "128Mi"
    }
    limits = {
      cpu    = "500m"
      memory = "512Mi"
    }
  }
}

# Istio CRDs
variable "gateways" {
  description = "List of Gateway resources to create"
  type = list(object({
    name      = string
    namespace = string
    selector  = map(string)
    servers   = list(any)
  }))
  default = []
}

variable "virtual_services" {
  description = "List of VirtualService resources to create"
  type = list(object({
    name      = string
    namespace = string
    spec      = any
  }))
  default = []
}

variable "destination_rules" {
  description = "List of DestinationRule resources to create"
  type = list(object({
    name      = string
    namespace = string
    spec      = any
  }))
  default = []
}

variable "service_entries" {
  description = "List of ServiceEntry resources to create"
  type = list(object({
    name      = string
    namespace = string
    spec      = any
  }))
  default = []
}

variable "authorization_policies" {
  description = "List of AuthorizationPolicy resources to create"
  type = list(object({
    name      = string
    namespace = string
    spec      = any
  }))
  default = []
}

variable "peer_authentications" {
  description = "List of PeerAuthentication resources to create"
  type = list(object({
    name      = string
    namespace = string
    spec      = any
  }))
  default = []
}

variable "request_authentications" {
  description = "List of RequestAuthentication resources to create"
  type = list(object({
    name      = string
    namespace = string
    spec      = any
  }))
  default = []
}

variable "sidecars" {
  description = "List of Sidecar resources to create"
  type = list(object({
    name      = string
    namespace = string
    spec      = any
  }))
  default = []
}

variable "envoy_filters" {
  description = "List of EnvoyFilter resources to create"
  type = list(object({
    name      = string
    namespace = string
    spec      = any
  }))
  default = []
}

variable "workload_entries" {
  description = "List of WorkloadEntry resources to create"
  type = list(object({
    name      = string
    namespace = string
    spec      = any
  }))
  default = []
}

variable "workload_groups" {
  description = "List of WorkloadGroup resources to create"
  type = list(object({
    name      = string
    namespace = string
    spec      = any
  }))
  default = []
}

variable "telemetries" {
  description = "List of Telemetry resources to create"
  type = list(object({
    name      = string
    namespace = string
    spec      = any
  }))
  default = []
}

variable "wasm_plugins" {
  description = "List of WasmPlugin resources to create"
  type = list(object({
    name      = string
    namespace = string
    spec      = any
  }))
  default = []
}
