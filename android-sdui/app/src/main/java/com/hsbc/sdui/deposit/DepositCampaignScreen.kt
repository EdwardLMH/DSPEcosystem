package com.hsbc.sdui.deposit

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.google.gson.annotations.SerializedName
import com.hsbc.sdui.analytics.TealiumClient
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET

// ─── Design tokens (inline) ───────────────────────────────────────────────────

private val HsbcRed   = Color(0xFFC41E3A)
private val N50       = Color(0xFFF8F8F8)
private val N100      = Color(0xFFF0F0F0)
private val N200      = Color(0xFFE0E0E0)
private val N400      = Color(0xFF999999)
private val N500      = Color(0xFF666666)
private val N700      = Color(0xFF333333)
private val N800      = Color(0xFF1A1A1A)
private val N900      = Color(0xFF0A0A0A)
private val White     = Color.White
private val Amber50   = Color(0xFFFFF7ED)
private val AmberText = Color(0xFF92400E)

// ─── Network models ───────────────────────────────────────────────────────────

data class DepositSlice(
    @SerializedName("instanceId") val instanceId: String,
    @SerializedName("type")       val type: String,
    @SerializedName("visible")    val visible: Boolean = true,
    @SerializedName("props")      val props: Map<String, Any?> = emptyMap(),
) {
    fun str(key: String): String = props[key]?.toString() ?: ""
    fun bool(key: String): Boolean = props[key] as? Boolean ?: false

    @Suppress("UNCHECKED_CAST")
    fun rateRows(): List<Pair<String, String>> {
        val list = props["rates"] as? List<*> ?: return emptyList()
        return list.filterIsInstance<Map<String, Any?>>().map { row ->
            (row["term"]?.toString() ?: "") to (row["rate"]?.toString() ?: "")
        }
    }

    @Suppress("UNCHECKED_CAST")
    fun faqItems(): List<Triple<String, String, String>> {
        val list = props["items"] as? List<*> ?: return emptyList()
        return list.filterIsInstance<Map<String, Any?>>().map { item ->
            Triple(
                item["id"]?.toString() ?: "",
                item["question"]?.toString() ?: "",
                item["answer"]?.toString() ?: ""
            )
        }
    }
}

data class DepositLayout(
    @SerializedName("type")     val type: String,
    @SerializedName("children") val children: List<DepositSlice> = emptyList(),
)

data class DepositScreenPayload(
    @SerializedName("screen") val screen: String,
    @SerializedName("layout") val layout: DepositLayout,
)

interface DepositApi {
    @GET("screen/deposit-campaign-hk")
    suspend fun fetchDepositCampaign(): DepositScreenPayload
}

private val depositApi: DepositApi by lazy {
    Retrofit.Builder()
        .baseUrl("http://10.0.2.2:4000/api/v1/")
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(DepositApi::class.java)
}

// ─── Load state ───────────────────────────────────────────────────────────────

private sealed class DepositLoadState {
    object Loading  : DepositLoadState()
    data class Done(val slices: List<DepositSlice>) : DepositLoadState()
    object Fallback : DepositLoadState()
}

// ─── Entry point ──────────────────────────────────────────────────────────────

@Composable
fun DepositCampaignScreen(onBack: () -> Unit = {}) {
    var loadState by remember { mutableStateOf<DepositLoadState>(DepositLoadState.Loading) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        TealiumClient.track("deposit_campaign_viewed", "Deposit", "page_viewed",
            "deposit_campaign_hk", "deposit_campaign")
        scope.launch {
            loadState = try {
                val payload = depositApi.fetchDepositCampaign()
                val visible = payload.layout.children.filter { it.visible }
                if (visible.isEmpty()) DepositLoadState.Fallback
                else DepositLoadState.Done(visible)
            } catch (_: Exception) {
                DepositLoadState.Fallback
            }
        }
    }

    when (val state = loadState) {
        is DepositLoadState.Loading -> {
            Column(modifier = Modifier.fillMaxSize().background(N50)) {
                DepositHeaderBar(title = "Renminbi Savings Offers", onBack = onBack)
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = HsbcRed)
                }
            }
        }

        is DepositLoadState.Done -> {
            DepositSDUIView(slices = state.slices, onBack = onBack)
        }

        is DepositLoadState.Fallback -> {
            DepositHardcodedView(onBack = onBack)
        }
    }
}

// ─── SDUI scroll view ─────────────────────────────────────────────────────────

@Composable
private fun DepositSDUIView(slices: List<DepositSlice>, onBack: () -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().background(N50)
    ) {
        slices.forEach { slice ->
            item(key = slice.instanceId) {
                DepositSliceView(slice = slice, onBack = onBack)
            }
        }
        item { Spacer(Modifier.height(32.dp)) }
    }
}

// ─── Slice dispatcher ─────────────────────────────────────────────────────────

@Composable
private fun DepositSliceView(slice: DepositSlice, onBack: () -> Unit) {
    when (slice.type) {
        "HEADER_NAV"        -> DepositHeaderBar(
            title = slice.str("title").ifEmpty { "Renminbi Savings Offers" },
            showBack = slice.bool("showBackButton"),
            onBack = onBack
        )
        "PROMO_BANNER"      -> DepositPromoBanner(slice = slice)
        "DEPOSIT_RATE_TABLE"-> DepositRateTable(slice = slice)
        "DEPOSIT_OPEN_CTA"  -> DepositOpenCTA(slice = slice)
        "DEPOSIT_FAQ"       -> DepositFAQSection(slice = slice)
        "SPACER"            -> {
            val h = (slice.props["height"] as? Double)?.toInt() ?: 16
            Spacer(Modifier.height(h.dp))
        }
        // unknown types silently skipped
    }
}

// ─── 1. Header Bar ────────────────────────────────────────────────────────────

@Composable
private fun DepositHeaderBar(
    title: String,
    showBack: Boolean = true,
    onBack: () -> Unit = {},
) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth().background(White)
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (showBack) {
                Text("‹", fontSize = 22.sp, color = N800,
                    modifier = Modifier.clickable {
                        TealiumClient.track("back_tap", "Deposit", "back_tapped",
                            "deposit_campaign_hk", "deposit_campaign")
                        onBack()
                    })
            }
            Text(title, fontSize = 17.sp, fontWeight = FontWeight.Medium, color = N900,
                modifier = Modifier.weight(1f))
        }
        Divider(color = N200)
    }
}

// ─── 2. Promo Banner ──────────────────────────────────────────────────────────

@Composable
private fun DepositPromoBanner(slice: DepositSlice) {
    val bgHex   = slice.str("backgroundColor").ifEmpty { "#FFFFFF" }
    val bgColor = parseHex(bgHex)
    val imageUrl = slice.str("imageUrl")
        .replace("http://localhost:4000", "http://10.0.2.2:4000")

    if (slice.props.containsKey("imageUrl") && imageUrl.isNotEmpty()) {
        // Full-width image banner
        AsyncImage(
            model = imageUrl,
            contentDescription = "Deposit campaign banner",
            modifier = Modifier.fillMaxWidth().height(200.dp),
            contentScale = ContentScale.Crop,
        )
    } else if (slice.props.containsKey("title")) {
        // Text-only callout banner
        val title   = slice.str("title")
        val subtitle = slice.str("subtitle")
        val badge   = slice.str("badgeText")
        val textHex = slice.str("textColor").ifEmpty { "#92400E" }
        val textColor = parseHex(textHex)

        Column(
            modifier = Modifier.fillMaxWidth().background(bgColor)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            if (badge.isNotEmpty()) {
                Box(
                    modifier = Modifier.clip(RoundedCornerShape(20.dp))
                        .background(textColor.copy(alpha = 0.12f))
                        .padding(horizontal = 10.dp, vertical = 3.dp)
                ) { Text(badge, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = textColor) }
            }
            if (title.isNotEmpty()) {
                Text(title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = textColor)
            }
            if (subtitle.isNotEmpty()) {
                Text(subtitle, fontSize = 13.sp, color = textColor.copy(alpha = 0.8f))
            }
        }
    }
}

// ─── 3. Deposit Rate Table ────────────────────────────────────────────────────

@Composable
private fun DepositRateTable(slice: DepositSlice) {
    val sectionTitle = slice.str("sectionTitle").ifEmpty { "Time Deposit Rate:" }
    val asAtDate     = slice.str("asAtDate")
    val footnote     = slice.str("footnote")
    val rows         = slice.rateRows()

    LaunchedEffect(Unit) {
        TealiumClient.sliceImpression("DEPOSIT_RATE_TABLE", "dep-rate-table", 3)
    }

    Column(modifier = Modifier.fillMaxWidth().background(White)) {
        // Section header
        Row(
            modifier = Modifier.fillMaxWidth().background(N50)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(sectionTitle, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = N700)
            if (asAtDate.isNotEmpty()) Text("As at $asAtDate", fontSize = 10.sp, color = N400)
        }

        // Column headers
        Row(
            modifier = Modifier.fillMaxWidth().background(Color(0xFFF5F6F8))
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            Text("Term", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = N500,
                modifier = Modifier.weight(1f))
            Text("Interest Rate (p.a.)", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = N500)
        }

        // Rate rows
        rows.forEachIndexed { idx, (term, rate) ->
            Row(
                modifier = Modifier.fillMaxWidth()
                    .background(if (idx % 2 == 0) White else N50)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(term, fontSize = 13.sp, color = N700, modifier = Modifier.weight(1f))
                Text("$rate%", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = HsbcRed)
            }
            if (idx < rows.size - 1) Divider(color = N100, modifier = Modifier.padding(start = 16.dp))
        }

        // Footnote
        if (footnote.isNotEmpty()) {
            Text(footnote, fontSize = 10.sp, color = N400,
                modifier = Modifier.fillMaxWidth().background(N50)
                    .padding(horizontal = 16.dp, vertical = 10.dp))
        }
    }
}

// ─── 4. Deposit Open CTA ──────────────────────────────────────────────────────

@Composable
private fun DepositOpenCTA(slice: DepositSlice) {
    val label    = slice.str("label").ifEmpty { "Open a Deposit" }
    val bgHex    = slice.str("backgroundColor").ifEmpty { "#C41E3A" }
    val deepLink = slice.str("deepLink")

    LaunchedEffect(Unit) { TealiumClient.sliceImpression("DEPOSIT_OPEN_CTA", "dep-open-cta", 4) }

    Button(
        onClick = { TealiumClient.sliceTapped("DEPOSIT_OPEN_CTA", "dep-open-cta", label, deepLink) },
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp).height(52.dp),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(containerColor = parseHex(bgHex))
    ) {
        Text(label, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = White)
    }
}

// ─── 5. FAQ Section ───────────────────────────────────────────────────────────

@Composable
private fun DepositFAQSection(slice: DepositSlice) {
    val sectionTitle = slice.str("sectionTitle").ifEmpty { "Frequently Asked Questions" }
    val items = slice.faqItems()
    var expandedId by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) { TealiumClient.sliceImpression("DEPOSIT_FAQ", "dep-faq", 6) }

    Column(modifier = Modifier.fillMaxWidth().background(White)) {
        // Section header
        Text(sectionTitle, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = N700,
            modifier = Modifier.fillMaxWidth().background(N50)
                .padding(horizontal = 16.dp, vertical = 12.dp))

        items.forEachIndexed { idx, (id, question, answer) ->
            Column(modifier = Modifier.fillMaxWidth().background(White)) {
                // Question row
                Row(
                    modifier = Modifier.fillMaxWidth()
                        .clickable { expandedId = if (expandedId == id) null else id }
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(question, fontSize = 13.sp, color = N800, modifier = Modifier.weight(1f))
                    Text(if (expandedId == id) "∧" else "∨", fontSize = 13.sp, color = N400)
                }
                // Answer (animated expand)
                AnimatedVisibility(
                    visible = expandedId == id,
                    enter = expandVertically(),
                    exit = shrinkVertically()
                ) {
                    Text(answer, fontSize = 13.sp, color = N500,
                        modifier = Modifier.fillMaxWidth()
                            .padding(start = 16.dp, end = 16.dp, bottom = 14.dp))
                }
            }
            if (idx < items.size - 1) Divider(color = N100, modifier = Modifier.padding(start = 16.dp))
        }
    }
}

// ─── Hardcoded fallback ───────────────────────────────────────────────────────

@Composable
private fun DepositHardcodedView(onBack: () -> Unit) {
    val rates = listOf(
        "3 Month Time Deposit"  to "0.65",
        "6 Month Time Deposit"  to "0.85",
        "12 Month Time Deposit" to "0.95",
        "24 Month Time Deposit" to "1.05",
        "36 Month Time Deposit" to "1.25",
        "60 Month Time Deposit" to "1.30",
    )
    val faqs = listOf(
        Triple("faq-1", "Can I withdraw my time deposit before it matures?",
            "Yes, you can. But you'll earn less or no interest, and may have to pay an early withdrawal fee. For foreign currency deposits, visit a bank branch."),
        Triple("faq-2", "What happens if I don't withdraw my money after maturity?",
            "If you don't take out your money when it matures, most banks will automatically renew your deposit for the same term at the current interest rate. You can also choose to withdraw it or change the term before maturity."),
        Triple("faq-3", "How long can I keep a time deposit?",
            "Banks usually offer terms like 3 months, 6 months, 1 year, 2 years, 3 years, 5 years, or even 10 years. Longer terms usually have higher interest rates."),
        Triple("faq-4", "Why is the interest rate higher for time deposits than regular savings accounts?",
            "Banks can offer better rates because they know you'll keep your money in the account for a fixed period. This lets them use the funds for longer-term investments, so they share more of the profit with you as interest."),
    )
    var expandedId by remember { mutableStateOf<String?>(null) }

    LazyColumn(modifier = Modifier.fillMaxSize().background(N50)) {
        item { DepositHeaderBar(title = "Renminbi Savings Offers", onBack = onBack) }

        // Hero placeholder
        item {
            Box(
                modifier = Modifier.fillMaxWidth().height(200.dp).background(Color(0xFF1A3A6B)),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("🏦", fontSize = 48.sp)
                    Text("New Fund Deposit Campaign", fontSize = 13.sp, color = White.copy(alpha = 0.85f),
                        textAlign = TextAlign.Center)
                }
            }
        }

        // Rate callout
        item {
            Column(
                modifier = Modifier.fillMaxWidth().background(Amber50).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(modifier = Modifier.clip(RoundedCornerShape(20.dp)).background(AmberText.copy(alpha = 0.12f))
                    .padding(horizontal = 10.dp, vertical = 3.dp)) {
                    Text("🔥 New Funds Only", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = AmberText)
                }
                Text("🌟 Up to 1.15% p.a. Annual Equivalent Rate", fontSize = 16.sp,
                    fontWeight = FontWeight.Bold, color = AmberText)
                Text("3-Month New Fund CNY Transferable CD — exclusively for new deposits. Don't miss this limited-time rate.",
                    fontSize = 13.sp, color = AmberText.copy(alpha = 0.8f))
            }
        }

        // Rate table header
        item {
            Column(modifier = Modifier.fillMaxWidth().background(White)) {
                Row(modifier = Modifier.fillMaxWidth().background(N50).padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Time Deposit Rate:", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = N700)
                    Text("As at 5/22/2025", fontSize = 10.sp, color = N400)
                }
                Row(modifier = Modifier.fillMaxWidth().background(Color(0xFFF5F6F8)).padding(horizontal = 16.dp, vertical = 8.dp)) {
                    Text("Term", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = N500, modifier = Modifier.weight(1f))
                    Text("Interest Rate (p.a.)", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = N500)
                }
            }
        }

        // Rate rows
        itemsIndexed(rates) { idx, (term, rate) ->
            Column(modifier = Modifier.fillMaxWidth().background(White)) {
                Row(modifier = Modifier.fillMaxWidth()
                    .background(if (idx % 2 == 0) White else N50)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    Text(term, fontSize = 13.sp, color = N700, modifier = Modifier.weight(1f))
                    Text("$rate%", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = HsbcRed)
                }
                if (idx < rates.size - 1) Divider(color = N100, modifier = Modifier.padding(start = 16.dp))
            }
        }

        // Footnote
        item {
            Text("Time deposit minimum balance for Personal Banking customers: RMB50. New Fund refers to funds not previously held with HSBC.",
                fontSize = 10.sp, color = N400,
                modifier = Modifier.fillMaxWidth().background(N50).padding(horizontal = 16.dp, vertical = 10.dp))
        }

        // CTA
        item {
            Button(onClick = {
                TealiumClient.sliceTapped("DEPOSIT_OPEN_CTA", "dep-open-cta",
                    "Open a Deposit", "hsbc://deposit/open?currency=CNY&campaign=new-fund")
            }, modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp).height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = HsbcRed)
            ) { Text("Open a Deposit", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = White) }
        }

        item { Spacer(Modifier.height(16.dp)) }

        // FAQ
        item {
            Text("Frequently Asked Questions", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = N700,
                modifier = Modifier.fillMaxWidth().background(N50).padding(horizontal = 16.dp, vertical = 12.dp))
        }

        itemsIndexed(faqs) { idx, (id, question, answer) ->
            Column(modifier = Modifier.fillMaxWidth().background(White)) {
                Row(modifier = Modifier.fillMaxWidth().clickable {
                    expandedId = if (expandedId == id) null else id
                }.padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(question, fontSize = 13.sp, color = N800, modifier = Modifier.weight(1f))
                    Text(if (expandedId == id) "∧" else "∨", fontSize = 13.sp, color = N400)
                }
                AnimatedVisibility(visible = expandedId == id,
                    enter = expandVertically(), exit = shrinkVertically()) {
                    Text(answer, fontSize = 13.sp, color = N500,
                        modifier = Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, bottom = 14.dp))
                }
                if (idx < faqs.size - 1) Divider(color = N100, modifier = Modifier.padding(start = 16.dp))
            }
        }

        item { Spacer(Modifier.height(32.dp)) }
    }
}

// ─── Hex color helper ─────────────────────────────────────────────────────────

private fun parseHex(hex: String): Color = try {
    Color(android.graphics.Color.parseColor(hex))
} catch (_: Exception) {
    Color.White
}
