import SwiftUI

@main
struct HSBCKycApp: App {
    @State private var store = AppStore()

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environment(store)
                .preferredColorScheme(.light)
        }
    }
}

// MARK: - Root Tab View (mirrors HarmonyNext Index.ets)

struct RootTabView: View {
    var body: some View {
        TabView {
            KYCRootView()
                .tabItem {
                    Label("OBKYC", systemImage: "creditcard.and.123")
                }

            WealthPageView()
                .tabItem {
                    Label("Wealth", systemImage: "chart.line.uptrend.xyaxis")
                }
        }
        .tint(Hive.Color.brandPrimary)
    }
}
