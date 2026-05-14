import SwiftUI

private struct AnnouncementPayload: Decodable {
    let pageId: String?
    let screen: String
    let layout: AnnouncementLayout
}

private struct AnnouncementLayout: Decodable {
    let type: String
    let children: [AnnouncementSlice]
}

private struct AnnouncementSlice: Decodable, Identifiable {
    let instanceId: String
    let type: String
    let visible: Bool?
    let props: [String: JSONAny]?

    var id: String { instanceId }
    var p: [String: JSONAny] { props ?? [:] }
}

private enum JSONAny: Decodable {
    case string(String), int(Int), double(Double), bool(Bool)
    case array([JSONAny]), object([String: JSONAny])

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let v = try? c.decode(Bool.self) { self = .bool(v) }
        else if let v = try? c.decode(Int.self) { self = .int(v) }
        else if let v = try? c.decode(Double.self) { self = .double(v) }
        else if let v = try? c.decode(String.self) { self = .string(v) }
        else if let v = try? c.decode([JSONAny].self) { self = .array(v) }
        else { self = .object((try? c.decode([String: JSONAny].self)) ?? [:]) }
    }

    var stringValue: String { if case .string(let s) = self { return s }; return "" }
    var boolValue: Bool { if case .bool(let b) = self { return b }; return false }
    var arrayValue: [JSONAny] { if case .array(let a) = self { return a }; return [] }
    var objectValue: [String: JSONAny] { if case .object(let o) = self { return o }; return [:] }
}

@MainActor
private final class AnnouncementViewModel: ObservableObject {
    enum State { case loading, loaded(AnnouncementSlice), error }

    @Published var state: State = .loading

    #if targetEnvironment(simulator)
    private let baseURL = "http://127.0.0.1:4000"
    #else
    private let baseURL = "http://10.81.103.103:4000"
    #endif

    func load(screenId: String) async {
        guard let url = URL(string: "\(baseURL)/api/v1/screen/\(screenId)") else {
            state = .error
            return
        }
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                state = .error
                return
            }
            let payload = try JSONDecoder().decode(AnnouncementPayload.self, from: data)
            guard let slice = payload.layout.children.first(where: { $0.visible != false && $0.type == "ANNOUNCEMENT_OVERLAY" }) else {
                state = .error
                return
            }
            state = .loaded(slice)
        } catch {
            state = .error
        }
    }
}

struct AnnouncementView: View {
    enum Kind {
        case special, forceUpdate

        var screenId: String {
            switch self {
            case .special: return "announcement-overlay-hk"
            case .forceUpdate: return "announcement-force-update-hk"
            }
        }

        var fallbackTitle: String {
            switch self {
            case .special: return "Special announcement"
            case .forceUpdate: return "Get ready for eLaisee"
            }
        }
    }

    let kind: Kind
    var onBack: (() -> Void)? = nil

    @StateObject private var vm = AnnouncementViewModel()

    var body: some View {
        ZStack {
            AnnouncementAppBackdrop()
            switch vm.state {
            case .loading:
                ProgressView()
            case .loaded(let slice):
                AnnouncementOverlayCard(slice: slice, onClose: onBack)
            case .error:
                AnnouncementOverlayCard(slice: fallbackSlice, onClose: onBack)
            }
        }
        .task { await vm.load(screenId: kind.screenId) }
    }

    private var fallbackSlice: AnnouncementSlice {
        AnnouncementSlice(
            instanceId: "ann-overlay-fallback",
            type: "ANNOUNCEMENT_OVERLAY",
            visible: true,
            props: [
                "styleVariant": .string(kind == .forceUpdate ? "INLINE_FORCE_UPDATE" : "ENVELOPE_CARD"),
                "title": .string(kind.fallbackTitle),
                "body": .array([.string("Announcement content is temporarily unavailable. Please try again later.")]),
                "actions": .array([.object(["id": .string("close"), "label": .string("Close"), "style": .string("primary")])]),
                "blockInteraction": .bool(false),
            ]
        )
    }
}

private struct AnnouncementAppBackdrop: View {
    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 18) {
                Text("⌂").font(.system(size: 20, weight: .bold))
                Text("Pay").font(.system(size: 14, weight: .semibold))
                Text("Cards").font(.system(size: 14, weight: .semibold))
                Text("Wealth").font(.system(size: 14, weight: .semibold))
                Text("☰").font(.system(size: 20, weight: .bold))
            }
            .padding(.top, 54)
            .padding(.bottom, 18)
            .frame(maxWidth: .infinity)
            .background(Color(hex: "#111827").opacity(0.86))

            VStack(spacing: 14) {
                ForEach(["HSBC Red Credit Card", "Link a non-HSBC account", "Investments"], id: \.self) { title in
                    HStack {
                        Text(title).font(.system(size: 13, weight: .semibold))
                        Spacer()
                        Text(title == "HSBC Red Credit Card" ? "-2,321.53 HKD" : "+")
                            .font(.system(size: 13, weight: .bold))
                    }
                    .padding(14)
                    .background(Color.white)
                    .cornerRadius(6)
                    .shadow(color: .black.opacity(0.05), radius: 3, y: 1)
                }
            }
            .padding(18)
            Spacer()
        }
        .background(Color(hex: "#E5E7EB").ignoresSafeArea())
        .overlay(Color.black.opacity(0.45).ignoresSafeArea())
    }
}

private struct AnnouncementOverlayCard: View {
    let slice: AnnouncementSlice
    let onClose: (() -> Void)?
    @State private var dontShowAgain = false

    private var p: [String: JSONAny] { slice.p }
    private var style: String { p["styleVariant"]?.stringValue ?? "ENVELOPE_CARD" }
    private var title: String { p["title"]?.stringValue ?? "Special announcement" }
    private var bodyLines: [String] { p["body"]?.arrayValue.map(\.stringValue).filter { !$0.isEmpty } ?? [] }
    private var hotlines: [(String, String)] {
        p["hotlines"]?.arrayValue.compactMap {
            let o = $0.objectValue
            let label = o["label"]?.stringValue ?? ""
            let phone = o["phone"]?.stringValue ?? ""
            return label.isEmpty && phone.isEmpty ? nil : (label, phone)
        } ?? []
    }
    private var actions: [[String: JSONAny]] {
        p["actions"]?.arrayValue.map(\.objectValue).filter { !$0.isEmpty } ?? []
    }
    private var blockInteraction: Bool { p["blockInteraction"]?.boolValue ?? true }
    private var legal: String { p["legalEntityText"]?.stringValue ?? "" }

    var body: some View {
        VStack(spacing: 0) {
            if style == "INLINE_FORCE_UPDATE" {
                forceUpdateCard
            } else {
                envelopeCard
            }
            if !legal.isEmpty {
                Text(legal)
                    .font(.system(size: 10))
                    .foregroundColor(.white.opacity(0.72))
                    .padding(.top, 18)
            }
        }
        .padding(.horizontal, 22)
        .overlay(alignment: .topTrailing) {
            if !blockInteraction {
                Button(action: { onClose?() }) {
                    Image(systemName: "xmark")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)
                        .frame(width: 30, height: 30)
                        .background(Color.black.opacity(0.55))
                        .clipShape(Circle())
                }
                .padding(.trailing, 14)
                .padding(.top, -18)
            }
        }
    }

    private var envelopeCard: some View {
        VStack(spacing: 0) {
            Text("◆")
                .font(.system(size: 66, weight: .bold))
                .foregroundColor(Color(hex: "#DB0011"))
                .padding(.top, 18)
                .padding(.bottom, -8)
            contentCard
        }
    }

    private var forceUpdateCard: some View {
        VStack(spacing: 0) {
            Text("🧧")
                .font(.system(size: 56))
                .padding(.top, 14)
                .padding(.bottom, -2)
            contentCard
        }
    }

    private var contentCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(title)
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(Color(hex: "#1F2937"))
            ForEach(bodyLines, id: \.self) { line in
                Text(line)
                    .font(.system(size: 14))
                    .foregroundColor(Color(hex: "#374151"))
                    .fixedSize(horizontal: false, vertical: true)
            }
            ForEach(hotlines, id: \.0) { item in
                VStack(alignment: .leading, spacing: 3) {
                    Text(item.0).font(.system(size: 13, weight: .semibold))
                    Text(item.1).font(.system(size: 13)).foregroundColor(Color(hex: "#4B5563"))
                }
            }
            if p["dontShowAgain"]?.objectValue["enabled"]?.boolValue == true {
                Button(action: { dontShowAgain.toggle() }) {
                    HStack(spacing: 10) {
                        Image(systemName: dontShowAgain ? "checkmark.square.fill" : "square")
                            .foregroundColor(dontShowAgain ? Color(hex: "#DB0011") : Color(hex: "#6B7280"))
                    Text(p["dontShowAgain"]?.objectValue["label"]?.stringValue ?? "Don't show this message again")
                        .font(.system(size: 13))
                            .foregroundColor(Color(hex: "#374151"))
                    }
                }
                .buttonStyle(.plain)
            }
            HStack(spacing: 12) {
                ForEach(actions.indices, id: \.self) { idx in
                    let action = actions[idx]
                    Button(action["label"]?.stringValue ?? "Close") { onClose?() }
                        .buttonStyle(AnnouncementButtonStyle(primary: (action["style"]?.stringValue ?? "primary") == "primary"))
                }
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .cornerRadius(2)
    }
}

private struct AnnouncementButtonStyle: ButtonStyle {
    let primary: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 14, weight: .semibold))
            .foregroundColor(primary ? .white : Color(hex: "#111827"))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(primary ? Color(hex: "#DB0011") : Color.white)
            .overlay(RoundedRectangle(cornerRadius: 2).stroke(primary ? Color.clear : Color(hex: "#D1D5DB")))
            .cornerRadius(2)
            .opacity(configuration.isPressed ? 0.82 : 1)
    }
}
