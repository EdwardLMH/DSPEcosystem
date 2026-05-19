#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVIRONMENT="${1:-}"
ACTION="${2:-plan}"

if [[ -z "${ENVIRONMENT}" ]]; then
  echo "Usage: $0 <environment> [validate|plan|apply-runtime|publish-static]"
  echo
  echo "Environments:"
  find "${ROOT_DIR}/infra/china/envs" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort
  exit 1
fi

ENV_DIR="${ROOT_DIR}/infra/china/envs/${ENVIRONMENT}"
ENV_FILE="${ENV_DIR}/mainland.env"
ENV_EXAMPLE="${ENV_DIR}/mainland.env.example"

if [[ ! -d "${ENV_DIR}" ]]; then
  echo "Unknown China environment: ${ENVIRONMENT}"
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "mainland.env is missing for ${ENVIRONMENT}."
  echo "Create it from infra/china/envs/${ENVIRONMENT}/mainland.env.example and fill environment values."
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "${ENV_FILE}"
set +a

required_vars=(
  ENVIRONMENT
  CN_SDUI_RUNTIME_MODE
  CN_AUTHORING_MODE
  IKP_PRIMARY_CONTEXT
  IKP_SECONDARY_CONTEXT
  CN_SDUI_STATIC_FQDN
  CN_SDUI_API_FQDN
  TENCENT_COS_BUCKET
  TENCENT_COS_REGION
  TENCENT_CDN_DOMAIN
  STATIC_ARTIFACT_DIR
  STATIC_HTML_DIR
  SDUI_API_IMAGE
  KONG_IMAGE
)

validate_env() {
  local missing=0
  for var_name in "${required_vars[@]}"; do
    if [[ -z "${!var_name:-}" ]]; then
      echo "Missing required variable: ${var_name}"
      missing=1
    fi
  done

  case "${CN_SDUI_RUNTIME_MODE}" in
    single-site|hot-warm|hot-hot) ;;
    *)
      echo "Invalid CN_SDUI_RUNTIME_MODE: ${CN_SDUI_RUNTIME_MODE}"
      missing=1
      ;;
  esac

  case "${CN_AUTHORING_MODE}" in
    single-site|hot-warm|hot-hot) ;;
    *)
      echo "Invalid CN_AUTHORING_MODE: ${CN_AUTHORING_MODE}"
      missing=1
      ;;
  esac

  if [[ "${missing}" -ne 0 ]]; then
    exit 1
  fi
}

print_plan() {
  validate_env
  echo "Mainland China deployment plan"
  echo "Environment:        ${ENVIRONMENT}"
  echo "Runtime mode:       ${CN_SDUI_RUNTIME_MODE}"
  echo "Authoring mode:     ${CN_AUTHORING_MODE}"
  echo "Primary IKP site:   ${IKP_PRIMARY_SITE:-ZHJ} (${IKP_PRIMARY_CONTEXT})"
  echo "Secondary IKP site: ${IKP_SECONDARY_SITE:-NHC} (${IKP_SECONDARY_CONTEXT})"
  echo "Static FQDN:        https://${CN_SDUI_STATIC_FQDN}"
  echo "API FQDN:           https://${CN_SDUI_API_FQDN}"
  echo "Tencent COS:        cos://${TENCENT_COS_BUCKET} (${TENCENT_COS_REGION})"
  echo "Tencent CDN:        ${TENCENT_CDN_DOMAIN}"
  echo
  echo "Runtime apply will deploy:"
  echo "- gateway-public/kong-external"
  echo "- sdui-public/sdui-api"
  echo
  echo "Static publish will upload:"
  echo "- ${STATIC_ARTIFACT_DIR}"
  echo "- ${STATIC_HTML_DIR}"
}

apply_runtime_to_context() {
  local context="$1"
  local site="$2"

  echo "Applying IKP runtime manifests to ${site}: ${context}"
  kubectl --context "${context}" apply -k "${ROOT_DIR}/infra/china/k8s/runtime/base"
  kubectl --context "${context}" -n gateway-public set image deployment/kong-external "kong=${KONG_IMAGE}"
  kubectl --context "${context}" -n sdui-public set image deployment/sdui-api "sdui-api=${SDUI_API_IMAGE}"
}

apply_runtime() {
  validate_env
  if ! command -v kubectl >/dev/null 2>&1; then
    echo "kubectl is required for apply-runtime."
    exit 1
  fi

  apply_runtime_to_context "${IKP_PRIMARY_CONTEXT}" "${IKP_PRIMARY_SITE:-ZHJ}"

  case "${CN_SDUI_RUNTIME_MODE}" in
    single-site)
      echo "Runtime mode is single-site; skipping secondary IKP site."
      ;;
    hot-warm|hot-hot)
      apply_runtime_to_context "${IKP_SECONDARY_CONTEXT}" "${IKP_SECONDARY_SITE:-NHC}"
      ;;
  esac
}

publish_static() {
  validate_env
  local artifact_dir="${ROOT_DIR}/${STATIC_ARTIFACT_DIR}"
  local html_dir="${ROOT_DIR}/${STATIC_HTML_DIR}"

  if [[ ! -d "${artifact_dir}" ]]; then
    echo "Static artifact directory not found: ${artifact_dir}"
    exit 1
  fi

  if [[ ! -d "${html_dir}" ]]; then
    echo "Static HTML directory not found: ${html_dir}"
    exit 1
  fi

  if command -v coscli >/dev/null 2>&1; then
    coscli cp -r "${artifact_dir}" "cos://${TENCENT_COS_BUCKET}/sdui/${ENVIRONMENT}/"
    coscli cp -r "${html_dir}" "cos://${TENCENT_COS_BUCKET}/web/${ENVIRONMENT}/"
  elif command -v tccli >/dev/null 2>&1; then
    echo "tccli is installed, but recursive COS upload is team-specific."
    echo "Configure a CI upload task for ${artifact_dir} and ${html_dir} to bucket ${TENCENT_COS_BUCKET}."
  else
    echo "Install coscli or provide a CI upload task to publish static artifacts to Tencent COS."
    exit 1
  fi

  if command -v tccli >/dev/null 2>&1; then
    tccli cdn PurgePathCache --Paths "https://${TENCENT_CDN_DOMAIN}/sdui/${ENVIRONMENT}/" "https://${TENCENT_CDN_DOMAIN}/web/${ENVIRONMENT}/" --FlushType flush
  else
    echo "tccli not found; please purge Tencent CDN paths for ${TENCENT_CDN_DOMAIN} from the console or CI."
  fi
}

case "${ACTION}" in
  validate)
    validate_env
    echo "China environment ${ENVIRONMENT} is valid."
    ;;
  plan)
    print_plan
    ;;
  apply-runtime)
    apply_runtime
    ;;
  publish-static)
    publish_static
    ;;
  *)
    echo "Unknown action: ${ACTION}"
    exit 1
    ;;
esac
