# Amazon MQ Module for GameDin L3 + AthenaMist AI

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Amazon MQ Broker
resource "aws_mq_broker" "main" {
  broker_name = var.broker_name

  engine_type        = var.engine_type
  engine_version     = var.engine_version
  host_instance_type = var.host_instance_type
  deployment_mode    = var.deployment_mode

  subnet_ids = var.subnet_ids
  security_groups = var.security_groups

  user {
    username = var.username
    password = var.password
  }

  configuration {
    id       = aws_mq_configuration.main.id
    revision = aws_mq_configuration.main.latest_revision
  }

  encryption_options {
    use_aws_owned_key = var.encryption_enabled ? false : true
    kms_key_id        = var.encryption_enabled ? aws_kms_key.mq[0].arn : null
  }

  logs {
    general = var.enable_general_logs
    audit   = var.enable_audit_logs
  }

  maintenance_window_start_time {
    day_of_week = var.maintenance_window_day_of_week
    time_of_day = var.maintenance_window_time_of_day
    time_zone   = var.maintenance_window_time_zone
  }

  tags = merge(
    var.tags,
    {
      Name = var.broker_name
    }
  )
}

# Amazon MQ Configuration
resource "aws_mq_configuration" "main" {
  description    = "Configuration for ${var.broker_name}"
  name           = "${var.broker_name}-configuration"
  engine_type    = var.engine_type
  engine_version = var.engine_version

  data = templatefile("${path.module}/configuration.xml", {
    max_connections = var.max_connections
    max_channels    = var.max_channels
    max_queues      = var.max_queues
    max_exchanges   = var.max_exchanges
    max_bindings    = var.max_bindings
    max_users       = var.max_users
    max_vhosts      = var.max_vhosts
    heartbeat       = var.heartbeat
    frame_max       = var.frame_max
    channel_max     = var.channel_max
    vm_memory_high_watermark = var.vm_memory_high_watermark
    vm_memory_high_watermark_paging_ratio = var.vm_memory_high_watermark_paging_ratio
    disk_free_limit = var.disk_free_limit
    log_level       = var.log_level
    cluster_formation_backoff = var.cluster_formation_backoff
    cluster_formation_disk_free_limit = var.cluster_formation_disk_free_limit
    cluster_formation_partition_handling_strategy = var.cluster_formation_partition_handling_strategy
    cluster_formation_peer_discovery_backoff = var.cluster_formation_peer_discovery_backoff
    cluster_formation_peer_discovery_kickback = var.cluster_formation_peer_discovery_kickback
    cluster_partition_handling = var.cluster_partition_handling
    net_ticktime    = var.net_ticktime
    tcp_listen_options = var.tcp_listen_options
    ssl_options     = var.ssl_options
    management_ssl_options = var.management_ssl_options
    auth_backends   = var.auth_backends
    auth_mechanisms = var.auth_mechanisms
    default_vhost   = var.default_vhost
    default_user    = var.default_user
    default_permissions = var.default_permissions
    default_topic_permissions = var.default_topic_permissions
    default_queue_type = var.default_queue_type
    default_consumer_prefetch = var.default_consumer_prefetch
    default_publisher_confirm_timeout = var.default_publisher_confirm_timeout
    default_consumer_timeout = var.default_consumer_timeout
    default_heartbeat = var.default_heartbeat
    default_connection_timeout = var.default_connection_timeout
    default_channel_max = var.default_channel_max
    default_frame_max = var.default_frame_max
    default_vhost_max_connections = var.default_vhost_max_connections
    default_vhost_max_queues = var.default_vhost_max_queues
    default_vhost_max_exchanges = var.default_vhost_max_exchanges
    default_vhost_max_bindings = var.default_vhost_max_bindings
    default_vhost_max_users = var.default_vhost_max_users
    default_vhost_max_topic_permissions = var.default_vhost_max_topic_permissions
    default_vhost_max_connections_per_user = var.default_vhost_max_connections_per_user
    default_vhost_max_queues_per_user = var.default_vhost_max_queues_per_user
    default_vhost_max_exchanges_per_user = var.default_vhost_max_exchanges_per_user
    default_vhost_max_bindings_per_user = var.default_vhost_max_bindings_per_user
    default_vhost_max_users_per_user = var.default_vhost_max_users_per_user
    default_vhost_max_topic_permissions_per_user = var.default_vhost_max_topic_permissions_per_user
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.broker_name}-configuration"
    }
  )
}

# KMS Key for MQ Encryption
resource "aws_kms_key" "mq" {
  count = var.encryption_enabled ? 1 : 0

  description             = "KMS key for Amazon MQ encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    var.tags,
    {
      Name = "${var.broker_name}-mq-key"
    }
  )
}

resource "aws_kms_alias" "mq" {
  count = var.encryption_enabled ? 1 : 0

  name          = "alias/${var.broker_name}-mq"
  target_key_id = aws_kms_key.mq[0].key_id
}

# CloudWatch Log Group for MQ Logs
resource "aws_cloudwatch_log_group" "mq_general" {
  count = var.enable_general_logs ? 1 : 0

  name              = "/aws/amazonmq/${var.broker_name}/general"
  retention_in_days = var.cloudwatch_log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.broker_name}-general-logs"
    }
  )
}

resource "aws_cloudwatch_log_group" "mq_audit" {
  count = var.enable_audit_logs ? 1 : 0

  name              = "/aws/amazonmq/${var.broker_name}/audit"
  retention_in_days = var.cloudwatch_log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.broker_name}-audit-logs"
    }
  )
}

# CloudWatch Alarms for MQ
resource "aws_cloudwatch_metric_alarm" "mq_connections" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.broker_name}-connection-count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ConnectionCount"
  namespace           = "AWS/AmazonMQ"
  period              = "300"
  statistic           = "Average"
  threshold           = "100"
  alarm_description   = "Amazon MQ connection count is high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    Broker = var.broker_name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "mq_messages" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.broker_name}-message-count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MessageCount"
  namespace           = "AWS/AmazonMQ"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "Amazon MQ message count is high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    Broker = var.broker_name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "mq_cpu" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.broker_name}-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CpuUtilization"
  namespace           = "AWS/AmazonMQ"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Amazon MQ CPU utilization is high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    Broker = var.broker_name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "mq_memory" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.broker_name}-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/AmazonMQ"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "Amazon MQ memory utilization is high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    Broker = var.broker_name
  }

  tags = var.tags
}

# IAM Role for CloudWatch Logs
resource "aws_iam_role" "cloudwatch_logs" {
  count = var.enable_general_logs || var.enable_audit_logs ? 1 : 0

  name = "${var.broker_name}-cloudwatch-logs"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "mq.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "cloudwatch_logs" {
  count = var.enable_general_logs || var.enable_audit_logs ? 1 : 0

  name = "${var.broker_name}-cloudwatch-logs-policy"
  role = aws_iam_role.cloudwatch_logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# Data source for current AWS account
data "aws_caller_identity" "current" {} 