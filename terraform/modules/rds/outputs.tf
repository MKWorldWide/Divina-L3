# RDS Module Outputs

output "db_instance_id" {
  description = "The RDS instance ID"
  value       = aws_db_instance.main.id
}

output "db_instance_address" {
  description = "The address of the RDS instance"
  value       = aws_db_instance.main.address
}

output "db_instance_endpoint" {
  description = "The connection endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_instance_name" {
  description = "The database name"
  value       = aws_db_instance.main.db_name
}

output "db_instance_username" {
  description = "The master username for the database"
  value       = aws_db_instance.main.username
}

output "db_instance_port" {
  description = "The database port"
  value       = aws_db_instance.main.port
}

output "db_instance_status" {
  description = "The RDS instance status"
  value       = aws_db_instance.main.status
}

output "db_instance_arn" {
  description = "The ARN of the RDS instance"
  value       = aws_db_instance.main.arn
}

output "db_instance_resource_id" {
  description = "The RDS Resource ID of this instance"
  value       = aws_db_instance.main.resource_id
}

output "db_instance_availability_zone" {
  description = "The availability zone of the RDS instance"
  value       = aws_db_instance.main.availability_zone
}

output "db_instance_multi_az" {
  description = "If the RDS instance is multi AZ enabled"
  value       = aws_db_instance.main.multi_az
}

output "db_instance_backup_retention_period" {
  description = "The backup retention period"
  value       = aws_db_instance.main.backup_retention_period
}

output "db_instance_backup_window" {
  description = "The backup window"
  value       = aws_db_instance.main.backup_window
}

output "db_instance_maintenance_window" {
  description = "The maintenance window"
  value       = aws_db_instance.main.maintenance_window
}

output "db_instance_engine" {
  description = "The database engine"
  value       = aws_db_instance.main.engine
}

output "db_instance_engine_version" {
  description = "The database engine version"
  value       = aws_db_instance.main.engine_version
}

output "db_instance_instance_class" {
  description = "The RDS instance class"
  value       = aws_db_instance.main.instance_class
}

output "db_instance_allocated_storage" {
  description = "The allocated storage in gigabytes"
  value       = aws_db_instance.main.allocated_storage
}

output "db_instance_storage_encrypted" {
  description = "Specifies whether the DB instance is encrypted"
  value       = aws_db_instance.main.storage_encrypted
}

output "db_instance_kms_key_id" {
  description = "The ARN for the KMS encryption key"
  value       = aws_db_instance.main.kms_key_id
}

output "db_instance_performance_insights_enabled" {
  description = "Specifies whether Performance Insights are enabled"
  value       = aws_db_instance.main.performance_insights_enabled
}

output "db_instance_performance_insights_retention_period" {
  description = "The amount of time in days to retain Performance Insights data"
  value       = aws_db_instance.main.performance_insights_retention_period
}

output "db_instance_performance_insights_kms_key_id" {
  description = "The ARN for the KMS key to encrypt Performance Insights data"
  value       = aws_db_instance.main.performance_insights_kms_key_id
}

output "db_instance_monitoring_interval" {
  description = "The interval, in seconds, between points when Enhanced Monitoring metrics are collected"
  value       = aws_db_instance.main.monitoring_interval
}

output "db_instance_monitoring_role_arn" {
  description = "The ARN for the IAM role that permits RDS to send enhanced monitoring metrics to CloudWatch Logs"
  value       = aws_db_instance.main.monitoring_role_arn
}

output "db_instance_auto_minor_version_upgrade" {
  description = "Indicates that minor engine upgrades will be applied automatically to the DB instance during the maintenance window"
  value       = aws_db_instance.main.auto_minor_version_upgrade
}

output "db_instance_allow_major_version_upgrade" {
  description = "Indicates that major version upgrades are allowed"
  value       = aws_db_instance.main.allow_major_version_upgrade
}

output "db_instance_apply_immediately" {
  description = "Specifies whether any database modifications are applied immediately, or during the next maintenance window"
  value       = aws_db_instance.main.apply_immediately
}

output "db_instance_enabled_cloudwatch_logs_exports" {
  description = "List of log types to enable for exporting to CloudWatch logs"
  value       = aws_db_instance.main.enabled_cloudwatch_logs_exports
}

output "db_instance_character_set_name" {
  description = "The character set name to associate with the DB instance"
  value       = aws_db_instance.main.character_set_name
}

output "db_instance_timezone" {
  description = "Time zone of the DB instance"
  value       = aws_db_instance.main.timezone
}

output "db_instance_license_model" {
  description = "License model information for this DB instance"
  value       = aws_db_instance.main.license_model
}

output "db_instance_domain" {
  description = "The ID of the Directory Service Active Directory domain to create the instance in"
  value       = aws_db_instance.main.domain
}

output "db_instance_domain_iam_role_name" {
  description = "The name of the IAM role to be used when making API calls to the Directory Service"
  value       = aws_db_instance.main.domain_iam_role_name
}

output "db_instance_ca_cert_identifier" {
  description = "The identifier of the CA certificate for the DB instance"
  value       = aws_db_instance.main.ca_cert_identifier
}

# Read Replica Outputs
output "read_replica_id" {
  description = "The RDS read replica instance ID"
  value       = var.create_read_replica ? aws_db_instance.read_replica[0].id : null
}

output "read_replica_endpoint" {
  description = "The connection endpoint for the read replica"
  value       = var.create_read_replica ? aws_db_instance.read_replica[0].endpoint : null
}

output "read_replica_address" {
  description = "The address of the read replica"
  value       = var.create_read_replica ? aws_db_instance.read_replica[0].address : null
}

output "read_replica_status" {
  description = "The RDS read replica instance status"
  value       = var.create_read_replica ? aws_db_instance.read_replica[0].status : null
}

# Cluster Outputs (for Aurora)
output "cluster_id" {
  description = "The RDS cluster ID"
  value       = var.create_cluster ? aws_rds_cluster.main[0].id : null
}

output "cluster_arn" {
  description = "The ARN of the RDS cluster"
  value       = var.create_cluster ? aws_rds_cluster.main[0].arn : null
}

output "cluster_endpoint" {
  description = "The cluster endpoint"
  value       = var.create_cluster ? aws_rds_cluster.main[0].endpoint : null
}

output "cluster_reader_endpoint" {
  description = "The cluster reader endpoint"
  value       = var.create_cluster ? aws_rds_cluster.main[0].reader_endpoint : null
}

output "cluster_master_endpoint" {
  description = "The cluster master endpoint"
  value       = var.create_cluster ? aws_rds_cluster.main[0].endpoint : null
}

output "cluster_port" {
  description = "The database port"
  value       = var.create_cluster ? aws_rds_cluster.main[0].port : null
}

output "cluster_database_name" {
  description = "The name of the database"
  value       = var.create_cluster ? aws_rds_cluster.main[0].database_name : null
}

output "cluster_master_username" {
  description = "The master username for the database"
  value       = var.create_cluster ? aws_rds_cluster.main[0].master_username : null
}

output "cluster_status" {
  description = "The RDS cluster status"
  value       = var.create_cluster ? aws_rds_cluster.main[0].status : null
}

output "cluster_availability_zones" {
  description = "The availability zones of the RDS cluster"
  value       = var.create_cluster ? aws_rds_cluster.main[0].availability_zones : null
}

output "cluster_backup_retention_period" {
  description = "The backup retention period"
  value       = var.create_cluster ? aws_rds_cluster.main[0].backup_retention_period : null
}

output "cluster_backup_window" {
  description = "The backup window"
  value       = var.create_cluster ? aws_rds_cluster.main[0].backup_window : null
}

output "cluster_maintenance_window" {
  description = "The maintenance window"
  value       = var.create_cluster ? aws_rds_cluster.main[0].maintenance_window : null
}

output "cluster_engine" {
  description = "The database engine"
  value       = var.create_cluster ? aws_rds_cluster.main[0].engine : null
}

output "cluster_engine_version" {
  description = "The database engine version"
  value       = var.create_cluster ? aws_rds_cluster.main[0].engine_version : null
}

output "cluster_engine_mode" {
  description = "The database engine mode"
  value       = var.create_cluster ? aws_rds_cluster.main[0].engine_mode : null
}

output "cluster_storage_encrypted" {
  description = "Specifies whether the DB cluster is encrypted"
  value       = var.create_cluster ? aws_rds_cluster.main[0].storage_encrypted : null
}

output "cluster_kms_key_id" {
  description = "The ARN for the KMS encryption key"
  value       = var.create_cluster ? aws_rds_cluster.main[0].kms_key_id : null
}

output "cluster_enabled_cloudwatch_logs_exports" {
  description = "List of log types to enable for exporting to CloudWatch logs"
  value       = var.create_cluster ? aws_rds_cluster.main[0].enabled_cloudwatch_logs_exports : null
}

output "cluster_instances" {
  description = "List of cluster instances"
  value = var.create_cluster ? [
    for instance in aws_rds_cluster_instance.main : {
      id       = instance.id
      endpoint = instance.endpoint
      address  = instance.address
      port     = instance.port
      status   = instance.status
      arn      = instance.arn
    }
  ] : null
}

# Proxy Outputs
output "proxy_id" {
  description = "The RDS proxy ID"
  value       = var.create_proxy ? aws_db_proxy.main[0].id : null
}

output "proxy_arn" {
  description = "The ARN of the RDS proxy"
  value       = var.create_proxy ? aws_db_proxy.main[0].arn : null
}

output "proxy_endpoint" {
  description = "The endpoint for the RDS proxy"
  value       = var.create_proxy ? aws_db_proxy.main[0].endpoint : null
}

output "proxy_name" {
  description = "The name of the RDS proxy"
  value       = var.create_proxy ? aws_db_proxy.main[0].name : null
}

output "proxy_debug_logging" {
  description = "Whether the proxy includes detailed information about SQL statements in its logs"
  value       = var.create_proxy ? aws_db_proxy.main[0].debug_logging : null
}

output "proxy_engine_family" {
  description = "The kinds of databases that the proxy can connect to"
  value       = var.create_proxy ? aws_db_proxy.main[0].engine_family : null
}

output "proxy_idle_client_timeout" {
  description = "The number of seconds that a connection to the proxy can be inactive"
  value       = var.create_proxy ? aws_db_proxy.main[0].idle_client_timeout : null
}

output "proxy_require_tls" {
  description = "Whether Transport Layer Security (TLS) encryption is required for connections to the proxy"
  value       = var.create_proxy ? aws_db_proxy.main[0].require_tls : null
}

output "proxy_role_arn" {
  description = "The ARN for the IAM role that the proxy uses to access AWS Secrets Manager"
  value       = var.create_proxy ? aws_db_proxy.main[0].role_arn : null
}

output "proxy_vpc_security_group_ids" {
  description = "One or more VPC security group IDs to associate with the new proxy"
  value       = var.create_proxy ? aws_db_proxy.main[0].vpc_security_group_ids : null
}

output "proxy_vpc_subnet_ids" {
  description = "One or more VPC subnet IDs to associate with the new proxy"
  value       = var.create_proxy ? aws_db_proxy.main[0].vpc_subnet_ids : null
}

# Subnet Group Outputs
output "db_subnet_group_id" {
  description = "The db subnet group name"
  value       = var.create_db_subnet_group ? aws_db_subnet_group.main[0].id : null
}

output "db_subnet_group_arn" {
  description = "The ARN of the db subnet group"
  value       = var.create_db_subnet_group ? aws_db_subnet_group.main[0].arn : null
}

# Parameter Group Outputs
output "db_parameter_group_id" {
  description = "The db parameter group id"
  value       = var.create_db_parameter_group ? aws_db_parameter_group.main[0].id : null
}

output "db_parameter_group_arn" {
  description = "The ARN of the db parameter group"
  value       = var.create_db_parameter_group ? aws_db_parameter_group.main[0].arn : null
}

# Option Group Outputs
output "db_option_group_id" {
  description = "The db option group id"
  value       = var.create_db_option_group ? aws_db_option_group.main[0].id : null
}

output "db_option_group_arn" {
  description = "The ARN of the db option group"
  value       = var.create_db_option_group ? aws_db_option_group.main[0].arn : null
}

# Monitoring Role Outputs
output "monitoring_role_arn" {
  description = "The ARN of the IAM role created for RDS monitoring"
  value       = var.monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null
}

output "monitoring_role_name" {
  description = "The name of the IAM role created for RDS monitoring"
  value       = var.monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].name : null
}

# CloudWatch Log Group Outputs
output "cloudwatch_log_groups" {
  description = "Map of CloudWatch log groups created and their attributes"
  value = {
    for log_group in aws_cloudwatch_log_group.postgresql : log_group.name => {
      arn                = log_group.arn
      name               = log_group.name
      retention_in_days  = log_group.retention_in_days
      kms_key_id         = log_group.kms_key_id
    }
  }
}

# Secrets Manager Outputs
output "proxy_secret_arn" {
  description = "The ARN of the secret in Secrets Manager"
  value       = var.create_proxy ? aws_secretsmanager_secret.rds_proxy[0].arn : null
}

output "proxy_secret_id" {
  description = "The ID of the secret in Secrets Manager"
  value       = var.create_proxy ? aws_secretsmanager_secret.rds_proxy[0].id : null
}

output "proxy_secret_version_id" {
  description = "The unique identifier of the version of the secret"
  value       = var.create_proxy ? aws_secretsmanager_secret_version.rds_proxy[0].version_id : null
} 