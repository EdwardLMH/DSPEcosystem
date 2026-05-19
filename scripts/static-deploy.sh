#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVIRONMENT="${1:-}"
RELEASE_TAG="${2:-}"
STATIC_BUCKET="${3:-}"
CLOUDFRONT_DISTRIBUTION_ID="${4:-}"

if [[ -z "${ENVIRONMENT}" || -z "${RELEASE_TAG}" || -z "${STATIC_BUCKET}" ]]; then
  echo "Usage: $0 <environment> <release-tag> <static-bucket> [cloudfront-distribution-id]"
  exit 1
fi

ENV_DIR="${ROOT_DIR}/infra/envs/${ENVIRONMENT}"
if [[ ! -d "${ENV_DIR}" ]]; then
  echo "Unknown environment: ${ENVIRONMENT}"
  exit 1
fi

AWS_PROFILE="$(terraform -chdir="${ENV_DIR}" output -raw aws_profile 2>/dev/null || grep -E '^aws_profile[[:space:]]*=' "${ENV_DIR}/terraform.tfvars" | sed -E 's/.*=[[:space:]]*"([^"]+)".*/\1/')"
AWS_REGION="$(terraform -chdir="${ENV_DIR}" output -raw aws_region 2>/dev/null || grep -E '^region[[:space:]]*=' "${ENV_DIR}/terraform.tfvars" | sed -E 's/.*=[[:space:]]*"([^"]+)".*/\1/')"

build_and_sync() {
  local app_dir="$1"
  local target_prefix="$2"

  echo "Building ${app_dir}"
  (cd "${ROOT_DIR}/${app_dir}" && npm ci && npm run build)

  echo "Syncing ${app_dir}/dist to s3://${STATIC_BUCKET}/${target_prefix}/${RELEASE_TAG}/"
  aws s3 sync "${ROOT_DIR}/${app_dir}/dist/" "s3://${STATIC_BUCKET}/${target_prefix}/${RELEASE_TAG}/" \
    --profile "${AWS_PROFILE}" \
    --region "${AWS_REGION}" \
    --delete

  echo "Promoting ${target_prefix}/current"
  aws s3 sync "s3://${STATIC_BUCKET}/${target_prefix}/${RELEASE_TAG}/" "s3://${STATIC_BUCKET}/${target_prefix}/current/" \
    --profile "${AWS_PROFILE}" \
    --region "${AWS_REGION}" \
    --delete
}

build_and_sync "ocdp-console" "ocdp-console"
build_and_sync "ucp-console" "ucp-console"
build_and_sync "web-sdui" "web-sdui"

if [[ -n "${CLOUDFRONT_DISTRIBUTION_ID}" ]]; then
  echo "Invalidating CloudFront ${CLOUDFRONT_DISTRIBUTION_ID}"
  aws cloudfront create-invalidation \
    --profile "${AWS_PROFILE}" \
    --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
    --paths "/ocdp-console/current/*" "/ucp-console/current/*" "/web-sdui/current/*"
fi

