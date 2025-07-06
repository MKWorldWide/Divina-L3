#!/bin/bash
# User data script for EKS node groups
# This script configures the EC2 instances to join the EKS cluster

set -o errexit
set -o pipefail
set -o nounset

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Install required packages
log "Installing required packages..."
yum update -y
yum install -y \
    amazon-efs-utils \
    amazon-cloudwatch-agent \
    jq \
    curl \
    wget \
    git \
    unzip \
    docker \
    nvidia-driver \
    nvidia-docker2

# Start and enable Docker
log "Starting and enabling Docker..."
systemctl start docker
systemctl enable docker

# Install AWS CLI v2
log "Installing AWS CLI v2..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Install kubectl
log "Installing kubectl..."
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
mv kubectl /usr/local/bin/

# Install eksctl
log "Installing eksctl..."
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
mv /tmp/eksctl /usr/local/bin

# Install Helm
log "Installing Helm..."
curl https://get.helm.sh/helm-v3.12.0-linux-amd64.tar.gz | tar xz
mv linux-amd64/helm /usr/local/bin/
rm -rf linux-amd64

# Install Node.js and npm (for GameDin L3 tools)
log "Installing Node.js and npm..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install Python 3.9 and pip
log "Installing Python 3.9..."
yum install -y python3 python3-pip python3-devel

# Install additional Python packages for AI workloads
log "Installing Python packages for AI workloads..."
pip3 install --upgrade pip
pip3 install \
    numpy \
    pandas \
    scikit-learn \
    torch \
    torchvision \
    torchaudio \
    transformers \
    tensorflow \
    keras \
    opencv-python \
    pillow \
    matplotlib \
    seaborn \
    jupyter \
    ipykernel

# Configure Docker daemon for GameDin L3
log "Configuring Docker daemon..."
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ],
  "default-ulimits": {
    "nofile": {
      "Hard": 64000,
      "Name": "nofile",
      "Soft": 64000
    }
  }
}
EOF

# Restart Docker with new configuration
systemctl restart docker

# Configure system limits for high-performance gaming
log "Configuring system limits..."
cat >> /etc/security/limits.conf << EOF
# GameDin L3 - High performance limits
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
EOF

# Configure sysctl for high-performance networking
log "Configuring sysctl for high-performance networking..."
cat >> /etc/sysctl.conf << EOF
# GameDin L3 - High performance networking
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq
EOF

# Apply sysctl changes
sysctl -p

# Configure CloudWatch agent for monitoring
log "Configuring CloudWatch agent..."
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "cwagent"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/eks/${cluster_name}/system",
            "log_stream_name": "{instance_id}",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/containers/*.log",
            "log_group_name": "/aws/eks/${cluster_name}/containers",
            "log_stream_name": "{instance_id}",
            "timezone": "UTC"
          }
        ]
      }
    }
  },
  "metrics": {
    "metrics_collected": {
      "disk": {
        "measurement": [
          "used_percent"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 60
      },
      "netstat": {
        "measurement": [
          "tcp_established",
          "tcp_time_wait"
        ],
        "metrics_collection_interval": 60
      },
      "swap": {
        "measurement": [
          "swap_used_percent"
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch agent
systemctl start amazon-cloudwatch-agent
systemctl enable amazon-cloudwatch-agent

# Create directories for GameDin L3
log "Creating GameDin L3 directories..."
mkdir -p /opt/gamedin-l3/{logs,data,cache,config}
chmod 755 /opt/gamedin-l3

# Configure log rotation for GameDin L3
cat > /etc/logrotate.d/gamedin-l3 << EOF
/opt/gamedin-l3/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload amazon-cloudwatch-agent
    endscript
}
EOF

# Install and configure NVIDIA drivers for AI workloads
if lspci | grep -i nvidia > /dev/null; then
    log "NVIDIA GPU detected, configuring drivers..."
    
    # Install NVIDIA Container Toolkit
    distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
    curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.repo | tee /etc/yum.repos.d/nvidia-docker.repo
    yum install -y nvidia-container-toolkit
    systemctl restart docker
    
    # Configure Docker to use NVIDIA runtime
    cat > /etc/docker/daemon.json << EOF
{
  "default-runtime": "nvidia",
  "runtimes": {
    "nvidia": {
      "path": "nvidia-container-runtime",
      "runtimeArgs": []
    }
  }
}
EOF
    
    systemctl restart docker
fi

# Configure EKS bootstrap script
log "Configuring EKS bootstrap..."
cat > /etc/eks/bootstrap.sh << 'EOF'
#!/bin/bash
set -o errexit
set -o pipefail
set -o nounset

# Bootstrap script for EKS node groups
CLUSTER_NAME="${cluster_name}"
CLUSTER_ENDPOINT="${cluster_endpoint}"
CLUSTER_CA="${cluster_ca}"

# Create kubeconfig
mkdir -p /home/ec2-user/.kube
cat > /home/ec2-user/.kube/config << KUBECONFIG
apiVersion: v1
kind: Config
clusters:
- cluster:
    server: $CLUSTER_ENDPOINT
    certificate-authority-data: $CLUSTER_CA
  name: $CLUSTER_NAME
contexts:
- context:
    cluster: $CLUSTER_NAME
    user: aws
  name: aws
current-context: aws
preferences: {}
users:
- name: aws
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: aws
      args:
        - eks
        - get-token
        - --cluster-name
        - $CLUSTER_NAME
KUBECONFIG

chown -R ec2-user:ec2-user /home/ec2-user/.kube

# Join the cluster
/opt/aws/bin/amazon-eks-nodegroup-join.sh
EOF

chmod +x /etc/eks/bootstrap.sh

# Create systemd service for GameDin L3 monitoring
cat > /etc/systemd/system/gamedin-l3-monitor.service << EOF
[Unit]
Description=GameDin L3 System Monitor
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/python3 /opt/gamedin-l3/monitor.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create monitoring script
cat > /opt/gamedin-l3/monitor.py << 'EOF'
#!/usr/bin/env python3
"""
GameDin L3 System Monitor
Monitors system resources and reports to CloudWatch
"""

import time
import psutil
import json
import boto3
from datetime import datetime

def get_system_metrics():
    """Collect system metrics"""
    metrics = {
        'timestamp': datetime.utcnow().isoformat(),
        'cpu_percent': psutil.cpu_percent(interval=1),
        'memory_percent': psutil.virtual_memory().percent,
        'disk_percent': psutil.disk_usage('/').percent,
        'network_io': psutil.net_io_counters()._asdict(),
        'load_average': psutil.getloadavg()
    }
    return metrics

def main():
    """Main monitoring loop"""
    cloudwatch = boto3.client('cloudwatch')
    
    while True:
        try:
            metrics = get_system_metrics()
            
            # Send metrics to CloudWatch
            cloudwatch.put_metric_data(
                Namespace='GameDinL3/System',
                MetricData=[
                    {
                        'MetricName': 'CPUUtilization',
                        'Value': metrics['cpu_percent'],
                        'Unit': 'Percent'
                    },
                    {
                        'MetricName': 'MemoryUtilization',
                        'Value': metrics['memory_percent'],
                        'Unit': 'Percent'
                    },
                    {
                        'MetricName': 'DiskUtilization',
                        'Value': metrics['disk_percent'],
                        'Unit': 'Percent'
                    }
                ]
            )
            
            # Log metrics
            with open('/opt/gamedin-l3/logs/system_metrics.log', 'a') as f:
                f.write(json.dumps(metrics) + '\n')
                
        except Exception as e:
            with open('/opt/gamedin-l3/logs/monitor_error.log', 'a') as f:
                f.write(f"{datetime.utcnow().isoformat()}: {str(e)}\n")
        
        time.sleep(60)  # Collect metrics every minute

if __name__ == '__main__':
    main()
EOF

chmod +x /opt/gamedin-l3/monitor.py

# Install psutil for monitoring script
pip3 install psutil boto3

# Start monitoring service
systemctl enable gamedin-l3-monitor
systemctl start gamedin-l3-monitor

# Final system configuration
log "Final system configuration..."

# Set hostname
hostnamectl set-hostname "gamedin-l3-node-$(curl -s http://169.254.169.254/latest/meta-data/instance-id)"

# Configure timezone
timedatectl set-timezone UTC

# Disable unnecessary services
systemctl disable firewalld
systemctl stop firewalld

# Configure SSH for security
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

log "EKS node configuration completed successfully!" 