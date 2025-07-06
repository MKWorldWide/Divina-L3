# S3 Module for GameDin L3 + AthenaMist AI

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# S3 Bucket for Static Assets
resource "aws_s3_bucket" "static_assets" {
  bucket = var.static_assets_bucket_name

  tags = merge(
    var.tags,
    {
      Name = var.static_assets_bucket_name
      Purpose = "Static Assets"
    }
  )
}

# S3 Bucket for Logs
resource "aws_s3_bucket" "logs" {
  bucket = var.logs_bucket_name

  tags = merge(
    var.tags,
    {
      Name = var.logs_bucket_name
      Purpose = "Logs"
    }
  )
}

# S3 Bucket for Backups
resource "aws_s3_bucket" "backups" {
  bucket = var.backups_bucket_name

  tags = merge(
    var.tags,
    {
      Name = var.backups_bucket_name
      Purpose = "Backups"
    }
  )
}

# S3 Bucket for AI Models
resource "aws_s3_bucket" "ai_models" {
  bucket = var.ai_models_bucket_name

  tags = merge(
    var.tags,
    {
      Name = var.ai_models_bucket_name
      Purpose = "AI Models"
    }
  )
}

# S3 Bucket for Game Assets
resource "aws_s3_bucket" "game_assets" {
  bucket = var.game_assets_bucket_name

  tags = merge(
    var.tags,
    {
      Name = var.game_assets_bucket_name
      Purpose = "Game Assets"
    }
  )
}

# Bucket Versioning
resource "aws_s3_bucket_versioning" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "ai_models" {
  bucket = aws_s3_bucket.ai_models.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "game_assets" {
  bucket = aws_s3_bucket.game_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "ai_models" {
  bucket = aws_s3_bucket.ai_models.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "game_assets" {
  bucket = aws_s3_bucket.game_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Public Access Block
resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket = aws_s3_bucket.backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "ai_models" {
  bucket = aws_s3_bucket.ai_models.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "game_assets" {
  bucket = aws_s3_bucket.game_assets.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Lifecycle Rules
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log_retention"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "backup_retention"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555  # 7 years
    }
  }
}

# Bucket Policies
resource "aws_s3_bucket_policy" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.static_assets.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "game_assets" {
  bucket = aws_s3_bucket.game_assets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.game_assets.arn}/*"
      }
    ]
  })
}

# CORS Configuration for Static Assets
resource "aws_s3_bucket_cors_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# CORS Configuration for Game Assets
resource "aws_s3_bucket_cors_configuration" "game_assets" {
  bucket = aws_s3_bucket.game_assets.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "PUT", "POST"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# CloudWatch Alarms for S3
resource "aws_cloudwatch_metric_alarm" "s3_errors" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-s3-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxError"
  namespace           = "AWS/S3"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "S3 5XX errors are high"
  alarm_actions       = var.alarm_actions

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "s3_latency" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-s3-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TotalRequestLatency"
  namespace           = "AWS/S3"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "S3 request latency is high"
  alarm_actions       = var.alarm_actions

  tags = var.tags
}

# Data source for current AWS account
data "aws_caller_identity" "current" {} 