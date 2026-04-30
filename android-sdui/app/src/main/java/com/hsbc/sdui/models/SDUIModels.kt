// SDUIModels.kt — HSBC SDUI Android Renderer

package com.hsbc.sdui.models

import com.google.gson.annotations.SerializedName

// ---------------------------------------------------------------------------
// Root payload
// ---------------------------------------------------------------------------


data class ScreenPayload(
    @SerializedName("schema_version") val schemaVersion: String,
    @SerializedName("screen")         val screen: String,
    @SerializedName("ttl")            val ttl: Int,          // seconds until stale
    @SerializedName("integrity")      val integrity: String, // SHA-256 of canonical JSON body
    @SerializedName("layout")         val layout: LayoutNode,
    @SerializedName("metadata")       val metadata: ScreenMetadata
)

// ---------------------------------------------------------------------------
// Screen metadata
// ---------------------------------------------------------------------------


data class ScreenMetadata(
    @SerializedName("request_id")    val requestId: String,
    @SerializedName("rendered_at")   val renderedAt: String,  // ISO-8601
    @SerializedName("user_id")       val userId: String,
    @SerializedName("segment_id")    val segmentId: String,
    @SerializedName("variant_id")    val variantId: String? = null,
    @SerializedName("experiment_id") val experimentId: String? = null
)

// ---------------------------------------------------------------------------
// Layout node
// ---------------------------------------------------------------------------


data class LayoutNode(
    @SerializedName("type")           val type: String,           // "container" | "component"
    @SerializedName("id")             val id: String,
    @SerializedName("component_type") val componentType: String,  // e.g. "promo_banner"
    @SerializedName("props")          val props: Map<String, Any?>,
    @SerializedName("children")       val children: List<LayoutNode>? = null,
    @SerializedName("analytics")      val analytics: AnalyticsConfig? = null,
    @SerializedName("visibility")     val visibility: VisibilityRules? = null
)

// ---------------------------------------------------------------------------
// Analytics configuration
// ---------------------------------------------------------------------------


data class AnalyticsConfig(
    @SerializedName("impression_event")  val impressionEvent: String,
    @SerializedName("click_event")       val clickEvent: String? = null,
    @SerializedName("component_id")      val componentId: String,
    @SerializedName("variant_id")        val variantId: String? = null,
    @SerializedName("custom_properties") val customProperties: Map<String, Any?>? = null
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


data class ActionDefinition(
    @SerializedName("type")        val type: ActionType,
    @SerializedName("destination") val destination: String? = null,
    @SerializedName("params")      val params: Map<String, String>? = null,
    @SerializedName("payload")     val payload: Map<String, Any?>? = null
)

// ---------------------------------------------------------------------------
// Visibility rules
// ---------------------------------------------------------------------------


data class VisibilityRules(
    @SerializedName("segment")   val segment: String? = null,
    @SerializedName("platform")  val platform: String? = null,
    @SerializedName("locale")    val locale: String? = null,
    @SerializedName("min_sdui")  val minSdui: String? = null
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

// ---------------------------------------------------------------------------
// SDUINode — unified tree node used by the SDUI engine and component registry.
// This is the runtime model; LayoutNode is the Moshi-deserialized wire type.
// LayoutNode is converted to SDUINode after parsing so that the rendering
// layer is decoupled from the network schema.
// ---------------------------------------------------------------------------

data class SDUINode(
    val id: String,
    val type: String,
    val props: Map<String, Any?> = emptyMap(),
    val children: List<SDUINode>? = null,
    val analytics: AnalyticsConfig? = null,
    val fallback: SDUINode? = null
)

/** Convert the wire-format [LayoutNode] into the renderer's [SDUINode]. */
fun LayoutNode.toSDUINode(): SDUINode = SDUINode(
    id        = id,
    type      = componentType,
    props     = props,
    children  = children?.map { it.toSDUINode() },
    analytics = analytics,
    fallback  = null
)

// ---------------------------------------------------------------------------
// SDUIScreenCache — simple in-memory cache with optional persistence hook.
// ---------------------------------------------------------------------------

data class CachedScreen(val payload: com.hsbc.sdui.models.ScreenPayload)

class SDUIScreenCache {
    private val store = mutableMapOf<String, CachedScreen>()

    fun save(screenId: String, payload: ScreenPayload) {
        store[screenId] = CachedScreen(payload)
    }

    fun load(screenId: String): CachedScreen? = store[screenId]
}
