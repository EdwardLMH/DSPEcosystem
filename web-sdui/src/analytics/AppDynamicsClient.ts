type AppDynamicsAttributes = Record<string, string | number | boolean>;

declare global {
  interface Window {
    ADRUM?: {
      command?: (...args: unknown[]) => void;
    };
  }
}

class AppDynamicsClient {
  reportStartupStep(
    name: string,
    durationMs: number,
    attributes: AppDynamicsAttributes,
  ): void {
    this.reportMetric(`SDUI.Startup.${name}`, durationMs, attributes);
  }

  reportNetworkStep(
    name: string,
    durationMs: number,
    attributes: AppDynamicsAttributes,
  ): void {
    this.reportMetric(`SDUI.Network.${name}`, durationMs, attributes);
  }

  private reportMetric(name: string, durationMs: number, attributes: AppDynamicsAttributes): void {
    // Production wiring:
    // - Load the approved HSBC AppDynamics Browser RUM agent before the app bundle.
    // - Replace this command shape with the enterprise-approved custom metric API.
    // - Keep attributes low-cardinality and PII-free.
    if (window.ADRUM?.command) {
      window.ADRUM.command('reportMetric', name, Math.round(durationMs), attributes);
      return;
    }
    console.debug('[AppDynamics][SIM]', name, Math.round(durationMs), attributes);
  }
}

export const appDynamics = new AppDynamicsClient();
