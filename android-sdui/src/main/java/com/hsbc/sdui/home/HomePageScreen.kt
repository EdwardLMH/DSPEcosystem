package com.hsbc.sdui.home

import android.net.Uri
import android.widget.MediaController
import android.widget.VideoView
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.hsbc.sdui.analytics.TealiumClient

// ─── Design tokens (inline for home module) ───────────────────────────────────

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
fun HomePageScreen() {
    var adDismissed by remember { mutableStateOf(false) }
    var searchOpen by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) { TealiumClient.homeHubViewed() }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(modifier = Modifier.fillMaxSize().background(N50)) {
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
            item { Spacer(Modifier.height(40.dp)) }
        }

        if (searchOpen) {
            WHAISearchOverlay(onDismiss = { searchOpen = false })
        }
    }
}

// ─── 1. Header Nav ────────────────────────────────────────────────────────────

@Composable
private fun WHHeaderNav(onSearchTap: () -> Unit) {
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
                        "search_tapped", screen = "home_hub_hk", journey = "home_hub")
                    onSearchTap()
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
                "notification_tapped", screen = "home_hub_hk", journey = "home_hub")
        })
        Text("⬛", fontSize = 18.sp, modifier = Modifier.clickable {
            TealiumClient.track("hsbc_mobile_android", "qr_tap", "Wealth",
                "qr_scanner_tapped", screen = "home_hub_hk", journey = "home_hub")
        })
    }
    Divider(color = Color(0xFFE5E5E5))
}

// ─── AI Search Overlay ───────────────────────────────────────────────────────

private data class SearchResult(
    val id: String,
    val type: String,
    val title: String,
    val description: String,
    val icon: String,
    val category: String,
    val deepLink: String,
    val keywords: String
)

private val aiSearchCorpus = listOf(
    SearchResult("fn-morning-treasure", "function", "朝朝寶",
        "朝朝寶每日活期存款高息理財產品 morning treasure daily wealth",
        "🌙", "快捷功能", "hsbc://wealth/morning-treasure",
        "朝朝寶,daily interest,活期,高息,morning,treasure,每日收益"),
    SearchResult("fn-loan", "function", "借錢 / 貸款",
        "個人貸款申請 閃電貸 極速放款 loan apply borrow cash",
        "💵", "快捷功能", "hsbc://loan/apply",
        "借錢,貸款,loan,borrow,申請,cash,分期,repayment"),
    SearchResult("fn-transfer", "function", "轉帳",
        "本地轉帳 跨行轉賬 即時支付 transfer money bank FPS PayNow",
        "↔️", "快捷功能", "hsbc://transfer",
        "轉帳,轉賬,transfer,匯款,FPS,即時,跨行,他行"),
    SearchResult("fn-accounts", "function", "帳戶總覽",
        "所有帳戶餘額查詢 收支明細 account overview balance statement",
        "📊", "快捷功能", "hsbc://accounts",
        "帳戶,accounts,餘額,balance,總覽,overview,明細"),
    SearchResult("fn-credit-card", "function", "信用卡",
        "信用卡管理 賬單 還款 積分 credit card bill repayment reward points",
        "💳", "功能入口", "hsbc://cards",
        "信用卡,credit card,Visa,Mastercard,賬單,帳單,積分,還款,cashback"),
    SearchResult("fn-statements", "function", "收支明細",
        "交易記錄 月結單 收入支出分析 transaction history statement analysis",
        "📄", "功能入口", "hsbc://statements",
        "收支明細,statement,交易,transaction,記錄,history,分析"),
    SearchResult("fn-external-transfer", "function", "他行卡轉入",
        "從其他銀行轉入資金 外部轉賬 external bank transfer fund in",
        "🔄", "功能入口", "hsbc://transfer/external",
        "他行,external,轉入,fund in,其他銀行,跨行"),
    SearchResult("fn-city-services", "function", "城市服務",
        "繳費 水電煤 交通罰款 政府繳費 city services bill payment utilities",
        "🏙️", "功能入口", "hsbc://city-services",
        "城市服務,utilities,繳費,水電,罰款,government,bill payment"),
    SearchResult("fn-events", "function", "熱門活動",
        "最新優惠活動 推廣 限時優惠 promotions hot events offers",
        "🔥", "功能入口", "hsbc://events",
        "熱門活動,events,優惠,promotions,活動,限時,campaigns"),
    SearchResult("fn-wealth", "function", "理財",
        "理財產品 投資 基金 債券 wealth management investment products",
        "📈", "功能入口", "hsbc://wealth",
        "理財,wealth,investment,投資,管理,products,fund"),
    SearchResult("fn-membership", "function", "M+會員",
        "HSBC M+會員計劃 積分 特權 HSBC membership programme rewards privileges",
        "Ⓜ️", "功能入口", "hsbc://membership",
        "M+,會員,membership,積分,特權,rewards,privileges,premier"),
    SearchResult("fn-movies", "function", "影票優惠",
        "電影票優惠 折扣 cinema movie ticket discount",
        "🎬", "功能入口", "hsbc://movies",
        "影票,movie,cinema,電影,discount,ticket,折扣"),
    SearchResult("fn-funds", "function", "基金",
        "基金投資 互惠基金 ETF fund investment mutual fund",
        "💹", "功能入口", "hsbc://funds",
        "基金,fund,ETF,互惠基金,investment,unit trust,NAV"),
    SearchResult("fn-all-services", "function", "全部功能",
        "所有銀行服務功能列表 all banking services full menu",
        "⋯", "功能入口", "hsbc://all-services",
        "全部,all,services,功能,more,menu,more services"),
    SearchResult("fn-ai-assistant", "function", "智能財富助理",
        "AI智能財富助理 投資建議 產品推薦 AI wealth advisor recommendation",
        "✉️", "快捷功能", "hsbc://ai-assistant",
        "AI,智能,助理,advisor,wealth,建議,recommendation,chatbot,聊天"),
    SearchResult("camp-flash-loan", "function", "閃電貸 — 極速放款",
        "閃電貸最高可借HKD300,000 極速放款 flash loan instant approval",
        "⚡", "快捷功能", "hsbc://loan/flash",
        "閃電貸,flash loan,極速,instant,300000,HKD,放款,approval"),
    SearchResult("fn-notifications", "function", "通知 / 訊息",
        "銀行通知 賬戶提醒 交易提示 notifications alerts messages",
        "🔔", "功能入口", "hsbc://notifications",
        "通知,notification,提醒,alert,訊息,message,inbox"),
    SearchResult("fn-qr-scan", "function", "QR碼掃描 / 付款",
        "二維碼掃碼付款 收款 QR code scan pay receive",
        "⬛", "功能入口", "hsbc://qr-scan",
        "QR,二維碼,掃碼,scan,pay,收款,付款,payment"),
    SearchResult("prod-daily-positive", "product", "活錢理財｜歷史天天正收益",
        "R1低風險理財產品 7日年化2.80% 贖回T+1到帳 daily positive return low risk",
        "💰", "財富精選", "hsbc://wealth/daily-positive",
        "活錢理財,天天正,daily positive,低風險,R1,2.80%,贖回,T+1,活期理財"),
    SearchResult("rank-top-funds", "ranking", "3322選基 — 優中選優",
        "精選基金榜單 近1年漲跌幅高達318.19% best performing funds selection methodology",
        "🥇", "特色榜單", "hsbc://rankings/top-funds",
        "3322,選基,top funds,榜單,ranking,優中選優,318%,performance"),
    SearchResult("deal-kfc", "deal", "KFC 單品優惠",
        "肯德基單品優惠 fast food dining discount KFC",
        "🍗", "生活特惠", "hsbc://deals/kfc",
        "KFC,肯德基,fast food,單品,優惠,dining,discount")
)

private val searchSuggestions = listOf("朝朝寶", "低風險理財", "信用卡", "基金", "借錢", "外匯")

private fun localSearch(query: String): List<SearchResult> {
    val q = query.trim().lowercase()
    if (q.isEmpty()) return emptyList()
    return aiSearchCorpus
        .map { item ->
            val text = listOf(item.title, item.description, item.keywords).joinToString(" ").lowercase()
            val title = item.title.lowercase()
            val score = (if (title.contains(q)) 100 else 0) +
                (if (item.keywords.lowercase().contains(q)) 60 else 0) +
                (if (text.contains(q)) 20 else 0)
            item to score
        }
        .filter { it.second > 0 }
        .sortedByDescending { it.second }
        .map { it.first }
}

@Composable
private fun WHAISearchOverlay(onDismiss: () -> Unit) {
    var query by remember { mutableStateOf("") }
    val results = remember(query) { localSearch(query) }
    val grouped = remember(results) { results.groupBy { it.category } }

    Column(modifier = Modifier.fillMaxSize().background(White)) {
        Row(
            modifier = Modifier.fillMaxWidth().background(HsbcRed)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            TextField(
                value = query,
                onValueChange = { query = it },
                modifier = Modifier.weight(1f).height(56.dp),
                singleLine = true,
                placeholder = { Text("搜尋功能、產品", color = N400, fontSize = 14.sp) },
                leadingIcon = { Text("🔍", fontSize = 16.sp) },
                trailingIcon = {
                    if (query.isNotEmpty()) {
                        Text("✕", color = N400, fontSize = 16.sp,
                            modifier = Modifier.clickable { query = "" })
                    }
                },
                shape = RoundedCornerShape(24.dp),
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = White,
                    unfocusedContainerColor = White,
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent
                )
            )
            Text("取消", color = White, fontSize = 16.sp, modifier = Modifier.clickable { onDismiss() })
        }

        if (query.trim().isEmpty()) {
            Column(modifier = Modifier.fillMaxWidth().background(N50).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("熱門搜尋", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = N500)
                searchSuggestions.chunked(3).forEach { row ->
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        row.forEach { suggestion ->
                            Box(
                                modifier = Modifier.weight(1f).height(38.dp)
                                    .clip(RoundedCornerShape(18.dp)).background(White)
                                    .clickable { query = suggestion },
                                contentAlignment = Alignment.Center
                            ) { Text(suggestion, fontSize = 12.sp, color = N700) }
                        }
                        repeat(3 - row.size) { Spacer(Modifier.weight(1f)) }
                    }
                }
            }
        } else {
            Text("找到 ${results.size} 個相關結果", fontSize = 12.sp, color = N400,
                modifier = Modifier.fillMaxWidth().background(N50).padding(horizontal = 16.dp, vertical = 12.dp))

            if (results.isEmpty()) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(top = 48.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text("🔍", fontSize = 40.sp)
                    Text("找不到「$query」的相關結果", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = N700)
                    Text("試試其他關鍵詞", fontSize = 12.sp, color = N400)
                }
            } else {
                LazyColumn(modifier = Modifier.fillMaxSize().background(N50)) {
                    grouped.forEach { (category, categoryResults) ->
                        item {
                            Text(category, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = N500,
                                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp))
                        }
                        items(categoryResults.size) { index ->
                            SearchResultRow(categoryResults[index], onDismiss)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SearchResultRow(result: SearchResult, onDismiss: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().background(White)
            .clickable {
                TealiumClient.track(event = "ai_search_result_tap", category = "Search",
                    action = "result_selected", label = result.title,
                    screen = "home_hub_hk", journey = "home_hub",
                    custom = mapOf("deep_link" to result.deepLink))
                onDismiss()
            }
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(Modifier.size(44.dp).clip(RoundedCornerShape(10.dp)).background(Color(0xFFFFE3E6)),
            contentAlignment = Alignment.Center) { Text(result.icon, fontSize = 20.sp) }
        Column(modifier = Modifier.weight(1f)) {
            Text(result.title, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = N900,
                maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(result.description, fontSize = 12.sp, color = N500, maxLines = 2,
                overflow = TextOverflow.Ellipsis, lineHeight = 16.sp)
        }
        Box(Modifier.clip(RoundedCornerShape(10.dp)).background(Color(0xFFFFE3E6))
            .padding(horizontal = 8.dp, vertical = 4.dp)) {
            Text("功能", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = HsbcRed)
        }
    }
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
                                screen = "home_hub_hk", journey = "home_hub",
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
                    .clickable { TealiumClient.homeProductTapped(p.name, p.id) },
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
                            onClick = { TealiumClient.homeProductTapped(p.name, p.id) },
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
                                screen = "home_hub_hk", journey = "home_hub",
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

// ─── Carousel helper: parse numColumns from props ─────────────────────────────

private fun numColumnsFromProps(props: Map<String, Any>): Int {
    val raw = props["numColumns"] ?: return 1
    return when (raw) {
        is Int    -> maxOf(1, raw)
        is String -> maxOf(1, raw.toIntOrNull() ?: 1)
        else      -> 1
    }
}

// ─── 11. Wealth Studio Carousel ──────────────────────────────────────────────
// Renders WEALTH_STUDIO_CAROUSEL slice.
// numColumns=1 → horizontal scroll; numColumns>1 → vertical grid.

@Composable
fun WHWealthStudioCarousel(props: Map<String, Any> = emptyMap()) {
    val sectionTitle = props["sectionTitle"] as? String ?: "Premier Elite Wealth Studio"
    val moreLabel    = props["moreLabel"]    as? String ?: "View all"
    val moreDeepLink = props["moreDeepLink"] as? String ?: "hsbc://wealth-studio"
    @Suppress("UNCHECKED_CAST")
    val items: List<Map<String, Any>> = props["items"] as? List<Map<String, Any>> ?: emptyList()
    val cols = numColumnsFromProps(props)
    val isGrid = cols > 1
    var playingItem by remember { mutableStateOf<Map<String, Any>?>(null) }

    LaunchedEffect(Unit) { TealiumClient.sliceImpression("WEALTH_STUDIO_CAROUSEL", "slice-wealth-studio", 5) }

    Column(modifier = Modifier.fillMaxWidth().background(White).padding(top = 8.dp)) {
        // Section header
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(sectionTitle, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = N800)
            Text("$moreLabel ›", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = HsbcRed,
                modifier = Modifier.clickable { TealiumClient.sliceTapped("WEALTH_STUDIO_CAROUSEL",
                    "slice-wealth-studio", moreLabel, moreDeepLink) })
        }

        if (isGrid) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).padding(bottom = 14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items.chunked(cols).forEach { rowItems ->
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        rowItems.forEach { item ->
                            WealthStudioCard(
                                modifier = Modifier.weight(1f),
                                item = item,
                                onPlay = { playingItem = item }
                            )
                        }
                        repeat(cols - rowItems.size) { Spacer(Modifier.weight(1f)) }
                    }
                }
            }
        } else {
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, bottom = 14.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items.forEach { item ->
                    WealthStudioCard(modifier = Modifier.width(220.dp), item = item,
                        onPlay = { playingItem = item })
                }
            }
        }
    }

    playingItem?.let { item ->
        val rawUrl = item["videoUrl"] as? String ?: ""
        val videoUrl = rawUrl.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2")
        Dialog(onDismissRequest = { playingItem = null }) {
            Column(
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color.Black),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                if (videoUrl.isNotEmpty()) {
                    AndroidView(
                        modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f),
                        factory = { ctx ->
                            VideoView(ctx).apply {
                                setVideoURI(Uri.parse(videoUrl))
                                val mc = MediaController(ctx)
                                mc.setAnchorView(this)
                                setMediaController(mc)
                                start()
                            }
                        }
                    )
                } else {
                    Box(
                        modifier = Modifier.fillMaxWidth().height(200.dp).background(Color.Black),
                        contentAlignment = Alignment.Center
                    ) { Text("▶ Playing…", color = White, fontSize = 16.sp) }
                }
                Column(modifier = Modifier.background(White).padding(14.dp)) {
                    Text(item["episodeLabel"] as? String ?: "", fontSize = 11.sp, color = N400)
                    Text(item["title"] as? String ?: "", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = N800)
                }
                TextButton(onClick = { playingItem = null }) {
                    Text("✕ Close", color = White, fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
private fun WealthStudioCard(modifier: Modifier = Modifier, item: Map<String, Any>, onPlay: () -> Unit) {
    val episodeLabel = item["episodeLabel"] as? String ?: ""
    val title        = item["title"]        as? String ?: ""
    val ctaLabel     = item["ctaLabel"]     as? String ?: "Watch now"
    val liveBadge    = item["liveBadge"]    as? String
    val imgHex       = item["imageColor"]   as? String ?: "#1A1A2E"
    val imgColor     = try { Color(android.graphics.Color.parseColor(imgHex)) } catch (_: Exception) { Color(0xFF1A1A2E) }

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(White)
            .shadow(elevation = 2.dp, shape = RoundedCornerShape(12.dp))
            .clickable { TealiumClient.wealthStudioTapped(episodeLabel, title, ctaLabel) }
    ) {
        // Image area
        Box(modifier = Modifier.fillMaxWidth().height(120.dp).background(imgColor)) {
            Text(episodeLabel, fontSize = 9.sp, fontWeight = FontWeight.SemiBold, color = White,
                modifier = Modifier.align(Alignment.TopStart).padding(10.dp)
                    .background(Color.White.copy(alpha = 0.15f), RoundedCornerShape(10.dp))
                    .padding(horizontal = 8.dp, vertical = 2.dp))
            Box(modifier = Modifier.size(36.dp).clip(CircleShape).background(Color.Black.copy(alpha = 0.3f))
                .align(Alignment.Center).clickable { onPlay() }, contentAlignment = Alignment.Center) {
                Text("▶", fontSize = 18.sp, color = White)
            }
            liveBadge?.let {
                Text("🔴 $it", fontSize = 9.sp, color = White,
                    modifier = Modifier.align(Alignment.BottomStart)
                        .padding(horizontal = 10.dp, vertical = 8.dp)
                        .background(HsbcRed.copy(alpha = 0.85f), RoundedCornerShape(6.dp))
                        .padding(horizontal = 8.dp, vertical = 3.dp))
            }
        }
        // Text area
        Column(
            modifier = Modifier.fillMaxWidth().height(80.dp).background(White).padding(12.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(title, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = N800,
                maxLines = 2, lineHeight = 16.sp)
            Button(
                onClick = onPlay,
                modifier = Modifier.fillMaxWidth().height(28.dp),
                shape = RoundedCornerShape(14.dp),
                contentPadding = PaddingValues(horizontal = 12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
            ) { Text(ctaLabel, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = White) }
        }
    }
}

// ─── 12. Guides & Insights Carousel ─────────────────────────────────────────

@Composable
fun WHGuidesInsightsCarousel(props: Map<String, Any> = emptyMap()) {
    val sectionTitle = props["sectionTitle"] as? String ?: "Guides and insights"
    val moreLabel    = props["moreLabel"]    as? String ?: "View all"
    val moreDeepLink = props["moreDeepLink"] as? String ?: "hsbc://guides"
    @Suppress("UNCHECKED_CAST")
    val items: List<Map<String, Any>> = props["items"] as? List<Map<String, Any>> ?: emptyList()
    val cols   = numColumnsFromProps(props)
    val isGrid = cols > 1

    LaunchedEffect(Unit) { TealiumClient.sliceImpression("GUIDES_INSIGHTS_CAROUSEL", "slice-guides-insights", 6) }

    Column(modifier = Modifier.fillMaxWidth().background(White).padding(top = 8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(sectionTitle, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = N800)
            Text("$moreLabel ›", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = HsbcRed,
                modifier = Modifier.clickable { TealiumClient.sliceTapped("GUIDES_INSIGHTS_CAROUSEL",
                    "slice-guides-insights", moreLabel, moreDeepLink) })
        }

        if (isGrid) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).padding(bottom = 14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items.chunked(cols).forEach { rowItems ->
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        rowItems.forEach { item -> GuidesInsightsCard(modifier = Modifier.weight(1f), item = item) }
                        repeat(cols - rowItems.size) { Spacer(Modifier.weight(1f)) }
                    }
                }
            }
        } else {
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, bottom = 14.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items.forEach { item -> GuidesInsightsCard(modifier = Modifier.width(190.dp), item = item) }
            }
        }
    }
}

@Composable
private fun GuidesInsightsCard(modifier: Modifier = Modifier, item: Map<String, Any>) {
    val title       = item["title"]       as? String ?: ""
    val description = item["description"] as? String ?: ""
    val date        = item["date"]        as? String ?: ""
    val imgHex      = item["imageColor"]  as? String ?: "#2D3748"
    val imgColor    = try { Color(android.graphics.Color.parseColor(imgHex)) } catch (_: Exception) { Color(0xFF2D3748) }

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(White)
            .border(1.dp, Color(0xFFF3F4F6), RoundedCornerShape(12.dp))
            .clickable { TealiumClient.guidesTapped(title, item["id"] as? String ?: "", item["deepLink"] as? String ?: "") }
    ) {
        Box(modifier = Modifier.fillMaxWidth().height(100.dp).background(imgColor),
            contentAlignment = Alignment.Center) {
            Text("📖", fontSize = 28.sp, modifier = Modifier.alpha(0.6f))
        }
        Column(modifier = Modifier.fillMaxWidth().padding(10.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(title, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = N800, maxLines = 3, lineHeight = 15.sp)
            if (description.isNotEmpty()) {
                Text(description, fontSize = 10.sp, color = N500, maxLines = 2, lineHeight = 14.sp)
            }
            Text(date, fontSize = 10.sp, color = N400)
        }
    }
}

// ─── 13. Discover More Carousel ──────────────────────────────────────────────

@Composable
fun WHDiscoverMoreCarousel(props: Map<String, Any> = emptyMap()) {
    val sectionTitle = props["sectionTitle"] as? String ?: "Discover more"
    @Suppress("UNCHECKED_CAST")
    val items: List<Map<String, Any>> = props["items"] as? List<Map<String, Any>> ?: emptyList()
    val cols   = numColumnsFromProps(props)
    val isGrid = cols > 1

    LaunchedEffect(Unit) { TealiumClient.sliceImpression("DISCOVER_MORE_CAROUSEL", "slice-discover-more", 8) }

    Column(modifier = Modifier.fillMaxWidth().background(White).padding(top = 8.dp)) {
        Text(sectionTitle, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = N800,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp))

        if (isGrid) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).padding(bottom = 14.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items.chunked(cols).forEach { rowItems ->
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        rowItems.forEach { item -> DiscoverMoreCard(modifier = Modifier.weight(1f), item = item) }
                        repeat(cols - rowItems.size) { Spacer(Modifier.weight(1f)) }
                    }
                }
            }
        } else {
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, bottom = 14.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items.forEach { item -> DiscoverMoreCard(modifier = Modifier.width(200.dp), item = item) }
            }
        }
    }
}

@Composable
private fun DiscoverMoreCard(modifier: Modifier = Modifier, item: Map<String, Any>) {
    val tag        = item["tag"]        as? String ?: ""
    val tagHex     = item["tagColor"]   as? String ?: "#DB0011"
    val title      = item["title"]      as? String ?: ""
    val subtitle   = (item["description"] as? String) ?: (item["subtitle"] as? String) ?: ""
    val imgHex     = item["imageColor"] as? String ?: "#1A2E4A"
    val imgColor   = try { Color(android.graphics.Color.parseColor(imgHex)) } catch (_: Exception) { Color(0xFF1A2E4A) }
    val tagColor   = try { Color(android.graphics.Color.parseColor(tagHex)) } catch (_: Exception) { HsbcRed }

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(White)
            .border(1.dp, Color(0xFFF3F4F6), RoundedCornerShape(12.dp))
            .clickable { TealiumClient.discoverMoreTapped(tag, title, item["deepLink"] as? String ?: "") }
    ) {
        Box(modifier = Modifier.fillMaxWidth().height(110.dp).background(imgColor)) {
            Text(tag, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = White,
                modifier = Modifier.align(Alignment.TopStart).padding(10.dp)
                    .background(tagColor, RoundedCornerShape(10.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp))
        }
        Column(modifier = Modifier.fillMaxWidth().padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(title, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = N800, maxLines = 2, lineHeight = 16.sp)
            if (subtitle.isNotEmpty()) {
                Text(subtitle, fontSize = 10.sp, color = N500, maxLines = 2, lineHeight = 14.sp)
            }
        }
    }
}
