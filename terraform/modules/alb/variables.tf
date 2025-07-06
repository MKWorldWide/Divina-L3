# Application Load Balancer Module Variables

variable "name" {
  description = "Name of the Application Load Balancer"
  type        = string
}

variable "internal" {
  description = "Whether the load balancer is internal or internet-facing"
  type        = bool
  default     = false
}

variable "security_groups" {
  description = "List of security group IDs for the load balancer"
  type        = list(string)
}

variable "subnets" {
  description = "List of subnet IDs for the load balancer"
  type        = list(string)
}

variable "vpc_id" {
  description = "VPC ID for target groups"
  type        = string
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for the load balancer"
  type        = bool
  default     = true
}

variable "access_logs" {
  description = "Access logs configuration for the load balancer"
  type = object({
    bucket  = string
    prefix  = optional(string)
    enabled = optional(bool, true)
  })
  default = null
}

variable "target_groups" {
  description = "Map of target group configurations"
  type = map(object({
    port        = number
    protocol    = string
    target_type = optional(string, "ip")
    health_check = optional(object({
      enabled             = optional(bool, true)
      healthy_threshold   = optional(number, 2)
      interval            = optional(number, 30)
      matcher             = optional(string, "200")
      path                = optional(string, "/")
      port                = optional(string, "traffic-port")
      protocol            = optional(string, "HTTP")
      timeout             = optional(number, 5)
      unhealthy_threshold = optional(number, 2)
    }), {})
    stickiness = optional(object({
      cookie_duration = optional(number, 86400)
      enabled         = optional(bool, true)
      type            = optional(string, "lb_cookie")
    }), {})
  }))
  default = {}
}

variable "listeners" {
  description = "Map of listener configurations"
  type = map(object({
    port            = number
    protocol        = string
    ssl_policy      = optional(string)
    certificate_arn = optional(string)
    default_action = list(object({
      type             = string
      target_group_arn = optional(string)
      redirect = optional(object({
        host        = optional(string, "#{host}")
        path        = optional(string, "/#{path}")
        port        = optional(string, "#{port}")
        protocol    = optional(string, "#{protocol}")
        query       = optional(string, "#{query}")
        status_code = string
      }))
      fixed_response = optional(object({
        content_type = string
        message_body = optional(string)
        status_code  = optional(string, "200")
      }))
    }))
  }))
  default = {}
}

variable "listener_rules" {
  description = "Map of listener rule configurations"
  type = map(object({
    listener_key = string
    priority     = number
    action = list(object({
      type             = string
      target_group_arn = optional(string)
      redirect = optional(object({
        host        = optional(string, "#{host}")
        path        = optional(string, "/#{path}")
        port        = optional(string, "#{port}")
        protocol    = optional(string, "#{protocol}")
        query       = optional(string, "#{query}")
        status_code = string
      }))
      fixed_response = optional(object({
        content_type = string
        message_body = optional(string)
        status_code  = optional(string, "200")
      }))
    }))
    condition = list(object({
      host_header = optional(object({
        values = list(string)
      }))
      path_pattern = optional(object({
        values = list(string)
      }))
      http_header = optional(object({
        http_header_name = string
        values           = list(string)
      }))
      http_request_method = optional(object({
        values = list(string)
      }))
      query_string = optional(object({
        key   = optional(string)
        value = string
      }))
      source_ip = optional(object({
        values = list(string)
      }))
    }))
  }))
  default = {}
}

variable "target_group_attachments" {
  description = "Map of target group attachment configurations"
  type = map(object({
    target_group_key = string
    target_id        = string
    port             = optional(number)
  }))
  default = {}
}

variable "enable_cloudwatch_alarms" {
  description = "Enable CloudWatch alarms for the load balancer"
  type        = bool
  default     = true
}

variable "alarm_actions" {
  description = "List of ARNs for alarm actions (SNS topics, etc.)"
  type        = list(string)
  default     = []
}

variable "enable_waf" {
  description = "Enable WAF Web ACL for the load balancer"
  type        = bool
  default     = true
}

variable "waf_rules" {
  description = "List of WAF rules for the Web ACL"
  type = list(object({
    name     = string
    priority = number
    override_action = string
    managed_rule_group_statement = optional(object({
      name        = string
      vendor_name = string
    }))
    rate_based_statement = optional(object({
      limit              = number
      aggregate_key_type = string
    }))
  }))
  default = [
    {
      name     = "AWSManagedRulesCommonRuleSet"
      priority = 1
      override_action = "none"
      managed_rule_group_statement = {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    },
    {
      name     = "AWSManagedRulesKnownBadInputsRuleSet"
      priority = 2
      override_action = "none"
      managed_rule_group_statement = {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    },
    {
      name     = "RateLimitRule"
      priority = 3
      override_action = "none"
      rate_based_statement = {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
  ]
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
} 