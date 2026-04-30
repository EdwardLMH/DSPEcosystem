import http from "@ohos:net.http";
// ─── Configuration ────────────────────────────────────────────────────────────
const SA_SERVER_URL = 'https://sa.hsbc.com.cn/sa?project=default'; // China-resident endpoint
const SA_BATCH_SIZE = 20;
const SA_FLUSH_MS = 5000;
// ─── Event envelope ───────────────────────────────────────────────────────────
interface SAEvent {
    event: string;
    time: number; // epoch ms
    properties: SAProperties;
}
// FIX: was '  [key: string]: ESObject' index signature inside interface body — arkts-no-index-signatures.
// ArkTS does not support index signatures in interfaces. The freeform-extra fields are
// replaced by an explicit 'extra' property typed as Record<string, ESObject>, which is
// the ArkTS-legal way to hold dynamic key-value pairs. All call-sites that passed
// inline extra objects now pass them as Record<string, ESObject>.
interface SAProperties {
    // Standard SensorData predefined properties
    $lib: string; // 'HarmonyOS'
    $lib_version: string;
    $app_version: string;
    $screen_name: string;
    $platform: string; // 'HarmonyOS'
    // HSBC custom dimensions (must match Tealium taxonomy for DAP join)
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
    // Wealth Hub specific
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
    // KYC specific
    step_index?: number;
    total_steps?: number;
    question_id?: string;
    error_msg?: string;
    passed?: boolean;
    confidence?: number;
    // FIX: replaces [key: string]: ESObject index signature.
    // Extra freeform properties are stored in a typed Record field.
    extra: Record<string, any>;
}
// ─── SensorDataClient singleton ────────────────────────────────────────────────
class _SensorDataClient {
    private queue: SAEvent[] = [];
    private flushTimer: number = -1;
    constructor() {
        // Auto-flush every SA_FLUSH_MS
        // FIX: 'as number' cast on setInterval return — allowed in ArkTS (narrowing to number).
        this.flushTimer = setInterval(() => { this.flush(); }, SA_FLUSH_MS) as number;
    }
    // ── Core track ──────────────────────────────────────────────────────────────
    // FIX: was 'extra: Partial<SAProperties> = {}' — arkts-no-utility-types (Partial<>).
    // Replaced with 'extra: Record<string, ESObject>' which is the ArkTS-legal
    // equivalent for passing a subset of optional named properties.
    track(event: string, category: string, action: string, label: string, screen: string, journey: string, step: string = '', section: string = '', componentId: string = '', contentId: string = '', variantId: string = '', experimentId: string = '', userId: string = '', segmentId: string = '', extra: Record<string, any> = {}): void {
        // FIX: was '...extra' spread in object literal — arkts-no-spread.
        // ArkTS forbids object spread. Build SAProperties explicitly, then merge
        // extra keys into the dedicated 'extra' Record field.
        const props: SAProperties = {
            $lib: 'HarmonyOS',
            $lib_version: '1.0.0',
            $app_version: '1.0.0',
            $screen_name: screen,
            $platform: 'HarmonyOS',
            event_category: category,
            event_action: action,
            event_label: label,
            journey_name: journey,
            journey_step: step,
            section_name: section,
            component_id: componentId,
            content_id: contentId,
            variant_id: variantId,
            experiment_id: experimentId,
            user_id_hash: userId,
            segment_id: segmentId,
            locale: 'zh-HK',
            extra: extra
        };
        this.queue.push({ event, time: Date.now(), properties: props });
        if (this.queue.length >= SA_BATCH_SIZE) {
            this.flush();
        }
    }
    // ── Flush ────────────────────────────────────────────────────────────────────
    private flush(): void {
        if (this.queue.length === 0)
            return;
        // FIX: was 'const batch = [...this.queue]' — arkts-no-spread (array spread).
        // ArkTS forbids spread in array literals. Use slice() to shallow-copy the array.
        const batch: SAEvent[] = this.queue.slice();
        this.queue = [];
        // Real SDK call (uncomment when SensorData SDK is integrated):
        // batch.forEach(e => SensorsAnalytics.track(e.event, e.properties))
        // Fallback: HTTP post to SensorData server URL (SDK manages this normally)
        const client = http.createHttp();
        client.request(SA_SERVER_URL, {
            method: http.RequestMethod.POST,
            header: { 'Content-Type': 'application/json' },
            extraData: JSON.stringify({ data_list: batch })
        }).catch(() => {
            // Re-queue on failure (best-effort)
            // FIX: was 'this.queue.unshift(...batch.slice(...))' — arkts-no-spread (spread in call args).
            // ArkTS forbids spread in function arguments. Use a loop to prepend items.
            const limit = Math.max(0, 200 - this.queue.length);
            const toRequeue = batch.slice(0, limit);
            // Prepend by building a new array: requeued items + existing queue
            const merged: SAEvent[] = toRequeue.concat(this.queue);
            this.queue = merged;
        }).finally(() => client.destroy());
    }
    // ── Wealth Hub event helpers ─────────────────────────────────────────────────
    wealthHubViewed(): void {
        this.track('$pageview', 'Wealth', 'screen_viewed', 'wealth_hub_hk', 'wealth_hub_hk', 'wealth_hub');
    }
    sliceImpression(sliceType: string, instanceId: string, position: number, contentId: string = ''): void {
        // FIX: arkts-no-untyped-obj-literals — Record<string, ESObject> literal must be
        // built via index assignments, not an inline { key: val } literal.
        const extra: Record<string, any> = {};
        extra['slice_type'] = sliceType as any;
        extra['position'] = position as any;
        this.track('slice_impression', 'Wealth', 'slice_viewed', sliceType, 'wealth_hub_hk', 'wealth_hub', '', '', instanceId, contentId, '', '', '', '', extra);
    }
    sliceTapped(sliceType: string, instanceId: string, ctaLabel: string, deepLink: string, contentId: string = ''): void {
        const extra: Record<string, any> = {};
        extra['slice_type'] = sliceType as any;
        extra['deep_link'] = deepLink as any;
        extra['cta_label'] = ctaLabel as any;
        this.track('slice_tap', 'Wealth', 'cta_tapped', ctaLabel, 'wealth_hub_hk', 'wealth_hub', '', '', instanceId, contentId, '', '', '', '', extra);
    }
    promoBannerImpression(title: string, instanceId: string, contentId: string = ''): void {
        const extra: Record<string, any> = {};
        extra['promo_title'] = title as any;
        this.track('promo_impression', 'Wealth', 'promo_viewed', title, 'wealth_hub_hk', 'wealth_hub', '', '', instanceId, contentId, '', '', '', '', extra);
    }
    promoBannerTapped(title: string, instanceId: string, contentId: string = ''): void {
        const extra: Record<string, any> = {};
        extra['promo_title'] = title as any;
        this.track('promo_tap', 'Wealth', 'promo_tapped', title, 'wealth_hub_hk', 'wealth_hub', '', '', instanceId, contentId, '', '', '', '', extra);
    }
    wealthProductTapped(name: string, id: string): void {
        const extra: Record<string, any> = {};
        extra['product_name'] = name as any;
        this.track('product_tap', 'Wealth', 'product_tapped', name, 'wealth_hub_hk', 'wealth_hub', '', '', id, '', '', '', '', '', extra);
    }
    quickAccessTapped(label: string, deepLink: string): void {
        const extra: Record<string, any> = {};
        extra['deep_link'] = deepLink as any;
        this.track('quick_access_tap', 'Wealth', 'quick_access_tapped', label, 'wealth_hub_hk', 'wealth_hub', '', '', '', '', '', '', '', '', extra);
    }
    rankingsTapped(title: string, badge: string): void {
        const extra: Record<string, any> = {};
        extra['ranking_title'] = title as any;
        extra['ranking_badge'] = badge as any;
        this.track('ranking_tap', 'Wealth', 'ranking_tapped', title, 'wealth_hub_hk', 'wealth_hub', '', '', '', '', '', '', '', '', extra);
    }
    lifeDealTapped(brand: string, tag: string): void {
        const extra: Record<string, any> = {};
        extra['brand_name'] = brand as any;
        extra['deal_tag'] = tag as any;
        this.track('deal_tap', 'Wealth', 'deal_tapped', brand, 'wealth_hub_hk', 'wealth_hub', '', '', '', '', '', '', '', '', extra);
    }
    adBannerDismissed(title: string): void {
        const extra: Record<string, any> = {};
        extra['promo_title'] = title as any;
        this.track('ad_dismissed', 'Wealth', 'ad_banner_dismissed', title, 'wealth_hub_hk', 'wealth_hub', '', '', '', '', '', '', '', '', extra);
    }
    aiAssistantTapped(): void {
        this.track('ai_assistant_tap', 'Wealth', 'ai_assistant_tapped', '', 'wealth_hub_hk', 'wealth_hub');
    }
    // ── KYC Journey event helpers ────────────────────────────────────────────────
    kycJourneyStarted(): void {
        this.track('kyc_start', 'KYC', 'journey_started', 'OBKYC', 'kyc_welcome', 'obkyc', 'welcome');
    }
    kycStepViewed(stepId: string, stepIndex: number, totalSteps: number, section: string): void {
        const extra: Record<string, any> = {};
        extra['step_index'] = stepIndex as any;
        extra['total_steps'] = totalSteps as any;
        this.track('kyc_step_view', 'KYC', 'step_viewed', stepId, `kyc_${stepId}`, 'obkyc', stepId, section, '', '', '', '', '', '', extra);
    }
    kycStepCompleted(stepId: string, stepIndex: number, section: string): void {
        const extra: Record<string, any> = {};
        extra['step_index'] = stepIndex as any;
        this.track('kyc_step_complete', 'KYC', 'step_completed', stepId, `kyc_${stepId}`, 'obkyc', stepId, section, '', '', '', '', '', '', extra);
    }
    kycValidationError(stepId: string, questionId: string, errorMsg: string): void {
        const extra: Record<string, any> = {};
        extra['question_id'] = questionId as any;
        extra['error_msg'] = errorMsg as any;
        this.track('kyc_validation_error', 'KYC', 'validation_error', questionId, `kyc_${stepId}`, 'obkyc', stepId, '', '', '', '', '', '', '', extra);
    }
    kycLivenessResult(passed: boolean, confidence: number): void {
        const extra: Record<string, any> = {};
        extra['passed'] = passed as any;
        extra['confidence'] = confidence as any;
        this.track('kyc_liveness_result', 'KYC', passed ? 'liveness_passed' : 'liveness_failed', passed ? 'PASSED' : 'FAILED', 'kyc_liveness', 'obkyc', 'liveness', '', '', '', '', '', '', '', extra);
    }
    kycOpenBankingConnected(bank: string): void {
        const extra: Record<string, any> = {};
        extra['bank_id'] = bank as any;
        this.track('kyc_ob_connected', 'KYC', 'open_banking_connected', bank, 'kyc_openbanking', 'obkyc', 'openbanking', '', '', '', '', '', '', '', extra);
    }
    kycJourneyCompleted(): void {
        this.track('kyc_complete', 'KYC', 'journey_completed', 'OBKYC', 'kyc_completion', 'obkyc', 'completion');
    }
}
export const SensorDataClient = new _SensorDataClient();
