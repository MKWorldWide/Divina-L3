# RDS PostgreSQL Module for GameDin L3 + AthenaMist AI

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  count = var.create_db_subnet_group ? 1 : 0

  name       = var.identifier
  subnet_ids = var.subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.identifier}-subnet-group"
    }
  )
}

# RDS Parameter Group
resource "aws_db_parameter_group" "main" {
  count = var.create_db_parameter_group ? 1 : 0

  family = var.family
  name   = "${var.identifier}-parameter-group"

  dynamic "parameter" {
    for_each = var.parameters
    content {
      name  = parameter.value.name
      value = parameter.value.value
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.identifier}-parameter-group"
    }
  )
}

# RDS Option Group
resource "aws_db_option_group" "main" {
  count = var.create_db_option_group ? 1 : 0

  name                     = "${var.identifier}-option-group"
  engine_name              = var.engine
  major_engine_version     = var.major_engine_version
  option_group_description = "Option group for ${var.identifier}"

  tags = merge(
    var.tags,
    {
      Name = "${var.identifier}-option-group"
    }
  )
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = var.identifier

  engine               = var.engine
  engine_version       = var.engine_version
  instance_class       = var.instance_class
  allocated_storage    = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type         = var.storage_type
  storage_encrypted    = var.storage_encrypted
  kms_key_id           = var.storage_encrypted ? var.kms_key_id : null

  db_name  = var.db_name
  username = var.username
  password = var.password
  port     = var.port

  vpc_security_group_ids = var.vpc_security_group_ids
  db_subnet_group_name   = var.create_db_subnet_group ? aws_db_subnet_group.main[0].name : var.db_subnet_group_name
  parameter_group_name   = var.create_db_parameter_group ? aws_db_parameter_group.main[0].name : var.parameter_group_name
  option_group_name      = var.create_db_option_group ? aws_db_option_group.main[0].name : var.option_group_name

  availability_zone   = var.availability_zone
  multi_az           = var.multi_az
  iops               = var.iops
  storage_throughput = var.storage_throughput

  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window
  copy_tags_to_snapshot  = var.copy_tags_to_snapshot

  skip_final_snapshot     = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.identifier}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  deletion_protection = var.deletion_protection
  delete_automated_backups = var.delete_automated_backups

  performance_insights_enabled          = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_enabled ? var.performance_insights_retention_period : null
  performance_insights_kms_key_id       = var.performance_insights_enabled ? var.performance_insights_kms_key_id : null

  monitoring_interval = var.monitoring_interval
  monitoring_role_arn = var.monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null

  auto_minor_version_upgrade = var.auto_minor_version_upgrade
  allow_major_version_upgrade = var.allow_major_version_upgrade

  apply_immediately = var.apply_immediately

  enabled_cloudwatch_logs_exports = var.enabled_cloudwatch_logs_exports

  character_set_name = var.character_set_name

  timezone = var.timezone

  license_model = var.license_model

  domain = var.domain
  domain_iam_role_name = var.domain != null ? var.domain_iam_role_name : null

  ca_cert_identifier = var.ca_cert_identifier

  tags = merge(
    var.tags,
    {
      Name = var.identifier
    }
  )

  lifecycle {
    ignore_changes = [
      password,
      final_snapshot_identifier
    ]
  }
}

# RDS Read Replica (if enabled)
resource "aws_db_instance" "read_replica" {
  count = var.create_read_replica ? 1 : 0

  identifier = "${var.identifier}-read-replica"

  replicate_source_db = aws_db_instance.main.identifier

  instance_class = var.read_replica_instance_class
  allocated_storage = var.read_replica_allocated_storage
  storage_type    = var.read_replica_storage_type
  storage_encrypted = var.read_replica_storage_encrypted

  availability_zone = var.read_replica_availability_zone
  multi_az         = var.read_replica_multi_az

  backup_retention_period = var.read_replica_backup_retention_period
  backup_window          = var.read_replica_backup_window
  maintenance_window     = var.read_replica_maintenance_window

  monitoring_interval = var.read_replica_monitoring_interval
  monitoring_role_arn = var.read_replica_monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null

  performance_insights_enabled = var.read_replica_performance_insights_enabled

  auto_minor_version_upgrade = var.read_replica_auto_minor_version_upgrade

  apply_immediately = var.read_replica_apply_immediately

  deletion_protection = var.read_replica_deletion_protection

  tags = merge(
    var.tags,
    {
      Name = "${var.identifier}-read-replica"
    }
  )
}

# IAM Role for RDS Monitoring
resource "aws_iam_role" "rds_monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  name = "${var.identifier}-rds-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "postgresql" {
  for_each = toset(var.enabled_cloudwatch_logs_exports)

  name              = "/aws/rds/instance/${var.identifier}/${each.value}"
  retention_in_days = var.cloudwatch_log_group_retention_in_days

  tags = merge(
    var.tags,
    {
      Name = "${var.identifier}-${each.value}-logs"
    }
  )
}

# RDS Cluster (if using Aurora)
resource "aws_rds_cluster" "main" {
  count = var.create_cluster ? 1 : 0

  cluster_identifier = var.identifier

  engine               = var.engine
  engine_version       = var.engine_version
  engine_mode          = var.engine_mode
  database_name        = var.db_name
  master_username      = var.username
  master_password      = var.password
  port                 = var.port

  vpc_security_group_ids = var.vpc_security_group_ids
  db_subnet_group_name   = var.create_db_subnet_group ? aws_db_subnet_group.main[0].name : var.db_subnet_group_name

  availability_zones = var.availability_zones

  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window

  copy_tags_to_snapshot = var.copy_tags_to_snapshot

  skip_final_snapshot     = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.identifier}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  deletion_protection = var.deletion_protection

  storage_encrypted = var.storage_encrypted
  kms_key_id        = var.storage_encrypted ? var.kms_key_id : null

  enabled_cloudwatch_logs_exports = var.enabled_cloudwatch_logs_exports

  tags = merge(
    var.tags,
    {
      Name = var.identifier
    }
  )

  lifecycle {
    ignore_changes = [
      master_password,
      final_snapshot_identifier
    ]
  }
}

# RDS Cluster Instance (if using Aurora)
resource "aws_rds_cluster_instance" "main" {
  count = var.create_cluster ? var.cluster_instances : 0

  identifier = "${var.identifier}-${count.index + 1}"

  cluster_identifier = aws_rds_cluster.main[0].id

  engine               = var.engine
  engine_version       = var.engine_version
  instance_class       = var.instance_class

  availability_zone = var.availability_zones[count.index % length(var.availability_zones)]

  monitoring_interval = var.monitoring_interval
  monitoring_role_arn = var.monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null

  performance_insights_enabled = var.performance_insights_enabled

  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  apply_immediately = var.apply_immediately

  tags = merge(
    var.tags,
    {
      Name = "${var.identifier}-${count.index + 1}"
    }
  )
}

# RDS Proxy (if enabled)
resource "aws_db_proxy" "main" {
  count = var.create_proxy ? 1 : 0

  name                   = "${var.identifier}-proxy"
  debug_logging          = var.proxy_debug_logging
  engine_family          = var.proxy_engine_family
  idle_client_timeout    = var.proxy_idle_client_timeout
  require_tls            = var.proxy_require_tls
  role_arn               = aws_iam_role.rds_proxy[0].arn
  vpc_security_group_ids = var.proxy_vpc_security_group_ids
  vpc_subnet_ids         = var.proxy_subnet_ids

  auth {
    auth_scheme = var.proxy_auth_scheme
    description = "RDS Proxy authentication"
    iam_auth    = var.proxy_iam_auth
    secret_arn  = aws_secretsmanager_secret.rds_proxy[0].arn
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.identifier}-proxy"
    }
  )
}

# RDS Proxy Default Target Group
resource "aws_db_proxy_default_target_group" "main" {
  count = var.create_proxy ? 1 : 0

  db_proxy_name = aws_db_proxy.main[0].name

  connection_pool_config {
    connection_borrow_timeout    = var.proxy_connection_borrow_timeout
    init_query                   = var.proxy_init_query
    max_connections_percent      = var.proxy_max_connections_percent
    max_idle_connections_percent = var.proxy_max_idle_connections_percent
    session_pinning_filters      = var.proxy_session_pinning_filters
  }
}

# RDS Proxy Target
resource "aws_db_proxy_target" "main" {
  count = var.create_proxy ? 1 : 0

  db_cluster_identifier = var.create_cluster ? aws_rds_cluster.main[0].id : null
  db_instance_identifier = var.create_cluster ? null : aws_db_instance.main.id
  db_proxy_name         = aws_db_proxy.main[0].name
  target_group_name     = aws_db_proxy_default_target_group.main[0].name
}

# IAM Role for RDS Proxy
resource "aws_iam_role" "rds_proxy" {
  count = var.create_proxy ? 1 : 0

  name = "${var.identifier}-rds-proxy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rds_proxy" {
  count = var.create_proxy ? 1 : 0

  role       = aws_iam_role.rds_proxy[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSProxyServiceRolePolicy"
}

# Secrets Manager Secret for RDS Proxy
resource "aws_secretsmanager_secret" "rds_proxy" {
  count = var.create_proxy ? 1 : 0

  name = "${var.identifier}-proxy-secret"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "rds_proxy" {
  count = var.create_proxy ? 1 : 0

  secret_id = aws_secretsmanager_secret.rds_proxy[0].id
  secret_string = jsonencode({
    username = var.username
    password = var.password
  })
} 