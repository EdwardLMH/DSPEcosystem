# Jenkins CI/CD Cookbook — DSPE Services

**Date:** 2026-05-20  
**Scope:** Jenkins pipeline for validating, building, deploying, restarting and switching DSPE services across AWS overseas environments and mainland China IKP/Alicloud/Tencent environments.

---

## 1. What the Pipeline Deploys

The root `Jenkinsfile` supports these repo surfaces:

| Surface | Validation | Deployment mode |
|---------|------------|-----------------|
| `mock-bff` | Node syntax check | Container rollout when a Dockerfile/manifests are added |
| `ocdp-console` | `npm ci && npm run build` | Static S3/CloudFront deploy and optional K8s rollout |
| `ucp-console` | `npm ci && npm run build` | Static S3/CloudFront deploy and optional K8s rollout |
| `web-sdui` | `npm ci && npm run build` | Static S3/CloudFront deploy and optional K8s rollout |
| `android-sdui` | `./gradlew :app:compileDebugKotlin` | Build validation only |
| `bff-java` / `dap-python` | Image build hook through `scripts/aws-build-push.sh` once Dockerfiles exist | EKS rollout |

The current repo has AWS/Terraform scaffolding and ECR repositories but no checked-in Dockerfiles. The AWS image stage therefore skips services without Dockerfiles; static bundle deployment works for the React apps.

For mainland China, the same Jenkinsfile calls `scripts/china-deploy.sh` so runtime deployment goes to IKP, private authoring remains in Alicloud, and static artifacts publish to Tencent COS/CDN.

---

## 2. Jenkins Requirements

Install Jenkins agents with:

- Node.js 20+
- npm
- JDK 17
- Gradle or working project Gradle wrapper fallback
- Docker CLI and daemon access, if building images
- AWS CLI v2
- Terraform 1.6+
- kubectl
- China deployment tools used by the enterprise environment, such as `coscli` or Tencent Cloud CLI for COS/CDN publishing
- Network access to IKP kube contexts and Alicloud private authoring endpoints for `testing-cn` and `prod-cn`

Jenkins must have AWS access that can:

- read/write the Terraform backend
- run Terraform for `infra/envs/*`
- push ECR images
- update EKS kubeconfig and deployments
- sync S3 static artifacts
- create CloudFront invalidations
- update Route 53 records for site switch

Use short-lived IAM role assumption where possible. Avoid storing long-lived AWS keys in jobs.

For mainland China, Jenkins must use China-resident credentials and runners where required by policy. It must be able to:

- apply IKP runtime manifests for Kong external and SDUI API
- publish approved static bundles to Tencent COS
- purge Tencent CDN after publish
- reach private Alicloud UCP/OCDP/CMS health endpoints from an approved private network
- avoid exporting user-level logs, traces or behavioural events outside mainland China

---

## 3. Files Added

| File | Purpose |
|------|---------|
| `Jenkinsfile` | Parameterized CI/CD pipeline |
| `scripts/k8s-rollout.sh` | EKS deployment image update, restart and rollout status |
| `scripts/static-deploy.sh` | Build OCDP/UCP/Web SDUI and sync static bundles to S3 |
| `scripts/site-switch.sh` | Route 53 CNAME switch between primary and secondary site targets |
| `scripts/china-deploy.sh` | Mainland China validate, IKP apply and Tencent COS/CDN publish helper |

---

## 4. Jenkins Job Parameters

| Parameter | Example | Meaning |
|-----------|---------|---------|
| `TARGET_PLATFORM` | `aws` or `mainland-china` | Selects the overseas AWS path or the mainland China IKP/Alicloud/Tencent path |
| `TARGET_ENV` | `testing-ap-east-1`, `testing-cn` | AWS Terraform/EKS environment under `infra/envs`, or China environment under `infra/china/envs` |
| `ACTION` | `deploy` | AWS actions: `deploy`, `restart`, `site-switch`, `terraform-plan`, `terraform-apply`, `build-only`; China actions: `china-validate`, `china-plan`, `china-apply-runtime`, `china-publish-static`, or `deploy` |
| `IMAGE_TAG` | `v2026.05.20-001` | Image/static release tag; empty uses Git short SHA |
| `SERVICES` | `bff-java,ocdp-console,ucp-console,web-sdui` | Services for rollout/restart |
| `STATIC_BUCKET` | `hsbc-dsp-testing-static` | S3 bucket for static bundles |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E123...` | Optional distribution invalidation |
| `ROUTE53_HOSTED_ZONE_ID` | `Z123...` | Hosted zone for site switch |
| `SWITCH_RECORD_NAME` | `sdui.example.com` | CNAME record to update |
| `SWITCH_PRIMARY_DNS` | `primary-alb.example.com` | Primary target |
| `SWITCH_SECONDARY_DNS` | `secondary-alb.example.com` | Secondary target |
| `SWITCH_TARGET` | `secondary` | Target to switch to |
| `REQUIRE_PROD_APPROVAL` | `true` | Manual gate for production operations |

---

## 5. Typical Flows

### Validate a Pull Request

Run with:

```text
TARGET_PLATFORM=aws
ACTION=build-only
TARGET_ENV=testing-ap-east-1
```

This runs syntax/build checks and tries to build/push available Docker images. Services without Dockerfiles are skipped by `scripts/aws-build-push.sh`.

### Deploy to Testing HK

```text
TARGET_PLATFORM=aws
ACTION=deploy
TARGET_ENV=testing-ap-east-1
STATIC_BUCKET=<testing-static-bucket>
CLOUDFRONT_DISTRIBUTION_ID=<optional>
SERVICES=bff-java,ocdp-console,ucp-console,web-sdui
```

Pipeline stages:

1. Validate code.
2. Terraform plan.
3. Build/push images where Dockerfiles exist.
4. Build and sync static bundles to S3.
5. Roll EKS deployments that already exist.

### Restart Services

```text
TARGET_PLATFORM=aws
ACTION=restart
TARGET_ENV=testing-ap-east-1
SERVICES=bff-java,ocdp-console,ucp-console
```

Runs:

```bash
./scripts/k8s-rollout.sh testing-ap-east-1 <tag> bff-java,ocdp-console,ucp-console restart
```

### Terraform Apply

```text
TARGET_PLATFORM=aws
ACTION=terraform-apply
TARGET_ENV=testing-ap-east-1
```

Runs `scripts/aws-deploy.sh <env> plan`, then `apply`. Production applies require manual approval if `REQUIRE_PROD_APPROVAL=true`.

### Site Switch

```text
TARGET_PLATFORM=aws
ACTION=site-switch
TARGET_ENV=prod-ap-east-1
ROUTE53_HOSTED_ZONE_ID=Z123...
SWITCH_RECORD_NAME=sdui.example.com
SWITCH_PRIMARY_DNS=primary-runtime.example.com
SWITCH_SECONDARY_DNS=secondary-runtime.example.com
SWITCH_TARGET=secondary
```

The script upserts a short-TTL CNAME. For production CloudFront/ALB alias records, replace the CNAME payload in `scripts/site-switch.sh` with Route 53 `AliasTarget` once final hosted-zone IDs are known.

### Mainland China Validate

```text
TARGET_PLATFORM=mainland-china
ACTION=china-validate
TARGET_ENV=testing-cn
```

Runs `scripts/china-deploy.sh testing-cn validate` and verifies the required environment variables in `infra/china/envs/testing-cn/mainland.env`.

### Mainland China Deploy

```text
TARGET_PLATFORM=mainland-china
ACTION=deploy
TARGET_ENV=testing-cn
SERVICES=bff-java,ocdp-console,ucp-console,web-sdui
```

Pipeline stages:

1. Validate shared code for Web, OCDP, UCP, Android and mock-BFF.
2. Run the China deployment plan from `scripts/china-deploy.sh`.
3. Apply IKP runtime manifests for Kong external and SDUI API.
4. Publish Web/OCDP/UCP static bundles to Tencent COS and purge CDN according to `mainland.env`.

`prod-cn` uses the same flow with the production approval gate enabled.

### Mainland China Runtime Only

```text
TARGET_PLATFORM=mainland-china
ACTION=china-apply-runtime
TARGET_ENV=prod-cn
```

Use this when only IKP runtime routing, Kong or SDUI API manifests need to be refreshed.

### Mainland China Static Publish Only

```text
TARGET_PLATFORM=mainland-china
ACTION=china-publish-static
TARGET_ENV=prod-cn
```

Use this when approved SDUI/Web/OCDP/UCP bundles need to be republished to Tencent COS/CDN without changing IKP runtime manifests.

---

## 6. EKS Naming Assumptions

`scripts/k8s-rollout.sh` expects these deployment names:

| Service | Namespace | Deployment |
|---------|-----------|------------|
| `bff-java` | `sdui-public` | `bff-java` |
| `web-sdui` | `sdui-public` | `web-sdui` |
| `ocdp-console` | `cms-staff` | `ocdp-console` |
| `ucp-console` | `cms-staff` | `ucp-console` |
| `dap-python` | `dap` | `dap-python` |

If your Kubernetes manifests use different names, update the `namespace_for_service` and `deployment_for_service` functions in `scripts/k8s-rollout.sh`.

---

## 7. Static Bundle Layout

`scripts/static-deploy.sh` publishes:

```text
s3://<STATIC_BUCKET>/ocdp-console/<release-tag>/
s3://<STATIC_BUCKET>/ocdp-console/current/
s3://<STATIC_BUCKET>/ucp-console/<release-tag>/
s3://<STATIC_BUCKET>/ucp-console/current/
s3://<STATIC_BUCKET>/web-sdui/<release-tag>/
s3://<STATIC_BUCKET>/web-sdui/current/
```

CloudFront invalidates:

```text
/ocdp-console/current/*
/ucp-console/current/*
/web-sdui/current/*
```

---

## 8. Rollback

Static rollback:

```bash
aws s3 sync s3://<bucket>/web-sdui/<old-tag>/ s3://<bucket>/web-sdui/current/ --delete
aws cloudfront create-invalidation --distribution-id <id> --paths "/web-sdui/current/*"
```

Kubernetes rollback:

```bash
kubectl -n sdui-public rollout undo deployment/bff-java
kubectl -n sdui-public rollout status deployment/bff-java
```

Site switch rollback:

```bash
./scripts/site-switch.sh prod-ap-east-1 <zone-id> sdui.example.com <primary-dns> <secondary-dns> primary
```

Mainland China rollback:

```bash
./scripts/china-deploy.sh prod-cn plan
kubectl --context <ikp-context> -n sdui-public rollout undo deployment/sdui-api
kubectl --context <ikp-context> -n sdui-public rollout status deployment/sdui-api
```

For COS static rollback, republish the previously approved release folder to the current alias and purge Tencent CDN. Keep this action inside the China-resident deployment runner.

---

## 9. Safety Notes

- Keep `REQUIRE_PROD_APPROVAL=true` for production.
- Do not commit real `terraform.tfvars` values or AWS secrets.
- Do not commit real `mainland.env` values, COS credentials, IKP kubeconfigs or Alicloud private credentials.
- Confirm `terraform plan` before `terraform-apply`.
- Start with `testing-ap-east-1`, then rehearse `testing-ap-southeast-1` before production.
- For mainland China, start with `testing-cn`, then rehearse IKP ZHJ/NHC failover and private Alicloud authoring health checks before `prod-cn`.
- Prefer immutable release tags and avoid mutable `latest`.
