#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:4000}"
APP_ID="${2:-harmonynext}"

require_json_field() {
  local json="$1"
  local script="$2"
  node -e "const j=JSON.parse(process.argv[1]); ${script}" "${json}"
}

echo "[synthetic] Base URL: ${BASE_URL}"

echo "[synthetic] home hub JSON"
HOME_JSON="$(curl -sS "${BASE_URL}/api/v1/screen/home-hub-hk" -H 'x-platform: web' -H 'x-market: HK')"
require_json_field "${HOME_JSON}" "if ((j.layout?.children?.[0]?.type)!=='HOME_SEARCH_HEADER') { console.error('HOME_SEARCH_HEADER missing'); process.exit(1); }"

echo "[synthetic] AI search eligible Premier wealth profile"
SEARCH_ELIGIBLE="$(curl -sS -X POST "${BASE_URL}/api/v1/search" \
  -H 'Content-Type: application/json' \
  -d "{\"query\":\"wealth studio video\",\"appId\":\"${APP_ID}\",\"responseMode\":\"a2ui\",\"customerSegment\":\"premier\",\"accountType\":\"wealth_account\",\"customerLocation\":\"HK\",\"synthetic\":true,\"probeId\":\"syn-search-premier\"}")"
require_json_field "${SEARCH_ELIGIBLE}" "const n=j.totalMatched ?? j.a2ui?.components?.length ?? 0; if (n < 1) { console.error('eligible search returned no results'); process.exit(1); }"

echo "[synthetic] AI search ineligible mass/current profile"
SEARCH_INELIGIBLE="$(curl -sS -X POST "${BASE_URL}/api/v1/search" \
  -H 'Content-Type: application/json' \
  -d "{\"query\":\"wealth studio video\",\"appId\":\"${APP_ID}\",\"responseMode\":\"a2ui\",\"customerSegment\":\"mass\",\"accountType\":\"current_account\",\"customerLocation\":\"HK\",\"synthetic\":true,\"probeId\":\"syn-search-ineligible\"}")"
require_json_field "${SEARCH_INELIGIBLE}" "const comps=j.a2ui?.components ?? []; const restricted=comps.some(c => c.content?.assetType==='video' && /Premier|Elite|Wealth Studio/i.test(c.content?.title || '')); if (restricted) { console.error('restricted asset leaked to ineligible profile'); process.exit(1); }"

echo "[synthetic] KYC start"
KYC_JSON="$(curl -sS -X POST "${BASE_URL}/api/v1/kyc/sessions/start" -H 'Content-Type: application/json' -d '{"platform":"web","synthetic":true,"probeId":"syn-kyc-start"}')"
require_json_field "${KYC_JSON}" "if (!(j.sessionId || j.session_id || j.id)) { console.error('KYC session id missing'); process.exit(1); }"

echo "[synthetic] FX viewpoint JSON"
FX_JSON="$(curl -sS "${BASE_URL}/api/v1/screen/fx-viewpoint-hk" -H 'x-platform: web' -H 'x-market: HK')"
require_json_field "${FX_JSON}" "const children=j.layout?.children ?? []; if (!children.some(c => c.type==='VIDEO_PLAYER')) { console.error('VIDEO_PLAYER missing'); process.exit(1); }"

echo "[synthetic] all checks passed"

