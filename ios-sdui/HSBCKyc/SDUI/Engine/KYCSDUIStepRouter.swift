import SwiftUI

// Routes stepId string → the correct KYC SwiftUI view
// All views read/write answers through the AppStore
struct KYCSDUIStepRouter: View {
    let stepId: String
    @Environment(AppStore.self) private var store

    var body: some View {
        Group {
            if stepId.contains("name") {
                KYCNameStep()
            } else if stepId.contains("dob") {
                KYCDobNationalityStep()
            } else if stepId.contains("contact") {
                KYCContactStep()
            } else if stepId.contains("identifier") {
                KYCIdentifierStep()
            } else if stepId.contains("address") {
                KYCAddressStep()
            } else if stepId.contains("document") {
                KYCDocumentStep()
            } else if stepId.contains("liveness") {
                KYCLivenessStep()
            } else if stepId.contains("wealth") {
                KYCWealthStep()
            } else if stepId.contains("openbanking") {
                KYCOpenBankingStep()
            } else if stepId.contains("declaration") {
                KYCDeclarationStep()
            } else {
                Text("Unknown step: \(stepId)")
                    .foregroundColor(Hive.Color.n500)
            }
        }
    }
}
