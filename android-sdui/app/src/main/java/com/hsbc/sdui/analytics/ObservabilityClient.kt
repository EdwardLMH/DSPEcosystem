package com.hsbc.sdui.analytics

import android.os.SystemClock
import java.security.SecureRandom

object ObservabilityClient {
    private val random = SecureRandom()
    private var traceId: String = randomHex(16)
    private var appStartMs: Long = SystemClock.elapsedRealtime()
    private var foregroundStartMs: Long = appStartMs
    private var startupType: String = "cold"

    fun markAppCreate() {
        traceId = randomHex(16)
        appStartMs = SystemClock.elapsedRealtime()
        foregroundStartMs = appStartMs
        startupType = "cold"
        recordStartupStep("activity_on_create", 0)
    }

    fun markForeground() {
        foregroundStartMs = SystemClock.elapsedRealtime()
        startupType = "warm"
        recordStartupStep("activity_on_start", 0)
    }

    fun traceparent(): String = "00-$traceId-${randomHex(8)}-01"

    fun startupElapsedMs(): Long {
        val start = if (startupType == "warm") foregroundStartMs else appStartMs
        return SystemClock.elapsedRealtime() - start
    }

    fun recordStartupStep(step: String, durationMs: Long, screenId: String = "home-hub-hk") {
        TealiumClient.track(
            event = "operational_startup_step",
            category = "Operational",
            action = "startup_step",
            label = step,
            screen = screenId,
            journey = "app_startup",
            step = step,
            custom = mapOf(
                "trace_id" to traceId,
                "span_id" to randomHex(8),
                "startup_type" to startupType,
                "startup_step" to step,
                "duration_ms" to durationMs.toString(),
                "screen_id" to screenId
            )
        )
    }

    fun recordNetworkStep(name: String, durationMs: Long, path: String, success: Boolean) {
        TealiumClient.track(
            event = "operational_network_step",
            category = "Operational",
            action = "network_step",
            label = name,
            screen = "network",
            journey = "sdui_runtime",
            step = name,
            custom = mapOf(
                "trace_id" to traceId,
                "span_id" to randomHex(8),
                "duration_ms" to durationMs.toString(),
                "path" to path,
                "success" to success.toString()
            )
        )
    }

    private fun randomHex(byteCount: Int): String {
        val bytes = ByteArray(byteCount)
        random.nextBytes(bytes)
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
