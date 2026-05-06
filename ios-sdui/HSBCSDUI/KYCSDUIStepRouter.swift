import SwiftUI

// Routes each SDUI step to its SwiftUI view using the primary questionId.
// OBKYC Account Opening journey — 11 mobile steps matching the OCDP journey contract.
// All three platforms (iOS, Android, HarmonyNext) share this routing contract.
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

            // step-001: Personal Info + Date of Birth
            case "q_first_name":
                KYCNameStep()

            // step-002: Nationality
            case "q_nationality":
                KYCDobNationalityStep()

            // step-003: Identity Document — nationality-conditional
            // BFF sends only the relevant question(s) based on session nationality:
            //   HK → q_hkid_number, q_hkid_expiry
            //   CN → q_mainland_id
            //   other → q_passport_number, q_passport_expiry
            case "q_hkid_number", "q_mainland_id", "q_passport_number":
                KYCIdentifierStep()

            // step-004: Upload Identity Document
            case "q_hkid_front":
                KYCDocumentStep()

            // step-005: Contact Details — email + phone
            case "q_email":
                KYCContactStep()

            // step-006: Residential Address — line1 + line2 + district together
            case "q_addr_line1", "q_addr_line2", "q_addr_district":
                KYCAddressStep()

            // step-007: Employment & Income — status + annual income together
            case "q_employment_status":
                KYCEmploymentStatusStep()

            // step-008: Source of Funds & Account Purpose — together
            case "q_source_of_funds":
                KYCSourceOfFundsStep()

            // step-009: Selfie & Liveness Check
            case "q_liveness":
                KYCLivenessStep()

            // step-010: Connect Your Bank
            case "q_ob_consent":
                KYCOpenBankingStep()

            // step-011: Legal Declarations — PEP status + truthfulness + FATCA
            case "q_pep_status", "decl_truthful", "decl_fatca":
                KYCDeclarationStep()

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
