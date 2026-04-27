import SwiftUI

@main
struct HSBCKycApp: App {
    @State private var store = AppStore()

    var body: some Scene {
        WindowGroup {
            KYCRootView()
                .environment(store)
                .preferredColorScheme(.light)
        }
    }
}
