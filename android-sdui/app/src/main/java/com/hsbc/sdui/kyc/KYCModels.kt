package com.hsbc.sdui.kyc

import com.google.gson.annotations.SerializedName

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
    @SerializedName("platform")     val platform: String
)

data class KYCSDUINode(
    @SerializedName("type")     val type: String,
    @SerializedName("id")       val id: String,
    @SerializedName("props")    val props: Map<String, Any?>? = null,
    @SerializedName("children") val children: List<KYCSDUINode>? = null
)

data class StartSessionResponse(
    @SerializedName("sessionId")   val sessionId: String,
    @SerializedName("totalSteps")  val totalSteps: Int,
    @SerializedName("platform")    val platform: String
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
    val errorMessage: String? = null
)
