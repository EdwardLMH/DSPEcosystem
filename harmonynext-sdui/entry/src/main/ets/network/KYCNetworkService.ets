// KYCNetworkService.ets
// HTTP client for HSBC KYC BFF — HarmonyNext ArkTS

import http from '@ohos.net.http'
import { KYCState, StartSessionResponse, SDUIScreenPayload, SubmitRequest, SubmitResponse } from '../models/SDUIModels'

// DevEco emulator loopback to host (HarmonyNext dev machine) mock BFF on port 4000
const BASE_URL = 'http://10.0.2.2:4000/api/v1'

async function doRequest<T>(
  method: http.RequestMethod,
  path: string,
  headers: Record<string, string>,
  body?: string
): Promise<T> {
  const client = http.createHttp()

  // FIX: was '...headers' spread inside object literal — arkts-no-spread.
  // ArkTS forbids spread in object literals. Build the merged header Record explicitly.
  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
  // FIX: 'for...in' is forbidden in ArkTS (arkts-no-for-in).
  // Object.keys() returns string[] and is legal on a typed Record parameter.
  Object.keys(headers).forEach((k: string) => {
    mergedHeaders[k] = headers[k]
  })

  const resp = await client.request(BASE_URL + path, {
    method,
    header: mergedHeaders,
    extraData: body
  })
  client.destroy()
  if (typeof resp.result === 'string') {
    // FIX: 'as T' on a generic type-param is allowed in ArkTS when the source is ESObject/string.
    // JSON.parse returns ESObject in ArkTS; the cast is valid.
    return JSON.parse(resp.result) as T
  }
  throw new Error(`HTTP ${resp.responseCode}: unexpected response`)
}

// FIX: removed default-value `headers: Record<string, string> = {}` parameter —
// ArkTS allows default values on typed params, so that was fine. But we removed the
// spread inside the function body above. The empty-object default on the headers param
// is kept because it is a named typed param (not a destructured param), which is legal.

export async function startSession(platform: string): Promise<StartSessionResponse> {
  return doRequest<StartSessionResponse>(
    http.RequestMethod.POST,
    '/kyc/sessions/start',
    { 'x-platform': platform },
    JSON.stringify({ journeyType: 'PERSONAL_ACCOUNT_OPENING', market: 'HK' })
  )
}

export async function resume(sessionId: string, platform: string): Promise<SDUIScreenPayload> {
  return doRequest<SDUIScreenPayload>(
    http.RequestMethod.GET,
    `/kyc/sessions/${sessionId}/resume`,
    { 'x-platform': platform, 'x-sdui-version': '2.3' }
  )
}

export async function getStep(sessionId: string, stepId: string, platform: string): Promise<SDUIScreenPayload> {
  return doRequest<SDUIScreenPayload>(
    http.RequestMethod.GET,
    `/kyc/sessions/${sessionId}/steps/${stepId}`,
    { 'x-platform': platform, 'x-sdui-version': '2.3' }
  )
}

export async function submitStep(sessionId: string, stepId: string, req: SubmitRequest): Promise<SubmitResponse> {
  return doRequest<SubmitResponse>(
    http.RequestMethod.POST,
    `/kyc/sessions/${sessionId}/steps/${stepId}/submit`,
    {},
    JSON.stringify(req)
  )
}

// ─── Wealth Hub SDUI delivery ──────────────────────────────────────────────────
// Returns the published SDUI layout for the Home Wealth Hub HK page.
// Throws if no LIVE page has been published yet (BFF returns 404).

export interface WealthSlice {
  instanceId: string
  type: string
  props: Record<string, ESObject>
  visible: boolean
}

export interface WealthScreenPayload {
  schemaVersion: string
  screen: string
  ttl: number
  metadata: Record<string, ESObject>
  layout: {
    type: string
    children: WealthSlice[]
  }
}

export async function fetchWealthScreen(): Promise<WealthScreenPayload> {
  const client = http.createHttp()
  const resp = await client.request(BASE_URL + '/screen/home-wealth-hk', {
    method: http.RequestMethod.GET,
    header: { 'Accept': 'application/json' }
  })
  client.destroy()
  if (typeof resp.result === 'string') {
    return JSON.parse(resp.result) as WealthScreenPayload
  }
  throw new Error(`fetchWealthScreen: unexpected response type`)
}
