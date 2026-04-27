package com.hsbc.dsp.kyc.splitter;

import com.hsbc.dsp.kyc.model.KYCSessionPayload;
import com.hsbc.dsp.kyc.model.KYCSessionPayload.KYCQuestion;
import com.hsbc.dsp.kyc.model.KYCSessionPayload.KYCSection;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Splits the full KYC payload into platform-appropriate steps.
 *
 * Mobile: max 3 questions per step; document upload always alone;
 *         date pickers always alone; declarations always alone.
 * Web:    full section per step; document upload alone;
 *         declarations alone; all other questions in 2-col grid.
 */
@Service
public class KYCPlatformSplitter {

    private static final int MOBILE_MAX_QUESTIONS_PER_STEP = 3;

    // Question types that always get their own step on mobile
    private static final Set<String> MOBILE_SOLO_TYPES = Set.of(
        "DOCUMENT_UPLOAD", "DECLARATION", "SIGNATURE", "DATE_PICKER"
    );

    // Question types that always get their own step on both platforms
    private static final Set<String> ALWAYS_SOLO_TYPES = Set.of(
        "DOCUMENT_UPLOAD", "DECLARATION", "SIGNATURE"
    );

    public StepPlan split(KYCSessionPayload payload, String platform,
                          Set<String> hiddenQuestionIds) {
        var steps = new ArrayList<StepPlan.Step>();
        int stepIndex = 0;

        for (var section : payload.sections()) {
            // Evaluate section-level show conditions
            if (isSectionHidden(section, hiddenQuestionIds)) continue;

            // Filter questions: remove hidden ones, keep only visible
            var visibleQuestions = section.questions().stream()
                .filter(q -> !hiddenQuestionIds.contains(q.questionId()))
                .sorted(Comparator.comparingInt(KYCQuestion::order))
                .toList();

            if (visibleQuestions.isEmpty()) continue;

            if ("web".equalsIgnoreCase(platform)) {
                steps.addAll(splitForWeb(section, visibleQuestions, stepIndex));
            } else {
                steps.addAll(splitForMobile(section, visibleQuestions, stepIndex));
            }
            stepIndex = steps.size();
        }

        // Number steps sequentially
        for (int i = 0; i < steps.size(); i++) {
            steps.get(i).setStepIndex(i + 1);
        }

        return new StepPlan(payload.kycSessionId(), platform, steps.size(), steps);
    }

    private List<StepPlan.Step> splitForMobile(KYCSection section,
                                                List<KYCQuestion> questions,
                                                int startIndex) {
        var steps = new ArrayList<StepPlan.Step>();
        var buffer = new ArrayList<KYCQuestion>();

        for (var q : questions) {
            if (ALWAYS_SOLO_TYPES.contains(q.type())) {
                // Flush buffer first
                if (!buffer.isEmpty()) {
                    steps.add(buildStep(section, buffer, "mobile", startIndex + steps.size()));
                    buffer = new ArrayList<>();
                }
                // Solo step for this question
                steps.add(buildStep(section, List.of(q), "mobile", startIndex + steps.size()));
            } else if (MOBILE_SOLO_TYPES.contains(q.type())) {
                // Solo on mobile (e.g. DATE_PICKER)
                if (!buffer.isEmpty()) {
                    steps.add(buildStep(section, buffer, "mobile", startIndex + steps.size()));
                    buffer = new ArrayList<>();
                }
                steps.add(buildStep(section, List.of(q), "mobile", startIndex + steps.size()));
            } else {
                buffer.add(q);
                if (buffer.size() >= MOBILE_MAX_QUESTIONS_PER_STEP) {
                    steps.add(buildStep(section, buffer, "mobile", startIndex + steps.size()));
                    buffer = new ArrayList<>();
                }
            }
        }

        if (!buffer.isEmpty()) {
            steps.add(buildStep(section, buffer, "mobile", startIndex + steps.size()));
        }
        return steps;
    }

    private List<StepPlan.Step> splitForWeb(KYCSection section,
                                             List<KYCQuestion> questions,
                                             int startIndex) {
        var steps = new ArrayList<StepPlan.Step>();
        var buffer = new ArrayList<KYCQuestion>();

        for (var q : questions) {
            if (ALWAYS_SOLO_TYPES.contains(q.type())) {
                if (!buffer.isEmpty()) {
                    steps.add(buildStep(section, buffer, "web", startIndex + steps.size()));
                    buffer = new ArrayList<>();
                }
                steps.add(buildStep(section, List.of(q), "web", startIndex + steps.size()));
            } else {
                buffer.add(q);
            }
        }

        // Web: entire section (minus solo items) goes in one step
        if (!buffer.isEmpty()) {
            steps.add(buildStep(section, buffer, "web", startIndex + steps.size()));
        }
        return steps;
    }

    private StepPlan.Step buildStep(KYCSection section, List<KYCQuestion> questions,
                                     String platform, int index) {
        var questionIds = questions.stream().map(KYCQuestion::questionId).toList();
        var hasDocUpload = questions.stream()
            .anyMatch(q -> "DOCUMENT_UPLOAD".equals(q.type()));
        var hasDeclaration = questions.stream()
            .anyMatch(q -> "DECLARATION".equals(q.type()));

        var layout = hasDocUpload ? "document_upload"
            : hasDeclaration ? "declaration"
            : "web".equals(platform) ? "two_column_grid"
            : "single_column";

        return new StepPlan.Step(
            "step-" + String.format("%03d", index + 1),
            index + 1,
            section.sectionId(),
            section.sectionTitle(),
            questionIds,
            layout,
            hasDocUpload,
            hasDeclaration,
            false
        );
    }

    private boolean isSectionHidden(KYCSection section, Set<String> hiddenQuestionIds) {
        // Section with no showCondition is always visible
        if (section.showCondition() == null) return false;
        // If the controlling question is in hidden set, section is hidden
        return hiddenQuestionIds.contains(section.showCondition().ifQuestionId());
    }
}
