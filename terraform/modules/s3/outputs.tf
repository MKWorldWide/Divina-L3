# S3 Module Outputs

output "static_assets_bucket_name" {
  description = "Name of the static assets bucket"
  value       = aws_s3_bucket.static_assets.bucket
}

output "static_assets_bucket_arn" {
  description = "ARN of the static assets bucket"
  value       = aws_s3_bucket.static_assets.arn
}

output "logs_bucket_name" {
  description = "Name of the logs bucket"
  value       = aws_s3_bucket.logs.bucket
}

output "logs_bucket_arn" {
  description = "ARN of the logs bucket"
  value       = aws_s3_bucket.logs.arn
}

output "backups_bucket_name" {
  description = "Name of the backups bucket"
  value       = aws_s3_bucket.backups.bucket
}

output "backups_bucket_arn" {
  description = "ARN of the backups bucket"
  value       = aws_s3_bucket.backups.arn
}

output "ai_models_bucket_name" {
  description = "Name of the AI models bucket"
  value       = aws_s3_bucket.ai_models.bucket
}

output "ai_models_bucket_arn" {
  description = "ARN of the AI models bucket"
  value       = aws_s3_bucket.ai_models.arn
}

output "game_assets_bucket_name" {
  description = "Name of the game assets bucket"
  value       = aws_s3_bucket.game_assets.bucket
}

output "game_assets_bucket_arn" {
  description = "ARN of the game assets bucket"
  value       = aws_s3_bucket.game_assets.arn
}

output "all_bucket_names" {
  description = "Map of all bucket names"
  value = {
    static_assets = aws_s3_bucket.static_assets.bucket
    logs          = aws_s3_bucket.logs.bucket
    backups       = aws_s3_bucket.backups.bucket
    ai_models     = aws_s3_bucket.ai_models.bucket
    game_assets   = aws_s3_bucket.game_assets.bucket
  }
}

output "all_bucket_arns" {
  description = "Map of all bucket ARNs"
  value = {
    static_assets = aws_s3_bucket.static_assets.arn
    logs          = aws_s3_bucket.logs.arn
    backups       = aws_s3_bucket.backups.arn
    ai_models     = aws_s3_bucket.ai_models.arn
    game_assets   = aws_s3_bucket.game_assets.arn
  }
} 