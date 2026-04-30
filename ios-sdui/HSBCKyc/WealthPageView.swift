import SwiftUI

// MARK: - Data Models

private struct QuickItem: Identifiable {
    let id = UUID()
    let icon: String
    let label: String
    let deepLink: String
}

private struct FuncItem: Identifiable {
    let id = UUID()
    let icon: String
    let label: String
    let deepLink: String
}

private struct WealthProduct: Identifiable {
    let id: String
    let name: String
    let tag: String
    let yield7Day: String
    let risk: String
    let redemption: String
    let cta: String
    let deepLink: String
    let highlighted: Bool
}

private struct RankingItem: Identifiable {
    let id: String
    let icon: String
    let badge: String
    let title: String
    let desc: String
    let deepLink: String
}

private struct DealItem: Identifiable {
    let id: String
    let brand: String
    let emoji: String
    let tag: String
    let deepLink: String
}

private struct BottomLink: Identifiable {
    let id = UUID()
    let icon: String
    let label: String
    let deepLink: String
}

// MARK: - Static Data

private let quickItems: [QuickItem] = [
    .init(icon: "🌙", label: "朝朝寶",   deepLink: "hsbc://wealth/morning-treasure"),
    .init(icon: "💵", label: "借錢",     deepLink: "hsbc://loan/apply"),
    .init(icon: "↔️", label: "轉帳",     deepLink: "hsbc://transfer"),
    .init(icon: "📊", label: "帳戶總覽", deepLink: "hsbc://accounts"),
]

private let funcRows: [[FuncItem]] = [
    [
        .init(icon: "💳", label: "信用卡",    deepLink: "hsbc://cards"),
        .init(icon: "📄", label: "收支明細",  deepLink: "hsbc://statements"),
        .init(icon: "🔄", label: "他行卡轉入", deepLink: "hsbc://transfer/external"),
        .init(icon: "🏙️", label: "城市服務",  deepLink: "hsbc://city-services"),
        .init(icon: "🔥", label: "熱門活動",  deepLink: "hsbc://events"),
    ],
    [
        .init(icon: "📈", label: "理財",   deepLink: "hsbc://wealth"),
        .init(icon: "Ⓜ️", label: "M+會員", deepLink: "hsbc://membership"),
        .init(icon: "🎬", label: "影票",   deepLink: "hsbc://movies"),
        .init(icon: "💹", label: "基金",   deepLink: "hsbc://funds"),
        .init(icon: "⋯",  label: "全部",   deepLink: "hsbc://all-services"),
    ],
]

private let wealthProducts: [WealthProduct] = [
    .init(id: "w1", name: "活錢理財｜歷史天天正收益", tag: "代碼",
          yield7Day: "2.80%", risk: "R1低風險", redemption: "贖回T+1到帳",
          cta: "去看看", deepLink: "hsbc://wealth/daily-positive", highlighted: true),
    .init(id: "w2", name: "主投債券", tag: "代碼",
          yield7Day: "3.04%", risk: "歷史周周正", redemption: "成立以來…",
          cta: "查看", deepLink: "hsbc://wealth/bond-fund", highlighted: false),
    .init(id: "w3", name: "年均收益率", tag: "收益確定",
          yield7Day: "2.31%", risk: "保証領取", redemption: "穩健低波",
          cta: "查看", deepLink: "hsbc://wealth/guaranteed", highlighted: false),
]

private let rankings: [RankingItem] = [
    .init(id: "r1", icon: "🥇", badge: "優中選優", title: "3322選基",
          desc: "近1年漲跌幅高達318.19%", deepLink: "hsbc://rankings/top-funds"),
    .init(id: "r2", icon: "🔒", badge: "固收優選", title: "穩健省心好選擇",
          desc: "歷史持有3月盈利概率高達98.23%", deepLink: "hsbc://rankings/fixed-income"),
    .init(id: "r3", icon: "📈", badge: "屢創新高", title: "屢創新高榜",
          desc: "近3年净值創新高次數達152", deepLink: "hsbc://rankings/all-time-high"),
]

private let deals: [DealItem] = [
    .init(id: "d1", brand: "KFC",           emoji: "🍗", tag: "單品優惠",  deepLink: "hsbc://deals/kfc"),
    .init(id: "d2", brand: "Luckin Coffee", emoji: "☕", tag: "5折喝瑞幸", deepLink: "hsbc://deals/luckin"),
    .init(id: "d3", brand: "DQ",            emoji: "🍦", tag: "5折起",     deepLink: "hsbc://deals/dq"),
]

private let bottomLinks: [BottomLink] = [
    .init(icon: "🎁", label: "達標抽好禮\n丰润守护 健康随行", deepLink: "hsbc://campaign/health"),
    .init(icon: "🏦", label: "行庆招财日\n享受特惠禮遇",       deepLink: "hsbc://campaign/anniversary"),
]

// MARK: - Root Wealth Page

struct WealthPageView: View {
    @State private var adDismissed = false
    @State private var searchOpen  = false

    var body: some View {
        ZStack(alignment: .topLeading) {
            // Main scrollable page
            ScrollView {
                VStack(spacing: 0) {
                    WHHeaderNav(onSearchTap: { searchOpen = true })
                    WHQuickAccess()
                    WHPromoBanner()
                    WHFunctionGrid()
                    WHAIAssistant()
                    if !adDismissed {
                        WHAdBanner(onDismiss: { adDismissed = true })
                    }
                    WHFlashLoan()
                    WHWealthSelection()
                    WHFeaturedRankings()
                    WHLifeDeals()
                    Spacer().frame(height: 40)
                }
            }
            .background(Hive.Color.n50)

            // AI Search overlay
            if searchOpen {
                WHSearchOverlay(onDismiss: { searchOpen = false })
                    .background(Hive.Color.brandWhite)
                    .zIndex(10)
            }
        }
    }
}

// MARK: - 1. Header Nav

private struct WHHeaderNav: View {
    var onSearchTap: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                // Search bar
                HStack(spacing: 6) {
                    Text("🔍").font(.system(size: 13)).foregroundColor(Hive.Color.n400)
                    Text("搜尋功能、產品")
                        .font(.system(size: 13)).foregroundColor(Hive.Color.n400)
                    Spacer()
                }
                .frame(height: 36)
                .padding(.horizontal, 14)
                .background(Hive.Color.n100)
                .cornerRadius(18)
                .onTapGesture { onSearchTap() }

                Text("🔔").font(.system(size: 20))
                Text("⬛").font(.system(size: 18))
            }
            .frame(height: 50)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(Hive.Color.brandWhite)

            Divider().foregroundColor(Hive.Color.n200)
        }
    }
}

// MARK: - 2. Quick Access

private struct WHQuickAccess: View {
    var body: some View {
        HStack {
            ForEach(quickItems) { item in
                VStack(spacing: 5) {
                    Text(item.icon).font(.system(size: 22))
                        .frame(width: 48, height: 48)
                        .background(
                            LinearGradient(
                                colors: [Color(hex: "#F0F9FF"), Color(hex: "#E0F2FE")],
                                startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                        .cornerRadius(14)
                    Text(item.label)
                        .font(.system(size: 10)).foregroundColor(Hive.Color.n700)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(Hive.Color.brandWhite)
    }
}

// MARK: - 3. Promo Banner

private struct WHPromoBanner: View {
    var body: some View {
        HStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 4) {
                Text("每月10日開啓")
                    .font(.system(size: 9, weight: .bold)).foregroundColor(Color(hex: "#DB0011"))
                    .padding(.horizontal, 8).padding(.vertical, 2)
                    .background(Color(hex: "#FFEDED")).cornerRadius(10)
                Text("10分招財日").font(.system(size: 16, weight: .heavy)).foregroundColor(Hive.Color.n900)
                Text("查帳單·學投資·優配置").font(.system(size: 10)).foregroundColor(Hive.Color.n500)
                Button("點擊參與") {}
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(Hive.Color.brandWhite)
                    .frame(height: 32).padding(.horizontal, 16)
                    .background(Hive.Color.brandPrimary).cornerRadius(14)
                    .padding(.top, 8)
            }
            Spacer()
            Text("🎯").font(.system(size: 32))
                .frame(width: 80, height: 80).background(Color.black.opacity(0.08)).cornerRadius(12)
        }
        .padding(12)
        .background(Color(hex: "#E8F4FD"))
        .cornerRadius(14)
        .padding(.horizontal, 12).padding(.vertical, 8)
    }
}

// MARK: - 4. Function Grid

private struct WHFunctionGrid: View {
    var body: some View {
        VStack(spacing: 6) {
            ForEach(Array(funcRows.enumerated()), id: \.offset) { _, row in
                HStack {
                    ForEach(row) { item in
                        VStack(spacing: 4) {
                            Text(item.icon).font(.system(size: 20))
                                .frame(width: 44, height: 44)
                                .background(Hive.Color.n100)
                                .cornerRadius(12)
                            Text(item.label)
                                .font(.system(size: 10)).foregroundColor(Hive.Color.n700)
                                .multilineTextAlignment(.center).lineLimit(2)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 8)
        .background(Hive.Color.brandWhite)
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
            Text("›").font(.system(size: 14)).foregroundColor(Hive.Color.n400)
        }
        .frame(height: 44)
        .padding(.horizontal, 12)
        .background(Hive.Color.n50)
        .cornerRadius(10)
        .padding(.horizontal, 16).padding(.vertical, 4)
    }
}

// MARK: - 6. Ad Banner

private struct WHAdBanner: View {
    var onDismiss: () -> Void

    var body: some View {
        ZStack(alignment: .topTrailing) {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("春季播種黃金期")
                        .font(.system(size: 13, weight: .bold)).foregroundColor(Color(hex: "#92400E"))
                    Text("配置正當時，播下「金種子」")
                        .font(.system(size: 10)).foregroundColor(Color(hex: "#78716C"))
                    Button("抽體驗禮") {}
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(Hive.Color.brandWhite)
                        .frame(height: 30).padding(.horizontal, 14)
                        .background(Hive.Color.brandPrimary).cornerRadius(12)
                        .padding(.top, 8)
                }
                Spacer()
                Text("🌱").font(.system(size: 28))
                    .frame(width: 72, height: 72).background(Color.black.opacity(0.08)).cornerRadius(10)
            }
            .padding(.horizontal, 16).padding(.vertical, 12)
            .background(
                LinearGradient(colors: [Color(hex: "#FFFBEB"), Color(hex: "#FEF3C7")],
                               startPoint: .topLeading, endPoint: .bottomTrailing)
            )
            .cornerRadius(14)

            // Dismiss button
            Button(action: onDismiss) {
                Text("✕").font(.system(size: 13)).foregroundColor(Hive.Color.n400)
                    .frame(width: 32, height: 32)
            }
        }
        .padding(.horizontal, 12).padding(.vertical, 6)
    }
}

// MARK: - 7. Flash Loan

private struct WHFlashLoan: View {
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("⚡ 閃電貸 極速放款")
                    .font(.system(size: 11, weight: .bold)).foregroundColor(Hive.Color.brandPrimary)
                Text("最高可借額度").font(.system(size: 10)).foregroundColor(Hive.Color.n500)
                Text("HKD 300,000.00")
                    .font(.system(size: 22, weight: .heavy)).foregroundColor(Hive.Color.n900)
            }
            Spacer()
            Button("獲取額度") {}
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(Hive.Color.brandWhite)
                .frame(height: 44).padding(.horizontal, 18)
                .background(Hive.Color.brandPrimary).cornerRadius(20)
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(
            LinearGradient(colors: [Color(hex: "#FFF5F5"), Color(hex: "#FFE4E4")],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
        )
        .cornerRadius(14)
        .padding(.horizontal, 12).padding(.vertical, 6)
    }
}

// MARK: - 8. Wealth Selection

private struct WHWealthSelection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("財富精選").font(.system(size: 15, weight: .bold))
                Spacer()
                Text("更多 ›").font(.system(size: 12)).foregroundColor(Hive.Color.brandPrimary)
            }
            .padding(.bottom, 10)

            ForEach(Array(wealthProducts.enumerated()), id: \.element.id) { idx, p in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(p.name)
                            .font(.system(size: 12, weight: .medium)).foregroundColor(Hive.Color.n900)
                        HStack(spacing: 6) {
                            Text(p.risk).font(.system(size: 9)).foregroundColor(Hive.Color.n500)
                                .padding(.horizontal, 6).padding(.vertical, 1)
                                .background(Hive.Color.n100).cornerRadius(8)
                            Text(p.redemption).font(.system(size: 9)).foregroundColor(Hive.Color.n500)
                                .padding(.horizontal, 6).padding(.vertical, 1)
                                .background(Hive.Color.n100).cornerRadius(8)
                        }
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(p.yield7Day)
                            .font(.system(size: 18, weight: .heavy)).foregroundColor(Hive.Color.brandPrimary)
                        Text("7日年化").font(.system(size: 9)).foregroundColor(Hive.Color.n400)
                        if p.highlighted {
                            Button(p.cta) {}
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(Hive.Color.brandWhite)
                                .frame(height: 28).padding(.horizontal, 12)
                                .background(Hive.Color.brandPrimary).cornerRadius(12)
                                .padding(.top, 4)
                        }
                    }
                }
                .padding(.vertical, 10)

                if idx < wealthProducts.count - 1 {
                    Divider().background(Hive.Color.n100)
                }
            }

            Spacer().frame(height: 10)
            Text("💬 理財產品這么多，哪款適合我？")
                .font(.system(size: 11)).foregroundColor(Hive.Color.n500)
                .frame(maxWidth: .infinity, alignment: .center)
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(Hive.Color.brandWhite)
    }
}

// MARK: - 9. Featured Rankings

private struct WHFeaturedRankings: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("特色榜單").font(.system(size: 15, weight: .bold))
                Spacer()
                Text("更多 ›").font(.system(size: 12)).foregroundColor(Hive.Color.brandPrimary)
            }
            .padding(.bottom, 10)

            ForEach(rankings) { item in
                HStack(spacing: 12) {
                    Text(item.icon).font(.system(size: 24))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.badge)
                            .font(.system(size: 9, weight: .bold)).foregroundColor(Hive.Color.brandPrimary)
                            .padding(.horizontal, 8).padding(.vertical, 2)
                            .background(Color(hex: "#FEF2F2")).cornerRadius(10)
                        Text(item.title)
                            .font(.system(size: 13, weight: .bold)).foregroundColor(Hive.Color.n900)
                        Text(item.desc).font(.system(size: 10)).foregroundColor(Hive.Color.n500)
                    }
                    Spacer()
                    Text("›").font(.system(size: 16)).foregroundColor(Hive.Color.n400)
                }
                .padding(.vertical, 8)

                Divider().background(Color(hex: "#F9FAFB"))
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(Hive.Color.brandWhite)
    }
}

// MARK: - 10. Life Deals

private struct WHLifeDeals: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("生活特惠").font(.system(size: 15, weight: .bold))
                Spacer()
                Text("更多 ›").font(.system(size: 12)).foregroundColor(Hive.Color.brandPrimary)
            }

            // Deal cards
            HStack(spacing: 10) {
                ForEach(deals) { d in
                    VStack(spacing: 0) {
                        Text(d.emoji).font(.system(size: 24))
                            .frame(maxWidth: .infinity).frame(height: 64)
                            .background(Hive.Color.n100)
                        Text(d.tag)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(Hive.Color.brandWhite)
                            .frame(maxWidth: .infinity).padding(.vertical, 4)
                            .background(Hive.Color.brandPrimary)
                    }
                    .frame(maxWidth: .infinity)
                    .background(Hive.Color.n50)
                    .cornerRadius(12)
                    .clipped()
                }
            }

            // Bottom links
            HStack(spacing: 10) {
                ForEach(bottomLinks) { link in
                    HStack(spacing: 8) {
                        Text(link.icon).font(.system(size: 24))
                        Text(link.label)
                            .font(.system(size: 10)).foregroundColor(Hive.Color.n700)
                            .lineSpacing(6)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(10)
                    .background(Hive.Color.n50)
                    .cornerRadius(12)
                }
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(Hive.Color.brandWhite)
    }
}

// MARK: - AI Search Overlay

private struct WHSearchOverlay: View {
    var onDismiss: () -> Void
    @State private var query = ""

    var body: some View {
        VStack(spacing: 0) {
            // Search bar header
            HStack(spacing: 10) {
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(Hive.Color.n400).font(.system(size: 14))
                    TextField("搜尋功能、產品", text: $query)
                        .font(.system(size: 14))
                }
                .padding(.horizontal, 12).frame(height: 36)
                .background(Hive.Color.n100).cornerRadius(18)

                Button("取消", action: onDismiss)
                    .font(.system(size: 14)).foregroundColor(Hive.Color.brandPrimary)
            }
            .padding(.horizontal, 16).padding(.vertical, 12)
            .background(Hive.Color.brandWhite)
            .overlay(Rectangle().frame(height: 1).foregroundColor(Hive.Color.n200), alignment: .bottom)

            // Placeholder AI results
            ScrollView {
                VStack(alignment: .leading, spacing: Hive.Spacing.s4) {
                    Text("熱門搜索")
                        .font(Hive.Typography.labelBase).foregroundColor(Hive.Color.n500)
                        .padding(.horizontal, Hive.Spacing.s4)
                        .padding(.top, Hive.Spacing.s5)

                    ForEach(["朝朝寶利率查詢", "基金申購", "轉帳限額", "理財產品比較", "活期存款利率"], id: \.self) { suggestion in
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .font(.system(size: 13)).foregroundColor(Hive.Color.n400)
                            Text(suggestion)
                                .font(Hive.Typography.bodyBase).foregroundColor(Hive.Color.n700)
                            Spacer()
                            Image(systemName: "arrow.up.left")
                                .font(.system(size: 12)).foregroundColor(Hive.Color.n300)
                        }
                        .padding(.horizontal, Hive.Spacing.s4)
                        .padding(.vertical, Hive.Spacing.s3)
                        .onTapGesture { query = suggestion }

                        Divider().padding(.leading, Hive.Spacing.s4)
                    }
                }
            }
            .background(Hive.Color.brandWhite)
        }
        .ignoresSafeArea(edges: .bottom)
    }
}

// MARK: - Color hex extension (local to this file)

private extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: Double
        switch hex.count {
        case 6:
            r = Double((int >> 16) & 0xFF) / 255
            g = Double((int >> 8)  & 0xFF) / 255
            b = Double(int & 0xFF)          / 255
        default:
            r = 0; g = 0; b = 0
        }
        self.init(red: r, green: g, blue: b)
    }
}
