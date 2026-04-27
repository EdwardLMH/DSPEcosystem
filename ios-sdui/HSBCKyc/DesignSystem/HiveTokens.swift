import SwiftUI

// HIVE Design Tokens — mirrors hive-tokens/swift/HiveTokens.swift
enum Hive {
    enum Color {
        static let brandPrimary      = SwiftUI.Color(hex: "#DB0011")
        static let brandPrimaryLight = SwiftUI.Color(hex: "#F5E6E7")
        static let brandPrimaryDark  = SwiftUI.Color(hex: "#A6000D")
        static let brandWhite        = SwiftUI.Color.white
        static let success           = SwiftUI.Color(hex: "#007A4D")
        static let successLight      = SwiftUI.Color(hex: "#E6F4EF")
        static let error             = SwiftUI.Color(hex: "#DB0011")
        static let errorLight        = SwiftUI.Color(hex: "#F5E6E7")
        static let info              = SwiftUI.Color(hex: "#005EB8")
        static let infoLight         = SwiftUI.Color(hex: "#E6EFF9")
        static let warning           = SwiftUI.Color(hex: "#B45309")
        static let n50               = SwiftUI.Color(hex: "#F8F8F8")
        static let n100              = SwiftUI.Color(hex: "#F0F0F0")
        static let n200              = SwiftUI.Color(hex: "#E0E0E0")
        static let n300              = SwiftUI.Color(hex: "#CCCCCC")
        static let n400              = SwiftUI.Color(hex: "#999999")
        static let n500              = SwiftUI.Color(hex: "#767676")
        static let n600              = SwiftUI.Color(hex: "#595959")
        static let n700              = SwiftUI.Color(hex: "#3D3D3D")
        static let n800              = SwiftUI.Color(hex: "#222222")
        static let jade              = SwiftUI.Color(hex: "#C9A84C")
    }

    enum Spacing {
        static let s1: CGFloat  =  4
        static let s2: CGFloat  =  8
        static let s3: CGFloat  = 12
        static let s4: CGFloat  = 16
        static let s5: CGFloat  = 20
        static let s6: CGFloat  = 24
        static let s8: CGFloat  = 32
        static let s10: CGFloat = 40
        static let s12: CGFloat = 48
    }

    enum Radius {
        static let sm:   CGFloat =  4
        static let base: CGFloat =  6
        static let md:   CGFloat =  8
        static let lg:   CGFloat = 12
        static let xl:   CGFloat = 16
        static let full: CGFloat = 9999
    }

    enum Typography {
        static let displayLarge  = Font.system(size: 32, weight: .bold)
        static let headingXL     = Font.system(size: 28, weight: .semibold)
        static let headingLg     = Font.system(size: 24, weight: .semibold)
        static let headingMd     = Font.system(size: 20, weight: .semibold)
        static let headingSm     = Font.system(size: 18, weight: .semibold)
        static let bodyLg        = Font.system(size: 18, weight: .regular)
        static let bodyBase      = Font.system(size: 16, weight: .regular)
        static let bodySm        = Font.system(size: 14, weight: .regular)
        static let labelBase     = Font.system(size: 13, weight: .semibold)
        static let caption       = Font.system(size: 11, weight: .regular)
        static let buttonLabel   = Font.system(size: 16, weight: .semibold)
        static let monoBase      = Font.system(size: 16, weight: .regular, design: .monospaced)
    }

    enum Shadow {
        static func base() -> some View { EmptyView() }
    }

    enum Component {
        enum Button {
            static let height:     CGFloat = 52
            static let paddingH:   CGFloat = 24
            static let radius:     CGFloat = Radius.base
        }
        enum Input {
            static let height:     CGFloat = 52
            static let paddingH:   CGFloat = 16
            static let radius:     CGFloat = Radius.base
            static let border:     CGFloat = 1
        }
    }
}

// MARK: - Color hex init

extension SwiftUI.Color {
    init(hex: String) {
        let h = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: h).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch h.count {
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:(a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB,
                  red:     Double(r) / 255,
                  green:   Double(g) / 255,
                  blue:    Double(b) / 255,
                  opacity: Double(a) / 255)
    }
}

// MARK: - Shared Input Style

struct HiveInputStyle: ViewModifier {
    let isFocused: Bool
    let hasError: Bool

    func body(content: Content) -> some View {
        content
            .font(Hive.Typography.bodyBase)
            .padding(.horizontal, Hive.Spacing.s4)
            .frame(height: Hive.Component.Input.height)
            .background(Hive.Color.brandWhite)
            .overlay(
                RoundedRectangle(cornerRadius: Hive.Component.Input.radius)
                    .stroke(
                        hasError ? Hive.Color.error
                            : isFocused ? Hive.Color.brandPrimary
                            : Hive.Color.n300,
                        lineWidth: isFocused ? 2 : 1
                    )
            )
            .cornerRadius(Hive.Component.Input.radius)
    }
}

extension View {
    func hiveInput(focused: Bool = false, error: Bool = false) -> some View {
        modifier(HiveInputStyle(isFocused: focused, hasError: error))
    }
}

// MARK: - Primary Button Style

struct HivePrimaryButtonStyle: ButtonStyle {
    var isLoading: Bool = false

    func makeBody(configuration: Configuration) -> some View {
        HStack {
            if isLoading {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    .scaleEffect(0.8)
            }
            configuration.label
        }
        .frame(maxWidth: .infinity)
        .frame(height: Hive.Component.Button.height)
        .background(configuration.isPressed ? Hive.Color.brandPrimaryDark : Hive.Color.brandPrimary)
        .foregroundColor(.white)
        .font(Hive.Typography.buttonLabel)
        .cornerRadius(Hive.Component.Button.radius)
        .scaleEffect(configuration.isPressed ? 0.98 : 1)
        .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

// MARK: - Field Label

struct HiveFieldLabel: View {
    let text: String
    var required: Bool = false

    var body: some View {
        HStack(spacing: 2) {
            Text(text)
                .font(Hive.Typography.labelBase)
                .foregroundColor(Hive.Color.n700)
            if required {
                Text("*")
                    .font(Hive.Typography.labelBase)
                    .foregroundColor(Hive.Color.error)
            }
        }
    }
}

// MARK: - Section Badge

struct HiveSectionBadge: View {
    let label: String

    var body: some View {
        Text(label)
            .font(Hive.Typography.caption)
            .fontWeight(.semibold)
            .foregroundColor(Hive.Color.brandPrimary)
            .padding(.horizontal, Hive.Spacing.s3)
            .padding(.vertical, 3)
            .background(Hive.Color.brandPrimaryLight)
            .cornerRadius(Hive.Radius.full)
    }
}

// MARK: - Error Text

struct HiveErrorText: View {
    let message: String

    var body: some View {
        Text(message)
            .font(Hive.Typography.caption)
            .foregroundColor(Hive.Color.error)
    }
}

// MARK: - Help Text

struct HiveHelpText: View {
    let message: String

    var body: some View {
        Text(message)
            .font(Hive.Typography.caption)
            .foregroundColor(Hive.Color.n500)
    }
}

// MARK: - Info Banner

struct HiveInfoBanner: View {
    let title: String
    let body: String

    var body: some View {
        VStack(alignment: .leading, spacing: Hive.Spacing.s1) {
            Text(title)
                .font(Hive.Typography.labelBase)
                .foregroundColor(Hive.Color.info)
            Text(body)
                .font(Hive.Typography.bodySm)
                .foregroundColor(Hive.Color.n700)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(Hive.Spacing.s4)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Hive.Color.infoLight)
        .overlay(
            RoundedRectangle(cornerRadius: Hive.Radius.md)
                .stroke(Hive.Color.info, lineWidth: 1)
        )
        .cornerRadius(Hive.Radius.md)
    }
}
