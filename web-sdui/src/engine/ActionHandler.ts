import { ActionDefinition } from '../types/sdui';

type NavigateFn = (destination: string, params?: Record<string, string>) => void;
type ShowModalFn = (componentJson: unknown) => void;

export class ActionHandler {
  constructor(
    private navigate: NavigateFn,
    private showModal: ShowModalFn
  ) {}

  handle(action: ActionDefinition): void {
    switch (action.type) {
      case 'NAVIGATE':
        this.navigate(action.route, action.params);
        break;

      case 'DEEP_LINK':
        window.open(action.url, action.target ?? '_blank', 'noopener,noreferrer');
        break;

      case 'API_CALL':
        fetch(action.endpoint, {
          method: action.method ?? 'POST',
          headers: { 'Content-Type': 'application/json', ...(action.headers ?? {}) },
          body: action.body ? JSON.stringify(action.body) : undefined,
        }).catch(err => console.error('[SDUI] API_CALL failed', err));
        break;

      case 'MODAL':
        this.showModal(action.modalNode ?? action.modalId);
        break;

      case 'TRACK':
        // Pure analytics event — no navigation
        import('../analytics/AnalyticsClient').then(({ analyticsClient }) => {
          analyticsClient.fire(action.eventName, action.properties ?? {});
        });
        break;

      case 'SHARE':
        if (navigator.share) {
          navigator.share({ url: action.url, title: action.title, text: action.text });
        }
        break;

      default:
        action satisfies never;
        console.warn('[SDUI] Unknown action type');
    }
  }
}
