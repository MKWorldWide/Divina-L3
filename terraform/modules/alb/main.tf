# Application Load Balancer Module for GameDin L3 + AthenaMist AI

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = var.name
  internal           = var.internal
  load_balancer_type = "application"
  security_groups    = var.security_groups
  subnets            = var.subnets

  enable_deletion_protection = var.enable_deletion_protection

  dynamic "access_logs" {
    for_each = var.access_logs != null ? [var.access_logs] : []
    content {
      bucket  = access_logs.value.bucket
      prefix  = lookup(access_logs.value, "prefix", null)
      enabled = lookup(access_logs.value, "enabled", true)
    }
  }

  tags = merge(
    var.tags,
    {
      Name = var.name
    }
  )
}

# Target Groups
resource "aws_lb_target_group" "main" {
  for_each = var.target_groups

  name        = each.key
  port        = each.value.port
  protocol    = each.value.protocol
  vpc_id      = var.vpc_id
  target_type = lookup(each.value, "target_type", "ip")

  dynamic "health_check" {
    for_each = lookup(each.value, "health_check", {})
    content {
      enabled             = lookup(health_check.value, "enabled", true)
      healthy_threshold   = lookup(health_check.value, "healthy_threshold", 2)
      interval            = lookup(health_check.value, "interval", 30)
      matcher             = lookup(health_check.value, "matcher", "200")
      path                = lookup(health_check.value, "path", "/")
      port                = lookup(health_check.value, "port", "traffic-port")
      protocol            = lookup(health_check.value, "protocol", "HTTP")
      timeout             = lookup(health_check.value, "timeout", 5)
      unhealthy_threshold = lookup(health_check.value, "unhealthy_threshold", 2)
    }
  }

  dynamic "stickiness" {
    for_each = lookup(each.value, "stickiness", {})
    content {
      cookie_duration = lookup(stickiness.value, "cookie_duration", 86400)
      enabled         = lookup(stickiness.value, "enabled", true)
      type            = lookup(stickiness.value, "type", "lb_cookie")
    }
  }

  tags = merge(
    var.tags,
    {
      Name = each.key
    }
  )
}

# Listeners
resource "aws_lb_listener" "main" {
  for_each = var.listeners

  load_balancer_arn = aws_lb.main.arn
  port              = each.value.port
  protocol          = each.value.protocol
  ssl_policy        = lookup(each.value, "ssl_policy", null)
  certificate_arn   = lookup(each.value, "certificate_arn", null)

  dynamic "default_action" {
    for_each = each.value.default_action
    content {
      type             = default_action.value.type
      target_group_arn = lookup(default_action.value, "target_group_arn", null)
      redirect {
        for_each = lookup(default_action.value, "redirect", {})
        content {
          host        = lookup(redirect.value, "host", "#{host}")
          path        = lookup(redirect.value, "path", "/#{path}")
          port        = lookup(redirect.value, "port", "#{port}")
          protocol    = lookup(redirect.value, "protocol", "#{protocol}")
          query       = lookup(redirect.value, "query", "#{query}")
          status_code = redirect.value.status_code
        }
      }
      fixed_response {
        for_each = lookup(default_action.value, "fixed_response", {})
        content {
          content_type = fixed_response.value.content_type
          message_body = lookup(fixed_response.value, "message_body", null)
          status_code  = lookup(fixed_response.value, "status_code", "200")
        }
      }
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-listener-${each.value.port}"
    }
  )
}

# Listener Rules
resource "aws_lb_listener_rule" "main" {
  for_each = var.listener_rules

  listener_arn = aws_lb_listener.main[each.value.listener_key].arn
  priority     = each.value.priority

  dynamic "action" {
    for_each = each.value.action
    content {
      type             = action.value.type
      target_group_arn = lookup(action.value, "target_group_arn", null)
      redirect {
        for_each = lookup(action.value, "redirect", {})
        content {
          host        = lookup(redirect.value, "host", "#{host}")
          path        = lookup(redirect.value, "path", "/#{path}")
          port        = lookup(redirect.value, "port", "#{port}")
          protocol    = lookup(redirect.value, "protocol", "#{protocol}")
          query       = lookup(redirect.value, "query", "#{query}")
          status_code = redirect.value.status_code
        }
      }
      fixed_response {
        for_each = lookup(action.value, "fixed_response", {})
        content {
          content_type = fixed_response.value.content_type
          message_body = lookup(fixed_response.value, "message_body", null)
          status_code  = lookup(fixed_response.value, "status_code", "200")
        }
      }
    }
  }

  dynamic "condition" {
    for_each = each.value.condition
    content {
      dynamic "host_header" {
        for_each = lookup(condition.value, "host_header", {})
        content {
          values = host_header.value.values
        }
      }
      dynamic "path_pattern" {
        for_each = lookup(condition.value, "path_pattern", {})
        content {
          values = path_pattern.value.values
        }
      }
      dynamic "http_header" {
        for_each = lookup(condition.value, "http_header", {})
        content {
          http_header_name = http_header.value.http_header_name
          values           = http_header.value.values
        }
      }
      dynamic "http_request_method" {
        for_each = lookup(condition.value, "http_request_method", {})
        content {
          values = http_request_method.value.values
        }
      }
      dynamic "query_string" {
        for_each = lookup(condition.value, "query_string", {})
        content {
          key   = lookup(query_string.value, "key", null)
          value = query_string.value.value
        }
      }
      dynamic "source_ip" {
        for_each = lookup(condition.value, "source_ip", {})
        content {
          values = source_ip.value.values
        }
      }
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-rule-${each.key}"
    }
  )
}

# Target Group Attachments
resource "aws_lb_target_group_attachment" "main" {
  for_each = var.target_group_attachments

  target_group_arn = aws_lb_target_group.main[each.value.target_group_key].arn
  target_id        = each.value.target_id
  port             = lookup(each.value, "port", null)
}

# CloudWatch Alarms for ALB
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.name}-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "ALB 5XX errors are high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "alb_4xx" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.name}-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_4XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "50"
  alarm_description   = "ALB 4XX errors are high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "alb_target_response_time" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.name}-target-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "ALB target response time is high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "alb_request_count" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.name}-request-count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RequestCount"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1000"
  alarm_description   = "ALB request count is high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = var.tags
}

# WAF Web ACL (if enabled)
resource "aws_wafv2_web_acl" "main" {
  count = var.enable_waf ? 1 : 0

  name        = "${var.name}-web-acl"
  description = "WAF Web ACL for ${var.name}"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  dynamic "rule" {
    for_each = var.waf_rules
    content {
      name     = rule.value.name
      priority = rule.value.priority

      override_action {
        dynamic "none" {
          for_each = rule.value.override_action == "none" ? [1] : []
          content {}
        }
        dynamic "count" {
          for_each = rule.value.override_action == "count" ? [1] : []
          content {}
        }
      }

      statement {
        dynamic "managed_rule_group_statement" {
          for_each = lookup(rule.value, "managed_rule_group_statement", {})
          content {
            name        = managed_rule_group_statement.value.name
            vendor_name = managed_rule_group_statement.value.vendor_name
          }
        }
        dynamic "rate_based_statement" {
          for_each = lookup(rule.value, "rate_based_statement", {})
          content {
            limit              = rate_based_statement.value.limit
            aggregate_key_type = rate_based_statement.value.aggregate_key_type
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = rule.value.name
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.name}-web-acl"
    sampled_requests_enabled   = true
  }

  tags = var.tags
}

# WAF Web ACL Association
resource "aws_wafv2_web_acl_association" "main" {
  count = var.enable_waf ? 1 : 0

  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main[0].arn
}

# Data source for current AWS account
data "aws_caller_identity" "current" {} 