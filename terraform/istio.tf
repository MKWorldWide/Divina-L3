# Istio Service Mesh Configuration for GameDin L3

module "istio" {
  source = "./modules/istio"
  
  # Basic Configuration
  istio_version = "1.16.0"
  cluster_name  = var.cluster_name
  mesh_id       = "gamedin-mesh"
  
  # Feature Flags
  enable_auto_injection   = true
  enable_tracing          = true
  enable_egress_gateway   = true
  enable_ingress_gateway  = true
  enable_sidecar_injector = true
  enable_multi_cluster    = false
  enable_cert_manager     = true
  enable_gateway_api      = true
  enable_istio_cni        = true
  
  # Namespace Configuration
  namespaces_for_sidecar_injection = [
    "default",
    "gaming",
    "ai",
    "blockchain",
    "monitoring"
  ]
  
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
  
  ingress_gateway_resources = {
    requests = {
      cpu    = "100m"
      memory = "128Mi"
    }
    limits = {
      cpu    = "1000m"
      memory = "1024Mi"
    }
  }
  
  egress_gateway_resources = {
    requests = {
      cpu    = "100m"
      memory = "128Mi"
    }
    limits = {
      cpu    = "500m"
      memory = "512Mi"
    }
  }
  
  # GameFi Gateway Configuration
  gateways = [
    {
      name      = "gaming-gateway"
      namespace = "istio-system"
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
        },
        {
          port = {
            number   = 443
            name     = "https"
            protocol = "HTTPS"
          }
          tls = {
            mode           = "SIMPLE"
            credentialName = "gamedin-tls"
          }
          hosts = ["*.gamedin.io"]
        }
      ]
    }
  ]
  
  # Virtual Services for GameFi Applications
  virtual_services = [
    # Main Game API
    {
      name      = "game-api"
      namespace = "gaming"
      spec = {
        hosts    = ["api.gamedin.io"]
        gateways = ["gaming-gateway"]
        http = [
          {
            route = [
              {
                destination = {
                  host = "game-api.gaming.svc.cluster.local"
                  port = {
                    number = 80
                  }
                }
              }
            ]
          }
        ]
      }
    },
    
    # Web3 RPC Gateway
    {
      name      = "web3-gateway"
      namespace = "blockchain"
      spec = {
        hosts    = ["rpc.gamedin.io"]
        gateways = ["gaming-gateway"]
        http = [
          {
            route = [
              {
                destination = {
                  host = "web3-gateway.blockchain.svc.cluster.local"
                  port = {
                    number = 8545
                  }
                }
              }
            ]
          }
        ]
      }
    },
    
    # NFT Marketplace
    {
      name      = "nft-marketplace"
      namespace = "gaming"
      spec = {
        hosts    = ["nft.gamedin.io"]
        gateways = ["gaming-gateway"]
        http = [
          {
            route = [
              {
                destination = {
                  host = "nft-marketplace.gaming.svc.cluster.local"
                  port = {
                    number = 3000
                  }
                }
              }
            ]
          }
        ]
      }
    }
  ]
  
  # Destination Rules for Load Balancing
  destination_rules = [
    {
      name      = "game-api"
      namespace = "gaming"
      spec = {
        host = "game-api.gaming.svc.cluster.local"
        trafficPolicy = {
          loadBalancer = {
            simple = "ROUND_ROBIN"
          }
          outlierDetection = {
            consecutive5xxErrors = 5
            interval            = "10s"
            baseEjectionTime    = "30s"
            maxEjectionPercent  = 100
          }
        }
      }
    }
  ]
  
  # Peer Authentication for mTLS
  peer_authentications = [
    {
      name      = "default"
      namespace = "istio-system"
      spec = {
        mtls = {
          mode = "STRICT"
        }
      }
    },
    {
      name      = "default"
      namespace = "gaming"
      spec = {
        mtls = {
          mode = "STRICT"
        }
      }
    },
    {
      name      = "default"
      namespace = "blockchain"
      spec = {
        mtls = {
          mode = "STRICT"
        }
      }
    }
  ]
  
  # Authorization Policies
  authorization_policies = [
    {
      name      = "deny-all"
      namespace = "gaming"
      spec = {
        action = "DENY"
        rules = [
          {
            from = [
              {
                source = {
                  notPrincipals = ["cluster.local/*"]
                }
              }
            ]
          }
        ]
      }
    },
    {
      name      = "allow-ingress"
      namespace = "istio-system"
      spec = {
        selector = {
          matchLabels = {
            app = "istio-ingressgateway"
          }
        }
        rules = [
          {
            from = [
              {
                source = {
                  ipBlocks = ["0.0.0.0/0"]
                }
              }
            ]
            to = [
              {
                operation = {
                  hosts = ["*"]
                }
              }
            ]
          }
        ]
      }
    }
  ]
  
  # Telemetry Configuration
  telemetries = [
    {
      name      = "mesh-default"
      namespace = "istio-system"
      spec = {
        accessLogging = [
          {
            providers = [
              {
                name = "stdout"
              }
            ]
          }
        ]
        metrics = [
          {
            providers = [
              {
                name = "prometheus"
              }
            ]
          }
        ]
        tracing = [
          {
            providers = [
              {
                name = "zipkin"
              }
            ],
            randomSamplingPercentage = 100
          }
        ]
      }
    }
  ]
  
  # Service Entries for External Services
  service_entries = [
    # Ethereum Mainnet
    {
      name      = "ethereum-mainnet"
      namespace = "istio-system"
      spec = {
        hosts     = ["mainnet.infura.io"]
        addresses = ["10.0.0.0/8"]
        ports = [
          {
            number   = 443
            name     = "https"
            protocol = "HTTPS"
          }
        ]
        location   = "MESH_EXTERNAL"
        resolution = "DNS"
      }
    },
    
    # IPFS Gateway
    {
      name      = "ipfs-gateway"
      namespace = "istio-system"
      spec = {
        hosts     = ["ipfs.io", "*.ipfs.dweb.link"]
        addresses = ["10.0.0.0/8"]
        ports = [
          {
            number   = 443
            name     = "https"
            protocol = "HTTPS"
          }
        ]
        location   = "MESH_EXTERNAL"
        resolution = "DNS"
      }
    }
  ]
}

# Outputs
output "istio_ingress_gateway" {
  description = "The hostname of the Istio Ingress Gateway"
  value       = module.istio.istio_ingress_gateway_load_balancer
}

output "kiali_dashboard" {
  description = "The URL for the Kiali dashboard"
  value       = module.istio.kiali_dashboard_url
}

output "jaeger_tracing" {
  description = "The URL for the Jaeger tracing UI"
  value       = module.istio.jaeger_tracing_url
}

output "grafana_dashboard" {
  description = "The URL for the Grafana dashboards"
  value       = module.istio.grafana_dashboard_url
}

output "prometheus_endpoint" {
  description = "The endpoint for Prometheus metrics"
  value       = module.istio.prometheus_endpoint
}
