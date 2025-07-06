# CloudWatch Module for GameDin L3 + AthenaMist AI

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-alerts"
    }
  )
}

# SNS Topic Subscription for Email
resource "aws_sns_topic_subscription" "email" {
  count = length(var.alert_emails) > 0 ? length(var.alert_emails) : 0

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_emails[count.index]
}

# SNS Topic Subscription for SMS
resource "aws_sns_topic_subscription" "sms" {
  count = length(var.alert_phone_numbers) > 0 ? length(var.alert_phone_numbers) : 0

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "sms"
  endpoint  = var.alert_phone_numbers[count.index]
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_name_suffix],
            [".", "TargetResponseTime", ".", "."],
            [".", "HTTPCode_ELB_4XX_Count", ".", "."],
            [".", "HTTPCode_ELB_5XX_Count", ".", "."]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Load Balancer Metrics"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", var.ecs_service_name, "ClusterName", var.ecs_cluster_name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ECS Service Metrics"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.rds_instance_id],
            [".", "DatabaseConnections", ".", "."],
            [".", "FreeableMemory", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS Metrics"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", var.redis_cluster_id],
            [".", "DatabaseMemoryUsagePercentage", ".", "."],
            [".", "CurrConnections", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Redis Metrics"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/S3", "NumberOfObjects", "BucketName", var.static_assets_bucket_name],
            [".", "BucketSizeBytes", ".", "."]
          ]
          period = 86400
          stat   = "Average"
          region = var.aws_region
          title  = "S3 Metrics"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Route53", "HealthCheckStatus", "HealthCheckId", var.route53_health_check_id]
          ]
          period = 60
          stat   = "Average"
          region = var.aws_region
          title  = "Route53 Health Check"
        }
      }
    ]
  })
}

# ECS Service Alarms
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.project_name}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "ECS service CPU utilization is high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = var.ecs_service_name
    ClusterName = var.ecs_cluster_name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.project_name}-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "ECS service memory utilization is high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = var.ecs_service_name
    ClusterName = var.ecs_cluster_name
  }

  tags = var.tags
}

# RDS Alarms
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${var.project_name}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "RDS CPU utilization is high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  alarm_name          = "${var.project_name}-rds-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "100"
  alarm_description   = "RDS database connections are high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "rds_free_memory_low" {
  alarm_name          = "${var.project_name}-rds-free-memory-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000000000"  # 1GB
  alarm_description   = "RDS free memory is low"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = var.tags
}

# Redis Alarms
resource "aws_cloudwatch_metric_alarm" "redis_cpu_high" {
  alarm_name          = "${var.project_name}-redis-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Redis CPU utilization is high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = var.redis_cluster_id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "redis_memory_high" {
  alarm_name          = "${var.project_name}-redis-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Redis memory usage is high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = var.redis_cluster_id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "redis_connections_high" {
  alarm_name          = "${var.project_name}-redis-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CurrConnections"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "Redis connections are high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = var.redis_cluster_id
  }

  tags = var.tags
}

# Load Balancer Alarms
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${var.project_name}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Load balancer 5XX errors are high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = var.alb_name_suffix
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "alb_target_response_time" {
  alarm_name          = "${var.project_name}-alb-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "Load balancer target response time is high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = var.alb_name_suffix
  }

  tags = var.tags
}

# Route53 Health Check Alarm
resource "aws_cloudwatch_metric_alarm" "route53_health_check" {
  alarm_name          = "${var.project_name}-route53-health-check"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "Route53 health check is failing"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    HealthCheckId = var.route53_health_check_id
  }

  tags = var.tags
}

# Custom Application Metrics
resource "aws_cloudwatch_metric_alarm" "application_errors" {
  alarm_name          = "${var.project_name}-application-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ApplicationErrors"
  namespace           = "GameDin/Application"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Application errors are high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "ai_service_latency" {
  alarm_name          = "${var.project_name}-ai-service-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "AIServiceLatency"
  namespace           = "GameDin/AI"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000"  # 2 seconds
  alarm_description   = "AI service latency is high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "blockchain_transaction_failures" {
  alarm_name          = "${var.project_name}-blockchain-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "BlockchainTransactionFailures"
  namespace           = "GameDin/Blockchain"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Blockchain transaction failures are high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = var.tags
}

# Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/ecs/${var.project_name}/application"
  retention_in_days = 30

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "ai_service" {
  name              = "/aws/ecs/${var.project_name}/ai-service"
  retention_in_days = 30

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "gaming_engine" {
  name              = "/aws/ecs/${var.project_name}/gaming-engine"
  retention_in_days = 30

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "blockchain_service" {
  name              = "/aws/ecs/${var.project_name}/blockchain-service"
  retention_in_days = 30

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/ecs/${var.project_name}/api-gateway"
  retention_in_days = 30

  tags = var.tags
}

# Data source for current AWS account
data "aws_caller_identity" "current" {} 