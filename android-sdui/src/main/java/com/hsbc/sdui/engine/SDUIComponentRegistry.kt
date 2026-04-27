package com.hsbc.sdui.engine

import com.hsbc.sdui.analytics.AnalyticsClient
import com.hsbc.sdui.models.SDUINode
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import com.hsbc.sdui.components.*

object SDUIComponentRegistry {

    @Composable
    fun Resolve(node: SDUINode, actionHandler: ActionHandler) {
        // Fire impression analytics
        LaunchedEffect(node.id) {
            node.analytics?.let { analytics ->
                AnalyticsClient.fire(
                    analytics.impressionEvent,
                    mapOf(
                        "componentId" to node.id,
                        "variantId" to (analytics.variantId ?: ""),
                        "experimentId" to (analytics.experimentId ?: "")
                    )
                )
            }
        }

        when (node.type) {
            "PromoBanner"           -> PromoBannerComposable(node.props, actionHandler)
            "QuickActionGrid"       -> QuickActionGridComposable(node.props, actionHandler)
            "HorizontalCarousel"    -> HorizontalCarouselComposable(node.props, node.children, actionHandler)
            "SurveyWidget"          -> SurveyWidgetComposable(node.props)
            "PersonalisedGreeting"  -> PersonalisedGreetingComposable(node.props)
            "RateComparisonTable"   -> RateComparisonTableComposable(node.props, actionHandler)
            "ProductFeatureTile"    -> ProductFeatureTileComposable(node.props, actionHandler)
            "ScrollContainer"       -> ScrollContainerComposable(node.children, actionHandler)
            "SectionGroup"          -> SectionGroupComposable(node.props, node.children, actionHandler)
            else -> {
                AnalyticsClient.log("sdui_unknown_component", mapOf("type" to node.type, "id" to node.id))
                // Render fallback if provided
                node.fallback?.let { Resolve(it, actionHandler) }
            }
        }
    }
}
