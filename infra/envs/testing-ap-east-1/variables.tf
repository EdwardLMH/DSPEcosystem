variable "aws_profile" {
  type        = string
  description = "Local AWS CLI profile used by Terraform."
  default     = "dsp-testing"
}

variable "project" {
  type    = string
  default = "hsbc-dsp"
}

variable "environment" {
  type    = string
  default = "testing"
}

variable "region" {
  type    = string
  default = "ap-east-1"
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
  default = "single-site"
}

variable "regional_role" {
  type    = string
  default = "active"
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "public_domain_name" {
  type    = string
  default = ""
}

variable "sdui_fqdn" {
  type    = string
  default = "sdui-test.example.com"
}

variable "ocdp_fqdn" {
  type    = string
  default = "ocdp-test.example.com"
}

variable "ucp_fqdn" {
  type    = string
  default = "ucp-test.example.com"
}

variable "dap_fqdn" {
  type    = string
  default = "dap-test.example.com"
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
  }
}
