package com.hsbc.sdui.fxviewpoint

import android.net.Uri
import android.widget.MediaController
import android.widget.VideoView
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.google.gson.annotations.SerializedName
import com.hsbc.sdui.analytics.TealiumClient
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET

// ─── Design tokens (inline) ───────────────────────────────────────────────────

private val HsbcNavy  = Color(0xFF003366)
private val HsbcRed   = Color(0xFFDB0011)
private val N50       = Color(0xFFF8F8F8)
private val N100      = Color(0xFFF0F0F0)
private val N200      = Color(0xFFE0E0E0)
private val N400      = Color(0xFF999999)
private val N500      = Color(0xFF666666)
private val N700      = Color(0xFF333333)
private val N900      = Color(0xFF0A0A0A)
private val White     = Color.White

// ─── Network models ───────────────────────────────────────────────────────────

data class FXSlice(
    @SerializedName("instanceId") val instanceId: String,
    @SerializedName("type")       val type: String,
    @SerializedName("visible")    val visible: Boolean = true,
    @SerializedName("props")      val props: Map<String, Any?> = emptyMap(),
) {
    fun str(key: String): String = props[key]?.toString() ?: ""
    fun bool(key: String): Boolean = props[key] as? Boolean ?: false

    @Suppress("UNCHECKED_CAST")
    fun strings(key: String): List<String> =
        (props[key] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
}

data class FXLayout(
    @SerializedName("type")     val type: String,
    @SerializedName("children") val children: List<FXSlice> = emptyList(),
)

data class FXScreenPayload(
    @SerializedName("screen") val screen: String,
    @SerializedName("layout") val layout: FXLayout,
)

interface FXApi {
    @GET("screen/fx-viewpoint-hk")
    suspend fun fetchFXViewpoint(): FXScreenPayload
}

private val fxApi: FXApi by lazy {
    Retrofit.Builder()
        .baseUrl("http://10.0.2.2:4000/api/v1/")
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(FXApi::class.java)
}

// ─── Load state ───────────────────────────────────────────────────────────────

private sealed class FXLoadState {
    object Loading  : FXLoadState()
    data class Done(val slices: List<FXSlice>) : FXLoadState()
    object Fallback : FXLoadState()
}

// ─── Entry point ──────────────────────────────────────────────────────────────

@Composable
fun FXViewpointScreen(onBack: () -> Unit = {}) {
    var loadState by remember { mutableStateOf<FXLoadState>(FXLoadState.Loading) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        TealiumClient.track("fx_viewpoint_viewed", "FXViewpoint", "page_viewed",
            "fx_viewpoint_hk", "fx_viewpoint")
        scope.launch {
            loadState = try {
                val payload = fxApi.fetchFXViewpoint()
                val visible = payload.layout.children.filter { it.visible }
                if (visible.isEmpty()) FXLoadState.Fallback else FXLoadState.Done(visible)
            } catch (_: Exception) {
                FXLoadState.Fallback
            }
        }
    }

    when (val s = loadState) {
        is FXLoadState.Loading  -> FXLoadingView(onBack)
        is FXLoadState.Done     -> FXSDUIView(s.slices, onBack)
        is FXLoadState.Fallback -> FXHardcodedView(onBack)
    }
}

// ─── Loading state ────────────────────────────────────────────────────────────

@Composable
private fun FXLoadingView(onBack: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().background(N50)) {
        FXHeaderBar(title = "FX Viewpoint", onBack = onBack)
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = HsbcNavy)
        }
    }
}

// ─── SDUI view ────────────────────────────────────────────────────────────────

@Composable
private fun FXSDUIView(slices: List<FXSlice>, onBack: () -> Unit) {
    val bodySlices = slices.filter { it.type != "CONTACT_RM_CTA" }
    val stickySlice = slices.firstOrNull { it.type == "CONTACT_RM_CTA" && it.bool("sticky") }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize().background(N50),
            contentPadding = PaddingValues(bottom = if (stickySlice != null) 72.dp else 16.dp)
        ) {
            items(bodySlices, key = { it.instanceId }) { slice ->
                when (slice.type) {
                    "HEADER_NAV"           -> FXHeaderBar(
                        title = slice.str("title").ifEmpty { "FX Viewpoint" },
                        showBack = slice.bool("showBackButton"),
                        onBack = onBack
                    )
                    "VIDEO_PLAYER",
                    "MARKET_INSIGHT_VIDEO" -> FXVideoPlayer(slice)
                    "MARKET_BRIEFING_TEXT" -> FXMarketBriefing(slice)
                }
            }
        }

        if (stickySlice != null) {
            Box(modifier = Modifier.align(Alignment.BottomCenter)) {
                FXContactRMCTA(stickySlice)
            }
        }
    }
}

// ─── Hardcoded fallback ───────────────────────────────────────────────────────

@Composable
private fun FXHardcodedView(onBack: () -> Unit) {
    val bullets = listOf(
        "A weak USD is likely to persist into 2026, providing temporary support for the EUR and GBP.",
        "With the ECB expected to maintain its policy rate in 2026, the EUR should remain broadly stable.",
        "BoE delivered a 25 bps cut in May 2026 — further easing is data-dependent and market pricing appears stretched.",
        "GBP/USD faces near-term resistance at 1.3200 amid mixed UK growth signals.",
        "Investors should consider diversified FX exposure to manage downside risk against a volatile USD backdrop.",
    )

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize().background(N50),
            contentPadding = PaddingValues(bottom = 72.dp)
        ) {
            item { FXHeaderBar(title = "FX Viewpoint", onBack = onBack) }
            item {
                FXVideoThumbnail(
                    title = "FX Viewpoint — EUR & GBP Market Insights (May 2026)",
                    presenterName = "Jackie Wong",
                    presenterTitle = "FX Strategist, HSBC Global Research",
                    onClick = {}
                )
            }
            item {
                FXBriefingCard(
                    sectionTitle = "Key takeaways",
                    bullets = bullets,
                    disclaimer = "This material is issued by HSBC and is for information purposes only. " +
                        "It does not constitute investment advice or a recommendation to buy or sell any financial instrument."
                )
            }
        }

        Box(modifier = Modifier.align(Alignment.BottomCenter)) {
            FXContactRMBar(
                label = "Contact Your RM",
                subLabel = "Speak to your Relationship Manager about FX opportunities"
            )
        }
    }
}

// ─── Slice components ─────────────────────────────────────────────────────────

@Composable
private fun FXHeaderBar(title: String, showBack: Boolean = true, onBack: () -> Unit = {}) {
    Column {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .background(White)
                .padding(horizontal = 14.dp, vertical = 12.dp)
        ) {
            if (showBack) {
                Text(
                    "‹", fontSize = 22.sp, color = N900,
                    modifier = Modifier
                        .padding(end = 8.dp)
                        .clickable { onBack() }
                )
            }
            Text(title, fontSize = 17.sp, fontWeight = FontWeight.SemiBold, color = N900)
        }
        Divider(color = N200, thickness = 1.dp)
    }
}

@Composable
private fun FXVideoPlayer(slice: FXSlice) {
    var showPlayer by remember { mutableStateOf(false) }
    val videoUrl = slice.str("videoUrl")
        .replace("http://localhost:4000", "http://10.0.2.2:4000")
        .ifEmpty { "http://10.0.2.2:4000/media/fx-viewpoint.mov" }

    Column {
        if (showPlayer) {
            AndroidView(
                factory = { ctx ->
                    VideoView(ctx).apply {
                        setVideoURI(Uri.parse(videoUrl))
                        val mc = MediaController(ctx)
                        mc.setAnchorView(this)
                        setMediaController(mc)
                        start()
                    }
                },
                modifier = Modifier.fillMaxWidth().height(210.dp)
            )
        } else {
            FXVideoThumbnail(
                title = slice.str("title"),
                presenterName = slice.str("presenterName"),
                presenterTitle = slice.str("presenterTitle"),
                onClick = { showPlayer = true }
            )
            return
        }

        // Presenter info shown below the player too
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth().background(White)
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            Box(
                modifier = Modifier.size(40.dp).clip(CircleShape)
                    .background(HsbcNavy.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) { Text("👤", fontSize = 18.sp) }
            Spacer(Modifier.width(10.dp))
            Column {
                Text(slice.str("presenterName"), fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = N900)
                Text(slice.str("presenterTitle"), fontSize = 12.sp, color = N500)
            }
        }
        Divider(color = N200, thickness = 1.dp)
    }
}

@Composable
private fun FXVideoThumbnail(
    title: String,
    presenterName: String,
    presenterTitle: String,
    onClick: () -> Unit,
) {
    Column {
        Box(
            modifier = Modifier
                .fillMaxWidth().height(210.dp)
                .background(HsbcNavy)
                .clickable { onClick() },
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Box(
                    modifier = Modifier.size(64.dp).clip(CircleShape)
                        .background(White.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("▶", fontSize = 28.sp, color = White)
                }
                Spacer(Modifier.height(8.dp))
                Text(
                    title, fontSize = 13.sp, color = White.copy(alpha = 0.85f),
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth().background(White)
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            Box(
                modifier = Modifier.size(40.dp).clip(CircleShape)
                    .background(HsbcNavy.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) { Text("👤", fontSize = 18.sp) }
            Spacer(Modifier.width(10.dp))
            Column {
                Text(presenterName, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = N900)
                Text(presenterTitle, fontSize = 12.sp, color = N500)
            }
        }
        Divider(color = N200, thickness = 1.dp)
    }
}

@Composable
private fun FXMarketBriefing(slice: FXSlice) {
    FXBriefingCard(
        sectionTitle = slice.str("sectionTitle").ifEmpty { "Key takeaways" },
        bullets = slice.strings("bulletPoints"),
        disclaimer = slice.str("disclaimer").ifEmpty { null },
    )
}

@Composable
private fun FXBriefingCard(sectionTitle: String, bullets: List<String>, disclaimer: String?) {
    Column(
        modifier = Modifier.fillMaxWidth().background(White)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(sectionTitle, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = N900)

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            bullets.forEach { point ->
                Row(verticalAlignment = Alignment.Top) {
                    Box(
                        modifier = Modifier.padding(top = 5.dp).size(6.dp)
                            .clip(CircleShape).background(HsbcNavy)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(point, fontSize = 14.sp, color = N700)
                }
            }
        }

        if (!disclaimer.isNullOrBlank()) {
            Text(
                disclaimer, fontSize = 10.sp, color = N400,
                modifier = Modifier.fillMaxWidth()
                    .clip(RoundedCornerShape(6.dp))
                    .background(N100).padding(10.dp)
            )
        }
    }
}

@Composable
private fun FXContactRMCTA(slice: FXSlice) {
    FXContactRMBar(
        label = slice.str("label").ifEmpty { "Contact Your RM" },
        subLabel = slice.str("subLabel").ifEmpty { null },
        bgColor = HsbcRed,
    )
}

@Composable
private fun FXContactRMBar(label: String, subLabel: String?, bgColor: Color = HsbcRed) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth().background(bgColor)
            .padding(horizontal = 20.dp, vertical = 14.dp)
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(label, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = White)
            if (!subLabel.isNullOrBlank()) {
                Text(subLabel, fontSize = 12.sp, color = White.copy(alpha = 0.85f))
            }
        }
        Text("›", fontSize = 20.sp, color = White)
    }
}
