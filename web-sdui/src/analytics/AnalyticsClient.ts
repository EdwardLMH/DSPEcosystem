const BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 5000;
const DAP_ENDPOINT = '/dap/v1/events';

interface AnalyticsEvent {
  eventType: string;
  properties: Record<string, unknown>;
  timestamp: string;
}

class AnalyticsClient {
  private queue: AnalyticsEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
    window.addEventListener('beforeunload', () => this.flush());
    window.addEventListener('online', () => this.flush());
  }

  fire(eventType: string, properties: Record<string, unknown> = {}): void {
    this.queue.push({
      eventType,
      properties: this.sanitise(properties),
      timestamp: new Date().toISOString(),
    });
    if (this.queue.length >= BATCH_SIZE) this.flush();
  }

  private sanitise(props: Record<string, unknown>): Record<string, unknown> {
    // Remove any PII fields that should never be sent raw
    const { email, phone, hkid, cardNumber, ...safe } = props as any;
    return safe;
  }

  private flush(): void {
    if (this.queue.length === 0) return;
    const batch = [...this.queue];
    this.queue = [];

    navigator.sendBeacon?.(DAP_ENDPOINT, JSON.stringify({ events: batch })) ||
      fetch(DAP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      }).catch(() => {
        // Re-queue on failure
        this.queue.unshift(...batch);
      });
  }
}

export const analyticsClient = new AnalyticsClient();
