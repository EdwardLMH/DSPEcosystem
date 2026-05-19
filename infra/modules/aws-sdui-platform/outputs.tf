output "vpc_id" {
  value = aws_vpc.this.id
}

output "private_app_subnet_ids" {
  value = aws_subnet.private_app[*].id
}

output "private_data_subnet_ids" {
  value = aws_subnet.private_data[*].id
}

output "eks_cluster_name" {
  value = aws_eks_cluster.this.name
}

output "eks_cluster_endpoint" {
  value = aws_eks_cluster.this.endpoint
}

output "ecr_repositories" {
  value = { for key, repo in aws_ecr_repository.repos : key => repo.repository_url }
}

output "media_bucket" {
  value = aws_s3_bucket.media.bucket
}

output "sdui_bucket" {
  value = aws_s3_bucket.sdui.bucket
}

output "dap_bucket" {
  value = aws_s3_bucket.dap.bucket
}

output "aurora_endpoint" {
  value = aws_rds_cluster.aurora.endpoint
}

output "redis_primary_endpoint" {
  value = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "service_fqdns" {
  value = {
    sdui = coalesce(var.sdui_fqdn, var.public_domain_name)
    ocdp = var.ocdp_fqdn
    ucp  = var.ucp_fqdn
    dap  = var.dap_fqdn
  }
}

output "deployment_mode" {
  value = var.deployment_mode
}

output "sdui_runtime_mode" {
  value = var.sdui_runtime_mode
}

output "regional_role" {
  value = var.regional_role
}

output "primary_region" {
  value = var.primary_region
}
