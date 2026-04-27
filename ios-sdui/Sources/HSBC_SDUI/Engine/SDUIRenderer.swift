// SDUIRenderer.swift
// HSBC SDUI iOS Renderer
// Entry-point SwiftUI view that recursively renders a LayoutNode tree.

import SwiftUI

// MARK: - SDUIRenderer

/// Recursively renders a `LayoutNode` by delegating to `SDUIComponentRegistry`.
/// Wraps every node in analytics instrumentation (impression + click tracking).
public struct SDUIRenderer: View {
    public let node: LayoutNode
    public let actionHandler: ActionHandler

    public init(node: LayoutNode, actionHandler: ActionHandler) {
        self.node = node
        self.actionHandler = actionHandler
    }

    public var body: some View {
        let resolved = SDUIComponentRegistry.resolve(
            type: node.componentType,
            props: node.props,
            children: node.children ?? [],
            actionHandler: actionHandler
        )

        if node.type == .container, let children = node.children, !children.isEmpty {
            // Container: render children recursively inside a VStack.
            AnalyticsInstrumentationView(
                analytics: node.analytics,
                actionHandler: actionHandler
            ) {
                VStack(spacing: 0) {
                    ForEach(children.indices, id: \.self) { index in
                        SDUIRenderer(
                            node: children[index],
                            actionHandler: actionHandler
                        )
                    }
                }
            }
        } else {
            // Leaf component.
            AnalyticsInstrumentationView(
                analytics: node.analytics,
                actionHandler: actionHandler
            ) {
                resolved
            }
        }
    }
}

// MARK: - AnalyticsInstrumentationView

/// Transparent wrapper that fires an impression event on `onAppear`
/// and a click event via a full-size overlay tap gesture.
struct AnalyticsInstrumentationView<Content: View>: View {
    let analytics: AnalyticsConfig?
    let actionHandler: ActionHandler
    @ViewBuilder let content: () -> Content

    @State private var hasLoggedImpression = false

    var body: some View {
        content()
            .onAppear {
                guard !hasLoggedImpression else { return }
                hasLoggedImpression = true
                if let config = analytics {
                    var props: [String: Any] = [
                        "component_id": config.componentId
                    ]
                    if let variantId = config.variantId {
                        props["variant_id"] = variantId
                    }
                    if let custom = config.customProperties {
                        for (key, value) in custom {
                            props[key] = value.value as Any
                        }
                    }
                    AnalyticsClient.fire(event: config.impressionEvent, properties: props)
                }
            }
            .overlay(
                // Tap overlay for click tracking; does not block child gestures
                // because it uses a simultaneous gesture.
                Color.clear
                    .contentShape(Rectangle())
                    .simultaneousGesture(
                        TapGesture().onEnded {
                            if let config = analytics, let clickEvent = config.clickEvent {
                                AnalyticsClient.fire(
                                    event: clickEvent,
                                    properties: ["component_id": config.componentId]
                                )
                            }
                        }
                    )
            )
    }
}

// MARK: - Preview

#if DEBUG
struct SDUIRenderer_Previews: PreviewProvider {
    static var previews: some View {
        let sampleNode = LayoutNode(
            type: .component,
            id: "preview-promo-1",
            componentType: "promo_banner",
            props: [
                "title": "Summer Savings",
                "subtitle": "Up to 5% APY on your savings",
                "backgroundColour": "#C41230",
                "textColour": "#FFFFFF",
                "ctaText": "Find out more"
            ],
            children: nil,
            analytics: AnalyticsConfig(
                impressionEvent: "promo_banner_impression",
                clickEvent: "promo_banner_click",
                componentId: "promo-summer-savings",
                variantId: "A",
                customProperties: nil
            ),
            visibility: nil
        )
        SDUIRenderer(node: sampleNode, actionHandler: ActionHandler())
            .previewLayout(.sizeThatFits)
    }
}
#endif
