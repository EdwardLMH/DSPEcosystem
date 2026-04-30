package com.hsbc.sdui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.hsbc.sdui.kyc.KYCRootScreen
import com.hsbc.sdui.wealth.WealthPageScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                HSBCTestApp()
            }
        }
    }
}

@Composable
fun HSBCTestApp() {
    var currentScreen by remember { mutableStateOf("kyc") }
    val HsbcRed = Color(0xFFC41230)

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = Color.White) {
                NavigationBarItem(
                    selected = currentScreen == "kyc",
                    onClick = { currentScreen = "kyc" },
                    icon = { Text("🪪") },
                    label = { Text("OBKYC") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = HsbcRed,
                        selectedTextColor = HsbcRed,
                        indicatorColor = Color(0xFFFFEEF0)
                    )
                )
                NavigationBarItem(
                    selected = currentScreen == "wealth",
                    onClick = { currentScreen = "wealth" },
                    icon = { Text("📈") },
                    label = { Text("Wealth") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = HsbcRed,
                        selectedTextColor = HsbcRed,
                        indicatorColor = Color(0xFFFFEEF0)
                    )
                )
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
            when (currentScreen) {
                "kyc"    -> KYCRootScreen()
                "wealth" -> WealthPageScreen()
            }
        }
    }
}
