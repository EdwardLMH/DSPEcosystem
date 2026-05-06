import SwiftUI
import AVKit

// MARK: - SDUI payload models (FX Viewpoint page)

private struct FXViewpointPayload: Decodable {
    let pageId: String?
    let screen: String
    let layout: FXLayout
}

private struct FXLayout: Decodable {
    let type: String
    let children: [FXSlice]
}

private struct FXSlice: Decodable, Identifiable {
    let instanceId: String
    let type: String
    let visible: Bool?
    let props: [String: JSONAny]?

    var id: String { instanceId }

    func string(_ key: String) -> String? {
        if case .string(let s) = props?[key] { return s }
        return nil
    }
    func bool(_ key: String) -> Bool? {
        if case .bool(let b) = props?[key] { return b }
        return nil
    }
    func strings(_ key: String) -> [String]? {
        if case .array(let arr) = props?[key] {
            return arr.compactMap { if case .string(let s) = $0 { return s }; return nil }
        }
        return nil
    }
}

private enum JSONAny: Decodable {
    case string(String), int(Int), double(Double), bool(Bool)
    case array([JSONAny]), object([String: JSONAny])

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let v = try? c.decode(Bool.self)               { self = .bool(v) }
        else if let v = try? c.decode(Int.self)           { self = .int(v) }
        else if let v = try? c.decode(Double.self)        { self = .double(v) }
        else if let v = try? c.decode(String.self)        { self = .string(v) }
        else if let v = try? c.decode([JSONAny].self)     { self = .array(v) }
        else { self = .object((try? c.decode([String: JSONAny].self)) ?? [:]) }
    }
}

// MARK: - ViewModel

@MainActor
private final class FXViewpointViewModel: ObservableObject {
    enum State { case loading, loaded([FXSlice]), error }

    @Published var state: State = .loading

    #if targetEnvironment(simulator)
    private let baseURL = "http://127.0.0.1:4000"
    #else
    private let baseURL = "http://10.81.103.103:4000"
    #endif

    func load() async {
        guard let url = URL(string: "\(baseURL)/api/v1/screen/fx-viewpoint-hk") else {
            state = .error; return
        }
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            if let http = response as? HTTPURLResponse, http.statusCode == 200 {
                let payload = try JSONDecoder().decode(FXViewpointPayload.self, from: data)
                let visible = payload.layout.children.filter { $0.visible != false }
                state = .loaded(visible)
            } else {
                state = .error
            }
        } catch {
            state = .error
        }
    }
}

// MARK: - Entry point

struct FXViewpointView: View {
    var onBack: (() -> Void)? = nil

    @StateObject private var vm = FXViewpointViewModel()

    var body: some View {
        Group {
            switch vm.state {
            case .loading:
                VStack {
                    FXHeaderNavBar(title: "FX Viewpoint", showBackButton: true, onBack: onBack)
                    Spacer()
                    ProgressView()
                    Spacer()
                }
                .background(Hive.Color.n50.ignoresSafeArea())

            case .loaded(let slices):
                FXSDUIScrollView(slices: slices, onBack: onBack)

            case .error:
                FXHardcodedView(onBack: onBack)
            }
        }
        .task { await vm.load() }
    }
}

// MARK: - SDUI scroll container

private struct FXSDUIScrollView: View {
    let slices: [FXSlice]
    let onBack: (() -> Void)?

    var body: some View {
        ZStack(alignment: .bottom) {
            Hive.Color.n50.ignoresSafeArea().allowsHitTesting(false)
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    ForEach(slices) { slice in
                        FXSliceView(slice: slice, onBack: onBack)
                    }
                    Spacer().frame(height: 80)
                }
            }

            // Sticky CONTACT_RM_CTA if present
            if let stickySlice = slices.first(where: { $0.type == "CONTACT_RM_CTA" && $0.bool("sticky") == true }) {
                FXContactRMCTA(slice: stickySlice)
            }
        }
    }
}

// MARK: - Slice dispatcher

private struct FXSliceView: View {
    let slice: FXSlice
    let onBack: (() -> Void)?

    var body: some View {
        switch slice.type {
        case "HEADER_NAV":
            FXHeaderNavBar(
                title: slice.string("title") ?? "FX Viewpoint",
                showBackButton: slice.bool("showBackButton") ?? true,
                onBack: onBack
            )
        case "VIDEO_PLAYER", "MARKET_INSIGHT_VIDEO":
            FXVideoPlayer(slice: slice)
        case "MARKET_BRIEFING_TEXT":
            FXMarketBriefing(slice: slice)
        case "CONTACT_RM_CTA":
            // Rendered as sticky overlay in scroll container; skip inline
            EmptyView()
        default:
            EmptyView()
        }
    }
}

// MARK: - 1. Header Nav Bar

private struct FXHeaderNavBar: View {
    let title: String
    let showBackButton: Bool
    let onBack: (() -> Void)?

    var body: some View {
        HStack(spacing: 12) {
            if showBackButton {
                Button(action: { onBack?() }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(Hive.Color.n800)
                        .frame(width: 36, height: 36)
                }
                .buttonStyle(.plain)
            }
            Text(title)
                .font(Hive.Typography.headingSm)
                .foregroundColor(Hive.Color.n900)
            Spacer()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(Hive.Color.brandWhite)
        .overlay(Rectangle().frame(height: 1).foregroundColor(Hive.Color.n200), alignment: .bottom)
    }
}

// MARK: - 2. Video Player

private struct FXVideoPlayer: View {
    let slice: FXSlice
    @State private var isPlaying = false

    #if targetEnvironment(simulator)
    private let mediaBase = "http://127.0.0.1:4000"
    #else
    private let mediaBase = "http://10.81.103.103:4000"
    #endif

    private var videoURL: URL {
        var raw = slice.string("videoUrl") ?? "\(mediaBase)/media/fx-viewpoint.mov"
        raw = raw.replacingOccurrences(of: "http://localhost:4000", with: mediaBase)
        return URL(string: raw) ?? URL(string: "\(mediaBase)/media/fx-viewpoint.mov")!
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if isPlaying {
                // Inline AVPlayer — swaps in place of the thumbnail
                InlineAVPlayer(url: videoURL, onClose: { isPlaying = false })
                    .frame(height: 210)
            } else {
                // Thumbnail with play button — Button gives reliable tap in ScrollView
                Button(action: { isPlaying = true }) {
                    ZStack {
                        Color(hex: "#003366")
                        VStack(spacing: 8) {
                            ZStack {
                                Circle()
                                    .fill(.white.opacity(0.2))
                                    .frame(width: 64, height: 64)
                                Image(systemName: "play.fill")
                                    .font(.system(size: 28))
                                    .foregroundColor(.white)
                            }
                            Text(slice.string("title") ?? "FX Viewpoint")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(.white.opacity(0.85))
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 16)
                        }
                    }
                    .frame(height: 210)
                }
                .buttonStyle(.plain)
            }

            // Presenter info bar (always visible)
            HStack(spacing: 10) {
                ZStack {
                    Circle().fill(Color(hex: "#003366").opacity(0.12))
                    Text("👤").font(.system(size: 18))
                }
                .frame(width: 40, height: 40)

                VStack(alignment: .leading, spacing: 2) {
                    Text(slice.string("presenterName") ?? "")
                        .font(Hive.Typography.labelBase)
                        .foregroundColor(Hive.Color.n900)
                    Text(slice.string("presenterTitle") ?? "")
                        .font(Hive.Typography.caption)
                        .foregroundColor(Hive.Color.n500)
                }
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Hive.Color.brandWhite)
            .overlay(Rectangle().frame(height: 1).foregroundColor(Hive.Color.n200), alignment: .bottom)
        }
    }
}

// MARK: - Inline AVPlayer (replaces thumbnail in-place, no modal)

private struct InlineAVPlayer: UIViewControllerRepresentable {
    let url: URL
    let onClose: () -> Void

    func makeUIViewController(context: Context) -> UIViewController {
        let player = AVPlayer(url: url)
        let playerVC = AVPlayerViewController()
        playerVC.player = player
        player.play()

        // Close button top-right
        let wrapper = UIViewController()
        wrapper.view.backgroundColor = .black
        wrapper.addChild(playerVC)
        wrapper.view.addSubview(playerVC.view)
        playerVC.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            playerVC.view.topAnchor.constraint(equalTo: wrapper.view.topAnchor),
            playerVC.view.bottomAnchor.constraint(equalTo: wrapper.view.bottomAnchor),
            playerVC.view.leadingAnchor.constraint(equalTo: wrapper.view.leadingAnchor),
            playerVC.view.trailingAnchor.constraint(equalTo: wrapper.view.trailingAnchor),
        ])
        playerVC.didMove(toParent: wrapper)

        let btn = UIButton(type: .system)
        btn.setTitle("✕", for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .bold)
        btn.setTitleColor(.white, for: .normal)
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.addAction(UIAction { [weak player] _ in
            player?.pause()
            context.coordinator.onClose()
        }, for: .touchUpInside)
        wrapper.view.addSubview(btn)
        NSLayoutConstraint.activate([
            btn.topAnchor.constraint(equalTo: wrapper.view.safeAreaLayoutGuide.topAnchor, constant: 6),
            btn.trailingAnchor.constraint(equalTo: wrapper.view.trailingAnchor, constant: -12),
            btn.widthAnchor.constraint(equalToConstant: 36),
            btn.heightAnchor.constraint(equalToConstant: 36),
        ])

        return wrapper
    }

    func updateUIViewController(_ vc: UIViewController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(onClose: onClose) }

    class Coordinator: NSObject {
        let onClose: () -> Void
        init(onClose: @escaping () -> Void) { self.onClose = onClose }
    }
}

// MARK: - 3. Market Briefing Text

private struct FXMarketBriefing: View {
    let slice: FXSlice

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(slice.string("sectionTitle") ?? "Key takeaways")
                .font(Hive.Typography.headingSm)
                .foregroundColor(Hive.Color.n900)

            VStack(alignment: .leading, spacing: 10) {
                ForEach(slice.strings("bulletPoints") ?? [], id: \.self) { point in
                    HStack(alignment: .top, spacing: 8) {
                        Circle()
                            .fill(Color(hex: "#003366"))
                            .frame(width: 6, height: 6)
                            .padding(.top, 5)
                        Text(point)
                            .font(Hive.Typography.bodySm)
                            .foregroundColor(Hive.Color.n700)
                    }
                }
            }

            if let disclaimer = slice.string("disclaimer") {
                Text(disclaimer)
                    .font(.system(size: 10))
                    .foregroundColor(Hive.Color.n400)
                    .padding(10)
                    .background(Hive.Color.n100)
                    .cornerRadius(6)
            }
        }
        .padding(16)
        .background(Hive.Color.brandWhite)
    }
}

// MARK: - 4. Contact RM CTA (sticky)

private struct FXContactRMCTA: View {
    let slice: FXSlice

    var bgColor: Color {
        Color(hex: slice.string("backgroundColor") ?? "#DB0011")
    }

    var body: some View {
        Button {
            // deep-link handled by app router in production
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(slice.string("label") ?? "Contact Your RM")
                        .font(Hive.Typography.labelBase)
                        .foregroundColor(.white)
                    if let sub = slice.string("subLabel") {
                        Text(sub)
                            .font(Hive.Typography.caption)
                            .foregroundColor(.white.opacity(0.85))
                    }
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background(bgColor)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Hardcoded fallback (BFF unreachable)

private struct FXHardcodedView: View {
    let onBack: (() -> Void)?
    @State private var isPlaying = false

    #if targetEnvironment(simulator)
    private let mediaBase = "http://127.0.0.1:4000"
    #else
    private let mediaBase = "http://10.81.103.103:4000"
    #endif

    private let bullets: [String] = [
        "A weak USD is likely to persist into 2026, providing temporary support for the EUR and GBP.",
        "With the ECB expected to maintain its policy rate in 2026, the EUR should remain broadly stable.",
        "BoE delivered a 25 bps cut in May 2026 — further easing is data-dependent and market pricing appears stretched.",
        "GBP/USD faces near-term resistance at 1.3200 amid mixed UK growth signals.",
        "Investors should consider diversified FX exposure to manage downside risk against a volatile USD backdrop.",
    ]

    var body: some View {
        ZStack(alignment: .bottom) {
            Hive.Color.n50.ignoresSafeArea().allowsHitTesting(false)
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    FXHeaderNavBar(title: "FX Viewpoint", showBackButton: true, onBack: onBack)

                    // Video player / thumbnail
                    if isPlaying {
                        InlineAVPlayer(
                            url: URL(string: "\(mediaBase)/media/fx-viewpoint.mov")!,
                            onClose: { isPlaying = false }
                        )
                        .frame(height: 210)
                    } else {
                        Button(action: { isPlaying = true }) {
                            ZStack {
                                Color(hex: "#003366")
                                VStack(spacing: 8) {
                                    ZStack {
                                        Circle().fill(.white.opacity(0.2)).frame(width: 64, height: 64)
                                        Image(systemName: "play.fill")
                                            .font(.system(size: 28)).foregroundColor(.white)
                                    }
                                    Text("FX Viewpoint — EUR & GBP Market Insights (May 2026)")
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(.white.opacity(0.85))
                                        .multilineTextAlignment(.center)
                                        .padding(.horizontal, 16)
                                }
                            }
                            .frame(height: 210)
                        }
                        .buttonStyle(.plain)
                    }

                    // Presenter info
                    HStack(spacing: 10) {
                        ZStack {
                            Circle().fill(Color(hex: "#003366").opacity(0.12))
                            Text("👤").font(.system(size: 18))
                        }
                        .frame(width: 40, height: 40)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Jackie Wong")
                                .font(Hive.Typography.labelBase).foregroundColor(Hive.Color.n900)
                            Text("FX Strategist, HSBC Global Research")
                                .font(Hive.Typography.caption).foregroundColor(Hive.Color.n500)
                        }
                        Spacer()
                    }
                    .padding(.horizontal, 16).padding(.vertical, 12)
                    .background(Hive.Color.brandWhite)
                    .overlay(Rectangle().frame(height: 1).foregroundColor(Hive.Color.n200), alignment: .bottom)

                    // Key takeaways
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Key takeaways")
                            .font(Hive.Typography.headingSm).foregroundColor(Hive.Color.n900)
                        VStack(alignment: .leading, spacing: 10) {
                            ForEach(bullets, id: \.self) { point in
                                HStack(alignment: .top, spacing: 8) {
                                    Circle().fill(Color(hex: "#003366"))
                                        .frame(width: 6, height: 6).padding(.top, 5)
                                    Text(point).font(Hive.Typography.bodySm)
                                        .foregroundColor(Hive.Color.n700)
                                }
                            }
                        }
                        Text("This material is issued by HSBC and is for information purposes only. It does not constitute investment advice or a recommendation to buy or sell any financial instrument.")
                            .font(.system(size: 10)).foregroundColor(Hive.Color.n400)
                            .padding(10).background(Hive.Color.n100).cornerRadius(6)
                    }
                    .padding(16).background(Hive.Color.brandWhite)

                    Spacer().frame(height: 80)
                }
            }

            // Sticky Contact RM CTA
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Contact Your RM")
                        .font(Hive.Typography.labelBase).foregroundColor(.white)
                    Text("Speak to your Relationship Manager about FX opportunities")
                        .font(Hive.Typography.caption).foregroundColor(.white.opacity(0.85))
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold)).foregroundColor(.white)
            }
            .padding(.horizontal, 20).padding(.vertical, 14)
            .background(Hive.Color.brandPrimary)
        }
    }
}
