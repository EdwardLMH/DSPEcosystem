package com.hsbc.sdui.kyc

import androidx.compose.runtime.Composable

@Composable
fun KYCStepRouter(
    stepId: String,
    answers: Map<String, Any>,
    onAnswer: (String, Any) -> Unit
) {
    when {
        stepId.contains("name")        -> KYCNameStep(answers, onAnswer)
        stepId.contains("dob")         -> KYCDobNationalityStep(answers, onAnswer)
        stepId.contains("contact")     -> KYCContactStep(answers, onAnswer)
        stepId.contains("identifier")  -> KYCIdentifierStep(answers, onAnswer)
        stepId.contains("address")     -> KYCAddressStep(answers, onAnswer)
        stepId.contains("document")    -> KYCDocumentStep(answers, onAnswer)
        stepId.contains("liveness")    -> KYCLivenessStep(onAnswer)
        stepId.contains("wealth")      -> KYCWealthStep(answers, onAnswer)
        stepId.contains("openbanking") -> KYCOpenBankingStep(onAnswer)
        stepId.contains("declaration") -> KYCDeclarationStep(answers, onAnswer)
        else -> androidx.compose.material3.Text(
            "Unknown step: $stepId",
            color = androidx.compose.ui.graphics.Color(0xFF999999)
        )
    }
}
