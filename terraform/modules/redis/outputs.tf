# Redis Module Outputs

output "replication_group_id" {
  description = "The ID of the ElastiCache Replication Group"
  value       = aws_elasticache_replication_group.main.id
}

output "replication_group_arn" {
  description = "The ARN of the ElastiCache Replication Group"
  value       = aws_elasticache_replication_group.main.arn
}

output "replication_group_primary_endpoint_address" {
  description = "The address of the endpoint for the primary node in the replication group"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "replication_group_reader_endpoint_address" {
  description = "The address of the endpoint for the reader node in the replication group"
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
}

output "replication_group_member_clusters" {
  description = "The identifiers of all the nodes that are part of this replication group"
  value       = aws_elasticache_replication_group.main.member_clusters
}

output "replication_group_node_type" {
  description = "The compute and memory capacity of the nodes"
  value       = aws_elasticache_replication_group.main.node_type
}

output "replication_group_port" {
  description = "The port number on which each of the nodes accepts connections"
  value       = aws_elasticache_replication_group.main.port
}

output "replication_group_automatic_failover_enabled" {
  description = "Specifies whether a read-only replica will be automatically promoted to read/write primary if the existing primary fails"
  value       = aws_elasticache_replication_group.main.automatic_failover_enabled
}

output "replication_group_multi_az_enabled" {
  description = "Specifies whether to enable Multi-AZ Support for the replication group"
  value       = aws_elasticache_replication_group.main.multi_az_enabled
}

output "replication_group_at_rest_encryption_enabled" {
  description = "Whether to enable encryption at rest"
  value       = aws_elasticache_replication_group.main.at_rest_encryption_enabled
}

output "replication_group_transit_encryption_enabled" {
  description = "Whether to enable encryption in transit"
  value       = aws_elasticache_replication_group.main.transit_encryption_enabled
}

output "replication_group_snapshot_window" {
  description = "Daily time range during which ElastiCache will take a snapshot of the cache cluster"
  value       = aws_elasticache_replication_group.main.snapshot_window
}

output "replication_group_snapshot_retention_limit" {
  description = "Number of days for which ElastiCache will retain automatic cache cluster snapshots before deleting them"
  value       = aws_elasticache_replication_group.main.snapshot_retention_limit
}

output "replication_group_maintenance_window" {
  description = "Specifies the weekly time range for when maintenance on the cache cluster is performed"
  value       = aws_elasticache_replication_group.main.maintenance_window
}

output "replication_group_auto_minor_version_upgrade" {
  description = "Specifies whether a minor engine upgrade will be applied automatically to the underlying Cache Cluster instances during the maintenance window"
  value       = aws_elasticache_replication_group.main.auto_minor_version_upgrade
}

output "replication_group_parameter_group_name" {
  description = "The name of the parameter group associated with this replication group"
  value       = aws_elasticache_replication_group.main.parameter_group_name
}

output "replication_group_subnet_group_name" {
  description = "The name of the cache subnet group to be used for the replication group"
  value       = aws_elasticache_replication_group.main.subnet_group_name
}

output "replication_group_security_group_ids" {
  description = "One or more VPC security groups associated with the cache cluster"
  value       = aws_elasticache_replication_group.main.security_group_ids
}

output "replication_group_kms_key_id" {
  description = "The ARN of the key that you wish to use if encrypting at rest"
  value       = aws_elasticache_replication_group.main.kms_key_id
}

# Subnet Group Outputs
output "subnet_group_id" {
  description = "The ElastiCache Subnet Group name"
  value       = var.create_subnet_group ? aws_elasticache_subnet_group.main[0].id : null
}

output "subnet_group_arn" {
  description = "The ARN of the ElastiCache Subnet Group"
  value       = var.create_subnet_group ? aws_elasticache_subnet_group.main[0].arn : null
}

output "subnet_group_name" {
  description = "The ElastiCache Subnet Group name"
  value       = var.create_subnet_group ? aws_elasticache_subnet_group.main[0].name : null
}

# Parameter Group Outputs
output "parameter_group_id" {
  description = "The ElastiCache Parameter Group name"
  value       = var.create_parameter_group ? aws_elasticache_parameter_group.main[0].id : null
}

output "parameter_group_arn" {
  description = "The ARN of the ElastiCache Parameter Group"
  value       = var.create_parameter_group ? aws_elasticache_parameter_group.main[0].arn : null
}

output "parameter_group_name" {
  description = "The ElastiCache Parameter Group name"
  value       = var.create_parameter_group ? aws_elasticache_parameter_group.main[0].name : null
}

# User Group Outputs
output "user_group_id" {
  description = "The ID of the ElastiCache User Group"
  value       = var.create_user_group ? aws_elasticache_user_group.main[0].id : null
}

output "user_group_arn" {
  description = "The ARN of the ElastiCache User Group"
  value       = var.create_user_group ? aws_elasticache_user_group.main[0].arn : null
}

output "user_group_user_ids" {
  description = "The list of user IDs that belong to the user group"
  value       = var.create_user_group ? aws_elasticache_user_group.main[0].user_ids : null
}

# User Outputs
output "user_id" {
  description = "The ID of the ElastiCache User"
  value       = var.create_user ? aws_elasticache_user.main[0].id : null
}

output "user_arn" {
  description = "The ARN of the ElastiCache User"
  value       = var.create_user ? aws_elasticache_user.main[0].arn : null
}

output "user_name" {
  description = "The username of the ElastiCache User"
  value       = var.create_user ? aws_elasticache_user.main[0].user_name : null
}

output "user_access_string" {
  description = "The access permissions string used for this user"
  value       = var.create_user ? aws_elasticache_user.main[0].access_string : null
}

# CloudWatch Log Group Outputs
output "cloudwatch_log_group_name" {
  description = "The name of the CloudWatch log group"
  value       = var.enable_cloudwatch_logs ? aws_cloudwatch_log_group.redis[0].name : null
}

output "cloudwatch_log_group_arn" {
  description = "The ARN of the CloudWatch log group"
  value       = var.enable_cloudwatch_logs ? aws_cloudwatch_log_group.redis[0].arn : null
}

output "cloudwatch_log_group_retention_in_days" {
  description = "The number of days to retain CloudWatch logs"
  value       = var.enable_cloudwatch_logs ? aws_cloudwatch_log_group.redis[0].retention_in_days : null
}

# CloudWatch Alarm Outputs
output "cloudwatch_alarm_cpu_id" {
  description = "The ID of the CPU utilization CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.redis_cpu[0].id : null
}

output "cloudwatch_alarm_cpu_arn" {
  description = "The ARN of the CPU utilization CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.redis_cpu[0].arn : null
}

output "cloudwatch_alarm_memory_id" {
  description = "The ID of the memory utilization CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.redis_memory[0].id : null
}

output "cloudwatch_alarm_memory_arn" {
  description = "The ARN of the memory utilization CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.redis_memory[0].arn : null
}

output "cloudwatch_alarm_connections_id" {
  description = "The ID of the connection count CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.redis_connections[0].id : null
}

output "cloudwatch_alarm_connections_arn" {
  description = "The ARN of the connection count CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.redis_connections[0].arn : null
}

# IAM Role Outputs
output "cloudwatch_logs_role_id" {
  description = "The ID of the IAM role for CloudWatch logs"
  value       = var.enable_cloudwatch_logs ? aws_iam_role.cloudwatch_logs[0].id : null
}

output "cloudwatch_logs_role_arn" {
  description = "The ARN of the IAM role for CloudWatch logs"
  value       = var.enable_cloudwatch_logs ? aws_iam_role.cloudwatch_logs[0].arn : null
}

output "cloudwatch_logs_role_name" {
  description = "The name of the IAM role for CloudWatch logs"
  value       = var.enable_cloudwatch_logs ? aws_iam_role.cloudwatch_logs[0].name : null
}

# KMS Key Outputs
output "kms_key_id" {
  description = "The ID of the KMS key used for Redis encryption"
  value       = var.at_rest_encryption_enabled && var.kms_key_id == null ? aws_kms_key.redis[0].id : var.kms_key_id
}

output "kms_key_arn" {
  description = "The ARN of the KMS key used for Redis encryption"
  value       = var.at_rest_encryption_enabled && var.kms_key_id == null ? aws_kms_key.redis[0].arn : var.kms_key_id
}

output "kms_key_alias_name" {
  description = "The name of the KMS key alias"
  value       = var.at_rest_encryption_enabled && var.kms_key_id == null ? aws_kms_alias.redis[0].name : null
}

output "kms_key_alias_arn" {
  description = "The ARN of the KMS key alias"
  value       = var.at_rest_encryption_enabled && var.kms_key_id == null ? aws_kms_alias.redis[0].arn : null
}

# Multi-AZ Subnet Group Outputs
output "multi_az_subnet_group_id" {
  description = "The ID of the Multi-AZ ElastiCache Subnet Group"
  value       = var.multi_az_enabled && var.create_subnet_group ? aws_elasticache_subnet_group.multi_az[0].id : null
}

output "multi_az_subnet_group_arn" {
  description = "The ARN of the Multi-AZ ElastiCache Subnet Group"
  value       = var.multi_az_enabled && var.create_subnet_group ? aws_elasticache_subnet_group.multi_az[0].arn : null
}

output "multi_az_subnet_group_name" {
  description = "The name of the Multi-AZ ElastiCache Subnet Group"
  value       = var.multi_az_enabled && var.create_subnet_group ? aws_elasticache_subnet_group.multi_az[0].name : null
}

# Backup Cluster Outputs
output "backup_replication_group_id" {
  description = "The ID of the backup ElastiCache Replication Group"
  value       = var.enable_backup ? aws_elasticache_replication_group.backup[0].id : null
}

output "backup_replication_group_arn" {
  description = "The ARN of the backup ElastiCache Replication Group"
  value       = var.enable_backup ? aws_elasticache_replication_group.backup[0].arn : null
}

output "backup_replication_group_primary_endpoint_address" {
  description = "The address of the endpoint for the primary node in the backup replication group"
  value       = var.enable_backup ? aws_elasticache_replication_group.backup[0].primary_endpoint_address : null
}

output "backup_replication_group_node_type" {
  description = "The compute and memory capacity of the backup nodes"
  value       = var.enable_backup ? aws_elasticache_replication_group.backup[0].node_type : null
}

output "backup_replication_group_port" {
  description = "The port number on which each of the backup nodes accepts connections"
  value       = var.enable_backup ? aws_elasticache_replication_group.backup[0].port : null
}

# Connection Information
output "connection_endpoint" {
  description = "The primary endpoint for connecting to the Redis cluster"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "connection_port" {
  description = "The port for connecting to the Redis cluster"
  value       = aws_elasticache_replication_group.main.port
}

output "connection_url" {
  description = "The connection URL for the Redis cluster"
  value       = "redis://${aws_elasticache_replication_group.main.primary_endpoint_address}:${aws_elasticache_replication_group.main.port}"
}

output "connection_url_with_auth" {
  description = "The connection URL for the Redis cluster with authentication (if enabled)"
  value       = var.auth_token != null ? "redis://:${var.auth_token}@${aws_elasticache_replication_group.main.primary_endpoint_address}:${aws_elasticache_replication_group.main.port}" : "redis://${aws_elasticache_replication_group.main.primary_endpoint_address}:${aws_elasticache_replication_group.main.port}"
}

# Cluster Status
output "cluster_status" {
  description = "The status of the ElastiCache Replication Group"
  value       = aws_elasticache_replication_group.main.status
}

output "cluster_member_clusters" {
  description = "The identifiers of all the nodes that are part of this replication group"
  value       = aws_elasticache_replication_group.main.member_clusters
}

output "cluster_automatic_failover_enabled" {
  description = "Specifies whether a read-only replica will be automatically promoted to read/write primary if the existing primary fails"
  value       = aws_elasticache_replication_group.main.automatic_failover_enabled
}

output "cluster_multi_az_enabled" {
  description = "Specifies whether to enable Multi-AZ Support for the replication group"
  value       = aws_elasticache_replication_group.main.multi_az_enabled
} 