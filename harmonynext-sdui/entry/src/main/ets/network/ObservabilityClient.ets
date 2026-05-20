// ObservabilityClient.ets
// Lightweight HarmonyNext trace context and startup timing bridge.

import { AppDynamicsClient } from './AppDynamicsClient'

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
    AppDynamicsClient.reportStartupStep(
      step,
      durationMs,
      this.traceId,
      randomHex(16),
      this.startupType,
      screenId
    )
  }

  recordNetworkStep(name: string, durationMs: number, path: string, success: boolean): void {
    AppDynamicsClient.reportNetworkStep(
      name,
      durationMs,
      this.traceId,
      randomHex(16),
      path,
      success
    )
  }
}

export const ObservabilityClient = new _ObservabilityClient()
