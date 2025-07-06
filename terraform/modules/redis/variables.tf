# Redis Module Variables

variable "cluster_id" {
  description = "The name of the ElastiCache cluster"
  type        = string
}

variable "node_type" {
  description = "The compute and memory capacity of the nodes"
  type        = string
  default     = "cache.r6g.large"
}

variable "port" {
  description = "The port number on which each of the nodes accepts connections"
  type        = number
  default     = 6379
}

variable "num_cache_clusters" {
  description = "Number of cache clusters (primary and replicas) for this replication group"
  type        = number
  default     = 2
}

variable "automatic_failover_enabled" {
  description = "Specifies whether a read-only replica will be automatically promoted to read/write primary if the existing primary fails"
  type        = bool
  default     = true
}

variable "multi_az_enabled" {
  description = "Specifies whether to enable Multi-AZ Support for the replication group"
  type        = bool
  default     = true
}

variable "at_rest_encryption_enabled" {
  description = "Whether to enable encryption at rest"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Whether to enable encryption in transit"
  type        = bool
  default     = true
}

variable "auth_token" {
  description = "The password used to access a password protected server"
  type        = string
  default     = null
  sensitive   = true
}

variable "kms_key_id" {
  description = "The ARN of the key that you wish to use if encrypting at rest"
  type        = string
  default     = null
}

variable "snapshot_window" {
  description = "Daily time range during which ElastiCache will take a snapshot of the cache cluster"
  type        = string
  default     = "03:00-04:00"
}

variable "snapshot_retention_limit" {
  description = "Number of days for which ElastiCache will retain automatic cache cluster snapshots before deleting them"
  type        = number
  default     = 7
}

variable "maintenance_window" {
  description = "Specifies the weekly time range for when maintenance on the cache cluster is performed"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "auto_minor_version_upgrade" {
  description = "Specifies whether a minor engine upgrade will be applied automatically to the underlying Cache Cluster instances during the maintenance window"
  type        = bool
  default     = true
}

variable "create_subnet_group" {
  description = "Whether to create a subnet group"
  type        = bool
  default     = true
}

variable "subnet_group_name" {
  description = "Name of the subnet group"
  type        = string
  default     = null
}

variable "subnet_ids" {
  description = "List of VPC subnet IDs for the cache subnet group"
  type        = list(string)
  default     = []
}

variable "create_parameter_group" {
  description = "Whether to create a parameter group"
  type        = bool
  default     = true
}

variable "parameter_group_name" {
  description = "Name of the parameter group to associate with this replication group"
  type        = string
  default     = null
}

variable "family" {
  description = "The family of the ElastiCache parameter group"
  type        = string
  default     = "redis7"
}

variable "parameters" {
  description = "List of parameters to apply"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "security_group_ids" {
  description = "One or more VPC security groups associated with the cache cluster"
  type        = list(string)
  default     = []
}

variable "create_user_group" {
  description = "Whether to create a user group"
  type        = bool
  default     = false
}

variable "user_ids" {
  description = "List of user IDs to add to the user group"
  type        = list(string)
  default     = []
}

variable "create_user" {
  description = "Whether to create a Redis user"
  type        = bool
  default     = false
}

variable "user_id" {
  description = "The ID of the user"
  type        = string
  default     = null
}

variable "user_name" {
  description = "The username of the user"
  type        = string
  default     = null
}

variable "access_string" {
  description = "Access permissions string used for this user"
  type        = string
  default     = null
}

variable "user_passwords" {
  description = "Passwords used for this user"
  type        = list(string)
  default     = []
  sensitive   = true
}

variable "enable_cloudwatch_logs" {
  description = "Whether to enable CloudWatch logs"
  type        = bool
  default     = true
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
  description = "The list of actions to execute when this alarm transitions into an ALARM state"
  type        = list(string)
  default     = []
}

variable "enable_backup" {
  description = "Whether to enable backup cluster"
  type        = bool
  default     = false
}

variable "backup_node_type" {
  description = "The compute and memory capacity of the backup nodes"
  type        = string
  default     = "cache.r6g.medium"
}

variable "backup_snapshot_window" {
  description = "Daily time range during which ElastiCache will take a snapshot of the backup cache cluster"
  type        = string
  default     = "04:00-05:00"
}

variable "backup_snapshot_retention_limit" {
  description = "Number of days for which ElastiCache will retain automatic backup cache cluster snapshots before deleting them"
  type        = number
  default     = 30
}

variable "backup_maintenance_window" {
  description = "Specifies the weekly time range for when maintenance on the backup cache cluster is performed"
  type        = string
  default     = "sun:05:00-sun:06:00"
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
} 