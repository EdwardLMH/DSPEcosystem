package com.hsbc.sdui.kyc

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*

// Base URL — 10.0.2.2 is the Android emulator loopback to the host machine (port 4000 mock BFF)
private const val BASE_URL = "http://10.0.2.2:4000/api/v1/"

interface KYCApi {
    @POST("kyc/sessions/start")
    suspend fun startSession(
        @Header("x-platform") platform: String,
        @Body body: Map<String, String>
    ): StartSessionResponse

    @GET("kyc/sessions/{sessionId}/resume")
    suspend fun resume(
        @Path("sessionId") sessionId: String,
        @Header("x-platform") platform: String,
        @Header("x-sdui-version") sduiVersion: String = "2.3"
    ): SDUIScreenPayload

    @GET("kyc/sessions/{sessionId}/steps/{stepId}")
    suspend fun getStep(
        @Path("sessionId") sessionId: String,
        @Path("stepId") stepId: String,
        @Header("x-platform") platform: String,
        @Header("x-sdui-version") sduiVersion: String = "2.3"
    ): SDUIScreenPayload

    @POST("kyc/sessions/{sessionId}/steps/{stepId}/submit")
    suspend fun submitStep(
        @Path("sessionId") sessionId: String,
        @Path("stepId") stepId: String,
        @Body body: SubmitRequest
    ): SubmitResponse
}

object KYCNetworkService {
    val api: KYCApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(KYCApi::class.java)
    }
}
