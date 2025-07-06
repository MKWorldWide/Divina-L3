# Route53 Module Outputs

output "zone_id" {
  description = "The hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "name_servers" {
  description = "The name servers for the hosted zone"
  value       = aws_route53_zone.main.name_servers
}

output "certificate_arn" {
  description = "The ARN of the SSL certificate"
  value       = aws_acm_certificate.main.arn
}

output "certificate_validation_arn" {
  description = "The ARN of the validated SSL certificate"
  value       = aws_acm_certificate_validation.main.certificate_arn
}

output "certificate_domain_validation_options" {
  description = "The domain validation options for the certificate"
  value       = aws_acm_certificate.main.domain_validation_options
}

output "health_check_ids" {
  description = "Map of health check IDs"
  value = {
    for k, v in aws_route53_health_check.main : k => v.id
  }
}

output "health_check_arns" {
  description = "Map of health check ARNs"
  value = {
    for k, v in aws_route53_health_check.main : k => v.arn
  }
} 