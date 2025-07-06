# CloudWatch Module Outputs

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "sns_topic_name" {
  description = "Name of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.name
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_arn" {
  description = "ARN of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_arn
}

output "log_group_names" {
  description = "Map of log group names"
  value = {
    application      = aws_cloudwatch_log_group.application.name
    ai_service       = aws_cloudwatch_log_group.ai_service.name
    gaming_engine    = aws_cloudwatch_log_group.gaming_engine.name
    blockchain_service = aws_cloudwatch_log_group.blockchain_service.name
    api_gateway      = aws_cloudwatch_log_group.api_gateway.name
  }
}

output "log_group_arns" {
  description = "Map of log group ARNs"
  value = {
    application      = aws_cloudwatch_log_group.application.arn
    ai_service       = aws_cloudwatch_log_group.ai_service.arn
    gaming_engine    = aws_cloudwatch_log_group.gaming_engine.arn
    blockchain_service = aws_cloudwatch_log_group.blockchain_service.arn
    api_gateway      = aws_cloudwatch_log_group.api_gateway.arn
  }
}

output "alarm_arns" {
  description = "Map of CloudWatch alarm ARNs"
  value = {
    ecs_cpu_high                    = aws_cloudwatch_metric_alarm.ecs_cpu_high.arn
    ecs_memory_high                 = aws_cloudwatch_metric_alarm.ecs_memory_high.arn
    rds_cpu_high                    = aws_cloudwatch_metric_alarm.rds_cpu_high.arn
    rds_connections_high            = aws_cloudwatch_metric_alarm.rds_connections_high.arn
    rds_free_memory_low             = aws_cloudwatch_metric_alarm.rds_free_memory_low.arn
    redis_cpu_high                  = aws_cloudwatch_metric_alarm.redis_cpu_high.arn
    redis_memory_high               = aws_cloudwatch_metric_alarm.redis_memory_high.arn
    redis_connections_high          = aws_cloudwatch_metric_alarm.redis_connections_high.arn
    alb_5xx_errors                  = aws_cloudwatch_metric_alarm.alb_5xx_errors.arn
    alb_target_response_time        = aws_cloudwatch_metric_alarm.alb_target_response_time.arn
    route53_health_check            = aws_cloudwatch_metric_alarm.route53_health_check.arn
    application_errors              = aws_cloudwatch_metric_alarm.application_errors.arn
    ai_service_latency              = aws_cloudwatch_metric_alarm.ai_service_latency.arn
    blockchain_transaction_failures = aws_cloudwatch_metric_alarm.blockchain_transaction_failures.arn
  }
} 