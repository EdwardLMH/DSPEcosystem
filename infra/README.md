# AWS Deployment IaC

Terraform scaffold for deploying the DSP SDUI ecosystem into AWS Testing and Production.

## Environments

| Environment | Region | Usable AZs | Purpose |
|-------------|--------|------------|---------|
| `testing-ap-east-1` | Hong Kong | 2 | First testing stack and primary service region |
| `testing-ap-southeast-1` | Singapore | 1 | Optional SDUI runtime tertiary cell |
| `prod-ap-east-1` | Hong Kong | 2 | Production primary service region |
| `prod-ap-southeast-1` | Singapore | 1 | Production SDUI runtime tertiary cell |

## Prerequisites

- Terraform `>= 1.6`
- AWS CLI configured with a profile that can assume the target deployment role
- AWS account IDs, DNS zone IDs, and ACM certificate ARNs filled in each `terraform.tfvars`

## Usage

```bash
# 1. Copy the example variables first
cp infra/envs/testing-ap-east-1/terraform.tfvars.example infra/envs/testing-ap-east-1/terraform.tfvars

# 2. Edit terraform.tfvars with your AWS profile, domains and tags

# Plan testing HK
./scripts/aws-deploy.sh testing-ap-east-1 plan

# Apply testing HK
./scripts/aws-deploy.sh testing-ap-east-1 apply

# Configure kubectl after EKS is created
./scripts/aws-kubeconfig.sh testing-ap-east-1

# Build and push service images that have Dockerfiles
./scripts/aws-build-push.sh testing-ap-east-1 v0.1.0

# Plan production HK
./scripts/aws-deploy.sh prod-ap-east-1 plan
```

The scaffold intentionally keeps account IDs, DNS names, and certificate ARNs as variables. Do not commit real production secrets.

## Deployment Order

1. Testing HK: `testing-ap-east-1`
2. Optional Testing SG DR rehearsal: `testing-ap-southeast-1`
3. Production HK region: `prod-ap-east-1`
4. Production SG region: `prod-ap-southeast-1`

UCP and OCDP staff functions run inside Hong Kong across the two usable HK Availability Zones as `single-site`, `hot-warm`, or `hot-hot`. SDUI runtime delivery is more critical and can run as `single-site`, `hot-warm-warm`, or `hot-hot-hot` across HK AZ1, HK AZ2 and SG AZ1. Hong Kong `ap-east-1` remains the primary service region. Mobile, Web and WeChat clients call the same SDUI FQDN regardless of which runtime cell serves the request.

## Deployment Modes

Set these in each environment `terraform.tfvars`:

```hcl
deployment_mode = "single-site" # single-site | hot-warm | hot-hot
sdui_runtime_mode = "single-site" # single-site | hot-warm-warm | hot-hot-hot
regional_role   = "active"      # active | warm | disabled
primary_region  = "ap-east-1"   # Hong Kong primary
```

| Mode | Applies to | Use case |
|------|------------|----------|
| `single-site` | UCP/OCDP and SDUI | Lowest-cost testing |
| `hot-warm` | UCP/OCDP | HK AZ1 active plus HK AZ2 warm standby |
| `hot-hot` | UCP/OCDP | HK AZ1 and HK AZ2 active staff cells |
| `hot-warm-warm` | SDUI | HK AZ1 active, HK AZ2 warm, SG AZ1 warm last-choice failover |
| `hot-hot-hot` | SDUI | HK AZ1, HK AZ2 and SG AZ1 all serving with HK preferred |

## What This Creates

| Layer | Resources |
|-------|-----------|
| Network | VPC, public subnets, private app subnets, private data subnets, NAT, S3 endpoint |
| Compute | EKS cluster, managed node group, ECR repositories |
| Storage | S3 buckets for media, SDUI JSON, DAP and logs |
| Data | Aurora PostgreSQL Serverless v2, ElastiCache Redis |
| Gateway | Kong external and internal gateway placeholders/policy target |
| Security | Security groups, KMS-backed ECR, S3 encryption, regional WAF skeleton, Kong API policy layer |

## Notes Before First Apply

- Install Terraform locally or run these scripts from CI.
- Create AWS CLI profiles matching each `terraform.tfvars` file.
- For team state, uncomment the S3 backend block and create the backend bucket plus DynamoDB lock table before `terraform init`.
- CloudFront aliases require an ACM certificate in `us-east-1`; regional ALB certificates should be added when ingress manifests are introduced.
- Public APIs should be routed CloudFront/WAF → public ALB → Kong external → upstream services.
- Staff/internal APIs should be routed staff network/VPN/ZTNA → internal ALB → Kong internal → upstream services.
