package com.hsbc.sdui.home

import android.net.Uri
import android.widget.MediaController
import android.widget.VideoView
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.hsbc.sdui.analytics.TealiumClient
import kotlinx.coroutines.launch



// ─── Quick-access icon map ────────────────────────────────────────────────────

private val QA_ICON_MAP = mapOf(
    "account"  to "👤",
    "transfer" to "🌐",
    "fx"       to "💱",
    "stock"    to "📈",
    "deposit"  to "⏰",
    "holding"  to "📊",
    "safe"     to "💰",
    "fps"      to "↔️",
    "scan"     to "📷",
    "all"      to "⊞",
)

private data class FeatureProductButton(
    val id: String,
    val name: String,
    val description: String = "",
    val url: String = ""
)

private fun featureProductButtonsFrom(props: Map<String, Any?>): List<FeatureProductButton> {
    val buttons = (props["buttons"] as? List<*>)?.filterIsInstance<Map<String, Any?>>()?.mapNotNull { raw ->
        val id = raw["id"] as? String ?: return@mapNotNull null
        FeatureProductButton(
            id = id,
            name = raw["name"] as? String ?: id,
            description = raw["description"] as? String ?: "",
            url = raw["url"] as? String ?: ""
        )
    }.orEmpty()
    if (buttons.isNotEmpty()) return buttons
    return (props["tabs"] as? List<*>)?.filterIsInstance<String>()?.map { FeatureProductButton(it, it) }.orEmpty()
}

private val DEFAULT_FEATURE_PRODUCT_PROPS: Map<String, Any?> = mapOf(
    "sectionTitle" to "Feature product",
    "activeButtonId" to "top-performers",
    "buttons" to listOf(
        mapOf("id" to "top-performers", "name" to "Top performers", "description" to "Top 3 funds by 1Y return", "url" to "/api/v1/funds/feature-products?filter=top-performers&limit=3"),
        mapOf("id" to "top-dividend", "name" to "Top dividend", "description" to "Income funds with higher dividend profile", "url" to "/api/v1/funds/feature-products?filter=top-dividend&limit=3"),
        mapOf("id" to "top-selling", "name" to "Top selling", "description" to "Best selling funds by subscription volume", "url" to "/api/v1/funds/feature-products?filter=top-selling&limit=3"),
        mapOf("id" to "installment", "name" to "Installment", "description" to "Funds suitable for installment investment plans", "url" to "/api/v1/funds/feature-products?filter=installment&limit=3"),
    ),
    "moreLabel" to "View Best selling fund list (10)",
    "moreDeepLink" to "hsbc://funds/best-selling",
    "bestSellingUrl" to "/api/v1/funds/feature-products?filter=best-selling&limit=10"
)

// ─── Load state ───────────────────────────────────────────────────────────────

private sealed class HomeLoadState {
    object Loading : HomeLoadState()
    data class Done(val slices: List<HomeSlice>) : HomeLoadState()
    object Fallback : HomeLoadState()   // BFF not live — use static data
}

// ─── Root entry point ─────────────────────────────────────────────────────────

@Composable
fun HomePageScreen() {
    var loadState by remember { mutableStateOf<HomeLoadState>(HomeLoadState.Loading) }
    var searchOpen by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        TealiumClient.homeHubViewed()
        scope.launch {
            loadState = try {
                val payload = HomeNetworkService.api.fetchHomeScreen()
                val visible = payload.layout.children.filter { it.visible }
                if (visible.isEmpty()) HomeLoadState.Fallback
                else HomeLoadState.Done(visible)
            } catch (_: Exception) {
                HomeLoadState.Fallback
            }
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(modifier = Modifier.fillMaxSize().background(N50)) {
            when (val state = loadState) {
                is HomeLoadState.Loading -> {
                    item { WHHomeSearchHeader(onSearchTap = { searchOpen = true }) }
                    item {
                        Box(
                            modifier = Modifier.fillMaxWidth().height(80.dp),
                            contentAlignment = Alignment.Center
                        ) { Text("Loading…", fontSize = 13.sp, color = N400) }
                    }
                }

                is HomeLoadState.Done -> {
                    // ── SDUI path: render slices from approved BFF page ────────
                    state.slices.forEach { slice ->
                        item(key = slice.instanceId) {
                            SDUISliceView(slice = slice, onSearchTap = { searchOpen = true })
                        }
                    }
                }

                is HomeLoadState.Fallback -> {
                    // ── Static fallback: no LIVE page published yet ────────────
                    item { WHHomeSearchHeader(onSearchTap = { searchOpen = true }) }
                    item { WHComboQuickAccess() }
                    item { WHCardActivationBanner() }
                    item { WHQuestBanner() }
                    item { WHFeatureProduct() }
                    item { WHWealthStudioCarousel() }
                    item { WHGuidesInsights() }
                    item { WHFXWatchlist() }
                    item { WHDiscoverMore() }
                }
            }
            item { Spacer(Modifier.height(40.dp)) }
        }

        if (searchOpen) {
            AISearchScreen(onDismiss = { searchOpen = false })
        }
    }
}

// ─── SDUI slice dispatcher ────────────────────────────────────────────────────

@Suppress("UNCHECKED_CAST")
@Composable
private fun SDUISliceView(slice: HomeSlice, onSearchTap: () -> Unit = {}) {
    val p = slice.props
    when (slice.type) {
        "HOME_SEARCH_HEADER"     -> SDUIHomeSearchHeader(props = p, onSearchTap = onSearchTap)
        "COMBO_QUICK_ACCESS"     -> SDUIComboQuickAccess(props = p)
        "CARD_ACTIVATION_BANNER" -> SDUICardActivationBanner(props = p)
        "QUEST_BANNER"           -> SDUIQuestBanner(props = p)
        "FEATURE_PRODUCT"        -> SDUIFeatureProduct(props = p)
        "WEALTH_STUDIO_CAROUSEL" -> SDUIWealthStudioCarousel(props = p)
        "GUIDES_INSIGHTS_CAROUSEL"        -> SDUIGuidesInsights(props = p)
        "FX_WATCHLIST"           -> SDUIFXWatchlist(props = p)
        "DISCOVER_MORE_CAROUSEL"          -> SDUIDiscoverMore(props = p)
        "SPACER"                 -> Spacer(Modifier.height(((p["height"] as? Double)?.toInt() ?: 16).dp))
        // unknown types silently skipped
    }
}

// ─── SDUI slice composables (BFF-driven) ──────────────────────────────────────

@Suppress("UNCHECKED_CAST")
@Composable
private fun SDUIHomeSearchHeader(props: Map<String, Any?>, onSearchTap: () -> Unit = {}) {
    val premierLabel = props["premierLabel"] as? String ?: "HSBC Premier"
    val premierBg    = props["premierBg"] as? String ?: "#DB0011"
    val bgColor      = try { Color(android.graphics.Color.parseColor(premierBg)) } catch (_: Exception) { HsbcRed }
    val placeholder  = props["placeholder"] as? String ?: "Search with AI"
    val showBell     = props["enableNotification"] as? Boolean ?: true
    val showHeadset  = props["enableHeadset"] as? Boolean ?: true

    Column {
        // Red premier bar
        Row(
            modifier = Modifier.fillMaxWidth().background(bgColor)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = premierLabel,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = White
            )
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                if (showBell) Text(
                    text = "🔔",
                    fontSize = 20.sp,
                    modifier = Modifier.clickable {
                        TealiumClient.track(
                            event = "notification_tap", category = "Home",
                            action = "notification_tapped",
                            screen = "home_hub_hk", journey = "home_hub"
                        )
                    }
                )
                if (showHeadset) Text(
                    text = "🎧",
                    fontSize = 20.sp,
                    modifier = Modifier.clickable {
                        TealiumClient.track(
                            event = "headset_tap", category = "Home",
                            action = "headset_tapped",
                            screen = "home_hub_hk", journey = "home_hub"
                        )
                    }
                )
            }
        }
        // White search pill on red background
        Row(
            modifier = Modifier.fillMaxWidth().background(bgColor)
                .padding(start = 16.dp, end = 16.dp, bottom = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f).clip(RoundedCornerShape(18.dp))
                    .background(White)
                    .clickable {
                        TealiumClient.track(
                            event = "search_tap", category = "Wealth",
                            action = "search_tapped",
                            screen = "home_hub_hk", journey = "home_hub"
                        )
                        onSearchTap()
                    }
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text("🔍", fontSize = 13.sp, color = N500)
                Text(placeholder, fontSize = 13.sp, color = N400, modifier = Modifier.weight(1f))
                Box(
                    modifier = Modifier.clip(RoundedCornerShape(6.dp))
                        .background(Color(0xFFFFEDED))
                        .padding(horizontal = 5.dp, vertical = 2.dp)
                ) { Text("AI", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = HsbcRed) }
            }
        }
        Divider(color = Color(0xFFE5E5E5))
    }
}

@Suppress("UNCHECKED_CAST")
@Composable
private fun SDUIComboQuickAccess(props: Map<String, Any?>) {
    val tabs      = (props["tabs"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()
    val row1Items = (props["row1Items"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()
    val row2Items = (props["row2Items"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()

    var selectedTab by remember { mutableStateOf((tabs.firstOrNull { it["active"] as? Boolean == true }?.get("id") as? String) ?: "") }

    Column(modifier = Modifier.fillMaxWidth().background(White)) {
        // Tab bar — pill/capsule style (active=red bg/white text, inactive=gray)
        Row(
            modifier = Modifier.fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            tabs.forEach { tab ->
                val tabId    = tab["id"] as? String ?: ""
                val tabLabel = tab["label"] as? String ?: ""
                val isActive = tabId == selectedTab
                Text(
                    text = tabLabel,
                    fontSize = 13.sp,
                    fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal,
                    color = if (isActive) White else N700,
                    modifier = Modifier
                        .clip(RoundedCornerShape(18.dp))
                        .background(if (isActive) HsbcRed else Color(0xFFE4E4E4))
                        .clickable {
                            selectedTab = tabId
                            TealiumClient.track(
                                event = "quick_access_tab_tap", category = "Home",
                                action = "tab_selected", label = tabLabel,
                                screen = "home_hub_hk", journey = "home_hub",
                                custom = mapOf("tab_id" to tabId)
                            )
                        }
                        .padding(horizontal = 16.dp, vertical = 7.dp)
                )
            }
        }
        // Row 1 of icons
        QuickAccessRow(items = row1Items)
        // Row 2 of icons
        QuickAccessRow(items = row2Items)
        Spacer(Modifier.height(4.dp))
    }
}

@Composable
private fun QuickAccessRow(items: List<Map<String, Any?>>) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        items.forEach { item ->
            val iconKey  = item["icon"] as? String ?: ""
            val icon     = QA_ICON_MAP[iconKey] ?: "●"
            val label    = item["label"] as? String ?: ""
            val deepLink = item["deepLink"] as? String ?: ""
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(4.dp),
                modifier = Modifier.weight(1f).clickable {
                    TealiumClient.quickAccessTapped(label, deepLink)
                }
            ) {
                Box(
                    modifier = Modifier.size(46.dp).clip(RoundedCornerShape(14.dp)).background(N100),
                    contentAlignment = Alignment.Center
                ) { Text(icon, fontSize = 20.sp) }
                Text(
                    text = label,
                    fontSize = 9.sp,
                    color = N700,
                    textAlign = TextAlign.Center,
                    maxLines = 2,
                    lineHeight = 12.sp
                )
            }
        }
    }
}

@Composable
private fun SDUICardActivationBanner(props: Map<String, Any?>) {
    val message  = props["message"] as? String ?: "Your card needs to be activated"
    val deepLink = props["deepLink"] as? String ?: "hsbc://card/activate"

    Row(
        modifier = Modifier.fillMaxWidth().background(White)
            .clickable {
                TealiumClient.sliceTapped("CARD_ACTIVATION_BANNER", "slice-card-activation", message, deepLink)
            }
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("🔔", fontSize = 20.sp)
        Text(
            text = message,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = N900,
            modifier = Modifier.weight(1f)
        )
        Text("›", fontSize = 18.sp, color = N400)
    }
}

@Composable
private fun SDUIQuestBanner(props: Map<String, Any?>) {
    val title       = props["title"] as? String ?: "Getting started"
    val description = props["description"] as? String ?: ""
    val ctaLabel    = props["ctaLabel"] as? String ?: "Check out all 4 quests"
    val ctaDeepLink = props["ctaDeepLink"] as? String ?: "hsbc://quests"

    Row(
        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp).fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFFFFF8F8))
            .border(1.dp, Color(0xFFFFE4E6), RoundedCornerShape(14.dp))
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // HSBC hexagon placeholder
        Box(
            modifier = Modifier.size(48.dp).clip(RoundedCornerShape(10.dp)).background(HsbcRed),
            contentAlignment = Alignment.Center
        ) { Text("⬡", fontSize = 22.sp, color = White) }

        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(title, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = N900)
            Text(description, fontSize = 11.sp, color = N500, lineHeight = 16.sp)
            Spacer(Modifier.height(4.dp))
            Button(
                onClick = {
                    TealiumClient.sliceTapped("QUEST_BANNER", "slice-getting-started", ctaLabel, ctaDeepLink)
                },
                modifier = Modifier.height(32.dp),
                shape = RoundedCornerShape(14.dp),
                contentPadding = PaddingValues(horizontal = 14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
            ) { Text(ctaLabel, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = White) }
        }
    }
}

@Suppress("UNCHECKED_CAST")
@Composable
private fun SDUIFeatureProduct(props: Map<String, Any?>) {
    val sectionTitle = props["sectionTitle"] as? String ?: "Feature product"
    val buttons      = featureProductButtonsFrom(props)
    val funds        = (props["funds"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()
    val moreLabel    = props["moreLabel"] as? String ?: "View fund list"
    val moreLink     = props["bestSellingUrl"] as? String ?: props["moreDeepLink"] as? String ?: "hsbc://funds/best-selling"

    var activeButtonId by remember { mutableStateOf(props["activeButtonId"] as? String ?: props["activeTab"] as? String ?: buttons.firstOrNull()?.id ?: "") }

    Column(modifier = Modifier.fillMaxWidth().background(White).padding(vertical = 12.dp)) {
        // Header
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            Arrangement.SpaceBetween,
            Alignment.CenterVertically
        ) {
            Text(sectionTitle, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = N900)
            Text(
                text = "More ›",
                fontSize = 12.sp,
                color = HsbcRed,
                modifier = Modifier.clickable {
                    TealiumClient.sliceTapped("FEATURE_PRODUCT", "slice-feature-product", moreLabel, moreLink)
                }
            )
        }
        Spacer(Modifier.height(10.dp))
        // Tab strip — horizontally scrollable
        Row(
            modifier = Modifier.fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            buttons.forEach { button ->
                val isActive = button.id == activeButtonId || button.name == activeButtonId
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .background(if (isActive) White else Color.Transparent)
                        .border(1.dp, if (isActive) N100 else Color.Transparent, RoundedCornerShape(16.dp))
                        .clickable {
                            activeButtonId = button.id
                            TealiumClient.sliceTapped("FEATURE_PRODUCT", "slice-feature-product", button.name, button.url)
                        }
                        .padding(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = button.name,
                        fontSize = 12.sp,
                        color = if (isActive) N900 else N400,
                        fontWeight = if (isActive) FontWeight.SemiBold else FontWeight.Normal
                    )
                }
            }
        }
        Spacer(Modifier.height(8.dp))
        // Fund rows
        funds.forEachIndexed { idx, fund ->
            val name          = fund["name"] as? String ?: ""
            val code          = fund["code"] as? String ?: ""
            val returnLabel   = fund["returnLabel"] as? String ?: "1Y return"
            val returnValue   = fund["returnValue"] as? String ?: ""
            val returnPositive = fund["returnPositive"] as? Boolean ?: true
            val tags          = (fund["tags"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
            val fundId        = fund["id"] as? String ?: ""

            Row(
                modifier = Modifier.fillMaxWidth()
                    .clickable { TealiumClient.homeProductTapped(name, fundId) }
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = name,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = N900,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(code, fontSize = 10.sp, color = N500)
                        tags.forEach { tag ->
                            Box(
                                modifier = Modifier.clip(RoundedCornerShape(6.dp))
                                    .background(Color(0xFFEFF6FF))
                                    .padding(horizontal = 6.dp, vertical = 1.dp)
                            ) { Text(tag, fontSize = 9.sp, color = Color(0xFF3B82F6)) }
                        }
                    }
                }
                Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        text = returnValue,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = if (returnPositive) Color(0xFF16A34A) else HsbcRed
                    )
                    Text(returnLabel, fontSize = 9.sp, color = N400)
                }
            }
            if (idx < funds.size - 1) Divider(color = N100, modifier = Modifier.padding(horizontal = 16.dp))
        }
        Spacer(Modifier.height(4.dp))
        Text(
            text = moreLabel,
            fontSize = 11.sp,
            color = HsbcRed,
            textAlign = TextAlign.Center,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp).clickable {
                TealiumClient.sliceTapped("FEATURE_PRODUCT", "slice-feature-product", moreLabel, moreLink)
            }
        )
    }
}

@Suppress("UNCHECKED_CAST")
@Composable
private fun SDUIWealthStudioCarousel(props: Map<String, Any?>) {
    val sectionTitle = props["sectionTitle"] as? String ?: "Premier Elite Wealth Studio"
    val moreLabel    = props["moreLabel"] as? String ?: "View all"
    val moreLink     = props["moreDeepLink"] as? String ?: "hsbc://wealth-studio"
    val items        = (props["items"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()
    var playingUrl by remember { mutableStateOf<String?>(null) }

    if (playingUrl != null) {
        Dialog(
            onDismissRequest = { playingUrl = null },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(
                Modifier.fillMaxWidth().background(Color.Black),
                contentAlignment = Alignment.Center
            ) {
                AndroidView(
                    modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f),
                    factory = { ctx ->
                        VideoView(ctx).apply {
                            val rawUrl = playingUrl ?: ""
                            val resolved = rawUrl.replace("localhost", "10.0.2.2")
                                .replace("127.0.0.1", "10.0.2.2")
                            setVideoURI(Uri.parse(resolved))
                            val mc = MediaController(ctx)
                            mc.setAnchorView(this)
                            setMediaController(mc)
                            start()
                        }
                    }
                )
                IconButton(
                    onClick = { playingUrl = null },
                    modifier = Modifier.align(Alignment.TopEnd).padding(8.dp)
                ) {
                    Text("✕", color = Color.White, fontSize = 18.sp)
                }
            }
        }
    }

    Column(modifier = Modifier.fillMaxWidth().background(White).padding(vertical = 12.dp)) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            Arrangement.SpaceBetween,
            Alignment.CenterVertically
        ) {
            Text(sectionTitle, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = N900)
            Text(
                text = "$moreLabel ›",
                fontSize = 12.sp,
                color = HsbcRed,
                modifier = Modifier.clickable {
                    TealiumClient.sliceTapped("WEALTH_STUDIO_CAROUSEL", "slice-wealth-studio", moreLabel, moreLink)
                }
            )
        }
        Spacer(Modifier.height(10.dp))
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(items) { item ->
                val id           = item["id"] as? String ?: ""
                val episodeLabel = item["episodeLabel"] as? String ?: ""
                val liveBadge    = item["liveBadge"] as? String ?: ""
                val title        = item["title"] as? String ?: ""
                val ctaLabel     = item["ctaLabel"] as? String ?: "Watch now"
                val videoUrl     = item["videoUrl"] as? String ?: ""
                val imgColorHex  = item["imageColor"] as? String ?: "#1A1A2E"
                val imgColor     = try { Color(android.graphics.Color.parseColor(imgColorHex)) } catch (_: Exception) { Color(0xFF1A1A2E) }

                Column(
                    modifier = Modifier.width(240.dp).height(160.dp).clip(RoundedCornerShape(14.dp))
                        .background(imgColor)
                        .clickable {
                            TealiumClient.wealthStudioTapped(title, id)
                            if (videoUrl.isNotEmpty()) playingUrl = videoUrl
                        },
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // Top: live badge + episode + title — fills remaining space
                    Column(
                        modifier = Modifier.weight(1f).padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        if (liveBadge.isNotEmpty()) {
                            Box(
                                modifier = Modifier.clip(RoundedCornerShape(6.dp))
                                    .background(Color(0x33FFFFFF))
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) { Text(liveBadge, fontSize = 9.sp, color = White, maxLines = 1, overflow = TextOverflow.Ellipsis) }
                        }
                        Text(episodeLabel, fontSize = 10.sp, color = Color(0xAAFFFFFF))
                        Text(
                            text = title,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = White,
                            maxLines = 3,
                            lineHeight = 18.sp
                        )
                    }
                    // Bottom: CTA pinned to card bottom
                    Box(
                        modifier = Modifier.fillMaxWidth()
                            .background(Color(0x22000000))
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Box(
                            modifier = Modifier.clip(RoundedCornerShape(20.dp))
                                .background(HsbcRed)
                                .padding(horizontal = 14.dp, vertical = 6.dp)
                        ) { Text(ctaLabel, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = White) }
                    }
                }
            }
        }
    }
}

@Suppress("UNCHECKED_CAST")
@Composable
private fun SDUIGuidesInsights(props: Map<String, Any?>) {
    val sectionTitle = props["sectionTitle"] as? String ?: "Guides and insights"
    val moreLabel    = props["moreLabel"] as? String ?: "View all"
    val moreLink     = props["moreDeepLink"] as? String ?: "hsbc://guides"
    val items        = (props["items"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()

    Column(modifier = Modifier.fillMaxWidth().background(White).padding(vertical = 12.dp)) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            Arrangement.SpaceBetween,
            Alignment.CenterVertically
        ) {
            Text(sectionTitle, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = N900)
            Text(
                text = "$moreLabel ›",
                fontSize = 12.sp,
                color = HsbcRed,
                modifier = Modifier.clickable {
                    TealiumClient.sliceTapped("GUIDES_INSIGHTS_CAROUSEL", "slice-guides-insights", moreLabel, moreLink)
                }
            )
        }
        Spacer(Modifier.height(10.dp))
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(items) { item ->
                val id          = item["id"] as? String ?: ""
                val title       = item["title"] as? String ?: ""
                val date        = item["date"] as? String ?: ""
                val deepLink    = item["deepLink"] as? String ?: ""
                val imgColorHex = item["imageColor"] as? String ?: "#2D3748"
                val imgColor    = try { Color(android.graphics.Color.parseColor(imgColorHex)) } catch (_: Exception) { Color(0xFF2D3748) }

                Column(
                    modifier = Modifier.width(200.dp).height(180.dp).clip(RoundedCornerShape(12.dp))
                        .background(N50)
                        .clickable { TealiumClient.guidesTapped(title, id) }
                ) {
                    // Fixed-height image placeholder
                    Box(
                        modifier = Modifier.fillMaxWidth().height(110.dp)
                            .background(imgColor),
                        contentAlignment = Alignment.Center
                    ) { Text("📰", fontSize = 28.sp) }
                    // Text content fills remaining fixed height
                    Column(
                        modifier = Modifier.padding(10.dp).weight(1f),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = title,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = N900,
                            maxLines = 3,
                            overflow = TextOverflow.Ellipsis,
                            lineHeight = 16.sp
                        )
                        Text(date, fontSize = 10.sp, color = N400)
                    }
                }
            }
        }
    }
}

@Suppress("UNCHECKED_CAST")
@Composable
private fun SDUIFXWatchlist(props: Map<String, Any?>) {
    val sectionTitle    = props["sectionTitle"] as? String ?: "FX watchlist"
    val tierBadge       = props["tierBadge"] as? String ?: "Gold Forex Club tier"
    val tierDescription = props["tierDescription"] as? String ?: ""
    val pairs           = (props["pairs"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()
    val moreLabel       = props["moreLabel"] as? String ?: "View more in FX"
    val moreLink        = props["moreDeepLink"] as? String ?: "hsbc://fx/watchlist"

    Column(modifier = Modifier.fillMaxWidth().background(White).padding(vertical = 12.dp)) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            Arrangement.SpaceBetween,
            Alignment.CenterVertically
        ) {
            Text(sectionTitle, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = N900)
            Text(
                text = "$moreLabel ›",
                fontSize = 12.sp,
                color = HsbcRed,
                modifier = Modifier.clickable {
                    TealiumClient.sliceTapped("FX_WATCHLIST", "slice-fx-watchlist", moreLabel, moreLink)
                }
            )
        }
        Spacer(Modifier.height(8.dp))
        // Tier badge row
        Row(
            modifier = Modifier.padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier.clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFFFFFBEB))
                    .border(1.dp, Color(0xFFFDE68A), RoundedCornerShape(8.dp))
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "🏅 $tierBadge",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFF92400E)
                )
            }
            if (tierDescription.isNotEmpty()) {
                Text(tierDescription, fontSize = 10.sp, color = N500)
            }
        }
        Spacer(Modifier.height(8.dp))
        // Column headers
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text("Pair", fontSize = 10.sp, color = N400, modifier = Modifier.weight(1f))
            Text("Sell", fontSize = 10.sp, color = N400, modifier = Modifier.width(80.dp), textAlign = TextAlign.End)
            Text("Buy", fontSize = 10.sp, color = N400, modifier = Modifier.width(80.dp), textAlign = TextAlign.End)
        }
        Divider(color = N100, modifier = Modifier.padding(horizontal = 16.dp))
        pairs.forEachIndexed { idx, pair ->
            val pairLabel = pair["pair"] as? String ?: ""
            val sellLabel = pair["sellLabel"] as? String ?: "Sell"
            val sellRate  = pair["sellRate"] as? String ?: ""
            val buyLabel  = pair["buyLabel"] as? String ?: "Buy"
            val buyRate   = pair["buyRate"] as? String ?: ""

            Row(
                Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(pairLabel, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = N900)
                }
                Column(
                    modifier = Modifier.width(80.dp),
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Text(sellLabel, fontSize = 9.sp, color = N400)
                    Text(sellRate, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = N900)
                }
                Column(
                    modifier = Modifier.width(80.dp),
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Text(buyLabel, fontSize = 9.sp, color = N400)
                    Text(buyRate, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = N900)
                }
            }
            if (idx < pairs.size - 1) Divider(color = N100, modifier = Modifier.padding(horizontal = 16.dp))
        }
    }
}

@Suppress("UNCHECKED_CAST")
@Composable
private fun SDUIDiscoverMore(props: Map<String, Any?>) {
    val sectionTitle = props["sectionTitle"] as? String ?: "Discover more"
    val items        = (props["items"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()

    Column(modifier = Modifier.fillMaxWidth().background(N50).padding(vertical = 12.dp)) {
        Text(
            text = sectionTitle,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            color = N900,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
        Spacer(Modifier.height(10.dp))
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(items) { item ->
                val id          = item["id"] as? String ?: ""
                val tag         = item["tag"] as? String ?: ""
                val tagColorHex = item["tagColor"] as? String ?: "#DB0011"
                val tagColor    = try { Color(android.graphics.Color.parseColor(tagColorHex)) } catch (_: Exception) { HsbcRed }
                val title       = item["title"] as? String ?: ""
                val subtitle    = item["subtitle"] as? String ?: ""
                val deepLink    = item["deepLink"] as? String ?: ""
                val imgColorHex = item["imageColor"] as? String ?: "#1A2E4A"
                val imgColor    = try { Color(android.graphics.Color.parseColor(imgColorHex)) } catch (_: Exception) { Color(0xFF1A2E4A) }

                Column(
                    modifier = Modifier.width(200.dp).height(178.dp).clip(RoundedCornerShape(14.dp))
                        .background(White)
                        .clickable { TealiumClient.discoverMoreTapped(title, tag) }
                ) {
                    // Fixed-height image area with tag chip
                    Box(
                        modifier = Modifier.fillMaxWidth().height(110.dp).background(imgColor),
                        contentAlignment = Alignment.TopStart
                    ) {
                        Box(
                            modifier = Modifier.padding(10.dp).clip(RoundedCornerShape(8.dp))
                                .background(tagColor)
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) { Text(tag, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = White) }
                    }
                    // Fixed text content area
                    Column(
                        modifier = Modifier.padding(10.dp).weight(1f),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = title,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = N900,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (subtitle.isNotEmpty()) {
                            Text(
                                text = subtitle,
                                fontSize = 10.sp,
                                color = N500,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }
    }
}

// ─── Static fallback composables ──────────────────────────────────────────────

@Composable
private fun WHHomeSearchHeader(onSearchTap: () -> Unit = {}) {
    LaunchedEffect(Unit) { TealiumClient.sliceImpression("HOME_SEARCH_HEADER", "slice-home-search-header", 0) }
    Column {
        // Red premier bar
        Row(
            modifier = Modifier.fillMaxWidth().background(HsbcRed)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("HSBC Premier", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = White)
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("🔔", fontSize = 20.sp, modifier = Modifier.clickable {
                    TealiumClient.track(
                        event = "notification_tap", category = "Home",
                        action = "notification_tapped",
                        screen = "home_hub_hk", journey = "home_hub"
                    )
                })
                Text("🎧", fontSize = 20.sp, modifier = Modifier.clickable {
                    TealiumClient.track(
                        event = "headset_tap", category = "Home",
                        action = "headset_tapped",
                        screen = "home_hub_hk", journey = "home_hub"
                    )
                })
            }
        }
        // White search pill on red background
        Row(
            modifier = Modifier.fillMaxWidth().background(HsbcRed)
                .padding(start = 16.dp, end = 16.dp, bottom = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f).clip(RoundedCornerShape(18.dp))
                    .background(White)
                    .clickable {
                        TealiumClient.track(
                            event = "search_tap", category = "Home",
                            action = "search_tapped",
                            screen = "home_hub_hk", journey = "home_hub"
                        )
                        onSearchTap()
                    }
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text("🔍", fontSize = 13.sp, color = N500)
                Text("Search with AI", fontSize = 13.sp, color = N400, modifier = Modifier.weight(1f))
                Box(
                    modifier = Modifier.clip(RoundedCornerShape(6.dp))
                        .background(Color(0xFFFFEDED)).padding(horizontal = 5.dp, vertical = 2.dp)
                ) { Text("AI", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = HsbcRed) }
            }
        }
        Divider(color = Color(0xFFE5E5E5))
    }
}

@Composable
private fun WHComboQuickAccess() {
    val tabs = listOf(
        "My pick" to true,
        "Invest" to false,
        "Global" to false,
        "HK Daily" to false,
    )
    val row1 = listOf(
        Triple("👤", "Account overview",  "hsbc://accounts"),
        Triple("🌐", "Transfer Globally", "hsbc://transfer/global"),
        Triple("💱", "Foreign exchange",  "hsbc://fx"),
        Triple("📈", "Trade stock",       "hsbc://trade/stock"),
        Triple("⏰", "Time deposit",      "hsbc://deposit"),
    )
    val row2 = listOf(
        Triple("📊", "My holding details",    "hsbc://holdings"),
        Triple("💰", "Money safe",             "hsbc://money-safe"),
        Triple("↔️", "Local transfer/FPS",    "hsbc://transfer/fps"),
        Triple("📷", "Scan to pay",            "hsbc://scan-pay"),
        Triple("⊞",  "All product & services", "hsbc://all-services"),
    )

    LaunchedEffect(Unit) { TealiumClient.sliceImpression("COMBO_QUICK_ACCESS", "slice-combo-quick-access", 1) }

    var activeTab by remember { mutableStateOf("My pick") }

    Column(modifier = Modifier.fillMaxWidth().background(White)) {
        // Tab bar — pill/capsule style (active=red bg/white text, inactive=gray)
        Row(
            modifier = Modifier.fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            tabs.forEach { (label, _) ->
                val isActive = label == activeTab
                Text(
                    text = label,
                    fontSize = 13.sp,
                    fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal,
                    color = if (isActive) White else N700,
                    modifier = Modifier
                        .clip(RoundedCornerShape(18.dp))
                        .background(if (isActive) HsbcRed else Color(0xFFE4E4E4))
                        .clickable { activeTab = label }
                        .padding(horizontal = 16.dp, vertical = 7.dp)
                )
            }
        }
        // Row 1
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            row1.forEach { (icon, label, deepLink) ->
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier.weight(1f).clickable { TealiumClient.quickAccessTapped(label, deepLink) }
                ) {
                    Box(
                        modifier = Modifier.size(46.dp).clip(RoundedCornerShape(14.dp)).background(N100),
                        contentAlignment = Alignment.Center
                    ) { Text(icon, fontSize = 20.sp) }
                    Text(label, fontSize = 9.sp, color = N700, textAlign = TextAlign.Center, maxLines = 2, lineHeight = 12.sp)
                }
            }
        }
        // Row 2
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            row2.forEach { (icon, label, deepLink) ->
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier.weight(1f).clickable { TealiumClient.quickAccessTapped(label, deepLink) }
                ) {
                    Box(
                        modifier = Modifier.size(46.dp).clip(RoundedCornerShape(14.dp)).background(N100),
                        contentAlignment = Alignment.Center
                    ) { Text(icon, fontSize = 20.sp) }
                    Text(label, fontSize = 9.sp, color = N700, textAlign = TextAlign.Center, maxLines = 2, lineHeight = 12.sp)
                }
            }
        }
        Spacer(Modifier.height(4.dp))
    }
}

@Composable
private fun WHCardActivationBanner() {
    LaunchedEffect(Unit) { TealiumClient.sliceImpression("CARD_ACTIVATION_BANNER", "slice-card-activation", 2) }
    Row(
        modifier = Modifier.fillMaxWidth().background(White)
            .clickable {
                TealiumClient.sliceTapped(
                    "CARD_ACTIVATION_BANNER", "slice-card-activation",
                    "Your card needs to be activated", "hsbc://card/activate"
                )
            }
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("🔔", fontSize = 20.sp)
        Text(
            text = "Your card needs to be activated",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = N900,
            modifier = Modifier.weight(1f)
        )
        Text("›", fontSize = 18.sp, color = N400)
    }
}

@Composable
private fun WHQuestBanner() {
    LaunchedEffect(Unit) { TealiumClient.sliceImpression("QUEST_BANNER", "slice-getting-started", 3) }
    Row(
        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp).fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFFFFF8F8))
            .border(1.dp, Color(0xFFFFE4E6), RoundedCornerShape(14.dp))
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier.size(48.dp).clip(RoundedCornerShape(10.dp)).background(HsbcRed),
            contentAlignment = Alignment.Center
        ) { Text("⬡", fontSize = 22.sp, color = White) }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text("Getting started", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = N900)
            Text(
                text = "Open investment account and complete the following quests to enjoy reward!",
                fontSize = 11.sp,
                color = N500,
                lineHeight = 16.sp
            )
            Spacer(Modifier.height(4.dp))
            Button(
                onClick = {
                    TealiumClient.sliceTapped(
                        "QUEST_BANNER", "slice-getting-started",
                        "Check out all 4 quests", "hsbc://quests"
                    )
                },
                modifier = Modifier.height(32.dp),
                shape = RoundedCornerShape(14.dp),
                contentPadding = PaddingValues(horizontal = 14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
            ) { Text("Check out all 4 quests", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = White) }
        }
    }
}

@Composable
private fun WHFeatureProduct() {
    data class FundItem(
        val id: String, val name: String, val code: String,
        val returnValue: String, val returnPositive: Boolean,
        val tags: List<String>
    )

    val buttons = featureProductButtonsFrom(DEFAULT_FEATURE_PRODUCT_PROPS)
    val funds = listOf(
        FundItem(
            "fp-1",
            "AB SICAV I - LOW VOLATILITY EQUITY PORTFOLIO CLASS AD S...",
            "U43120", "+54.79%", true, emptyList()
        ),
        FundItem(
            "fp-2",
            "HANG SENG INDEX FUND CLASS A (HKD)",
            "U42272", "+18.10%", true, listOf("ESG")
        ),
        FundItem(
            "fp-3",
            "ALLIANZ INCOME AND GROWTH CLASS AM DIS (HKD MONTHLY...",
            "U40032", "+11.45%", true, listOf("New fund")
        ),
    )

    LaunchedEffect(Unit) { TealiumClient.sliceImpression("FEATURE_PRODUCT", "slice-feature-product", 4) }

    var activeButtonId by remember { mutableStateOf("top-performers") }

    Column(modifier = Modifier.fillMaxWidth().background(White).padding(vertical = 12.dp)) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            Arrangement.SpaceBetween,
            Alignment.CenterVertically
        ) {
            Text("Feature product", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = N900)
            Text(
                text = "More ›",
                fontSize = 12.sp,
                color = HsbcRed,
                modifier = Modifier.clickable {
                    TealiumClient.sliceTapped(
                        "FEATURE_PRODUCT", "slice-feature-product",
                        "View Best selling fund list (10)", "hsbc://funds/best-selling"
                    )
                }
            )
        }
        Spacer(Modifier.height(10.dp))
        Row(
            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())
                .padding(horizontal = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            buttons.forEach { button ->
                val isActive = button.id == activeButtonId
                Box(
                    modifier = Modifier.clip(RoundedCornerShape(16.dp))
                        .background(if (isActive) White else Color.Transparent)
                        .border(1.dp, if (isActive) N100 else Color.Transparent, RoundedCornerShape(16.dp))
                        .clickable {
                            activeButtonId = button.id
                            TealiumClient.sliceTapped(
                                "FEATURE_PRODUCT", "slice-feature-product",
                                button.name, button.url
                            )
                        }
                        .padding(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = button.name,
                        fontSize = 12.sp,
                        color = if (isActive) N900 else N400,
                        fontWeight = if (isActive) FontWeight.SemiBold else FontWeight.Normal
                    )
                }
            }
        }
        Spacer(Modifier.height(8.dp))
        funds.forEachIndexed { idx, fund ->
            Row(
                modifier = Modifier.fillMaxWidth()
                    .clickable { TealiumClient.homeProductTapped(fund.name, fund.id) }
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = fund.name,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = N900,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(fund.code, fontSize = 10.sp, color = N500)
                        fund.tags.forEach { tag ->
                            Box(
                                modifier = Modifier.clip(RoundedCornerShape(6.dp))
                                    .background(Color(0xFFEFF6FF))
                                    .padding(horizontal = 6.dp, vertical = 1.dp)
                            ) { Text(tag, fontSize = 9.sp, color = Color(0xFF3B82F6)) }
                        }
                    }
                }
                Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        text = fund.returnValue,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = if (fund.returnPositive) Color(0xFF16A34A) else HsbcRed
                    )
                    Text("1Y return", fontSize = 9.sp, color = N400)
                }
            }
            if (idx < funds.size - 1) Divider(color = N100, modifier = Modifier.padding(horizontal = 16.dp))
        }
        Spacer(Modifier.height(4.dp))
        Text(
            text = "View Best selling fund list (10)",
            fontSize = 11.sp,
            color = HsbcRed,
            textAlign = TextAlign.Center,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp).clickable {
                TealiumClient.sliceTapped(
                    "FEATURE_PRODUCT", "slice-feature-product",
                    "View Best selling fund list (10)", "/api/v1/funds/feature-products?filter=best-selling&limit=10"
                )
            }
        )
    }
}

@Composable
private fun WHWealthStudioCarousel() {
    data class StudioItem(
        val id: String, val episodeLabel: String, val liveBadge: String,
        val title: String, val ctaLabel: String, val imgColor: Color
    )

    val items = listOf(
        StudioItem(
            "ws-1", "Episode 13",
            "To-be-live on 1 Feb 15:30",
            "How AI experts think about AI?",
            "Register for live stream",
            Color(0xFF1A1A2E)
        ),
        StudioItem(
            "ws-2", "Episode 13",
            "To-be-live on 1 Feb 15:3",
            "How AI experts think about AI?",
            "Watch now",
            Color(0xFF0F2040)
        ),
    )

    LaunchedEffect(Unit) { TealiumClient.sliceImpression("WEALTH_STUDIO_CAROUSEL", "slice-wealth-studio", 5) }

    Column(modifier = Modifier.fillMaxWidth().background(White).padding(vertical = 12.dp)) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            Arrangement.SpaceBetween,
            Alignment.CenterVertically
        ) {
            Text("Premier Elite Wealth Studio", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = N900)
            Text(
                text = "View all ›",
                fontSize = 12.sp,
                color = HsbcRed,
                modifier = Modifier.clickable {
                    TealiumClient.sliceTapped(
                        "WEALTH_STUDIO_CAROUSEL", "slice-wealth-studio",
                        "View all", "hsbc://wealth-studio"
                    )
                }
            )
        }
        Spacer(Modifier.height(10.dp))
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(items) { item ->
                Column(
                    modifier = Modifier.width(240.dp).height(160.dp).clip(RoundedCornerShape(14.dp))
                        .background(item.imgColor)
                        .clickable { TealiumClient.wealthStudioTapped(item.title, item.id) },
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(
                        modifier = Modifier.weight(1f).padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Box(
                            modifier = Modifier.clip(RoundedCornerShape(6.dp))
                                .background(Color(0x33FFFFFF))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) { Text(item.liveBadge, fontSize = 9.sp, color = White, maxLines = 1, overflow = TextOverflow.Ellipsis) }
                        Text(item.episodeLabel, fontSize = 10.sp, color = Color(0xAAFFFFFF))
                        Text(
                            text = item.title,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = White,
                            maxLines = 3,
                            lineHeight = 18.sp
                        )
                    }
                    Box(
                        modifier = Modifier.fillMaxWidth()
                            .background(Color(0x22000000))
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Box(
                            modifier = Modifier.clip(RoundedCornerShape(20.dp))
                                .background(HsbcRed).padding(horizontal = 14.dp, vertical = 6.dp)
                        ) { Text(item.ctaLabel, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = White) }
                    }
                }
            }
        }
    }
}

@Composable
private fun WHGuidesInsights() {
    data class GuideItem(
        val id: String, val title: String, val date: String, val imgColor: Color, val deepLink: String
    )

    val items = listOf(
        GuideItem(
            "gi-1",
            "Investment 101 - An investment in knowledge pays the best interest - Benjamin Franklin",
            "8 Apr 2024", Color(0xFF2D3748), "hsbc://guides/investment-101"
        ),
        GuideItem(
            "gi-2",
            "Market outlook Q2 2024",
            "2 Apr 2024", Color(0xFF1A365D), "hsbc://guides/market-outlook"
        ),
    )

    LaunchedEffect(Unit) { TealiumClient.sliceImpression("GUIDES_INSIGHTS_CAROUSEL", "slice-guides-insights", 6) }

    Column(modifier = Modifier.fillMaxWidth().background(White).padding(vertical = 12.dp)) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            Arrangement.SpaceBetween,
            Alignment.CenterVertically
        ) {
            Text("Guides and insights", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = N900)
            Text(
                text = "View all ›",
                fontSize = 12.sp,
                color = HsbcRed,
                modifier = Modifier.clickable {
                    TealiumClient.sliceTapped(
                        "GUIDES_INSIGHTS_CAROUSEL", "slice-guides-insights",
                        "View all", "hsbc://guides"
                    )
                }
            )
        }
        Spacer(Modifier.height(10.dp))
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(items) { item ->
                Column(
                    modifier = Modifier.width(200.dp).height(180.dp).clip(RoundedCornerShape(12.dp))
                        .background(N50)
                        .clickable { TealiumClient.guidesTapped(item.title, item.id) }
                ) {
                    Box(
                        modifier = Modifier.fillMaxWidth().height(110.dp).background(item.imgColor),
                        contentAlignment = Alignment.Center
                    ) { Text("📰", fontSize = 28.sp) }
                    Column(
                        modifier = Modifier.padding(10.dp).weight(1f),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = item.title,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = N900,
                            maxLines = 3,
                            overflow = TextOverflow.Ellipsis,
                            lineHeight = 16.sp
                        )
                        Text(item.date, fontSize = 10.sp, color = N400)
                    }
                }
            }
        }
    }
}

@Composable
private fun WHFXWatchlist() {
    data class FxPair(
        val id: String, val pair: String,
        val sellLabel: String, val sellRate: String,
        val buyLabel: String, val buyRate: String
    )

    val pairs = listOf(
        FxPair("fx-1", "USD/JPY", "Sell USD", "148.44", "Buy USD", "148.12"),
        FxPair("fx-2", "HKD/CHF", "Sell HKD", "0.1042", "Buy HKD", "0.1038"),
        FxPair("fx-3", "HKD/THB", "Sell HKD", "4.1055", "Buy HKD", "4.1132"),
    )

    LaunchedEffect(Unit) { TealiumClient.sliceImpression("FX_WATCHLIST", "slice-fx-watchlist", 7) }

    Column(modifier = Modifier.fillMaxWidth().background(White).padding(vertical = 12.dp)) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            Arrangement.SpaceBetween,
            Alignment.CenterVertically
        ) {
            Text("FX watchlist", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = N900)
            Text(
                text = "View more in FX ›",
                fontSize = 12.sp,
                color = HsbcRed,
                modifier = Modifier.clickable {
                    TealiumClient.sliceTapped(
                        "FX_WATCHLIST", "slice-fx-watchlist",
                        "View more in FX", "hsbc://fx/watchlist"
                    )
                }
            )
        }
        Spacer(Modifier.height(8.dp))
        Row(
            modifier = Modifier.padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier.clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFFFFFBEB))
                    .border(1.dp, Color(0xFFFDE68A), RoundedCornerShape(8.dp))
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) { Text("🏅 Gold Forex Club tier", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF92400E)) }
        }
        Spacer(Modifier.height(4.dp))
        Text(
            text = "15% Spread discount has been applied to your rate.",
            fontSize = 10.sp,
            color = N500,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
        Spacer(Modifier.height(8.dp))
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text("Pair", fontSize = 10.sp, color = N400, modifier = Modifier.weight(1f))
            Text("Sell", fontSize = 10.sp, color = N400, modifier = Modifier.width(80.dp), textAlign = TextAlign.End)
            Text("Buy",  fontSize = 10.sp, color = N400, modifier = Modifier.width(80.dp), textAlign = TextAlign.End)
        }
        Divider(color = N100, modifier = Modifier.padding(horizontal = 16.dp))
        pairs.forEachIndexed { idx, pair ->
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(pair.pair, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = N900, modifier = Modifier.weight(1f))
                Column(
                    modifier = Modifier.width(80.dp),
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Text(pair.sellLabel, fontSize = 9.sp, color = N400)
                    Text(pair.sellRate, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = N900)
                }
                Column(
                    modifier = Modifier.width(80.dp),
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Text(pair.buyLabel, fontSize = 9.sp, color = N400)
                    Text(pair.buyRate, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = N900)
                }
            }
            if (idx < pairs.size - 1) Divider(color = N100, modifier = Modifier.padding(horizontal = 16.dp))
        }
    }
}

@Composable
private fun WHDiscoverMore() {
    data class DiscoverItem(
        val id: String, val tag: String, val tagColor: Color,
        val title: String, val subtitle: String, val imgColor: Color, val deepLink: String
    )

    val items = listOf(
        DiscoverItem(
            "dm-1", "Time Deposit", HsbcRed,
            "Up to 15.5% p.a. FX Deposit Rate",
            "Earn up to 15.5% p.a. on FX & Time Deposits! T&Cs apply.",
            Color(0xFF1A2E4A), "hsbc://deposit/fx"
        ),
        DiscoverItem(
            "dm-2", "Well+", Color(0xFF6B46C1),
            "PURE Sign up 10-day...",
            "",
            Color(0xFF2D3748), "hsbc://wellplus"
        ),
    )

    LaunchedEffect(Unit) { TealiumClient.sliceImpression("DISCOVER_MORE_CAROUSEL", "slice-discover-more", 8) }

    Column(modifier = Modifier.fillMaxWidth().background(N50).padding(vertical = 12.dp)) {
        Text(
            text = "Discover more",
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            color = N900,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
        Spacer(Modifier.height(10.dp))
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(items) { item ->
                Column(
                    modifier = Modifier.width(200.dp).height(178.dp).clip(RoundedCornerShape(14.dp))
                        .background(White)
                        .clickable { TealiumClient.discoverMoreTapped(item.title, item.tag) }
                ) {
                    Box(
                        modifier = Modifier.fillMaxWidth().height(110.dp).background(item.imgColor),
                        contentAlignment = Alignment.TopStart
                    ) {
                        Box(
                            modifier = Modifier.padding(10.dp).clip(RoundedCornerShape(8.dp))
                                .background(item.tagColor)
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) { Text(item.tag, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = White) }
                    }
                    Column(
                        modifier = Modifier.padding(10.dp).weight(1f),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = item.title,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = N900,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (item.subtitle.isNotEmpty()) {
                            Text(
                                text = item.subtitle,
                                fontSize = 10.sp,
                                color = N500,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }
    }
}
