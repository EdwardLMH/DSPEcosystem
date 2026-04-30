package com.hsbc.sdui.kyc

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

import com.hsbc.sdui.analytics.TealiumClient

class KYCViewModel : ViewModel() {

    private val _state = MutableStateFlow(KYCUiState())
    val state: StateFlow<KYCUiState> = _state.asStateFlow()

    private val api = KYCNetworkService.api
    private val platform = "android"

    fun startSession() {
        _state.update { it.copy(isLoading = true, errorMessage = null) }
        TealiumClient.kycJourneyStarted()
        viewModelScope.launch {
            runCatching {
                val res = api.startSession(
                    platform = platform,
                    body = mapOf("journeyType" to "PERSONAL_ACCOUNT_OPENING", "market" to "HK")
                )
                _state.update { it.copy(sessionId = res.sessionId, totalSteps = res.totalSteps) }
                val payload = api.resume(res.sessionId, platform)
                applyPayload(payload)
            }.onFailure { err ->
                _state.update {
                    it.copy(isLoading = false, errorMessage = "Cannot connect to server. Is the mock BFF running?\n${err.message}")
                }
            }
        }
    }

    fun setAnswer(questionId: String, value: Any) {
        _state.update { it.copy(answers = it.answers + (questionId to value)) }
    }

    fun submitStep() {
        val current = _state.value
        val sessionId = current.sessionId ?: return
        val stepId = current.currentStepId ?: return

        _state.update { it.copy(isSubmitting = true, validationErrors = emptyMap()) }
        TealiumClient.kycStepCompleted(stepId, current.currentStepIndex, current.sectionTitle)
        viewModelScope.launch {
            runCatching {
                val answerList = current.answers.map { (k, v) -> AnswerEntry(k, v) }
                val result = api.submitStep(sessionId, stepId, SubmitRequest(answerList))
                when (result.status) {
                    "COMPLETE" -> {
                        TealiumClient.kycJourneyCompleted()
                        _state.update { it.copy(isSubmitting = false, isComplete = true) }
                    }
                    "NEXT_STEP" -> {
                        _state.update { s ->
                            s.copy(totalSteps = result.totalSteps ?: s.totalSteps)
                        }
                        val nextStepId = result.nextStepId
                        if (nextStepId != null) {
                            val payload = api.getStep(sessionId, nextStepId, platform)
                            applyPayload(payload)
                        }
                    }
                    "INVALID" -> {
                        val errors = result.validationErrors
                            ?.associate { it.questionId to it.message }
                            ?: emptyMap()
                        _state.update { it.copy(isSubmitting = false, validationErrors = errors) }
                    }
                    else -> _state.update { it.copy(isSubmitting = false) }
                }
            }.onFailure { err ->
                _state.update {
                    it.copy(isSubmitting = false, errorMessage = "Submission failed: ${err.message}")
                }
            }
        }
    }

    private fun applyPayload(payload: SDUIScreenPayload) {
        TealiumClient.kycStepViewed(
            stepId     = payload.metadata.stepId,
            stepIndex  = payload.metadata.stepIndex,
            totalSteps = payload.metadata.totalSteps,
            section    = payload.metadata.sectionTitle
        )
        _state.update {
            it.copy(
                screenPayload = payload,
                currentStepId = payload.metadata.stepId,
                currentStepIndex = payload.metadata.stepIndex,
                totalSteps = payload.metadata.totalSteps,
                sectionTitle = payload.metadata.sectionTitle,
                isLoading = false,
                isSubmitting = false,
                validationErrors = emptyMap(),
                errorMessage = null
            )
        }
    }
}
