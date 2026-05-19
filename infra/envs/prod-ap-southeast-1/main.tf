terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.90"
    }
  }
}

provider "aws" {
  region  = var.region
  profile = var.aws_profile

  default_tags {
    tags = var.tags
  }
}

module "platform" {
  source = "../../modules/aws-sdui-platform"

  project                    = var.project
  environment                = var.environment
  region                     = var.region
  primary_region             = var.primary_region
  deployment_mode            = var.deployment_mode
  sdui_runtime_mode          = var.sdui_runtime_mode
  regional_role              = var.regional_role
  vpc_cidr                   = var.vpc_cidr
  az_count                   = 1
  single_nat_gateway         = false
  node_instance_types        = ["m6i.large"]
  node_min_size              = 2
  node_desired_size          = 2
  node_max_size              = 10
  aurora_min_capacity        = 1
  aurora_max_capacity        = 12
  redis_node_type            = "cache.r7g.large"
  enable_cloudfront          = true
  public_domain_name         = var.public_domain_name
  sdui_fqdn                  = var.sdui_fqdn
  ocdp_fqdn                  = var.ocdp_fqdn
  ucp_fqdn                   = var.ucp_fqdn
  dap_fqdn                   = var.dap_fqdn
  cloudfront_certificate_arn = var.cloudfront_certificate_arn
  tags                       = var.tags
}
