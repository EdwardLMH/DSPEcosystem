package com.hsbc.sdui.analytics

import android.util.Log

object AppDynamicsClient {
    fun reportStartupStep(
        name: String,
        durationMs: Long,
        traceId: String,
        spanId: String,
        startupType: String,
        screenId: String
    ) {
        reportMetric(
            name = "SDUI.Startup.$name",
            durationMs = durationMs,
            attributes = mapOf(
                "trace_id" to traceId,
                "span_id" to spanId,
                "startup_type" to startupType,
                "screen_id" to screenId
            )
        )
    }

    fun reportNetworkStep(
        name: String,
        durationMs: Long,
        traceId: String,
        spanId: String,
        path: String,
        success: Boolean
    ) {
        reportMetric(
            name = "SDUI.Network.$name",
            durationMs = durationMs,
            attributes = mapOf(
                "trace_id" to traceId,
                "span_id" to spanId,
                "path" to path,
                "success" to success.toString()
            )
        )
    }

    private fun reportMetric(name: String, durationMs: Long, attributes: Map<String, String>) {
        // Production wiring:
        // - Initialise the AppDynamics Android agent in Application.onCreate.
        // - Use the approved HSBC AppDynamics API to report custom timers/metrics.
        // - Attach only low-cardinality, PII-free custom data.
        Log.d("AppDynamics", "[SIM] $name=${durationMs}ms $attributes")
    }
}
