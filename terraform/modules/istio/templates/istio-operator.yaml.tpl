apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  namespace: istio-system
  name: gamedin-istio-operator
spec:
  profile: default
  revision: "${istio_version}"
  hub: docker.io/istio
  tag: ${istio_version}
  
  components:
    # Control Plane
    base:
      enabled: true
    pilot:
      enabled: true
      k8s:
        resources:
          requests:
            cpu: ${istiod_resources.requests.cpu}
            memory: ${istiod_resources.requests.memory}
          limits:
            cpu: ${istiod_resources.limits.cpu}
            memory: ${istiod_resources.limits.memory}
        hpaSpec:
          minReplicas: 2
          maxReplicas: 5
          metrics:
            - type: Resource
              resource:
                name: cpu
                targetAverageUtilization: 80
    
    # Ingress Gateway
    ingressGateways:
      - name: istio-ingressgateway
        enabled: ${enable_ingress_gateway}
        k8s:
          service:
            type: LoadBalancer
            ports:
              - port: 80
                targetPort: 8080
                name: http2
              - port: 443
                targetPort: 8443
                name: https
              - port: 15443
                name: tls
          resources:
            requests:
              cpu: ${ingress_gateway_resources.requests.cpu}
              memory: ${ingress_gateway_resources.requests.memory}
            limits:
              cpu: ${ingress_gateway_resources.limits.cpu}
              memory: ${ingress_gateway_resources.limits.memory}
    
    # Egress Gateway
    egressGateways:
      - name: istio-egressgateway
        enabled: ${enable_egress_gateway}
        k8s:
          resources:
            requests:
              cpu: ${egress_gateway_resources.requests.cpu}
              memory: ${egress_gateway_resources.requests.memory}
            limits:
              cpu: ${egress_gateway_resources.limits.cpu}
              memory: ${egress_gateway_resources.limits.memory}
    
    # CNI
    cni:
      enabled: ${enable_istio_cni}
    
    # Istio Operator
    istioOperator:
      enabled: ${enable_istio_operator}
  
  # Mesh Configuration
  meshConfig:
    enableTracing: ${enable_tracing}
    enableAutoMtls: true
    accessLogFile: /dev/stdout
    accessLogEncoding: JSON
    defaultConfig:
      proxyMetadata:
        ISTIO_META_DNS_CAPTURE: "true"
        ISTIO_META_DNS_AUTO_ALLOCATE: "true"
      tracing:
        zipkin:
          address: zipkin.istio-system:9411
    enablePrometheusMerge: true
    
    # Protocol Detection
    protocolDetectionTimeout: 0s
    
    # Outbound Traffic Policy
    outboundTrafficPolicy:
      mode: ALLOW_ANY
    
    # Default Service Export to
    defaultServiceExportTo:
      - "*"
    
    # Default Virtual Service Export to
    defaultVirtualServiceExportTo:
      - "*"
    
    # Default Destination Rule Export to
    defaultDestinationRuleExportTo:
      - "*"
  
  # Values Configuration
  values:
    global:
      # Multi-cluster mesh ID
      meshID: ${mesh_id}
      
      # Multi-cluster configuration
      multiCluster:
        clusterName: ${cluster_name}
        enabled: ${enable_multi_cluster}
      
      # Network configuration
      network: ${cluster_network}
      
      # Proxy configuration
      proxy:
        accessLogFile: /dev/stdout
        accessLogEncoding: JSON
        
        # Resource settings for sidecar
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 2000m
            memory: 1024Mi
      
      # Control plane security settings
      controlPlaneSecurityEnabled: true
      
      # Default node selector for all components
      defaultNodeSelector:
        kubernetes.io/os: linux
      
      # Default pod disruption budget
      defaultPodDisruptionBudget:
        enabled: true
        minAvailable: 1
    
    # Sidecar injector configuration
    sidecarInjectorWebhook:
      enabled: ${enable_sidecar_injector}
      rewriteAppHTTPProbe: true
      enableNamespacesByDefault: false
      
      # Auto-injection for specific namespaces
      neverInjectSelector:
        - notConfig: {}
      alwaysInjectSelector:
        - notConfig: {}
    
    # Gateway API configuration
    gatewayAPI:
      enabled: ${enable_gateway_api}
    
    # CNI configuration
    cni:
      enabled: ${enable_istio_cni}
      chained: true
      repair:
        enabled: true
        hub: docker.io/istio
        tag: ${istio_version}
        labelPods: true
        deletePods: true
        initContainerName: istio-validation
        brokenPodLabelKey: cni.istio.io/uninitialized
        brokenPodLabelValue: "true"
    
    # Tracing configuration
    tracing:
      enabled: ${enable_tracing}
      provider: jaeger
      
      # Jaeger configuration
      jaeger:
        template: all-in-one
        
        # Jaeger all-in-one configuration
        allInOne:
          enabled: true
          image: jaegertracing/all-in-one
          tag: 1.40.0
          
          # Resource settings for Jaeger
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 1000m
              memory: 1024Mi
    
    # Kiali configuration
    kiali:
      enabled: true
      
      # Kiali dashboard configuration
      dashboard:
        secretName: kiali
        usernameKey: username
        passphraseKey: passphrase
      
      # Kiali service configuration
      service:
        type: ClusterIP
        nodePort: null
        externalPort: 20001
        internalPort: 20001
        annotations: {}
      
      # Kiali security configuration
      security:
        cert_file: "/kiali-cert/cert-chain.pem"
        private_key_file: "/kiali-cert/key.pem"
      
      # Kiali prometheus configuration
      prometheusAddr: "http://prometheus.istio-system.svc:9090"
      
      # Kiali grafana configuration
      grafanaURL: "http://grafana.istio-system.svc:3000"
      
      # Kiali jaeger configuration
      jaegerURL: "http://tracing.istio-system.svc:80/jaeger"
      
      # Kiali logging configuration
      logging:
        log_level: info
        log_to_console: true
        time_field_format: "2006-01-02T15:04:05Z07:00"
    
    # Grafana configuration
    grafana:
      enabled: true
      
      # Grafana service configuration
      service:
        type: ClusterIP
        nodePort: null
        externalPort: 3000
        internalPort: 3000
        annotations: {}
      
      # Grafana security configuration
      security:
        enabled: true
        secretName: grafana
        usernameKey: username
        passphraseKey: passphrase
      
      # Grafana persistence configuration
      persistence:
        enabled: true
        storageClassName: "gp2"
        accessMode: ReadWriteOnce
        size: 10Gi
    
    # Prometheus configuration
    prometheus:
      enabled: true
      
      # Prometheus retention period
      retention: 15d
      
      # Prometheus scrape interval
      scrapeInterval: 15s
      
      # Prometheus service configuration
      service:
        type: ClusterIP
        nodePort: null
        externalPort: 9090
        internalPort: 9090
        annotations: {}
      
      # Prometheus persistence configuration
      prometheusSpec:
        storageSpec:
          volumeClaimTemplate:
            spec:
              accessModes: ["ReadWriteOnce"]
              resources:
                requests:
                  storage: 50Gi
    
    # Cert-manager integration
    certmanager:
      enabled: ${enable_cert_manager}
      
      # Self-signed issuer for demo purposes
      # In production, use Let's Encrypt or your own CA
      issuer:
        kind: ClusterIssuer
        name: selfsigned-issuer
        group: cert-manager.io
    
    # External Istiod configuration
    externalIstiod:
      enabled: ${enable_external_istiod}
    
    # Mesh expansion configuration
    meshExpansion:
      enabled: false
    
    # Istio CNI configuration
    istio_cni:
      enabled: ${enable_istio_cni}
      chained: true
      
      # CNI repair configuration
      repair:
        enabled: true
        hub: docker.io/istio
        tag: ${istio_version}
        labelPods: true
        deletePods: true
        initContainerName: istio-validation
        brokenPodLabelKey: cni.istio.io/uninitialized
        brokenPodLabelValue: "true"
