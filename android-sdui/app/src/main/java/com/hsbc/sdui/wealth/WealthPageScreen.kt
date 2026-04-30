package com.hsbc.sdui.wealth

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hsbc.sdui.analytics.TealiumClient
import kotlinx.coroutines.launch


// ─── Load state ───────────────────────────────────────────────────────────────

private sealed class WealthLoadState {
    object Loading : WealthLoadState()
    data class Done(val slices: List<WealthSlice>) : WealthLoadState()
    object Fallback : WealthLoadState()   // BFF not live — use static data
}

// ─── Root entry point ─────────────────────────────────────────────────────────

@Composable
fun WealthPageScreen() {
    var adDismissed by remember { mutableStateOf(false) }
    var searchOpen  by remember { mutableStateOf(false) }
    var loadState   by remember { mutableStateOf<WealthLoadState>(WealthLoadState.Loading) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        TealiumClient.wealthHubViewed()
        scope.launch {
            loadState = try {
                val payload = WealthNetworkService.api.fetchWealthScreen()
                val visible = payload.layout.children.filter { it.visible }
                if (visible.isEmpty()) WealthLoadState.Fallback
                else WealthLoadState.Done(visible)
            } catch (_: Exception) {
                WealthLoadState.Fallback
            }
        }
    }

    if (searchOpen) {
        AISearchScreen(onDismiss = { searchOpen = false })
        return
    }

    LazyColumn(modifier = Modifier.fillMaxSize().background(N50)) {
        when (val state = loadState) {
            is WealthLoadState.Loading -> {
                item { WHHeaderNav(onSearchTap = { searchOpen = true }) }
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth().height(80.dp),
                        contentAlignment = Alignment.Center
                    ) { Text("載入中…", fontSize = 13.sp, color = N400) }
                }
            }

            is WealthLoadState.Done -> {
                // ── SDUI path: render slices from approved BFF page ────────
                state.slices.forEach { slice ->
                    item(key = slice.instanceId) {
                        SDUISliceView(
                            slice = slice,
                            adDismissed = adDismissed,
                            onAdDismiss = { adDismissed = true },
                            onSearchTap = { searchOpen = true },
                        )
                    }
                }
            }

            is WealthLoadState.Fallback -> {
                // ── Static fallback: no LIVE page published yet ────────────
                item { WHHeaderNav(onSearchTap = { searchOpen = true }) }
                item { WHQuickAccess() }
                item { WHPromoBanner() }
                item { WHFunctionGrid() }
                item { WHAIAssistant() }
                item {
                    AnimatedVisibility(!adDismissed, exit = shrinkVertically() + fadeOut()) {
                        WHAdBanner(onDismiss = { adDismissed = true })
                    }
                }
                item { WHFlashLoan() }
                item { WHWealthSelection() }
                item { WHFeaturedRankings() }
                item { WHLifeDeals() }
            }
        }
        item { Spacer(Modifier.height(40.dp)) }
    }
}

// ─── SDUI slice dispatcher ────────────────────────────────────────────────────

@Suppress("UNCHECKED_CAST")
@Composable
private fun SDUISliceView(
    slice: WealthSlice,
    adDismissed: Boolean,
    onAdDismiss: () -> Unit,
    onSearchTap: () -> Unit,
) {
    val p = slice.props
    when (slice.type) {
        "HEADER_NAV"       -> SDUIHeaderNav(props = p, onSearchTap = onSearchTap)
        "QUICK_ACCESS"     -> SDUIQuickAccess(props = p)
        "PROMO_BANNER"     -> SDUIPromoBanner(props = p)
        "FUNCTION_GRID"    -> SDUIFunctionGrid(props = p)
        "AI_ASSISTANT"     -> SDUIAIAssistant(props = p)
        "AD_BANNER"        -> if (!adDismissed) SDUIAdBanner(props = p, onDismiss = onAdDismiss)
        "FLASH_LOAN"       -> SDUIFlashLoan(props = p)
        "WEALTH_SELECTION" -> SDUIWealthSelection(props = p)
        "FEATURED_RANKINGS"-> SDUIFeaturedRankings(props = p)
        "LIFE_DEALS"       -> SDUILifeDeals(props = p)
        "SPACER"           -> Spacer(Modifier.height(((p["height"] as? Double)?.toInt() ?: 16).dp))
        // unknown types silently skipped
    }
}

// ─── SDUI slice composables (BFF-driven) ──────────────────────────────────────

@Suppress("UNCHECKED_CAST")
@Composable
private fun SDUIHeaderNav(props: Map<String, Any?>, onSearchTap: () -> Unit) {
    val placeholder = props["searchPlaceholder"] as? String ?: "搜尋功能、產品"
    val showBell    = props["showNotificationBell"] as? Boolean ?: true
    val showQR      = props["showQRScanner"] as? Boolean ?: true

    Column {
        Row(
            modifier = Modifier.fillMaxWidth().background(White)
                .padding(horizontal = 14.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.weight(1f).clip(RoundedCornerShape(18.dp))
                    .background(N100).clickable {
                        TealiumClient.track("hsbc_mobile_android", "search_tap", "Wealth",
                            "search_tapped", screen = "wealth_hub_hk", journey = "wealth_hub")
                        onSearchTap()
                    }.padding(horizontal = 14.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("🔍", fontSize = 13.sp)
                Spacer(Modifier.width(6.dp))
                Text(placeholder, fontSize = 13.sp, color = N400)
            }
            if (showBell) Text("🔔", fontSize = 20.sp, modifier = Modifier.clickable {
                TealiumClient.track("hsbc_mobile_android", "notification_tap", "Wealth",
                    "notification_tapped", screen = "wealth_hub_hk", journey = "wealth_hub")
            })
            if (showQR) Text("⬛", fontSize = 18.sp, modifier = Modifier.clickable {
                TealiumClient.track("hsbc_mobile_android", "qr_tap", "Wealth",
                    "qr_scanner_tapped", screen = "wealth_hub_hk", journey = "wealth_hub")
            })
        }
        Divider(color = Color(0xFFE5E5E5))
    }
}

@Suppress("UNCHECKED_CAST")
@Composable
private fun SDUIQuickAccess(props: Map<String, Any?>) {
    val items = (props["items"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()
    Row(
        modifier = Modifier.fillMaxWidth().background(White)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        items.forEach { item ->
            val icon     = item["icon"] as? String ?: ""
            val label    = item["label"] as? String ?: ""
            val deepLink = item["deepLink"] as? String ?: ""
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(5.dp),
                modifier = Modifier.weight(1f).clickable {
                    TealiumClient.quickAccessTapped(label, deepLink)
                }
            ) {
                Box(
                    modifier = Modifier.size(48.dp).clip(RoundedCornerShape(14.dp))
                        .background(Brush.linearGradient(listOf(Color(0xFFF0F9FF), Color(0xFFE0F2FE)))),
                    contentAlignment = Alignment.Center
                ) { Text(icon, fontSize = 22.sp) }
                Text(label, fontSize = 10.sp, color = N700, textAlign = TextAlign.Center)
            }
        }
    }
}

@Suppress("UNCHECKED_CAST")
@Composable
private fun SDUIPromoBanner(props: Map<String, Any?>) {
    val title      = props["title"] as? String ?: ""
    val subtitle   = props["subtitle"] as? String ?: ""
    val ctaLabel   = props["ctaLabel"] as? String ?: ""
    val ctaLink    = props["ctaDeepLink"] as? String ?: ""
    val badgeText  = props["badgeText"] as? String ?: ""
    val bgHex      = props["backgroundColor"] as? String ?: "#E8F4FD"
    val bgColor    = try { Color(android.graphics.Color.parseColor(bgHex)) } catch (_: Exception) { Color(0xFFE8F4FD) }

    Row(
        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp).fillMaxWidth()
            .clip(RoundedCornerShape(14.dp)).background(bgColor)
            .padding(horizontal = 12.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            if (badgeText.isNotEmpty()) {
                Box(
                    modifier = Modifier.clip(RoundedCornerShape(10.dp)).background(Color(0xFFFFEDED))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) { Text(badgeText, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = HsbcRed) }
            }
            Text(title, fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = N900)
            Text(subtitle, fontSize = 10.sp, color = N500)
            Button(
                onClick = { TealiumClient.promoBannerTapped(title, "sdui-promo", ctaLink) },
                modifier = Modifier.padding(top = 8.dp).height(32.dp),
                shape = RoundedCornerShape(14.dp),
                contentPadding = PaddingValues(horizontal = 16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
            ) { Text(ctaLabel, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = White) }
        }
        Box(
            modifier = Modifier.size(80.dp).clip(RoundedCornerShape(12.dp))
                .background(Color(0x14000000)),
            contentAlignment = Alignment.Center
        ) { Text("🎯", fontSize = 32.sp) }
    }
}

@Suppress("UNCHECKED_CAST")
@Composable
private fun SDUIFunctionGrid(props: Map<String, Any?>) {
    val rows = (props["rows"] as? List<*>)
        ?.filterIsInstance<List<*>>()
        ?.map { row -> row.filterIsInstance<Map<String, Any?>>() }
        ?: emptyList()

    Column(
        modifier = Modifier.fillMaxWidth().background(White)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        rows.forEach { row ->
            Row(modifier = Modifier.fillMaxWidth()) {
                row.forEach { item ->
                    val icon     = item["icon"] as? String ?: ""
                    val label    = item["label"] as? String ?: ""
                    val deepLink = item["deepLink"] as? String ?: ""
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.weight(1f).clickable {
                            TealiumClient.track(event = "function_tap", category = "Wealth",
                                action = "function_tapped", label = label,
                                screen = "wealth_hub_hk", journey = "wealth_hub",
                                custom = mapOf("function_label" to label, "deep_link" to deepLink))
                        }
                    ) {
                        Box(
                            modifier = Modifier.size(44.dp).clip(RoundedCornerShape(12.dp)).background(N100),
                            contentAlignment = Alignment.Center
                        ) { Text(icon, fontSize = 20.sp) }
                        Text(label, fontSize = 10.sp, color = N700,
                            textAlign = TextAlign.Center, lineHeight = 14.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun SDUIAIAssistant(props: Map<String, Any?>) {
    val greeting = props["greeting"] as? String ?: "Hi，我是你的智能財富助理"
    Row(
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp).fillMaxWidth()
            .clip(RoundedCornerShape(10.dp)).background(N50)
            .clickable { TealiumClient.aiAssistantTapped() }
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text("✉️", fontSize = 20.sp)
        Spacer(Modifier.width(8.dp))
        Text(greeting, fontSize = 11.sp, color = N500, modifier = Modifier.weight(1f))
        Text("›", fontSize = 14.sp, color = N400)
    }
}

@Composable
private fun SDUIAdBanner(props: Map<String, Any?>, onDismiss: () -> Unit) {
    val title    = props["title"] as? String ?: ""
    val subtitle = props["subtitle"] as? String ?: ""
    val ctaLabel = props["ctaLabel"] as? String ?: ""
    val ctaLink  = props["ctaDeepLink"] as? String ?: ""

    Box(modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp))
                .background(Brush.linearGradient(listOf(Color(0xFFFFFBEB), Color(0xFFFEF3C7))))
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF92400E))
                Text(subtitle, fontSize = 10.sp, color = Color(0xFF78716C))
                Button(
                    onClick = { TealiumClient.sliceTapped("AD_BANNER", "sdui-ad", ctaLabel, ctaLink) },
                    modifier = Modifier.padding(top = 8.dp).height(30.dp),
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
                ) { Text(ctaLabel, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = White) }
            }
            Box(Modifier.size(72.dp).clip(RoundedCornerShape(10.dp)).background(Color(0x14000000)),
                contentAlignment = Alignment.Center) { Text("🌱", fontSize = 28.sp) }
        }
        IconButton(
            onClick = { TealiumClient.adBannerDismissed(title); onDismiss() },
            modifier = Modifier.align(Alignment.TopEnd).size(32.dp)
        ) { Text("✕", fontSize = 13.sp, color = N400) }
    }
}

@Composable
private fun SDUIFlashLoan(props: Map<String, Any?>) {
    val productName = props["productName"] as? String ?: "閃電貸 極速放款"
    val tagline     = props["tagline"] as? String ?: "最高可借額度"
    val currency    = props["currency"] as? String ?: "HKD"
    val maxAmount   = (props["maxAmount"] as? Double)?.toLong() ?: 300000L
    val ctaLabel    = props["ctaLabel"] as? String ?: "獲取額度"
    val ctaLink     = props["ctaDeepLink"] as? String ?: "hsbc://loan/flash"

    Row(
        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp).fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Brush.linearGradient(listOf(Color(0xFFFFF5F5), Color(0xFFFFE4E4))))
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text("⚡ $productName", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = HsbcRed)
            Text(tagline, fontSize = 10.sp, color = N500)
            Text("$currency ${"%,d".format(maxAmount)}.00", fontSize = 22.sp,
                fontWeight = FontWeight.ExtraBold, color = N900)
        }
        Button(
            onClick = { TealiumClient.sliceTapped("FLASH_LOAN", "sdui-flash-loan", ctaLabel, ctaLink) },
            modifier = Modifier.height(44.dp),
            shape = RoundedCornerShape(20.dp),
            contentPadding = PaddingValues(horizontal = 18.dp),
            colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
        ) { Text(ctaLabel, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = White) }
    }
}

@Suppress("UNCHECKED_CAST")
@Composable
private fun SDUIWealthSelection(props: Map<String, Any?>) {
    val sectionTitle = props["sectionTitle"] as? String ?: "財富精選"
    val products     = (props["products"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()

    Column(
        modifier = Modifier.fillMaxWidth().background(White)
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
            Text(sectionTitle, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text("更多 ›", fontSize = 12.sp, color = HsbcRed)
        }
        Spacer(Modifier.height(10.dp))
        products.forEachIndexed { i, p ->
            val name        = p["productName"] as? String ?: ""
            val id          = p["id"] as? String ?: ""
            val yield7Day   = p["yield7Day"] as? String ?: ""
            val riskLevel   = p["riskLevel"] as? String ?: ""
            val redemption  = p["redemption"] as? String ?: ""
            val ctaLabel    = p["ctaLabel"] as? String ?: "查看"
            val highlighted = p["highlighted"] as? Boolean ?: false

            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp)
                    .clickable { TealiumClient.wealthProductTapped(name, id) },
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(name, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = N900)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        RiskTag(riskLevel); RiskTag(redemption)
                    }
                }
                Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(yield7Day, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = HsbcRed)
                    Text("7日年化", fontSize = 9.sp, color = N400)
                    if (highlighted) {
                        Button(
                            onClick = { TealiumClient.wealthProductTapped(name, id) },
                            modifier = Modifier.padding(top = 4.dp).height(28.dp),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
                        ) { Text(ctaLabel, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = White) }
                    }
                }
            }
            if (i < products.size - 1) Divider(color = N100)
        }
        Spacer(Modifier.height(10.dp))
        Text("💬 理財產品這么多，哪款適合我？",
            fontSize = 11.sp, color = N500,
            modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
    }
}

@Suppress("UNCHECKED_CAST")
@Composable
private fun SDUIFeaturedRankings(props: Map<String, Any?>) {
    val sectionTitle = props["sectionTitle"] as? String ?: "特色榜單"
    val items        = (props["items"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()

    Column(
        modifier = Modifier.fillMaxWidth().background(White)
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
            Text(sectionTitle, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text("更多 ›", fontSize = 12.sp, color = HsbcRed)
        }
        Spacer(Modifier.height(10.dp))
        items.forEach { item ->
            val icon  = item["icon"] as? String ?: ""
            val badge = item["badge"] as? String ?: ""
            val title = item["title"] as? String ?: ""
            val desc  = item["description"] as? String ?: ""

            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
                    .clickable { TealiumClient.rankingsTapped(title, badge) },
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(icon, fontSize = 24.sp)
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Box(
                        modifier = Modifier.clip(RoundedCornerShape(10.dp))
                            .background(Color(0xFFFEF2F2)).padding(horizontal = 8.dp, vertical = 2.dp)
                    ) { Text(badge, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = HsbcRed) }
                    Text(title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = N900)
                    Text(desc, fontSize = 10.sp, color = N500)
                }
                Text("›", fontSize = 16.sp, color = N400)
            }
            Divider(color = Color(0xFFF9FAFB))
        }
    }
}

@Suppress("UNCHECKED_CAST")
@Composable
private fun SDUILifeDeals(props: Map<String, Any?>) {
    val sectionTitle = props["sectionTitle"] as? String ?: "生活特惠"
    val deals        = (props["deals"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()
    val bottomLinks  = (props["bottomLinks"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()

    Column(
        modifier = Modifier.fillMaxWidth().background(White)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
            Text(sectionTitle, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text("更多 ›", fontSize = 12.sp, color = HsbcRed)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            deals.forEach { d ->
                val brand    = d["brandName"] as? String ?: ""
                val tag      = d["tag"] as? String ?: ""
                Column(
                    modifier = Modifier.weight(1f).clip(RoundedCornerShape(12.dp))
                        .background(N50).clickable { TealiumClient.lifeDealTapped(brand, tag) }
                ) {
                    Box(
                        modifier = Modifier.fillMaxWidth().height(64.dp).background(N100),
                        contentAlignment = Alignment.Center
                    ) { Text("🏷", fontSize = 24.sp) }
                    Box(
                        modifier = Modifier.fillMaxWidth().background(HsbcRed).padding(vertical = 4.dp),
                        contentAlignment = Alignment.Center
                    ) { Text(tag, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = White) }
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            bottomLinks.forEach { link ->
                val icon     = link["icon"] as? String ?: ""
                val label    = link["label"] as? String ?: ""
                val deepLink = link["deepLink"] as? String ?: ""
                Row(
                    modifier = Modifier.weight(1f).clip(RoundedCornerShape(12.dp)).background(N50)
                        .clickable {
                            TealiumClient.track(event = "bottom_link_tap", category = "Wealth",
                                action = "bottom_link_tapped", label = label,
                                screen = "wealth_hub_hk", journey = "wealth_hub",
                                custom = mapOf("deep_link" to deepLink))
                        }.padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(icon, fontSize = 24.sp)
                    Text(label, fontSize = 10.sp, color = N700, lineHeight = 14.sp)
                }
            }
        }
    }
}

// ─── Static fallback composables ──────────────────────────────────────────────

@Composable
private fun WHHeaderNav(onSearchTap: () -> Unit = {}) {
    LaunchedEffect(Unit) { TealiumClient.sliceImpression("HEADER_NAV", "slice-header", 0) }
    Column {
        Row(
            modifier = Modifier.fillMaxWidth().background(White)
                .padding(horizontal = 14.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.weight(1f).clip(RoundedCornerShape(18.dp))
                    .background(N100).clickable {
                        TealiumClient.track("hsbc_mobile_android", "search_tap", "Wealth",
                            "search_tapped", screen = "wealth_hub_hk", journey = "wealth_hub")
                        onSearchTap()
                    }.padding(horizontal = 14.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("🔍", fontSize = 13.sp)
                Spacer(Modifier.width(6.dp))
                Text("搜尋功能、產品", fontSize = 13.sp, color = N400)
            }
            Text("🔔", fontSize = 20.sp, modifier = Modifier.clickable {
                TealiumClient.track("hsbc_mobile_android", "notification_tap", "Wealth",
                    "notification_tapped", screen = "wealth_hub_hk", journey = "wealth_hub")
            })
            Text("⬛", fontSize = 18.sp, modifier = Modifier.clickable {
                TealiumClient.track("hsbc_mobile_android", "qr_tap", "Wealth",
                    "qr_scanner_tapped", screen = "wealth_hub_hk", journey = "wealth_hub")
            })
        }
        Divider(color = Color(0xFFE5E5E5))
    }
}

@Composable
private fun WHQuickAccess() {
    val items = listOf(
        Triple("🌙", "朝朝寶",   "hsbc://wealth/morning-treasure"),
        Triple("💵", "借錢",     "hsbc://loan/apply"),
        Triple("↔️", "轉帳",     "hsbc://transfer"),
        Triple("📊", "帳戶總覽", "hsbc://accounts"),
    )
    LaunchedEffect(Unit) { TealiumClient.sliceImpression("QUICK_ACCESS", "slice-quick", 1) }
    Row(
        modifier = Modifier.fillMaxWidth().background(White)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        items.forEach { (icon, label, deepLink) ->
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(5.dp),
                modifier = Modifier.weight(1f).clickable { TealiumClient.quickAccessTapped(label, deepLink) }
            ) {
                Box(
                    modifier = Modifier.size(48.dp).clip(RoundedCornerShape(14.dp))
                        .background(Brush.linearGradient(listOf(Color(0xFFF0F9FF), Color(0xFFE0F2FE)))),
                    contentAlignment = Alignment.Center
                ) { Text(icon, fontSize = 22.sp) }
                Text(label, fontSize = 10.sp, color = N700, textAlign = TextAlign.Center)
            }
        }
    }
}

@Composable
private fun WHPromoBanner() {
    LaunchedEffect(Unit) {
        TealiumClient.promoBannerImpression("10分招財日", "slice-promo-10", "promo-10-finance-day")
    }
    Row(
        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp).fillMaxWidth()
            .clip(RoundedCornerShape(14.dp)).background(Color(0xFFE8F4FD))
            .padding(horizontal = 12.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Box(
                modifier = Modifier.clip(RoundedCornerShape(10.dp)).background(Color(0xFFFFEDED))
                    .padding(horizontal = 8.dp, vertical = 2.dp)
            ) { Text("每月10日開啓", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = HsbcRed) }
            Text("10分招財日", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = N900)
            Text("查帳單·學投資·優配置", fontSize = 10.sp, color = N500)
            Button(
                onClick = { TealiumClient.promoBannerTapped("10分招財日", "slice-promo-10", "promo-10-finance-day") },
                modifier = Modifier.padding(top = 8.dp).height(32.dp),
                shape = RoundedCornerShape(14.dp),
                contentPadding = PaddingValues(horizontal = 16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
            ) { Text("點擊參與", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = White) }
        }
        Box(
            modifier = Modifier.size(80.dp).clip(RoundedCornerShape(12.dp))
                .background(Color(0x14000000)),
            contentAlignment = Alignment.Center
        ) { Text("🎯", fontSize = 32.sp) }
    }
}

@Composable
private fun WHFunctionGrid() {
    val rows = listOf(
        listOf(Triple("💳","信用卡","hsbc://cards"), Triple("📄","收支明細","hsbc://statements"),
               Triple("🔄","他行卡轉入","hsbc://transfer/external"),
               Triple("🏙️","城市服務","hsbc://city-services"), Triple("🔥","熱門活動","hsbc://events")),
        listOf(Triple("📈","理財","hsbc://wealth"), Triple("Ⓜ️","M+會員","hsbc://membership"),
               Triple("🎬","影票","hsbc://movies"), Triple("💹","基金","hsbc://funds"),
               Triple("⋯","全部","hsbc://all-services"))
    )
    LaunchedEffect(Unit) { TealiumClient.sliceImpression("FUNCTION_GRID", "slice-func-grid", 3) }
    Column(
        modifier = Modifier.fillMaxWidth().background(White)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        rows.forEach { row ->
            Row(modifier = Modifier.fillMaxWidth()) {
                row.forEach { (icon, label, deepLink) ->
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.weight(1f).clickable {
                            TealiumClient.track(event = "function_tap", category = "Wealth",
                                action = "function_tapped", label = label,
                                screen = "wealth_hub_hk", journey = "wealth_hub",
                                custom = mapOf("function_label" to label, "deep_link" to deepLink))
                        }
                    ) {
                        Box(
                            modifier = Modifier.size(44.dp).clip(RoundedCornerShape(12.dp)).background(N100),
                            contentAlignment = Alignment.Center
                        ) { Text(icon, fontSize = 20.sp) }
                        Text(label, fontSize = 10.sp, color = N700,
                            textAlign = TextAlign.Center, lineHeight = 14.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun WHAIAssistant() {
    LaunchedEffect(Unit) { TealiumClient.sliceImpression("AI_ASSISTANT", "slice-ai", 4) }
    Row(
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp).fillMaxWidth()
            .clip(RoundedCornerShape(10.dp)).background(N50)
            .clickable { TealiumClient.aiAssistantTapped() }
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text("✉️", fontSize = 20.sp)
        Spacer(Modifier.width(8.dp))
        Text("Hi，我是你的智能財富助理", fontSize = 11.sp, color = N500, modifier = Modifier.weight(1f))
        Text("›", fontSize = 14.sp, color = N400)
    }
}

@Composable
private fun WHAdBanner(onDismiss: () -> Unit) {
    LaunchedEffect(Unit) { TealiumClient.sliceImpression("AD_BANNER", "slice-ad-spring", 5) }
    Box(modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp))
                .background(Brush.linearGradient(listOf(Color(0xFFFFFBEB), Color(0xFFFEF3C7))))
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("春季播種黃金期", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF92400E))
                Text("配置正當時，播下「金種子」", fontSize = 10.sp, color = Color(0xFF78716C))
                Button(
                    onClick = { TealiumClient.sliceTapped("AD_BANNER", "slice-ad-spring", "抽體驗禮", "hsbc://campaign/spring-investment") },
                    modifier = Modifier.padding(top = 8.dp).height(30.dp),
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
                ) { Text("抽體驗禮", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = White) }
            }
            Box(Modifier.size(72.dp).clip(RoundedCornerShape(10.dp)).background(Color(0x14000000)),
                contentAlignment = Alignment.Center) { Text("🌱", fontSize = 28.sp) }
        }
        IconButton(
            onClick = { TealiumClient.adBannerDismissed("春季播種黃金期"); onDismiss() },
            modifier = Modifier.align(Alignment.TopEnd).size(32.dp)
        ) { Text("✕", fontSize = 13.sp, color = N400) }
    }
}

@Composable
private fun WHFlashLoan() {
    LaunchedEffect(Unit) { TealiumClient.sliceImpression("FLASH_LOAN", "slice-flash-loan", 6) }
    Row(
        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp).fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Brush.linearGradient(listOf(Color(0xFFFFF5F5), Color(0xFFFFE4E4))))
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text("⚡ 閃電貸 極速放款", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = HsbcRed)
            Text("最高可借額度", fontSize = 10.sp, color = N500)
            Text("HKD 300,000.00", fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = N900)
        }
        Button(
            onClick = { TealiumClient.sliceTapped("FLASH_LOAN", "slice-flash-loan", "獲取額度", "hsbc://loan/flash") },
            modifier = Modifier.height(44.dp),
            shape = RoundedCornerShape(20.dp),
            contentPadding = PaddingValues(horizontal = 18.dp),
            colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
        ) { Text("獲取額度", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = White) }
    }
}

private data class WealthProduct(
    val id: String, val name: String, val yield7Day: String,
    val risk: String, val redemption: String,
    val cta: String, val deepLink: String, val highlighted: Boolean
)

@Composable
private fun WHWealthSelection() {
    val products = listOf(
        WealthProduct("w1","活錢理財｜歷史天天正收益","2.80%","R1低風險","贖回T+1到帳","去看看","hsbc://wealth/daily-positive",true),
        WealthProduct("w2","主投債券","3.04%","歷史周周正","成立以來…","查看","hsbc://wealth/bond-fund",false),
        WealthProduct("w3","年均收益率","2.31%","保証領取","穩健低波","查看","hsbc://wealth/guaranteed",false),
    )
    LaunchedEffect(Unit) {
        TealiumClient.sliceImpression("WEALTH_SELECTION", "slice-wealth-sel", 7, "wealth-selection-hk-2026")
    }
    Column(
        modifier = Modifier.fillMaxWidth().background(White)
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
            Text("財富精選", fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text("更多 ›", fontSize = 12.sp, color = HsbcRed)
        }
        Spacer(Modifier.height(10.dp))
        products.forEachIndexed { i, p ->
            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp)
                    .clickable { TealiumClient.wealthProductTapped(p.name, p.id) },
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(p.name, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = N900)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        RiskTag(p.risk); RiskTag(p.redemption)
                    }
                }
                Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(p.yield7Day, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = HsbcRed)
                    Text("7日年化", fontSize = 9.sp, color = N400)
                    if (p.highlighted) {
                        Button(
                            onClick = { TealiumClient.wealthProductTapped(p.name, p.id) },
                            modifier = Modifier.padding(top = 4.dp).height(28.dp),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
                        ) { Text(p.cta, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = White) }
                    }
                }
            }
            if (i < products.size - 1) Divider(color = N100)
        }
        Spacer(Modifier.height(10.dp))
        Text("💬 理財產品這么多，哪款適合我？",
            fontSize = 11.sp, color = N500,
            modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
    }
}

@Composable
private fun RiskTag(label: String) {
    Box(
        modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(N100)
            .padding(horizontal = 6.dp, vertical = 1.dp)
    ) { Text(label, fontSize = 9.sp, color = N500) }
}

private data class RankingItem(
    val id: String, val icon: String, val badge: String,
    val title: String, val desc: String
)

@Composable
private fun WHFeaturedRankings() {
    val items = listOf(
        RankingItem("r1","🥇","優中選優","3322選基","近1年漲跌幅高達318.19%"),
        RankingItem("r2","🔒","固收優選","穩健省心好選擇","歷史持有3月盈利概率高達98.23%"),
        RankingItem("r3","📈","屢創新高","屢創新高榜","近3年净值創新高次數達152"),
    )
    LaunchedEffect(Unit) { TealiumClient.sliceImpression("FEATURED_RANKINGS", "slice-rankings", 8) }
    Column(
        modifier = Modifier.fillMaxWidth().background(White)
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
            Text("特色榜單", fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text("更多 ›", fontSize = 12.sp, color = HsbcRed)
        }
        Spacer(Modifier.height(10.dp))
        items.forEach { item ->
            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
                    .clickable { TealiumClient.rankingsTapped(item.title, item.badge) },
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(item.icon, fontSize = 24.sp)
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Box(
                        modifier = Modifier.clip(RoundedCornerShape(10.dp))
                            .background(Color(0xFFFEF2F2)).padding(horizontal = 8.dp, vertical = 2.dp)
                    ) { Text(item.badge, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = HsbcRed) }
                    Text(item.title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = N900)
                    Text(item.desc, fontSize = 10.sp, color = N500)
                }
                Text("›", fontSize = 16.sp, color = N400)
            }
            Divider(color = Color(0xFFF9FAFB))
        }
    }
}

@Composable
private fun WHLifeDeals() {
    val deals = listOf(
        Triple("d1", "KFC",           Pair("🍗", "單品優惠")),
        Triple("d2", "Luckin Coffee", Pair("☕", "5折喝瑞幸")),
        Triple("d3", "DQ",            Pair("🍦", "5折起")),
    )
    val bottomLinks = listOf(
        Triple("🎁", "達標抽好禮\n丰润守护 健康随行", "hsbc://campaign/health"),
        Triple("🏦", "行庆招财日\n享受特惠禮遇",       "hsbc://campaign/anniversary"),
    )
    LaunchedEffect(Unit) { TealiumClient.sliceImpression("LIFE_DEALS", "slice-life-deals", 9) }
    Column(
        modifier = Modifier.fillMaxWidth().background(White)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
            Text("生活特惠", fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text("更多 ›", fontSize = 12.sp, color = HsbcRed)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            deals.forEach { (id, brand, iconTag) ->
                val (icon, tag) = iconTag
                Column(
                    modifier = Modifier.weight(1f).clip(RoundedCornerShape(12.dp))
                        .background(N50).clickable { TealiumClient.lifeDealTapped(brand, tag) }
                ) {
                    Box(
                        modifier = Modifier.fillMaxWidth().height(64.dp).background(N100),
                        contentAlignment = Alignment.Center
                    ) { Text(icon, fontSize = 24.sp) }
                    Box(
                        modifier = Modifier.fillMaxWidth().background(HsbcRed).padding(vertical = 4.dp),
                        contentAlignment = Alignment.Center
                    ) { Text(tag, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = White) }
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            bottomLinks.forEach { (icon, label, deepLink) ->
                Row(
                    modifier = Modifier.weight(1f).clip(RoundedCornerShape(12.dp)).background(N50)
                        .clickable {
                            TealiumClient.track(event = "bottom_link_tap", category = "Wealth",
                                action = "bottom_link_tapped", label = label,
                                screen = "wealth_hub_hk", journey = "wealth_hub",
                                custom = mapOf("deep_link" to deepLink))
                        }.padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(icon, fontSize = 24.sp)
                    Text(label, fontSize = 10.sp, color = N700, lineHeight = 14.sp)
                }
            }
        }
    }
}
