package com.hsbc.sdui.analytics

import android.util.Log
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest
import java.time.Instant

/**
 * Tealium Collect (UDH) client for Android.
 *
 * All SDUI impression / tap events and KYC journey events are routed through
 * this client so that the Tealium iQ tag container can forward them to
 * Adobe Analytics, Firebase, GA4, or any other vendor without a native
 * app release.
 *
 * The existing [AnalyticsClient] DAP client is kept in parallel — this client
 * is layered on top and fires to the Tealium Collect endpoint.
 */
object TealiumClient {

    private const val TAG             = "TealiumAnalytics"
    // Replace account/profile/env with actual Tealium iQ values
    private const val ACCOUNT         = "hsbc"
    private const val PROFILE         = "hkretail"
    private const val ENV             = "prod"
    private const val COLLECT_URL     = "https://collect.tealiumiq.com/event"
    private const val BATCH_SIZE      = 20
    private const val FLUSH_INTERVAL  = 5_000L

    private val queue = mutableListOf<JSONObject>()
    private val http  = OkHttpClient()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    init {
        scope.launch {
            while (isActive) { delay(FLUSH_INTERVAL); flush() }
        }
    }

    // ── Core track ────────────────────────────────────────────────────────────

    fun track(
        datasource:   String = "hsbc_mobile_android",
        event:        String,
        category:     String = "SDUI",
        action:       String,
        label:        String = "",
        screen:       String = "",
        journey:      String = "",
        step:         String = "",
        section:      String = "",
        componentId:  String = "",
        contentId:    String = "",
        variantId:    String = "",
        experimentId: String = "",
        userId:       String = "",
        segmentId:    String = "",
        custom:       Map<String, String> = emptyMap()
    ) {
        val payload = JSONObject().apply {
            put("tealium_account",   ACCOUNT)
            put("tealium_profile",   PROFILE)
            put("tealium_env",       ENV)
            put("tealium_datasource", datasource)
            put("tealium_event",     event)
            put("event_category",    category)
            put("event_action",      action)
            put("event_label",       label)
            put("screen_name",       screen)
            put("journey_name",      journey)
            put("journey_step",      step)
            put("section_name",      section)
            put("component_id",      componentId)
            put("content_id",        contentId)
            put("variant_id",        variantId)
            put("experiment_id",     experimentId)
            put("user_id_hash",      if (userId.isNotEmpty()) sha256(userId) else "")
            put("segment_id",        segmentId)
            put("platform",          "android")
            put("locale",            "zh-HK")
            put("event_timestamp",   Instant.now().toString())
            custom.forEach { (k, v) -> put(k, v) }
        }
        synchronized(queue) {
            queue.add(payload)
            if (queue.size >= BATCH_SIZE) scope.launch { flush() }
        }
    }

    fun flush() {
        val batch = synchronized(queue) { queue.toList().also { queue.clear() } }
        if (batch.isEmpty()) return
        val body = JSONObject().put("events", JSONArray(batch)).toString()
            .toRequestBody("application/json".toMediaType())
        val req = Request.Builder().url(COLLECT_URL).post(body)
            .addHeader("x-platform", "android").build()
        runCatching { http.newCall(req).execute().close() }
            .onFailure { Log.e(TAG, "Tealium flush failed: ${it.message}") }
    }

    private fun sha256(input: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }

    // ── Wealth Hub events ─────────────────────────────────────────────────────

    fun wealthHubViewed() = track(
        event = "page_view", category = "Wealth", action = "screen_viewed",
        label = "wealth_hub_hk", screen = "wealth_hub_hk", journey = "wealth_hub"
    )

    fun sliceImpression(sliceType: String, instanceId: String,
                        position: Int, contentId: String = "") = track(
        event = "slice_impression", category = "Wealth", action = "slice_viewed",
        label = sliceType, screen = "wealth_hub_hk", journey = "wealth_hub",
        componentId = instanceId, contentId = contentId,
        custom = mapOf("slice_type" to sliceType, "position" to position.toString())
    )

    fun sliceTapped(sliceType: String, instanceId: String,
                    ctaLabel: String, deepLink: String, contentId: String = "") = track(
        event = "slice_tap", category = "Wealth", action = "cta_tapped",
        label = ctaLabel, screen = "wealth_hub_hk", journey = "wealth_hub",
        componentId = instanceId, contentId = contentId,
        custom = mapOf("slice_type" to sliceType, "deep_link" to deepLink, "cta_label" to ctaLabel)
    )

    fun promoBannerImpression(title: String, instanceId: String, contentId: String = "") = track(
        event = "promo_impression", category = "Wealth", action = "promo_viewed",
        label = title, screen = "wealth_hub_hk", journey = "wealth_hub",
        componentId = instanceId, contentId = contentId, custom = mapOf("promo_title" to title)
    )

    fun promoBannerTapped(title: String, instanceId: String, contentId: String = "") = track(
        event = "promo_tap", category = "Wealth", action = "promo_tapped",
        label = title, screen = "wealth_hub_hk", journey = "wealth_hub",
        componentId = instanceId, contentId = contentId, custom = mapOf("promo_title" to title)
    )

    fun wealthProductTapped(name: String, id: String) = track(
        event = "product_tap", category = "Wealth", action = "product_tapped",
        label = name, screen = "wealth_hub_hk", journey = "wealth_hub",
        componentId = id, custom = mapOf("product_name" to name)
    )

    fun quickAccessTapped(label: String, deepLink: String) = track(
        event = "quick_access_tap", category = "Wealth", action = "quick_access_tapped",
        label = label, screen = "wealth_hub_hk", journey = "wealth_hub",
        custom = mapOf("quick_label" to label, "deep_link" to deepLink)
    )

    fun rankingsTapped(title: String, badge: String) = track(
        event = "ranking_tap", category = "Wealth", action = "ranking_tapped",
        label = title, screen = "wealth_hub_hk", journey = "wealth_hub",
        custom = mapOf("ranking_title" to title, "ranking_badge" to badge)
    )

    fun lifeDealTapped(brand: String, tag: String) = track(
        event = "deal_tap", category = "Wealth", action = "deal_tapped",
        label = brand, screen = "wealth_hub_hk", journey = "wealth_hub",
        custom = mapOf("brand_name" to brand, "deal_tag" to tag)
    )

    fun adBannerDismissed(title: String) = track(
        event = "ad_dismissed", category = "Wealth", action = "ad_banner_dismissed",
        label = title, screen = "wealth_hub_hk", journey = "wealth_hub",
        custom = mapOf("ad_title" to title)
    )

    fun aiAssistantTapped() = track(
        event = "ai_assistant_tap", category = "Wealth",
        action = "ai_assistant_tapped", screen = "wealth_hub_hk", journey = "wealth_hub"
    )

    // ── KYC Journey events ────────────────────────────────────────────────────

    fun kycJourneyStarted() = track(
        event = "kyc_start", category = "KYC", action = "journey_started",
        label = "OBKYC", screen = "kyc_welcome", journey = "obkyc", step = "welcome"
    )

    fun kycStepViewed(stepId: String, stepIndex: Int, totalSteps: Int, section: String) = track(
        event = "kyc_step_view", category = "KYC", action = "step_viewed",
        label = stepId, screen = "kyc_$stepId", journey = "obkyc", step = stepId,
        section = section,
        custom = mapOf("step_index" to stepIndex.toString(), "total_steps" to totalSteps.toString())
    )

    fun kycStepCompleted(stepId: String, stepIndex: Int, section: String) = track(
        event = "kyc_step_complete", category = "KYC", action = "step_completed",
        label = stepId, screen = "kyc_$stepId", journey = "obkyc", step = stepId,
        section = section, custom = mapOf("step_index" to stepIndex.toString())
    )

    fun kycValidationError(stepId: String, questionId: String, errorMsg: String) = track(
        event = "kyc_validation_error", category = "KYC", action = "validation_error",
        label = questionId, screen = "kyc_$stepId", journey = "obkyc", step = stepId,
        custom = mapOf("question_id" to questionId, "error_msg" to errorMsg)
    )

    fun kycSaveAndExit(stepId: String, stepIndex: Int) = track(
        event = "kyc_save_exit", category = "KYC", action = "save_and_exit",
        label = stepId, screen = "kyc_$stepId", journey = "obkyc", step = stepId,
        custom = mapOf("step_index" to stepIndex.toString())
    )

    fun kycLivenessResult(passed: Boolean, confidence: Double) = track(
        event = "kyc_liveness_result", category = "KYC",
        action = if (passed) "liveness_passed" else "liveness_failed",
        label = if (passed) "PASSED" else "FAILED",
        screen = "kyc_liveness", journey = "obkyc", step = "liveness",
        custom = mapOf("passed" to passed.toString(), "confidence" to confidence.toString())
    )

    fun kycOpenBankingConnected(bank: String) = track(
        event = "kyc_ob_connected", category = "KYC", action = "open_banking_connected",
        label = bank, screen = "kyc_openbanking", journey = "obkyc", step = "openbanking",
        custom = mapOf("bank_id" to bank)
    )

    fun kycJourneyCompleted() = track(
        event = "kyc_complete", category = "KYC", action = "journey_completed",
        label = "OBKYC", screen = "kyc_completion", journey = "obkyc", step = "completion"
    )
}
