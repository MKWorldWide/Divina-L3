# ElastiCache Redis Module for GameDin L3 + AthenaMist AI

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  count = var.create_subnet_group ? 1 : 0

  name       = var.subnet_group_name
  subnet_ids = var.subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_id}-subnet-group"
    }
  )
}

# ElastiCache Parameter Group
resource "aws_elasticache_parameter_group" "main" {
  count = var.create_parameter_group ? 1 : 0

  family = var.family
  name   = "${var.cluster_id}-parameter-group"

  dynamic "parameter" {
    for_each = var.parameters
    content {
      name  = parameter.value.name
      value = parameter.value.value
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_id}-parameter-group"
    }
  )
}

# ElastiCache Replication Group (Redis Cluster)
resource "aws_elasticache_replication_group" "main" {
  replication_group_id          = var.cluster_id
  replication_group_description = "Redis cluster for ${var.cluster_id}"
  node_type                     = var.node_type
  port                          = var.port
  parameter_group_name          = var.create_parameter_group ? aws_elasticache_parameter_group.main[0].name : var.parameter_group_name
  subnet_group_name             = var.create_subnet_group ? aws_elasticache_subnet_group.main[0].name : var.subnet_group_name
  security_group_ids            = var.security_group_ids

  num_cache_clusters = var.num_cache_clusters
  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled          = var.multi_az_enabled

  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled
  auth_token                 = var.auth_token

  kms_key_id = var.at_rest_encryption_enabled ? var.kms_key_id : null

  snapshot_window = var.snapshot_window
  snapshot_retention_limit = var.snapshot_retention_limit

  maintenance_window = var.maintenance_window

  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis[0].name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis[0].name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "engine-log"
  }

  tags = merge(
    var.tags,
    {
      Name = var.cluster_id
    }
  )
}

# ElastiCache User Group
resource "aws_elasticache_user_group" "main" {
  count = var.create_user_group ? 1 : 0

  user_group_id = "${var.cluster_id}-user-group"
  engine        = "redis"

  user_ids = var.user_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_id}-user-group"
    }
  )
}

# CloudWatch Log Group for Redis
resource "aws_cloudwatch_log_group" "redis" {
  count = var.enable_cloudwatch_logs ? 1 : 0

  name              = "/aws/elasticache/${var.cluster_id}"
  retention_in_days = var.cloudwatch_log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_id}-logs"
    }
  )
}

# CloudWatch Alarms for Redis
resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.cluster_id}-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Redis cluster CPU utilization is high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    CacheClusterId = var.cluster_id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.cluster_id}-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "Redis cluster memory utilization is high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    CacheClusterId = var.cluster_id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "redis_connections" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.cluster_id}-connection-count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CurrConnections"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "Redis cluster connection count is high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    CacheClusterId = var.cluster_id
  }

  tags = var.tags
}

# IAM Role for CloudWatch Logs
resource "aws_iam_role" "cloudwatch_logs" {
  count = var.enable_cloudwatch_logs ? 1 : 0

  name = "${var.cluster_id}-cloudwatch-logs"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "elasticache.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "cloudwatch_logs" {
  count = var.enable_cloudwatch_logs ? 1 : 0

  name = "${var.cluster_id}-cloudwatch-logs-policy"
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

# KMS Key for Redis Encryption
resource "aws_kms_key" "redis" {
  count = var.at_rest_encryption_enabled && var.kms_key_id == null ? 1 : 0

  description             = "KMS key for ElastiCache Redis encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_id}-redis-key"
    }
  )
}

resource "aws_kms_alias" "redis" {
  count = var.at_rest_encryption_enabled && var.kms_key_id == null ? 1 : 0

  name          = "alias/${var.cluster_id}-redis"
  target_key_id = aws_kms_key.redis[0].key_id
}

# Redis User (if using Redis 6.0+ with ACLs)
resource "aws_elasticache_user" "main" {
  count = var.create_user ? 1 : 0

  user_id       = var.user_id
  user_name     = var.user_name
  access_string = var.access_string
  engine        = "redis"

  passwords = var.user_passwords

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_id}-user"
    }
  )
}

# Redis Subnet Group for Multi-AZ
resource "aws_elasticache_subnet_group" "multi_az" {
  count = var.multi_az_enabled && var.create_subnet_group ? 1 : 0

  name       = "${var.cluster_id}-multi-az-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_id}-multi-az-subnet-group"
    }
  )
}

# Backup Configuration
resource "aws_elasticache_replication_group" "backup" {
  count = var.enable_backup ? 1 : 0

  replication_group_id          = "${var.cluster_id}-backup"
  replication_group_description = "Redis backup cluster for ${var.cluster_id}"
  node_type                     = var.backup_node_type
  port                          = var.port
  parameter_group_name          = var.create_parameter_group ? aws_elasticache_parameter_group.main[0].name : var.parameter_group_name
  subnet_group_name             = var.create_subnet_group ? aws_elasticache_subnet_group.main[0].name : var.subnet_group_name
  security_group_ids            = var.security_group_ids

  num_cache_clusters = 1
  automatic_failover_enabled = false
  multi_az_enabled          = false

  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled

  kms_key_id = var.at_rest_encryption_enabled ? (var.kms_key_id != null ? var.kms_key_id : aws_kms_key.redis[0].arn) : null

  snapshot_window = var.backup_snapshot_window
  snapshot_retention_limit = var.backup_snapshot_retention_limit

  maintenance_window = var.backup_maintenance_window

  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_id}-backup"
      Purpose = "Backup"
    }
  )
}

# Data source for current AWS account
data "aws_caller_identity" "current" {} 