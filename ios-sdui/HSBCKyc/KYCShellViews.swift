import SwiftUI

// MARK: - Root Navigation View

struct KYCRootView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        Group {
            if store.isComplete {
                KYCCompletionView()
            } else if store.screenPayload != nil {
                KYCJourneyView()
            } else {
                KYCWelcomeView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: store.isComplete)
    }
}

// MARK: - Welcome / Start screen

struct KYCWelcomeView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        ZStack {
            Hive.Color.n50.ignoresSafeArea()

            VStack(spacing: 0) {
                // HSBC Red header bar
                Rectangle()
                    .fill(Hive.Color.brandPrimary)
                    .frame(height: 6)

                ScrollView {
                    VStack(spacing: Hive.Spacing.s6) {
                        // Logo
                        HStack {
                            HSBCLogoView()
                            Spacer()
                        }
                        .padding(.horizontal, Hive.Spacing.s6)
                        .padding(.top, Hive.Spacing.s6)

                        // Hero
                        VStack(alignment: .leading, spacing: Hive.Spacing.s3) {
                            Text("Open Banking\nAccount Opening")
                                .font(Hive.Typography.displayLarge)
                                .foregroundColor(Hive.Color.n800)
                                .lineSpacing(4)

                            Text("Complete your KYC verification in minutes using Open Banking. Fully regulated by the HKMA.")
                                .font(Hive.Typography.bodyBase)
                                .foregroundColor(Hive.Color.n600)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, Hive.Spacing.s6)

                        // Steps preview
                        VStack(spacing: Hive.Spacing.s3) {
                            ForEach([
                                ("👤", "Personal Details",      "Name, DOB, nationality, address"),
                                ("🪪", "Identity Verification", "Government ID + liveness selfie"),
                                ("💼", "Due Diligence",         "Occupation & source of funds"),
                                ("🏦", "Open Banking",          "Connect bank for instant verification"),
                                ("✍️", "Declarations",          "Legal declarations & consent"),
                            ], id: \.0) { icon, title, desc in
                                HStack(spacing: Hive.Spacing.s4) {
                                    Text(icon).font(.system(size: 24))
                                        .frame(width: 44, height: 44)
                                        .background(Hive.Color.brandPrimaryLight)
                                        .cornerRadius(Hive.Radius.md)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(title)
                                            .font(Hive.Typography.labelBase)
                                            .foregroundColor(Hive.Color.n800)
                                        Text(desc)
                                            .font(Hive.Typography.caption)
                                            .foregroundColor(Hive.Color.n500)
                                    }
                                    Spacer()
                                }
                                .padding(Hive.Spacing.s4)
                                .background(Hive.Color.brandWhite)
                                .cornerRadius(Hive.Radius.md)
                                .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
                            }
                        }
                        .padding(.horizontal, Hive.Spacing.s4)

                        // Regulatory note
                        HStack(spacing: Hive.Spacing.s2) {
                            Image(systemName: "lock.shield.fill")
                                .foregroundColor(Hive.Color.n400)
                            Text("Regulated by HKMA · Data protected under PDPO Cap. 486")
                                .font(Hive.Typography.caption)
                                .foregroundColor(Hive.Color.n400)
                        }
                        .padding(.horizontal, Hive.Spacing.s4)

                        // CTA
                        if let err = store.errorMessage {
                            Text(err)
                                .font(Hive.Typography.bodySm)
                                .foregroundColor(Hive.Color.error)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, Hive.Spacing.s6)
                        }

                        Button("Begin Application") {
                            store.dispatch(.startSession)
                        }
                        .buttonStyle(HivePrimaryButtonStyle(isLoading: store.isLoading))
                        .disabled(store.isLoading)
                        .padding(.horizontal, Hive.Spacing.s4)
                        .padding(.bottom, Hive.Spacing.s8)
                    }
                }
            }
        }
    }
}

// MARK: - Journey shell (progress bar + step content)

struct KYCJourneyView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        VStack(spacing: 0) {
            // Header
            KYCHeader()

            // Progress bar
            KYCMobileProgressBar()

            // Step content (scrollable)
            // .id on ScrollView resets scroll position and forces full re-render on step change
            ScrollView {
                VStack(alignment: .leading, spacing: Hive.Spacing.s5) {
                    // Section badge + step title
                    VStack(alignment: .leading, spacing: Hive.Spacing.s2) {
                        HiveSectionBadge(label: store.sectionTitle)
                        if let payload = store.screenPayload {
                            KYCStepTitleView(payload: payload)
                        }
                    }

                    // SDUI-rendered step content — .id inside KYCStepContentCard
                    // forces destroy/recreate of step views on stepId change
                    if let payload = store.screenPayload {
                        KYCStepContentCard(payload: payload)
                    }
                }
                .padding(.horizontal, Hive.Spacing.s4)
                .padding(.top, Hive.Spacing.s5)
                .padding(.bottom, 110)
            }
            .id(store.currentStepId ?? "loading") // resets scroll + forces re-render
            .background(Hive.Color.n50)

            // Sticky nav bar
            KYCNavBar()
        }
        .background(Hive.Color.n50)
        .ignoresSafeArea(edges: .bottom)
        .overlay(
            Group {
                if store.isLoading {
                    KYCLoadingOverlay()
                }
            }
        )
    }
}

// MARK: - Header

struct KYCHeader: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        HStack {
            HSBCLogoView()
            Spacer()
            Button("Save & Exit") { store.dispatch(.setError(nil)) }
                .font(Hive.Typography.bodySm)
                .foregroundColor(Hive.Color.n500)
        }
        .padding(.horizontal, Hive.Spacing.s4)
        .padding(.vertical, Hive.Spacing.s3)
        .background(Hive.Color.brandWhite)
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundColor(Hive.Color.n200),
            alignment: .bottom
        )
    }
}

// MARK: - Progress bar

struct KYCMobileProgressBar: View {
    @Environment(AppStore.self) private var store

    var progress: CGFloat {
        guard store.totalSteps > 0 else { return 0 }
        return CGFloat(store.currentStepIndex) / CGFloat(store.totalSteps)
    }

    var body: some View {
        VStack(spacing: Hive.Spacing.s2) {
            HStack {
                Text(store.sectionTitle)
                    .font(Hive.Typography.caption)
                    .foregroundColor(Hive.Color.n500)
                Spacer()
                Text("Step \(store.currentStepIndex) of \(store.totalSteps)")
                    .font(Hive.Typography.caption)
                    .foregroundColor(Hive.Color.n500)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Hive.Color.n200)
                        .frame(height: 4)
                    Capsule()
                        .fill(Hive.Color.brandPrimary)
                        .frame(width: geo.size.width * progress, height: 4)
                        .animation(.easeInOut(duration: 0.4), value: progress)
                }
            }
            .frame(height: 4)
        }
        .padding(.horizontal, Hive.Spacing.s4)
        .padding(.vertical, Hive.Spacing.s3)
        .background(Hive.Color.brandWhite)
        .overlay(
            Rectangle().frame(height: 1).foregroundColor(Hive.Color.n200),
            alignment: .bottom
        )
    }
}

// MARK: - Step title

struct KYCStepTitleView: View {
    let payload: SDUIScreenPayload

    private var stepIcon: String {
        let icons = [
            "name":"👤", "dob":"🎂", "contact":"📱", "identifier":"🪪",
            "address":"🏠", "document":"📄", "liveness":"😊",
            "wealth":"💼", "openbanking":"🏦", "declaration":"✍️",
        ]
        for (key, icon) in icons {
            if payload.metadata.stepId.contains(key) { return icon }
        }
        return "📋"
    }

    private var stepTitle: String {
        let titles = [
            "name":"Full Legal Name", "dob":"Date of Birth & Nationality",
            "contact":"Contact Details", "identifier":"Government ID Number",
            "address":"Residential Address", "document":"Upload Identity Document",
            "liveness":"Selfie & Liveness Check", "wealth":"Occupation & Source of Funds",
            "openbanking":"Connect Your Bank", "declaration":"Legal Declarations",
        ]
        for (key, title) in titles {
            if payload.metadata.stepId.contains(key) { return title }
        }
        return payload.metadata.sectionTitle
    }

    var body: some View {
        Text("\(stepIcon) \(stepTitle)")
            .font(Hive.Typography.headingMd)
            .foregroundColor(Hive.Color.n800)
            .fixedSize(horizontal: false, vertical: true)
    }
}

// MARK: - Step content card

struct KYCStepContentCard: View {
    let payload: SDUIScreenPayload

    private var questionIds: [String] {
        payload.layout.children?
            .compactMap { $0.props?["questionId"]?.stringValue } ?? []
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s5) {
            KYCSDUIStepRouter(
                stepId: payload.metadata.stepId,
                sectionTitle: payload.metadata.sectionTitle,
                questionIds: questionIds
            )
        }
        .padding(Hive.Spacing.s5)
        .background(Hive.Color.brandWhite)
        .cornerRadius(Hive.Radius.lg)
        .shadow(color: .black.opacity(0.06), radius: 8, y: 2)
        // CRITICAL: force SwiftUI to destroy and recreate the entire step
        // view tree when the stepId changes, so @State inside each step
        // (TextFields, Pickers, etc.) is reset and routed to the new view type
        .id(payload.metadata.stepId)
    }
}

// MARK: - Navigation bar

struct KYCNavBar: View {
    @Environment(AppStore.self) private var store

    var isFirstStep: Bool { store.currentStepIndex <= 1 }
    var isLastStep:  Bool { store.currentStepIndex >= store.totalSteps }

    var body: some View {
        HStack(spacing: Hive.Spacing.s3) {
            if !isFirstStep {
                Button(action: {
                    let prevIdx = store.currentStepIndex - 1
                    guard prevIdx >= 1, let sid = store.sessionId else { return }
                    let prevStepId = String(format: "step-%03d", prevIdx)
                    store.dispatch(.setLoading(true))
                    Task {
                        let net = KYCNetworkService()
                        do {
                            let payload = try await net.getStep(sessionId: sid, stepId: prevStepId, platform: "mobile")
                            await MainActor.run { store.dispatch(.stepLoaded(payload)) }
                        } catch {
                            await MainActor.run { store.dispatch(.setError("Could not go back.")) }
                        }
                    }
                }) {
                    HStack(spacing: Hive.Spacing.s1) {
                        Image(systemName: "chevron.left")
                        Text("Back")
                    }
                    .font(Hive.Typography.bodyBase)
                    .foregroundColor(Hive.Color.n700)
                    .padding(.horizontal, Hive.Spacing.s4)
                    .frame(height: Hive.Component.Button.height)
                    .background(Hive.Color.brandWhite)
                    .cornerRadius(Hive.Radius.base)
                    .overlay(
                        RoundedRectangle(cornerRadius: Hive.Radius.base)
                            .stroke(Hive.Color.n300, lineWidth: 1)
                    )
                }
            }

            Button(action: { store.dispatch(.submitStep) }) {
                Text(isLastStep ? "Submit Application" : "Continue")
            }
            .buttonStyle(HivePrimaryButtonStyle(isLoading: store.isSubmitting))
            .disabled(store.isSubmitting)
        }
        .padding(.horizontal, Hive.Spacing.s4)
        .padding(.top, Hive.Spacing.s4)
        .padding(.bottom, Hive.Spacing.s6)
        .background(Hive.Color.brandWhite)
        .overlay(
            Rectangle().frame(height: 1).foregroundColor(Hive.Color.n200),
            alignment: .top
        )
        .shadow(color: .black.opacity(0.06), radius: 8, y: -2)
    }
}

// MARK: - Loading overlay

struct KYCLoadingOverlay: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.3).ignoresSafeArea()
            VStack(spacing: Hive.Spacing.s4) {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: Hive.Color.brandPrimary))
                    .scaleEffect(1.4)
                Text("Loading…")
                    .font(Hive.Typography.bodySm)
                    .foregroundColor(Hive.Color.n700)
            }
            .padding(Hive.Spacing.s8)
            .background(Hive.Color.brandWhite)
            .cornerRadius(Hive.Radius.lg)
            .shadow(color: .black.opacity(0.15), radius: 16)
        }
    }
}

// MARK: - Completion screen

struct KYCCompletionView: View {
    var body: some View {
        ZStack {
            Hive.Color.n50.ignoresSafeArea()
            VStack(spacing: Hive.Spacing.s6) {
                HSBCLogoView()
                Text("✅").font(.system(size: 72))
                Text("Application Submitted")
                    .font(Hive.Typography.headingXL)
                    .foregroundColor(Hive.Color.success)
                    .multilineTextAlignment(.center)

                VStack(alignment: .leading, spacing: Hive.Spacing.s3) {
                    ForEach([
                        ("📧", "Confirmation email sent"),
                        ("📱", "SMS notification will follow"),
                        ("⏱",  "Decision within 3 working days"),
                        ("🔒", "Data encrypted per PDPO Cap. 486"),
                    ], id: \.0) { icon, text in
                        HStack(spacing: Hive.Spacing.s3) {
                            Text(icon)
                            Text(text)
                                .font(Hive.Typography.bodySm)
                                .foregroundColor(Hive.Color.n700)
                        }
                    }
                }
                .padding(Hive.Spacing.s5)
                .background(Hive.Color.n50)
                .cornerRadius(Hive.Radius.md)
                .overlay(
                    RoundedRectangle(cornerRadius: Hive.Radius.md)
                        .stroke(Hive.Color.n200, lineWidth: 1)
                )

                Text("Reference: OBKYC-\(String(Int.random(in: 100000...999999)))")
                    .font(Hive.Typography.caption)
                    .foregroundColor(Hive.Color.n400)
            }
            .padding(Hive.Spacing.s6)
        }
    }
}

// MARK: - HSBC Logo

struct HSBCLogoView: View {
    var body: some View {
        HStack(spacing: Hive.Spacing.s2) {
            // HSBC hexagon mark
            ZStack {
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
            }
            .frame(width: 28, height: 28)
            .overlay(Rectangle().stroke(Hive.Color.n200, lineWidth: 0.5))

            Text("HSBC")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(Hive.Color.n800)
                .kerning(1)
        }
    }
}
