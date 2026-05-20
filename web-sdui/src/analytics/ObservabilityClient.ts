import { appDynamics } from './AppDynamicsClient';

const hex = '0123456789abcdef';

function randomHex(length: number): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(Math.ceil(length / 2));
    cryptoApi.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').slice(0, length);
  }
  let value = '';
  for (let i = 0; i < length; i++) value += hex[Math.floor(Math.random() * 16)];
  return value;
}

class ObservabilityClient {
  private traceId = randomHex(32);
  private appStart = performance.now();
  private startupType: 'web_navigation' | 'warm' = 'web_navigation';

  markAppStart(): void {
    this.traceId = randomHex(32);
    this.appStart = performance.now();
    this.startupType = 'web_navigation';
    this.recordStartupStep('web_app_start', 0);
  }

  traceparent(): string {
    return `00-${this.traceId}-${randomHex(16)}-01`;
  }

  startupElapsedMs(): number {
    return Math.round(performance.now() - this.appStart);
  }

  recordStartupStep(step: string, durationMs: number, screenId = 'home-hub-hk'): void {
    appDynamics.reportStartupStep(step, durationMs, {
      trace_id: this.traceId,
      span_id: randomHex(16),
      startup_type: this.startupType,
      startup_step: step,
      duration_ms: Math.round(durationMs),
      screen_id: screenId,
      platform: 'web',
    });
  }

  recordNetworkStep(name: string, durationMs: number, path: string, success: boolean): void {
    appDynamics.reportNetworkStep(name, durationMs, {
      trace_id: this.traceId,
      span_id: randomHex(16),
      duration_ms: Math.round(durationMs),
      path,
      success,
      platform: 'web',
    });
  }
}

export const observability = new ObservabilityClient();
