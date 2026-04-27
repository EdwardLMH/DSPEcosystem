import SwiftUI

// Routes each SDUI step to its SwiftUI view using the primary questionId.
// Step count is now 14 (CN) or 14 (HK) — all personal info on step-001.
// .id(stepId) forces SwiftUI to destroy/recreate the view tree on every step change.
struct KYCSDUIStepRouter: View {
    let stepId: String
    let sectionTitle: String
    let questionIds: [String]
    @Environment(AppStore.self) private var store

    private var primaryQuestion: String { questionIds.first ?? "" }

    var body: some View {
        Group {
            switch primaryQuestion {

            // step-001: q_first_name + q_last_name + q_date_of_birth (all together now)
            case "q_first_name":
                KYCNameDobStep()

            // step-002: q_nationality
            case "q_nationality":
                KYCNationalityStep()

            // step-003: Identity — shown questions depend on nationality stored in store.answers
            case "q_hkid_number":
                KYCHKIDStep()

            case "q_mainland_id":
                KYCMainlandIDStep()

            case "q_passport_number":
                KYCPassportStep()

            // step-004: q_hkid_front (document upload)
            case "q_hkid_front":
                KYCDocumentStep()

            // step-005: q_email + q_phone
            case "q_email":
                KYCContactStep()

            // step-006: q_addr_line1 + q_addr_line2
            case "q_addr_line1", "q_addr_line2":
                KYCAddressStep()

            // step-007: q_addr_district
            case "q_addr_district":
                KYCAddressDistrictStep()

            // step-008: q_employment_status
            case "q_employment_status":
                KYCEmploymentStep()

            // step-009: q_annual_income
            case "q_annual_income":
                KYCAnnualIncomeStep()

            // step-010: q_source_of_funds
            case "q_source_of_funds":
                KYCSourceOfFundsStep()

            // step-011: q_account_purpose
            case "q_account_purpose":
                KYCAccountPurposeStep()

            // step-012: q_liveness
            case "q_liveness":
                KYCLivenessStep()

            // step-013: q_ob_consent
            case "q_ob_consent":
                KYCOpenBankingStep()

            // step-014: q_pep_status + decl_truthful + decl_fatca (all declarations)
            case "q_pep_status":
                KYCDeclarationStep()

            // Standalone declaration steps (fallback if declarations split)
            case "decl_truthful", "decl_fatca":
                KYCFatcaStep()

            default:
                VStack(spacing: Hive.Spacing.s4) {
                    Image(systemName: "questionmark.circle.fill")
                        .font(.system(size: 40)).foregroundColor(Hive.Color.n300)
                    Text(sectionTitle)
                        .font(Hive.Typography.headingSm).foregroundColor(Hive.Color.n600)
                    Text("Q: \(primaryQuestion)  Step: \(stepId)")
                        .font(Hive.Typography.caption).foregroundColor(Hive.Color.n400)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity).padding(Hive.Spacing.s8)
            }
        }
        .id(stepId)
    }
}
