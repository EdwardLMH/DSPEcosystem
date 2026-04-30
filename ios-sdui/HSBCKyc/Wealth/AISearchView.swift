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
    let score: Double
}

struct SearchResponse: Decodable {
    let query: String
    let totalMatched: Int
    let results: [SearchResult]
}

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
    private let bffBase = "http://localhost:4000"

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
            screen: "ai_search", journey: "wealth_hub",
            custom: ["search_query": query])

        defer { isLoading = false }

        guard let url = URL(string: "\(bffBase)/api/v1/search") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: [
                "query": query, "limit": 10
            ])
            let (data, _) = try await URLSession.shared.data(for: request)
            let response = try JSONDecoder().decode(SearchResponse.self, from: data)
            hasSearched = true
            results = response.results
            groupedResults = buildGroups(response.results)
        } catch {
            errorMessage = "搜尋服務暫時不可用，請稍後重試。"
            results = []
            groupedResults = []
        }
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
    @FocusState private var fieldFocused: Bool

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
            fieldFocused = true
            TealiumClient.track(event: "ai_search_opened", category: "Search",
                action: "search_screen_viewed", screen: "ai_search", journey: "wealth_hub")
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
                    .focused($fieldFocused)
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
            .background(Hive.Color.n100)
            .cornerRadius(20)
            .frame(maxWidth: .infinity)

            Button("取消") {
                TealiumClient.track(event: "ai_search_cancelled", category: "Search",
                    action: "search_cancelled", screen: "ai_search", journey: "wealth_hub")
                isPresented = false
            }
            .font(.system(size: 14)).foregroundColor(Hive.Color.brandPrimary)
        }
        .padding(.horizontal, 16).padding(.vertical, 10)
        .background(Hive.Color.brandWhite)
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
            screen: "ai_search", journey: "wealth_hub",
            custom: ["result_id": result.id, "result_type": result.type,
                     "deep_link": result.deepLink, "search_query": vm.query])
        isPresented = false
        // Deep link routing — host app intercepts hsbc:// scheme
        if let url = URL(string: result.deepLink) {
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
                }
                Spacer()

                typeBadge(result.type)
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
