// ObservabilityClient.ets
// Lightweight HarmonyNext trace context and startup timing bridge.

import { SensorDataClient } from './SensorDataClient'

const HEX = '0123456789abcdef'

function randomHex(length: number): string {
  let value = ''
  for (let i = 0; i < length; i++) {
    value += HEX.charAt(Math.floor(Math.random() * 16))
  }
  return value
}

class _ObservabilityClient {
  private traceId: string = randomHex(32)
  private appStartMs: number = Date.now()
  private foregroundStartMs: number = this.appStartMs
  private startupType: string = 'cold'

  markAppCreate(): void {
    this.traceId = randomHex(32)
    this.appStartMs = Date.now()
    this.foregroundStartMs = this.appStartMs
    this.startupType = 'cold'
    this.recordStartupStep('ability_on_create', 0)
  }

  markWindowStageCreate(): void {
    this.recordStartupStep('window_stage_create', Date.now() - this.appStartMs)
  }

  markForeground(): void {
    this.foregroundStartMs = Date.now()
    this.startupType = 'warm'
    this.recordStartupStep('app_foreground', 0)
  }

  currentTraceparent(): string {
    return '00-' + this.traceId + '-' + randomHex(16) + '-01'
  }

  currentTraceId(): string {
    return this.traceId
  }

  currentStartupType(): string {
    return this.startupType
  }

  currentStartupElapsedMs(): number {
    const start = this.startupType === 'warm' ? this.foregroundStartMs : this.appStartMs
    return Date.now() - start
  }

  recordStartupStep(step: string, durationMs: number, screenId: string = 'home-hub-hk'): void {
    const extra: Record<string, ESObject> = {}
    extra['trace_id'] = this.traceId as ESObject
    extra['span_id'] = randomHex(16) as ESObject
    extra['startup_type'] = this.startupType as ESObject
    extra['startup_step'] = step as ESObject
    extra['duration_ms'] = durationMs as ESObject
    extra['screen_id'] = screenId as ESObject
    SensorDataClient.track('operational_startup_step', 'Operational', 'startup_step', step,
      screenId, 'app_startup', step, '', '', '', '', '', '', '', extra)
  }

  recordNetworkStep(name: string, durationMs: number, path: string, success: boolean): void {
    const extra: Record<string, ESObject> = {}
    extra['trace_id'] = this.traceId as ESObject
    extra['span_id'] = randomHex(16) as ESObject
    extra['duration_ms'] = durationMs as ESObject
    extra['path'] = path as ESObject
    extra['success'] = success as ESObject
    SensorDataClient.track('operational_network_step', 'Operational', 'network_step', name,
      'network', 'sdui_runtime', name, '', '', '', '', '', '', '', extra)
  }
}

export const ObservabilityClient = new _ObservabilityClient()
