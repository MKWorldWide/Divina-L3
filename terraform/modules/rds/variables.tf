# RDS Module Variables

variable "identifier" {
  description = "The name of the RDS instance"
  type        = string
}

variable "engine" {
  description = "The database engine to use"
  type        = string
  default     = "postgres"
}

variable "engine_version" {
  description = "The engine version to use"
  type        = string
  default     = "15.4"
}

variable "instance_class" {
  description = "The instance type of the RDS instance"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "allocated_storage" {
  description = "The allocated storage in gigabytes"
  type        = number
  default     = 100
}

variable "max_allocated_storage" {
  description = "The upper limit of scalable storage in gigabytes"
  type        = number
  default     = 1000
}

variable "storage_type" {
  description = "One of 'standard' (magnetic), 'gp2' (general purpose SSD), or 'io1' (provisioned IOPS SSD)"
  type        = string
  default     = "gp3"
}

variable "storage_encrypted" {
  description = "Specifies whether the DB instance is encrypted"
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "The ARN for the KMS encryption key"
  type        = string
  default     = null
}

variable "db_name" {
  description = "The name of the database to create when the DB instance is created"
  type        = string
  default     = "gamedin"
}

variable "username" {
  description = "Username for the master DB user"
  type        = string
  default     = "gamedin_admin"
}

variable "password" {
  description = "Password for the master DB user"
  type        = string
  sensitive   = true
}

variable "port" {
  description = "The port on which the DB accepts connections"
  type        = number
  default     = 5432
}

variable "vpc_security_group_ids" {
  description = "List of VPC security groups to associate"
  type        = list(string)
  default     = []
}

variable "subnet_ids" {
  description = "List of VPC subnet IDs for the DB subnet group"
  type        = list(string)
  default     = []
}

variable "create_db_subnet_group" {
  description = "Whether to create a database subnet group"
  type        = bool
  default     = true
}

variable "db_subnet_group_name" {
  description = "Name of DB subnet group"
  type        = string
  default     = null
}

variable "create_db_parameter_group" {
  description = "Whether to create a database parameter group"
  type        = bool
  default     = true
}

variable "parameter_group_name" {
  description = "Name of the DB parameter group to associate"
  type        = string
  default     = null
}

variable "family" {
  description = "The family of the DB parameter group"
  type        = string
  default     = "postgres15"
}

variable "parameters" {
  description = "List of DB parameters to apply"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "create_db_option_group" {
  description = "Whether to create a database option group"
  type        = bool
  default     = false
}

variable "option_group_name" {
  description = "Name of the DB option group to associate"
  type        = string
  default     = null
}

variable "major_engine_version" {
  description = "Specifies the major version of the engine that this option group should be associated with"
  type        = string
  default     = "15"
}

variable "availability_zone" {
  description = "The AZ for the RDS instance"
  type        = string
  default     = null
}

variable "availability_zones" {
  description = "List of AZs for the RDS cluster"
  type        = list(string)
  default     = []
}

variable "multi_az" {
  description = "Specifies if the RDS instance is multi-AZ"
  type        = bool
  default     = true
}

variable "iops" {
  description = "The amount of provisioned IOPS"
  type        = number
  default     = null
}

variable "storage_throughput" {
  description = "The storage throughput value for the DB instance"
  type        = number
  default     = null
}

variable "backup_retention_period" {
  description = "The days to retain backups for"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "The daily time range during which automated backups are created"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "The window to perform maintenance in"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "copy_tags_to_snapshot" {
  description = "Copy all Instance tags to snapshots"
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Determines whether a final DB snapshot is created before the DB instance is deleted"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "The database can't be deleted when this value is set to true"
  type        = bool
  default     = true
}

variable "delete_automated_backups" {
  description = "Specifies whether to remove automated backups immediately after the DB instance is deleted"
  type        = bool
  default     = false
}

variable "performance_insights_enabled" {
  description = "Specifies whether Performance Insights are enabled"
  type        = bool
  default     = true
}

variable "performance_insights_retention_period" {
  description = "The amount of time in days to retain Performance Insights data"
  type        = number
  default     = 7
}

variable "performance_insights_kms_key_id" {
  description = "The ARN for the KMS key to encrypt Performance Insights data"
  type        = string
  default     = null
}

variable "monitoring_interval" {
  description = "The interval, in seconds, between points when Enhanced Monitoring metrics are collected for the DB instance"
  type        = number
  default     = 60
}

variable "auto_minor_version_upgrade" {
  description = "Indicates that minor engine upgrades will be applied automatically to the DB instance during the maintenance window"
  type        = bool
  default     = true
}

variable "allow_major_version_upgrade" {
  description = "Indicates that major version upgrades are allowed"
  type        = bool
  default     = false
}

variable "apply_immediately" {
  description = "Specifies whether any database modifications are applied immediately, or during the next maintenance window"
  type        = bool
  default     = false
}

variable "enabled_cloudwatch_logs_exports" {
  description = "List of log types to enable for exporting to CloudWatch logs"
  type        = list(string)
  default     = ["postgresql"]
}

variable "character_set_name" {
  description = "The character set name to associate with the DB instance"
  type        = string
  default     = null
}

variable "timezone" {
  description = "Time zone of the DB instance"
  type        = string
  default     = null
}

variable "license_model" {
  description = "License model information for this DB instance"
  type        = string
  default     = null
}

variable "domain" {
  description = "The ID of the Directory Service Active Directory domain to create the instance in"
  type        = string
  default     = null
}

variable "domain_iam_role_name" {
  description = "The name of the IAM role to be used when making API calls to the Directory Service"
  type        = string
  default     = null
}

variable "ca_cert_identifier" {
  description = "The identifier of the CA certificate for the DB instance"
  type        = string
  default     = null
}

# Read Replica Variables
variable "create_read_replica" {
  description = "Whether to create a read replica"
  type        = bool
  default     = false
}

variable "read_replica_instance_class" {
  description = "The instance type of the read replica"
  type        = string
  default     = "db.r6g.large"
}

variable "read_replica_allocated_storage" {
  description = "The allocated storage in gigabytes for the read replica"
  type        = number
  default     = 100
}

variable "read_replica_storage_type" {
  description = "One of 'standard' (magnetic), 'gp2' (general purpose SSD), or 'io1' (provisioned IOPS SSD) for the read replica"
  type        = string
  default     = "gp3"
}

variable "read_replica_storage_encrypted" {
  description = "Specifies whether the read replica is encrypted"
  type        = bool
  default     = true
}

variable "read_replica_availability_zone" {
  description = "The AZ for the read replica"
  type        = string
  default     = null
}

variable "read_replica_multi_az" {
  description = "Specifies if the read replica is multi-AZ"
  type        = bool
  default     = false
}

variable "read_replica_backup_retention_period" {
  description = "The days to retain backups for the read replica"
  type        = number
  default     = 7
}

variable "read_replica_backup_window" {
  description = "The daily time range during which automated backups are created for the read replica"
  type        = string
  default     = "03:00-04:00"
}

variable "read_replica_maintenance_window" {
  description = "The window to perform maintenance in for the read replica"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "read_replica_monitoring_interval" {
  description = "The interval, in seconds, between points when Enhanced Monitoring metrics are collected for the read replica"
  type        = number
  default     = 60
}

variable "read_replica_performance_insights_enabled" {
  description = "Specifies whether Performance Insights are enabled for the read replica"
  type        = bool
  default     = true
}

variable "read_replica_auto_minor_version_upgrade" {
  description = "Indicates that minor engine upgrades will be applied automatically to the read replica during the maintenance window"
  type        = bool
  default     = true
}

variable "read_replica_apply_immediately" {
  description = "Specifies whether any database modifications are applied immediately, or during the next maintenance window for the read replica"
  type        = bool
  default     = false
}

variable "read_replica_deletion_protection" {
  description = "The read replica can't be deleted when this value is set to true"
  type        = bool
  default     = false
}

# Cluster Variables (for Aurora)
variable "create_cluster" {
  description = "Whether to create an RDS cluster (Aurora)"
  type        = bool
  default     = false
}

variable "engine_mode" {
  description = "The database engine mode"
  type        = string
  default     = "provisioned"
}

variable "cluster_instances" {
  description = "Number of cluster instances"
  type        = number
  default     = 2
}

# Proxy Variables
variable "create_proxy" {
  description = "Whether to create an RDS proxy"
  type        = bool
  default     = false
}

variable "proxy_debug_logging" {
  description = "Whether the proxy includes detailed information about SQL statements in its logs"
  type        = bool
  default     = false
}

variable "proxy_engine_family" {
  description = "The kinds of databases that the proxy can connect to"
  type        = string
  default     = "POSTGRESQL"
}

variable "proxy_idle_client_timeout" {
  description = "The number of seconds that a connection to the proxy can be inactive"
  type        = number
  default     = 1800
}

variable "proxy_require_tls" {
  description = "Whether Transport Layer Security (TLS) encryption is required for connections to the proxy"
  type        = bool
  default     = true
}

variable "proxy_vpc_security_group_ids" {
  description = "One or more VPC security group IDs to associate with the new proxy"
  type        = list(string)
  default     = []
}

variable "proxy_subnet_ids" {
  description = "One or more VPC subnet IDs to associate with the new proxy"
  type        = list(string)
  default     = []
}

variable "proxy_auth_scheme" {
  description = "The type of authentication that the proxy uses for connections from the proxy to the underlying database"
  type        = string
  default     = "SECRETS"
}

variable "proxy_iam_auth" {
  description = "Whether to require or disallow AWS Identity and Access Management (IAM) authentication for connections to the proxy"
  type        = string
  default     = "DISABLED"
}

variable "proxy_connection_borrow_timeout" {
  description = "The number of seconds for a proxy to wait for a connection to become available in the connection pool"
  type        = number
  default     = 120
}

variable "proxy_init_query" {
  description = "One or more SQL statements for the proxy to run when opening each new database connection"
  type        = string
  default     = null
}

variable "proxy_max_connections_percent" {
  description = "The maximum size of the connection pool for each target in a target group"
  type        = number
  default     = 100
}

variable "proxy_max_idle_connections_percent" {
  description = "Controls how actively the proxy closes idle database connections in the connection pool"
  type        = number
  default     = 50
}

variable "proxy_session_pinning_filters" {
  description = "Each item in the list represents a class of SQL operations that normally cause all later statements in a session using a proxy to be pinned to the same underlying database connection"
  type        = list(string)
  default     = []
}

variable "cloudwatch_log_group_retention_in_days" {
  description = "The number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
} 