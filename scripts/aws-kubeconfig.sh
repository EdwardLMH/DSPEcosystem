#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVIRONMENT="${1:-}"

if [[ -z "${ENVIRONMENT}" ]]; then
  echo "Usage: $0 <environment>"
  exit 1
fi

ENV_DIR="${ROOT_DIR}/infra/envs/${ENVIRONMENT}"
if [[ ! -d "${ENV_DIR}" ]]; then
  echo "Unknown environment: ${ENVIRONMENT}"
  exit 1
fi

cd "${ENV_DIR}"

AWS_PROFILE="$(terraform output -raw aws_profile)"
AWS_REGION="$(terraform output -raw aws_region)"
CLUSTER_NAME="$(terraform output -raw eks_cluster_name)"

aws eks update-kubeconfig \
  --profile "${AWS_PROFILE}" \
  --region "${AWS_REGION}" \
  --name "${CLUSTER_NAME}" \
  --alias "${ENVIRONMENT}"
