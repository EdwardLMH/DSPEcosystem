variable "aws_profile" {
  type    = string
  default = "dsp-prod-sg"
}

variable "project" {
  type    = string
  default = "hsbc-dsp"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "region" {
  type    = string
  default = "ap-southeast-1"
}

variable "primary_region" {
  type    = string
  default = "ap-east-1"
}

variable "deployment_mode" {
  type    = string
  default = "single-site"
}

variable "sdui_runtime_mode" {
  type    = string
  default = "hot-hot-hot"
}

variable "regional_role" {
  type    = string
  default = "active"
}

variable "vpc_cidr" {
  type    = string
  default = "10.31.0.0/16"
}

variable "public_domain_name" {
  type    = string
  default = ""
}

variable "sdui_fqdn" {
  type    = string
  default = "sdui.example.com"
}

variable "ocdp_fqdn" {
  type    = string
  default = "ocdp.example.com"
}

variable "ucp_fqdn" {
  type    = string
  default = "ucp.example.com"
}

variable "dap_fqdn" {
  type    = string
  default = "dap.example.com"
}

variable "cloudfront_certificate_arn" {
  type    = string
  default = ""
}

variable "tags" {
  type = map(string)
  default = {
    Application = "DSP-SDUI"
    Owner       = "DigitalChannels"
    CostCenter  = "REPLACE_ME"
    DataClass   = "Confidential"
  }
}
