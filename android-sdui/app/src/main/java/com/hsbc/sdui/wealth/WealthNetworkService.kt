package com.hsbc.sdui.wealth

import com.google.gson.annotations.SerializedName
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET

// Android emulator loopback to host machine mock BFF on port 4000
private const val BASE_URL = "http://10.0.2.2:4000/api/v1/"

// ─── DTOs matching GET /api/v1/screen/home-wealth-hk ──────────────────────────

data class WealthSlice(
    @SerializedName("instanceId") val instanceId: String,
    @SerializedName("type")       val type: String,
    @SerializedName("props")      val props: Map<String, Any?> = emptyMap(),
    @SerializedName("visible")    val visible: Boolean = true,
    @SerializedName("locked")     val locked: Boolean = false,
)

data class WealthLayout(
    @SerializedName("type")     val type: String,
    @SerializedName("children") val children: List<WealthSlice> = emptyList(),
)

data class WealthScreenPayload(
    @SerializedName("schemaVersion") val schemaVersion: String,
    @SerializedName("screen")        val screen: String,
    @SerializedName("ttl")           val ttl: Int,
    @SerializedName("metadata")      val metadata: Map<String, Any?>,
    @SerializedName("layout")        val layout: WealthLayout,
)

// ─── Retrofit interface ────────────────────────────────────────────────────────

interface WealthApi {
    @GET("screen/home-wealth-hk")
    suspend fun fetchWealthScreen(): WealthScreenPayload
}

object WealthNetworkService {
    val api: WealthApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(WealthApi::class.java)
    }
}
