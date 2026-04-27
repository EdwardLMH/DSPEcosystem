// SDUIModels.kt
// HSBC SDUI Android Renderer
// Moshi-annotated data classes matching the SDUI JSON schema v1.

package com.hsbc.sdui.models

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

// ---------------------------------------------------------------------------
// Root payload
// ---------------------------------------------------------------------------

@JsonClass(generateAdapter = true)
data class ScreenPayload(
    @Json(name = "schema_version") val schemaVersion: String,
    @Json(name = "screen")         val screen: String,
    @Json(name = "ttl")            val ttl: Int,          // seconds until stale
    @Json(name = "integrity")      val integrity: String, // SHA-256 of canonical JSON body
    @Json(name = "layout")         val layout: LayoutNode,
    @Json(name = "metadata")       val metadata: ScreenMetadata
)

// ---------------------------------------------------------------------------
// Screen metadata
// ---------------------------------------------------------------------------

@JsonClass(generateAdapter = true)
data class ScreenMetadata(
    @Json(name = "request_id")    val requestId: String,
    @Json(name = "rendered_at")   val renderedAt: String,  // ISO-8601
    @Json(name = "user_id")       val userId: String,
    @Json(name = "segment_id")    val segmentId: String,
    @Json(name = "variant_id")    val variantId: String? = null,
    @Json(name = "experiment_id") val experimentId: String? = null
)

// ---------------------------------------------------------------------------
// Layout node
// ---------------------------------------------------------------------------

@JsonClass(generateAdapter = true)
data class LayoutNode(
    @Json(name = "type")           val type: String,           // "container" | "component"
    @Json(name = "id")             val id: String,
    @Json(name = "component_type") val componentType: String,  // e.g. "promo_banner"
    @Json(name = "props")          val props: Map<String, Any?>,
    @Json(name = "children")       val children: List<LayoutNode>? = null,
    @Json(name = "analytics")      val analytics: AnalyticsConfig? = null,
    @Json(name = "visibility")     val visibility: VisibilityRules? = null
)

// ---------------------------------------------------------------------------
// Analytics configuration
// ---------------------------------------------------------------------------

@JsonClass(generateAdapter = true)
data class AnalyticsConfig(
    @Json(name = "impression_event")  val impressionEvent: String,
    @Json(name = "click_event")       val clickEvent: String? = null,
    @Json(name = "component_id")      val componentId: String,
    @Json(name = "variant_id")        val variantId: String? = null,
    @Json(name = "custom_properties") val customProperties: Map<String, Any?>? = null
)

// ---------------------------------------------------------------------------
// Action definition
// ---------------------------------------------------------------------------

enum class ActionType {
    NAVIGATE,
    DEEP_LINK,
    API_CALL,
    MODAL,
    TRACK,
    SHARE
}

@JsonClass(generateAdapter = true)
data class ActionDefinition(
    @Json(name = "type")        val type: ActionType,
    @Json(name = "destination") val destination: String? = null,
    @Json(name = "params")      val params: Map<String, String>? = null,
    @Json(name = "payload")     val payload: Map<String, Any?>? = null
)

// ---------------------------------------------------------------------------
// Visibility rules
// ---------------------------------------------------------------------------

@JsonClass(generateAdapter = true)
data class VisibilityRules(
    @Json(name = "segment")   val segment: String? = null,
    @Json(name = "platform")  val platform: String? = null,
    @Json(name = "locale")    val locale: String? = null,
    @Json(name = "min_sdui")  val minSdui: String? = null
)

// ---------------------------------------------------------------------------
// Prop accessor helpers (extension functions on Map<String, Any?>)
// ---------------------------------------------------------------------------

fun Map<String, Any?>.getString(key: String): String? = this[key] as? String

fun Map<String, Any?>.getInt(key: String): Int? =
    when (val v = this[key]) {
        is Int    -> v
        is Double -> v.toInt()
        is Long   -> v.toInt()
        else      -> null
    }

fun Map<String, Any?>.getBool(key: String): Boolean? = this[key] as? Boolean

@Suppress("UNCHECKED_CAST")
fun Map<String, Any?>.getMap(key: String): Map<String, Any?>? = this[key] as? Map<String, Any?>

@Suppress("UNCHECKED_CAST")
fun Map<String, Any?>.getList(key: String): List<Any?>? = this[key] as? List<Any?>

/**
 * Attempts to deserialise an `ActionDefinition` stored inline as a prop map.
 * The expected JSON shape is:
 * ```json
 * { "type": "NAVIGATE", "destination": "savings/summer-rate", "params": { ... } }
 * ```
 */
fun Map<String, Any?>.getAction(key: String): ActionDefinition? {
    val raw = getMap(key) ?: return null
    val typeStr = raw.getString("type") ?: return null
    val type = runCatching { ActionType.valueOf(typeStr) }.getOrNull() ?: return null
    val destination = raw.getString("destination")
    @Suppress("UNCHECKED_CAST")
    val params = raw.getMap("params") as? Map<String, String>
    @Suppress("UNCHECKED_CAST")
    val payload = raw.getMap("payload")
    return ActionDefinition(type = type, destination = destination, params = params, payload = payload)
}
