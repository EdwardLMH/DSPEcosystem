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
        AppDynamicsClient.reportStartupStep(
            name = step,
            durationMs = durationMs,
            traceId = traceId,
            spanId = randomHex(8),
            startupType = startupType,
            screenId = screenId
        )
    }

    fun recordNetworkStep(name: String, durationMs: Long, path: String, success: Boolean) {
        AppDynamicsClient.reportNetworkStep(
            name = name,
            durationMs = durationMs,
            traceId = traceId,
            spanId = randomHex(8),
            path = path,
            success = success
        )
    }

    private fun randomHex(byteCount: Int): String {
        val bytes = ByteArray(byteCount)
        random.nextBytes(bytes)
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
