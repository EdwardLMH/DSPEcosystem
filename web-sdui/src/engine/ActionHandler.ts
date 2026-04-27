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
        this.navigate(action.destination!, action.params);
        break;

      case 'DEEP_LINK':
        window.open(action.destination, '_blank', 'noopener,noreferrer');
        break;

      case 'API_CALL':
        fetch(action.destination!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload ?? {}),
        }).catch(err => console.error('[SDUI] API_CALL failed', err));
        break;

      case 'MODAL':
        this.showModal(action.payload);
        break;

      case 'TRACK':
        // Pure analytics event — no navigation
        import('../analytics/AnalyticsClient').then(({ analyticsClient }) => {
          analyticsClient.fire(action.destination!, action.params ?? {});
        });
        break;

      case 'SHARE':
        if (navigator.share) {
          navigator.share({ url: action.destination, title: action.params?.title });
        }
        break;

      default:
        console.warn(`[SDUI] Unknown action type: "${action.type}"`);
    }
  }
}
