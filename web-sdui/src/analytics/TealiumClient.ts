// TealiumClient.ts
// HSBC Web — Tealium Universal Data Layer (UDL) integration
//
// This module wraps all Tealium utag.track() calls.  The Tealium iQ container
// loaded via the <script> tag on the host page routes events to Adobe Analytics,
// GA4, etc.  In local/dev environments where utag is not loaded we fall back to
// the existing DAP AnalyticsClient so events are never silently dropped.
//
// Usage:
//   import { tealium } from './TealiumClient'
//   tealium.sliceImpression('PROMO_BANNER', 'slice-promo-10', 0)
//   tealium.kycStepViewed('dob', 2, 10, 'Personal Details')

import { analyticsClient } from './AnalyticsClient'

// ── Tealium utag typings (utag loaded globally by the host page) ───────────────
declare global {
  interface Window {
    utag?: {
      track: (type: string, data: Record<string, unknown>) => void
      link:  (data: Record<string, unknown>) => void
      view:  (data: Record<string, unknown>) => void
    }
  }
}

// ── Core layer ─────────────────────────────────────────────────────────────────

interface TealiumPayload {
  tealium_event:    string
  event_category:   string
  event_action:     string
  event_label:      string
  screen_name:      string
  journey_name:     string
  journey_step:     string
  section_name:     string
  component_id:     string
  content_id:       string
  variant_id:       string
  experiment_id:    string
  user_id_hash:     string
  segment_id:       string
  platform:         string
  locale:           string
  [key: string]: unknown
}

class TealiumWebClient {
  private readonly account  = 'hsbc'
  private readonly profile  = 'hkretail'

  track(payload: Partial<TealiumPayload> & { tealium_event: string }): void {
    const full: TealiumPayload = {
      tealium_event:  payload.tealium_event,
      event_category: payload.event_category  ?? 'SDUI',
      event_action:   payload.event_action    ?? '',
      event_label:    payload.event_label     ?? '',
      screen_name:    payload.screen_name     ?? '',
      journey_name:   payload.journey_name    ?? '',
      journey_step:   payload.journey_step    ?? '',
      section_name:   payload.section_name    ?? '',
      component_id:   payload.component_id    ?? '',
      content_id:     payload.content_id      ?? '',
      variant_id:     payload.variant_id      ?? '',
      experiment_id:  payload.experiment_id   ?? '',
      user_id_hash:   payload.user_id_hash    ?? '',
      segment_id:     payload.segment_id      ?? '',
      platform:       'web',
      locale:         'zh-HK',
      ...payload,
    }

    // Forward to Tealium iQ tag container if available
    if (typeof window !== 'undefined' && window.utag) {
      window.utag.track('link', full)
    }

    // Always forward to DAP AnalyticsClient as backup / dev fallback
    analyticsClient.fire(full.tealium_event, full as Record<string, unknown>)
  }

  view(screenName: string, extra: Record<string, unknown> = {}): void {
    const payload = {
      tealium_event: 'page_view',
      event_category: 'Navigation',
      event_action: 'screen_viewed',
      event_label: screenName,
      screen_name: screenName,
      ...extra,
    }
    if (typeof window !== 'undefined' && window.utag) {
      window.utag.view(payload)
    }
    analyticsClient.fire('page_view', payload)
  }

  // ── Wealth Hub HK events ───────────────────────────────────────────────────

  wealthHubViewed(): void {
    this.view('wealth_hub_hk', { journey_name: 'wealth_hub' })
  }

  sliceImpression(sliceType: string, instanceId: string,
                  position: number, contentId = ''): void {
    this.track({
      tealium_event: 'slice_impression', event_category: 'Wealth',
      event_action: 'slice_viewed', event_label: sliceType,
      screen_name: 'wealth_hub_hk', journey_name: 'wealth_hub',
      component_id: instanceId, content_id: contentId,
      slice_type: sliceType, position,
    })
  }

  sliceTapped(sliceType: string, instanceId: string,
              ctaLabel: string, deepLink: string, contentId = ''): void {
    this.track({
      tealium_event: 'slice_tap', event_category: 'Wealth',
      event_action: 'cta_tapped', event_label: ctaLabel,
      screen_name: 'wealth_hub_hk', journey_name: 'wealth_hub',
      component_id: instanceId, content_id: contentId,
      slice_type: sliceType, deep_link: deepLink, cta_label: ctaLabel,
    })
  }

  promoBannerImpression(title: string, instanceId: string, contentId = ''): void {
    this.track({
      tealium_event: 'promo_impression', event_category: 'Wealth',
      event_action: 'promo_viewed', event_label: title,
      screen_name: 'wealth_hub_hk', journey_name: 'wealth_hub',
      component_id: instanceId, content_id: contentId, promo_title: title,
    })
  }

  promoBannerTapped(title: string, instanceId: string, contentId = ''): void {
    this.track({
      tealium_event: 'promo_tap', event_category: 'Wealth',
      event_action: 'promo_tapped', event_label: title,
      screen_name: 'wealth_hub_hk', journey_name: 'wealth_hub',
      component_id: instanceId, content_id: contentId, promo_title: title,
    })
  }

  wealthProductTapped(name: string, id: string): void {
    this.track({
      tealium_event: 'product_tap', event_category: 'Wealth',
      event_action: 'product_tapped', event_label: name,
      screen_name: 'wealth_hub_hk', journey_name: 'wealth_hub',
      component_id: id, product_name: name,
    })
  }

  quickAccessTapped(label: string, deepLink: string): void {
    this.track({
      tealium_event: 'quick_access_tap', event_category: 'Wealth',
      event_action: 'quick_access_tapped', event_label: label,
      screen_name: 'wealth_hub_hk', journey_name: 'wealth_hub',
      quick_label: label, deep_link: deepLink,
    })
  }

  rankingsTapped(title: string, badge: string): void {
    this.track({
      tealium_event: 'ranking_tap', event_category: 'Wealth',
      event_action: 'ranking_tapped', event_label: title,
      screen_name: 'wealth_hub_hk', journey_name: 'wealth_hub',
      ranking_title: title, ranking_badge: badge,
    })
  }

  lifeDealTapped(brand: string, tag: string): void {
    this.track({
      tealium_event: 'deal_tap', event_category: 'Wealth',
      event_action: 'deal_tapped', event_label: brand,
      screen_name: 'wealth_hub_hk', journey_name: 'wealth_hub',
      brand_name: brand, deal_tag: tag,
    })
  }

  adBannerDismissed(title: string): void {
    this.track({
      tealium_event: 'ad_dismissed', event_category: 'Wealth',
      event_action: 'ad_banner_dismissed', event_label: title,
      screen_name: 'wealth_hub_hk', journey_name: 'wealth_hub', ad_title: title,
    })
  }

  aiAssistantTapped(): void {
    this.track({
      tealium_event: 'ai_assistant_tap', event_category: 'Wealth',
      event_action: 'ai_assistant_tapped',
      screen_name: 'wealth_hub_hk', journey_name: 'wealth_hub',
    })
  }

  // ── KYC Journey events ─────────────────────────────────────────────────────

  kycJourneyStarted(): void {
    this.track({
      tealium_event: 'kyc_start', event_category: 'KYC',
      event_action: 'journey_started', event_label: 'OBKYC',
      screen_name: 'kyc_welcome', journey_name: 'obkyc', journey_step: 'welcome',
    })
  }

  kycStepViewed(stepId: string, stepIndex: number, totalSteps: number, section: string): void {
    this.track({
      tealium_event: 'kyc_step_view', event_category: 'KYC',
      event_action: 'step_viewed', event_label: stepId,
      screen_name: `kyc_${stepId}`, journey_name: 'obkyc',
      journey_step: stepId, section_name: section,
      step_index: stepIndex, total_steps: totalSteps,
    })
  }

  kycStepCompleted(stepId: string, stepIndex: number, section: string): void {
    this.track({
      tealium_event: 'kyc_step_complete', event_category: 'KYC',
      event_action: 'step_completed', event_label: stepId,
      screen_name: `kyc_${stepId}`, journey_name: 'obkyc',
      journey_step: stepId, section_name: section, step_index: stepIndex,
    })
  }

  kycStepBack(stepId: string, fromStep: string): void {
    this.track({
      tealium_event: 'kyc_step_back', event_category: 'KYC',
      event_action: 'step_back', event_label: stepId,
      screen_name: `kyc_${stepId}`, journey_name: 'obkyc',
      journey_step: stepId, from_step: fromStep,
    })
  }

  kycValidationError(stepId: string, questionId: string, errorMsg: string): void {
    this.track({
      tealium_event: 'kyc_validation_error', event_category: 'KYC',
      event_action: 'validation_error', event_label: questionId,
      screen_name: `kyc_${stepId}`, journey_name: 'obkyc',
      journey_step: stepId, question_id: questionId, error_msg: errorMsg,
    })
  }

  kycSaveAndExit(stepId: string, stepIndex: number): void {
    this.track({
      tealium_event: 'kyc_save_exit', event_category: 'KYC',
      event_action: 'save_and_exit', event_label: stepId,
      screen_name: `kyc_${stepId}`, journey_name: 'obkyc',
      journey_step: stepId, step_index: stepIndex,
    })
  }

  kycLivenessResult(passed: boolean, confidence: number): void {
    this.track({
      tealium_event: 'kyc_liveness_result', event_category: 'KYC',
      event_action: passed ? 'liveness_passed' : 'liveness_failed',
      event_label: passed ? 'PASSED' : 'FAILED',
      screen_name: 'kyc_liveness', journey_name: 'obkyc', journey_step: 'liveness',
      passed, confidence,
    })
  }

  kycOpenBankingConnected(bank: string): void {
    this.track({
      tealium_event: 'kyc_ob_connected', event_category: 'KYC',
      event_action: 'open_banking_connected', event_label: bank,
      screen_name: 'kyc_openbanking', journey_name: 'obkyc',
      journey_step: 'openbanking', bank_id: bank,
    })
  }

  kycJourneyCompleted(): void {
    this.track({
      tealium_event: 'kyc_complete', event_category: 'KYC',
      event_action: 'journey_completed', event_label: 'OBKYC',
      screen_name: 'kyc_completion', journey_name: 'obkyc', journey_step: 'completion',
    })
  }
}

export const tealium = new TealiumWebClient()
