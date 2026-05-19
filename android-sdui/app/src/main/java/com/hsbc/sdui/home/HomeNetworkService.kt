package com.hsbc.sdui.home

import com.google.gson.annotations.SerializedName
import com.hsbc.sdui.analytics.ObservabilityClient
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET

// Android emulator loopback to host machine mock BFF on port 4000
private const val BASE_URL = "http://10.0.2.2:4000/api/v1/"

// ─── DTOs matching GET /api/v1/screen/home-hub-hk ──────────────────────────

data class HomeSlice(
    @SerializedName("instanceId") val instanceId: String,
    @SerializedName("type")       val type: String,
    @SerializedName("props")      val props: Map<String, Any?> = emptyMap(),
    @SerializedName("visible")    val visible: Boolean = true,
    @SerializedName("locked")     val locked: Boolean = false,
)

data class HomeLayout(
    @SerializedName("type")     val type: String,
    @SerializedName("children") val children: List<HomeSlice> = emptyList(),
)

data class HomeScreenPayload(
    @SerializedName("schemaVersion") val schemaVersion: String,
    @SerializedName("screen")        val screen: String,
    @SerializedName("ttl")           val ttl: Int,
    @SerializedName("metadata")      val metadata: Map<String, Any?>,
    @SerializedName("layout")        val layout: HomeLayout,
)

// ─── Retrofit interface ────────────────────────────────────────────────────────

interface HomeApi {
    @GET("screen/home-hub-hk")
    suspend fun fetchHomeScreen(): HomeScreenPayload
}

object HomeNetworkService {
    val api: HomeApi by lazy {
        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()
                    .addHeader("traceparent", ObservabilityClient.traceparent())
                    .addHeader("x-platform", "android")
                    .build()
                val started = System.nanoTime()
                try {
                    val response = chain.proceed(request)
                    ObservabilityClient.recordNetworkStep(
                        "sdui_screen_fetch",
                        (System.nanoTime() - started) / 1_000_000,
                        request.url.encodedPath,
                        response.isSuccessful
                    )
                    response
                } catch (e: Exception) {
                    ObservabilityClient.recordNetworkStep(
                        "sdui_screen_fetch",
                        (System.nanoTime() - started) / 1_000_000,
                        request.url.encodedPath,
                        false
                    )
                    throw e
                }
            }
            .build()
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(HomeApi::class.java)
    }
}
