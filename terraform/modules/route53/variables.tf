# Route53 Module Variables

variable "domain_name" {
  description = "Primary domain name"
  type        = string
}

variable "subject_alternative_names" {
  description = "Additional domain names for SSL certificate"
  type        = list(string)
  default     = []
}

variable "create_alb_record" {
  description = "Create A record for load balancer"
  type        = bool
  default     = true
}

variable "create_api_record" {
  description = "Create A record for API subdomain"
  type        = bool
  default     = true
}

variable "create_dashboard_record" {
  description = "Create A record for dashboard subdomain"
  type        = bool
  default     = true
}

variable "create_monitoring_record" {
  description = "Create A record for monitoring subdomain"
  type        = bool
  default     = true
}

variable "alb_dns_name" {
  description = "DNS name of the load balancer"
  type        = string
  default     = ""
}

variable "alb_zone_id" {
  description = "Zone ID of the load balancer"
  type        = string
  default     = ""
}

variable "subdomains" {
  description = "Map of subdomain names to target values"
  type        = map(string)
  default     = {}
}

variable "create_mx_record" {
  description = "Create MX record for email"
  type        = bool
  default     = false
}

variable "mx_records" {
  description = "MX records for email"
  type        = list(string)
  default     = []
}

variable "create_spf_record" {
  description = "Create SPF record for email authentication"
  type        = bool
  default     = false
}

variable "dkim_records" {
  description = "Map of DKIM selector to DKIM value"
  type        = map(string)
  default     = {}
}

variable "health_checks" {
  description = "Map of health check configurations"
  type = map(object({
    type              = string
    fqdn              = optional(string)
    port              = optional(number)
    resource_path     = optional(string)
    failure_threshold = optional(number, 3)
    request_interval  = optional(number, 30)
  }))
  default = {}
}

variable "failover_records" {
  description = "Map of failover record configurations"
  type = map(object({
    name         = string
    type         = string
    ttl          = optional(string, "300")
    set_identifier = string
    failover_type = string
    alias = optional(object({
      name                   = string
      zone_id                = string
      evaluate_target_health = optional(bool, true)
    }))
    records = optional(list(string), [])
    health_check_id = optional(string)
  }))
  default = {}
}

variable "geolocation_records" {
  description = "Map of geolocation record configurations"
  type = map(object({
    name         = string
    type         = string
    ttl          = optional(string, "300")
    set_identifier = string
    geolocation = object({
      continent   = optional(string)
      country     = optional(string)
      subdivision = optional(string)
    })
    alias = optional(object({
      name                   = string
      zone_id                = string
      evaluate_target_health = optional(bool, true)
    }))
    records = optional(list(string), [])
  }))
  default = {}
}

variable "latency_records" {
  description = "Map of latency record configurations"
  type = map(object({
    name         = string
    type         = string
    ttl          = optional(string, "300")
    set_identifier = string
    region       = string
    alias = optional(object({
      name                   = string
      zone_id                = string
      evaluate_target_health = optional(bool, true)
    }))
    records = optional(list(string), [])
  }))
  default = {}
}

variable "weighted_records" {
  description = "Map of weighted record configurations"
  type = map(object({
    name         = string
    type         = string
    ttl          = optional(string, "300")
    set_identifier = string
    weight       = number
    alias = optional(object({
      name                   = string
      zone_id                = string
      evaluate_target_health = optional(bool, true)
    }))
    records = optional(list(string), [])
  }))
  default = {}
}

variable "alarm_actions" {
  description = "List of ARNs for alarm actions (SNS topics, etc.)"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
} 