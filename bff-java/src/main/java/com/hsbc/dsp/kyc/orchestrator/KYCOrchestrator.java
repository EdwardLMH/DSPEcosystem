package com.hsbc.dsp.kyc.orchestrator;

import com.hsbc.dsp.kyc.model.KYCSessionPayload;
import com.hsbc.dsp.kyc.model.KYCSessionPayload.*;
import com.hsbc.dsp.kyc.splitter.KYCPlatformSplitter;
import com.hsbc.dsp.kyc.splitter.StepPlan;
import com.hsbc.dsp.sdui.model.LayoutNode;
import com.hsbc.dsp.sdui.model.ScreenPayload;
import com.hsbc.dsp.sdui.model.ScreenMetadata;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Orchestrates KYC step navigation and SDUI JSON composition.
 * Handles: step plan creation, step retrieval, answer processing,
 * branch evaluation, and session resume.
 */
@Service
public class KYCOrchestrator {

    private static final Duration SESSION_TTL = Duration.ofHours(72);
    private static final String PLAN_KEY   = "kyc:plan:";
    private static final String ANSWER_KEY = "kyc:answers:";
    private static final String HIDDEN_KEY = "kyc:hidden:";

    private final KYCBackendClient kycBackend;
    private final KYCPlatformSplitter splitter;
    private final KYCSDUIComposer sduiComposer;
    private final RedisTemplate<String, Object> redis;
    private final KYCAuditLogger auditLogger;

    public KYCOrchestrator(KYCBackendClient kycBackend,
                            KYCPlatformSplitter splitter,
                            KYCSDUIComposer sduiComposer,
                            RedisTemplate<String, Object> redis,
                            KYCAuditLogger auditLogger) {
        this.kycBackend    = kycBackend;
        this.splitter      = splitter;
        this.sduiComposer  = sduiComposer;
        this.redis         = redis;
        this.auditLogger   = auditLogger;
    }

    /** Start or resume a KYC session. Returns SDUI JSON for the current step. */
    public ScreenPayload getStep(String sessionId, String stepId,
                                  String platform, String userId) {
        var plan    = loadOrBuildPlan(sessionId, platform);
        var answers = loadAnswers(sessionId);
        var hidden  = loadHiddenQuestions(sessionId);
        var payload = kycBackend.getSession(sessionId);

        var step = stepId != null
            ? plan.findStep(stepId)
            : plan.currentIncompleteStep();

        auditLogger.logStepViewed(sessionId, step.stepId(), userId, platform);

        return sduiComposer.compose(payload, step, plan, answers, hidden, platform);
    }

    /** Submit answers for a step. Evaluates branches, returns next step info. */
    public StepSubmitResult submitStep(String sessionId, String stepId,
                                       List<AnswerEntry> answers, String userId) {
        // Forward answers to KYC backend for authoritative validation
        var backendResult = kycBackend.submitAnswers(sessionId, stepId, answers);

        if (!backendResult.valid()) {
            return StepSubmitResult.invalid(backendResult.validationErrors());
        }

        // Persist answers in Redis
        saveAnswers(sessionId, answers);

        // Process branching rules triggered by these answers
        var plan   = loadPlan(sessionId);
        var hidden = loadHiddenQuestions(sessionId);

        for (var answer : answers) {
            var triggered = backendResult.triggeredBranches();
            if (triggered != null) {
                for (var branch : triggered) {
                    if (branch.action().equals("SHOW_QUESTIONS")) {
                        hidden.removeAll(branch.targetIds());
                    } else if (branch.action().equals("HIDE_QUESTIONS")) {
                        hidden.addAll(branch.targetIds());
                    }
                }
            }
        }

        // Rebuild step plan with updated hidden set
        var fullPayload = kycBackend.getSession(sessionId);
        var newPlan = splitter.split(fullPayload, plan.platform(), hidden);

        // Persist updated plan and hidden set
        savePlan(sessionId, newPlan);
        saveHiddenQuestions(sessionId, hidden);

        // Mark current step complete
        newPlan.markStepComplete(stepId);

        auditLogger.logStepSubmitted(sessionId, stepId, userId, answers.size());

        var nextStep = newPlan.nextStep(stepId);
        return nextStep != null
            ? StepSubmitResult.nextStep(nextStep.stepId(), newPlan.totalSteps())
            : StepSubmitResult.complete(sessionId);
    }

    /** Resume: returns SDUI JSON for the first incomplete step. */
    public ScreenPayload resume(String sessionId, String platform, String userId) {
        return getStep(sessionId, null, platform, userId);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private StepPlan loadOrBuildPlan(String sessionId, String platform) {
        var existing = loadPlan(sessionId);
        if (existing != null) return existing;

        var fullPayload = kycBackend.getSession(sessionId);
        var hidden = loadHiddenQuestions(sessionId);
        var plan = splitter.split(fullPayload, platform, hidden);
        savePlan(sessionId, plan);
        return plan;
    }

    @SuppressWarnings("unchecked")
    private StepPlan loadPlan(String sessionId) {
        return (StepPlan) redis.opsForValue().get(PLAN_KEY + sessionId);
    }

    private void savePlan(String sessionId, StepPlan plan) {
        redis.opsForValue().set(PLAN_KEY + sessionId, plan, SESSION_TTL);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> loadAnswers(String sessionId) {
        var val = redis.opsForValue().get(ANSWER_KEY + sessionId);
        return val instanceof Map ? (Map<String, Object>) val : new HashMap<>();
    }

    private void saveAnswers(String sessionId, List<AnswerEntry> newAnswers) {
        var existing = loadAnswers(sessionId);
        for (var a : newAnswers) existing.put(a.questionId(), a.value());
        redis.opsForValue().set(ANSWER_KEY + sessionId, existing, SESSION_TTL);
    }

    @SuppressWarnings("unchecked")
    private Set<String> loadHiddenQuestions(String sessionId) {
        var val = redis.opsForValue().get(HIDDEN_KEY + sessionId);
        return val instanceof Set ? (Set<String>) val : new HashSet<>();
    }

    private void saveHiddenQuestions(String sessionId, Set<String> hidden) {
        redis.opsForValue().set(HIDDEN_KEY + sessionId, hidden, SESSION_TTL);
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────

    public record AnswerEntry(String questionId, Object value) {}

    public record StepSubmitResult(
        String status,           // NEXT_STEP | COMPLETE | INVALID
        String nextStepId,
        int totalSteps,
        String sessionId,
        List<ValidationError> validationErrors
    ) {
        public static StepSubmitResult nextStep(String nextStepId, int total) {
            return new StepSubmitResult("NEXT_STEP", nextStepId, total, null, null);
        }
        public static StepSubmitResult complete(String sessionId) {
            return new StepSubmitResult("COMPLETE", null, 0, sessionId, null);
        }
        public static StepSubmitResult invalid(List<ValidationError> errors) {
            return new StepSubmitResult("INVALID", null, 0, null, errors);
        }
    }

    public record ValidationError(String questionId, String message) {}
}
