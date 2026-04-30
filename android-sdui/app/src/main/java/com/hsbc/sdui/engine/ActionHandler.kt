package com.hsbc.sdui.engine

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import com.hsbc.sdui.analytics.AnalyticsClient
import com.hsbc.sdui.models.ActionDefinition
import com.hsbc.sdui.models.ActionType

class ActionHandler(private val context: Context, private val navigator: Navigator) {

    fun handle(action: ActionDefinition) {
        when (action.type) {
            ActionType.NAVIGATE  -> navigator.navigate(action.destination ?: return, action.params)
            ActionType.DEEP_LINK -> openDeepLink(action.destination ?: return)
            ActionType.API_CALL  -> performApiCall(action.destination ?: return, action.payload)
            ActionType.TRACK     -> AnalyticsClient.fire(action.destination ?: return, action.params ?: emptyMap())
            ActionType.SHARE     -> shareContent(action.destination, action.params)
            ActionType.MODAL     -> Log.d("ActionHandler", "MODAL action — not implemented: ${action.destination}")
        }
    }

    private fun openDeepLink(url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    private fun performApiCall(endpoint: String, payload: Map<String, Any?>?) {
        // Fire-and-forget API call. Implement with your Retrofit service as needed.
        Log.d("ActionHandler", "API_CALL action — endpoint: $endpoint, payload: $payload")
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
