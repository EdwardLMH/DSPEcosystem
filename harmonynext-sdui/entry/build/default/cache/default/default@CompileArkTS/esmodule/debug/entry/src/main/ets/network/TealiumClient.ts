import http from "@ohos:net.http";
const TEALIUM_COLLECT_URL = 'https://collect.tealiumiq.com/event';
const TEALIUM_BATCH_SIZE = 20;
const TEALIUM_FLUSH_MS = 5000;
interface TealiumEvent {
    event: string;
    time: number;
    properties: Record<string, any>;
}
class _TealiumClient {
    private queue: TealiumEvent[] = [];
    private flushTimer: number = -1;
    constructor() {
        this.flushTimer = setInterval(() => { this.flush(); }, TEALIUM_FLUSH_MS) as number;
    }
    track(event: string, category: string, action: string, label: string, screen: string, journey: string, step: string = '', section: string = '', componentId: string = '', contentId: string = '', variantId: string = '', experimentId: string = '', userId: string = '', segmentId: string = '', extra: Record<string, any> = {}): void {
        const props: Record<string, any> = {};
        props['tealium_event'] = event as any;
        props['tealium_account'] = 'hsbc' as any;
        props['tealium_profile'] = 'hkretail' as any;
        props['tealium_env'] = 'dev' as any;
        props['platform'] = 'HarmonyOS' as any;
        props['locale'] = 'zh-HK' as any;
        props['event_category'] = category as any;
        props['event_action'] = action as any;
        props['event_label'] = label as any;
        props['screen_name'] = screen as any;
        props['journey_name'] = journey as any;
        props['journey_step'] = step as any;
        props['section_name'] = section as any;
        props['component_id'] = componentId as any;
        props['content_id'] = contentId as any;
        props['variant_id'] = variantId as any;
        props['experiment_id'] = experimentId as any;
        props['user_id_hash'] = userId as any;
        props['segment_id'] = segmentId as any;
        props['extra'] = JSON.stringify(extra) as any;
        this.queue.push({ event, time: Date.now(), properties: props });
        if (this.queue.length >= TEALIUM_BATCH_SIZE) {
            this.flush();
        }
    }
    private flush(): void {
        if (this.queue.length === 0)
            return;
        const batch: TealiumEvent[] = this.queue.slice();
        this.queue = [];
        const client = http.createHttp();
        client.request(TEALIUM_COLLECT_URL, {
            method: http.RequestMethod.POST,
            header: { 'Content-Type': 'application/json' },
            extraData: JSON.stringify({ events: batch })
        }).catch(() => {
            const limit = Math.max(0, 200 - this.queue.length);
            const toRequeue = batch.slice(0, limit);
            this.queue = toRequeue.concat(this.queue);
        }).finally(() => client.destroy());
    }
    homeHubViewed(): void {
        this.track('page_view', 'Navigation', 'screen_viewed', 'home_hub_hk', 'home_hub_hk', 'home_hub');
    }
    wealthHubViewed(): void {
        this.homeHubViewed();
    }
    sliceImpression(sliceType: string, instanceId: string, position: number, contentId: string = ''): void {
        const extra: Record<string, any> = {};
        extra['slice_type'] = sliceType as any;
        extra['position'] = position as any;
        this.track('slice_impression', 'Wealth', 'slice_viewed', sliceType, 'home_hub_hk', 'home_hub', '', '', instanceId, contentId, '', '', '', '', extra);
    }
    sliceTapped(sliceType: string, instanceId: string, ctaLabel: string, deepLink: string, contentId: string = ''): void {
        const extra: Record<string, any> = {};
        extra['slice_type'] = sliceType as any;
        extra['deep_link'] = deepLink as any;
        extra['cta_label'] = ctaLabel as any;
        this.track('slice_tap', 'Wealth', 'cta_tapped', ctaLabel, 'home_hub_hk', 'home_hub', '', '', instanceId, contentId, '', '', '', '', extra);
    }
    quickAccessTapped(label: string, deepLink: string): void {
        this.sliceTapped('COMBO_QUICK_ACCESS', 'quick-access', label, deepLink);
    }
    wealthProductTapped(productName: string, fundId: string): void {
        const extra: Record<string, any> = {};
        extra['product_name'] = productName as any;
        this.track('product_tap', 'Wealth', 'product_tapped', productName, 'home_hub_hk', 'home_hub', '', '', fundId, '', '', '', '', '', extra);
    }
    wealthStudioTapped(title: string, instanceId: string): void {
        this.sliceTapped('WEALTH_STUDIO_CAROUSEL', instanceId, title, '');
    }
    guidesTapped(title: string, instanceId: string): void {
        this.sliceTapped('GUIDES_INSIGHTS_CAROUSEL', instanceId, title, '');
    }
    discoverMoreTapped(title: string, tag: string): void {
        const extra: Record<string, any> = {};
        extra['deal_tag'] = tag as any;
        this.track('discover_more_tap', 'Wealth', 'discover_more_tapped', title, 'home_hub_hk', 'home_hub', '', '', 'discover-more', '', '', '', '', '', extra);
    }
}
export const TealiumClient = new _TealiumClient();
