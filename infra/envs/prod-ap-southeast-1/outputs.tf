output "platform" {
  value = module.platform
}

output "aws_profile" {
  value = var.aws_profile
}

output "aws_region" {
  value = var.region
}

output "eks_cluster_name" {
  value = module.platform.eks_cluster_name
}
