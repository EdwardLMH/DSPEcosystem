import SwiftUI
import AVKit

// MARK: - Inline video player (carousel, plays within the SwiftUI frame using AVPlayerLayer)
// AVPlayerViewController expands to full-screen; using UIViewRepresentable + AVPlayerLayer
// keeps playback strictly inside the .frame() given by the parent.

private struct WHInlineVideoPlayer: UIViewRepresentable {
    let url: URL
    let onClose: () -> Void

    func makeUIView(context: Context) -> WHPlayerView {
        let view = WHPlayerView()
        view.configure(url: url, onClose: onClose)
        return view
    }

    func updateUIView(_ view: WHPlayerView, context: Context) {}
}

final class WHPlayerView: UIView {
    private var player: AVPlayer?
    private var playerLayer: AVPlayerLayer?
    private var onClose: (() -> Void)?

    override func layoutSubviews() {
        super.layoutSubviews()
        playerLayer?.frame = bounds
    }

    func configure(url: URL, onClose: @escaping () -> Void) {
        self.onClose = onClose
        backgroundColor = .black

        let player = AVPlayer(url: url)
        self.player = player

        let layer = AVPlayerLayer(player: player)
        layer.videoGravity = .resizeAspect
        layer.frame = bounds
        self.layer.addSublayer(layer)
        self.playerLayer = layer

        player.play()

        // Native playback controls via a zero-sized AVPlayerViewController child
        // is not used here — we add a minimal close button ourselves.
        let btn = UIButton(type: .system)
        btn.setTitle("✕", for: .normal)
        btn.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .bold)
        btn.setTitleColor(.white, for: .normal)
        btn.backgroundColor = UIColor.black.withAlphaComponent(0.45)
        btn.layer.cornerRadius = 14
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.addAction(UIAction { [weak self] _ in
            self?.player?.pause()
            self?.onClose?()
        }, for: .touchUpInside)
        addSubview(btn)
        NSLayoutConstraint.activate([
            btn.topAnchor.constraint(equalTo: topAnchor, constant: 8),
            btn.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -8),
            btn.widthAnchor.constraint(equalToConstant: 28),
            btn.heightAnchor.constraint(equalToConstant: 28),
        ])

        // Simple play/pause tap on the video surface
        let tap = UITapGestureRecognizer(target: self, action: #selector(togglePlayPause))
        addGestureRecognizer(tap)
    }

    @objc private func togglePlayPause() {
        guard let player else { return }
        player.timeControlStatus == .playing ? player.pause() : player.play()
    }
}

// MARK: - SDUI payload models (Home Hub page)

private struct HomeHubPayload: Decodable {
    let pageId: String?
    let screen: String
    let layout: HomeSDUILayout
}

private struct HomeSDUILayout: Decodable {
    let type: String
    let children: [HomeSlice]
}

private struct HomeSlice: Decodable, Identifiable {
    let instanceId: String
    let type: String
    let visible: Bool?
    let props: [String: JSONValue]?

    var id: String { instanceId }
    var isVisible: Bool { visible ?? true }
    var p: [String: JSONValue] { props ?? [:] }
}

private enum JSONValue: Decodable {
    case string(String), int(Int), double(Double), bool(Bool)
    case array([JSONValue]), object([String: JSONValue])

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let v = try? c.decode(Bool.self)             { self = .bool(v) }
        else if let v = try? c.decode(Int.self)         { self = .int(v) }
        else if let v = try? c.decode(Double.self)      { self = .double(v) }
        else if let v = try? c.decode(String.self)      { self = .string(v) }
        else if let v = try? c.decode([JSONValue].self) { self = .array(v) }
        else { self = .object((try? c.decode([String: JSONValue].self)) ?? [:]) }
    }

    var stringValue: String   { if case .string(let s) = self { return s }; return "" }
    var boolValue: Bool       { if case .bool(let b)   = self { return b }; return false }
    var doubleValue: Double   { if case .double(let d) = self { return d }
                                if case .int(let i)    = self { return Double(i) }; return 0 }
    var arrayValue: [JSONValue]        { if case .array(let a)  = self { return a };  return [] }
    var objectValue: [String: JSONValue] { if case .object(let o) = self { return o }; return [:] }
}

// MARK: - ViewModel

@MainActor
private final class HomeSDUIViewModel: ObservableObject {
    enum LoadState { case loading, sdui([HomeSlice]), fallback }

    @Published var state: LoadState = .loading

    #if targetEnvironment(simulator)
    private let baseURL = "http://127.0.0.1:4000"
    #else
    private let baseURL = "http://10.81.103.103:4000"
    #endif

    func load() async {
        guard let url = URL(string: "\(baseURL)/api/v1/screen/home-hub-hk") else {
            state = .fallback; return
        }
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            if let http = response as? HTTPURLResponse, http.statusCode == 200 {
                let payload = try JSONDecoder().decode(HomeHubPayload.self, from: data)
                let visible = payload.layout.children.filter { $0.isVisible }
                state = visible.isEmpty ? .fallback : .sdui(visible)
            } else {
                state = .fallback
            }
        } catch {
            state = .fallback
        }
    }
}

// MARK: - Entry point

struct HomePageView: View {
    @StateObject private var vm = HomeSDUIViewModel()
    @State private var searchPresented = false

    var body: some View {
        Group {
            switch vm.state {
            case .loading:
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Hive.Color.n50.ignoresSafeArea())

            case .sdui(let slices):
                HomeSDUIRootView(slices: slices, searchPresented: $searchPresented)

            case .fallback:
                HomeHardcodedView(searchPresented: $searchPresented)
            }
        }
        .task { await vm.load() }
        .fullScreenCover(isPresented: $searchPresented) {
            AISearchView(isPresented: $searchPresented)
        }
    }
}

// MARK: - SDUI-driven render

private struct HomeSDUIRootView: View {
    let slices: [HomeSlice]
    @Binding var searchPresented: Bool

    var body: some View {
        NavigationView {
            ZStack(alignment: .top) {
                Hive.Color.n50.ignoresSafeArea()
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {
                        ForEach(slices) { slice in
                            SDUISliceView(slice: slice, onSearchTap: { searchPresented = true })
                        }
                        Spacer().frame(height: 40)
                    }
                }
            }
            .navigationBarHidden(true)
            .onAppear { TealiumClient.homeHubViewed() }
        }
    }
}

private struct SDUISliceView: View {
    let slice: HomeSlice
    let onSearchTap: () -> Void
    @State private var adDismissed = false

    var body: some View {
        switch slice.type {
        case "HOME_SEARCH_HEADER":
            WHHomeSearchHeader(props: slice.p, onSearchTap: onSearchTap)
        case "COMBO_QUICK_ACCESS":
            WHComboQuickAccess(props: slice.p)
        case "CARD_ACTIVATION_BANNER":
            WHCardActivationBanner(props: slice.p)
        case "QUEST_BANNER":
            WHQuestBanner(props: slice.p)
        case "FEATURE_PRODUCT":
            WHFeatureProduct(props: slice.p)
        case "WEALTH_STUDIO_CAROUSEL":
            WHWealthStudioCarousel(props: slice.p)
        case "GUIDES_INSIGHTS_CAROUSEL":
            WHGuidesInsights(props: slice.p)
        case "FX_WATCHLIST":
            WHFXWatchlist(props: slice.p)
        case "DISCOVER_MORE_CAROUSEL":
            WHDiscoverMore(props: slice.p)
        case "SPACER":
            let h = slice.p["height"]?.doubleValue ?? 16
            Spacer().frame(height: h)
        default:
            EmptyView()
        }
    }
}

// MARK: - Hardcoded fallback

private struct HomeHardcodedView: View {
    @Binding var searchPresented: Bool

    var body: some View {
        NavigationView {
            ZStack(alignment: .top) {
                Hive.Color.n50.ignoresSafeArea()
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {
                        WHHomeSearchHeader(props: defaultSearchHeaderProps, onSearchTap: { searchPresented = true })
                        WHComboQuickAccess(props: defaultComboQuickAccessProps)
                        WHCardActivationBanner(props: ["message": JSONValue.string("Your card needs to be activated"),
                                                       "deepLink": JSONValue.string("hsbc://card/activate")])
                        WHQuestBanner(props: defaultQuestBannerProps)
                        WHFeatureProduct(props: defaultFeatureProductProps)
                        WHWealthStudioCarousel(props: defaultWealthStudioProps)
                        WHGuidesInsights(props: defaultGuidesInsightsProps)
                        WHFXWatchlist(props: defaultFXWatchlistProps)
                        WHDiscoverMore(props: defaultDiscoverMoreProps)
                        Spacer().frame(height: 40)
                    }
                }
            }
            .navigationBarHidden(true)
            .onAppear { TealiumClient.homeHubViewed() }
        }
    }
}

// MARK: - Default prop constants (fallback data matching OCDP mock data)

private let defaultSearchHeaderProps: [String: JSONValue] = [
    "premierLabel": .string("HSBC Premier"),
    "eliteLabel":   .string("HSBC Elite"),
    "advanceLabel": .string("HSBC One"),
    "massLabel":    .string("HSBC Personal Banking"),
    "premierBg":    .string("#DB0011"),
    "eliteBg":      .string("#0D5C3A"),
    "advanceBg":    .string("#D4580A"),
    "massBg":       .string("#4B5563"),
    "enableNotification":  .bool(true),
    "enableHeadset":       .bool(true),
    "placeholder":         .string("Search functions, products & content"),
    "enableSemanticSearch":.bool(true),
]

private let defaultComboQuickAccessProps: [String: JSONValue] = [
    "tabs": .array([
        .object(["id": .string("my-pick"),  "label": .string("My pick"),  "active": .bool(true)]),
        .object(["id": .string("invest"),   "label": .string("Invest"),   "active": .bool(false)]),
        .object(["id": .string("global"),   "label": .string("Global"),   "active": .bool(false)]),
        .object(["id": .string("hk-daily"), "label": .string("HK Daily"), "active": .bool(false)]),
    ]),
    "row1Items": .array([
        .object(["id": .string("qa-1"), "icon": .string("account"),  "label": .string("Account overview"),  "deepLink": .string("hsbc://accounts")]),
        .object(["id": .string("qa-2"), "icon": .string("transfer"), "label": .string("Transfer Globally"), "deepLink": .string("hsbc://transfer/global")]),
        .object(["id": .string("qa-3"), "icon": .string("fx"),       "label": .string("Foreign exchange"),  "deepLink": .string("hsbc://fx")]),
        .object(["id": .string("qa-4"), "icon": .string("stock"),    "label": .string("Trade stock"),       "deepLink": .string("hsbc://trade/stock")]),
        .object(["id": .string("qa-5"), "icon": .string("deposit"),  "label": .string("Time deposit"),      "deepLink": .string("hsbc://deposit")]),
    ]),
    "row2Items": .array([
        .object(["id": .string("qa-6"),  "icon": .string("holding"), "label": .string("My holding details"),    "deepLink": .string("hsbc://holdings")]),
        .object(["id": .string("qa-7"),  "icon": .string("safe"),    "label": .string("Money safe"),             "deepLink": .string("hsbc://money-safe")]),
        .object(["id": .string("qa-8"),  "icon": .string("fps"),     "label": .string("Local transfer/FPS"),     "deepLink": .string("hsbc://transfer/fps")]),
        .object(["id": .string("qa-9"),  "icon": .string("scan"),    "label": .string("Scan to pay"),            "deepLink": .string("hsbc://scan-pay")]),
        .object(["id": .string("qa-10"), "icon": .string("all"),     "label": .string("All product & services"), "deepLink": .string("hsbc://all-services")]),
    ]),
]

private let defaultQuestBannerProps: [String: JSONValue] = [
    "title":       .string("Getting started"),
    "description": .string("Open investment account and complete the following quests to enjoy reward!"),
    "ctaLabel":    .string("Check out all 4 quests"),
    "ctaDeepLink": .string("hsbc://quests"),
    "totalQuests": .int(4),
]

private let defaultFeatureProductProps: [String: JSONValue] = [
    "sectionTitle": .string("Feature product"),
    "tabs":         .array([.string("Top performers"), .string("Top dividend"), .string("Top selling"), .string("Instalment")]),
    "activeTab":    .string("Top performers"),
    "activeButtonId": .string("top-performers"),
    "buttons": .array([
        .object(["id": .string("top-performers"), "name": .string("Top performers"), "description": .string("Top 3 funds by 1Y return"), "url": .string("/api/v1/funds/feature-products?filter=top-performers&limit=3")]),
        .object(["id": .string("top-dividend"), "name": .string("Top dividend"), "description": .string("Income funds with higher dividend profile"), "url": .string("/api/v1/funds/feature-products?filter=top-dividend&limit=3")]),
        .object(["id": .string("top-selling"), "name": .string("Top selling"), "description": .string("Best selling funds by subscription volume"), "url": .string("/api/v1/funds/feature-products?filter=top-selling&limit=3")]),
        .object(["id": .string("installment"), "name": .string("Installment"), "description": .string("Funds suitable for installment investment plans"), "url": .string("/api/v1/funds/feature-products?filter=installment&limit=3")]),
    ]),
    "funds": .array([
        .object(["id": .string("fp-1"), "name": .string("AB SICAV I - LOW VOLATILITY EQUITY PORTFOLIO CLASS AD S..."),
                 "code": .string("U43120"), "returnLabel": .string("1Y return"), "returnValue": .string("+54.79%"),
                 "returnPositive": .bool(true), "tags": .array([])]),
        .object(["id": .string("fp-2"), "name": .string("HANG SENG INDEX FUND CLASS A (HKD)"),
                 "code": .string("U42272"), "returnLabel": .string("1Y return"), "returnValue": .string("+18.10%"),
                 "returnPositive": .bool(true), "tags": .array([.string("ESG")])]),
        .object(["id": .string("fp-3"), "name": .string("ALLIANZ INCOME AND GROWTH CLASS AM DIS (HKD MONTHLY...)"),
                 "code": .string("U40032"), "returnLabel": .string("1Y return"), "returnValue": .string("+11.45%"),
                 "returnPositive": .bool(true), "tags": .array([.string("New fund")])]),
    ]),
    "moreLabel":    .string("View Best selling fund list (10)"),
    "moreDeepLink": .string("hsbc://funds/best-selling"),
    "bestSellingUrl": .string("/api/v1/funds/feature-products?filter=best-selling&limit=10"),
]

private let defaultWealthStudioProps: [String: JSONValue] = [
    "sectionTitle": .string("Premier Elite Wealth Studio"),
    "moreLabel":    .string("View all"),
    "moreDeepLink": .string("hsbc://wealth-studio"),
    "items": .array([
        .object(["id": .string("ws-1"), "episodeLabel": .string("Episode 13"),
                 "liveBadge": .string("To-be-live on 1 Feb 15:30"),
                 "title": .string("How AI experts think about AI?"),
                 "ctaLabel": .string("Register for live stream"),
                 "imageColor": .string("#1A1A2E")]),
        .object(["id": .string("ws-2"), "episodeLabel": .string("Episode 13"),
                 "liveBadge": .string("To-be-live on 1 Feb 15:3"),
                 "title": .string("How AI experts think about AI?"),
                 "ctaLabel": .string("Watch now"),
                 "imageColor": .string("#0F2040")]),
    ]),
]

private let defaultGuidesInsightsProps: [String: JSONValue] = [
    "sectionTitle": .string("Guides and insights"),
    "moreLabel":    .string("View all"),
    "moreDeepLink": .string("hsbc://guides"),
    "items": .array([
        .object(["id": .string("gi-1"),
                 "title": .string("Investment 101 - An investment in knowledge pays the best interest"),
                 "date": .string("8 Apr 2024"), "imageColor": .string("#2D3748"),
                 "deepLink": .string("hsbc://guides/investment-101")]),
        .object(["id": .string("gi-2"), "title": .string("Market outlook Q2 2024"),
                 "date": .string("2 Apr 2024"), "imageColor": .string("#1A365D"),
                 "deepLink": .string("hsbc://guides/market-outlook")]),
    ]),
]

private let defaultFXWatchlistProps: [String: JSONValue] = [
    "sectionTitle":   .string("FX watchlist"),
    "tierBadge":      .string("Gold Forex Club tier"),
    "tierDescription":.string("15% Spread discount has been applied to your rate."),
    "pairs": .array([
        .object(["id": .string("fx-1"), "pair": .string("USD/JPY"), "sellLabel": .string("Sell USD"),
                 "sellRate": .string("148.44"), "buyLabel": .string("Buy USD"), "buyRate": .string("148.12")]),
        .object(["id": .string("fx-2"), "pair": .string("HKD/CHF"), "sellLabel": .string("Sell HKD"),
                 "sellRate": .string("0.1042"), "buyLabel": .string("Buy HKD"), "buyRate": .string("0.1038")]),
        .object(["id": .string("fx-3"), "pair": .string("HKD/THB"), "sellLabel": .string("Sell HKD"),
                 "sellRate": .string("4.1055"), "buyLabel": .string("Buy HKD"), "buyRate": .string("4.1132")]),
    ]),
    "moreLabel":    .string("View more in FX"),
    "moreDeepLink": .string("hsbc://fx/watchlist"),
]

private let defaultDiscoverMoreProps: [String: JSONValue] = [
    "sectionTitle": .string("Discover more"),
    "items": .array([
        .object(["id": .string("dm-1"), "tag": .string("Time Deposit"), "tagColor": .string("#DB0011"),
                 "title": .string("Up to 15.5% p.a. FX Deposit Rate"),
                 "subtitle": .string("Earn up to 15.5% p.a. on FX & Time Deposits! T&Cs apply."),
                 "imageColor": .string("#1A2E4A"), "deepLink": .string("hsbc://deposit/fx")]),
        .object(["id": .string("dm-2"), "tag": .string("Well+"), "tagColor": .string("#6B46C1"),
                 "title": .string("PURE Sign up 10-day..."), "subtitle": .string(""),
                 "imageColor": .string("#2D3748"), "deepLink": .string("hsbc://wellplus")]),
    ]),
]

// MARK: - Icon map helper

private let quickIconMap: [String: String] = [
    "account": "👤", "transfer": "🌐", "fx": "💱", "stock": "📈",
    "deposit": "⏰", "holding": "📊", "safe": "💰", "fps": "↔️",
    "scan": "📷", "all": "⊞",
]

// MARK: - 1. HOME_SEARCH_HEADER

private struct WHHomeSearchHeader: View {
    let props: [String: JSONValue]
    let onSearchTap: () -> Void

    var body: some View {
        let bgHex = props["premierBg"]?.stringValue ?? "#DB0011"
        let segLabel = props["premierLabel"]?.stringValue ?? "HSBC Premier"
        let placeholder = props["placeholder"]?.stringValue ?? "Search functions, products & content"
        let showBell = props["enableNotification"]?.boolValue ?? true
        let showHeadset = props["enableHeadset"]?.boolValue ?? true

        VStack(spacing: 0) {
            // Header row
            HStack(spacing: 10) {
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.25))
                        .frame(width: 30, height: 30)
                    Text("H")
                        .font(.system(size: 13, weight: .black))
                        .foregroundColor(.white)
                }
                Text(segLabel)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
                Spacer()
                if showBell {
                    Image(systemName: "bell")
                        .font(.system(size: 18))
                        .foregroundColor(.white)
                        .onTapGesture {
                            TealiumClient.track(event: "notification_tap", category: "Wealth",
                                action: "notification_tapped", screen: "home_hub_hk", journey: "home_hub")
                        }
                }
                if showHeadset {
                    Image(systemName: "headphones")
                        .font(.system(size: 18))
                        .foregroundColor(.white)
                }
            }
            .padding(.horizontal, 16).padding(.vertical, 12)

            // White pill search bar on red background
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(Hive.Color.n400)
                    .font(.system(size: 13))
                Text(placeholder)
                    .font(.system(size: 13)).foregroundColor(Hive.Color.n400)
                Spacer()
                Text("AI")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 5).padding(.vertical, 2)
                    .background(Hive.Color.brandPrimary)
                    .cornerRadius(4)
            }
            .padding(.horizontal, 12).padding(.vertical, 9)
            .background(Color.white)
            .cornerRadius(18)
            .padding(.horizontal, 16)
            .padding(.bottom, 12)
            .onTapGesture {
                TealiumClient.track(event: "search_tap", category: "Wealth",
                    action: "search_tapped", screen: "home_hub_hk", journey: "home_hub")
                onSearchTap()
            }
        }
        .background(Color(hex: bgHex))
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "HOME_SEARCH_HEADER",
                instanceId: "slice-home-search-header", position: 0)
        }
    }
}

// MARK: - 2. COMBO_QUICK_ACCESS

private struct WHComboQuickAccess: View {
    let props: [String: JSONValue]

    private func items(from key: String) -> [[String: JSONValue]] {
        props[key]?.arrayValue.compactMap { $0.objectValue.isEmpty ? nil : $0.objectValue } ?? []
    }

    var body: some View {
        let tabs   = props["tabs"]?.arrayValue.compactMap { $0.objectValue } ?? []
        let row1   = items(from: "row1Items")
        let row2   = items(from: "row2Items")
        let activeTab = tabs.first(where: { $0["active"]?.boolValue == true })?["label"]?.stringValue ?? "My pick"

        VStack(spacing: 0) {
            // Tab bar
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(tabs.indices, id: \.self) { i in
                        let tab = tabs[i]
                        let label = tab["label"]?.stringValue ?? ""
                        let isActive = label == activeTab
                        Text(label)
                            .font(.system(size: 12, weight: isActive ? .bold : .regular))
                            .padding(.horizontal, 12).padding(.vertical, 5)
                            .background(isActive ? Color.black : Color.clear)
                            .foregroundColor(isActive ? .white : Hive.Color.n500)
                            .cornerRadius(14)
                    }
                }
                .padding(.horizontal, 14).padding(.vertical, 8)
            }
            Divider().background(Hive.Color.n100)

            // Row 1
            HStack(spacing: 0) {
                ForEach(row1.indices, id: \.self) { i in
                    let item = row1[i]
                    quickIconCell(item: item)
                }
            }
            .padding(.horizontal, 8).padding(.top, 8)

            // Row 2
            HStack(spacing: 0) {
                ForEach(row2.indices, id: \.self) { i in
                    let item = row2[i]
                    quickIconCell(item: item)
                }
            }
            .padding(.horizontal, 8).padding(.bottom, 8)
        }
        .background(Hive.Color.brandWhite)
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "COMBO_QUICK_ACCESS",
                instanceId: "slice-combo-quick-access", position: 1)
        }
    }

    @ViewBuilder
    private func quickIconCell(item: [String: JSONValue]) -> some View {
        let iconKey  = item["icon"]?.stringValue ?? ""
        let emoji    = quickIconMap[iconKey] ?? iconKey
        let label    = item["label"]?.stringValue ?? ""
        let deepLink = item["deepLink"]?.stringValue ?? ""

        VStack(spacing: 4) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color(hex: "#F5F5F5"))
                    .frame(width: 36, height: 36)
                Text(emoji).font(.system(size: 16))
            }
            Text(label)
                .font(.system(size: 9))
                .foregroundColor(Hive.Color.n700)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .frame(width: 38)
        }
        .frame(maxWidth: .infinity)
        .onTapGesture { TealiumClient.quickAccessTapped(label: label, deepLink: deepLink) }
    }
}

// MARK: - 3. CARD_ACTIVATION_BANNER

private struct WHCardActivationBanner: View {
    let props: [String: JSONValue]

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "bell.fill")
                .font(.system(size: 16))
                .foregroundColor(Hive.Color.brandPrimary)
            Text(props["message"]?.stringValue ?? "Your card needs to be activated")
                .font(.system(size: 12)).foregroundColor(Hive.Color.n700)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 12)).foregroundColor(Hive.Color.n400)
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .background(Hive.Color.brandWhite)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Hive.Color.n200, lineWidth: 1)
        )
        .cornerRadius(10)
        .padding(.horizontal, 12).padding(.vertical, 4)
        .shadow(color: .black.opacity(0.04), radius: 4, y: 1)
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "CARD_ACTIVATION_BANNER",
                instanceId: "slice-card-activation", position: 2)
        }
    }
}

// MARK: - 4. QUEST_BANNER

private struct WHQuestBanner: View {
    let props: [String: JSONValue]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Hive.Color.brandPrimary)
                        .frame(width: 32, height: 32)
                    Text("H")
                        .font(.system(size: 13, weight: .black))
                        .foregroundColor(.white)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(props["title"]?.stringValue ?? "Getting started")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(Hive.Color.n900)
                    Text(props["description"]?.stringValue ?? "")
                        .font(.system(size: 10))
                        .foregroundColor(Hive.Color.n500)
                        .lineLimit(2)
                }
            }
            Text(props["ctaLabel"]?.stringValue ?? "Check out all quests")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(Hive.Color.brandPrimary)
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .background(Hive.Color.brandWhite)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Hive.Color.n200, lineWidth: 1)
                .overlay(
                    Rectangle()
                        .fill(Hive.Color.brandPrimary)
                        .frame(width: 4)
                        .cornerRadius(2),
                    alignment: .leading
                )
        )
        .cornerRadius(10)
        .padding(.horizontal, 12).padding(.vertical, 4)
        .shadow(color: .black.opacity(0.04), radius: 4, y: 1)
        .onTapGesture {
            TealiumClient.track(event: "quest_tap", category: "Wealth",
                action: "quest_banner_tapped", screen: "home_hub_hk", journey: "home_hub")
        }
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "QUEST_BANNER",
                instanceId: "slice-getting-started", position: 3)
        }
    }
}

// MARK: - 5. FEATURE_PRODUCT

private struct FundItem: Identifiable {
    let id: String; let name: String; let code: String
    let returnLabel: String; let returnValue: String
    let returnPositive: Bool; let tags: [String]
}

private struct FeatureProductButton: Identifiable {
    let id: String; let name: String; let description: String; let url: String
}

private struct WHFeatureProduct: View {
    let props: [String: JSONValue]
    @State private var selectedButtonId: String = ""

    private func parseFunds() -> [FundItem] {
        props["funds"]?.arrayValue.compactMap { v -> FundItem? in
            let o = v.objectValue
            guard let id = o["id"]?.stringValue, !id.isEmpty else { return nil }
            return FundItem(
                id: id,
                name: o["name"]?.stringValue ?? "",
                code: o["code"]?.stringValue ?? "",
                returnLabel: o["returnLabel"]?.stringValue ?? "1Y return",
                returnValue: o["returnValue"]?.stringValue ?? "",
                returnPositive: o["returnPositive"]?.boolValue ?? true,
                tags: o["tags"]?.arrayValue.map { $0.stringValue } ?? []
            )
        } ?? []
    }

    private func parseButtons() -> [FeatureProductButton] {
        let parsed = props["buttons"]?.arrayValue.compactMap { v -> FeatureProductButton? in
            let o = v.objectValue
            guard let id = o["id"]?.stringValue, !id.isEmpty else { return nil }
            return FeatureProductButton(
                id: id,
                name: o["name"]?.stringValue ?? id,
                description: o["description"]?.stringValue ?? "",
                url: o["url"]?.stringValue ?? ""
            )
        } ?? []
        if !parsed.isEmpty { return parsed }
        return (props["tabs"]?.arrayValue.map { $0.stringValue } ?? []).map {
            FeatureProductButton(id: $0, name: $0, description: "", url: "")
        }
    }

    var body: some View {
        let buttons = parseButtons()
        let funds = parseFunds()
        let defaultButtonId = props["activeButtonId"]?.stringValue ?? props["activeTab"]?.stringValue ?? buttons.first?.id ?? ""
        let activeButtonId = selectedButtonId.isEmpty ? defaultButtonId : selectedButtonId
        let moreLabel = props["moreLabel"]?.stringValue ?? "View more"
        let moreLink = props["bestSellingUrl"]?.stringValue ?? props["moreDeepLink"]?.stringValue ?? ""

        VStack(alignment: .leading, spacing: 0) {
            // Section title
            HStack {
                Text(props["sectionTitle"]?.stringValue ?? "Feature product")
                    .font(.system(size: 14, weight: .bold))
                Spacer()
            }.padding(.horizontal, 14).padding(.top, 12).padding(.bottom, 8)

            // Tab strip
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(buttons) { button in
                        let isActive = button.id == activeButtonId || button.name == activeButtonId
                        Text(button.name)
                            .font(.system(size: 11, weight: isActive ? .bold : .regular))
                            .padding(.horizontal, 12).padding(.vertical, 5)
                            .background(isActive ? Hive.Color.brandWhite : Color.clear)
                            .foregroundColor(isActive ? Hive.Color.n900 : Hive.Color.n400)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(isActive ? Hive.Color.n200 : Color.clear, lineWidth: 1)
                            )
                            .cornerRadius(14)
                            .shadow(color: isActive ? .black.opacity(0.06) : .clear, radius: 3, y: 1)
                            .onTapGesture {
                                selectedButtonId = button.id
                                TealiumClient.sliceTapped(sliceType: "FEATURE_PRODUCT",
                                    instanceId: "slice-feature-product", ctaLabel: button.name, deepLink: button.url)
                            }
                    }
                }
                .padding(.horizontal, 12)
            }

            // Fund rows
            ForEach(Array(funds.enumerated()), id: \.element.id) { idx, fund in
                HStack(spacing: 8) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(fund.name)
                            .font(.system(size: 11))
                            .foregroundColor(Hive.Color.n900)
                            .lineLimit(2)
                        HStack(spacing: 4) {
                            Text(fund.code)
                                .font(.system(size: 9))
                                .foregroundColor(Hive.Color.n400)
                            ForEach(fund.tags, id: \.self) { tag in
                                Text(tag)
                                    .font(.system(size: 9))
                                    .padding(.horizontal, 5).padding(.vertical, 1)
                                    .background(Color(hex: "#F0FDF4"))
                                    .foregroundColor(Color(hex: "#059669"))
                                    .overlay(RoundedRectangle(cornerRadius: 3)
                                        .stroke(Color(hex: "#D1FAE5"), lineWidth: 1))
                                    .cornerRadius(3)
                            }
                        }
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 1) {
                        Text(fund.returnLabel)
                            .font(.system(size: 9)).foregroundColor(Hive.Color.n400)
                        Text(fund.returnValue)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(fund.returnPositive ? Hive.Color.brandPrimary : Color(hex: "#059669"))
                    }
                    Image(systemName: "ellipsis")
                        .font(.system(size: 12)).foregroundColor(Hive.Color.n400)
                }
                .padding(.horizontal, 14).padding(.vertical, 10)
                if idx < funds.count - 1 {
                    Divider().padding(.horizontal, 14)
                }
            }

            // More link
            if !moreLabel.isEmpty {
                HStack(spacing: 4) {
                    Text(moreLabel)
                        .font(.system(size: 11)).foregroundColor(Hive.Color.n700)
                    Image(systemName: "chevron.right")
                        .font(.system(size: 11)).foregroundColor(Hive.Color.n400)
                }
                .padding(.horizontal, 14).padding(.vertical, 10)
                .onTapGesture {
                    TealiumClient.sliceTapped(sliceType: "FEATURE_PRODUCT",
                        instanceId: "slice-feature-product", ctaLabel: moreLabel, deepLink: moreLink)
                }
            }
        }
        .background(Hive.Color.brandWhite)
        .onAppear {
            if selectedButtonId.isEmpty { selectedButtonId = props["activeButtonId"]?.stringValue ?? props["activeTab"]?.stringValue ?? "" }
            TealiumClient.sliceImpression(sliceType: "FEATURE_PRODUCT",
                instanceId: "slice-feature-product", position: 4)
        }
    }
}

// MARK: - 6. WEALTH_STUDIO_CAROUSEL

private struct StudioItem: Identifiable {
    let id: String; let episodeLabel: String; let liveBadge: String
    let title: String; let ctaLabel: String; let imageColor: String
    let videoUrl: String
}

private struct WHWealthStudioCarousel: View {
    let props: [String: JSONValue]
    @State private var activeIdx = 0
    @State private var playingVideoUrl: String? = nil

    #if targetEnvironment(simulator)
    private let mediaBase = "http://127.0.0.1:4000"
    #else
    private let mediaBase = "http://10.81.103.103:4000"
    #endif

    private func resolvedVideoURL(_ raw: String) -> URL? {
        guard !raw.isEmpty else { return nil }
        let fixed = raw.replacingOccurrences(of: "http://localhost:4000", with: mediaBase)
                       .replacingOccurrences(of: "http://127.0.0.1:4000", with: mediaBase)
        return URL(string: fixed)
    }

    private func parseItems() -> [StudioItem] {
        props["items"]?.arrayValue.compactMap { v -> StudioItem? in
            let o = v.objectValue
            guard let id = o["id"]?.stringValue, !id.isEmpty else { return nil }
            return StudioItem(
                id: id,
                episodeLabel: o["episodeLabel"]?.stringValue ?? "",
                liveBadge: o["liveBadge"]?.stringValue ?? "",
                title: o["title"]?.stringValue ?? "",
                ctaLabel: o["ctaLabel"]?.stringValue ?? "Watch now",
                imageColor: o["imageColor"]?.stringValue ?? "#1A1A2E",
                videoUrl: o["videoUrl"]?.stringValue ?? ""
            )
        } ?? []
    }

    var body: some View {
        let items = parseItems()
        let sectionTitle = props["sectionTitle"]?.stringValue ?? "Premier Elite Wealth Studio"
        let moreLabel    = props["moreLabel"]?.stringValue ?? "View all"

        VStack(spacing: 0) {
            HStack {
                Text(sectionTitle).font(.system(size: 14, weight: .bold))
                Spacer()
                Text("\(moreLabel) ›").font(.system(size: 11)).foregroundColor(Hive.Color.brandPrimary)
            }.padding(.horizontal, 14).padding(.top, 12).padding(.bottom, 8)

            // Carousel area: video replaces the TabView in the same 160 pt frame
            if let rawUrl = playingVideoUrl, let videoURL = resolvedVideoURL(rawUrl) {
                WHInlineVideoPlayer(url: videoURL, onClose: { playingVideoUrl = nil })
                    .frame(height: 160)
                    .cornerRadius(12)
                    .padding(.horizontal, 14)
                Spacer().frame(height: 14)
            } else {
                TabView(selection: $activeIdx) {
                    ForEach(Array(items.enumerated()), id: \.offset) { idx, item in
                        VStack(alignment: .leading, spacing: 0) {
                            // Fixed image area
                            ZStack(alignment: .bottomLeading) {
                                RoundedRectangle(cornerRadius: 0)
                                    .fill(Color(hex: item.imageColor))
                                    .frame(height: 100)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(item.liveBadge)
                                        .font(.system(size: 8, weight: .bold))
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 6).padding(.vertical, 2)
                                        .background(Hive.Color.brandPrimary)
                                        .cornerRadius(3)
                                    Text(item.episodeLabel)
                                        .font(.system(size: 9))
                                        .foregroundColor(Color.white.opacity(0.7))
                                    Text(item.title)
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(.white)
                                        .lineLimit(2)
                                }
                                .padding(8)
                            }
                            // Fixed text area (always 60 pt) so all cards align
                            HStack(spacing: 5) {
                                ZStack {
                                    Circle()
                                        .fill(Color.white.opacity(0.2))
                                        .frame(width: 18, height: 18)
                                    Image(systemName: "play.fill")
                                        .font(.system(size: 7)).foregroundColor(.white)
                                }
                                Text(item.ctaLabel)
                                    .font(.system(size: 9))
                                    .foregroundColor(Color.white.opacity(0.9))
                                Spacer()
                            }
                            .padding(.horizontal, 8).padding(.vertical, 8)
                            .frame(height: 40)
                            .background(Color(hex: item.imageColor))
                        }
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.15), radius: 8, y: 2)
                        .padding(.horizontal, 14)
                        .tag(idx)
                        .onTapGesture {
                            TealiumClient.wealthStudioTapped(title: item.title, instanceId: item.id)
                            if !item.videoUrl.isEmpty { playingVideoUrl = item.videoUrl }
                        }
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .frame(height: 160)

                // Pagination dots — active follows swipe
                HStack(spacing: 4) {
                    ForEach(items.indices, id: \.self) { i in
                        Capsule()
                            .fill(i == activeIdx ? Hive.Color.n900 : Hive.Color.n200)
                            .frame(width: i == activeIdx ? 16 : 6, height: 4)
                    }
                }.padding(.vertical, 10)
            }
        }
        .background(Hive.Color.n50)
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "WEALTH_STUDIO_CAROUSEL",
                instanceId: "slice-wealth-studio", position: 5)
        }
    }
}

// MARK: - 7. GUIDES_INSIGHTS_CAROUSEL

private struct GuideItem: Identifiable {
    let id: String; let title: String; let date: String
    let imageColor: String; let deepLink: String
}

private struct WHGuidesInsights: View {
    let props: [String: JSONValue]
    @State private var activeIdx = 0

    private func parseItems() -> [GuideItem] {
        props["items"]?.arrayValue.compactMap { v -> GuideItem? in
            let o = v.objectValue
            guard let id = o["id"]?.stringValue, !id.isEmpty else { return nil }
            return GuideItem(id: id,
                title: o["title"]?.stringValue ?? "",
                date: o["date"]?.stringValue ?? "",
                imageColor: o["imageColor"]?.stringValue ?? "#2D3748",
                deepLink: o["deepLink"]?.stringValue ?? "")
        } ?? []
    }

    var body: some View {
        let items = parseItems()
        let sectionTitle = props["sectionTitle"]?.stringValue ?? "Guides and insights"
        let moreLabel    = props["moreLabel"]?.stringValue ?? "View all"

        VStack(spacing: 0) {
            HStack {
                Text(sectionTitle).font(.system(size: 14, weight: .bold))
                Spacer()
                Text("\(moreLabel) ›").font(.system(size: 11)).foregroundColor(Hive.Color.brandPrimary)
            }.padding(.horizontal, 14).padding(.top, 12).padding(.bottom, 8)

            TabView(selection: $activeIdx) {
                ForEach(Array(items.enumerated()), id: \.offset) { idx, item in
                    VStack(alignment: .leading, spacing: 0) {
                        // Fixed image area
                        RoundedRectangle(cornerRadius: 0)
                            .fill(Color(hex: item.imageColor))
                            .frame(height: 90)
                        // Fixed text area
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.title)
                                .font(.system(size: 10))
                                .foregroundColor(Hive.Color.n900)
                                .lineLimit(3)
                            HStack(spacing: 4) {
                                Image(systemName: "clock")
                                    .font(.system(size: 9)).foregroundColor(Hive.Color.n400)
                                Text(item.date)
                                    .font(.system(size: 9)).foregroundColor(Hive.Color.n400)
                            }
                            Spacer()
                        }
                        .padding(.horizontal, 10).padding(.top, 8)
                        .frame(height: 70)
                        .background(Hive.Color.brandWhite)
                    }
                    .cornerRadius(12)
                    .shadow(color: .black.opacity(0.08), radius: 4, y: 1)
                    .padding(.horizontal, 14)
                    .tag(idx)
                    .onTapGesture {
                        TealiumClient.guidesTapped(title: item.title, instanceId: item.id)
                    }
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(height: 174)

            HStack(spacing: 4) {
                ForEach(items.indices, id: \.self) { i in
                    Capsule()
                        .fill(i == activeIdx ? Hive.Color.n900 : Hive.Color.n200)
                        .frame(width: i == activeIdx ? 16 : 6, height: 4)
                }
            }.padding(.vertical, 10)
        }
        .background(Hive.Color.brandWhite)
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "GUIDES_INSIGHTS_CAROUSEL",
                instanceId: "slice-guides-insights", position: 6)
        }
    }
}

// MARK: - 8. FX_WATCHLIST

private struct FXPair: Identifiable {
    let id: String; let pair: String
    let sellLabel: String; let sellRate: String
    let buyLabel: String;  let buyRate: String
}

private struct WHFXWatchlist: View {
    let props: [String: JSONValue]

    private func parsePairs() -> [FXPair] {
        props["pairs"]?.arrayValue.compactMap { v -> FXPair? in
            let o = v.objectValue
            guard let id = o["id"]?.stringValue, !id.isEmpty else { return nil }
            return FXPair(id: id,
                pair: o["pair"]?.stringValue ?? "",
                sellLabel: o["sellLabel"]?.stringValue ?? "Sell",
                sellRate:  o["sellRate"]?.stringValue ?? "",
                buyLabel:  o["buyLabel"]?.stringValue ?? "Buy",
                buyRate:   o["buyRate"]?.stringValue ?? "")
        } ?? []
    }

    var body: some View {
        let pairs         = parsePairs()
        let sectionTitle  = props["sectionTitle"]?.stringValue ?? "FX watchlist"
        let tierBadge     = props["tierBadge"]?.stringValue
        let tierDesc      = props["tierDescription"]?.stringValue ?? ""
        let moreLabel     = props["moreLabel"]?.stringValue ?? "View more in FX"

        VStack(alignment: .leading, spacing: 0) {
            Text(sectionTitle)
                .font(.system(size: 14, weight: .bold))
                .padding(.horizontal, 14).padding(.top, 12).padding(.bottom, 8)

            // Tier badge
            if let badge = tierBadge {
                HStack(spacing: 10) {
                    Text("🏅").font(.system(size: 20))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(badge)
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color(hex: "#92400E"))
                        Text(tierDesc)
                            .font(.system(size: 10))
                            .foregroundColor(Color(hex: "#B45309"))
                    }
                    Spacer()
                }
                .padding(.horizontal, 12).padding(.vertical, 10)
                .background(Color(hex: "#FFFBEB"))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "#FDE68A"), lineWidth: 1))
                .cornerRadius(8)
                .padding(.horizontal, 14).padding(.bottom, 8)
            }

            ForEach(Array(pairs.enumerated()), id: \.element.id) { idx, pair in
                HStack(spacing: 6) {
                    Text("📈").font(.system(size: 11))
                    Text(pair.pair)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(Hive.Color.n900)
                        .frame(width: 60, alignment: .leading)
                    Spacer()
                    VStack(alignment: .leading, spacing: 1) {
                        Text(pair.sellLabel).font(.system(size: 9)).foregroundColor(Hive.Color.n400)
                        Text(pair.sellRate).font(.system(size: 12, weight: .semibold)).foregroundColor(Hive.Color.n900)
                    }
                    Spacer()
                    VStack(alignment: .leading, spacing: 1) {
                        Text(pair.buyLabel).font(.system(size: 9)).foregroundColor(Hive.Color.n400)
                        Text(pair.buyRate).font(.system(size: 12, weight: .semibold)).foregroundColor(Hive.Color.n900)
                    }
                    Image(systemName: "ellipsis")
                        .font(.system(size: 12)).foregroundColor(Hive.Color.n400)
                }
                .padding(.horizontal, 14).padding(.vertical, 10)
                if idx < pairs.count - 1 {
                    Divider().padding(.horizontal, 14)
                }
            }

            HStack(spacing: 4) {
                Text(moreLabel).font(.system(size: 11)).foregroundColor(Hive.Color.n700)
                Image(systemName: "chevron.right").font(.system(size: 11)).foregroundColor(Hive.Color.n400)
            }
            .padding(.horizontal, 14).padding(.vertical, 10)
            .onTapGesture {
                TealiumClient.track(event: "fx_watchlist_more_tap", category: "Wealth",
                    action: "fx_watchlist_more_tapped", screen: "home_hub_hk", journey: "home_hub")
            }
        }
        .background(Hive.Color.brandWhite)
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "FX_WATCHLIST",
                instanceId: "slice-fx-watchlist", position: 7)
        }
    }
}

// MARK: - 9. DISCOVER_MORE_CAROUSEL

private struct DiscoverItem: Identifiable {
    let id: String; let tag: String; let tagColor: String
    let title: String; let subtitle: String
    let imageColor: String; let deepLink: String
}

private struct WHDiscoverMore: View {
    let props: [String: JSONValue]
    @State private var activeIdx = 0

    private func parseItems() -> [DiscoverItem] {
        props["items"]?.arrayValue.compactMap { v -> DiscoverItem? in
            let o = v.objectValue
            guard let id = o["id"]?.stringValue, !id.isEmpty else { return nil }
            return DiscoverItem(id: id,
                tag: o["tag"]?.stringValue ?? "",
                tagColor: o["tagColor"]?.stringValue ?? "#DB0011",
                title: o["title"]?.stringValue ?? "",
                subtitle: o["subtitle"]?.stringValue ?? "",
                imageColor: o["imageColor"]?.stringValue ?? "#1A2E4A",
                deepLink: o["deepLink"]?.stringValue ?? "")
        } ?? []
    }

    var body: some View {
        let items        = parseItems()
        let sectionTitle = props["sectionTitle"]?.stringValue ?? "Discover more"

        VStack(spacing: 0) {
            HStack {
                Text(sectionTitle).font(.system(size: 14, weight: .bold))
                Spacer()
            }.padding(.horizontal, 14).padding(.top, 12).padding(.bottom, 8)

	            TabView(selection: $activeIdx) {
	                ForEach(Array(items.enumerated()), id: \.offset) { idx, item in
	                    VStack(alignment: .leading, spacing: 0) {
	                        // Fixed image area with tag chip
	                        ZStack(alignment: .topLeading) {
	                            Rectangle()
	                                .fill(Color(hex: item.imageColor))
	                                .frame(maxWidth: .infinity, minHeight: 100, maxHeight: 100)
	                            Text(item.tag)
	                                .font(.system(size: 9, weight: .bold))
	                                .foregroundColor(.white)
                                .padding(.horizontal, 6).padding(.vertical, 2)
                                .background(Color(hex: item.tagColor))
	                                .cornerRadius(3)
	                                .padding(8)
	                        }
	                        .frame(maxWidth: .infinity, minHeight: 100, maxHeight: 100)
	                        // Fixed text area
	                        VStack(alignment: .leading, spacing: 4) {
	                            Text(item.title)
	                                .font(.system(size: 10, weight: .semibold))
                                .foregroundColor(Hive.Color.n900)
                                .lineLimit(2)
                            if !item.subtitle.isEmpty {
	                                Text(item.subtitle)
	                                    .font(.system(size: 9))
	                                    .foregroundColor(Hive.Color.n400)
	                                    .lineLimit(2)
	                            }
	                            Spacer()
	                        }
	                        .padding(.horizontal, 10).padding(.top, 8)
	                        .frame(maxWidth: .infinity, minHeight: 68, maxHeight: 68, alignment: .topLeading)
	                        .background(Hive.Color.brandWhite)
	                    }
	                    .frame(maxWidth: .infinity, alignment: .leading)
	                    .background(Hive.Color.brandWhite)
	                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
	                    .shadow(color: .black.opacity(0.08), radius: 6, y: 2)
	                    .padding(.horizontal, 14)
	                    .tag(idx)
                    .onTapGesture {
                        TealiumClient.discoverMoreTapped(title: item.title, tag: item.tag)
                    }
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(height: 182)

            HStack(spacing: 4) {
                ForEach(items.indices, id: \.self) { i in
                    Capsule()
                        .fill(i == activeIdx ? Hive.Color.n900 : Hive.Color.n200)
                        .frame(width: i == activeIdx ? 16 : 6, height: 4)
                }
            }.padding(.vertical, 10)
        }
        .background(Hive.Color.n50)
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "DISCOVER_MORE_CAROUSEL",
                instanceId: "slice-discover-more", position: 8)
        }
    }
}
