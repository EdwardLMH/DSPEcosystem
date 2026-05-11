import SwiftUI
import AVKit

// MARK: - QuickActionGrid

struct QuickActionGridView: View {
    let props: [String: Any]

    var body: some View {
        let items = props["items"] as? [[String: Any]] ?? []
        let columns = Array(repeating: GridItem(.flexible()), count: 4)
        LazyVGrid(columns: columns, spacing: 16) {
            ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                QuickActionItemView(item: item)
            }
        }
        .padding(.horizontal, 16)
    }
}

struct QuickActionItemView: View {
    let item: [String: Any]

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: iconName)
                .resizable()
                .scaledToFit()
                .frame(width: 28, height: 28)
                .foregroundColor(Color(hex: "#003366"))
                .padding(10)
                .background(Color(hex: "#EBF2FA"))
                .clipShape(Circle())
            Text(label)
                .font(.caption2)
                .multilineTextAlignment(.center)
                .foregroundColor(.primary)
        }
        .onTapGesture {
            AnalyticsClient.fire(event: "quick_action_tapped",
                                 properties: ["label": label])
        }
    }

    private var label: String { item["label"] as? String ?? "" }
    private var iconName: String {
        switch item["icon"] as? String {
        case "transfer": return "arrow.left.arrow.right"
        case "bill":     return "doc.text"
        case "fx":       return "dollarsign.circle"
        default:         return "grid"
        }
    }
}

// MARK: - RateComparisonTable

struct RateComparisonTableView: View {
    let props: [String: Any]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if let title = props["title"] as? String {
                Text(title)
                    .font(.headline)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 8)
            }
            Divider()
            let rates = props["rates"] as? [[String: String]] ?? []
            ForEach(Array(rates.enumerated()), id: \.offset) { _, rate in
                HStack {
                    Text(rate["term"] ?? "")
                    Spacer()
                    Text(rate["rate"] ?? "")
                        .foregroundColor(Color(hex: "#003366"))
                        .fontWeight(.semibold)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                Divider()
            }
        }
        .background(Color(.systemBackground))
        .cornerRadius(8)
        .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 2)
    }
}

// MARK: - PersonalisedGreeting

struct PersonalisedGreetingView: View {
    let props: [String: Any]

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(props["template"] as? String ?? "")
                .font(.title2)
                .fontWeight(.semibold)
            if let subtext = props["subtext"] as? String {
                Text(subtext)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }
}

// MARK: - SurveyWidget

struct SurveyWidgetView: View {
    let props: [String: Any]
    @State private var selectedScore: Int? = nil
    @State private var submitted = false

    var body: some View {
        if submitted { EmptyView().frame(height: 0) }
        else {
            VStack(spacing: 12) {
                Text(props["question"] as? String ?? "How likely are you to recommend HSBC?")
                    .font(.subheadline)
                    .multilineTextAlignment(.center)
                HStack(spacing: 6) {
                    ForEach(1...10, id: \.self) { score in
                        Button("\(score)") {
                            selectedScore = score
                            submitSurvey(score: score)
                        }
                        .frame(width: 30, height: 30)
                        .background(selectedScore == score ? Color(hex: "#003366") : Color(.systemGray5))
                        .foregroundColor(selectedScore == score ? .white : .primary)
                        .cornerRadius(4)
                        .font(.caption)
                    }
                }
            }
            .padding(16)
            .background(Color(.secondarySystemBackground))
            .cornerRadius(12)
            .padding(.horizontal, 16)
        }
    }

    private func submitSurvey(score: Int) {
        submitted = true
        let journeyId = props["journeyId"] as? String ?? ""
        let contentId = props["contentId"] as? String ?? ""
        AnalyticsClient.fire(event: "nps_survey_submitted",
                             properties: ["score": "\(score)", "journeyId": journeyId, "contentId": contentId])
    }
}

// MARK: - Color extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

// MARK: - WealthStudioCarouselView
// SDUI renderer for WEALTH_STUDIO_CAROUSEL slice.
// Supports numColumns (1 = horizontal scroll, 2+ = LazyVGrid).
// Each card has an image area, episode label, title, and play CTA.

struct WealthStudioCarouselView: View {
    let props: [String: Any]
    @State private var playingVideoUrl: String? = nil

    private var sectionTitle: String { props["sectionTitle"] as? String ?? "Premier Elite Wealth Studio" }
    private var moreLabel: String    { props["moreLabel"]    as? String ?? "View all" }
    private var numColumns: Int {
        let raw = props["numColumns"]
        if let n = raw as? Int { return max(1, n) }
        if let s = raw as? String, let n = Int(s) { return max(1, n) }
        return 1
    }
    private var items: [[String: Any]] { props["items"] as? [[String: Any]] ?? [] }

    private let hsbcRed = Color(hex: "#DB0011")

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack {
                Text(sectionTitle).font(.system(size: 15, weight: .bold)).foregroundColor(Color(hex: "#1A1A2E"))
                Spacer()
                Text("\(moreLabel) ›").font(.system(size: 12, weight: .semibold)).foregroundColor(hsbcRed)
            }
            .padding(.horizontal, 16).padding(.top, 14).padding(.bottom, 12)

            if numColumns > 1 {
                let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: numColumns)
                LazyVGrid(columns: columns, spacing: 10) {
                    ForEach(items.indices, id: \.self) { i in
                        WealthStudioCardView(item: items[i], onPlay: { url in playingVideoUrl = url })
                    }
                }
                .padding(.horizontal, 16).padding(.bottom, 14)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(alignment: .top, spacing: 10) {
                        ForEach(items.indices, id: \.self) { i in
                            WealthStudioCardView(item: items[i], onPlay: { url in playingVideoUrl = url })
                                .frame(width: 220)
                        }
                    }
                    .padding(.horizontal, 16).padding(.bottom, 14)
                }
            }
        }
        .background(Color.white)
        .padding(.top, 8)
        .fullScreenCover(isPresented: Binding(
            get: { playingVideoUrl != nil },
            set: { if !$0 { playingVideoUrl = nil } }
        )) {
            VideoPlayerOverlay(url: playingVideoUrl ?? "", onClose: { playingVideoUrl = nil })
        }
    }
}

struct WealthStudioCardView: View {
    let item: [String: Any]
    let onPlay: (String) -> Void

    private var episodeLabel: String { item["episodeLabel"] as? String ?? "" }
    private var title: String        { item["title"]        as? String ?? "" }
    private var ctaLabel: String     { item["ctaLabel"]     as? String ?? "Watch now" }
    private var liveBadge: String?   { item["liveBadge"]    as? String }
    private var videoUrl: String     { item["videoUrl"]     as? String ?? "" }
    private var imageColor: Color    { Color(hex: item["imageColor"] as? String ?? "#1A1A2E") }

    var body: some View {
        VStack(spacing: 0) {
            // Image area
            ZStack(alignment: .bottomLeading) {
                ZStack {
                    Rectangle().fill(imageColor).frame(height: 120)
                    Text("▶")
                        .font(.system(size: 20))
                        .foregroundColor(.white)
                        .frame(width: 36, height: 36)
                        .background(Color.black.opacity(0.3))
                        .clipShape(Circle())
                }
                if let badge = liveBadge {
                    Text("🔴 \(badge)")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(.white)
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(Color(hex: "#DB0011").opacity(0.85))
                        .cornerRadius(6)
                        .padding(.horizontal, 10).padding(.bottom, 8)
                }
                VStack {
                    HStack {
                        Text(episodeLabel)
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 8).padding(.vertical, 2)
                            .background(Color.white.opacity(0.15))
                            .cornerRadius(10)
                        Spacer()
                    }
                    Spacer()
                }.padding(10)
            }
            .frame(height: 120)
            .onTapGesture { onPlay(videoUrl) }

            // Text area
            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(Color(hex: "#1A1A2E"))
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
                Button(ctaLabel) { onPlay(videoUrl) }
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 5)
                    .background(Color(hex: "#DB0011"))
                    .cornerRadius(14)
            }
            .padding(12)
            .frame(height: 80)
            .background(Color.white)
        }
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
}

struct VideoPlayerOverlay: View {
    let url: String
    let onClose: () -> Void

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            if let videoURL = resolvedURL(from: url) {
                AVPlayerControllerRepresentable(url: videoURL)
                    .ignoresSafeArea()
            } else {
                Text("Unable to load video")
                    .foregroundColor(.white)
            }
            VStack {
                HStack {
                    Spacer()
                    Button(action: onClose) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 28))
                            .foregroundColor(.white)
                            .padding(16)
                    }
                }
                Spacer()
            }
        }
        .onTapGesture {}
    }

    private func resolvedURL(from raw: String) -> URL? {
        guard !raw.isEmpty else { return nil }
        var resolved = raw
        // Remap localhost/127.0.0.1 to simulator-reachable address
        if resolved.contains("localhost") || resolved.contains("127.0.0.1") {
            resolved = resolved
                .replacingOccurrences(of: "localhost", with: "127.0.0.1")
        }
        return URL(string: resolved)
    }
}

private struct AVPlayerControllerRepresentable: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> AVPlayerViewController {
        let player = AVPlayer(url: url)
        let vc = AVPlayerViewController()
        vc.player = player
        vc.showsPlaybackControls = true
        player.play()
        return vc
    }

    func updateUIViewController(_ vc: AVPlayerViewController, context: Context) {}
}

// MARK: - GuidesInsightsCarouselView
// SDUI renderer for GUIDES_INSIGHTS_CAROUSEL slice.
// Supports numColumns (1 = horizontal scroll, 2+ = LazyVGrid).

struct GuidesInsightsCarouselView: View {
    let props: [String: Any]

    private var sectionTitle: String { props["sectionTitle"] as? String ?? "Guides and insights" }
    private var moreLabel: String    { props["moreLabel"]    as? String ?? "View all" }
    private var numColumns: Int {
        let raw = props["numColumns"]
        if let n = raw as? Int { return max(1, n) }
        if let s = raw as? String, let n = Int(s) { return max(1, n) }
        return 1
    }
    private var items: [[String: Any]] { props["items"] as? [[String: Any]] ?? [] }

    private let hsbcRed = Color(hex: "#DB0011")

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text(sectionTitle).font(.system(size: 15, weight: .bold)).foregroundColor(Color(hex: "#1A1A2E"))
                Spacer()
                Text("\(moreLabel) ›").font(.system(size: 12, weight: .semibold)).foregroundColor(hsbcRed)
            }
            .padding(.horizontal, 16).padding(.top, 14).padding(.bottom, 12)

            if numColumns > 1 {
                let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: numColumns)
                LazyVGrid(columns: columns, spacing: 10) {
                    ForEach(items.indices, id: \.self) { i in GuidesCardView(item: items[i]) }
                }
                .padding(.horizontal, 16).padding(.bottom, 14)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(alignment: .top, spacing: 10) {
                        ForEach(items.indices, id: \.self) { i in
                            GuidesCardView(item: items[i]).frame(width: 190)
                        }
                    }
                    .padding(.horizontal, 16).padding(.bottom, 14)
                }
            }
        }
        .background(Color.white)
        .padding(.top, 8)
    }
}

struct GuidesCardView: View {
    let item: [String: Any]

    private var title: String       { item["title"]       as? String ?? "" }
    private var description: String { item["description"] as? String ?? "" }
    private var date: String        { item["date"]        as? String ?? "" }
    private var imageColor: Color   { Color(hex: item["imageColor"] as? String ?? "#2D3748") }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack {
                Rectangle().fill(imageColor).frame(height: 100)
                Text("📖").font(.system(size: 28)).opacity(0.6)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(Color(hex: "#1A1A2E"))
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)
                if !description.isEmpty {
                    Text(description)
                        .font(.system(size: 10))
                        .foregroundColor(Color(hex: "#6B7280"))
                        .lineLimit(2)
                }
                Text(date).font(.system(size: 10)).foregroundColor(Color(hex: "#9CA3AF"))
            }
            .padding(10)
        }
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: "#F3F4F6"), lineWidth: 1))
        .shadow(color: .black.opacity(0.06), radius: 2, x: 0, y: 1)
    }
}

// MARK: - DiscoverMoreCarouselView
// SDUI renderer for DISCOVER_MORE_CAROUSEL slice.
// Supports numColumns (1 = horizontal scroll, 2+ = LazyVGrid).

struct DiscoverMoreCarouselView: View {
    let props: [String: Any]

    private var sectionTitle: String { props["sectionTitle"] as? String ?? "Discover more" }
    private var numColumns: Int {
        let raw = props["numColumns"]
        if let n = raw as? Int { return max(1, n) }
        if let s = raw as? String, let n = Int(s) { return max(1, n) }
        return 1
    }
    private var items: [[String: Any]] { props["items"] as? [[String: Any]] ?? [] }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(sectionTitle)
                .font(.system(size: 15, weight: .bold))
                .foregroundColor(Color(hex: "#1A1A2E"))
                .padding(.horizontal, 16).padding(.top, 14).padding(.bottom, 12)

            if numColumns > 1 {
                let columns = Array(repeating: GridItem(.flexible(), spacing: 8), count: numColumns)
                LazyVGrid(columns: columns, spacing: 8) {
                    ForEach(items.indices, id: \.self) { i in DiscoverMoreCardView(item: items[i]) }
                }
                .padding(.horizontal, 16).padding(.bottom, 14)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(alignment: .top, spacing: 10) {
                        ForEach(items.indices, id: \.self) { i in
                            DiscoverMoreCardView(item: items[i]).frame(width: 200)
                        }
                    }
                    .padding(.horizontal, 16).padding(.bottom, 14)
                }
            }
        }
        .background(Color.white)
        .padding(.top, 8)
    }
}

struct DiscoverMoreCardView: View {
    let item: [String: Any]

    private var tag: String        { item["tag"]        as? String ?? "" }
    private var tagColor: Color    { Color(hex: item["tagColor"]   as? String ?? "#DB0011") }
    private var title: String      { item["title"]      as? String ?? "" }
    private var subtitle: String   {
        (item["description"] as? String) ?? (item["subtitle"] as? String) ?? ""
    }
    private var imageColor: Color  { Color(hex: item["imageColor"] as? String ?? "#1A2E4A") }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack(alignment: .topLeading) {
                Rectangle().fill(imageColor).frame(height: 110)
                Text(tag)
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .background(tagColor)
                    .cornerRadius(10)
                    .padding(10)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Color(hex: "#1A1A2E"))
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
                if !subtitle.isEmpty {
                    Text(subtitle)
                        .font(.system(size: 10))
                        .foregroundColor(Color(hex: "#6B7280"))
                        .lineLimit(2)
                }
            }
            .padding(12)
        }
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: "#F3F4F6"), lineWidth: 1))
        .shadow(color: .black.opacity(0.06), radius: 2, x: 0, y: 1)
    }
}

// MARK: - AISearchBarView
// SDUI component rendered when slice type == "AI_SEARCH_BAR".
// Displays an HSBC-red search bar with semantic search, QR scan,
// chatbot and message inbox entry points.
// The actual search overlay calls POST /api/v1/search on the BFF.

struct AISearchBarView: View {
    let props: [String: Any]
    @State private var showOverlay = false
    @State private var query = ""
    @State private var results: [[String: Any]] = []
    @State private var isLoading = false
    @State private var errorMsg = ""

    private var placeholder: String { props["placeholder"] as? String ?? "搜尋功能、產品" }
    private var enableQRScan: Bool { props["enableQRScan"] as? Bool ?? true }
    private var enableChatbot: Bool { props["enableChatbot"] as? Bool ?? true }
    private var enableMessageInbox: Bool { props["enableMessageInbox"] as? Bool ?? true }
    private var searchApiEndpoint: String {
        props["searchApiEndpoint"] as? String ?? "http://localhost:4000/api/v1/search"
    }

    private let red = Color(hex: "#DB0011")

    var body: some View {
        HStack(spacing: 8) {
            if enableQRScan {
                Button { } label: {
                    Text("⬜").font(.system(size: 20))
                        .foregroundColor(.white.opacity(0.9))
                }
            }

            Button { showOverlay = true } label: {
                HStack(spacing: 6) {
                    Text("🔍").font(.system(size: 14))
                        .foregroundColor(.white.opacity(0.7))
                    Text(placeholder).font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.65))
                    Spacer()
                }
                .padding(.horizontal, 12).padding(.vertical, 6)
                .background(Color.white.opacity(0.15))
                .cornerRadius(20)
            }

            if enableChatbot {
                Button { } label: {
                    Text("🤖").font(.system(size: 20))
                        .foregroundColor(.white.opacity(0.9))
                }
            }
            if enableMessageInbox {
                Button { } label: {
                    Text("✉️").font(.system(size: 20))
                        .foregroundColor(.white.opacity(0.9))
                }
            }
        }
        .padding(.horizontal, 12).padding(.vertical, 8)
        .background(red)
        .fullScreenCover(isPresented: $showOverlay) {
            AISearchOverlayView(
                placeholder: placeholder,
                searchApiEndpoint: searchApiEndpoint,
                isPresented: $showOverlay
            )
        }
    }
}

struct AISearchOverlayView: View {
    let placeholder: String
    let searchApiEndpoint: String
    @Binding var isPresented: Bool
    @State private var query = ""
    @State private var results: [[String: Any]] = []
    @State private var isLoading = false
    @State private var errorMsg = ""

    private let suggestions = ["朝朝寶", "低風險理財", "信用卡", "基金", "借錢", "外匯"]
    private let red = Color(hex: "#DB0011")

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search bar
                HStack(spacing: 8) {
                    HStack(spacing: 6) {
                        Image(systemName: isLoading ? "clock" : "magnifyingglass")
                            .foregroundColor(.white.opacity(0.7)).font(.system(size: 14))
                        TextField(placeholder, text: $query)
                            .foregroundColor(.white)
                            .onChange(of: query) { _, newValue in
                                debounceSearch(newValue)
                            }
                        if !query.isEmpty {
                            Button { query = ""; results = []; errorMsg = "" } label: {
                                Image(systemName: "xmark").foregroundColor(.white.opacity(0.7))
                            }
                        }
                    }
                    .padding(.horizontal, 12).padding(.vertical, 8)
                    .background(Color.white.opacity(0.15))
                    .cornerRadius(20)

                    Button("取消") { isPresented = false }
                        .foregroundColor(.white)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)
                .background(red)

                Divider()

                if !errorMsg.isEmpty {
                    Text(errorMsg).foregroundColor(red).padding()
                } else if query.isEmpty {
                    // Suggestions
                    ScrollView {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("熱門搜尋").font(.caption).fontWeight(.semibold)
                                .foregroundColor(.secondary)
                            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 8) {
                                ForEach(suggestions, id: \.self) { s in
                                    Button { query = s; performSearch(s) } label: {
                                        Text(s).font(.system(size: 13))
                                            .foregroundColor(.primary)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 8)
                                            .background(Color(.systemBackground))
                                            .cornerRadius(18)
                                            .shadow(color: .black.opacity(0.06), radius: 4, y: 1)
                                    }
                                }
                            }
                            HStack(alignment: .top, spacing: 8) {
                                Text("✨")
                                Text("智能語意搜尋 — 試試「低風險穩定回報」或「咖啡優惠」")
                                    .font(.caption).foregroundColor(Color(hex: "#0369A1"))
                                    .lineSpacing(3)
                            }
                            .padding(12)
                            .background(Color(hex: "#E0F2FE"))
                            .cornerRadius(10)
                        }.padding()
                    }
                } else if results.isEmpty && !isLoading {
                    VStack(spacing: 12) {
                        Text("🔍").font(.system(size: 40))
                        Text("找不到「\(query)」的相關結果")
                            .font(.subheadline).fontWeight(.semibold)
                        Text("試試其他關鍵詞").font(.caption).foregroundColor(.secondary)
                    }.padding(.top, 48)
                } else {
                    List(results.indices, id: \.self) { i in
                        let r = results[i]
                        HStack(spacing: 12) {
                            Text(r["icon"] as? String ?? "🔍")
                                .font(.system(size: 20))
                                .frame(width: 44, height: 44)
                                .background(Color(hex: "#FEE2E2"))
                                .cornerRadius(10)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(r["title"] as? String ?? "")
                                    .font(.subheadline).fontWeight(.semibold).lineLimit(1)
                                Text(r["description"] as? String ?? "")
                                    .font(.caption).foregroundColor(.secondary).lineLimit(2)
                            }
                            Spacer()
                            Text(r["type"] as? String ?? "")
                                .font(.system(size: 9)).fontWeight(.semibold)
                                .foregroundColor(red)
                                .padding(.horizontal, 7).padding(.vertical, 3)
                                .background(Color(hex: "#FEE2E2"))
                                .cornerRadius(8)
                        }
                    }
                    .listStyle(.plain)
                }
                Spacer()
            }
            .navigationBarHidden(true)
        }
    }

    private var debounceTask: Task<Void, Never>? = nil

    private func debounceSearch(_ value: String) {
        if value.isEmpty { results = []; errorMsg = ""; return }
        Task {
            try? await Task.sleep(nanoseconds: 350_000_000)
            await MainActor.run { performSearch(value) }
        }
    }

    private func performSearch(_ q: String) {
        guard !q.isEmpty else { return }
        isLoading = true
        errorMsg = ""
        guard let url = URL(string: searchApiEndpoint) else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["query": q, "limit": 8])
        URLSession.shared.dataTask(with: req) { data, _, error in
            DispatchQueue.main.async {
                isLoading = false
                guard let data, error == nil,
                      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let arr = json["results"] as? [[String: Any]] else {
                    errorMsg = "搜尋服務暫時不可用，請稍後重試。"
                    return
                }
                results = arr
            }
        }.resume()
    }
}
