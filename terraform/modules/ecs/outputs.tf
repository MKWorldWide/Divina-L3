# ECS Module Outputs

output "cluster_id" {
  description = "The ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "cluster_arn" {
  description = "The ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "cluster_name" {
  description = "The name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "task_execution_role_arn" {
  description = "The ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution_role.arn
}

output "task_role_arn" {
  description = "The ARN of the ECS task role"
  value       = aws_iam_role.ecs_task_role.arn
}

output "app_target_group_arn" {
  description = "The ARN of the application target group"
  value       = aws_lb_target_group.app.arn
}

output "api_target_group_arn" {
  description = "The ARN of the API target group"
  value       = aws_lb_target_group.api.arn
}

output "app_service_name" {
  description = "The name of the application service"
  value       = aws_ecs_service.app.name
}

output "api_service_name" {
  description = "The name of the API service"
  value       = aws_ecs_service.api.name
}

output "app_task_definition_arn" {
  description = "The ARN of the application task definition"
  value       = aws_ecs_task_definition.app.arn
}

output "api_task_definition_arn" {
  description = "The ARN of the API task definition"
  value       = aws_ecs_task_definition.api.arn
}

output "security_group_id" {
  description = "The ID of the ECS tasks security group"
  value       = aws_security_group.ecs_tasks.id
}

output "security_group_arn" {
  description = "The ARN of the ECS tasks security group"
  value       = aws_security_group.ecs_tasks.arn
} 