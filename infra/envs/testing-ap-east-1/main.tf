terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.90"
    }
  }

  # For team usage, uncomment and fill after creating the backend bucket/table.
  # backend "s3" {
  #   bucket         = "REPLACE_WITH_TERRAFORM_STATE_BUCKET"
  #   key            = "testing/ap-east-1/terraform.tfstate"
  #   region         = "ap-east-1"
  #   dynamodb_table = "REPLACE_WITH_TERRAFORM_LOCK_TABLE"
  #   encrypt        = true
  # }
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
  az_count                   = 2
  single_nat_gateway         = true
  node_instance_types        = ["t3.medium"]
  node_min_size              = 1
  node_desired_size          = 2
  node_max_size              = 4
  aurora_min_capacity        = 0.5
  aurora_max_capacity        = 2
  redis_node_type            = "cache.t4g.micro"
  enable_cloudfront          = true
  public_domain_name         = var.public_domain_name
  sdui_fqdn                  = var.sdui_fqdn
  ocdp_fqdn                  = var.ocdp_fqdn
  ucp_fqdn                   = var.ucp_fqdn
  dap_fqdn                   = var.dap_fqdn
  cloudfront_certificate_arn = var.cloudfront_certificate_arn
  tags                       = var.tags
}
