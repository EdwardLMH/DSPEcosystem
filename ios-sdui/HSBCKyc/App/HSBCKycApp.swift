import SwiftUI

@main
struct HSBCKycApp: App {
    @State private var store = AppStore()

    var body: some Scene {
        WindowGroup {
            HSBCHomeView()
                .environment(store)
                .preferredColorScheme(.light)
        }
    }
}

// ─── Home / Journey Selector ──────────────────────────────────────────────────

struct HSBCHomeView: View {
    @State private var journey: Journey? = nil

    enum Journey { case kyc, wealth }

    var body: some View {
        Group {
            if let j = journey {
                switch j {
                case .kyc:    KYCRootView().environment(AppStore())
                case .wealth: WealthPageView()
                }
            } else {
                JourneySelectorView(onSelect: { journey = $0 })
            }
        }
        .animation(.easeInOut(duration: 0.25), value: journey != nil)
    }
}

// ─── Journey Selector Screen ──────────────────────────────────────────────────

private struct JourneySelectorView: View {
    let onSelect: (HSBCHomeView.Journey) -> Void

    var body: some View {
        ZStack {
            Hive.Color.n50.ignoresSafeArea()

            VStack(spacing: 0) {
                // HSBC red accent bar
                Rectangle().fill(Hive.Color.brandPrimary).frame(height: 5)

                ScrollView(showsIndicators: false) {
                    VStack(spacing: Hive.Spacing.s6) {
                        // Logo + greeting
                        VStack(alignment: .leading, spacing: Hive.Spacing.s3) {
                            HSBCLogoRow()
                            Text("Welcome to\nHSBC Test App")
                                .font(Hive.Typography.displayLarge)
                                .foregroundColor(Hive.Color.n900)
                                .lineSpacing(4)
                            Text("Select a journey to launch in the simulator")
                                .font(Hive.Typography.bodyBase)
                                .foregroundColor(Hive.Color.n500)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, Hive.Spacing.s6)
                        .padding(.top, Hive.Spacing.s6)

                        // Journey cards
                        VStack(spacing: Hive.Spacing.s4) {
                            JourneyCard(
                                icon: "🏦",
                                badge: "Wealth Hub HK",
                                title: "Home – Wealth Hub",
                                description: "The UCP-driven Wealth Hub HK page with HeaderNav, QuickAccess, PromoBanner, FunctionGrid, AI Assistant, Flash Loan, Wealth Selection, Rankings and Life Deals.",
                                tags: ["SDUI", "Tealium Analytics", "zh-HK"],
                                accentColor: Hive.Color.brandPrimary,
                                action: { onSelect(.wealth) }
                            )

                            JourneyCard(
                                icon: "🪪",
                                badge: "OBKYC",
                                title: "Open Banking Account Opening",
                                description: "Full 10-step KYC journey: Personal Details → Identity Verification → Due Diligence → Open Banking → Declarations. Connects to mock BFF on port 4000.",
                                tags: ["KYC", "Tealium Analytics", "HKMA"],
                                accentColor: Color(hex: "#005EB8"),
                                action: { onSelect(.kyc) }
                            )
                        }
                        .padding(.horizontal, Hive.Spacing.s4)

                        // Prerequisites note
                        VStack(alignment: .leading, spacing: Hive.Spacing.s2) {
                            Text("Prerequisites").font(Hive.Typography.labelBase)
                                .foregroundColor(Hive.Color.n700)
                            ForEach([
                                ("🖥", "Mock BFF running on localhost:4000"),
                                ("📡", "Simulator routed to 127.0.0.1 (auto)"),
                                ("🔑", "No authentication required in dev mode"),
                            ], id: \.0) { icon, text in
                                HStack(spacing: Hive.Spacing.s2) {
                                    Text(icon).font(.system(size: 13))
                                    Text(text).font(Hive.Typography.caption)
                                        .foregroundColor(Hive.Color.n500)
                                }
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(Hive.Spacing.s4)
                        .background(Hive.Color.n100)
                        .cornerRadius(Hive.Radius.md)
                        .padding(.horizontal, Hive.Spacing.s4)

                        Spacer().frame(height: Hive.Spacing.s6)
                    }
                }
            }
        }
    }
}

// ─── Journey Card ─────────────────────────────────────────────────────────────

private struct JourneyCard: View {
    let icon: String
    let badge: String
    let title: String
    let description: String
    let tags: [String]
    let accentColor: Color
    let action: () -> Void

    @State private var pressed = false

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
                // Header row
                HStack(alignment: .top, spacing: Hive.Spacing.s4) {
                    ZStack {
                        accentColor.opacity(0.12)
                        Text(icon).font(.system(size: 28))
                    }
                    .frame(width: 56, height: 56)
                    .cornerRadius(Hive.Radius.md)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(badge)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(accentColor)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(accentColor.opacity(0.1))
                            .cornerRadius(Hive.Radius.full)

                        Text(title)
                            .font(Hive.Typography.headingSm)
                            .foregroundColor(Hive.Color.n900)
                            .lineLimit(2)
                    }
                }

                Text(description)
                    .font(Hive.Typography.bodySm)
                    .foregroundColor(Hive.Color.n600)
                    .lineLimit(4)
                    .fixedSize(horizontal: false, vertical: true)

                // Tags
                HStack(spacing: 6) {
                    ForEach(tags, id: \.self) { tag in
                        Text(tag)
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(Hive.Color.n500)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(Hive.Color.n100)
                            .cornerRadius(Hive.Radius.full)
                    }
                    Spacer()
                    Image(systemName: "arrow.right")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(accentColor)
                }
            }
            .padding(Hive.Spacing.s5)
            .background(Hive.Color.brandWhite)
            .cornerRadius(Hive.Radius.lg)
            .shadow(color: accentColor.opacity(pressed ? 0.12 : 0.06), radius: pressed ? 4 : 8, y: pressed ? 1 : 3)
            .scaleEffect(pressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.12), value: pressed)
        }
        .buttonStyle(.plain)
        .simultaneousGesture(DragGesture(minimumDistance: 0)
            .onChanged { _ in pressed = true }
            .onEnded   { _ in pressed = false }
        )
    }
}

// ─── HSBC Logo Row ────────────────────────────────────────────────────────────

private struct HSBCLogoRow: View {
    var body: some View {
        HStack(spacing: Hive.Spacing.s2) {
            Grid(alignment: .topLeading, horizontalSpacing: 0, verticalSpacing: 0) {
                GridRow {
                    Rectangle().fill(Hive.Color.brandPrimary).frame(width: 14, height: 14)
                    Rectangle().fill(Hive.Color.brandWhite).frame(width: 14, height: 14)
                }
                GridRow {
                    Rectangle().fill(Hive.Color.brandWhite).frame(width: 14, height: 14)
                    Rectangle().fill(Hive.Color.brandPrimary).frame(width: 14, height: 14)
                }
            }
            .frame(width: 28, height: 28)
            .overlay(Rectangle().stroke(Hive.Color.n200, lineWidth: 0.5))

            Text("HSBC")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(Hive.Color.n900)
                .kerning(1)
        }
    }
}

