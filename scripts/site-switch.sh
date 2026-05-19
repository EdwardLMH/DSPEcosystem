#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVIRONMENT="${1:-}"
HOSTED_ZONE_ID="${2:-}"
RECORD_NAME="${3:-}"
PRIMARY_DNS="${4:-}"
SECONDARY_DNS="${5:-}"
TARGET="${6:-primary}"

if [[ -z "${ENVIRONMENT}" || -z "${HOSTED_ZONE_ID}" || -z "${RECORD_NAME}" || -z "${PRIMARY_DNS}" || -z "${SECONDARY_DNS}" ]]; then
  echo "Usage: $0 <environment> <hosted-zone-id> <record-name> <primary-dns> <secondary-dns> [primary|secondary]"
  exit 1
fi

ENV_DIR="${ROOT_DIR}/infra/envs/${ENVIRONMENT}"
if [[ ! -d "${ENV_DIR}" ]]; then
  echo "Unknown environment: ${ENVIRONMENT}"
  exit 1
fi

AWS_PROFILE="$(terraform -chdir="${ENV_DIR}" output -raw aws_profile 2>/dev/null || grep -E '^aws_profile[[:space:]]*=' "${ENV_DIR}/terraform.tfvars" | sed -E 's/.*=[[:space:]]*"([^"]+)".*/\1/')"
TARGET_DNS="${PRIMARY_DNS}"
if [[ "${TARGET}" == "secondary" ]]; then
  TARGET_DNS="${SECONDARY_DNS}"
elif [[ "${TARGET}" != "primary" ]]; then
  echo "Invalid target: ${TARGET}. Expected primary or secondary."
  exit 1
fi

CHANGE_BATCH="$(mktemp)"
cat > "${CHANGE_BATCH}" <<JSON
{
  "Comment": "Jenkins site switch for ${ENVIRONMENT} to ${TARGET}",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "${RECORD_NAME}",
        "Type": "CNAME",
        "TTL": 30,
        "ResourceRecords": [
          { "Value": "${TARGET_DNS}" }
        ]
      }
    }
  ]
}
JSON

echo "Switching ${RECORD_NAME} to ${TARGET} (${TARGET_DNS})"
aws route53 change-resource-record-sets \
  --profile "${AWS_PROFILE}" \
  --hosted-zone-id "${HOSTED_ZONE_ID}" \
  --change-batch "file://${CHANGE_BATCH}"

rm -f "${CHANGE_BATCH}"

