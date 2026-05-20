// NetworkService.ets
// HTTP client for HSBC KYC BFF — HarmonyNext ArkTS

import http from '@ohos.net.http'
import i18n from '@ohos.i18n'
import { StartSessionResponse, SDUIScreenPayload, SubmitRequest, SubmitResponse, BFFConfig } from '../models/SDUIModels'
import { ObservabilityClient } from './ObservabilityClient'

// DevEco emulator: 10.0.2.2 is the host loopback
// Physical device: use your Mac's LAN IP (10.81.103.103)
// Toggle the comment below based on your test environment:
const BASE_URL = 'http://10.0.2.2:4000/api/v1'           // For emulator
// const BASE_URL = 'http://10.81.103.103:4000/api/v1'  // For physical device

// ─── Locale helpers ──────────────────────────────────────────────────────────

function resolveHarmonyLocale(): string {
  const systemLocale = i18n.System.getSystemLocale()  // e.g. "zh-Hant-HK", "en-GB"
  const lower = systemLocale.toLowerCase()
  if (lower.startsWith('zh-hant') || lower === 'zh-hk' || lower === 'zh-tw') return 'zh-HK'
  if (lower.startsWith('zh-hans') || lower === 'zh-cn' || lower === 'zh-sg') return 'zh-CN'
  if (lower.startsWith('zh')) return 'zh-HK'
  if (lower.startsWith('ar')) return 'ar'
  if (lower.startsWith('es')) return 'es'
  return 'en'
}

// HarmonyNext does not expose VoiceReader API in ArkTS yet; font-scale is the only
// detectable accessibility preference. Set screenReader flag via developer config.
function resolveA11yFlags(): string {
  return ''  // Extend when HarmonyOS accessibility API becomes available in ArkTS
}

function asErrorMessage(prefix: string, e: Error): string {
  if (e.message.length > 0) {
    return prefix + ': ' + e.message
  }
  return prefix + ': request failed'
}

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
    'Accept': 'application/json',
    'x-locale': resolveHarmonyLocale(),
    'x-a11y-flags': resolveA11yFlags(),
    'x-channel': 'SDUI',
    'traceparent': ObservabilityClient.currentTraceparent(),
  }
  // FIX: 'for...in' is forbidden in ArkTS (arkts-no-for-in).
  // Object.keys() returns string[] and is legal on a typed Record parameter.
  Object.keys(headers).forEach((k: string) => {
    mergedHeaders[k] = headers[k]
  })

  const started = Date.now()
  let recorded = false
  try {
    const resp = await client.request(BASE_URL + path, {
      method,
      header: mergedHeaders,
      extraData: body
    })
    ObservabilityClient.recordNetworkStep('bff_request', Date.now() - started, path, resp.responseCode >= 200 && resp.responseCode < 400)
    recorded = true
    if (typeof resp.result === 'string') {
      // FIX: 'as T' on a generic type-param is allowed in ArkTS when the source is ESObject/string.
      // JSON.parse returns ESObject in ArkTS; the cast is valid.
      return JSON.parse(resp.result) as T
    }
    throw new Error(`HTTP ${resp.responseCode}: unexpected response`)
  } catch (e) {
    if (!recorded) {
      ObservabilityClient.recordNetworkStep('bff_request', Date.now() - started, path, false)
    }
    throw new Error(asErrorMessage('bff_request', e as Error))
  } finally {
    client.destroy()
  }
}

// ─── Config bootstrap ─────────────────────────────────────────────────────────

export async function fetchConfig(): Promise<BFFConfig> {
  return doRequest<BFFConfig>(
    http.RequestMethod.GET,
    '/config',
    { 'x-platform': 'harmonynext' }
  )
}

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

// ─── Home Hub (HK) SDUI delivery ───────────────────────────────────────────────
// Returns the published SDUI layout for the Home Hub (HK) page.
// Throws if no LIVE page has been published yet (BFF returns 404).

export interface ScreenSlice {
  instanceId: string
  type: string
  props: Record<string, ESObject>
  visible: boolean
}

export interface ScreenLayout {
  type: string
  children: ScreenSlice[]
}

export interface ScreenPayload {
  schemaVersion: string
  screen: string
  ttl: number
  metadata: Record<string, ESObject>
  layout: ScreenLayout
}

export type HomeSlice = ScreenSlice
export type HomeScreenLayout = ScreenLayout
export type HomeScreenPayload = ScreenPayload

export async function fetchHomeScreen(): Promise<HomeScreenPayload> {
  const client = http.createHttp()
  const path = '/screen/home-hub-hk'
  const started = Date.now()
  let recorded = false
  try {
    const resp = await client.request(BASE_URL + path, {
      method: http.RequestMethod.GET,
      header: { 'Accept': 'application/json', 'x-platform': 'harmonynext', 'traceparent': ObservabilityClient.currentTraceparent() },
      connectTimeout: 8000,
      readTimeout: 8000
    })
    ObservabilityClient.recordNetworkStep('sdui_screen_fetch', Date.now() - started, path, resp.responseCode === 200)
    recorded = true
    if (resp.responseCode !== 200) {
      throw new Error(`fetchHomeScreen: HTTP ${resp.responseCode}`)
    }
    if (typeof resp.result === 'string') {
      return JSON.parse(resp.result) as HomeScreenPayload
    }
    throw new Error(`fetchHomeScreen: unexpected response type`)
  } catch (e) {
    if (!recorded) {
      ObservabilityClient.recordNetworkStep('sdui_screen_fetch', Date.now() - started, path, false)
    }
    throw new Error(asErrorMessage('sdui_screen_fetch', e as Error))
  } finally {
    client.destroy()
  }
}

// ─── FX Viewpoint SDUI delivery ───────────────────────────────────────────────
// Fetches the published FX Viewpoint (EUR & GBP) page from the BFF.
// The page is always LIVE so this should never throw in a running mock-bff session.

export async function fetchFXViewpointScreen(): Promise<ScreenPayload> {
  const client = http.createHttp()
  const resp = await client.request(BASE_URL + '/screen/fx-viewpoint-hk', {
    method: http.RequestMethod.GET,
    header: { 'Accept': 'application/json', 'x-platform': 'harmonynext', 'traceparent': ObservabilityClient.currentTraceparent() },
    connectTimeout: 8000,
    readTimeout: 8000
  })
  client.destroy()
  if (resp.responseCode !== 200) {
    throw new Error(`fetchFXViewpointScreen: HTTP ${resp.responseCode}`)
  }
  if (typeof resp.result === 'string') {
    return JSON.parse(resp.result) as ScreenPayload
  }
  throw new Error(`fetchFXViewpointScreen: unexpected response type`)
}

// ─── Deposit Campaign SDUI delivery ───────────────────────────────────────────
// Fetches the New Fund Deposit Campaign (CN) page from the BFF.
// The page is always LIVE in mock-bff.

export async function fetchDepositCampaignScreen(): Promise<ScreenPayload> {
  const client = http.createHttp()
  const resp = await client.request(BASE_URL + '/screen/deposit-campaign-cn', {
    method: http.RequestMethod.GET,
    header: { 'Accept': 'application/json', 'x-platform': 'harmonynext', 'traceparent': ObservabilityClient.currentTraceparent() },
    connectTimeout: 8000,
    readTimeout: 8000
  })
  client.destroy()
  if (resp.responseCode !== 200) {
    throw new Error(`fetchDepositCampaignScreen: HTTP ${resp.responseCode}`)
  }
  if (typeof resp.result === 'string') {
    return JSON.parse(resp.result) as ScreenPayload
  }
  throw new Error(`fetchDepositCampaignScreen: unexpected response type`)
}

// ─── Announcement Overlay SDUI delivery ───────────────────────────────────────
// Fetches native-only announcement pages authored in OCDP and served by mock-bff.

export async function fetchAnnouncementScreen(screenId: string): Promise<ScreenPayload> {
  const client = http.createHttp()
  const resp = await client.request(BASE_URL + '/screen/' + screenId, {
    method: http.RequestMethod.GET,
    header: { 'Accept': 'application/json', 'x-platform': 'harmonynext', 'traceparent': ObservabilityClient.currentTraceparent() },
    connectTimeout: 8000,
    readTimeout: 8000
  })
  client.destroy()
  if (resp.responseCode !== 200) {
    throw new Error(`fetchAnnouncementScreen: HTTP ${resp.responseCode}`)
  }
  if (typeof resp.result === 'string') {
    return JSON.parse(resp.result) as ScreenPayload
  }
  throw new Error(`fetchAnnouncementScreen: unexpected response type`)
}
