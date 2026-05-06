// TealiumClient.swift
// HSBC iOS — Tealium iQ + UDH analytics integration
// Routes all SDUI & KYC events through Tealium's data layer so the
// Tealium iQ tag management container can forward them to Adobe Analytics,
// Firebase, GA4, or any other vendor without a native app release.

import Foundation

// MARK: - Tealium Configuration

private enum TealiumConfig {
    // Replace with your Tealium account / profile at build time (or via xcconfig)
    static let account  = "hsbc"
    static let profile  = "hkretail"
    static let env      = "prod"          // "dev" | "qa" | "prod"

    // Tealium Collect endpoint (UDH ingestion)
    static var collectURL: URL {
        URL(string: "https://collect.tealiumiq.com/event")!
    }
    // Tealium iQ utag.js CDN (for web fallback reference — not used natively)
    static var utagURL: String {
        "https://tags.tiqcdn.com/utag/\(account)/\(profile)/\(env)/utag.js"
    }
}

// MARK: - Tealium Data Layer

/// Represents a single Tealium UDO (Universal Data Object) payload.
struct TealiumEvent: Encodable {
    // Standard Tealium keys
    var tealium_account  = TealiumConfig.account
    var tealium_profile  = TealiumConfig.profile
    var tealium_datasource: String  // Tealium data source key from iQ
    var tealium_event: String       // maps to utag.track event name

    // HSBC standard dimensions (set per-event)
    var event_category: String
    var event_action:   String
    var event_label:    String

    // Screen / journey context
    var screen_name:  String
    var journey_name: String
    var journey_step: String
    var section_name: String

    // SDUI content IDs (for A/B + content scoring)
    var component_id:   String
    var content_id:     String
    var variant_id:     String
    var experiment_id:  String

    // User context (hashed)
    var user_id_hash:   String
    var segment_id:     String
    var locale:         String   = "zh-HK"
    var platform:       String   = "ios"
    var app_version:    String

    // Timestamp
    var event_timestamp: String

    // Additional arbitrary properties
    var custom: [String: String]

    // Flatten custom into the top-level encoded output
    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: DynamicKey.self)
        let mirror = Mirror(reflecting: self)
        for child in mirror.children {
            guard let label = child.label, label != "custom" else { continue }
            if let v = child.value as? String {
                try c.encode(v, forKey: DynamicKey(label))
            }
        }
        for (k, v) in custom {
            try c.encode(v, forKey: DynamicKey(k))
        }
    }
}

private struct DynamicKey: CodingKey {
    var stringValue: String
    var intValue: Int? { nil }
    init(_ s: String) { stringValue = s }
    init?(stringValue s: String) { stringValue = s }
    init?(intValue _: Int) { nil }
}

// MARK: - TealiumClient

/// Thread-safe singleton that batches events and sends them to the
/// Tealium Collect (UDH) endpoint.  The tag container in Tealium iQ
/// then routes data to Adobe Analytics / GA4 / Facebook / etc.
public final class TealiumClient {

    public static let shared = TealiumClient()

    private let queue = DispatchQueue(label: "com.hsbc.tealium", qos: .utility)
    private var batch: [TealiumEvent] = []
    private let maxBatch = 20
    private let flushInterval: TimeInterval = 5
    private var timer: DispatchSourceTimer?

    private let session: URLSession
    private let appVersion: String

    private init() {
        appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
        let cfg = URLSessionConfiguration.default
        cfg.timeoutIntervalForRequest  = 5   // fail fast; analytics is best-effort
        cfg.timeoutIntervalForResource = 10
        session = URLSession(configuration: cfg)
        startTimer()
    }

    // MARK: - Public API

    /// Track a Tealium event.  All parameters have sensible defaults so
    /// call-sites only need to supply what's relevant.
    public static func track(
        datasource:   String   = "hsbc_mobile_ios",
        event:        String,
        category:     String   = "SDUI",
        action:       String,
        label:        String   = "",
        screen:       String   = "",
        journey:      String   = "",
        step:         String   = "",
        section:      String   = "",
        componentId:  String   = "",
        contentId:    String   = "",
        variantId:    String   = "",
        experimentId: String   = "",
        userId:       String   = "",
        segmentId:    String   = "",
        custom:       [String: String] = [:]
    ) {
        shared.enqueue(TealiumEvent(
            tealium_datasource: datasource,
            tealium_event:      event,
            event_category:     category,
            event_action:       action,
            event_label:        label,
            screen_name:        screen,
            journey_name:       journey,
            journey_step:       step,
            section_name:       section,
            component_id:       componentId,
            content_id:         contentId,
            variant_id:         variantId,
            experiment_id:      experimentId,
            user_id_hash:       userId.isEmpty ? "" : sha256(userId),
            segment_id:         segmentId,
            app_version:        shared.appVersion,
            event_timestamp:    ISO8601DateFormatter().string(from: Date()),
            custom:             custom
        ))
    }

    /// Force-flush the batch (call from app background / terminate delegate).
    public static func flush() { shared.flushBatch() }

    // MARK: - Private

    private func enqueue(_ event: TealiumEvent) {
        queue.async {
            self.batch.append(event)
            if self.batch.count >= self.maxBatch { self.flushBatch() }
        }
    }

    private func startTimer() {
        let t = DispatchSource.makeTimerSource(queue: queue)
        t.schedule(deadline: .now() + flushInterval, repeating: flushInterval)
        t.setEventHandler { [weak self] in self?.flushBatch() }
        t.resume()
        timer = t
    }

    private func flushBatch() {
        guard !batch.isEmpty else { return }
        let events = batch
        batch.removeAll()

        #if targetEnvironment(simulator)
        // Skip network send in Simulator — Tealium endpoint is unreachable,
        // which causes repeated -1001 timeout errors in the Xcode console.
        // Events are printed locally instead.
        for e in events {
            print("[Tealium][SIM] \(e.tealium_event) | \(e.event_category) | \(e.event_action)")
        }
        return
        #endif

        guard let body = try? JSONEncoder().encode(["events": events]) else { return }
        var req = URLRequest(url: TealiumConfig.collectURL)
        req.httpMethod  = "POST"
        req.httpBody    = body
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("ios",              forHTTPHeaderField: "x-platform")

        session.dataTask(with: req) { _, _, _ in
            // Best-effort fire-and-forget — dropped on failure rather than
            // re-queuing, to prevent the retry loop that floods Xcode logs.
        }.resume()
    }

    private static func sha256(_ s: String) -> String {
        var digest = [UInt8](repeating: 0, count: 32)
        let data = Data(s.utf8)
        data.withUnsafeBytes { _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &digest) }
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}

// MARK: - WealthHub Tealium Events (pre-typed helpers)

public extension TealiumClient {

    // ── Wealth Hub slice impressions ──────────────────────────────────────────

    static func wealthHubViewed(screen: String = "wealth_hub_hk") {
        track(event: "page_view", category: "Wealth", action: "screen_viewed",
              label: screen, screen: screen, journey: "wealth_hub")
    }

    static func sliceImpression(sliceType: String, instanceId: String,
                                 position: Int, contentId: String = "") {
        track(event: "slice_impression", category: "Wealth", action: "slice_viewed",
              label: sliceType, screen: "wealth_hub_hk",
              journey: "wealth_hub", componentId: instanceId, contentId: contentId,
              custom: ["slice_type": sliceType, "position": String(position)])
    }

    static func sliceTapped(sliceType: String, instanceId: String,
                             ctaLabel: String, deepLink: String, contentId: String = "") {
        track(event: "slice_tap", category: "Wealth", action: "cta_tapped",
              label: ctaLabel, screen: "wealth_hub_hk",
              journey: "wealth_hub", componentId: instanceId, contentId: contentId,
              custom: ["slice_type": sliceType, "deep_link": deepLink, "cta_label": ctaLabel])
    }

    static func promoBannerImpression(title: String, instanceId: String, contentId: String = "") {
        track(event: "promo_impression", category: "Wealth", action: "promo_viewed",
              label: title, screen: "wealth_hub_hk",
              journey: "wealth_hub", componentId: instanceId, contentId: contentId,
              custom: ["promo_title": title])
    }

    static func promoBannerTapped(title: String, instanceId: String, contentId: String = "") {
        track(event: "promo_tap", category: "Wealth", action: "promo_tapped",
              label: title, screen: "wealth_hub_hk",
              journey: "wealth_hub", componentId: instanceId, contentId: contentId,
              custom: ["promo_title": title])
    }

    static func wealthProductTapped(productName: String, productId: String) {
        track(event: "product_tap", category: "Wealth", action: "product_tapped",
              label: productName, screen: "wealth_hub_hk",
              journey: "wealth_hub", componentId: productId,
              custom: ["product_name": productName])
    }

    static func quickAccessTapped(label: String, deepLink: String) {
        track(event: "quick_access_tap", category: "Wealth", action: "quick_access_tapped",
              label: label, screen: "wealth_hub_hk",
              journey: "wealth_hub",
              custom: ["quick_label": label, "deep_link": deepLink])
    }

    static func rankingsTapped(title: String, badge: String) {
        track(event: "ranking_tap", category: "Wealth", action: "ranking_tapped",
              label: title, screen: "wealth_hub_hk",
              journey: "wealth_hub",
              custom: ["ranking_title": title, "ranking_badge": badge])
    }

    static func lifeDealTapped(brand: String, tag: String) {
        track(event: "deal_tap", category: "Wealth", action: "deal_tapped",
              label: brand, screen: "wealth_hub_hk",
              journey: "wealth_hub",
              custom: ["brand_name": brand, "deal_tag": tag])
    }

    static func adBannerDismissed(title: String) {
        track(event: "ad_dismissed", category: "Wealth", action: "ad_banner_dismissed",
              label: title, screen: "wealth_hub_hk",
              journey: "wealth_hub", custom: ["ad_title": title])
    }

    static func aiAssistantTapped() {
        track(event: "ai_assistant_tap", category: "Wealth", action: "ai_assistant_tapped",
              screen: "wealth_hub_hk", journey: "wealth_hub")
    }

    // ── KYC Journey Tealium Events ────────────────────────────────────────────

    static func kycJourneyStarted() {
        track(event: "kyc_start", category: "KYC", action: "journey_started",
              label: "OBKYC", screen: "kyc_welcome",
              journey: "obkyc", step: "welcome")
    }

    static func kycStepViewed(stepId: String, stepIndex: Int, totalSteps: Int, section: String) {
        track(event: "kyc_step_view", category: "KYC", action: "step_viewed",
              label: stepId, screen: "kyc_\(stepId)",
              journey: "obkyc", step: stepId, section: section,
              custom: ["step_index": String(stepIndex), "total_steps": String(totalSteps)])
    }

    static func kycStepCompleted(stepId: String, stepIndex: Int, section: String) {
        track(event: "kyc_step_complete", category: "KYC", action: "step_completed",
              label: stepId, screen: "kyc_\(stepId)",
              journey: "obkyc", step: stepId, section: section,
              custom: ["step_index": String(stepIndex)])
    }

    static func kycStepBack(stepId: String, fromStep: String) {
        track(event: "kyc_step_back", category: "KYC", action: "step_back",
              label: stepId, screen: "kyc_\(stepId)",
              journey: "obkyc", step: stepId,
              custom: ["from_step": fromStep])
    }

    static func kycValidationError(stepId: String, questionId: String, errorMsg: String) {
        track(event: "kyc_validation_error", category: "KYC", action: "validation_error",
              label: questionId, screen: "kyc_\(stepId)",
              journey: "obkyc", step: stepId,
              custom: ["question_id": questionId, "error_msg": errorMsg])
    }

    static func kycSaveAndExit(stepId: String, stepIndex: Int) {
        track(event: "kyc_save_exit", category: "KYC", action: "save_and_exit",
              label: stepId, screen: "kyc_\(stepId)",
              journey: "obkyc", step: stepId,
              custom: ["step_index": String(stepIndex)])
    }

    static func kycLivenessResult(passed: Bool, confidence: Double) {
        track(event: "kyc_liveness_result", category: "KYC",
              action: passed ? "liveness_passed" : "liveness_failed",
              label: passed ? "PASSED" : "FAILED",
              screen: "kyc_liveness", journey: "obkyc", step: "liveness",
              custom: ["passed": String(passed), "confidence": String(confidence)])
    }

    static func kycOpenBankingConnected(bank: String) {
        track(event: "kyc_ob_connected", category: "KYC", action: "open_banking_connected",
              label: bank, screen: "kyc_openbanking",
              journey: "obkyc", step: "openbanking",
              custom: ["bank_id": bank])
    }

    static func kycJourneyCompleted() {
        track(event: "kyc_complete", category: "KYC", action: "journey_completed",
              label: "OBKYC", screen: "kyc_completion",
              journey: "obkyc", step: "completion")
    }
}

// CommonCrypto bridging for SHA-256 without CryptoKit dependency on older OS
import CommonCrypto
