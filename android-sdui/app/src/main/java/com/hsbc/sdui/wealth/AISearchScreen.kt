package com.hsbc.sdui.wealth

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hsbc.sdui.analytics.TealiumClient
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import org.json.JSONObject
import java.net.URL
import javax.net.ssl.HttpsURLConnection

// ─── Models ───────────────────────────────────────────────────────────────────

data class SearchResult(
    val id: String,
    val type: String,
    val title: String,
    val description: String,
    val icon: String,
    val category: String,
    val deepLink: String,
    val score: Double
)

// ─── ViewModel ────────────────────────────────────────────────────────────────

class AISearchViewModel : ViewModel() {

    private val bffBase = "http://10.0.2.2:4000" // Android emulator localhost alias

    private val _query = MutableStateFlow("")
    val query: StateFlow<String> = _query.asStateFlow()

    private val _results = MutableStateFlow<List<SearchResult>>(emptyList())
    val results: StateFlow<List<SearchResult>> = _results.asStateFlow()

    val groupedResults: StateFlow<List<Pair<String, List<SearchResult>>>> =
        _results.map { list -> buildGroups(list) }.stateIn(
            viewModelScope, SharingStarted.Eagerly, emptyList()
        )

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _hasSearched = MutableStateFlow(false)
    val hasSearched: StateFlow<Boolean> = _hasSearched.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    val suggestions = listOf(
        "🌙" to "朝朝寶", "💰" to "低風險理財", "💳" to "信用卡",
        "💵" to "借錢", "💹" to "基金", "🥇" to "基金榜單"
    )

    private var debounceJob: Job? = null

    fun onQueryChange(value: String) {
        _query.value = value
        debounceJob?.cancel()
        if (value.isBlank()) {
            _results.value = emptyList()
            _hasSearched.value = false
            _error.value = null
            return
        }
        debounceJob = viewModelScope.launch {
            delay(350)
            search(value)
        }
    }

    fun search(q: String = _query.value) {
        if (q.isBlank()) return
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            TealiumClient.track(
                "hsbc_mobile_android", "ai_search_query", "Search",
                "search_submitted", screen = "ai_search", journey = "wealth_hub",
                custom = mapOf("search_query" to q)
            )
            try {
                val body = JSONObject().apply {
                    put("query", q); put("limit", 10)
                }.toString()
                val conn = URL("$bffBase/api/v1/search").openConnection() as java.net.HttpURLConnection
                conn.apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json")
                    doOutput = true
                    connectTimeout = 5000; readTimeout = 8000
                    outputStream.write(body.toByteArray())
                }
                val responseBody = conn.inputStream.bufferedReader().readText()
                val json = JSONObject(responseBody)
                val arr = json.getJSONArray("results")
                val items = (0 until arr.length()).map { i ->
                    val o = arr.getJSONObject(i)
                    SearchResult(
                        id = o.getString("id"),
                        type = o.getString("type"),
                        title = o.getString("title"),
                        description = o.getString("description"),
                        icon = o.getString("icon"),
                        category = o.getString("category"),
                        deepLink = o.getString("deepLink"),
                        score = o.getDouble("score")
                    )
                }
                _results.value = items
                _hasSearched.value = true
            } catch (e: Exception) {
                _error.value = "搜尋服務暫時不可用，請稍後重試。"
                _results.value = emptyList()
            } finally {
                _isLoading.value = false
            }
        }
    }

    private fun buildGroups(items: List<SearchResult>): List<Pair<String, List<SearchResult>>> {
        val order = mutableListOf<String>()
        val map = mutableMapOf<String, MutableList<SearchResult>>()
        for (item in items) {
            if (!map.containsKey(item.category)) order.add(item.category)
            map.getOrPut(item.category) { mutableListOf() }.add(item)
        }
        return order.map { it to map[it]!! }
    }
}

// ─── Root composable ──────────────────────────────────────────────────────────

@Composable
fun AISearchScreen(
    onDismiss: () -> Unit,
    viewModel: AISearchViewModel = remember { AISearchViewModel() }
) {
    val context = LocalContext.current
    val query by viewModel.query.collectAsState()
    val groupedResults by viewModel.groupedResults.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val hasSearched by viewModel.hasSearched.collectAsState()
    val error by viewModel.error.collectAsState()
    val focusRequester = remember { FocusRequester() }

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
        TealiumClient.track("hsbc_mobile_android", "ai_search_opened", "Search",
            "search_screen_viewed", screen = "ai_search", journey = "wealth_hub")
    }

    Column(modifier = Modifier.fillMaxSize().background(N50)) {
        // ── Search bar ────────────────────────────────────────────────────────
        Row(
            modifier = Modifier.fillMaxWidth().background(White)
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(20.dp))
                    .background(N100)
                    .padding(horizontal = 12.dp, vertical = 2.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = HsbcRed
                    )
                } else {
                    Icon(Icons.Default.Search, contentDescription = null,
                        tint = N400, modifier = Modifier.size(18.dp))
                }
                Spacer(Modifier.width(8.dp))
                TextField(
                    value = query,
                    onValueChange = viewModel::onQueryChange,
                    placeholder = { Text("搜尋功能、產品", fontSize = 14.sp, color = N400) },
                    singleLine = true,
                    modifier = Modifier.weight(1f).focusRequester(focusRequester),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent
                    ),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                    keyboardActions = KeyboardActions(onSearch = {
                        viewModel.search(query)
                    }),
                    textStyle = LocalTextStyle.current.copy(fontSize = 14.sp, color = N900)
                )
                AnimatedVisibility(visible = query.isNotEmpty()) {
                    IconButton(onClick = { viewModel.onQueryChange("") },
                        modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Clear, contentDescription = "清除",
                            tint = N400, modifier = Modifier.size(16.dp))
                    }
                }
            }

            TextButton(onClick = {
                TealiumClient.track("hsbc_mobile_android", "ai_search_cancelled", "Search",
                    "search_cancelled", screen = "ai_search", journey = "wealth_hub")
                onDismiss()
            }) {
                Text("取消", fontSize = 14.sp, color = HsbcRed)
            }
        }

        Divider(color = N100)

        // ── Body ──────────────────────────────────────────────────────────────
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 32.dp)
        ) {
            if (query.isBlank()) {
                // Suggestions
                item { SuggestionsSection(viewModel.suggestions) { chip ->
                    viewModel.onQueryChange(chip)
                    viewModel.search(chip)
                } }
            } else if (hasSearched && groupedResults.isEmpty()) {
                item { EmptyState(query, error) }
            } else {
                item {
                    Text("找到 ${groupedResults.sumOf { it.second.size }} 個相關結果",
                        fontSize = 11.sp, color = N400,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp))
                }
                groupedResults.forEach { (category, items) ->
                    item {
                        Text(category, fontSize = 11.sp, fontWeight = FontWeight.SemiBold,
                            color = N500,
                            modifier = Modifier.fillMaxWidth()
                                .background(N50)
                                .padding(horizontal = 16.dp, vertical = 6.dp))
                    }
                    items(items) { result ->
                        SearchResultRow(result) {
                            TealiumClient.track("hsbc_mobile_android", "ai_search_result_tapped",
                                "Search", "result_selected", label = result.title,
                                screen = "ai_search", journey = "wealth_hub",
                                custom = mapOf("result_id" to result.id,
                                    "result_type" to result.type,
                                    "deep_link" to result.deepLink,
                                    "search_query" to query))
                            onDismiss()
                            try {
                                context.startActivity(
                                    Intent(Intent.ACTION_VIEW, Uri.parse(result.deepLink))
                                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                            } catch (_: Exception) {}
                        }
                        if (result != items.last()) {
                            Divider(modifier = Modifier.padding(start = 72.dp), color = N100)
                        }
                    }
                }
            }
        }
    }
}

// ─── Suggestions section ──────────────────────────────────────────────────────

@Composable
private fun SuggestionsSection(
    suggestions: List<Pair<String, String>>,
    onChipTap: (String) -> Unit
) {
    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("熱門搜尋", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = N500)

        val chunked = suggestions.chunked(3)
        chunked.forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { (icon, label) ->
                    Surface(
                        modifier = Modifier.weight(1f).clickable { onChipTap(label) },
                        shape = RoundedCornerShape(18.dp),
                        color = White,
                        shadowElevation = 2.dp
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(icon, fontSize = 14.sp)
                            Spacer(Modifier.width(6.dp))
                            Text(label, fontSize = 12.sp, color = N700)
                        }
                    }
                }
                // fill remaining slots so chips are equal-width
                repeat(3 - row.size) { Spacer(Modifier.weight(1f)) }
            }
        }

        // AI hint
        Row(
            modifier = Modifier.fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(Color(0xFFE0F2FE))
                .padding(12.dp),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text("✨", fontSize = 16.sp)
            Text("智能語意搜尋 — 試試「低風險穩定回報」或「咖啡優惠」",
                fontSize = 11.sp, color = Color(0xFF0369A1), lineHeight = 16.sp)
        }
    }
}

// ─── Single result row ────────────────────────────────────────────────────────

@Composable
private fun SearchResultRow(result: SearchResult, onTap: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().background(White)
            .clickable { onTap() }
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier.size(44.dp).clip(RoundedCornerShape(10.dp))
                .background(typeColor(result.type).copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) { Text(result.icon, fontSize = 20.sp) }

        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(result.title, fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
                color = N900, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(result.description, fontSize = 11.sp, color = N500,
                maxLines = 2, overflow = TextOverflow.Ellipsis, lineHeight = 15.sp)
        }

        TypeBadge(result.type)
    }
}

@Composable
private fun TypeBadge(type: String) {
    val (label, color) = when (type) {
        "product"  -> "產品" to Color(0xFF22C55E)
        "ranking"  -> "榜單" to Color(0xFFF59E0B)
        "deal"     -> "優惠" to Color(0xFFEC4899)
        "campaign" -> "活動" to Color(0xFF8B5CF6)
        else       -> "功能" to HsbcRed
    }
    Box(
        modifier = Modifier.clip(RoundedCornerShape(8.dp))
            .background(color.copy(alpha = 0.12f))
            .padding(horizontal = 7.dp, vertical = 3.dp)
    ) {
        Text(label, fontSize = 9.sp, fontWeight = FontWeight.SemiBold, color = color)
    }
}

private fun typeColor(type: String): Color = when (type) {
    "product"  -> Color(0xFF22C55E)
    "ranking"  -> Color(0xFFF59E0B)
    "deal"     -> Color(0xFFEC4899)
    "campaign" -> Color(0xFF8B5CF6)
    else       -> HsbcRed
}

// ─── Empty state ──────────────────────────────────────────────────────────────

@Composable
private fun EmptyState(query: String, error: String?) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(top = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("🔍", fontSize = 40.sp)
        Text("找不到「$query」的相關結果",
            fontSize = 14.sp, fontWeight = FontWeight.SemiBold,
            color = N700, textAlign = TextAlign.Center)
        Text("試試其他關鍵詞，或瀏覽下方熱門搜尋",
            fontSize = 12.sp, color = N400, textAlign = TextAlign.Center)
        if (error != null) {
            Text(error, fontSize = 11.sp, color = HsbcRed, textAlign = TextAlign.Center)
        }
    }
}
