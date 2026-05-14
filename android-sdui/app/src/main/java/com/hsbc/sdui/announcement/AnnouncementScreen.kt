package com.hsbc.sdui.announcement

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.gson.annotations.SerializedName
import com.hsbc.sdui.analytics.TealiumClient
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Path

private val HsbcRed = Color(0xFFDB0011)
private val N50 = Color(0xFFF8F8F8)
private val N100 = Color(0xFFF0F0F0)
private val N200 = Color(0xFFE5E7EB)
private val N500 = Color(0xFF6B7280)
private val N700 = Color(0xFF374151)
private val N900 = Color(0xFF111827)

@Suppress("UNCHECKED_CAST")
private fun List<*>?.mapItems(): List<Map<String, Any?>> =
    this?.mapNotNull { it as? Map<String, Any?> }.orEmpty()

data class AnnouncementSlice(
    @SerializedName("instanceId") val instanceId: String,
    @SerializedName("type") val type: String,
    @SerializedName("visible") val visible: Boolean = true,
    @SerializedName("props") val props: Map<String, Any?> = emptyMap(),
)

data class AnnouncementLayout(
    @SerializedName("type") val type: String,
    @SerializedName("children") val children: List<AnnouncementSlice> = emptyList(),
)

data class AnnouncementPayload(
    @SerializedName("screen") val screen: String,
    @SerializedName("layout") val layout: AnnouncementLayout,
)

interface AnnouncementApi {
    @GET("screen/{screenId}")
    suspend fun fetchAnnouncement(@Path("screenId") screenId: String): AnnouncementPayload
}

private val announcementApi: AnnouncementApi by lazy {
    Retrofit.Builder()
        .baseUrl("http://10.0.2.2:4000/api/v1/")
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(AnnouncementApi::class.java)
}

private sealed class AnnouncementLoadState {
    object Loading : AnnouncementLoadState()
    data class Done(val slice: AnnouncementSlice) : AnnouncementLoadState()
    object Fallback : AnnouncementLoadState()
}

enum class AnnouncementKind(
    val screenId: String,
    val fallbackTitle: String,
    val analyticsName: String,
) {
    Special("announcement-overlay-hk", "Special announcement", "announcement_overlay_hk"),
    ForceUpdate("announcement-force-update-hk", "Get ready for eLaisee", "announcement_force_update_hk"),
}

@Composable
fun AnnouncementScreen(kind: AnnouncementKind, onBack: () -> Unit = {}) {
    var loadState by remember { mutableStateOf<AnnouncementLoadState>(AnnouncementLoadState.Loading) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(kind.screenId) {
        TealiumClient.track("announcement_viewed", "Announcement", "page_viewed", kind.analyticsName, "announcement")
        scope.launch {
            loadState = try {
                val payload = announcementApi.fetchAnnouncement(kind.screenId)
                val slice = payload.layout.children.firstOrNull {
                    it.visible && it.type == "ANNOUNCEMENT_OVERLAY"
                }
                if (slice == null) AnnouncementLoadState.Fallback else AnnouncementLoadState.Done(slice)
            } catch (_: Exception) {
                AnnouncementLoadState.Fallback
            }
        }
    }

    Box(Modifier.fillMaxSize()) {
        AnnouncementBackdrop()
        when (val state = loadState) {
            is AnnouncementLoadState.Loading -> {
                CircularProgressIndicator(color = HsbcRed, modifier = Modifier.align(Alignment.Center))
            }
            is AnnouncementLoadState.Done -> {
                AnnouncementOverlayCard(slice = state.slice, onClose = onBack, modifier = Modifier.align(Alignment.Center))
            }
            is AnnouncementLoadState.Fallback -> {
                AnnouncementOverlayCard(slice = fallbackSlice(kind), onClose = onBack, modifier = Modifier.align(Alignment.Center))
            }
        }
    }
}

private fun fallbackSlice(kind: AnnouncementKind): AnnouncementSlice = AnnouncementSlice(
    instanceId = "ann-overlay-fallback",
    type = "ANNOUNCEMENT_OVERLAY",
    props = if (kind == AnnouncementKind.ForceUpdate) mapOf(
        "scenario" to "JOURNEY_FORCE_UPDATE",
        "styleVariant" to "INLINE_FORCE_UPDATE",
        "title" to "Get ready for eLaisee",
        "body" to listOf(
            "Enjoy Chinese New Year by sending eLaisee money with customised messages, 24 hours a day, in an eco-friendlier way.",
            "Make sure your app is up to date to use the new feature."
        ),
        "actions" to listOf(mapOf("id" to "update-now", "label" to "Update now", "style" to "primary")),
        "blockInteraction" to true,
    ) else mapOf(
        "scenario" to "SPECIAL_ANNOUNCEMENT",
        "styleVariant" to "ENVELOPE_CARD",
        "title" to "Special announcement",
        "body" to listOf(
            "Your well-being is our priority. We're committed to supporting our customers affected by the Tai Po fire incident.",
            "If you need urgent assistance, please contact the following dedicated hotlines:"
        ),
        "hotlines" to listOf(
            mapOf("label" to "HSBC Banking Services / HSBC Life Insurance", "phone" to "(852) 2233 3066"),
            mapOf("label" to "HSBC General Insurance (operated by AXA)", "phone" to "(852) 2894 4078")
        ),
        "dontShowAgain" to mapOf("enabled" to true, "label" to "Don't show this message again"),
        "actions" to listOf(
            mapOf("id" to "close", "label" to "Close", "style" to "primary"),
            mapOf("id" to "website", "label" to "HSBC Website", "style" to "secondary")
        ),
        "blockInteraction" to true,
        "legalEntityText" to "The Hongkong and Shanghai Banking Corporation Limited",
    )
)

@Composable
private fun AnnouncementBackdrop() {
    Column(Modifier.fillMaxSize().background(N50)) {
        Row(
            modifier = Modifier.fillMaxWidth().background(Color(0xFF111827))
                .padding(top = 44.dp, bottom = 18.dp, start = 18.dp, end = 18.dp),
            horizontalArrangement = Arrangement.spacedBy(18.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("⌂", fontSize = 20.sp, color = Color.White)
            listOf("Pay", "Cards", "Wealth").forEach {
                Text(it, fontSize = 14.sp, color = Color.White, fontWeight = FontWeight.SemiBold)
            }
            Spacer(Modifier.weight(1f))
            Text("☰", fontSize = 20.sp, color = Color.White)
        }
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            listOf("HSBC Red Credit Card" to "-2,321.53 HKD", "Link a non-HSBC account" to "+", "Investments" to "").forEach { row ->
                Row(
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(6.dp)).background(Color.White)
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text(row.first, fontSize = 13.sp, color = N900, fontWeight = FontWeight.SemiBold)
                    Text(row.second, fontSize = 13.sp, color = N900, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
    Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.45f)))
}

@Composable
@Suppress("UNCHECKED_CAST")
private fun AnnouncementOverlayCard(
    slice: AnnouncementSlice,
    onClose: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val p = slice.props
    val style = p["styleVariant"]?.toString() ?: "ENVELOPE_CARD"
    val title = p["title"]?.toString() ?: "Special announcement"
    val body = (p["body"] as? List<*>)?.mapNotNull { it?.toString() }.orEmpty()
    val hotlines = (p["hotlines"] as? List<*>).mapItems().map {
        (it["label"]?.toString().orEmpty()) to (it["phone"]?.toString().orEmpty())
    }
    val dontShow = p["dontShowAgain"] as? Map<String, Any?>
    val actions = (p["actions"] as? List<*>).mapItems()
    val blockInteraction = p["blockInteraction"] as? Boolean ?: true
    val legal = p["legalEntityText"]?.toString().orEmpty()
    var dontShowAgain by remember { mutableStateOf(false) }

    Box(modifier = modifier.fillMaxWidth().padding(horizontal = 22.dp)) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = if (style == "INLINE_FORCE_UPDATE") "🧧" else "◆",
                fontSize = if (style == "INLINE_FORCE_UPDATE") 54.sp else 66.sp,
                color = HsbcRed,
                modifier = Modifier.padding(bottom = 0.dp)
            )
            Column(
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(2.dp)).background(Color.White)
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Text(title, fontSize = 24.sp, fontWeight = FontWeight.Bold, color = N900)
                body.forEach { Text(it, fontSize = 14.sp, color = N700) }
                hotlines.forEach {
                    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Text(it.first, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = N900)
                        Text(it.second, fontSize = 13.sp, color = N500)
                    }
                }
                if (dontShow?.get("enabled") as? Boolean == true) {
                    Row(
                        modifier = Modifier.clickable { dontShowAgain = !dontShowAgain },
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Text(if (dontShowAgain) "☑" else "☐", fontSize = 18.sp, color = HsbcRed)
                        Text(dontShow["label"]?.toString() ?: "Don't show this message again", fontSize = 13.sp, color = N700)
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    actions.forEach { action ->
                        AnnouncementButton(
                            label = action["label"]?.toString() ?: "Close",
                            primary = action["style"]?.toString() != "secondary",
                            modifier = Modifier.weight(1f),
                            onClick = onClose,
                        )
                    }
                }
            }
            if (legal.isNotEmpty()) {
                Text(legal, color = Color.White.copy(alpha = 0.72f), fontSize = 10.sp, modifier = Modifier.padding(top = 18.dp))
            }
        }
        if (!blockInteraction) {
            Text(
                "×",
                modifier = Modifier.align(Alignment.TopEnd).padding(top = 8.dp, end = 8.dp)
                    .size(30.dp).clip(CircleShape).background(Color.Black.copy(alpha = 0.55f))
                    .clickable { onClose() },
                color = Color.White,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun AnnouncementButton(label: String, primary: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Box(
        modifier = modifier.clip(RoundedCornerShape(2.dp))
            .background(if (primary) HsbcRed else Color.White)
            .border(1.dp, if (primary) HsbcRed else N200, RoundedCornerShape(2.dp))
            .clickable { onClick() }
            .padding(vertical = 12.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(label, color = if (primary) Color.White else N900, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
    }
}
