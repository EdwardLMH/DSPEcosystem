variable "project" {
  type        = string
  description = "Project prefix used for resource naming."
  default     = "hsbc-dsp"
}

variable "environment" {
  type        = string
  description = "Environment name, for example testing or prod."
}

variable "region" {
  type        = string
  description = "AWS region for the stack."
}

variable "primary_region" {
  type        = string
  description = "Primary service region. Hong Kong ap-east-1 should be primary for ASP AWS deployment."
  default     = "ap-east-1"
}

variable "deployment_mode" {
  type        = string
  description = "Staff-plane deployment mode for UCP/OCDP inside the primary HK region: single-site, hot-warm, or hot-hot."
  default     = "single-site"

  validation {
    condition     = contains(["single-site", "hot-warm", "hot-hot"], var.deployment_mode)
    error_message = "deployment_mode must be one of: single-site, hot-warm, hot-hot."
  }
}

variable "sdui_runtime_mode" {
  type        = string
  description = "SDUI runtime cell mode across HK AZ1, HK AZ2, and SG AZ1: single-site, hot-warm-warm, or hot-hot-hot."
  default     = "single-site"

  validation {
    condition     = contains(["single-site", "hot-warm-warm", "hot-hot-hot"], var.sdui_runtime_mode)
    error_message = "sdui_runtime_mode must be one of: single-site, hot-warm-warm, hot-hot-hot."
  }
}

variable "regional_role" {
  type        = string
  description = "Role of this regional stack in the selected mode: active, warm, or disabled."
  default     = "active"

  validation {
    condition     = contains(["active", "warm", "disabled"], var.regional_role)
    error_message = "regional_role must be one of: active, warm, disabled."
  }
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR block."
}

variable "az_count" {
  type        = number
  description = "Number of availability zones to use. HK uses 2 available zones; SG uses 1 available zone for this deployment."
  default     = 3
}

variable "single_nat_gateway" {
  type        = bool
  description = "Use one NAT Gateway. Good for testing cost control; production should use one per AZ."
  default     = false
}

variable "eks_cluster_version" {
  type        = string
  description = "EKS Kubernetes version."
  default     = "1.31"
}

variable "node_instance_types" {
  type        = list(string)
  description = "EKS managed node instance types."
  default     = ["t3.medium"]
}

variable "node_min_size" {
  type    = number
  default = 2
}

variable "node_desired_size" {
  type    = number
  default = 2
}

variable "node_max_size" {
  type    = number
  default = 6
}

variable "aurora_min_capacity" {
  type        = number
  description = "Aurora Serverless v2 min ACU."
  default     = 0.5
}

variable "aurora_max_capacity" {
  type        = number
  description = "Aurora Serverless v2 max ACU."
  default     = 4
}

variable "redis_node_type" {
  type        = string
  description = "ElastiCache Redis node type."
  default     = "cache.t4g.micro"
}

variable "enable_cloudfront" {
  type        = bool
  description = "Create CloudFront distributions for public API/static delivery."
  default     = true
}

variable "public_domain_name" {
  type        = string
  description = "Deprecated compatibility alias. Prefer sdui_fqdn, ocdp_fqdn and ucp_fqdn."
  default     = ""
}

variable "sdui_fqdn" {
  type        = string
  description = "Shared SDUI FQDN used by mobile, web and WeChat clients."
  default     = ""
}

variable "ocdp_fqdn" {
  type        = string
  description = "Shared OCDP staff console FQDN."
  default     = ""
}

variable "ucp_fqdn" {
  type        = string
  description = "Shared UCP staff console FQDN."
  default     = ""
}

variable "dap_fqdn" {
  type        = string
  description = "Shared DAP event API FQDN."
  default     = ""
}

variable "cloudfront_certificate_arn" {
  type        = string
  description = "ACM certificate ARN in us-east-1 for CloudFront. Leave empty to skip aliases."
  default     = ""
}

variable "tags" {
  type        = map(string)
  description = "Common tags."
  default     = {}
}
