# MQ Module Outputs

output "broker_id" {
  description = "The unique ID of the Amazon MQ broker"
  value       = aws_mq_broker.main.id
}

output "broker_arn" {
  description = "The ARN of the Amazon MQ broker"
  value       = aws_mq_broker.main.arn
}

output "broker_name" {
  description = "The name of the Amazon MQ broker"
  value       = aws_mq_broker.main.broker_name
}

output "broker_instances" {
  description = "A list of information about allocated brokers"
  value       = aws_mq_broker.main.instances
}

output "broker_instances_endpoints" {
  description = "A list of endpoints for the broker instances"
  value       = aws_mq_broker.main.instances[*].endpoints
}

output "broker_instances_console_urls" {
  description = "A list of console URLs for the broker instances"
  value       = aws_mq_broker.main.instances[*].console_url
}

output "broker_instances_ip_addresses" {
  description = "A list of IP addresses for the broker instances"
  value       = aws_mq_broker.main.instances[*].ip_address
}

output "broker_engine_type" {
  description = "The type of broker engine"
  value       = aws_mq_broker.main.engine_type
}

output "broker_engine_version" {
  description = "The version of the broker engine"
  value       = aws_mq_broker.main.engine_version
}

output "broker_host_instance_type" {
  description = "The broker's instance type"
  value       = aws_mq_broker.main.host_instance_type
}

output "broker_deployment_mode" {
  description = "The deployment mode of the broker"
  value       = aws_mq_broker.main.deployment_mode
}

output "broker_subnet_ids" {
  description = "The list of subnet IDs in which to launch the broker"
  value       = aws_mq_broker.main.subnet_ids
}

output "broker_security_groups" {
  description = "The list of security group IDs assigned to the broker"
  value       = aws_mq_broker.main.security_groups
}

output "broker_users" {
  description = "The list of broker users"
  value       = aws_mq_broker.main.user
}

output "broker_configuration_id" {
  description = "The ID of the broker configuration"
  value       = aws_mq_broker.main.configuration[0].id
}

output "broker_configuration_revision" {
  description = "The revision of the broker configuration"
  value       = aws_mq_broker.main.configuration[0].revision
}

output "broker_encryption_options" {
  description = "The encryption options for the broker"
  value       = aws_mq_broker.main.encryption_options
}

output "broker_logs" {
  description = "The logging configuration for the broker"
  value       = aws_mq_broker.main.logs
}

output "broker_maintenance_window_start_time" {
  description = "The maintenance window start time for the broker"
  value       = aws_mq_broker.main.maintenance_window_start_time
}

output "broker_status" {
  description = "The status of the broker"
  value       = aws_mq_broker.main.status
}

# Configuration Outputs
output "configuration_id" {
  description = "The unique ID of the Amazon MQ configuration"
  value       = aws_mq_configuration.main.id
}

output "configuration_arn" {
  description = "The ARN of the Amazon MQ configuration"
  value       = aws_mq_configuration.main.arn
}

output "configuration_name" {
  description = "The name of the Amazon MQ configuration"
  value       = aws_mq_configuration.main.name
}

output "configuration_description" {
  description = "The description of the Amazon MQ configuration"
  value       = aws_mq_configuration.main.description
}

output "configuration_engine_type" {
  description = "The type of broker engine"
  value       = aws_mq_configuration.main.engine_type
}

output "configuration_engine_version" {
  description = "The version of the broker engine"
  value       = aws_mq_configuration.main.engine_version
}

output "configuration_latest_revision" {
  description = "The latest revision of the configuration"
  value       = aws_mq_configuration.main.latest_revision
}

output "configuration_data" {
  description = "The broker configuration in XML format"
  value       = aws_mq_configuration.main.data
  sensitive   = true
}

# KMS Key Outputs
output "kms_key_id" {
  description = "The ID of the KMS key used for encryption"
  value       = var.encryption_enabled ? aws_kms_key.mq[0].id : null
}

output "kms_key_arn" {
  description = "The ARN of the KMS key used for encryption"
  value       = var.encryption_enabled ? aws_kms_key.mq[0].arn : null
}

output "kms_key_alias_name" {
  description = "The name of the KMS key alias"
  value       = var.encryption_enabled ? aws_kms_alias.mq[0].name : null
}

output "kms_key_alias_arn" {
  description = "The ARN of the KMS key alias"
  value       = var.encryption_enabled ? aws_kms_alias.mq[0].arn : null
}

# CloudWatch Log Group Outputs
output "cloudwatch_log_group_general_name" {
  description = "The name of the CloudWatch log group for general logs"
  value       = var.enable_general_logs ? aws_cloudwatch_log_group.mq_general[0].name : null
}

output "cloudwatch_log_group_general_arn" {
  description = "The ARN of the CloudWatch log group for general logs"
  value       = var.enable_general_logs ? aws_cloudwatch_log_group.mq_general[0].arn : null
}

output "cloudwatch_log_group_audit_name" {
  description = "The name of the CloudWatch log group for audit logs"
  value       = var.enable_audit_logs ? aws_cloudwatch_log_group.mq_audit[0].name : null
}

output "cloudwatch_log_group_audit_arn" {
  description = "The ARN of the CloudWatch log group for audit logs"
  value       = var.enable_audit_logs ? aws_cloudwatch_log_group.mq_audit[0].arn : null
}

# CloudWatch Alarm Outputs
output "cloudwatch_alarm_connections_id" {
  description = "The ID of the connection count CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.mq_connections[0].id : null
}

output "cloudwatch_alarm_connections_arn" {
  description = "The ARN of the connection count CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.mq_connections[0].arn : null
}

output "cloudwatch_alarm_messages_id" {
  description = "The ID of the message count CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.mq_messages[0].id : null
}

output "cloudwatch_alarm_messages_arn" {
  description = "The ARN of the message count CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.mq_messages[0].arn : null
}

output "cloudwatch_alarm_cpu_id" {
  description = "The ID of the CPU utilization CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.mq_cpu[0].id : null
}

output "cloudwatch_alarm_cpu_arn" {
  description = "The ARN of the CPU utilization CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.mq_cpu[0].arn : null
}

output "cloudwatch_alarm_memory_id" {
  description = "The ID of the memory utilization CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.mq_memory[0].id : null
}

output "cloudwatch_alarm_memory_arn" {
  description = "The ARN of the memory utilization CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.mq_memory[0].arn : null
}

# IAM Role Outputs
output "cloudwatch_logs_role_id" {
  description = "The ID of the IAM role for CloudWatch logs"
  value       = (var.enable_general_logs || var.enable_audit_logs) ? aws_iam_role.cloudwatch_logs[0].id : null
}

output "cloudwatch_logs_role_arn" {
  description = "The ARN of the IAM role for CloudWatch logs"
  value       = (var.enable_general_logs || var.enable_audit_logs) ? aws_iam_role.cloudwatch_logs[0].arn : null
}

output "cloudwatch_logs_role_name" {
  description = "The name of the IAM role for CloudWatch logs"
  value       = (var.enable_general_logs || var.enable_audit_logs) ? aws_iam_role.cloudwatch_logs[0].name : null
}

# Connection Information
output "connection_endpoints" {
  description = "The endpoints for connecting to the broker"
  value       = aws_mq_broker.main.instances[*].endpoints
}

output "connection_console_urls" {
  description = "The console URLs for the broker instances"
  value       = aws_mq_broker.main.instances[*].console_url
}

output "connection_amqp_endpoints" {
  description = "The AMQP endpoints for connecting to the broker"
  value = [
    for instance in aws_mq_broker.main.instances : "amqps://${instance.endpoints[0]}"
  ]
}

output "connection_stomp_endpoints" {
  description = "The STOMP endpoints for connecting to the broker"
  value = [
    for instance in aws_mq_broker.main.instances : "stomp+ssl://${instance.endpoints[2]}"
  ]
}

output "connection_mqtt_endpoints" {
  description = "The MQTT endpoints for connecting to the broker"
  value = [
    for instance in aws_mq_broker.main.instances : "mqtt+ssl://${instance.endpoints[3]}"
  ]
}

output "connection_websocket_endpoints" {
  description = "The WebSocket endpoints for connecting to the broker"
  value = [
    for instance in aws_mq_broker.main.instances : "ws://${instance.endpoints[4]}"
  ]
}

# Broker Status
output "broker_instances_status" {
  description = "The status of each broker instance"
  value = [
    for instance in aws_mq_broker.main.instances : {
      id     = instance.id
      status = instance.status
    }
  ]
}

output "broker_instances_engine_version" {
  description = "The engine version of each broker instance"
  value = [
    for instance in aws_mq_broker.main.instances : {
      id             = instance.id
      engine_version = instance.engine_version
    }
  ]
}

output "broker_instances_host_instance_type" {
  description = "The host instance type of each broker instance"
  value = [
    for instance in aws_mq_broker.main.instances : {
      id                 = instance.id
      host_instance_type = instance.host_instance_type
    }
  ]
}

# Security Information
output "broker_encryption_enabled" {
  description = "Whether encryption is enabled for the broker"
  value       = var.encryption_enabled
}

output "broker_transit_encryption_enabled" {
  description = "Whether transit encryption is enabled for the broker"
  value       = var.encryption_enabled
}

output "broker_at_rest_encryption_enabled" {
  description = "Whether at-rest encryption is enabled for the broker"
  value       = var.encryption_enabled
}

# Logging Information
output "broker_general_logs_enabled" {
  description = "Whether general logs are enabled for the broker"
  value       = var.enable_general_logs
}

output "broker_audit_logs_enabled" {
  description = "Whether audit logs are enabled for the broker"
  value       = var.enable_audit_logs
}

# Maintenance Information
output "broker_maintenance_window" {
  description = "The maintenance window for the broker"
  value = {
    day_of_week = var.maintenance_window_day_of_week
    time_of_day = var.maintenance_window_time_of_day
    time_zone   = var.maintenance_window_time_zone
  }
} 