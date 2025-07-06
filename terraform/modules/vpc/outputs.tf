# VPC Module Outputs

output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_arn" {
  description = "The ARN of the VPC"
  value       = aws_vpc.main.arn
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "default_security_group_id" {
  description = "The ID of the security group created by default on VPC creation"
  value       = aws_vpc.main.default_security_group_id
}

output "default_network_acl_id" {
  description = "The ID of the default network ACL"
  value       = aws_vpc.main.default_network_acl_id
}

output "default_route_table_id" {
  description = "The ID of the default route table"
  value       = aws_vpc.main.default_route_table_id
}

output "default_vpc_dhcp_options_id" {
  description = "The ID of the DHCP options"
  value       = aws_vpc.main.default_vpc_dhcp_options_id
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "public_subnet_arns" {
  description = "List of ARNs of public subnets"
  value       = aws_subnet.public[*].arn
}

output "public_subnets_cidr_blocks" {
  description = "List of cidr_blocks of public subnets"
  value       = aws_subnet.public[*].cidr_block
}

output "public_subnets_ipv6_cidr_blocks" {
  description = "List of IPv6 cidr_blocks of public subnets in an IPv6 enabled VPC"
  value       = aws_subnet.public[*].ipv6_cidr_block
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "private_subnet_arns" {
  description = "List of ARNs of private subnets"
  value       = aws_subnet.private[*].arn
}

output "private_subnets_cidr_blocks" {
  description = "List of cidr_blocks of private subnets"
  value       = aws_subnet.private[*].cidr_block
}

output "private_subnets_ipv6_cidr_blocks" {
  description = "List of IPv6 cidr_blocks of private subnets in an IPv6 enabled VPC"
  value       = aws_subnet.private[*].ipv6_cidr_block
}

output "database_subnets" {
  description = "List of IDs of database subnets"
  value       = aws_subnet.database[*].id
}

output "database_subnet_arns" {
  description = "List of ARNs of database subnets"
  value       = aws_subnet.database[*].arn
}

output "database_subnets_cidr_blocks" {
  description = "List of cidr_blocks of database subnets"
  value       = aws_subnet.database[*].cidr_block
}

output "database_subnets_ipv6_cidr_blocks" {
  description = "List of IPv6 cidr_blocks of database subnets in an IPv6 enabled VPC"
  value       = aws_subnet.database[*].ipv6_cidr_block
}

output "elasticache_subnets" {
  description = "List of IDs of ElastiCache subnets"
  value       = aws_subnet.elasticache[*].id
}

output "elasticache_subnet_arns" {
  description = "List of ARNs of ElastiCache subnets"
  value       = aws_subnet.elasticache[*].arn
}

output "elasticache_subnets_cidr_blocks" {
  description = "List of cidr_blocks of ElastiCache subnets"
  value       = aws_subnet.elasticache[*].cidr_block
}

output "elasticache_subnets_ipv6_cidr_blocks" {
  description = "List of IPv6 cidr_blocks of ElastiCache subnets in an IPv6 enabled VPC"
  value       = aws_subnet.elasticache[*].ipv6_cidr_block
}

output "database_subnet_group_name" {
  description = "Name of database subnet group"
  value       = aws_db_subnet_group.database.name
}

output "elasticache_subnet_group_name" {
  description = "Name of ElastiCache subnet group"
  value       = aws_elasticache_subnet_group.main.name
}

output "public_route_table_ids" {
  description = "List of IDs of public route tables"
  value       = aws_route_table.public[*].id
}

output "private_route_table_ids" {
  description = "List of IDs of private route tables"
  value       = aws_route_table.private[*].id
}

output "public_internet_gateway_route_id" {
  description = "ID of the internet gateway route"
  value       = aws_route_table.public[*].id
}

output "private_nat_gateway_route_ids" {
  description = "List of IDs of the private nat gateway route"
  value       = aws_route_table.private[*].id
}

output "nat_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "nat_public_ips" {
  description = "List of public Elastic IPs created for NAT Gateway"
  value       = aws_eip.nat[*].public_ip
}

output "natgw_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "igw_id" {
  description = "The ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "igw_arn" {
  description = "The ARN of the Internet Gateway"
  value       = aws_internet_gateway.main.arn
}

output "vpn_gateway_id" {
  description = "The ID of the VPN Gateway"
  value       = var.enable_vpn_gateway ? aws_vpn_gateway.main[0].id : null
}

output "vpn_gateway_arn" {
  description = "The ARN of the VPN Gateway"
  value       = var.enable_vpn_gateway ? aws_vpn_gateway.main[0].arn : null
}

output "vpc_flow_log_id" {
  description = "The ID of the Flow Log"
  value       = var.enable_vpc_flow_logs ? aws_flow_log.main[0].id : null
}

output "vpc_flow_log_arn" {
  description = "The ARN of the Flow Log"
  value       = var.enable_vpc_flow_logs ? aws_flow_log.main[0].arn : null
}

output "vpc_flow_log_destination_arn" {
  description = "The ARN of the destination for VPC Flow Logs"
  value       = var.enable_vpc_flow_logs ? aws_flow_log.main[0].log_destination : null
}

output "vpc_flow_log_destination_type" {
  description = "The type of the destination for VPC Flow Logs"
  value       = var.enable_vpc_flow_logs ? aws_flow_log.main[0].log_destination_type : null
}

output "vpc_flow_log_cloudwatch_iam_role_arn" {
  description = "The ARN of the IAM role used when pushing Flow Logs to CloudWatch log group"
  value       = var.enable_vpc_flow_logs ? aws_iam_role.vpc_flow_log[0].arn : null
}

output "vpc_flow_log_cloudwatch_log_group_arn" {
  description = "The ARN of the CloudWatch log group to which VPC Flow Logs are delivered"
  value       = var.enable_vpc_flow_logs ? aws_cloudwatch_log_group.vpc_flow_log[0].arn : null
}

output "vpc_flow_log_cloudwatch_log_group_name" {
  description = "The name of the CloudWatch log group to which VPC Flow Logs are delivered"
  value       = var.enable_vpc_flow_logs ? aws_cloudwatch_log_group.vpc_flow_log[0].name : null
}

output "vpc_flow_log_cloudwatch_log_group_kms_key_id" {
  description = "The ARN of the KMS Key to use when encrypting log data for VPC flow logs"
  value       = var.enable_vpc_flow_logs ? aws_cloudwatch_log_group.vpc_flow_log[0].kms_key_id : null
} 