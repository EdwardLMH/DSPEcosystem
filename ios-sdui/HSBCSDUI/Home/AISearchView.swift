import SwiftUI
import Combine

// ─── Models ───────────────────────────────────────────────────────────────────

struct SearchResult: Identifiable, Decodable {
    let id: String
    let type: String
    let title: String
    let description: String
    let icon: String
    let category: String
    let deepLink: String
    let assetUrl: String?
    let assetType: String?
    let score: Double
}

struct SearchResponse: Decodable {
    let query: String
    let totalMatched: Int
    let results: [SearchResult]
}

struct A2UISearchResponse: Decodable {
    let query: String?
    let totalMatched: Int?
    let a2ui: A2UIPayload?
}

struct A2UIPayload: Decodable {
    let components: [A2UIComponent]
}

struct A2UIComponent: Decodable {
    let id: String
    let type: String
    let content: A2UIContent
    let action: A2UIAction?
}

struct A2UIContent: Decodable {
    let title: String?
    let description: String?
    let icon: String?
    let category: String?
    let resultType: String?
    let assetUrl: String?
    let assetType: String?
    let score: Double?
}

struct A2UIAction: Decodable {
    let type: String?
    let url: String?
}

private struct LocalSearchEntry {
    let id: String
    let type: String
    let title: String
    let description: String
    let icon: String
    let category: String
    let deepLink: String
    let keywords: String
}

private let localSearchCorpus: [LocalSearchEntry] = [
    LocalSearchEntry(id: "fn-morning-treasure", type: "function", title: "朝朝寶",
        description: "朝朝寶每日活期存款高息理財產品 morning treasure daily wealth",
        icon: "🌙", category: "快捷功能", deepLink: "hsbc://wealth/morning-treasure",
        keywords: "朝朝寶,daily interest,活期,高息,morning,treasure,每日收益"),
    LocalSearchEntry(id: "fn-loan", type: "function", title: "借錢 / 貸款",
        description: "個人貸款申請 閃電貸 極速放款 loan apply borrow cash",
        icon: "💵", category: "快捷功能", deepLink: "hsbc://loan/apply",
        keywords: "借錢,貸款,loan,borrow,申請,cash,分期,repayment"),
    LocalSearchEntry(id: "fn-transfer", type: "function", title: "轉帳",
        description: "本地轉帳 跨行轉賬 即時支付 transfer money bank FPS PayNow",
        icon: "↔️", category: "快捷功能", deepLink: "hsbc://transfer",
        keywords: "轉帳,轉賬,transfer,匯款,FPS,即時,跨行,他行"),
    LocalSearchEntry(id: "fn-accounts", type: "function", title: "帳戶總覽",
        description: "所有帳戶餘額查詢 收支明細 account overview balance statement",
        icon: "📊", category: "快捷功能", deepLink: "hsbc://accounts",
        keywords: "帳戶,accounts,餘額,balance,總覽,overview,明細"),
    LocalSearchEntry(id: "fn-credit-card", type: "function", title: "信用卡",
        description: "信用卡管理 賬單 還款 積分 credit card bill repayment reward points",
        icon: "💳", category: "功能入口", deepLink: "hsbc://cards",
        keywords: "信用卡,credit card,Visa,Mastercard,賬單,帳單,積分,還款,cashback"),
    LocalSearchEntry(id: "fn-statements", type: "function", title: "收支明細",
        description: "交易記錄 月結單 收入支出分析 transaction history statement analysis",
        icon: "📄", category: "功能入口", deepLink: "hsbc://statements",
        keywords: "收支明細,statement,交易,transaction,記錄,history,分析"),
    LocalSearchEntry(id: "fn-external-transfer", type: "function", title: "他行卡轉入",
        description: "從其他銀行轉入資金 外部轉賬 external bank transfer fund in",
        icon: "🔄", category: "功能入口", deepLink: "hsbc://transfer/external",
        keywords: "他行,external,轉入,fund in,其他銀行,跨行"),
    LocalSearchEntry(id: "fn-city-services", type: "function", title: "城市服務",
        description: "繳費 水電煤 交通罰款 政府繳費 city services bill payment utilities",
        icon: "🏙️", category: "功能入口", deepLink: "hsbc://city-services",
        keywords: "城市服務,utilities,繳費,水電,罰款,government,bill payment"),
    LocalSearchEntry(id: "fn-events", type: "function", title: "熱門活動",
        description: "最新優惠活動 推廣 限時優惠 promotions hot events offers",
        icon: "🔥", category: "功能入口", deepLink: "hsbc://events",
        keywords: "熱門活動,events,優惠,promotions,活動,限時,campaigns"),
    LocalSearchEntry(id: "fn-wealth", type: "function", title: "理財",
        description: "理財產品 投資 基金 債券 wealth management investment products",
        icon: "📈", category: "功能入口", deepLink: "hsbc://wealth",
        keywords: "理財,wealth,investment,投資,管理,products,fund"),
    LocalSearchEntry(id: "fn-membership", type: "function", title: "M+會員",
        description: "HSBC M+會員計劃 積分 特權 HSBC membership programme rewards privileges",
        icon: "Ⓜ️", category: "功能入口", deepLink: "hsbc://membership",
        keywords: "M+,會員,membership,積分,特權,rewards,privileges,premier"),
    LocalSearchEntry(id: "fn-movies", type: "function", title: "影票優惠",
        description: "電影票優惠 折扣 cinema movie ticket discount",
        icon: "🎬", category: "功能入口", deepLink: "hsbc://movies",
        keywords: "影票,movie,cinema,電影,discount,ticket,折扣"),
    LocalSearchEntry(id: "fn-funds", type: "function", title: "基金",
        description: "基金投資 互惠基金 ETF fund investment mutual fund",
        icon: "💹", category: "功能入口", deepLink: "hsbc://funds",
        keywords: "基金,fund,ETF,互惠基金,investment,unit trust,NAV"),
    LocalSearchEntry(id: "fn-all-services", type: "function", title: "全部功能",
        description: "所有銀行服務功能列表 all banking services full menu",
        icon: "⋯", category: "功能入口", deepLink: "hsbc://all-services",
        keywords: "全部,all,services,功能,more,menu,more services"),
    LocalSearchEntry(id: "fn-ai-assistant", type: "function", title: "智能財富助理",
        description: "AI智能財富助理 投資建議 產品推薦 AI wealth advisor recommendation",
        icon: "✉️", category: "快捷功能", deepLink: "hsbc://ai-assistant",
        keywords: "AI,智能,助理,advisor,wealth,建議,recommendation,chatbot,聊天"),
    LocalSearchEntry(id: "camp-flash-loan", type: "function", title: "閃電貸 — 極速放款",
        description: "閃電貸最高可借HKD300,000 極速放款 flash loan instant approval",
        icon: "⚡", category: "快捷功能", deepLink: "hsbc://loan/flash",
        keywords: "閃電貸,flash loan,極速,instant,300000,HKD,放款,approval"),
    LocalSearchEntry(id: "fn-notifications", type: "function", title: "通知 / 訊息",
        description: "銀行通知 賬戶提醒 交易提示 notifications alerts messages",
        icon: "🔔", category: "功能入口", deepLink: "hsbc://notifications",
        keywords: "通知,notification,提醒,alert,訊息,message,inbox"),
    LocalSearchEntry(id: "fn-qr-scan", type: "function", title: "QR碼掃描 / 付款",
        description: "二維碼掃碼付款 收款 QR code scan pay receive",
        icon: "⬛", category: "功能入口", deepLink: "hsbc://qr-scan",
        keywords: "QR,二維碼,掃碼,scan,pay,收款,付款,payment"),
    LocalSearchEntry(id: "prod-daily-positive", type: "product", title: "活錢理財｜歷史天天正收益",
        description: "R1低風險理財產品 7日年化2.80% 贖回T+1到帳 daily positive return low risk",
        icon: "💰", category: "財富精選", deepLink: "hsbc://wealth/daily-positive",
        keywords: "活錢理財,天天正,daily positive,低風險,R1,2.80%,贖回,T+1,活期理財"),
    LocalSearchEntry(id: "rank-top-funds", type: "ranking", title: "3322選基 — 優中選優",
        description: "精選基金榜單 近1年漲跌幅高達318.19% best performing funds selection methodology",
        icon: "🥇", category: "特色榜單", deepLink: "hsbc://rankings/top-funds",
        keywords: "3322,選基,top funds,榜單,ranking,優中選優,318%,performance"),
    LocalSearchEntry(id: "deal-kfc", type: "deal", title: "KFC 單品優惠",
        description: "肯德基單品優惠 fast food dining discount KFC",
        icon: "🍗", category: "生活特惠", deepLink: "hsbc://deals/kfc",
        keywords: "KFC,肯德基,fast food,單品,優惠,dining,discount")
]

// ─── ViewModel ────────────────────────────────────────────────────────────────

@MainActor
final class AISearchViewModel: ObservableObject {
    @Published var query: String = ""
    @Published var results: [SearchResult] = []
    @Published var groupedResults: [(category: String, items: [SearchResult])] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil
    @Published var hasSearched: Bool = false

    private var debounceTask: Task<Void, Never>?
    private let bffBase = "http://127.0.0.1:4000"
    private let searchAudience: [String: String] = [
        "customerSegment": "premier",
        "accountType": "wealth_account",
        "customerLocation": "HK"
    ]

    // Suggested quick searches shown before user types
    let suggestions: [(icon: String, label: String)] = [
        ("💰", "低風險理財"), ("💳", "信用卡"), ("💵", "借錢"),
        ("↔️", "轉帳"), ("💹", "基金"), ("🥇", "基金榜單"),
    ]

    func onQueryChange(_ newValue: String) {
        debounceTask?.cancel()
        guard !newValue.trimmingCharacters(in: .whitespaces).isEmpty else {
            results = []
            groupedResults = []
            hasSearched = false
            errorMessage = nil
            return
        }
        debounceTask = Task {
            try? await Task.sleep(nanoseconds: 350_000_000) // 350 ms debounce
            guard !Task.isCancelled else { return }
            await performSearch(query: newValue)
        }
    }

    func performSearch(query: String) async {
        isLoading = true
        errorMessage = nil
        TealiumClient.track(event: "ai_search_query", category: "Search",
            action: "search_submitted", label: query,
            screen: "ai_search", journey: "home_hub",
            custom: ["search_query": query])

        defer { isLoading = false }

        guard let url = URL(string: "\(bffBase)/api/v1/search") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("ios", forHTTPHeaderField: "x-platform")
        request.setValue(ObservabilityClient.shared.traceparent(), forHTTPHeaderField: "traceparent")
        request.timeoutInterval = 8
        let started = Date()

        do {
            var body: [String: Any] = [
                "query": query, "limit": 10, "appId": "ios", "responseMode": "a2ui"
            ]
            searchAudience.forEach { body[$0.key] = $0.value }
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            let (data, urlResponse) = try await URLSession.shared.data(for: request)
            let ok = (urlResponse as? HTTPURLResponse).map { (200...299).contains($0.statusCode) } ?? false
            ObservabilityClient.shared.recordNetworkStep(
                "ai_search_query",
                durationMs: Int(Date().timeIntervalSince(started) * 1000),
                path: "/api/v1/search",
                success: ok
            )
            if let httpResponse = urlResponse as? HTTPURLResponse,
               !(200...299).contains(httpResponse.statusCode) {
                throw URLError(.badServerResponse)
            }
            let a2uiResults = decodeA2UIResults(from: data)
            let legacyResults = (try? JSONDecoder().decode(SearchResponse.self, from: data).results) ?? []
            let remoteResults = a2uiResults.isEmpty ? legacyResults : a2uiResults
            let resolvedResults = remoteResults.isEmpty ? localSearch(query) : remoteResults
            hasSearched = true
            results = resolvedResults
            groupedResults = buildGroups(resolvedResults)
        } catch {
            ObservabilityClient.shared.recordNetworkStep(
                "ai_search_query",
                durationMs: Int(Date().timeIntervalSince(started) * 1000),
                path: "/api/v1/search",
                success: false
            )
            let fallback = localSearch(query)
            errorMessage = fallback.isEmpty ? "搜尋服務暫時不可用，請稍後重試。" : nil
            hasSearched = true
            results = fallback
            groupedResults = buildGroups(fallback)
        }
    }

    private func decodeA2UIResults(from data: Data) -> [SearchResult] {
        guard let response = try? JSONDecoder().decode(A2UISearchResponse.self, from: data),
              let components = response.a2ui?.components else {
            return []
        }
        return components.compactMap { component in
            guard let title = component.content.title,
                  let url = component.action?.url else {
                return nil
            }
            return SearchResult(
                id: component.id,
                type: component.content.resultType ?? component.type,
                title: title,
                description: component.content.description ?? "",
                icon: component.content.icon ?? "",
                category: component.content.category ?? "功能入口",
                deepLink: url,
                assetUrl: component.content.assetUrl,
                assetType: component.content.assetType,
                score: component.content.score ?? 0
            )
        }
    }

    private func localSearch(_ value: String) -> [SearchResult] {
        let q = value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !q.isEmpty else { return [] }

        return localSearchCorpus
            .compactMap { item -> SearchResult? in
                let title = item.title.lowercased()
                let keywords = item.keywords.lowercased()
                let text = "\(item.title) \(item.description) \(item.keywords)".lowercased()
                var score = 0.0
                if title.contains(q) { score += 100 }
                if keywords.contains(q) { score += 60 }
                if text.contains(q) { score += 20 }
                guard score > 0 else { return nil }
                return SearchResult(
                    id: item.id,
                    type: item.type,
                    title: item.title,
                    description: item.description,
                    icon: item.icon,
                    category: item.category,
                    deepLink: item.deepLink,
                    assetUrl: nil,
                    assetType: nil,
                    score: score
                )
            }
            .sorted { $0.score > $1.score }
    }

    private func buildGroups(_ items: [SearchResult]) -> [(category: String, items: [SearchResult])] {
        var order: [String] = []
        var map: [String: [SearchResult]] = [:]
        for item in items {
            if map[item.category] == nil { order.append(item.category) }
            map[item.category, default: []].append(item)
        }
        return order.map { cat in (category: cat, items: map[cat]!) }
    }
}

// ─── Main search overlay view ─────────────────────────────────────────────────

struct AISearchView: View {
    @StateObject private var vm = AISearchViewModel()
    @Binding var isPresented: Bool

    var body: some View {
        NavigationView {
            ZStack(alignment: .top) {
                Hive.Color.n50.ignoresSafeArea()

                VStack(spacing: 0) {
                    searchBar
                    Divider().foregroundColor(Hive.Color.n200)
                    contentArea
                }
            }
            .navigationBarHidden(true)
        }
        .onAppear {
            TealiumClient.track(event: "ai_search_opened", category: "Search",
                action: "search_screen_viewed", screen: "ai_search", journey: "home_hub")
        }
    }

    // ── Search bar row ────────────────────────────────────────────────────────

    private var searchBar: some View {
        HStack(spacing: 10) {
            HStack(spacing: 8) {
                if vm.isLoading {
                    ProgressView().scaleEffect(0.7)
                        .frame(width: 16, height: 16)
                } else {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(Hive.Color.n400)
                        .font(.system(size: 14))
                }

                TextField("搜尋功能、產品", text: $vm.query)
                    .font(.system(size: 14))
                    .foregroundColor(Hive.Color.n900)
                    .textFieldStyle(.plain)
                    .submitLabel(.search)
                    .onSubmit {
                        guard !vm.query.trimmingCharacters(in: .whitespaces).isEmpty else { return }
                        Task { await vm.performSearch(query: vm.query) }
                    }
                    .onChange(of: vm.query) { vm.onQueryChange($0) }

                if !vm.query.isEmpty {
                    Button { vm.query = "" } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(Hive.Color.n300)
                            .font(.system(size: 14))
                    }
                }
            }
            .padding(.horizontal, 12).padding(.vertical, 9)
            .background(Color.white)
            .cornerRadius(20)
            .frame(maxWidth: .infinity)

            Button("取消") {
                TealiumClient.track(event: "ai_search_cancelled", category: "Search",
                    action: "search_cancelled", screen: "ai_search", journey: "home_hub")
                isPresented = false
            }
            .font(.system(size: 14)).foregroundColor(.white)
        }
        .padding(.horizontal, 16).padding(.vertical, 10)
        .background(Hive.Color.brandPrimary)
    }

    // ── Content area (suggestions / results / empty) ──────────────────────────

    @ViewBuilder
    private var contentArea: some View {
        ScrollView(showsIndicators: false) {
            LazyVStack(spacing: 0) {
                if vm.query.trimmingCharacters(in: .whitespaces).isEmpty {
                    suggestionsSection
                } else if vm.hasSearched && vm.groupedResults.isEmpty {
                    emptyState
                } else if !vm.groupedResults.isEmpty {
                    resultsSection
                }
            }
            .padding(.bottom, 24)
        }
    }

    // ── Suggestion chips ──────────────────────────────────────────────────────

    private var suggestionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("熱門搜尋", systemImage: "flame")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(Hive.Color.n500)
                .padding(.horizontal, 16)
                .padding(.top, 16)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()),
                                GridItem(.flexible())], spacing: 8) {
                ForEach(vm.suggestions, id: \.label) { s in
                    Button {
                        vm.query = s.label
                        Task { await vm.performSearch(query: s.label) }
                    } label: {
                        HStack(spacing: 6) {
                            Text(s.icon).font(.system(size: 14))
                            Text(s.label).font(.system(size: 12))
                                .foregroundColor(Hive.Color.n700)
                        }
                        .padding(.horizontal, 12).padding(.vertical, 8)
                        .frame(maxWidth: .infinity)
                        .background(Hive.Color.brandWhite)
                        .cornerRadius(18)
                        .shadow(color: .black.opacity(0.05), radius: 4, y: 1)
                    }
                }
            }
            .padding(.horizontal, 16)

            aiHint
        }
    }

    private var aiHint: some View {
        HStack(spacing: 8) {
            Text("✨").font(.system(size: 16))
            Text("智能語意搜尋 — 試試「低風險穩定回報」或「咖啡優惠」")
                .font(.system(size: 11)).foregroundColor(Hive.Color.n500)
                .lineSpacing(3)
        }
        .padding(12)
        .background(Color(hex: "#F0F9FF"))
        .cornerRadius(10)
        .padding(.horizontal, 16).padding(.top, 4)
    }

    // ── Results grouped by category ───────────────────────────────────────────

    private var resultsSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("找到 \(vm.results.count) 個相關結果")
                .font(.system(size: 11)).foregroundColor(Hive.Color.n400)
                .padding(.horizontal, 16).padding(.vertical, 10)

            ForEach(vm.groupedResults, id: \.category) { group in
                categoryHeader(group.category)
                ForEach(group.items) { item in
                    SearchResultRow(result: item, onTap: {
                        handleResultTap(item)
                    })
                    if item.id != group.items.last?.id {
                        Divider().padding(.leading, 64)
                    }
                }
            }
        }
    }

    private func categoryHeader(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 11, weight: .semibold))
            .foregroundColor(Hive.Color.n500)
            .padding(.horizontal, 16).padding(.top, 14).padding(.bottom, 6)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Hive.Color.n50)
    }

    // ── Empty state ───────────────────────────────────────────────────────────

    private var emptyState: some View {
        VStack(spacing: 12) {
            Text("🔍").font(.system(size: 40)).padding(.top, 48)
            Text("找不到「\(vm.query)」的相關結果")
                .font(.system(size: 14, weight: .semibold)).foregroundColor(Hive.Color.n700)
            Text("試試其他關鍵詞，或瀏覽下方熱門搜尋")
                .font(.system(size: 12)).foregroundColor(Hive.Color.n400)
            if let err = vm.errorMessage {
                Text(err).font(.system(size: 11))
                    .foregroundColor(Hive.Color.brandPrimary).padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity)
    }

    // ── Deep link navigation ──────────────────────────────────────────────────

    private func handleResultTap(_ result: SearchResult) {
        TealiumClient.track(event: "ai_search_result_tapped", category: "Search",
            action: "result_selected", label: result.title,
            screen: "ai_search", journey: "home_hub",
            custom: ["result_id": result.id, "result_type": result.type,
                     "deep_link": result.assetUrl ?? result.deepLink,
                     "asset_type": result.assetType ?? "",
                     "search_query": vm.query])
        isPresented = false
        // Deep link routing — host app intercepts hsbc:// scheme
        if let url = URL(string: result.assetUrl ?? result.deepLink) {
            UIApplication.shared.open(url)
        }
    }
}

// ─── Single result row ────────────────────────────────────────────────────────

private struct SearchResultRow: View {
    let result: SearchResult
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                ZStack {
                    typeColor(result.type).opacity(0.12).cornerRadius(10)
                    Text(result.icon).font(.system(size: 20))
                }
                .frame(width: 44, height: 44)

                VStack(alignment: .leading, spacing: 3) {
                    Text(result.title)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(Hive.Color.n900)
                        .lineLimit(1)
                    Text(result.description)
                        .font(.system(size: 11))
                        .foregroundColor(Hive.Color.n500)
                        .lineLimit(2)
                    if let assetType = result.assetType {
                        Text("Governed \(assetType.lowercased()) URL")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(Hive.Color.brandPrimary)
                    }
                }
                Spacer()

                typeBadge(result.assetType ?? result.type)
            }
            .padding(.horizontal, 16).padding(.vertical, 10)
            .background(Hive.Color.brandWhite)
        }
        .buttonStyle(.plain)
    }

    private func typeColor(_ type: String) -> Color {
        switch type {
        case "product":  return Color(hex: "#22C55E")
        case "ranking":  return Color(hex: "#F59E0B")
        case "deal":     return Color(hex: "#EC4899")
        case "campaign": return Color(hex: "#8B5CF6")
        default:         return Hive.Color.brandPrimary
        }
    }

    private func typeBadge(_ type: String) -> some View {
        let (label, color): (String, Color) = {
            switch type {
            case "product":  return ("產品", Color(hex: "#22C55E"))
            case "ranking":  return ("榜單", Color(hex: "#F59E0B"))
            case "deal":     return ("優惠", Color(hex: "#EC4899"))
            case "campaign": return ("活動", Color(hex: "#8B5CF6"))
            default:         return ("功能", Hive.Color.brandPrimary)
            }
        }()
        return Text(label)
            .font(.system(size: 9, weight: .semibold))
            .foregroundColor(color)
            .padding(.horizontal, 7).padding(.vertical, 3)
            .background(color.opacity(0.12))
            .cornerRadius(8)
    }
}
