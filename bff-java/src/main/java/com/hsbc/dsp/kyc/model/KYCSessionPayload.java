package com.hsbc.dsp.kyc.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

/** Raw KYC payload as returned by the KYC backend system. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record KYCSessionPayload(
    String kycSessionId,
    String applicantId,
    String journeyType,          // PERSONAL_ACCOUNT_OPENING | BUSINESS_ACCOUNT | UPGRADE
    String market,               // HK | CN | SG
    String regulatoryStandard,   // HKMA_CDD | MAS_CDD | PBOC_CDD
    int totalQuestions,
    int completedQuestions,
    List<KYCSection> sections
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record KYCSection(
        String sectionId,
        String sectionTitle,
        int order,
        ShowCondition showCondition,
        List<KYCQuestion> questions
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record KYCQuestion(
        String questionId,
        int order,
        String type,              // TEXT_INPUT | DATE_PICKER | SINGLE_SELECT | MULTI_SELECT |
                                  // DOCUMENT_UPLOAD | ADDRESS_BLOCK | DECLARATION | SIGNATURE
        String label,
        String placeholder,
        String helpText,
        List<SelectOption> options,
        ValidationRules validation,
        List<BranchingRule> branchingRules,
        Object answerValue,
        String answeredAt
    ) {}

    public record SelectOption(String value, String label) {}

    public record ValidationRules(
        boolean required,
        Integer minLength,
        Integer maxLength,
        String pattern,
        String errorMessage,
        Integer minAge,
        Integer maxAge
    ) {}

    public record BranchingRule(
        String ifValue,
        List<String> thenShowQuestions,
        List<String> thenHideQuestions,
        String thenShowSection,
        String thenHideSection
    ) {}

    public record ShowCondition(
        String ifQuestionId,
        List<String> ifValue
    ) {}
}
