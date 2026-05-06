package com.hsbc.sdui.kyc

import androidx.compose.runtime.Composable

@Composable
fun KYCStepRouter(
    stepId: String,
    answers: Map<String, Any>,
    onAnswer: (String, Any) -> Unit
) {
    // Routes by primary question ID (first question ID in the step payload).
    // OBKYC journey — 11 mobile steps.
    val primaryQuestion = answers["__primaryQuestion"] as? String ?: stepId

    when {
        // step-001: Personal Info — first name + last name + DOB
        primaryQuestion.contains("q_first_name") -> KYCNameStep(answers, onAnswer)

        // step-002: Nationality
        primaryQuestion.contains("q_nationality") -> KYCNationalityStep(answers, onAnswer)

        // step-003: Identity Document (nationality-conditional variant)
        primaryQuestion.contains("q_hkid_number")     -> KYCHKIDStep(answers, onAnswer)
        primaryQuestion.contains("q_mainland_id")     -> KYCMainlandIDStep(answers, onAnswer)
        primaryQuestion.contains("q_passport_number") -> KYCPassportStep(answers, onAnswer)

        // step-004: Upload Identity Document
        primaryQuestion.contains("q_hkid_front") -> KYCDocumentStep(onAnswer)

        // step-005: Contact Details — email + phone
        primaryQuestion.contains("q_email") -> KYCContactStep(answers, onAnswer)

        // step-006: Residential Address — line1 + line2 + district (one screen)
        primaryQuestion.contains("q_addr_line1") -> KYCAddressStep(answers, onAnswer)

        // step-007: Employment & Income — employment status + annual income (one screen)
        primaryQuestion.contains("q_employment_status") -> KYCEmploymentIncomeStep(answers, onAnswer)

        // step-008: Source of Funds + Purpose of Account (one screen)
        primaryQuestion.contains("q_source_of_funds") -> KYCSourceOfFundsStep(answers, onAnswer)

        // step-009: Selfie & Liveness Check
        primaryQuestion.contains("q_liveness") -> KYCLivenessStep(onAnswer)

        // step-010: Connect Your Bank
        primaryQuestion.contains("q_ob_consent") -> KYCOpenBankingStep(onAnswer)

        // step-011: Legal Declarations — PEP status + truthfulness + FATCA
        primaryQuestion.contains("q_pep_status") -> KYCDeclarationStep(answers, onAnswer)

        else -> androidx.compose.material3.Text(
            "Unknown step: $stepId / $primaryQuestion",
            color = androidx.compose.ui.graphics.Color(0xFF999999)
        )
    }
}
