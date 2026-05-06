package com.hsbc.sdui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.*
import androidx.compose.runtime.*
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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

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

// ─── AISearchBarComposable ────────────────────────────────────────────────────
// SDUI component rendered when slice type == "AI_SEARCH_BAR".
// Displays an HSBC-red search bar with semantic search entry point,
// QR scan, chatbot and message inbox buttons.
// Search calls POST /api/v1/search on the mock BFF.

private val HsbcRed = Color(0xFFDB0011)

data class SearchResult(
    val id: String,
    val type: String,
    val title: String,
    val description: String,
    val icon: String,
    val category: String,
    val deepLink: String,
)

@Composable
fun AISearchBarComposable(props: Map<String, Any?>, actionHandler: ActionHandler) {
    val placeholder    = props["placeholder"] as? String ?: "搜尋功能、產品"
    val enableQRScan   = props["enableQRScan"] as? Boolean ?: true
    val enableChatbot  = props["enableChatbot"] as? Boolean ?: true
    val enableInbox    = props["enableMessageInbox"] as? Boolean ?: true
    val searchEndpoint = props["searchApiEndpoint"] as? String ?: "http://10.0.2.2:4000/api/v1/search"

    var showOverlay by remember { mutableStateOf(false) }

    if (showOverlay) {
        AISearchOverlay(
            placeholder    = placeholder,
            searchEndpoint = searchEndpoint,
            onDismiss      = { showOverlay = false }
        )
    } else {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(HsbcRed)
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (enableQRScan) {
                Text("⬜", fontSize = 20.sp, color = Color.White.copy(alpha = 0.9f))
            }
            Row(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color.White.copy(alpha = 0.15f))
                    .clickable { showOverlay = true }
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text("🔍", fontSize = 14.sp, color = Color.White.copy(alpha = 0.7f))
                Text(placeholder, fontSize = 13.sp, color = Color.White.copy(alpha = 0.65f))
            }
            if (enableChatbot) {
                Text("🤖", fontSize = 20.sp, color = Color.White.copy(alpha = 0.9f))
            }
            if (enableInbox) {
                Text("✉️", fontSize = 20.sp, color = Color.White.copy(alpha = 0.9f))
            }
        }
    }
}

@Composable
private fun AISearchOverlay(
    placeholder: String,
    searchEndpoint: String,
    onDismiss: () -> Unit,
) {
    val scope        = rememberCoroutineScope()
    var query        by remember { mutableStateOf("") }
    var results      by remember { mutableStateOf<List<SearchResult>>(emptyList()) }
    var isLoading    by remember { mutableStateOf(false) }
    var errorMsg     by remember { mutableStateOf("") }

    val suggestions = listOf("朝朝寶", "低風險理財", "信用卡", "基金", "借錢", "外匯")

    fun search(q: String) {
        if (q.isBlank()) { results = emptyList(); errorMsg = ""; return }
        scope.launch {
            isLoading = true
            errorMsg = ""
            delay(350)
            try {
                val parsed = withContext(Dispatchers.IO) {
                    val conn = (URL(searchEndpoint).openConnection() as HttpURLConnection).also {
                        it.requestMethod = "POST"
                        it.setRequestProperty("Content-Type", "application/json")
                        it.doOutput = true
                        it.outputStream.write("""{"query":"$q","limit":8}""".toByteArray())
                    }
                    val body = conn.inputStream.bufferedReader().readText()
                    conn.disconnect()
                    JSONObject(body)
                }
                val arr = parsed.getJSONArray("results")
                results = (0 until arr.length()).map { i ->
                    val o = arr.getJSONObject(i)
                    SearchResult(
                        id          = o.getString("id"),
                        type        = o.getString("type"),
                        title       = o.getString("title"),
                        description = o.getString("description"),
                        icon        = o.getString("icon"),
                        category    = o.getString("category"),
                        deepLink    = o.getString("deepLink"),
                    )
                }
            } catch (_: Exception) {
                errorMsg = "搜尋服務暫時不可用，請稍後重試。"
                results = emptyList()
            } finally {
                isLoading = false
            }
        }
    }

    Column(Modifier.fillMaxSize().background(Color.White)) {
        // Search bar header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(HsbcRed)
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color.White.copy(alpha = 0.15f))
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text(if (isLoading) "⏳" else "🔍", fontSize = 14.sp, color = Color.White.copy(alpha = 0.7f))
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it; search(it) },
                    placeholder = { Text(placeholder, color = Color.White.copy(alpha = 0.6f), fontSize = 13.sp) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color.Transparent,
                        unfocusedBorderColor = Color.Transparent,
                    ),
                    modifier = Modifier.weight(1f),
                )
            }
            TextButton(onClick = onDismiss) {
                Text("取消", color = Color.White, fontSize = 14.sp)
            }
        }

        Divider(color = Color(0xFFE5E7EB))

        when {
            errorMsg.isNotEmpty() -> {
                Text(errorMsg, color = HsbcRed, modifier = Modifier.padding(16.dp))
            }
            query.isBlank() -> {
                // Suggestions
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("熱門搜尋", fontSize = 12.sp, color = Color(0xFF6B7280))
                    suggestions.chunked(3).forEach { row ->
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            row.forEach { s ->
                                OutlinedButton(
                                    onClick = { query = s; search(s) },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(18.dp),
                                ) { Text(s, fontSize = 12.sp) }
                            }
                        }
                    }
                }
            }
            results.isEmpty() && !isLoading -> {
                Column(
                    Modifier.fillMaxWidth().padding(top = 48.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text("🔍", fontSize = 40.sp)
                    Text("找不到「$query」的相關結果", fontSize = 14.sp)
                    Text("試試其他關鍵詞", fontSize = 12.sp, color = Color(0xFF9CA3AF))
                }
            }
            else -> {
                LazyColumn {
                    itemsIndexed(results) { _, r ->
                        Row(
                            Modifier.fillMaxWidth().clickable { onDismiss() }
                                .padding(horizontal = 16.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Box(
                                Modifier.size(44.dp).clip(RoundedCornerShape(10.dp))
                                    .background(Color(0xFFFEE2E2)),
                                contentAlignment = Alignment.Center,
                            ) { Text(r.icon, fontSize = 20.sp) }
                            Column(Modifier.weight(1f)) {
                                Text(r.title, fontSize = 13.sp, maxLines = 1)
                                Text(r.description, fontSize = 11.sp, color = Color(0xFF6B7280), maxLines = 2)
                            }
                            Text(
                                r.type, fontSize = 9.sp, color = HsbcRed,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFFFEE2E2))
                                    .padding(horizontal = 7.dp, vertical = 3.dp),
                            )
                        }
                        Divider(color = Color(0xFFF3F4F6), modifier = Modifier.padding(start = 72.dp))
                    }
                }
            }
        }
    }
}
