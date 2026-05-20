// AppDynamicsClient.ets
// HSBC HarmonyNext AppDynamics APM facade for startup and SDUI runtime timing.

class _AppDynamicsClient {
  reportStartupStep(
    name: string,
    durationMs: number,
    traceId: string,
    spanId: string,
    startupType: string,
    screenId: string
  ): void {
    const attrs: Record<string, ESObject> = {}
    attrs['trace_id'] = traceId as ESObject
    attrs['span_id'] = spanId as ESObject
    attrs['startup_type'] = startupType as ESObject
    attrs['screen_id'] = screenId as ESObject
    this.reportMetric('SDUI.Startup.' + name, durationMs, attrs)
  }

  reportNetworkStep(
    name: string,
    durationMs: number,
    traceId: string,
    spanId: string,
    path: string,
    success: boolean
  ): void {
    const attrs: Record<string, ESObject> = {}
    attrs['trace_id'] = traceId as ESObject
    attrs['span_id'] = spanId as ESObject
    attrs['path'] = path as ESObject
    attrs['success'] = success as ESObject
    this.reportMetric('SDUI.Network.' + name, durationMs, attrs)
  }

  private reportMetric(name: string, durationMs: number, attributes: Record<string, ESObject>): void {
    // Production wiring:
    // - Initialise the approved HSBC AppDynamics/HarmonyNext APM bridge at app startup.
    // - Replace this simulation hook with the enterprise AppDynamics custom metric API.
    // - Keep attributes low-cardinality and PII-free.
    console.info('[AppDynamics][SIM] ' + name + '=' + durationMs + 'ms ' + JSON.stringify(attributes))
  }
}

export const AppDynamicsClient = new _AppDynamicsClient()
