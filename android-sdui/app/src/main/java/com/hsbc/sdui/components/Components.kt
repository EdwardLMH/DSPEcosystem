package com.hsbc.sdui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hsbc.sdui.analytics.AnalyticsClient
import com.hsbc.sdui.engine.ActionHandler
import com.hsbc.sdui.models.ActionDefinition
import com.hsbc.sdui.models.ActionType
import com.hsbc.sdui.models.SDUINode

@Composable
fun PromoBannerComposable(
    props: Map<String, Any?>,
    actionHandler: ActionHandler
) {
    val title = props["title"] as? String ?: return
    val subtitle = props["subtitle"] as? String
    val imageUrl = props["imageUrl"] as? String
    val ctaText = props["ctaText"] as? String ?: "Learn More"
    val componentId = props["id"] as? String ?: "promo-banner"

    @Suppress("UNCHECKED_CAST")
    val ctaActionMap = props["ctaAction"] as? Map<String, Any>
    val ctaAction = ctaActionMap?.let {
        val typeStr = it["type"] as? String ?: "NAVIGATE"
        val actionType = runCatching { ActionType.valueOf(typeStr) }.getOrDefault(ActionType.NAVIGATE)
        ActionDefinition(
            type = actionType,
            destination = it["destination"] as? String,
            params = (it["params"] as? Map<String, String>),
            payload = null
        )
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF003366))
    ) {
        imageUrl?.let { url ->
            // AsyncImage placeholder — coil is not available in this module.
            // Replace with coil AsyncImage once the dependency is added.
            Box(
                modifier = Modifier.fillMaxWidth().height(180.dp).background(Color(0xFF001F44)),
                contentAlignment = Alignment.Center
            ) {
                Text(url, color = Color.White.copy(alpha = 0.5f), fontSize = 10.sp)
            }
        }
        Column(modifier = Modifier.padding(16.dp)) {
            Text(title, color = Color.White, fontSize = 20.sp, style = MaterialTheme.typography.titleLarge)
            subtitle?.let {
                Spacer(Modifier.height(4.dp))
                Text(it, color = Color.White.copy(alpha = 0.85f), fontSize = 14.sp)
            }
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = {
                    AnalyticsClient.fire("promo_banner_clicked", mapOf("componentId" to componentId))
                    ctaAction?.let { actionHandler.handle(it) }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFC9A84C))
            ) {
                Text(ctaText, color = Color.Black)
            }
        }
    }
}

@Composable
fun PersonalisedGreetingComposable(props: Map<String, Any?>) {
    val template = props["template"] as? String ?: return
    val subtext = props["subtext"] as? String

    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
        Text(template, style = MaterialTheme.typography.headlineSmall)
        subtext?.let { Text(it, style = MaterialTheme.typography.bodyMedium, color = Color.Gray) }
    }
}

@Composable
fun ScrollContainerComposable(
    children: List<SDUINode>?,
    actionHandler: ActionHandler
) {
    androidx.compose.foundation.lazy.LazyColumn(
        contentPadding = PaddingValues(vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(children?.size ?: 0) { i ->
            com.hsbc.sdui.engine.SDUIComponentRegistry.Resolve(children!![i], actionHandler)
        }
    }
}

@Composable
fun SectionGroupComposable(
    props: Map<String, Any?>,
    children: List<SDUINode>?,
    actionHandler: ActionHandler
) {
    val title = props["title"] as? String
    Column {
        title?.let {
            Text(it, style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(16.dp))
        }
        children?.forEach { child ->
            com.hsbc.sdui.engine.SDUIComponentRegistry.Resolve(child, actionHandler)
        }
    }
}

@Composable
fun QuickActionGridComposable(props: Map<String, Any?>, actionHandler: ActionHandler) {
    Text("QuickActionGrid — implement with LazyVerticalGrid", modifier = Modifier.padding(16.dp))
}

@Composable
fun HorizontalCarouselComposable(
    props: Map<String, Any?>,
    children: List<SDUINode>?,
    actionHandler: ActionHandler
) {
    Text("HorizontalCarousel — implement with LazyRow", modifier = Modifier.padding(16.dp))
}

@Composable
fun SurveyWidgetComposable(props: Map<String, Any?>) {
    Text("SurveyWidget — NPS survey UI", modifier = Modifier.padding(16.dp))
}

@Composable
fun RateComparisonTableComposable(props: Map<String, Any?>, actionHandler: ActionHandler) {
    Text("RateComparisonTable — rates from props", modifier = Modifier.padding(16.dp))
}

@Composable
fun ProductFeatureTileComposable(props: Map<String, Any?>, actionHandler: ActionHandler) {
    Text("ProductFeatureTile — feature highlight", modifier = Modifier.padding(16.dp))
}
