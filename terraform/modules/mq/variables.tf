# MQ Module Variables

variable "broker_name" {
  description = "The name of the Amazon MQ broker"
  type        = string
}

variable "engine_type" {
  description = "The type of broker engine"
  type        = string
  default     = "RabbitMQ"
  
  validation {
    condition     = contains(["ActiveMQ", "RabbitMQ"], var.engine_type)
    error_message = "Engine type must be either ActiveMQ or RabbitMQ."
  }
}

variable "engine_version" {
  description = "The version of the broker engine"
  type        = string
  default     = "3.11.20"
}

variable "host_instance_type" {
  description = "The broker's instance type"
  type        = string
  default     = "mq.t3.micro"
}

variable "deployment_mode" {
  description = "The deployment mode of the broker"
  type        = string
  default     = "CLUSTER_MULTI_AZ"
  
  validation {
    condition     = contains(["SINGLE_INSTANCE", "ACTIVE_STANDBY_MULTI_AZ", "CLUSTER_MULTI_AZ"], var.deployment_mode)
    error_message = "Deployment mode must be one of: SINGLE_INSTANCE, ACTIVE_STANDBY_MULTI_AZ, CLUSTER_MULTI_AZ."
  }
}

variable "subnet_ids" {
  description = "The list of subnet IDs in which to launch the broker"
  type        = list(string)
  default     = []
}

variable "security_groups" {
  description = "The list of security group IDs assigned to the broker"
  type        = list(string)
  default     = []
}

variable "username" {
  description = "The username of the broker user"
  type        = string
  default     = "admin"
}

variable "password" {
  description = "The password of the broker user"
  type        = string
  sensitive   = true
}

variable "encryption_enabled" {
  description = "Whether to enable encryption"
  type        = bool
  default     = true
}

variable "enable_general_logs" {
  description = "Whether to enable general logs"
  type        = bool
  default     = true
}

variable "enable_audit_logs" {
  description = "Whether to enable audit logs"
  type        = bool
  default     = false
}

variable "maintenance_window_day_of_week" {
  description = "The day of the week to start the maintenance window"
  type        = string
  default     = "SUNDAY"
  
  validation {
    condition     = contains(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"], var.maintenance_window_day_of_week)
    error_message = "Day of week must be one of: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY."
  }
}

variable "maintenance_window_time_of_day" {
  description = "The time of day to start the maintenance window"
  type        = string
  default     = "03:00"
}

variable "maintenance_window_time_zone" {
  description = "The time zone for the maintenance window"
  type        = string
  default     = "UTC"
}

variable "cloudwatch_log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

variable "enable_cloudwatch_alarms" {
  description = "Whether to enable CloudWatch alarms"
  type        = bool
  default     = true
}

variable "alarm_actions" {
  description = "The list of actions to execute when alarms transition into ALARM state"
  type        = list(string)
  default     = []
}

# RabbitMQ Configuration Variables
variable "max_connections" {
  description = "Maximum number of connections"
  type        = number
  default     = 1000
}

variable "max_channels" {
  description = "Maximum number of channels per connection"
  type        = number
  default     = 2000
}

variable "max_queues" {
  description = "Maximum number of queues"
  type        = number
  default     = 10000
}

variable "max_exchanges" {
  description = "Maximum number of exchanges"
  type        = number
  default     = 1000
}

variable "max_bindings" {
  description = "Maximum number of bindings"
  type        = number
  default     = 10000
}

variable "max_users" {
  description = "Maximum number of users"
  type        = number
  default     = 100
}

variable "max_vhosts" {
  description = "Maximum number of virtual hosts"
  type        = number
  default     = 100
}

variable "heartbeat" {
  description = "Heartbeat interval in seconds"
  type        = number
  default     = 60
}

variable "frame_max" {
  description = "Maximum frame size in bytes"
  type        = number
  default     = 131072
}

variable "channel_max" {
  description = "Maximum number of channels per connection"
  type        = number
  default     = 2000
}

variable "vm_memory_high_watermark" {
  description = "Memory high watermark percentage"
  type        = number
  default     = 0.6
}

variable "vm_memory_high_watermark_paging_ratio" {
  description = "Memory high watermark paging ratio"
  type        = number
  default     = 0.5
}

variable "disk_free_limit" {
  description = "Disk free limit in bytes"
  type        = string
  default     = "2GB"
}

variable "log_level" {
  description = "Log level"
  type        = string
  default     = "info"
  
  validation {
    condition     = contains(["debug", "info", "warning", "error"], var.log_level)
    error_message = "Log level must be one of: debug, info, warning, error."
  }
}

variable "cluster_formation_backoff" {
  description = "Cluster formation backoff in milliseconds"
  type        = number
  default     = 1000
}

variable "cluster_formation_disk_free_limit" {
  description = "Cluster formation disk free limit"
  type        = string
  default     = "2GB"
}

variable "cluster_formation_partition_handling_strategy" {
  description = "Cluster formation partition handling strategy"
  type        = string
  default     = "autoheal"
  
  validation {
    condition     = contains(["ignore", "autoheal", "pause_minority"], var.cluster_formation_partition_handling_strategy)
    error_message = "Partition handling strategy must be one of: ignore, autoheal, pause_minority."
  }
}

variable "cluster_formation_peer_discovery_backoff" {
  description = "Cluster formation peer discovery backoff in milliseconds"
  type        = number
  default     = 1000
}

variable "cluster_formation_peer_discovery_kickback" {
  description = "Cluster formation peer discovery kickback"
  type        = bool
  default     = true
}

variable "cluster_partition_handling" {
  description = "Cluster partition handling"
  type        = string
  default     = "autoheal"
  
  validation {
    condition     = contains(["ignore", "autoheal", "pause_minority"], var.cluster_partition_handling)
    error_message = "Cluster partition handling must be one of: ignore, autoheal, pause_minority."
  }
}

variable "net_ticktime" {
  description = "Network tick time in seconds"
  type        = number
  default     = 60
}

variable "tcp_listen_options" {
  description = "TCP listen options"
  type        = string
  default     = "backlog=128"
}

variable "ssl_options" {
  description = "SSL options"
  type        = string
  default     = ""
}

variable "management_ssl_options" {
  description = "Management SSL options"
  type        = string
  default     = ""
}

variable "auth_backends" {
  description = "Authentication backends"
  type        = string
  default     = "internal"
}

variable "auth_mechanisms" {
  description = "Authentication mechanisms"
  type        = string
  default     = "PLAIN,AMQPLAIN"
}

variable "default_vhost" {
  description = "Default virtual host"
  type        = string
  default     = "/"
}

variable "default_user" {
  description = "Default user"
  type        = string
  default     = "guest"
}

variable "default_permissions" {
  description = "Default permissions"
  type        = string
  default     = ".* .* .*"
}

variable "default_topic_permissions" {
  description = "Default topic permissions"
  type        = string
  default     = ".* .* .*"
}

variable "default_queue_type" {
  description = "Default queue type"
  type        = string
  default     = "classic"
  
  validation {
    condition     = contains(["classic", "quorum"], var.default_queue_type)
    error_message = "Default queue type must be either classic or quorum."
  }
}

variable "default_consumer_prefetch" {
  description = "Default consumer prefetch count"
  type        = number
  default     = 250
}

variable "default_publisher_confirm_timeout" {
  description = "Default publisher confirm timeout in milliseconds"
  type        = number
  default     = 30000
}

variable "default_consumer_timeout" {
  description = "Default consumer timeout in milliseconds"
  type        = number
  default     = 30000
}

variable "default_heartbeat" {
  description = "Default heartbeat interval in seconds"
  type        = number
  default     = 60
}

variable "default_connection_timeout" {
  description = "Default connection timeout in milliseconds"
  type        = number
  default     = 60000
}

variable "default_channel_max" {
  description = "Default maximum number of channels per connection"
  type        = number
  default     = 2000
}

variable "default_frame_max" {
  description = "Default maximum frame size in bytes"
  type        = number
  default     = 131072
}

variable "default_vhost_max_connections" {
  description = "Default maximum number of connections per virtual host"
  type        = number
  default     = 1000
}

variable "default_vhost_max_queues" {
  description = "Default maximum number of queues per virtual host"
  type        = number
  default     = 10000
}

variable "default_vhost_max_exchanges" {
  description = "Default maximum number of exchanges per virtual host"
  type        = number
  default     = 1000
}

variable "default_vhost_max_bindings" {
  description = "Default maximum number of bindings per virtual host"
  type        = number
  default     = 10000
}

variable "default_vhost_max_users" {
  description = "Default maximum number of users per virtual host"
  type        = number
  default     = 100
}

variable "default_vhost_max_topic_permissions" {
  description = "Default maximum number of topic permissions per virtual host"
  type        = number
  default     = 100
}

variable "default_vhost_max_connections_per_user" {
  description = "Default maximum number of connections per user per virtual host"
  type        = number
  default     = 100
}

variable "default_vhost_max_queues_per_user" {
  description = "Default maximum number of queues per user per virtual host"
  type        = number
  default     = 1000
}

variable "default_vhost_max_exchanges_per_user" {
  description = "Default maximum number of exchanges per user per virtual host"
  type        = number
  default     = 100
}

variable "default_vhost_max_bindings_per_user" {
  description = "Default maximum number of bindings per user per virtual host"
  type        = number
  default     = 1000
}

variable "default_vhost_max_users_per_user" {
  description = "Default maximum number of users per user per virtual host"
  type        = number
  default     = 10
}

variable "default_vhost_max_topic_permissions_per_user" {
  description = "Default maximum number of topic permissions per user per virtual host"
  type        = number
  default     = 10
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
} 