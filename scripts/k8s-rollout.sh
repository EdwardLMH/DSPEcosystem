#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVIRONMENT="${1:-}"
IMAGE_TAG="${2:-}"
SERVICES_CSV="${3:-bff-java,ocdp-console,ucp-console,web-sdui}"
ACTION="${4:-deploy}"

if [[ -z "${ENVIRONMENT}" || -z "${IMAGE_TAG}" ]]; then
  echo "Usage: $0 <environment> <image-tag> [services_csv] [deploy|restart|status]"
  exit 1
fi

ENV_DIR="${ROOT_DIR}/infra/envs/${ENVIRONMENT}"
if [[ ! -d "${ENV_DIR}" ]]; then
  echo "Unknown environment: ${ENVIRONMENT}"
  exit 1
fi

"${ROOT_DIR}/scripts/aws-kubeconfig.sh" "${ENVIRONMENT}"

AWS_REGION="$(terraform -chdir="${ENV_DIR}" output -raw aws_region)"
ECR_JSON="$(terraform -chdir="${ENV_DIR}" output -json platform | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const p=JSON.parse(s); console.log(JSON.stringify(p.ecr_repositories||{}));})')"

namespace_for_service() {
  case "$1" in
    bff-java|web-sdui) echo "sdui-public" ;;
    ocdp-console|ucp-console|cms-api) echo "cms-staff" ;;
    dap-python) echo "dap" ;;
    *) echo "default" ;;
  esac
}

deployment_for_service() {
  case "$1" in
    bff-java) echo "bff-java" ;;
    ocdp-console) echo "ocdp-console" ;;
    ucp-console) echo "ucp-console" ;;
    web-sdui) echo "web-sdui" ;;
    dap-python) echo "dap-python" ;;
    *) echo "$1" ;;
  esac
}

image_for_service() {
  node -e "const repos=${ECR_JSON}; const svc=process.argv[1]; if (!repos[svc]) process.exit(2); console.log(repos[svc] + ':' + process.argv[2]);" "$1" "${IMAGE_TAG}" 2>/dev/null || true
}

IFS=',' read -r -a SERVICES <<< "${SERVICES_CSV}"

for raw_service in "${SERVICES[@]}"; do
  service="$(echo "${raw_service}" | xargs)"
  [[ -z "${service}" ]] && continue
  namespace="$(namespace_for_service "${service}")"
  deployment="$(deployment_for_service "${service}")"
  image="$(image_for_service "${service}")"

  if ! kubectl -n "${namespace}" get deployment "${deployment}" >/dev/null 2>&1; then
    echo "Skipping ${service}: deployment ${namespace}/${deployment} does not exist yet."
    continue
  fi

  case "${ACTION}" in
    deploy)
      if [[ -z "${image}" ]]; then
        echo "Skipping ${service}: no ECR repository output found."
        continue
      fi
      echo "Deploying ${namespace}/${deployment} -> ${image} (${AWS_REGION})"
      kubectl -n "${namespace}" set image "deployment/${deployment}" "*=${image}"
      kubectl -n "${namespace}" rollout status "deployment/${deployment}" --timeout=5m
      ;;
    restart)
      echo "Restarting ${namespace}/${deployment}"
      kubectl -n "${namespace}" rollout restart "deployment/${deployment}"
      kubectl -n "${namespace}" rollout status "deployment/${deployment}" --timeout=5m
      ;;
    status)
      kubectl -n "${namespace}" rollout status "deployment/${deployment}" --timeout=60s
      ;;
    *)
      echo "Unknown action: ${ACTION}"
      exit 1
      ;;
  esac
done

