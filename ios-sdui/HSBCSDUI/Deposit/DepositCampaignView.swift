import SwiftUI

// MARK: - SDUI payload models (Deposit Campaign page)

private struct DepositPayload: Decodable {
    let pageId: String?
    let screen: String
    let layout: DepositLayout
}

private struct DepositLayout: Decodable {
    let type: String
    let children: [DepositSlice]
}

private struct DepositSlice: Decodable, Identifiable {
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
    func double(_ key: String) -> Double? {
        if case .double(let d) = props?[key] { return d }
        if case .int(let i) = props?[key] { return Double(i) }
        return nil
    }
    func array(_ key: String) -> [JSONAny]? {
        if case .array(let a) = props?[key] { return a }
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
private final class DepositViewModel: ObservableObject {
    enum State { case loading, loaded([DepositSlice]), error }

    @Published var state: State = .loading

    #if targetEnvironment(simulator)
    private let baseURL = "http://127.0.0.1:4000"
    #else
    private let baseURL = "http://10.81.103.103:4000"
    #endif

    func load() async {
        guard let url = URL(string: "\(baseURL)/api/v1/screen/deposit-campaign-hk") else {
            state = .error; return
        }
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            if let http = response as? HTTPURLResponse, http.statusCode == 200 {
                let payload = try JSONDecoder().decode(DepositPayload.self, from: data)
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

struct DepositCampaignView: View {
    var onBack: (() -> Void)? = nil

    @StateObject private var vm = DepositViewModel()

    var body: some View {
        Group {
            switch vm.state {
            case .loading:
                VStack {
                    DepositHeaderBar(title: "Renminbi Savings Offers", onBack: onBack)
                    Spacer()
                    ProgressView()
                    Spacer()
                }
                .background(Hive.Color.n50.ignoresSafeArea())

            case .loaded(let slices):
                DepositSDUIScrollView(slices: slices, onBack: onBack)

            case .error:
                DepositHardcodedView(onBack: onBack)
            }
        }
        .task { await vm.load() }
    }
}

// MARK: - SDUI scroll container

private struct DepositSDUIScrollView: View {
    let slices: [DepositSlice]
    let onBack: (() -> Void)?

    var body: some View {
        ZStack(alignment: .bottom) {
            Hive.Color.n50.ignoresSafeArea().allowsHitTesting(false)
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    ForEach(slices) { slice in
                        DepositSliceView(slice: slice, onBack: onBack)
                    }
                    Spacer().frame(height: 32)
                }
            }
        }
    }
}

// MARK: - Slice dispatcher

private struct DepositSliceView: View {
    let slice: DepositSlice
    let onBack: (() -> Void)?

    var body: some View {
        switch slice.type {
        case "HEADER_NAV":
            DepositHeaderBar(
                title: slice.string("title") ?? "Renminbi Savings Offers",
                showBack: slice.bool("showBackButton") ?? true,
                onBack: onBack
            )

        case "PROMO_BANNER":
            DepositPromoBanner(slice: slice)

        case "DEPOSIT_RATE_TABLE":
            DepositRateTable(slice: slice)

        case "DEPOSIT_OPEN_CTA":
            DepositOpenCTA(slice: slice)

        case "DEPOSIT_FAQ":
            DepositFAQSection(slice: slice)

        case "SPACER":
            let h = slice.double("height") ?? 16
            Spacer().frame(height: h)

        default:
            EmptyView()
        }
    }
}

// MARK: - 1. Header Bar

private struct DepositHeaderBar: View {
    let title: String
    var showBack: Bool = true
    let onBack: (() -> Void)?

    var body: some View {
        HStack(spacing: 12) {
            if showBack {
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

// MARK: - Remote image loader (URLSession-based, bypasses AsyncImage ATS quirks)

@MainActor
private final class RemoteImageLoader: ObservableObject {
    @Published var image: UIImage? = nil
    @Published var failed = false

    func load(from urlString: String) {
        guard let url = URL(string: urlString) else { failed = true; return }
        let req = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData)
        URLSession.shared.dataTask(with: req) { data, response, error in
            DispatchQueue.main.async {
                if let data, let img = UIImage(data: data) {
                    self.image = img
                } else {
                    self.failed = true
                }
            }
        }.resume()
    }
}

// MARK: - 2. Promo Banner (image or text-only)

private struct DepositPromoBanner: View {
    let slice: DepositSlice

    #if targetEnvironment(simulator)
    private let mediaBase = "http://127.0.0.1:4000"
    #else
    private let mediaBase = "http://10.81.103.103:4000"
    #endif

    var body: some View {
        let bgHex   = slice.string("backgroundColor") ?? "#FFFFFF"
        let bgColor = Color(hex: bgHex)

        if let rawUrl = slice.string("imageUrl") {
            // Image-style banner — use manual loader to avoid AsyncImage ATS issues
            let fixedUrl = rawUrl
                .replacingOccurrences(of: "http://localhost:4000", with: mediaBase)
                .replacingOccurrences(of: "http://localhost", with: mediaBase)
            DepositRemoteImage(urlString: fixedUrl, bgColor: bgColor)
        } else if let title = slice.string("title") {
            // Text-only callout banner
            let textHex = slice.string("textColor") ?? "#92400E"
            VStack(alignment: .leading, spacing: 8) {
                if let badge = slice.string("badgeText") {
                    Text(badge)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(Color(hex: textHex))
                        .padding(.horizontal, 10).padding(.vertical, 3)
                        .background(Color(hex: textHex).opacity(0.12))
                        .cornerRadius(Hive.Radius.full)
                }
                Text(title)
                    .font(Hive.Typography.headingSm)
                    .foregroundColor(Color(hex: textHex))
                if let subtitle = slice.string("subtitle") {
                    Text(subtitle)
                        .font(Hive.Typography.bodySm)
                        .foregroundColor(Color(hex: textHex).opacity(0.8))
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .background(bgColor)
        }
    }
}

private struct DepositRemoteImage: View {
    let urlString: String
    let bgColor: Color
    @StateObject private var loader = RemoteImageLoader()

    var body: some View {
        ZStack {
            bgColor
            if let img = loader.image {
                Image(uiImage: img)
                    .resizable()
                    .scaledToFill()
            } else if loader.failed {
                Text("🏦").font(.system(size: 48))
            } else {
                ProgressView()
            }
        }
        .frame(maxWidth: .infinity, minHeight: 200, maxHeight: 200)
        .clipped()
        .onAppear { loader.load(from: urlString) }
    }
}

// MARK: - 3. Deposit Rate Table

private struct DepositRateTableRow {
    let term: String
    let rate: String
}

private struct DepositRateTable: View {
    let slice: DepositSlice

    private var rows: [DepositRateTableRow] {
        guard let arr = slice.array("rates") else { return [] }
        return arr.compactMap { item -> DepositRateTableRow? in
            guard case .object(let obj) = item,
                  case .string(let term) = obj["term"],
                  case .string(let rate) = obj["rate"] else { return nil }
            return DepositRateTableRow(term: term, rate: rate)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Section header
            HStack {
                Text(slice.string("sectionTitle") ?? "Time Deposit Rate:")
                    .font(Hive.Typography.labelBase)
                    .foregroundColor(Hive.Color.n700)
                Spacer()
                if let date = slice.string("asAtDate") {
                    Text("As at \(date)")
                        .font(Hive.Typography.caption)
                        .foregroundColor(Hive.Color.n400)
                }
            }
            .padding(.horizontal, 16).padding(.vertical, 12)
            .background(Hive.Color.n50)

            // Column headers
            HStack {
                Text("Term").font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Hive.Color.n500).frame(maxWidth: .infinity, alignment: .leading)
                Text("Interest Rate (p.a.)").font(.system(size: 12, weight: .semibold))
                    .foregroundColor(Hive.Color.n500)
            }
            .padding(.horizontal, 16).padding(.vertical, 8)
            .background(Color(hex: "#F5F6F8"))

            // Rate rows
            ForEach(Array(rows.enumerated()), id: \.offset) { idx, row in
                HStack {
                    Text(row.term)
                        .font(Hive.Typography.bodySm)
                        .foregroundColor(Hive.Color.n700)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text("\(row.rate)%")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(Hive.Color.brandPrimary)
                }
                .padding(.horizontal, 16).padding(.vertical, 12)
                .background(idx % 2 == 0 ? Hive.Color.brandWhite : Hive.Color.n50)

                if idx < rows.count - 1 {
                    Divider().padding(.leading, 16)
                }
            }

            // Footnote
            if let footnote = slice.string("footnote") {
                Text(footnote)
                    .font(.system(size: 10))
                    .foregroundColor(Hive.Color.n400)
                    .padding(.horizontal, 16).padding(.vertical, 10)
                    .background(Hive.Color.n50)
            }
        }
        .background(Hive.Color.brandWhite)
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "DEPOSIT_RATE_TABLE",
                                          instanceId: "dep-rate-table", position: 3)
        }
    }
}

// MARK: - 4. Deposit Open CTA

private struct DepositOpenCTA: View {
    let slice: DepositSlice

    var body: some View {
        let label   = slice.string("label") ?? "Open a Deposit"
        let bgHex   = slice.string("backgroundColor") ?? "#C41E3A"
        let textHex = slice.string("textColor") ?? "#FFFFFF"
        let deepLink = slice.string("deepLink") ?? "hsbc://deposit/open"

        Button {
            TealiumClient.sliceTapped(sliceType: "DEPOSIT_OPEN_CTA",
                instanceId: "dep-open-cta", ctaLabel: label, deepLink: deepLink)
        } label: {
            Text(label)
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(Color(hex: textHex))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color(hex: bgHex))
                .cornerRadius(12)
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 16).padding(.vertical, 12)
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "DEPOSIT_OPEN_CTA",
                                          instanceId: "dep-open-cta", position: 4)
        }
    }
}

// MARK: - 5. FAQ Section

private struct FAQItem {
    let id: String
    let question: String
    let answer: String
}

private struct DepositFAQSection: View {
    let slice: DepositSlice
    @State private var expandedId: String? = nil

    private var items: [FAQItem] {
        guard let arr = slice.array("items") else { return [] }
        return arr.compactMap { item -> FAQItem? in
            guard case .object(let obj) = item,
                  case .string(let id)  = obj["id"],
                  case .string(let q)   = obj["question"],
                  case .string(let a)   = obj["answer"] else { return nil }
            return FAQItem(id: id, question: q, answer: a)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(slice.string("sectionTitle") ?? "Frequently Asked Questions")
                .font(Hive.Typography.labelBase)
                .foregroundColor(Hive.Color.n700)
                .padding(.horizontal, 16).padding(.vertical, 12)
                .background(Hive.Color.n50)
                .frame(maxWidth: .infinity, alignment: .leading)

            ForEach(Array(items.enumerated()), id: \.element.id) { idx, item in
                VStack(alignment: .leading, spacing: 0) {
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            expandedId = expandedId == item.id ? nil : item.id
                        }
                    } label: {
                        HStack(alignment: .top, spacing: 12) {
                            Text(item.question)
                                .font(Hive.Typography.bodySm)
                                .foregroundColor(Hive.Color.n800)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .multilineTextAlignment(.leading)
                            Image(systemName: expandedId == item.id ? "chevron.up" : "chevron.down")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(Hive.Color.n400)
                                .padding(.top, 2)
                        }
                        .padding(.horizontal, 16).padding(.vertical, 14)
                    }
                    .buttonStyle(.plain)

                    if expandedId == item.id {
                        Text(item.answer)
                            .font(Hive.Typography.bodySm)
                            .foregroundColor(Hive.Color.n500)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.horizontal, 16)
                            .padding(.bottom, 14)
                    }

                    if idx < items.count - 1 {
                        Divider().padding(.leading, 16)
                    }
                }
                .background(Hive.Color.brandWhite)
            }
        }
        .background(Hive.Color.brandWhite)
        .onAppear {
            TealiumClient.sliceImpression(sliceType: "DEPOSIT_FAQ",
                                          instanceId: "dep-faq", position: 6)
        }
    }
}

// MARK: - Hardcoded fallback

private struct DepositHardcodedView: View {
    let onBack: (() -> Void)?

    private let rates: [(String, String)] = [
        ("3 Month Time Deposit",  "0.65"),
        ("6 Month Time Deposit",  "0.85"),
        ("12 Month Time Deposit", "0.95"),
        ("24 Month Time Deposit", "1.05"),
        ("36 Month Time Deposit", "1.25"),
        ("60 Month Time Deposit", "1.30"),
    ]

    private let faqs: [(String, String)] = [
        ("Can I withdraw my time deposit before it matures?",
         "Yes, you can. But you'll earn less or no interest, and may have to pay an early withdrawal fee. For foreign currency deposits, visit a bank branch."),
        ("What happens if I don't withdraw my money after maturity?",
         "If you don't take out your money when it matures, most banks will automatically renew your deposit for the same term at the current interest rate. You can also choose to withdraw it or change the term before maturity."),
        ("How long can I keep a time deposit?",
         "Banks usually offer terms like 3 months, 6 months, 1 year, 2 years, 3 years, 5 years, or even 10 years. Longer terms usually have higher interest rates. The most popular choices are 6-month or 12-month plans."),
        ("Why is the interest rate higher for time deposits than regular savings accounts?",
         "Banks can offer better rates because they know you'll keep your money in the account for a fixed period. This lets them use the funds for longer-term investments, so they share more of the profit with you as interest."),
    ]

    @State private var expandedFAQ: Int? = nil

    var body: some View {
        ZStack(alignment: .top) {
            Hive.Color.n50.ignoresSafeArea()
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    DepositHeaderBar(title: "Renminbi Savings Offers", onBack: onBack)

                    // Hero image placeholder
                    ZStack {
                        Color(hex: "#1A3A6B")
                        VStack(spacing: 8) {
                            Text("🏦").font(.system(size: 48))
                            Text("New Fund Deposit Campaign")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(.white.opacity(0.85))
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 16)
                        }
                    }
                    .frame(height: 200)

                    // Rate callout
                    VStack(alignment: .leading, spacing: 8) {
                        Text("🔥 New Funds Only")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(hex: "#92400E"))
                            .padding(.horizontal, 10).padding(.vertical, 3)
                            .background(Color(hex: "#92400E").opacity(0.12))
                            .cornerRadius(Hive.Radius.full)

                        Text("🌟 Up to 1.15% p.a. Annual Equivalent Rate")
                            .font(Hive.Typography.headingSm)
                            .foregroundColor(Color(hex: "#92400E"))

                        Text("3-Month New Fund CNY Transferable CD — exclusively for new deposits. Don't miss this limited-time rate. Start earning more today.")
                            .font(Hive.Typography.bodySm)
                            .foregroundColor(Color(hex: "#92400E").opacity(0.8))
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                    .background(Color(hex: "#FFF7ED"))

                    // Rate table
                    VStack(alignment: .leading, spacing: 0) {
                        HStack {
                            Text("Time Deposit Rate:").font(Hive.Typography.labelBase)
                                .foregroundColor(Hive.Color.n700)
                            Spacer()
                            Text("As at 5/22/2025").font(Hive.Typography.caption)
                                .foregroundColor(Hive.Color.n400)
                        }
                        .padding(.horizontal, 16).padding(.vertical, 12)
                        .background(Hive.Color.n50)

                        HStack {
                            Text("Term").font(.system(size: 12, weight: .semibold))
                                .foregroundColor(Hive.Color.n500)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            Text("Interest Rate (p.a.)").font(.system(size: 12, weight: .semibold))
                                .foregroundColor(Hive.Color.n500)
                        }
                        .padding(.horizontal, 16).padding(.vertical, 8)
                        .background(Color(hex: "#F5F6F8"))

                        ForEach(Array(rates.enumerated()), id: \.offset) { idx, row in
                            HStack {
                                Text(row.0).font(Hive.Typography.bodySm)
                                    .foregroundColor(Hive.Color.n700)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                Text("\(row.1)%").font(.system(size: 15, weight: .bold))
                                    .foregroundColor(Hive.Color.brandPrimary)
                            }
                            .padding(.horizontal, 16).padding(.vertical, 12)
                            .background(idx % 2 == 0 ? Hive.Color.brandWhite : Hive.Color.n50)
                            if idx < rates.count - 1 { Divider().padding(.leading, 16) }
                        }

                        Text("Time deposit minimum balance for Personal Banking customers: RMB50. New Fund refers to funds not previously held with HSBC.")
                            .font(.system(size: 10)).foregroundColor(Hive.Color.n400)
                            .padding(.horizontal, 16).padding(.vertical, 10)
                            .background(Hive.Color.n50)
                    }
                    .background(Hive.Color.brandWhite)

                    // CTA button
                    Button {
                        TealiumClient.sliceTapped(sliceType: "DEPOSIT_OPEN_CTA",
                            instanceId: "dep-open-cta", ctaLabel: "Open a Deposit",
                            deepLink: "hsbc://deposit/open?currency=CNY&campaign=new-fund")
                    } label: {
                        Text("Open a Deposit")
                            .font(.system(size: 16, weight: .bold)).foregroundColor(.white)
                            .frame(maxWidth: .infinity).padding(.vertical, 16)
                            .background(Color(hex: "#C41E3A")).cornerRadius(12)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 16).padding(.vertical, 12)

                    Spacer().frame(height: 16)

                    // FAQ
                    VStack(alignment: .leading, spacing: 0) {
                        Text("Frequently Asked Questions")
                            .font(Hive.Typography.labelBase).foregroundColor(Hive.Color.n700)
                            .padding(.horizontal, 16).padding(.vertical, 12)
                            .background(Hive.Color.n50)
                            .frame(maxWidth: .infinity, alignment: .leading)

                        ForEach(Array(faqs.enumerated()), id: \.offset) { idx, faq in
                            VStack(alignment: .leading, spacing: 0) {
                                Button {
                                    withAnimation(.easeInOut(duration: 0.2)) {
                                        expandedFAQ = expandedFAQ == idx ? nil : idx
                                    }
                                } label: {
                                    HStack(alignment: .top, spacing: 12) {
                                        Text(faq.0).font(Hive.Typography.bodySm)
                                            .foregroundColor(Hive.Color.n800)
                                            .frame(maxWidth: .infinity, alignment: .leading)
                                            .multilineTextAlignment(.leading)
                                        Image(systemName: expandedFAQ == idx ? "chevron.up" : "chevron.down")
                                            .font(.system(size: 12, weight: .medium))
                                            .foregroundColor(Hive.Color.n400).padding(.top, 2)
                                    }
                                    .padding(.horizontal, 16).padding(.vertical, 14)
                                }
                                .buttonStyle(.plain)

                                if expandedFAQ == idx {
                                    Text(faq.1).font(Hive.Typography.bodySm)
                                        .foregroundColor(Hive.Color.n500)
                                        .fixedSize(horizontal: false, vertical: true)
                                        .padding(.horizontal, 16).padding(.bottom, 14)
                                }

                                if idx < faqs.count - 1 { Divider().padding(.leading, 16) }
                            }
                            .background(Hive.Color.brandWhite)
                        }
                    }
                    .background(Hive.Color.brandWhite)

                    Spacer().frame(height: 32)
                }
            }
        }
    }
}
