import SwiftUI

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
