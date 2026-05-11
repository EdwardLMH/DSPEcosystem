// SDUIStaticDistribution.kt
// HSBC SDUI Android Renderer
//
// Implements the three-tier resolution chain for SDUI screens:
//   1. Fetch manifest.json from CDN — compare version against SharedPreferences
//   2a. Version unchanged → serve local file cache (no download)
//   2b. Version changed / no local file → download, SHA-256 verify, persist, render
//   3. CDN unreachable → serve local file cache; if absent → serve bundled baseline
//
// Also manages self-pick entry-point preferences:
//   • Customer preferences stored in SharedPreferences on-device
//   • Preferences preserved across remote updates unless selfPickForceUpdate == true
//
// All I/O is performed on IO dispatcher — never block the main thread.

package com.hsbc.sdui.engine

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.hsbc.sdui.analytics.AnalyticsClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.net.URL
import java.security.MessageDigest

// ─── Manifest types ──────────────────────────────────────────────────────────

data class SDUIManifest(
    val schemaVersion: String,
    val generatedAt: String,
    val screens: Map<String, SDUIScreenEntry>,
    val selfPickForceUpdate: Boolean = false
)

data class SDUIScreenEntry(
    val version: String,
    val etag: String,
    val sizeBytes: Int
)

data class SelfPickEntry(
    val items: List<Map<String, String>>,
    val savedAt: String
)

// ─── SDUIStaticDistribution ───────────────────────────────────────────────────

class SDUIStaticDistribution(
    private val context: Context,
    private val cdnBase: String  = "https://cdn.hsbc.com/sdui",
    private val appId: String    = "hsbcmobile",
    private val platform: String = "android",
    private val userId: String,
) {
    private val gson = Gson()

    // File cache directory: <cacheDir>/SDUI/
    private val cacheDir: File = File(context.cacheDir, "SDUI").also { it.mkdirs() }

    // SharedPreferences store (replaces DataStore — no extra dependency needed)
    private val prefs: SharedPreferences =
        context.getSharedPreferences("sdui_static", Context.MODE_PRIVATE)

    private fun versionKey(screenId: String) = "sdui_version_$screenId"
    private fun selfPickKey(screenId: String) = "selfPick_${userId}_$screenId"

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Resolves the best available SDUI JSON string for [screenId].
     * Returns Pair(json, isStale) — isStale=true means we served local/bundled.
     */
    suspend fun resolve(screenId: String): Pair<String?, Boolean> = withContext(Dispatchers.IO) {
        // Step 1 — try CDN manifest
        val manifest = fetchManifest()
        if (manifest != null) {
            val entry = manifest.screens[screenId]
            if (entry != null) {
                val storedVersion = prefs.getString(versionKey(screenId), null)
                if (storedVersion == entry.version) {
                    val local = loadLocalFile(screenId)
                    if (local != null) return@withContext Pair(local, false)
                }
                // Version changed or no local file — download from CDN
                val downloaded = downloadScreen(screenId, entry.version, entry.etag)
                if (downloaded != null) {
                    persistLocalFile(screenId, downloaded, entry.version)
                    return@withContext Pair(downloaded, false)
                }
                // Download failed (corrupted / missing on CDN)
                AnalyticsClient.fire(
                    "sdui_cdn_download_failed",
                    mapOf("screen_id" to screenId, "version" to entry.version)
                )
            }
        }

        // Step 3 — CDN unreachable or no entry
        val local = loadLocalFile(screenId)
        if (local != null) return@withContext Pair(local, true)

        // Last resort — bundled baseline asset
        val bundled = loadBundledBaseline(screenId)
        Pair(bundled, true)
    }

    /**
     * Returns the self-pick items for the SELF_PICK_ENTRY_POINTS slice.
     * Clears saved prefs and returns remote defaults when [forceUpdate] is true.
     */
    suspend fun resolvedSelfPickItems(
        screenId: String,
        remoteDefaults: List<Map<String, String>>,
        forceUpdate: Boolean
    ): List<Map<String, String>> = withContext(Dispatchers.IO) {
        val key = selfPickKey(screenId)
        if (forceUpdate) {
            prefs.edit().remove(key).apply()
            return@withContext remoteDefaults
        }
        val raw = prefs.getString(key, null) ?: return@withContext remoteDefaults
        val type = object : TypeToken<SelfPickEntry>() {}.type
        val entry: SelfPickEntry? = runCatching {
            gson.fromJson<SelfPickEntry>(raw, type)
        }.getOrNull()
        entry?.items ?: remoteDefaults
    }

    /** Persists customer self-pick ordering to SharedPreferences. */
    suspend fun saveCustomerSelfPick(screenId: String, items: List<Map<String, String>>) {
        withContext(Dispatchers.IO) {
            val entry = SelfPickEntry(items = items, savedAt = System.currentTimeMillis().toString())
            prefs.edit().putString(selfPickKey(screenId), gson.toJson(entry)).apply()
        }
    }

    // ── Manifest ─────────────────────────────────────────────────────────────

    private fun fetchManifest(): SDUIManifest? = runCatching {
        val text = URL("$cdnBase/$appId/$platform/manifest.json").readText(Charsets.UTF_8)
        gson.fromJson(text, SDUIManifest::class.java)
    }.getOrNull()

    // ── CDN Download ──────────────────────────────────────────────────────────

    private fun downloadScreen(screenId: String, version: String, etag: String): String? =
        runCatching {
            val bytes = URL("$cdnBase/$appId/$platform/$screenId/$version.json").readBytes()

            // SHA-256 verify against etag (stored as hex-encoded hash, possibly quoted)
            val stripped = etag.replace("\"", "")
            val digest   = MessageDigest.getInstance("SHA-256").digest(bytes)
            val computed = digest.joinToString("") { "%02x".format(it) }
            if (computed.lowercase() != stripped.lowercase()) {
                AnalyticsClient.fire(
                    "sdui_integrity_fail",
                    mapOf("screen_id" to screenId, "expected" to stripped, "got" to computed)
                )
                return null
            }
            String(bytes, Charsets.UTF_8)
        }.getOrNull()

    // ── Local File Cache ──────────────────────────────────────────────────────

    private fun localFile(screenId: String) = File(cacheDir, "$screenId.json")

    private fun loadLocalFile(screenId: String): String? =
        runCatching { localFile(screenId).readText(Charsets.UTF_8) }.getOrNull()

    private fun persistLocalFile(screenId: String, json: String, version: String) {
        runCatching { localFile(screenId).writeText(json, Charsets.UTF_8) }
        prefs.edit().putString(versionKey(screenId), version).apply()
    }

    // ── Bundled Baseline ──────────────────────────────────────────────────────

    private fun loadBundledBaseline(screenId: String): String? = runCatching {
        // Baselines shipped as raw resource files: res/raw/sdui_baseline_{screenId}.json
        val resName = "sdui_baseline_${screenId.replace('-', '_')}"
        val resId   = context.resources.getIdentifier(resName, "raw", context.packageName)
        if (resId == 0) return null
        context.resources.openRawResource(resId).bufferedReader().readText()
    }.getOrNull()
}
