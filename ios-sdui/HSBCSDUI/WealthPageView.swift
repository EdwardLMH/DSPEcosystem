import SwiftUI

// MARK: - SDUI payload models (Wealth Hub page)

private struct WealthHubPayload: Decodable {
    let pageId: String?
    let screen: String
    let layout: WealthSDUINode
}

private struct WealthSDUINode: Decodable {
    let type: String
    let id: String
    let props: [String: JSONValue]?
    let children: [WealthSDUINode]?
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

    var stringValue: String { if case .string(let s) = self { return s }; return "" }
}

// MARK: - ViewModel

@MainActor
private final class WealthSDUIViewModel: ObservableObject {
    enum State { case loading, sdui(WealthSDUINode), fallback }

    @Published var state: State = .loading

    // Switches to the production URL once the page is approved.
    // During development the BFF returns 404 → falls back to hardcoded UI.
    #if targetEnvironment(simulator)
    private let baseURL = "http://127.0.0.1:4000"
    #else
    private let baseURL = "http://10.81.103.103:4000"
    #endif

    func load() async {
        guard let url = URL(string: "\(baseURL)/api/v1/screen/home-wealth-hk") else {
            state = .fallback; return
        }
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            if let http = response as? HTTPURLResponse, http.statusCode == 200 {
                let payload = try JSONDecoder().decode(WealthHubPayload.self, from: data)
                state = .sdui(payload.layout)
            } else {
                // Page not yet approved to production → show hardcoded UI
                state = .fallback
            }
        } catch {
            state = .fallback
        }
    }
}

// MARK: - Entry point

struct WealthPageView: View {
    @StateObject private var vm = WealthSDUIViewModel()
    @State private var adDismissed = false
    @State private var searchPresented = false

    var body: some View {
        Group {
            switch vm.state {
            case .loading:
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Hive.Color.n50.ignoresSafeArea())

            case .sdui(let root):
                WealthSDUIRootView(root: root,
                                   searchPresented: $searchPresented)

            case .fallback:
                WealthHardcodedView(adDismissed: $adDismissed,
                                    searchPresented: $searchPresented)
            }
        }
        .task { await vm.load() }
        .fullScreenCover(isPresented: $searchPresented) {
            AISearchView(isPresented: $searchPresented)
        }
    }
}

// MARK: - SDUI-driven render (when page is live on production)

private struct WealthSDUIRootView: View {
    let root: WealthSDUINode
    @Binding var searchPresented: Bool

    var body: some View {
        NavigationView {
            ZStack(alignment: .top) {
                Hive.Color.n50.ignoresSafeArea()
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {
                        WealthNodeView(node: root,
                                       onSearchTap: { searchPresented = true })
                        Spacer().frame(height: 40)
                    }
                }
            }
            .navigationBarHidden(true)
            .onAppear { TealiumClient.wealthHubViewed() }
        }
    }
}

// Recursive SDUI node renderer — maps BFF component types to native views
private struct WealthNodeView: View {
    let node: WealthSDUINode
    let onSearchTap: () -> Void

    var body: some View {
        switch node.type {
        case "container", "scroll_container":
            VStack(spacing: 0) {
                ForEach((node.children ?? []).indices, id: \.self) { i in
                    WealthNodeView(node: node.children![i], onSearchTap: onSearchTap)
                }
            }

        case "header_nav":
            WHHeaderNav(onSearchTap: onSearchTap)

        case "quick_access":
            WHQuickAccess()

        case "promo_banner":
            WHPromoBanner()

        case "function_grid":
            WHFunctionGrid()

        case "ai_assistant":
            WHAIAssistant()

        case "flash_loan":
            WHFlashLoan()

        case "wealth_selection":
            WHWealthSelection()

        case "featured_rankings":
            WHFeaturedRankings()

        case "life_deals":
            WHLifeDeals()

        default:
            EmptyView()
        }
    }
}

// MARK: - Hardcoded fallback (used until page is approved on production)

private struct WealthHardcodedView: View {
    @Binding var adDismissed: Bool
    @Binding var searchPresented: Bool

    var body: some View {
        NavigationView {
            ZStack(alignment: .top) {
                Hive.Color.n50.ignoresSafeArea()
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {
                        WHHeaderNav(onSearchTap: { searchPresented = true })
                        WHQuickAccess()
                        WHPromoBanner()
                        WHFunctionGrid()
                        WHAIAssistant()
                        if !adDismissed { WHAdBanner(onDismiss: { adDismissed = true }) }
                        WHFlashLoan()
                        WHWealthSelection()
                        WHFeaturedRankings()
                        WHLifeDeals()
                        Spacer().frame(height: 40)
                    }
                }
            }
            .navigationBarHidden(true)
            .onAppear { TealiumClient.wealthHubViewed() }
        }
    }
}

// MARK: - 1. Header Nav

private struct WHHeaderNav: View {
    let onSearchTap: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(Hive.Color.n400)
                    .font(.system(size: 13))
                Text("搜尋功能、產品")
                    .font(.system(size: 13)).foregroundColor(Hive.Color.n400)
                Spacer()
            }
            .padding(.horizontal, 14).padding(.vertical, 8)
            .background(Hive.Color.n100).cornerRadius(18)
            .frame(maxWidth: .infinity)
            .onTapGesture {
                TealiumClient.track(event: "search_tap", category: "Wealth",
                    action: "search_tapped", screen: "wealth_hub_hk", journey: "wealth_hub")
                onSearchTap()
            }

            Image(systemName: "bell")
                .font(.system(size: 20))
                .foregroundColor(Hive.Color.n800)
                .onTapGesture {
                    TealiumClient.track(event: "notification_tap", category: "Wealth",
                        action: "notification_tapped", screen: "wealth_hub_hk", journey: "wealth_hub")
                }

            Image(systemName: "qrcode.viewfinder")
                .font(.system(size: 20))
                .foregroundColor(Hive.Color.n800)
                .onTapGesture {
                    TealiumClient.track(event: "qr_tap", category: "Wealth",
                        action: "qr_scanner_tapped", screen: "wealth_hub_hk", journey: "wealth_hub")
                }
        }
        .padding(.horizontal, 14).padding(.vertical, 8)
        .background(Hive.Color.brandWhite)
        .overlay(Rectangle().frame(height: 1).foregroundColor(Hive.Color.n200), alignment: .bottom)
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "HEADER_NAV", instanceId: "slice-header",
                                          position: 0)
        }
    }
}

// MARK: - 2. Quick Access

private struct WHQuickAccess: View {
    private let items: [(icon: String, label: String, deepLink: String)] = [
        ("🌙", "朝朝寶",   "hsbc://wealth/morning-treasure"),
        ("💵", "借錢",     "hsbc://loan/apply"),
        ("↔️", "轉帳",     "hsbc://transfer"),
        ("📊", "帳戶總覽", "hsbc://accounts"),
    ]

    var body: some View {
        HStack {
            ForEach(items, id: \.label) { item in
                VStack(spacing: 5) {
                    ZStack {
                        LinearGradient(colors: [Color(hex: "#F0F9FF"), Color(hex: "#E0F2FE")],
                                       startPoint: .topLeading, endPoint: .bottomTrailing)
                        Text(item.icon).font(.system(size: 22))
                    }
                    .frame(width: 48, height: 48).cornerRadius(14)
                    .shadow(color: .black.opacity(0.08), radius: 6, y: 2)

                    Text(item.label).font(.system(size: 10)).foregroundColor(Hive.Color.n700)
                }
                .frame(maxWidth: .infinity)
                .onTapGesture {
                    TealiumClient.quickAccessTapped(label: item.label, deepLink: item.deepLink)
                }
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(Hive.Color.brandWhite)
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "QUICK_ACCESS",
                                          instanceId: "slice-quick", position: 1)
        }
    }
}

// MARK: - 3. Promo Banner

private struct WHPromoBanner: View {
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("每月10日開啓")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(Hive.Color.brandPrimary)
                    .padding(.horizontal, 8).padding(.vertical, 2)
                    .background(Color(hex: "#FFEDED")).cornerRadius(10)

                Text("10分招財日")
                    .font(.system(size: 16, weight: .heavy))
                    .foregroundColor(Hive.Color.n900).lineLimit(1)

                Text("查帳單·學投資·優配置")
                    .font(.system(size: 10)).foregroundColor(Hive.Color.n500)

                Button("點擊參與") {
                    TealiumClient.promoBannerTapped(title: "10分招財日",
                        instanceId: "slice-promo-10",
                        contentId: "promo-10-finance-day")
                }
                .font(.system(size: 11, weight: .bold))
                .padding(.horizontal, 16).padding(.vertical, 6)
                .background(Hive.Color.brandPrimary).foregroundColor(.white)
                .cornerRadius(14)
                .padding(.top, 8)
            }
            Spacer()
            ZStack {
                Color(hex: "#E8F4FD").cornerRadius(12)
                Text("🎯").font(.system(size: 32))
            }.frame(width: 80, height: 80)
        }
        .padding(.horizontal, 12).padding(.vertical, 12)
        .background(Color(hex: "#E8F4FD"))
        .cornerRadius(14)
        .padding(.horizontal, 12).padding(.vertical, 8)
        .shadow(color: .black.opacity(0.06), radius: 8, y: 2)
        .onAppear {
            TealiumClient.promoBannerImpression(title: "10分招財日",
                instanceId: "slice-promo-10", contentId: "promo-10-finance-day")
        }
    }
}

// MARK: - 4. Function Grid

private struct WHFunctionGrid: View {
    private let rows: [[(icon: String, label: String, deepLink: String)]] = [
        [("💳","信用卡","hsbc://cards"), ("📄","收支明細","hsbc://statements"),
         ("🔄","他行卡轉入","hsbc://transfer/external"),
         ("🏙️","城市服務","hsbc://city-services"), ("🔥","熱門活動","hsbc://events")],
        [("📈","理財","hsbc://wealth"), ("Ⓜ️","M+會員","hsbc://membership"),
         ("🎬","影票","hsbc://movies"), ("💹","基金","hsbc://funds"),
         ("⋯","全部","hsbc://all-services")],
    ]

    var body: some View {
        VStack(spacing: 6) {
            ForEach(rows.indices, id: \.self) { ri in
                HStack {
                    ForEach(rows[ri], id: \.label) { item in
                        VStack(spacing: 4) {
                            ZStack {
                                Color(hex: "#F5F6F8").cornerRadius(12)
                                Text(item.icon).font(.system(size: 20))
                            }.frame(width: 44, height: 44)
                            Text(item.label)
                                .font(.system(size: 10))
                                .foregroundColor(Hive.Color.n700)
                                .multilineTextAlignment(.center)
                                .lineLimit(2)
                        }
                        .frame(maxWidth: .infinity)
                        .onTapGesture {
                            TealiumClient.track(event: "function_tap", category: "Wealth",
                                action: "function_tapped", label: item.label,
                                screen: "wealth_hub_hk", journey: "wealth_hub",
                                custom: ["function_label": item.label,
                                         "deep_link": item.deepLink])
                        }
                    }
                }
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 8)
        .background(Hive.Color.brandWhite)
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "FUNCTION_GRID",
                                          instanceId: "slice-func-grid", position: 3)
        }
    }
}

// MARK: - 5. AI Assistant

private struct WHAIAssistant: View {
    var body: some View {
        HStack(spacing: 8) {
            Text("✉️").font(.system(size: 20))
            Text("Hi，我是你的智能財富助理")
                .font(.system(size: 11)).foregroundColor(Hive.Color.n600)
            Spacer()
            Text("›").font(.system(size: 14)).foregroundColor(Hive.Color.n500)
        }
        .padding(.horizontal, 12).padding(.vertical, 8)
        .background(Hive.Color.n50).cornerRadius(10)
        .padding(.horizontal, 16).padding(.vertical, 4)
        .onTapGesture { TealiumClient.aiAssistantTapped() }
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "AI_ASSISTANT",
                                          instanceId: "slice-ai", position: 4)
        }
    }
}

// MARK: - 6. Ad Banner

private struct WHAdBanner: View {
    let onDismiss: () -> Void

    var body: some View {
        ZStack(alignment: .topTrailing) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("春季播種黃金期")
                        .font(.system(size: 13, weight: .bold)).foregroundColor(Color(hex: "#92400E"))
                    Text("配置正當時，播下「金種子」")
                        .font(.system(size: 10)).foregroundColor(Color(hex: "#78716C"))
                    Button("抽體驗禮") {
                        TealiumClient.sliceTapped(sliceType: "AD_BANNER",
                            instanceId: "slice-ad-spring",
                            ctaLabel: "抽體驗禮",
                            deepLink: "hsbc://campaign/spring-investment")
                    }
                    .font(.system(size: 11, weight: .bold))
                    .padding(.horizontal, 14).padding(.vertical, 5)
                    .background(Hive.Color.brandPrimary).foregroundColor(.white)
                    .cornerRadius(12).padding(.top, 8)
                }
                Spacer()
                ZStack {
                    Color.black.opacity(0.08).cornerRadius(10)
                    Text("🌱").font(.system(size: 28))
                }.frame(width: 72, height: 72)
            }
            .padding(.horizontal, 16).padding(.vertical, 12)
            .background(LinearGradient(colors: [Color(hex: "#FFFBEB"), Color(hex: "#FEF3C7")],
                                       startPoint: .topLeading, endPoint: .bottomTrailing))
            .cornerRadius(14)

            Button(action: {
                TealiumClient.adBannerDismissed(title: "春季播種黃金期")
                onDismiss()
            }) {
                Image(systemName: "xmark")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Hive.Color.n400)
                    .padding(8)
            }
        }
        .padding(.horizontal, 12).padding(.vertical, 6)
        .shadow(color: .black.opacity(0.06), radius: 8, y: 2)
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "AD_BANNER",
                                          instanceId: "slice-ad-spring", position: 5)
        }
    }
}

// MARK: - 7. Flash Loan

private struct WHFlashLoan: View {
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("⚡ 閃電貸 極速放款")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(Hive.Color.brandPrimary)
                Text("最高可借額度")
                    .font(.system(size: 10)).foregroundColor(Hive.Color.n500)
                Text("HKD 300,000.00")
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundColor(Hive.Color.n900)
            }
            Spacer()
            Button("獲取額度") {
                TealiumClient.sliceTapped(sliceType: "FLASH_LOAN",
                    instanceId: "slice-flash-loan",
                    ctaLabel: "獲取額度",
                    deepLink: "hsbc://loan/flash")
            }
            .font(.system(size: 12, weight: .bold))
            .padding(.horizontal, 18).padding(.vertical, 10)
            .background(
                LinearGradient(colors: [Hive.Color.brandPrimary, Color(hex: "#FF2233")],
                               startPoint: .topLeading, endPoint: .bottomTrailing)
            )
            .foregroundColor(.white).cornerRadius(20)
            .shadow(color: Hive.Color.brandPrimary.opacity(0.3), radius: 12, y: 4)
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(LinearGradient(colors: [Color(hex: "#FFF5F5"), Color(hex: "#FFE4E4")],
                                   startPoint: .topLeading, endPoint: .bottomTrailing))
        .cornerRadius(14)
        .padding(.horizontal, 12).padding(.vertical, 6)
        .shadow(color: Hive.Color.brandPrimary.opacity(0.08), radius: 8, y: 2)
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "FLASH_LOAN",
                                          instanceId: "slice-flash-loan", position: 6)
        }
    }
}

// MARK: - 8. Wealth Selection

private struct WealthProduct {
    let id: String; let name: String; let tag: String
    let yield7Day: String; let risk: String; let redemption: String
    let cta: String; let deepLink: String; let highlighted: Bool
}

private let wealthProducts: [WealthProduct] = [
    .init(id:"w1", name:"活錢理財｜歷史天天正收益",  tag:"代碼",  yield7Day:"2.80%",
          risk:"R1低風險", redemption:"贖回T+1到帳",   cta:"去看看",
          deepLink:"hsbc://wealth/daily-positive",    highlighted:true),
    .init(id:"w2", name:"主投債券",                  tag:"代碼",  yield7Day:"3.04%",
          risk:"歷史周周正", redemption:"成立以來…",    cta:"查看",
          deepLink:"hsbc://wealth/bond-fund",         highlighted:false),
    .init(id:"w3", name:"年均收益率",                tag:"收益確定",yield7Day:"2.31%",
          risk:"保証領取",  redemption:"穩健低波",       cta:"查看",
          deepLink:"hsbc://wealth/guaranteed",        highlighted:false),
]

private struct WHWealthSelection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("財富精選").font(.system(size: 15, weight: .bold))
                Spacer()
                Text("更多 ›").font(.system(size: 12)).foregroundColor(Hive.Color.brandPrimary)
            }.padding(.bottom, 10)

            ForEach(wealthProducts.indices, id: \.self) { i in
                let p = wealthProducts[i]
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(p.name).font(.system(size: 12, weight: .semibold))
                            .foregroundColor(Hive.Color.n900)
                        HStack(spacing: 6) {
                            riskTag(p.risk)
                            riskTag(p.redemption)
                        }
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(p.yield7Day)
                            .font(.system(size: 18, weight: .heavy))
                            .foregroundColor(Hive.Color.brandPrimary)
                        Text("7日年化").font(.system(size: 9)).foregroundColor(Hive.Color.n400)
                        if p.highlighted {
                            Button(p.cta) {
                                TealiumClient.wealthProductTapped(productName: p.name,
                                    productId: p.id)
                            }
                            .font(.system(size: 10, weight: .bold))
                            .padding(.horizontal, 12).padding(.vertical, 4)
                            .background(Hive.Color.brandPrimary).foregroundColor(.white)
                            .cornerRadius(12).padding(.top, 4)
                        }
                    }
                }
                .padding(.vertical, 10)
                .overlay(
                    i < wealthProducts.count - 1
                        ? Rectangle().frame(height: 1).foregroundColor(Hive.Color.n100)
                            .padding(.leading, 0) : nil,
                    alignment: .bottom
                )
                .onTapGesture {
                    if !p.highlighted {
                        TealiumClient.wealthProductTapped(productName: p.name, productId: p.id)
                    }
                }
            }

            Text("💬 理財產品這么多，哪款適合我？")
                .font(.system(size: 11)).foregroundColor(Hive.Color.n500)
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.top, 10)
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(Hive.Color.brandWhite)
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "WEALTH_SELECTION",
                                          instanceId: "slice-wealth-sel", position: 7,
                                          contentId: "wealth-selection-hk-2026")
        }
    }

    private func riskTag(_ label: String) -> some View {
        Text(label).font(.system(size: 9))
            .foregroundColor(Hive.Color.n500)
            .padding(.horizontal, 6).padding(.vertical, 1)
            .background(Hive.Color.n100).cornerRadius(8)
    }
}

// MARK: - 9. Featured Rankings

private struct WHRankingItem {
    let id: String; let icon: String; let badge: String
    let title: String; let desc: String; let deepLink: String
}

private let rankingItems: [WHRankingItem] = [
    .init(id:"r1", icon:"🥇", badge:"優中選優",  title:"3322選基",
          desc:"近1年漲跌幅高達318.19%",          deepLink:"hsbc://rankings/top-funds"),
    .init(id:"r2", icon:"🔒", badge:"固收優選",  title:"穩健省心好選擇",
          desc:"歷史持有3月盈利概率高達98.23%",    deepLink:"hsbc://rankings/fixed-income"),
    .init(id:"r3", icon:"📈", badge:"屢創新高",  title:"屢創新高榜",
          desc:"近3年净值創新高次數達152",          deepLink:"hsbc://rankings/all-time-high"),
]

private struct WHFeaturedRankings: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("特色榜單").font(.system(size: 15, weight: .bold))
                Spacer()
                Text("更多 ›").font(.system(size: 12)).foregroundColor(Hive.Color.brandPrimary)
            }.padding(.bottom, 10)

            ForEach(rankingItems, id: \.id) { item in
                HStack(spacing: 12) {
                    Text(item.icon).font(.system(size: 24))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.badge)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(Hive.Color.brandPrimary)
                            .padding(.horizontal, 8).padding(.vertical, 2)
                            .background(Color(hex: "#FEF2F2")).cornerRadius(10)
                        Text(item.title)
                            .font(.system(size: 13, weight: .bold)).foregroundColor(Hive.Color.n900)
                        Text(item.desc)
                            .font(.system(size: 10)).foregroundColor(Hive.Color.n500)
                    }
                    Spacer()
                    Text("›").font(.system(size: 16)).foregroundColor(Hive.Color.n400)
                }
                .padding(.vertical, 8)
                .overlay(
                    Rectangle().frame(height: 1).foregroundColor(Hive.Color.n50)
                        .padding(.leading, 36),
                    alignment: .bottom
                )
                .onTapGesture {
                    TealiumClient.rankingsTapped(title: item.title, badge: item.badge)
                }
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(Hive.Color.brandWhite)
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "FEATURED_RANKINGS",
                                          instanceId: "slice-rankings", position: 8)
        }
    }
}

// MARK: - 10. Life Deals

private struct WHDeal {
    let id: String; let brand: String; let tag: String; let deepLink: String
}

private let lifeDeals: [WHDeal] = [
    .init(id:"d1", brand:"KFC",           tag:"單品優惠",  deepLink:"hsbc://deals/kfc"),
    .init(id:"d2", brand:"Luckin Coffee", tag:"5折喝瑞幸", deepLink:"hsbc://deals/luckin"),
    .init(id:"d3", brand:"DQ",            tag:"5折起",     deepLink:"hsbc://deals/dq"),
]

private let bottomLinks: [(icon: String, label: String, deepLink: String)] = [
    ("🎁", "達標抽好禮\n丰润守护 健康随行", "hsbc://campaign/health"),
    ("🏦", "行庆招财日\n享受特惠禮遇",       "hsbc://campaign/anniversary"),
]

private struct WHLifeDeals: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("生活特惠").font(.system(size: 15, weight: .bold))
                Spacer()
                Text("更多 ›").font(.system(size: 12)).foregroundColor(Hive.Color.brandPrimary)
            }

            HStack(spacing: 10) {
                ForEach(lifeDeals, id: \.id) { deal in
                    VStack(spacing: 0) {
                        ZStack {
                            Color(hex: "#E5E7EB")
                            Text(deal.brand == "KFC" ? "🍗" :
                                 deal.brand == "DQ"  ? "🍦" : "☕")
                            .font(.system(size: 24))
                        }
                        .frame(height: 64)

                        Text(deal.tag)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity).padding(.vertical, 4)
                            .background(Hive.Color.brandPrimary)
                    }
                    .frame(maxWidth: .infinity)
                    .background(Hive.Color.n50)
                    .cornerRadius(12)
                    .clipped()
                    .shadow(color: .black.opacity(0.06), radius: 4, y: 1)
                    .onTapGesture {
                        TealiumClient.lifeDealTapped(brand: deal.brand, tag: deal.tag)
                    }
                }
            }

            HStack(spacing: 10) {
                ForEach(bottomLinks, id: \.label) { link in
                    HStack(spacing: 8) {
                        Text(link.icon).font(.system(size: 24))
                        Text(link.label)
                            .font(.system(size: 10)).foregroundColor(Hive.Color.n700)
                            .lineSpacing(2).fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(10)
                    .background(Hive.Color.n50).cornerRadius(12)
                    .onTapGesture {
                        TealiumClient.track(event: "bottom_link_tap", category: "Wealth",
                            action: "bottom_link_tapped", label: link.label,
                            screen: "wealth_hub_hk", journey: "wealth_hub",
                            custom: ["deep_link": link.deepLink])
                    }
                }
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(Hive.Color.brandWhite)
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "LIFE_DEALS",
                                          instanceId: "slice-life-deals", position: 9)
        }
    }
}

