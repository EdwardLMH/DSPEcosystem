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

// ─── Design tokens (inline for wealth module) ─────────────────────────────────

private val HsbcRed   = Color(0xFFDB0011)
private val N50       = Color(0xFFF8F8F8)
private val N100      = Color(0xFFF0F0F0)
private val N400      = Color(0xFF999999)
private val N500      = Color(0xFF666666)
private val N700      = Color(0xFF333333)
private val N800      = Color(0xFF1A1A1A)
private val N900      = Color(0xFF0A0A0A)
private val White     = Color.White

// ─── Root entry point ─────────────────────────────────────────────────────────

@Composable
fun WealthPageScreen() {
    var adDismissed by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) { TealiumClient.wealthHubViewed() }

    LazyColumn(modifier = Modifier.fillMaxSize().background(N50)) {
        item { WHHeaderNav() }
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
        item { Spacer(Modifier.height(40.dp)) }
    }
}

// ─── 1. Header Nav ────────────────────────────────────────────────────────────

@Composable
private fun WHHeaderNav() {
    LaunchedEffect(Unit) {
        TealiumClient.sliceImpression("HEADER_NAV", "slice-header", 0)
    }
    Row(
        modifier = Modifier.fillMaxWidth().background(White)
            .padding(horizontal = 14.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // Search bar
        Row(
            modifier = Modifier
                .weight(1f)
                .clip(RoundedCornerShape(18.dp))
                .background(N100)
                .clickable {
                    TealiumClient.track("hsbc_mobile_android", "search_tap", "Wealth",
                        "search_tapped", screen = "wealth_hub_hk", journey = "wealth_hub")
                }
                .padding(horizontal = 14.dp, vertical = 8.dp),
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

// ─── 2. Quick Access ──────────────────────────────────────────────────────────

@Composable
private fun WHQuickAccess() {
    val items = listOf(
        Triple("🌙", "朝朝寶",   "hsbc://wealth/morning-treasure"),
        Triple("💵", "借錢",     "hsbc://loan/apply"),
        Triple("↔️", "轉帳",     "hsbc://transfer"),
        Triple("📊", "帳戶總覽", "hsbc://accounts"),
    )
    LaunchedEffect(Unit) {
        TealiumClient.sliceImpression("QUICK_ACCESS", "slice-quick", 1)
    }
    Row(
        modifier = Modifier.fillMaxWidth().background(White)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        items.forEach { (icon, label, deepLink) ->
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(5.dp),
                modifier = Modifier.weight(1f)
                    .clickable { TealiumClient.quickAccessTapped(label, deepLink) }
            ) {
                Box(
                    modifier = Modifier.size(48.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(Brush.linearGradient(listOf(Color(0xFFF0F9FF), Color(0xFFE0F2FE)))),
                    contentAlignment = Alignment.Center
                ) { Text(icon, fontSize = 22.sp) }
                Text(label, fontSize = 10.sp, color = N700, textAlign = TextAlign.Center)
            }
        }
    }
}

// ─── 3. Promo Banner ─────────────────────────────────────────────────────────

@Composable
private fun WHPromoBanner() {
    LaunchedEffect(Unit) {
        TealiumClient.promoBannerImpression("10分招財日", "slice-promo-10", "promo-10-finance-day")
    }
    Row(
        modifier = Modifier
            .padding(horizontal = 12.dp, vertical = 8.dp)
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFFE8F4FD))
            .padding(horizontal = 12.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Box(
                modifier = Modifier.clip(RoundedCornerShape(10.dp)).background(Color(0xFFFFEDED))
                    .padding(horizontal = 8.dp, vertical = 2.dp)
            ) {
                Text("每月10日開啓", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = HsbcRed)
            }
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

// ─── 4. Function Grid ─────────────────────────────────────────────────────────

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
    LaunchedEffect(Unit) {
        TealiumClient.sliceImpression("FUNCTION_GRID", "slice-func-grid", 3)
    }
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
                            modifier = Modifier.size(44.dp).clip(RoundedCornerShape(12.dp))
                                .background(N100),
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

// ─── 5. AI Assistant ─────────────────────────────────────────────────────────

@Composable
private fun WHAIAssistant() {
    LaunchedEffect(Unit) {
        TealiumClient.sliceImpression("AI_ASSISTANT", "slice-ai", 4)
    }
    Row(
        modifier = Modifier
            .padding(horizontal = 16.dp, vertical = 4.dp)
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(N50)
            .clickable { TealiumClient.aiAssistantTapped() }
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text("✉️", fontSize = 20.sp)
        Spacer(Modifier.width(8.dp))
        Text("Hi，我是你的智能財富助理",
            fontSize = 11.sp, color = N500, modifier = Modifier.weight(1f))
        Text("›", fontSize = 14.sp, color = N400)
    }
}

// ─── 6. Ad Banner ────────────────────────────────────────────────────────────

@Composable
private fun WHAdBanner(onDismiss: () -> Unit) {
    LaunchedEffect(Unit) {
        TealiumClient.sliceImpression("AD_BANNER", "slice-ad-spring", 5)
    }
    Box(modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(Brush.linearGradient(listOf(Color(0xFFFFFBEB), Color(0xFFFEF3C7))))
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("春季播種黃金期", fontSize = 13.sp, fontWeight = FontWeight.Bold,
                    color = Color(0xFF92400E))
                Text("配置正當時，播下「金種子」", fontSize = 10.sp, color = Color(0xFF78716C))
                Button(
                    onClick = {
                        TealiumClient.sliceTapped("AD_BANNER", "slice-ad-spring", "抽體驗禮",
                            "hsbc://campaign/spring-investment")
                    },
                    modifier = Modifier.padding(top = 8.dp).height(30.dp),
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
                ) { Text("抽體驗禮", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = White) }
            }
            Box(Modifier.size(72.dp).clip(RoundedCornerShape(10.dp)).background(Color(0x14000000)),
                contentAlignment = Alignment.Center) { Text("🌱", fontSize = 28.sp) }
        }
        // Dismiss button
        IconButton(
            onClick = { TealiumClient.adBannerDismissed("春季播種黃金期"); onDismiss() },
            modifier = Modifier.align(Alignment.TopEnd).size(32.dp)
        ) {
            Text("✕", fontSize = 13.sp, color = N400)
        }
    }
}

// ─── 7. Flash Loan ───────────────────────────────────────────────────────────

@Composable
private fun WHFlashLoan() {
    LaunchedEffect(Unit) {
        TealiumClient.sliceImpression("FLASH_LOAN", "slice-flash-loan", 6)
    }
    Row(
        modifier = Modifier
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .fillMaxWidth()
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
            onClick = {
                TealiumClient.sliceTapped("FLASH_LOAN", "slice-flash-loan",
                    "獲取額度", "hsbc://loan/flash")
            },
            modifier = Modifier.height(44.dp),
            shape = RoundedCornerShape(20.dp),
            contentPadding = PaddingValues(horizontal = 18.dp),
            colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
        ) {
            Text("獲取額度", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = White)
        }
    }
}

// ─── 8. Wealth Selection ─────────────────────────────────────────────────────

private data class WealthProduct(
    val id: String, val name: String, val tag: String,
    val yield7Day: String, val risk: String, val redemption: String,
    val cta: String, val deepLink: String, val highlighted: Boolean
)

private val wealthProducts = listOf(
    WealthProduct("w1","活錢理財｜歷史天天正收益","代碼","2.80%",
        "R1低風險","贖回T+1到帳","去看看","hsbc://wealth/daily-positive",true),
    WealthProduct("w2","主投債券","代碼","3.04%",
        "歷史周周正","成立以來…","查看","hsbc://wealth/bond-fund",false),
    WealthProduct("w3","年均收益率","收益確定","2.31%",
        "保証領取","穩健低波","查看","hsbc://wealth/guaranteed",false),
)

@Composable
private fun WHWealthSelection() {
    LaunchedEffect(Unit) {
        TealiumClient.sliceImpression("WEALTH_SELECTION", "slice-wealth-sel", 7,
            "wealth-selection-hk-2026")
    }
    Column(
        modifier = Modifier.fillMaxWidth().background(White)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(0.dp)
    ) {
        Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
            Text("財富精選", fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text("更多 ›", fontSize = 12.sp, color = HsbcRed)
        }
        Spacer(Modifier.height(10.dp))
        wealthProducts.forEachIndexed { i, p ->
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
            if (i < wealthProducts.size - 1) Divider(color = N100)
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

// ─── 9. Featured Rankings ────────────────────────────────────────────────────

private data class RankingItem(
    val id: String, val icon: String, val badge: String,
    val title: String, val desc: String, val deepLink: String
)

private val rankingItems = listOf(
    RankingItem("r1","🥇","優中選優","3322選基","近1年漲跌幅高達318.19%","hsbc://rankings/top-funds"),
    RankingItem("r2","🔒","固收優選","穩健省心好選擇","歷史持有3月盈利概率高達98.23%","hsbc://rankings/fixed-income"),
    RankingItem("r3","📈","屢創新高","屢創新高榜","近3年净值創新高次數達152","hsbc://rankings/all-time-high"),
)

@Composable
private fun WHFeaturedRankings() {
    LaunchedEffect(Unit) {
        TealiumClient.sliceImpression("FEATURED_RANKINGS", "slice-rankings", 8)
    }
    Column(
        modifier = Modifier.fillMaxWidth().background(White)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(0.dp)
    ) {
        Row(Modifier.fillMaxWidth(), Arrangement.SpaceBetween, Alignment.CenterVertically) {
            Text("特色榜單", fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text("更多 ›", fontSize = 12.sp, color = HsbcRed)
        }
        Spacer(Modifier.height(10.dp))
        rankingItems.forEach { item ->
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
                            .background(Color(0xFFFEF2F2))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(item.badge, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = HsbcRed)
                    }
                    Text(item.title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = N900)
                    Text(item.desc, fontSize = 10.sp, color = N500)
                }
                Text("›", fontSize = 16.sp, color = N400)
            }
            Divider(color = Color(0xFFF9FAFB))
        }
    }
}

// ─── 10. Life Deals ──────────────────────────────────────────────────────────

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
    LaunchedEffect(Unit) {
        TealiumClient.sliceImpression("LIFE_DEALS", "slice-life-deals", 9)
    }
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
                    modifier = Modifier.weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(N50)
                        .clickable { TealiumClient.lifeDealTapped(brand, tag) }
                ) {
                    Box(
                        modifier = Modifier.fillMaxWidth().height(64.dp).background(N100),
                        contentAlignment = Alignment.Center
                    ) { Text(icon, fontSize = 24.sp) }
                    Box(
                        modifier = Modifier.fillMaxWidth().background(HsbcRed)
                            .padding(vertical = 4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(tag, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = White)
                    }
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            bottomLinks.forEach { (icon, label, deepLink) ->
                Row(
                    modifier = Modifier.weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(N50)
                        .clickable {
                            TealiumClient.track(event = "bottom_link_tap", category = "Wealth",
                                action = "bottom_link_tapped", label = label,
                                screen = "wealth_hub_hk", journey = "wealth_hub",
                                custom = mapOf("deep_link" to deepLink))
                        }
                        .padding(10.dp),
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
