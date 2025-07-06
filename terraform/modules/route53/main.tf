# Route53 Module for GameDin L3 + AthenaMist AI

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = merge(
    var.tags,
    {
      Name = var.domain_name
    }
  )
}

# SSL Certificate
resource "aws_acm_certificate" "main" {
  domain_name               = var.domain_name
  subject_alternative_names = var.subject_alternative_names
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.domain_name}-certificate"
    }
  )
}

# Certificate Validation Records
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

# Certificate Validation
resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# A Record for Load Balancer
resource "aws_route53_record" "alb" {
  count = var.create_alb_record ? 1 : 0

  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# A Record for API
resource "aws_route53_record" "api" {
  count = var.create_api_record ? 1 : 0

  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# A Record for Dashboard
resource "aws_route53_record" "dashboard" {
  count = var.create_dashboard_record ? 1 : 0

  zone_id = aws_route53_zone.main.zone_id
  name    = "dashboard.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# A Record for Monitoring
resource "aws_route53_record" "monitoring" {
  count = var.create_monitoring_record ? 1 : 0

  zone_id = aws_route53_zone.main.zone_id
  name    = "monitoring.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# CNAME Records for Subdomains
resource "aws_route53_record" "subdomains" {
  for_each = var.subdomains

  zone_id = aws_route53_zone.main.zone_id
  name    = "${each.key}.${var.domain_name}"
  type    = "CNAME"
  ttl     = "300"
  records = [each.value]
}

# MX Record for Email
resource "aws_route53_record" "mx" {
  count = var.create_mx_record ? 1 : 0

  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "MX"
  ttl     = "300"
  records = var.mx_records
}

# TXT Record for SPF
resource "aws_route53_record" "spf" {
  count = var.create_spf_record ? 1 : 0

  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "TXT"
  ttl     = "300"
  records = ["v=spf1 include:_spf.google.com ~all"]
}

# TXT Record for DKIM
resource "aws_route53_record" "dkim" {
  for_each = var.dkim_records

  zone_id = aws_route53_zone.main.zone_id
  name    = "${each.key}._domainkey.${var.domain_name}"
  type    = "TXT"
  ttl     = "300"
  records = [each.value]
}

# Health Checks
resource "aws_route53_health_check" "main" {
  for_each = var.health_checks

  fqdn              = lookup(each.value, "fqdn", null)
  port              = lookup(each.value, "port", null)
  type              = each.value.type
  resource_path     = lookup(each.value, "resource_path", null)
  failure_threshold = lookup(each.value, "failure_threshold", 3)
  request_interval  = lookup(each.value, "request_interval", 30)

  tags = merge(
    var.tags,
    {
      Name = "${var.domain_name}-health-check-${each.key}"
    }
  )
}

# Failover Records
resource "aws_route53_record" "failover" {
  for_each = var.failover_records

  zone_id = aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = lookup(each.value, "ttl", "300")

  dynamic "alias" {
    for_each = lookup(each.value, "alias", {})
    content {
      name                   = alias.value.name
      zone_id                = alias.value.zone_id
      evaluate_target_health = lookup(alias.value, "evaluate_target_health", true)
    }
  }

  dynamic "records" {
    for_each = lookup(each.value, "records", [])
    content {
      records = records.value
    }
  }

  set_identifier = each.value.set_identifier
  health_check_id = lookup(each.value, "health_check_id", null)
  failover_routing_policy {
    type = each.value.failover_type
  }
}

# Geolocation Records
resource "aws_route53_record" "geolocation" {
  for_each = var.geolocation_records

  zone_id = aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = lookup(each.value, "ttl", "300")

  dynamic "alias" {
    for_each = lookup(each.value, "alias", {})
    content {
      name                   = alias.value.name
      zone_id                = alias.value.zone_id
      evaluate_target_health = lookup(alias.value, "evaluate_target_health", true)
    }
  }

  dynamic "records" {
    for_each = lookup(each.value, "records", [])
    content {
      records = records.value
    }
  }

  set_identifier = each.value.set_identifier
  geolocation_routing_policy {
    continent = lookup(each.value.geolocation, "continent", null)
    country   = lookup(each.value.geolocation, "country", null)
    subdivision = lookup(each.value.geolocation, "subdivision", null)
  }
}

# Latency Records
resource "aws_route53_record" "latency" {
  for_each = var.latency_records

  zone_id = aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = lookup(each.value, "ttl", "300")

  dynamic "alias" {
    for_each = lookup(each.value, "alias", {})
    content {
      name                   = alias.value.name
      zone_id                = alias.value.zone_id
      evaluate_target_health = lookup(alias.value, "evaluate_target_health", true)
    }
  }

  dynamic "records" {
    for_each = lookup(each.value, "records", [])
    content {
      records = records.value
    }
  }

  set_identifier = each.value.set_identifier
  latency_routing_policy {
    region = each.value.region
  }
}

# Weighted Records
resource "aws_route53_record" "weighted" {
  for_each = var.weighted_records

  zone_id = aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = lookup(each.value, "ttl", "300")

  dynamic "alias" {
    for_each = lookup(each.value, "alias", {})
    content {
      name                   = alias.value.name
      zone_id                = alias.value.zone_id
      evaluate_target_health = lookup(alias.value, "evaluate_target_health", true)
    }
  }

  dynamic "records" {
    for_each = lookup(each.value, "records", [])
    content {
      records = records.value
    }
  }

  set_identifier = each.value.set_identifier
  weighted_routing_policy {
    weight = each.value.weight
  }
}

# CloudWatch Alarms for Route53
resource "aws_cloudwatch_metric_alarm" "route53_health_check" {
  for_each = var.health_checks

  alarm_name          = "${var.domain_name}-health-check-${each.key}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "Route53 health check is failing"
  alarm_actions       = var.alarm_actions

  dimensions = {
    HealthCheckId = aws_route53_health_check.main[each.key].id
  }

  tags = var.tags
}

# Data source for current AWS account
data "aws_caller_identity" "current" {} 