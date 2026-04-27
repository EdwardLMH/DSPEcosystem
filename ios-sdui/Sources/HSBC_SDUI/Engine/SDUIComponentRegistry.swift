// SDUIComponentRegistry.swift
// HSBC SDUI iOS Renderer
// Maps component type strings from the SDUI schema to concrete SwiftUI views.

import SwiftUI

// MARK: - SDUIComponentRegistry

public struct SDUIComponentRegistry {

    /// Resolves a component type string to a concrete `AnyView`.
    /// - Parameters:
    ///   - type: The `component_type` string from the layout node (e.g. `"promo_banner"`).
    ///   - props: Decoded props dictionary from the layout node.
    ///   - children: Resolved child layout nodes (may be empty for leaf components).
    ///   - actionHandler: The shared `ActionHandler` for routing CTA interactions.
    /// - Returns: An `AnyView` wrapping the matched component, or `EmptyView` for unknown types.
    @ViewBuilder
    public static func resolve(
        type componentType: String,
        props: [String: AnyCodable],
        children: [LayoutNode],
        actionHandler: ActionHandler
    ) -> AnyView {
        switch componentType {
        case "promo_banner":
            AnyView(
                PromoBannerView(props: props, actionHandler: actionHandler)
            )

        case "quick_action_grid":
            AnyView(
                QuickActionGridView(props: props, children: children, actionHandler: actionHandler)
            )

        case "horizontal_carousel":
            AnyView(
                HorizontalCarouselView(props: props, children: children, actionHandler: actionHandler)
            )

        case "survey_widget":
            AnyView(
                SurveyWidgetView(props: props, actionHandler: actionHandler)
            )

        case "personalised_greeting":
            AnyView(
                PersonalisedGreetingView(props: props, actionHandler: actionHandler)
            )

        case "rate_comparison_table":
            AnyView(
                RateComparisonTableView(props: props, actionHandler: actionHandler)
            )

        case "recommendation_carousel":
            AnyView(
                RecommendationCarouselView(props: props, children: children, actionHandler: actionHandler)
            )

        default:
            // Log unknown component so we can detect schema/client drift.
            let _ = {
                AnalyticsClient.fire(
                    event: "sdui_unknown_component",
                    properties: ["component_type": componentType]
                )
            }()
            AnyView(EmptyView())
        }
    }
}

// MARK: - Stub component views (to be replaced by full implementations)

// These thin structs satisfy the compiler; each real component file overrides them
// via its own file-scoped struct definition.

struct QuickActionGridView: View {
    let props: [String: AnyCodable]
    let children: [LayoutNode]
    let actionHandler: ActionHandler

    var body: some View {
        let columns = (props["columns"]?.intValue ?? 2)
        let items = children
        LazyVGrid(
            columns: Array(repeating: GridItem(.flexible()), count: columns),
            spacing: 12
        ) {
            ForEach(items.indices, id: \.self) { index in
                let node = items[index]
                SDUIComponentRegistry.resolve(
                    type: node.componentType,
                    props: node.props,
                    children: node.children ?? [],
                    actionHandler: actionHandler
                )
            }
        }
        .padding(.horizontal, 16)
    }
}

struct HorizontalCarouselView: View {
    let props: [String: AnyCodable]
    let children: [LayoutNode]
    let actionHandler: ActionHandler

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(children.indices, id: \.self) { index in
                    let node = children[index]
                    SDUIComponentRegistry.resolve(
                        type: node.componentType,
                        props: node.props,
                        children: node.children ?? [],
                        actionHandler: actionHandler
                    )
                }
            }
            .padding(.horizontal, 16)
        }
    }
}

struct SurveyWidgetView: View {
    let props: [String: AnyCodable]
    let actionHandler: ActionHandler

    @State private var selectedRating: Int? = nil

    var body: some View {
        let question = props["question"]?.stringValue ?? ""
        let maxRating = props["maxRating"]?.intValue ?? 5

        VStack(alignment: .leading, spacing: 12) {
            Text(question)
                .font(.subheadline)
                .foregroundColor(.primary)
            HStack(spacing: 8) {
                ForEach(1...maxRating, id: \.self) { rating in
                    Button(action: {
                        selectedRating = rating
                        actionHandler.handle(
                            action: ActionDefinition(
                                type: .TRACK,
                                destination: nil,
                                params: ["rating": AnyCodable(rating)],
                                payload: nil
                            ),
                            from: nil
                        )
                    }) {
                        Circle()
                            .fill(selectedRating == rating ? Color.red : Color(.systemGray5))
                            .frame(width: 36, height: 36)
                            .overlay(Text("\(rating)").font(.caption).foregroundColor(.primary))
                    }
                    .accessibilityLabel("Rating \(rating) of \(maxRating)")
                }
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 2)
    }
}

struct PersonalisedGreetingView: View {
    let props: [String: AnyCodable]
    let actionHandler: ActionHandler

    var body: some View {
        let greeting  = props["greeting"]?.stringValue ?? "Welcome back"
        let firstName = props["firstName"]?.stringValue ?? ""
        let subtitle  = props["subtitle"]?.stringValue

        VStack(alignment: .leading, spacing: 4) {
            Text("\(greeting), \(firstName)")
                .font(.title2.bold())
                .foregroundColor(.primary)
            if let subtitle = subtitle {
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
}

struct RateComparisonTableView: View {
    let props: [String: AnyCodable]
    let actionHandler: ActionHandler

    var body: some View {
        let title   = props["title"]?.stringValue ?? "Rate Comparison"
        let rows    = (props["rows"]?.arrayValue ?? []) as [[String: Any?]?]

        VStack(alignment: .leading, spacing: 0) {
            Text(title)
                .font(.headline)
                .padding(16)

            Divider()

            ForEach(rows.indices, id: \.self) { i in
                let row  = rows[i] as? [String: Any?] ?? [:]
                let label = row["label"] as? String ?? ""
                let value = row["value"] as? String ?? ""
                let highlight = row["highlight"] as? Bool ?? false

                HStack {
                    Text(label)
                        .font(.subheadline)
                        .foregroundColor(.primary)
                    Spacer()
                    Text(value)
                        .font(.subheadline.bold())
                        .foregroundColor(highlight ? Color.red : .primary)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(i % 2 == 0 ? Color(.systemBackground) : Color(.systemGray6))
            }
        }
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 2)
        .padding(.horizontal, 16)
    }
}

struct RecommendationCarouselView: View {
    let props: [String: AnyCodable]
    let children: [LayoutNode]
    let actionHandler: ActionHandler

    var body: some View {
        let title = props["title"]?.stringValue ?? "Recommended for you"

        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
                .padding(.horizontal, 16)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(children.indices, id: \.self) { index in
                        let node = children[index]
                        SDUIComponentRegistry.resolve(
                            type: node.componentType,
                            props: node.props,
                            children: node.children ?? [],
                            actionHandler: actionHandler
                        )
                    }
                }
                .padding(.horizontal, 16)
            }
        }
    }
}
