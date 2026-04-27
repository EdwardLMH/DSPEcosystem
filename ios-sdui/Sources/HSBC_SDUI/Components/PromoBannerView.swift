// PromoBannerView.swift
// HSBC SDUI iOS Renderer
// Server-driven promotional banner component.

import SwiftUI

// MARK: - PromoBannerView

/// A full-width promotional banner rendered from SDUI props.
///
/// Expected props keys:
/// - `title`            (String)  — primary headline text
/// - `subtitle`         (String)  — supporting body text
/// - `imageUrl`         (String)  — URL of the banner background image
/// - `imageAlt`         (String)  — accessibility description for the image
/// - `backgroundColour` (String)  — hex colour used when image is unavailable, e.g. `"#C41230"`
/// - `textColour`       (String)  — hex colour for title/subtitle, e.g. `"#FFFFFF"`
/// - `ctaText`          (String)  — label for the call-to-action button
/// - `ctaAction`        (Object)  — serialised `ActionDefinition` for the CTA tap
public struct PromoBannerView: View {

    let props: [String: AnyCodable]
    let actionHandler: ActionHandler

    // Derived from props
    private var title: String           { props["title"]?.stringValue ?? "" }
    private var subtitle: String?       { props["subtitle"]?.stringValue }
    private var imageUrl: URL?          { props["imageUrl"]?.stringValue.flatMap(URL.init(string:)) }
    private var imageAlt: String        { props["imageAlt"]?.stringValue ?? title }
    private var backgroundColour: Color { Color(hex: props["backgroundColour"]?.stringValue ?? "#C41230") }
    private var textColour: Color       { Color(hex: props["textColour"]?.stringValue ?? "#FFFFFF") }
    private var ctaText: String?        { props["ctaText"]?.stringValue }
    private var ctaAction: ActionDefinition? {
        guard
            let dict = props["ctaAction"]?.dictValue,
            let typeString = dict["type"] as? String,
            let type = ActionType(rawValue: typeString)
        else { return nil }

        let destination = dict["destination"] as? String

        // Decode optional params dict
        var params: [String: AnyCodable]? = nil
        if let rawParams = dict["params"] as? [String: Any] {
            params = rawParams.compactMapValues { value in
                switch value {
                case let s as String:   return AnyCodable(s)
                case let i as Int:      return AnyCodable(i)
                case let d as Double:   return AnyCodable(d)
                case let b as Bool:     return AnyCodable(b)
                default:                return nil
                }
            }
        }

        return ActionDefinition(type: type, destination: destination, params: params, payload: nil)
    }

    // MARK: Body

    public var body: some View {
        ZStack(alignment: .bottomLeading) {
            // Background: async image with colour fallback
            Group {
                if let url = imageUrl {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .empty:
                            backgroundColour
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFill()
                                .accessibilityLabel(imageAlt)
                                .accessibilityAddTraits(.isImage)
                        case .failure:
                            backgroundColour
                        @unknown default:
                            backgroundColour
                        }
                    }
                } else {
                    backgroundColour
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 200)
            .clipped()

            // Gradient scrim so text remains legible over any image
            LinearGradient(
                colors: [.clear, .black.opacity(0.55)],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(maxWidth: .infinity)
            .frame(height: 200)

            // Text + CTA overlay
            VStack(alignment: .leading, spacing: 6) {
                Text(title)
                    .font(.title3.bold())
                    .foregroundColor(textColour)
                    .accessibilityAddTraits(.isHeader)

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundColor(textColour.opacity(0.9))
                        .lineLimit(2)
                }

                if let ctaText = ctaText, let ctaAction = ctaAction {
                    Button(action: {
                        actionHandler.handle(action: ctaAction, from: nil)
                    }) {
                        Text(ctaText)
                            .font(.subheadline.bold())
                            .foregroundColor(backgroundColour)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color.white)
                            .cornerRadius(20)
                    }
                    .accessibilityLabel(ctaText)
                    .padding(.top, 4)
                }
            }
            .padding(16)
        }
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 6, x: 0, y: 3)
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .accessibilityElement(children: .contain)
    }
}

// MARK: - Color hex initialiser

private extension Color {
    /// Initialises a `Color` from a CSS-style hex string, e.g. `"#C41230"` or `"C41230"`.
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)

        let r, g, b, a: UInt64
        switch hex.count {
        case 3:
            (r, g, b, a) = ((int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17, 255)
        case 6:
            (r, g, b, a) = (int >> 16, int >> 8 & 0xFF, int & 0xFF, 255)
        case 8:
            (r, g, b, a) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (r, g, b, a) = (200, 18, 48, 255) // HSBC red fallback
        }

        self.init(
            .sRGB,
            red:     Double(r) / 255,
            green:   Double(g) / 255,
            blue:    Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Preview

#if DEBUG
struct PromoBannerView_Previews: PreviewProvider {
    static var previews: some View {
        PromoBannerView(
            props: [
                "title":            "Exclusive Summer Rate",
                "subtitle":         "Earn 5.10% AER on balances up to £250,000",
                "imageUrl":         "https://www.hsbc.co.uk/content/dam/hsbc/gb/images/summer-banner.jpg",
                "imageAlt":         "Person relaxing in the summer sun",
                "backgroundColour": "#C41230",
                "textColour":       "#FFFFFF",
                "ctaText":          "Apply now",
                "ctaAction": AnyCodable([
                    "type":        "NAVIGATE",
                    "destination": "savings/summer-rate"
                ] as [String: Any])
            ],
            actionHandler: ActionHandler()
        )
        .previewLayout(.sizeThatFits)
        .padding()
    }
}
#endif
