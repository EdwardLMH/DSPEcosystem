import http from "@ohos:net.http";
const SA_SERVER_URL = 'https://sa.hsbc.com.cn/sa?project=default';
const SA_BATCH_SIZE = 20;
const SA_FLUSH_MS = 5000;
interface SAEvent {
    event: string;
    time: number;
    properties: SAProperties;
}
interface SAProperties {
    $lib: string;
    $lib_version: string;
    $app_version: string;
    $screen_name: string;
    $platform: string;
    event_category: string;
    event_action: string;
    event_label: string;
    journey_name: string;
    journey_step: string;
    section_name: string;
    component_id: string;
    content_id: string;
    variant_id: string;
    experiment_id: string;
    user_id_hash: string;
    segment_id: string;
    locale: string;
    slice_type?: string;
    position?: number;
    deep_link?: string;
    cta_label?: string;
    product_name?: string;
    brand_name?: string;
    deal_tag?: string;
    ranking_title?: string;
    ranking_badge?: string;
    promo_title?: string;
    bank_id?: string;
    step_index?: number;
    total_steps?: number;
    question_id?: string;
    error_msg?: string;
    passed?: boolean;
    confidence?: number;
    extra: Record<string, any>;
}
class _SensorDataClient {
    private queue: SAEvent[] = [];
    private flushTimer: number = -1;
    constructor() {
        this.flushTimer = setInterval(() => { this.flush(); }, SA_FLUSH_MS) as number;
    }
    track(z41: string, a42: string, b42: string, c42: string, d42: string, e42: string, f42: string = '', g42: string = '', h42: string = '', i42: string = '', j42: string = '', k42: string = '', l42: string = '', m42: string = '', n42: Record<string, any> = {}): void {
        const o42: SAProperties = {
            $lib: 'HarmonyOS',
            $lib_version: '1.0.0',
            $app_version: '1.0.0',
            $screen_name: d42,
            $platform: 'HarmonyOS',
            event_category: a42,
            event_action: b42,
            event_label: c42,
            journey_name: e42,
            journey_step: f42,
            section_name: g42,
            component_id: h42,
            content_id: i42,
            variant_id: j42,
            experiment_id: k42,
            user_id_hash: l42,
            segment_id: m42,
            locale: 'zh-HK',
            extra: n42
        };
        this.queue.push({ event: z41, time: Date.now(), properties: o42 });
        if (this.queue.length >= SA_BATCH_SIZE) {
            this.flush();
        }
    }
    private flush(): void {
        if (this.queue.length === 0)
            return;
        const u41: SAEvent[] = this.queue.slice();
        this.queue = [];
        const v41 = http.createHttp();
        v41.request(SA_SERVER_URL, {
            method: http.RequestMethod.POST,
            header: { 'Content-Type': 'application/json' },
            extraData: JSON.stringify({ data_list: u41 })
        }).catch(() => {
            const w41 = Math.max(0, 200 - this.queue.length);
            const x41 = u41.slice(0, w41);
            const y41: SAEvent[] = x41.concat(this.queue);
            this.queue = y41;
        }).finally(() => v41.destroy());
    }
    wealthHubViewed(): void {
        this.track('$pageview', 'Wealth', 'screen_viewed', 'wealth_hub_hk', 'wealth_hub_hk', 'wealth_hub');
    }
    sliceImpression(p41: string, q41: string, r41: number, s41: string = ''): void {
        const t41: Record<string, any> = {};
        t41['slice_type'] = p41 as any;
        t41['position'] = r41 as any;
        this.track('slice_impression', 'Wealth', 'slice_viewed', p41, 'wealth_hub_hk', 'wealth_hub', '', '', q41, s41, '', '', '', '', t41);
    }
    sliceTapped(j41: string, k41: string, l41: string, m41: string, n41: string = ''): void {
        const o41: Record<string, any> = {};
        o41['slice_type'] = j41 as any;
        o41['deep_link'] = m41 as any;
        o41['cta_label'] = l41 as any;
        this.track('slice_tap', 'Wealth', 'cta_tapped', l41, 'wealth_hub_hk', 'wealth_hub', '', '', k41, n41, '', '', '', '', o41);
    }
    promoBannerImpression(f41: string, g41: string, h41: string = ''): void {
        const i41: Record<string, any> = {};
        i41['promo_title'] = f41 as any;
        this.track('promo_impression', 'Wealth', 'promo_viewed', f41, 'wealth_hub_hk', 'wealth_hub', '', '', g41, h41, '', '', '', '', i41);
    }
    promoBannerTapped(b41: string, c41: string, d41: string = ''): void {
        const e41: Record<string, any> = {};
        e41['promo_title'] = b41 as any;
        this.track('promo_tap', 'Wealth', 'promo_tapped', b41, 'wealth_hub_hk', 'wealth_hub', '', '', c41, d41, '', '', '', '', e41);
    }
    wealthProductTapped(y40: string, z40: string): void {
        const a41: Record<string, any> = {};
        a41['product_name'] = y40 as any;
        this.track('product_tap', 'Wealth', 'product_tapped', y40, 'wealth_hub_hk', 'wealth_hub', '', '', z40, '', '', '', '', '', a41);
    }
    quickAccessTapped(v40: string, w40: string): void {
        const x40: Record<string, any> = {};
        x40['deep_link'] = w40 as any;
        this.track('quick_access_tap', 'Wealth', 'quick_access_tapped', v40, 'wealth_hub_hk', 'wealth_hub', '', '', '', '', '', '', '', '', x40);
    }
    rankingsTapped(s40: string, t40: string): void {
        const u40: Record<string, any> = {};
        u40['ranking_title'] = s40 as any;
        u40['ranking_badge'] = t40 as any;
        this.track('ranking_tap', 'Wealth', 'ranking_tapped', s40, 'wealth_hub_hk', 'wealth_hub', '', '', '', '', '', '', '', '', u40);
    }
    lifeDealTapped(p40: string, q40: string): void {
        const r40: Record<string, any> = {};
        r40['brand_name'] = p40 as any;
        r40['deal_tag'] = q40 as any;
        this.track('deal_tap', 'Wealth', 'deal_tapped', p40, 'wealth_hub_hk', 'wealth_hub', '', '', '', '', '', '', '', '', r40);
    }
    adBannerDismissed(n40: string): void {
        const o40: Record<string, any> = {};
        o40['promo_title'] = n40 as any;
        this.track('ad_dismissed', 'Wealth', 'ad_banner_dismissed', n40, 'wealth_hub_hk', 'wealth_hub', '', '', '', '', '', '', '', '', o40);
    }
    aiAssistantTapped(): void {
        this.track('ai_assistant_tap', 'Wealth', 'ai_assistant_tapped', '', 'wealth_hub_hk', 'wealth_hub');
    }
    kycJourneyStarted(): void {
        this.track('kyc_start', 'KYC', 'journey_started', 'OBKYC', 'kyc_welcome', 'obkyc', 'welcome');
    }
    kycStepViewed(i40: string, j40: number, k40: number, l40: string): void {
        const m40: Record<string, any> = {};
        m40['step_index'] = j40 as any;
        m40['total_steps'] = k40 as any;
        this.track('kyc_step_view', 'KYC', 'step_viewed', i40, `kyc_${i40}`, 'obkyc', i40, l40, '', '', '', '', '', '', m40);
    }
    kycStepCompleted(e40: string, f40: number, g40: string): void {
        const h40: Record<string, any> = {};
        h40['step_index'] = f40 as any;
        this.track('kyc_step_complete', 'KYC', 'step_completed', e40, `kyc_${e40}`, 'obkyc', e40, g40, '', '', '', '', '', '', h40);
    }
    kycValidationError(a40: string, b40: string, c40: string): void {
        const d40: Record<string, any> = {};
        d40['question_id'] = b40 as any;
        d40['error_msg'] = c40 as any;
        this.track('kyc_validation_error', 'KYC', 'validation_error', b40, `kyc_${a40}`, 'obkyc', a40, '', '', '', '', '', '', '', d40);
    }
    kycLivenessResult(x39: boolean, y39: number): void {
        const z39: Record<string, any> = {};
        z39['passed'] = x39 as any;
        z39['confidence'] = y39 as any;
        this.track('kyc_liveness_result', 'KYC', x39 ? 'liveness_passed' : 'liveness_failed', x39 ? 'PASSED' : 'FAILED', 'kyc_liveness', 'obkyc', 'liveness', '', '', '', '', '', '', '', z39);
    }
    kycOpenBankingConnected(v39: string): void {
        const w39: Record<string, any> = {};
        w39['bank_id'] = v39 as any;
        this.track('kyc_ob_connected', 'KYC', 'open_banking_connected', v39, 'kyc_openbanking', 'obkyc', 'openbanking', '', '', '', '', '', '', '', w39);
    }
    kycJourneyCompleted(): void {
        this.track('kyc_complete', 'KYC', 'journey_completed', 'OBKYC', 'kyc_completion', 'obkyc', 'completion');
    }
}
export const SensorDataClient = new _SensorDataClient();
