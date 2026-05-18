package com.hsbc.sdui.common

import android.content.Context
import android.os.Build
import android.view.accessibility.AccessibilityManager
import androidx.core.view.accessibility.AccessibilityManagerCompat
import java.util.Locale

// ─── Locale helpers ───────────────────────────────────────────────────────────

object SDUILocale {
    /** BCP-47 authoring locale code from device settings. */
    fun current(): String {
        val locale = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            Locale.getDefault(Locale.Category.DISPLAY)
        } else {
            Locale.getDefault()
        }
        val lang   = locale.language  // e.g. "zh", "en", "ar"
        val country = locale.country  // e.g. "HK", "CN", "TW"
        return when {
            lang == "zh" && (country == "CN" || country == "SG") -> "zh-CN"
            lang == "zh" -> "zh-HK"
            lang == "ar" -> "ar"
            lang == "es" -> "es"
            else -> "en"
        }
    }

    val RTL_LOCALES = setOf("ar", "he", "fa", "ur")

    fun isRTL(localeCode: String) = localeCode in RTL_LOCALES
}

// ─── Supported locales ────────────────────────────────────────────────────────

data class LocaleInfo(val code: String, val label: String, val bcp47: String, val isRTL: Boolean)

val SUPPORTED_LOCALES = listOf(
    LocaleInfo("en",    "English",   "en",      false),
    LocaleInfo("zh-HK", "繁體中文（香港）",  "zh-Hant-HK", false),
    LocaleInfo("zh-CN", "简体中文",  "zh-Hans", false),
    LocaleInfo("ar",    "العربية",  "ar",      true),
    LocaleInfo("es",    "Español",   "es",      false),
)

// ─── Accessibility helpers ────────────────────────────────────────────────────

object SDUIA11y {
    /** Comma-separated list of active accessibility flags to send to BFF. */
    fun flags(context: Context): String {
        val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
        val flags = mutableListOf<String>()
        if (am?.isEnabled == true) {
            val services = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                am.installedAccessibilityServiceList
            } else emptyList()
            val talkBackRunning = services.any { it.resolveInfo.serviceInfo.packageName == "com.google.android.marvin.talkback" }
            if (talkBackRunning) flags.add("talkBack")
        }
        // Font scale > 1.3 approximates "large text" preference
        val fontScale = context.resources.configuration.fontScale
        if (fontScale >= 1.3f) flags.add("largeText")
        return flags.joinToString(",")
    }
}
