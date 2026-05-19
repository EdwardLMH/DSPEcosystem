#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVIRONMENT="${1:-}"
ACTION="${2:-plan}"

if [[ -z "${ENVIRONMENT}" ]]; then
  echo "Usage: $0 <environment> [init|fmt|validate|plan|apply|destroy|output]"
  echo
  echo "Environments:"
  find "${ROOT_DIR}/infra/envs" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort
  exit 1
fi

ENV_DIR="${ROOT_DIR}/infra/envs/${ENVIRONMENT}"
if [[ ! -d "${ENV_DIR}" ]]; then
  echo "Unknown environment: ${ENVIRONMENT}"
  exit 1
fi

cd "${ENV_DIR}"

if [[ "${ACTION}" =~ ^(plan|apply)$ && ! -f terraform.tfvars && -f terraform.tfvars.example ]]; then
  echo "terraform.tfvars is missing for ${ENVIRONMENT}."
  echo "Create it from infra/envs/${ENVIRONMENT}/terraform.tfvars.example and fill account/domain values."
  exit 1
fi

case "${ACTION}" in
  init)
    terraform init
    ;;
  fmt)
    terraform fmt -recursive "${ROOT_DIR}/infra"
    ;;
  validate)
    if [[ ! -d .terraform ]]; then
      terraform init -backend=false
    fi
    terraform validate
    ;;
  plan)
    terraform init
    terraform plan -out "tfplan-${ENVIRONMENT}.bin"
    ;;
  apply)
    terraform init
    terraform apply "tfplan-${ENVIRONMENT}.bin"
    ;;
  destroy)
    echo "Refusing to destroy without explicit confirmation."
    echo "Run: terraform -chdir=${ENV_DIR} destroy"
    exit 2
    ;;
  output)
    terraform output
    ;;
  *)
    echo "Unknown action: ${ACTION}"
    exit 1
    ;;
esac
