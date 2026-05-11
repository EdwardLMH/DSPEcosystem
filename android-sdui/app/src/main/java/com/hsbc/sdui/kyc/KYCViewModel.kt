package com.hsbc.sdui.kyc

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

import com.hsbc.sdui.analytics.TealiumClient
import com.hsbc.sdui.common.SDUILocale
import com.hsbc.sdui.common.SDUIA11y

class KYCViewModel(application: Application) : AndroidViewModel(application) {

    private val _state = MutableStateFlow(KYCUiState())
    val state: StateFlow<KYCUiState> = _state.asStateFlow()

    private val api      = KYCNetworkService.api
    private val platform = "android"
    private val locale   get() = SDUILocale.current()
    private val a11yFlags get() = SDUIA11y.flags(getApplication())

    init {
        loadConfig()
    }

    private fun loadConfig() {
        viewModelScope.launch {
            runCatching {
                val cfg = api.fetchConfig(
                    platform  = platform,
                    locale    = locale,
                    a11yFlags = a11yFlags
                )
                _state.update {
                    it.copy(
                        locale           = cfg.locale,
                        textDir          = cfg.textDir,
                        channel          = cfg.channel,
                        a11yReduceMotion = cfg.a11y.reduceMotion,
                        a11yHighContrast = cfg.a11y.highContrast,
                        a11yLargeText    = cfg.a11y.largeText,
                        a11yTalkBack     = cfg.a11y.talkBack
                    )
                }
            }
            // Non-fatal — device defaults remain active
        }
    }

    fun startSession() {
        _state.update { it.copy(isLoading = true, errorMessage = null) }
        TealiumClient.kycJourneyStarted()
        viewModelScope.launch {
            runCatching {
                val res = api.startSession(
                    platform  = platform,
                    locale    = locale,
                    a11yFlags = a11yFlags,
                    body      = mapOf("journeyType" to "PERSONAL_ACCOUNT_OPENING", "market" to "HK")
                )
                _state.update {
                    it.copy(
                        sessionId  = res.sessionId,
                        totalSteps = res.totalSteps,
                        locale     = res.locale ?: it.locale,
                        channel    = res.channel ?: it.channel
                    )
                }
                val payload = api.resume(res.sessionId, platform, locale, a11yFlags)
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
        val current   = _state.value
        val sessionId = current.sessionId ?: return
        val stepId    = current.currentStepId ?: return

        _state.update { it.copy(isSubmitting = true, validationErrors = emptyMap()) }
        TealiumClient.kycStepCompleted(stepId, current.currentStepIndex, current.sectionTitle)
        viewModelScope.launch {
            runCatching {
                val answerList = current.answers.map { (k, v) -> AnswerEntry(k, v) }
                val result = api.submitStep(sessionId, stepId, platform, locale, a11yFlags, SubmitRequest(answerList))
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
                            val payload = api.getStep(sessionId, nextStepId, platform, locale, a11yFlags)
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
                screenPayload    = payload,
                currentStepId    = payload.metadata.stepId,
                currentStepIndex = payload.metadata.stepIndex,
                totalSteps       = payload.metadata.totalSteps,
                sectionTitle     = payload.metadata.sectionTitle,
                locale           = payload.metadata.locale ?: it.locale,
                textDir          = payload.metadata.textDir ?: it.textDir,
                channel          = payload.metadata.channel ?: it.channel,
                a11yReduceMotion = payload.metadata.a11y?.reduceMotion ?: it.a11yReduceMotion,
                a11yHighContrast = payload.metadata.a11y?.highContrast ?: it.a11yHighContrast,
                a11yLargeText    = payload.metadata.a11y?.largeText    ?: it.a11yLargeText,
                a11yTalkBack     = payload.metadata.a11y?.talkBack     ?: it.a11yTalkBack,
                isLoading        = false,
                isSubmitting     = false,
                validationErrors = emptyMap(),
                errorMessage     = null
            )
        }
    }
}
