package com.hsbc.hive.tokens

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * HSBC HIVE Design Tokens — Kotlin / Jetpack Compose
 * Generated from hive-tokens.json v2.1.0
 *
 * NOTE: Approximate HIVE-compatible structure based on HSBC brand guidelines.
 * Validate against official Figma HIVE library before production use.
 *
 * Usage:
 *   color = HiveColor.Brand.Primary
 *   modifier = Modifier.padding(HiveSpacing.s4)
 *   style = HiveTypography.bodyBase
 */

// ─── Color ────────────────────────────────────────────────────────────────────

object HiveColor {
    object Brand {
        val Primary      = Color(0xFFDB0011)
        val PrimaryDark  = Color(0xFFA6000D)
        val PrimaryLight = Color(0xFFF5E6E7)
        val Secondary    = Color(0xFF000000)
        val White        = Color(0xFFFFFFFF)
    }
    object Semantic {
        val Success      = Color(0xFF007A4D)
        val SuccessLight = Color(0xFFE6F4EF)
        val Warning      = Color(0xFFB45309)
        val WarningLight = Color(0xFFFEF3C7)
        val Error        = Color(0xFFDB0011)
        val ErrorLight   = Color(0xFFF5E6E7)
        val Info         = Color(0xFF005EB8)
        val InfoLight    = Color(0xFFE6EFF9)
    }
    object Neutral {
        val N0   = Color(0xFFFFFFFF)
        val N50  = Color(0xFFF8F8F8)
        val N100 = Color(0xFFF0F0F0)
        val N200 = Color(0xFFE0E0E0)
        val N300 = Color(0xFFCCCCCC)
        val N400 = Color(0xFF999999)
        val N500 = Color(0xFF767676)
        val N600 = Color(0xFF595959)
        val N700 = Color(0xFF3D3D3D)
        val N800 = Color(0xFF222222)
        val N900 = Color(0xFF000000)
    }
    object Jade {
        val Base    = Color(0xFFC9A84C)
        val Dark    = Color(0xFF9A7A2E)
        val Light   = Color(0xFFF7F0DC)
        val Surface = Color(0xFF1D1D1B)
    }
    object Premier {
        val Base  = Color(0xFF005EB8)
        val Light = Color(0xFFE6EFF9)
    }
}

// ─── Typography ───────────────────────────────────────────────────────────────

// UniversNext must be bundled as a font asset. Falls back to sans-serif.
private val UniversNext = FontFamily(
    Font(resId = 0, weight = FontWeight.Normal),    // replace 0 with R.font.universnext_regular
    Font(resId = 0, weight = FontWeight.Medium),
    Font(resId = 0, weight = FontWeight.SemiBold),
    Font(resId = 0, weight = FontWeight.Bold)
)

object HiveTypography {
    val displayLarge  = TextStyle(fontFamily = UniversNext, fontWeight = FontWeight.Bold,   fontSize = 40.sp, lineHeight = 48.sp)
    val displayMedium = TextStyle(fontFamily = UniversNext, fontWeight = FontWeight.Bold,   fontSize = 32.sp, lineHeight = 40.sp)
    val headingXL     = TextStyle(fontFamily = UniversNext, fontWeight = FontWeight.SemiBold, fontSize = 28.sp, lineHeight = 36.sp)
    val headingLg     = TextStyle(fontFamily = UniversNext, fontWeight = FontWeight.SemiBold, fontSize = 24.sp, lineHeight = 32.sp)
    val headingMd     = TextStyle(fontFamily = UniversNext, fontWeight = FontWeight.SemiBold, fontSize = 20.sp, lineHeight = 28.sp)
    val headingSm     = TextStyle(fontFamily = UniversNext, fontWeight = FontWeight.SemiBold, fontSize = 18.sp, lineHeight = 26.sp)
    val bodyBase      = TextStyle(fontFamily = UniversNext, fontWeight = FontWeight.Normal,   fontSize = 16.sp, lineHeight = 24.sp)
    val bodyMd        = TextStyle(fontFamily = UniversNext, fontWeight = FontWeight.Normal,   fontSize = 18.sp, lineHeight = 28.sp)
    val bodySm        = TextStyle(fontFamily = UniversNext, fontWeight = FontWeight.Normal,   fontSize = 13.sp, lineHeight = 20.sp)
    val labelBase     = TextStyle(fontFamily = UniversNext, fontWeight = FontWeight.SemiBold, fontSize = 13.sp, lineHeight = 18.sp)
    val caption       = TextStyle(fontFamily = UniversNext, fontWeight = FontWeight.Normal,   fontSize = 11.sp, lineHeight = 16.sp)
    val buttonLabel   = TextStyle(fontFamily = UniversNext, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
    val monoBase      = TextStyle(fontFamily = FontFamily.Monospace,                          fontSize = 16.sp, lineHeight = 24.sp)
}

// ─── Spacing ──────────────────────────────────────────────────────────────────

object HiveSpacing {
    val s0:  Dp = 0.dp
    val s1:  Dp = 4.dp
    val s2:  Dp = 8.dp
    val s3:  Dp = 12.dp
    val s4:  Dp = 16.dp   // base unit
    val s5:  Dp = 20.dp
    val s6:  Dp = 24.dp
    val s8:  Dp = 32.dp
    val s10: Dp = 40.dp
    val s12: Dp = 48.dp
    val s16: Dp = 64.dp
    val s20: Dp = 80.dp
}

// ─── Border Radius ────────────────────────────────────────────────────────────

object HiveBorderRadius {
    val none: Dp = 0.dp
    val sm:   Dp = 4.dp
    val base: Dp = 6.dp
    val md:   Dp = 8.dp
    val lg:   Dp = 12.dp
    val xl:   Dp = 16.dp
    val full: Dp = 9999.dp
}

// ─── Shadow (Elevation approximation) ────────────────────────────────────────

object HiveElevation {
    val none: Dp = 0.dp
    val sm:   Dp = 2.dp
    val base: Dp = 4.dp
    val md:   Dp = 8.dp
    val lg:   Dp = 16.dp
    val navBar: Dp = 8.dp
}

// ─── Component Tokens ─────────────────────────────────────────────────────────

object HiveComponent {
    object Button {
        val height:       Dp          = 48.dp
        val heightSm:     Dp          = 36.dp
        val paddingH:     Dp          = 24.dp
        val paddingHSm:   Dp          = 16.dp
        val borderRadius: Dp          = HiveBorderRadius.base
        val textStyle:    TextStyle   = HiveTypography.buttonLabel
        val bgColor:      Color       = HiveColor.Brand.Primary
        val bgColorHover: Color       = HiveColor.Brand.PrimaryDark
        val textColor:    Color       = HiveColor.Brand.White
    }
    object Input {
        val height:       Dp        = 52.dp
        val paddingH:     Dp        = 16.dp
        val paddingV:     Dp        = 14.dp
        val borderRadius: Dp        = HiveBorderRadius.base
        val textStyle:    TextStyle = HiveTypography.bodyBase
        val borderColor:  Color     = HiveColor.Neutral.N300
        val focusColor:   Color     = HiveColor.Brand.Primary
        val errorColor:   Color     = HiveColor.Semantic.Error
        val bgColor:      Color     = HiveColor.Brand.White
        val labelStyle:   TextStyle = HiveTypography.labelBase
    }
    object Card {
        val borderRadius: Dp      = HiveBorderRadius.md
        val padding:      Dp      = HiveSpacing.s6
        val elevation:    Dp      = HiveElevation.base
        val bgColor:      Color   = HiveColor.Brand.White
    }
    object ProgressBar {
        val height:      Dp    = 4.dp
        val trackColor:  Color = HiveColor.Neutral.N200
        val fillColor:   Color = HiveColor.Brand.Primary
    }
}
