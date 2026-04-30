package com.hsbc.sdui.kyc

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

/**
 * KYCStepRouter
 *
 * ROUTING CONTRACT (mirrors iOS KYCSDUIStepRouter.swift):
 *   Routes on the PRIMARY QUESTION ID — the first questionId found in
 *   payload.layout.children[].props["questionId"].
 *   The BFF returns sequential step IDs ("step-001", "step-002" …) that carry
 *   NO semantic meaning, so stepId is NOT used for routing.
 *
 * BFF step → primary question → composable:
 *   step-001  q_first_name          KYCNameDobStep
 *   step-002  q_nationality         KYCNationalityStep
 *   step-003  q_hkid_number         KYCHKIDStep
 *             q_mainland_id         KYCMainlandIDStep
 *             q_passport_number     KYCPassportStep
 *   step-004  q_hkid_front          KYCDocumentStep
 *   step-005  q_email               KYCContactStep
 *   step-006  q_addr_line1          KYCAddressLinesStep
 *   step-007  q_addr_district       KYCAddressDistrictStep
 *   step-008  q_employment_status   KYCEmploymentStep
 *   step-009  q_annual_income       KYCAnnualIncomeStep
 *   step-010  q_source_of_funds     KYCSourceOfFundsStep
 *   step-011  q_account_purpose     KYCAccountPurposeStep
 *   step-012  q_liveness            KYCLivenessStep
 *   step-013  q_ob_consent          KYCOpenBankingStep
 *   step-014  q_pep_status          KYCDeclarationStep
 */
@Composable
fun KYCStepRouter(
    primaryQuestionId: String,
    stepId: String,           // kept for debug fallback only
    answers: Map<String, Any>,
    onAnswer: (String, Any) -> Unit
) {
    when (primaryQuestionId) {
        "q_first_name"        -> KYCNameDobStep(answers, onAnswer)
        "q_nationality"       -> KYCNationalityStep(answers, onAnswer)
        "q_hkid_number"       -> KYCHKIDStep(answers, onAnswer)
        "q_mainland_id"       -> KYCMainlandIDStep(answers, onAnswer)
        "q_passport_number"   -> KYCPassportStep(answers, onAnswer)
        "q_hkid_front"        -> KYCDocumentStep(answers, onAnswer)
        "q_email"             -> KYCContactStep(answers, onAnswer)
        "q_addr_line1",
        "q_addr_line2"        -> KYCAddressLinesStep(answers, onAnswer)
        "q_addr_district"     -> KYCAddressDistrictStep(answers, onAnswer)
        "q_employment_status" -> KYCEmploymentStep(answers, onAnswer)
        "q_annual_income"     -> KYCAnnualIncomeStep(answers, onAnswer)
        "q_source_of_funds"   -> KYCSourceOfFundsStep(answers, onAnswer)
        "q_account_purpose"   -> KYCAccountPurposeStep(answers, onAnswer)
        "q_liveness"          -> KYCLivenessStep(onAnswer)
        "q_ob_consent"        -> KYCOpenBankingStep(onAnswer)
        "q_pep_status",
        "decl_truthful",
        "decl_fatca"          -> KYCDeclarationStep(answers, onAnswer)
        else -> Text(
            text = if (primaryQuestionId.isEmpty())
                "Unknown step: $stepId\n(no children in SDUI payload)"
            else
                "Unknown question: $primaryQuestionId\n(step: $stepId)",
            color = Color(0xFF999999)
        )
    }
}

/** Title string for the step heading — mirrors iOS KYCStepTitleView */
fun kycStepTitle(primaryQuestionId: String): String = when (primaryQuestionId) {
    "q_first_name"        -> "👤 Full Legal Name & Date of Birth"
    "q_nationality"       -> "🌍 Nationality"
    "q_hkid_number"       -> "🪪 Hong Kong Identity Card"
    "q_mainland_id"       -> "🪪 Mainland China ID"
    "q_passport_number"   -> "🛂 Passport"
    "q_hkid_front"        -> "📄 Upload Identity Document"
    "q_email"             -> "📱 Contact Details"
    "q_addr_line1",
    "q_addr_line2"        -> "🏠 Residential Address"
    "q_addr_district"     -> "📍 District"
    "q_employment_status" -> "💼 Employment Status"
    "q_annual_income"     -> "💰 Annual Income"
    "q_source_of_funds"   -> "🏦 Source of Funds"
    "q_account_purpose"   -> "🎯 Purpose of Account"
    "q_liveness"          -> "😊 Selfie & Liveness Check"
    "q_ob_consent"        -> "🏦 Connect Your Bank"
    "q_pep_status",
    "decl_truthful",
    "decl_fatca"          -> "✍️ Legal Declarations"
    else                  -> "📋 Application"
}
