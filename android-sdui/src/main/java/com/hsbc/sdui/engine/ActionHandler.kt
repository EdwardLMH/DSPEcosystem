package com.hsbc.sdui.engine

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.hsbc.sdui.analytics.AnalyticsClient
import com.hsbc.sdui.models.ActionDefinition

class ActionHandler(private val context: Context, private val navigator: Navigator) {

    fun handle(action: ActionDefinition) {
        when (action.type) {
            "NAVIGATE"  -> navigator.navigate(action.destination ?: return, action.params)
            "DEEP_LINK" -> openDeepLink(action.destination ?: return)
            "API_CALL"  -> performApiCall(action.destination ?: return, action.payload)
            "TRACK"     -> AnalyticsClient.fire(action.destination ?: return, action.params ?: emptyMap())
            "SHARE"     -> shareContent(action.destination, action.params)
            else        -> AnalyticsClient.log("sdui_unknown_action", mapOf("type" to action.type))
        }
    }

    private fun openDeepLink(url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    private fun performApiCall(endpoint: String, payload: Map<String, Any>?) {
        // Delegate to Retrofit service — fire-and-forget
        ApiCallService.post(endpoint, payload ?: emptyMap())
    }

    private fun shareContent(url: String?, params: Map<String, String>?) {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, url)
            putExtra(Intent.EXTRA_SUBJECT, params?.get("title") ?: "")
        }
        context.startActivity(Intent.createChooser(intent, "Share via"))
    }

    interface Navigator {
        fun navigate(destination: String, params: Map<String, String>?)
    }
}
