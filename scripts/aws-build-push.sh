#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVIRONMENT="${1:-}"
IMAGE_TAG="${2:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"

if [[ -z "${ENVIRONMENT}" ]]; then
  echo "Usage: $0 <environment> [image-tag]"
  exit 1
fi

ENV_DIR="${ROOT_DIR}/infra/envs/${ENVIRONMENT}"
if [[ ! -d "${ENV_DIR}" ]]; then
  echo "Unknown environment: ${ENVIRONMENT}"
  exit 1
fi

if [[ ! -f "${ENV_DIR}/terraform.tfvars" ]]; then
  echo "terraform.tfvars is missing for ${ENVIRONMENT}."
  exit 1
fi

cd "${ENV_DIR}"

AWS_PROFILE="$(terraform output -raw aws_profile 2>/dev/null || true)"
if [[ -z "${AWS_PROFILE}" ]]; then
  AWS_PROFILE="$(grep -E '^aws_profile[[:space:]]*=' terraform.tfvars | sed -E 's/.*=[[:space:]]*"([^"]+)".*/\1/')"
fi

AWS_REGION="$(grep -E '^region[[:space:]]*=' terraform.tfvars | sed -E 's/.*=[[:space:]]*"([^"]+)".*/\1/')"
AWS_ACCOUNT_ID="$(aws sts get-caller-identity --profile "${AWS_PROFILE}" --query Account --output text)"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

aws ecr get-login-password --profile "${AWS_PROFILE}" --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

declare -A SERVICES=(
  ["bff-java"]="bff-java"
  ["ocdp-console"]="ocdp-console"
  ["ucp-console"]="ucp-console"
  ["web-sdui"]="web-sdui"
  ["dap-python"]="dap-python"
)

for service in "${!SERVICES[@]}"; do
  context="${ROOT_DIR}/${SERVICES[$service]}"
  dockerfile="${context}/Dockerfile"
  repo="${ECR_REGISTRY}/hsbc-dsp/${service}"

  if [[ ! -f "${dockerfile}" ]]; then
    echo "Skipping ${service}: no Dockerfile at ${dockerfile}"
    continue
  fi

  echo "Building ${service}:${IMAGE_TAG}"
  docker build -t "${repo}:${IMAGE_TAG}" "${context}"
  docker push "${repo}:${IMAGE_TAG}"
done

echo "Pushed available service images with tag: ${IMAGE_TAG}"

