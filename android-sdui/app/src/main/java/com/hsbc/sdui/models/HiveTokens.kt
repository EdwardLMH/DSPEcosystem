package com.hsbc.sdui.models

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ---------------------------------------------------------------------------
// Hive Design Token stubs — no external Hive library is present in this
// Android module, so all tokens are defined here as plain Kotlin objects.
// Values mirror the HSBC Hive design system specification.
// ---------------------------------------------------------------------------

object HiveColor {
    object Brand {
        val Primary = Color(0xFFC41230)   // HSBC Red
        val White   = Color.White
    }
    object Neutral {
        val N300 = Color(0xFFCCCCCC)
        val N400 = Color(0xFF999999)
        val N500 = Color(0xFF666666)
        val N700 = Color(0xFF333333)
        val N800 = Color(0xFF1A1A1A)
        val N900 = Color(0xFF0A0A0A)
    }
    object Semantic {
        val Error   = Color(0xFFCC0000)
        val Success = Color(0xFF2D7D46)
    }
}

object HiveSpacing {
    val s1: Dp = 4.dp
    val s2: Dp = 8.dp
    val s3: Dp = 12.dp
    val s4: Dp = 16.dp
    val s5: Dp = 24.dp
    val s6: Dp = 32.dp
}

object HiveTypography {
    val bodyBase  = TextStyle(fontSize = 15.sp, fontWeight = FontWeight.Normal)
    val labelBase = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Medium)
    val caption   = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Normal)
    val titleBase = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
}

object HiveBorderRadius {
    val full: Dp = 100.dp
    val md: Dp   = 8.dp
    val sm: Dp   = 4.dp
}

object HiveElevation {
    val navBar: Dp = 4.dp
}

object HiveComponent {
    object Input {
        val height: Dp        = 52.dp
        val borderRadius: Dp  = 8.dp
        val paddingH: Dp      = 16.dp
        val paddingV: Dp      = 14.dp
        val bgColor           = Color.White
        val borderColor       = Color(0xFFCCCCCC)
        val focusColor        = Color(0xFFC41230)
        val errorColor        = Color(0xFFCC0000)
    }
    object Button {
        val height: Dp        = 52.dp
        val borderRadius: Dp  = 8.dp
        val paddingH: Dp      = 24.dp
        val bgColor           = Color(0xFFC41230)
        val textColor         = Color.White
        val textStyle         = TextStyle(fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
    }
    object ProgressBar {
        val height: Dp    = 4.dp
        val fillColor     = Color(0xFFC41230)
        val trackColor    = Color(0xFFE5E5E5)
    }
}
