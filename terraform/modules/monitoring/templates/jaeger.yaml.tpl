apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: jaeger
  namespace: ${namespace}
  labels:
    app: jaeger
    app.kubernetes.io/name: jaeger
    app.kubernetes.io/instance: jaeger
    app.kubernetes.io/component: all-in-one
    app.kubernetes.io/part-of: jaeger
    app.kubernetes.io/managed-by: terraform
spec:
  strategy: allInOne
  allInOne:
    options:
      query:
        base-path: /jaeger
      log-level: info
  storage:
    type: ${storage_type}
    options:
      memory:
        max-traces: 100000
    %{ if storage_type == "elasticsearch" ~}
    elasticsearch:
      nodeCount: 3
      resources:
        requests:
          cpu: 1000m
          memory: 1Gi
        limits:
          cpu: 2000m
          memory: 2Gi
      storage:
        storageClassName: ${storage_class}
        size: ${storage_size}
    %{ endif ~}
    %{ if storage_type == "cassandra" ~}
    cassandra:
      datacenter: ${environment}
      mode: production
      resources:
        requests:
          cpu: 1000m
          memory: 1Gi
        limits:
          cpu: 2000m
          memory: 2Gi
      storage:
        storageClassName: ${storage_class}
        size: ${storage_size}
    %{ endif ~}
  ingress:
    enabled: true
    annotations:
      kubernetes.io/ingress.class: nginx
      nginx.ingress.kubernetes.io/rewrite-target: /$2
      nginx.ingress.kubernetes.io/configuration-snippet: |
        rewrite ^(/jaeger)$ $1/ permanent;
    path: /jaeger/?(.*)$
    hosts:
      - jaeger.${domain_name}
  service:
    type: LoadBalancer
    ports:
      - name: http-query
        port: 80
        targetPort: 16686
        protocol: TCP
  resources:
    requests:
      cpu: 500m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi
  serviceAccount:
    create: true
    name: jaeger
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "14269"
    prometheus.io/path: "/metrics"
  podAnnotations:
    sidecar.istio.io/inject: "true"
  tolerations:
    - key: node-role.kubernetes.io/master
      operator: Exists
      effect: NoSchedule
  nodeSelector:
    node-role.kubernetes.io/monitoring: "true"
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
            - key: app.kubernetes.io/name
              operator: In
              values:
              - jaeger
          topologyKey: kubernetes.io/hostname
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
