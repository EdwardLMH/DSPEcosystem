package com.hsbc.sdui.analytics

import android.util.Log
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest

object AnalyticsClient {

    private const val TAG = "SDUIAnalytics"
    private const val DAP_ENDPOINT = "https://api.hsbc.com.hk/dap/v1/events"
    private const val BATCH_SIZE = 20
    private const val FLUSH_INTERVAL_MS = 5_000L

    private val queue = mutableListOf<JSONObject>()
    private val http = OkHttpClient()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    init {
        scope.launch {
            while (isActive) {
                delay(FLUSH_INTERVAL_MS)
                flush()
            }
        }
    }

    fun fire(eventType: String, properties: Map<String, String> = emptyMap()) {
        val event = JSONObject().apply {
            put("eventType", eventType)
            put("timestamp", java.time.Instant.now().toString())
            val props = JSONObject()
            properties.forEach { (k, v) ->
                if (k == "userId") props.put(k, sha256(v)) else props.put(k, v)
            }
            put("properties", props)
        }
        synchronized(queue) {
            queue.add(event)
            if (queue.size >= BATCH_SIZE) scope.launch { flush() }
        }
    }

    fun log(eventType: String, properties: Map<String, String>) {
        Log.d(TAG, "$eventType: $properties")
        fire(eventType, properties)
    }

    private fun flush() {
        val batch = synchronized(queue) {
            val copy = queue.toList()
            queue.clear()
            copy
        }
        if (batch.isEmpty()) return

        val body = JSONObject().put("events", JSONArray(batch)).toString()
            .toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url(DAP_ENDPOINT)
            .post(body)
            .build()

        runCatching { http.newCall(request).execute().close() }
            .onFailure { Log.e(TAG, "Analytics flush failed: ${it.message}") }
    }

    private fun sha256(input: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
