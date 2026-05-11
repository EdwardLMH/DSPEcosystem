package com.hsbc.sdui.kyc

import com.google.gson.annotations.SerializedName

// ─── BFF Config bootstrap ─────────────────────────────────────────────────────

data class BFFConfig(
    @SerializedName("locale")           val locale: String,
    @SerializedName("textDir")          val textDir: String,
    @SerializedName("supportedLocales") val supportedLocales: List<String>,
    @SerializedName("channel")          val channel: String,
    @SerializedName("platform")         val platform: String,
    @SerializedName("a11y")             val a11y: BFFAccessibility,
    @SerializedName("featureFlags")     val featureFlags: Map<String, Boolean>,
    @SerializedName("wcag")             val wcag: BFFWCAGConfig
)

data class BFFAccessibility(
    @SerializedName("reduceMotion") val reduceMotion: Boolean = false,
    @SerializedName("highContrast") val highContrast: Boolean = false,
    @SerializedName("largeText")    val largeText: Boolean = false,
    @SerializedName("talkBack")     val talkBack: Boolean = false,
    @SerializedName("screenReader") val screenReader: Boolean = false
)

data class BFFWCAGConfig(
    @SerializedName("level")   val level: String,
    @SerializedName("version") val version: String
)

// ─── Network DTOs ─────────────────────────────────────────────────────────────

data class SDUIScreenPayload(
    @SerializedName("schemaVersion") val schemaVersion: String,
    @SerializedName("screen")        val screen: String,
    @SerializedName("metadata")      val metadata: KYCStepMetadata,
    @SerializedName("layout")        val layout: KYCSDUINode
)

data class KYCStepMetadata(
    @SerializedName("sessionId")    val sessionId: String,
    @SerializedName("stepId")       val stepId: String,
    @SerializedName("stepIndex")    val stepIndex: Int,
    @SerializedName("totalSteps")   val totalSteps: Int,
    @SerializedName("sectionTitle") val sectionTitle: String,
    @SerializedName("platform")     val platform: String,
    @SerializedName("locale")       val locale: String? = null,
    @SerializedName("textDir")      val textDir: String? = null,
    @SerializedName("channel")      val channel: String? = null,
    @SerializedName("a11y")         val a11y: BFFAccessibility? = null
)

data class KYCSDUINode(
    @SerializedName("type")     val type: String,
    @SerializedName("id")       val id: String,
    @SerializedName("props")    val props: Map<String, Any?>? = null,
    @SerializedName("children") val children: List<KYCSDUINode>? = null
)

data class StartSessionResponse(
    @SerializedName("sessionId")  val sessionId: String,
    @SerializedName("totalSteps") val totalSteps: Int,
    @SerializedName("platform")   val platform: String,
    @SerializedName("locale")     val locale: String? = null,
    @SerializedName("channel")    val channel: String? = null
)

data class SubmitRequest(
    @SerializedName("answers") val answers: List<AnswerEntry>
)

data class AnswerEntry(
    @SerializedName("questionId") val questionId: String,
    @SerializedName("value")      val value: Any
)

data class SubmitResponse(
    @SerializedName("status")           val status: String,
    @SerializedName("nextStepId")       val nextStepId: String? = null,
    @SerializedName("totalSteps")       val totalSteps: Int? = null,
    @SerializedName("validationErrors") val validationErrors: List<ValidationErrorDto>? = null
)

data class ValidationErrorDto(
    @SerializedName("questionId") val questionId: String,
    @SerializedName("message")    val message: String
)

// ─── UI State ─────────────────────────────────────────────────────────────────

data class KYCUiState(
    val sessionId: String? = null,
    val currentStepId: String? = null,
    val currentStepIndex: Int = 0,
    val totalSteps: Int = 0,
    val sectionTitle: String = "",
    val screenPayload: SDUIScreenPayload? = null,
    val answers: Map<String, Any> = emptyMap(),
    val validationErrors: Map<String, String> = emptyMap(),
    val isLoading: Boolean = false,
    val isSubmitting: Boolean = false,
    val isComplete: Boolean = false,
    val errorMessage: String? = null,
    // i18n + a11y + channel (populated from BFF config/metadata)
    val locale: String = "en",
    val textDir: String = "ltr",
    val channel: String = "SDUI",
    val a11yReduceMotion: Boolean = false,
    val a11yHighContrast: Boolean = false,
    val a11yLargeText: Boolean = false,
    val a11yTalkBack: Boolean = false
)
