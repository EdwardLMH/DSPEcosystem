package com.hsbc.sdui.engine

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hsbc.sdui.models.SDUIScreenCache
import com.hsbc.sdui.models.ScreenPayload
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Path

data class SDUIScreenState(
    val payload: ScreenPayload? = null,
    val isLoading: Boolean = true,
    val isStale: Boolean = false,
    val error: String? = null
)

class SDUIViewModel(
    private val screenId: String,
    private val userId: String,
    private val segmentId: String,
    private val locale: String,
    private val platform: String = "android",
    private val sduiVersion: String = "2.3",
    private val cache: SDUIScreenCache,
) : ViewModel() {

    private val _state = MutableStateFlow(SDUIScreenState())
    val state: StateFlow<SDUIScreenState> = _state

    private val api = Retrofit.Builder()
        .baseUrl(BFF_BASE_URL)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(SDUIApi::class.java)

    init { load() }

    private fun load() {
        viewModelScope.launch {
            _state.value = SDUIScreenState(isLoading = true)
            runCatching {
                api.getScreen(
                    screenId = screenId,
                    userId = userId,
                    segmentId = segmentId,
                    locale = locale,
                    platform = platform,
                    sduiVersion = sduiVersion
                )
            }.onSuccess { payload ->
                cache.save(screenId, payload)
                _state.value = SDUIScreenState(payload = payload, isLoading = false)
            }.onFailure { err ->
                val cached = cache.load(screenId)
                _state.value = SDUIScreenState(
                    payload = cached?.payload,
                    isLoading = false,
                    isStale = cached != null,
                    error = if (cached == null) err.message else null
                )
            }
        }
    }

    companion object {
        const val BFF_BASE_URL = "https://api.hsbc.com.hk/"
    }
}

interface SDUIApi {
    @GET("api/v1/screen/{screenId}")
    suspend fun getScreen(
        @Path("screenId") screenId: String,
        @Header("x-user-id") userId: String,
        @Header("x-segment") segmentId: String,
        @Header("x-locale") locale: String,
        @Header("x-platform") platform: String,
        @Header("x-sdui-version") sduiVersion: String,
    ): ScreenPayload
}
