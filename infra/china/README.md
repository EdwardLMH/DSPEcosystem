# Mainland China Deployment Scaffold

This scaffold supports the Mainland China deployment described in `docs/16_mainland_china_infrastructure_blueprint.md`.

## Target Topology

| Plane | Location | Exposure |
|-------|----------|----------|
| Static SDUI/Web | Tencent COS behind Tencent CDN | public |
| Public SDUI API | IKP on GKE in ZHJ and NHC | public through Kong external |
| UCP/OCDP | Alicloud on-prem private cloud, two private AZs | private only |
| Analytics | SensorData China | China-resident |

## Environments

| Environment | Default runtime mode | Default authoring mode |
|-------------|----------------------|------------------------|
| `testing-cn` | `single-site` | `single-site` |
| `prod-cn` | `hot-warm` | `hot-warm` |

## Usage

```bash
# 1. Copy and edit environment values
cp infra/china/envs/testing-cn/mainland.env.example infra/china/envs/testing-cn/mainland.env

# 2. Validate local configuration
./scripts/china-deploy.sh testing-cn validate

# 3. Review the target topology
./scripts/china-deploy.sh testing-cn plan

# 4. Apply IKP runtime manifests to the kubeconfig context
./scripts/china-deploy.sh testing-cn apply-runtime

# 5. Publish generated static SDUI artifacts to Tencent COS
./scripts/china-deploy.sh testing-cn publish-static
```

Do not commit `mainland.env`; it will contain environment-specific endpoints and credential references.

## Required Local Tools

| Tool | Used for |
|------|----------|
| `kubectl` | applying IKP runtime manifests |
| `deck` | optional Kong declarative sync |
| `coscli` or `tccli` | Tencent COS uploads and CDN purge |

The script can validate and show plans without all tools installed. Runtime apply requires `kubectl`. Static publish requires either `coscli` or a team-provided CI task that performs the same upload and CDN purge.

## Files

| Path | Purpose |
|------|---------|
| `envs/*/mainland.env.example` | environment variables |
| `k8s/runtime/base` | Kong external and SDUI API Kubernetes manifests |
| `kong/kong-external.yaml` | Kong external declarative route/plugin baseline |

