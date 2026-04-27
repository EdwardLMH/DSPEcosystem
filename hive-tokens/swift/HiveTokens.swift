import Foundation
import SwiftUI

// ─────────────────────────────────────────────────────────────────────────────
// HSBC HIVE Design Tokens — Swift / SwiftUI
// Generated from hive-tokens.json v2.1.0
//
// NOTE: Approximate HIVE-compatible structure based on HSBC brand guidelines.
// Validate against official Figma HIVE library before production use.
//
// Usage:
//   .foregroundColor(HiveColor.brand.primary)
//   .padding(HiveSpacing.s4)
//   .font(HiveTypography.bodyBase)
// ─────────────────────────────────────────────────────────────────────────────

// MARK: - Color

public enum HiveColor {
    public enum brand {
        public static let primary      = Color(hex: "#DB0011")
        public static let primaryDark  = Color(hex: "#A6000D")
        public static let primaryLight = Color(hex: "#F5E6E7")
        public static let secondary    = Color(hex: "#000000")
        public static let white        = Color(hex: "#FFFFFF")
    }
    public enum semantic {
        public static let success      = Color(hex: "#007A4D")
        public static let successLight = Color(hex: "#E6F4EF")
        public static let warning      = Color(hex: "#B45309")
        public static let warningLight = Color(hex: "#FEF3C7")
        public static let error        = Color(hex: "#DB0011")
        public static let errorLight   = Color(hex: "#F5E6E7")
        public static let info         = Color(hex: "#005EB8")
        public static let infoLight    = Color(hex: "#E6EFF9")
    }
    public enum neutral {
        public static let n0   = Color(hex: "#FFFFFF")
        public static let n50  = Color(hex: "#F8F8F8")
        public static let n100 = Color(hex: "#F0F0F0")
        public static let n200 = Color(hex: "#E0E0E0")
        public static let n300 = Color(hex: "#CCCCCC")
        public static let n400 = Color(hex: "#999999")
        public static let n500 = Color(hex: "#767676")
        public static let n600 = Color(hex: "#595959")
        public static let n700 = Color(hex: "#3D3D3D")
        public static let n800 = Color(hex: "#222222")
        public static let n900 = Color(hex: "#000000")
    }
    public enum jade {
        public static let base    = Color(hex: "#C9A84C")
        public static let dark    = Color(hex: "#9A7A2E")
        public static let light   = Color(hex: "#F7F0DC")
        public static let surface = Color(hex: "#1D1D1B")
    }
    public enum premier {
        public static let base  = Color(hex: "#005EB8")
        public static let light = Color(hex: "#E6EFF9")
    }
}

// MARK: - Typography

public enum HiveTypography {
    // Font sizes as CGFloat (points — iOS uses pt, same as px on 1x screen)
    public enum fontSize {
        public static let xs:   CGFloat = 11
        public static let sm:   CGFloat = 13
        public static let base: CGFloat = 16
        public static let md:   CGFloat = 18
        public static let lg:   CGFloat = 20
        public static let xl:   CGFloat = 24
        public static let xxl:  CGFloat = 28
        public static let xxxl: CGFloat = 32
    }
    public enum fontWeight {
        public static let regular  = Font.Weight.regular
        public static let medium   = Font.Weight.medium
        public static let semibold = Font.Weight.semibold
        public static let bold     = Font.Weight.bold
    }
    // Convenience Font styles
    public static let displayLarge   = Font.custom("UniversNext", size: 40).weight(.bold)
    public static let displayMedium  = Font.custom("UniversNext", size: 32).weight(.bold)
    public static let headingXL      = Font.custom("UniversNext", size: 28).weight(.semibold)
    public static let headingLg      = Font.custom("UniversNext", size: 24).weight(.semibold)
    public static let headingMd      = Font.custom("UniversNext", size: 20).weight(.semibold)
    public static let headingSm      = Font.custom("UniversNext", size: 18).weight(.semibold)
    public static let bodyBase       = Font.custom("UniversNext", size: 16).weight(.regular)
    public static let bodyMd         = Font.custom("UniversNext", size: 18).weight(.regular)
    public static let bodySm         = Font.custom("UniversNext", size: 13).weight(.regular)
    public static let labelBase      = Font.custom("UniversNext", size: 13).weight(.semibold)
    public static let caption        = Font.custom("UniversNext", size: 11).weight(.regular)
    public static let buttonLabel    = Font.custom("UniversNext", size: 16).weight(.semibold)
    public static let monoBase       = Font.custom("Courier New", size: 16).weight(.regular)
}

// MARK: - Spacing

public enum HiveSpacing {
    public static let s0:  CGFloat = 0
    public static let s1:  CGFloat = 4
    public static let s2:  CGFloat = 8
    public static let s3:  CGFloat = 12
    public static let s4:  CGFloat = 16  // base unit
    public static let s5:  CGFloat = 20
    public static let s6:  CGFloat = 24
    public static let s8:  CGFloat = 32
    public static let s10: CGFloat = 40
    public static let s12: CGFloat = 48
    public static let s16: CGFloat = 64
    public static let s20: CGFloat = 80
}

// MARK: - Border Radius

public enum HiveBorderRadius {
    public static let none: CGFloat = 0
    public static let sm:   CGFloat = 4
    public static let base: CGFloat = 6
    public static let md:   CGFloat = 8
    public static let lg:   CGFloat = 12
    public static let xl:   CGFloat = 16
    public static let full: CGFloat = 9999
}

// MARK: - Shadow

public struct HiveShadow {
    public let color: Color
    public let radius: CGFloat
    public let x: CGFloat
    public let y: CGFloat
}

public enum HiveShadows {
    public static let sm   = HiveShadow(color: .black.opacity(0.08), radius: 3,  x: 0, y: 1)
    public static let base = HiveShadow(color: .black.opacity(0.07), radius: 6,  x: 0, y: 4)
    public static let md   = HiveShadow(color: .black.opacity(0.08), radius: 16, x: 0, y: 8)
    public static let lg   = HiveShadow(color: .black.opacity(0.10), radius: 32, x: 0, y: 16)
    public static let navBar = HiveShadow(color: .black.opacity(0.06), radius: 8, x: 0, y: -2)
}

// MARK: - Animation

public enum HiveAnimation {
    public static let fast:   Animation = .easeInOut(duration: 0.15)
    public static let base:   Animation = .easeInOut(duration: 0.20)
    public static let slow:   Animation = .easeInOut(duration: 0.30)
    public static let slower: Animation = .easeInOut(duration: 0.50)
}

// MARK: - Component Tokens

public enum HiveComponent {
    public enum button {
        public static let height:       CGFloat = 48
        public static let heightSm:     CGFloat = 36
        public static let paddingH:     CGFloat = 24
        public static let paddingHSm:   CGFloat = 16
        public static let borderRadius: CGFloat = HiveBorderRadius.base
        public static let font:         Font    = HiveTypography.buttonLabel
    }
    public enum input {
        public static let height:       CGFloat = 52
        public static let paddingH:     CGFloat = 16
        public static let paddingV:     CGFloat = 14
        public static let borderRadius: CGFloat = HiveBorderRadius.base
        public static let font:         Font    = HiveTypography.bodyBase
        public static let borderColor:  Color   = HiveColor.neutral.n300
        public static let focusColor:   Color   = HiveColor.brand.primary
        public static let errorColor:   Color   = HiveColor.semantic.error
        public static let bgColor:      Color   = HiveColor.brand.white
        public static let labelFont:    Font    = HiveTypography.labelBase
    }
    public enum card {
        public static let borderRadius: CGFloat = HiveBorderRadius.md
        public static let padding:      CGFloat = HiveSpacing.s6
        public static let shadow:       HiveShadow = HiveShadows.base
        public static let bgColor:      Color   = HiveColor.brand.white
    }
    public enum progressBar {
        public static let height:      CGFloat = 4
        public static let radius:      CGFloat = HiveBorderRadius.full
        public static let trackColor:  Color   = HiveColor.neutral.n200
        public static let fillColor:   Color   = HiveColor.brand.primary
    }
}

// MARK: - View Modifier Helpers

public extension View {
    func hiveCard() -> some View {
        self
            .padding(HiveComponent.card.padding)
            .background(HiveComponent.card.bgColor)
            .cornerRadius(HiveComponent.card.borderRadius)
            .shadow(
                color: HiveComponent.card.shadow.color,
                radius: HiveComponent.card.shadow.radius,
                x: HiveComponent.card.shadow.x,
                y: HiveComponent.card.shadow.y
            )
    }

    func hivePrimaryButton(disabled: Bool = false) -> some View {
        self
            .frame(height: HiveComponent.button.height)
            .padding(.horizontal, HiveComponent.button.paddingH)
            .background(disabled ? HiveColor.neutral.n300 : HiveColor.brand.primary)
            .foregroundColor(HiveColor.brand.white)
            .cornerRadius(HiveComponent.button.borderRadius)
            .font(HiveComponent.button.font)
    }
}

// MARK: - Color Hex Initialiser

public extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:(a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB,
                  red:   Double(r) / 255,
                  green: Double(g) / 255,
                  blue:  Double(b) / 255,
                  opacity: Double(a) / 255)
    }
}
