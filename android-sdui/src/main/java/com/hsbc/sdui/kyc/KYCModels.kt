package com.hsbc.sdui.kyc

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

// ─── Network DTOs ─────────────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class SDUIScreenPayload(
    @Json(name = "schemaVersion") val schemaVersion: String,
    @Json(name = "screen")        val screen: String,
    @Json(name = "metadata")      val metadata: KYCStepMetadata,
    @Json(name = "layout")        val layout: KYCSDUINode
)

@JsonClass(generateAdapter = true)
data class KYCStepMetadata(
    @Json(name = "sessionId")    val sessionId: String,
    @Json(name = "stepId")       val stepId: String,
    @Json(name = "stepIndex")    val stepIndex: Int,
    @Json(name = "totalSteps")   val totalSteps: Int,
    @Json(name = "sectionTitle") val sectionTitle: String,
    @Json(name = "platform")     val platform: String
)

@JsonClass(generateAdapter = true)
data class KYCSDUINode(
    @Json(name = "type")     val type: String,
    @Json(name = "id")       val id: String,
    @Json(name = "props")    val props: Map<String, Any?>? = null,
    @Json(name = "children") val children: List<KYCSDUINode>? = null
)

@JsonClass(generateAdapter = true)
data class StartSessionResponse(
    @Json(name = "sessionId")   val sessionId: String,
    @Json(name = "totalSteps")  val totalSteps: Int,
    @Json(name = "platform")    val platform: String
)

@JsonClass(generateAdapter = true)
data class SubmitRequest(
    @Json(name = "answers") val answers: List<AnswerEntry>
)

@JsonClass(generateAdapter = true)
data class AnswerEntry(
    @Json(name = "questionId") val questionId: String,
    @Json(name = "value")      val value: Any
)

@JsonClass(generateAdapter = true)
data class SubmitResponse(
    @Json(name = "status")           val status: String,
    @Json(name = "nextStepId")       val nextStepId: String? = null,
    @Json(name = "totalSteps")       val totalSteps: Int? = null,
    @Json(name = "validationErrors") val validationErrors: List<ValidationErrorDto>? = null
)

@JsonClass(generateAdapter = true)
data class ValidationErrorDto(
    @Json(name = "questionId") val questionId: String,
    @Json(name = "message")    val message: String
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
