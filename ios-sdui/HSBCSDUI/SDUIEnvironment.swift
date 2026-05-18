import SwiftUI

// MARK: - Supported locales (mirrors OCDP/UCP SUPPORTED_LOCALES)

struct LocaleInfo: Identifiable {
    let id: String       // authoring code, e.g. "zh-HK"
    let label: String
    let bcp47: String    // HTML lang attribute value
    let isRTL: Bool
}

let SUPPORTED_LOCALES: [LocaleInfo] = [
    LocaleInfo(id: "en",    label: "English",   bcp47: "en",      isRTL: false),
    LocaleInfo(id: "zh-HK", label: "繁體中文（香港）",  bcp47: "zh-Hant-HK", isRTL: false),
    LocaleInfo(id: "zh-CN", label: "简体中文",  bcp47: "zh-Hans", isRTL: false),
    LocaleInfo(id: "ar",    label: "العربية",  bcp47: "ar",      isRTL: true),
    LocaleInfo(id: "es",    label: "Español",   bcp47: "es",      isRTL: false),
]

func localeInfo(for code: String) -> LocaleInfo {
    SUPPORTED_LOCALES.first { $0.id == code } ?? SUPPORTED_LOCALES[0]
}

// MARK: - Environment keys for locale + a11y propagation

private struct LocaleCodeKey: EnvironmentKey {
    static let defaultValue: String = "en"
}

private struct TextDirKey: EnvironmentKey {
    static let defaultValue: LayoutDirection = .leftToRight
}

private struct A11yReduceMotionKey: EnvironmentKey {
    static let defaultValue: Bool = false
}

private struct A11yHighContrastKey: EnvironmentKey {
    static let defaultValue: Bool = false
}

extension EnvironmentValues {
    var sduiLocale: String {
        get { self[LocaleCodeKey.self] }
        set { self[LocaleCodeKey.self] = newValue }
    }
    var sduiTextDir: LayoutDirection {
        get { self[TextDirKey.self] }
        set { self[TextDirKey.self] = newValue }
    }
    var sduiReduceMotion: Bool {
        get { self[A11yReduceMotionKey.self] }
        set { self[A11yReduceMotionKey.self] = newValue }
    }
    var sduiHighContrast: Bool {
        get { self[A11yHighContrastKey.self] }
        set { self[A11yHighContrastKey.self] = newValue }
    }
}

// MARK: - SDUI environment provider view modifier

struct SDUIEnvironmentModifier: ViewModifier {
    let locale: String
    let textDir: LayoutDirection
    let reduceMotion: Bool
    let highContrast: Bool

    func body(content: Content) -> some View {
        content
            .environment(\.sduiLocale, locale)
            .environment(\.sduiTextDir, textDir)
            .environment(\.sduiReduceMotion, reduceMotion)
            .environment(\.sduiHighContrast, highContrast)
            .environment(\.layoutDirection, textDir)
    }
}

extension View {
    func sduiEnvironment(locale: String, textDir: String = "ltr",
                         reduceMotion: Bool = false, highContrast: Bool = false) -> some View {
        let dir: LayoutDirection = textDir == "rtl" ? .rightToLeft : .leftToRight
        return modifier(SDUIEnvironmentModifier(
            locale: locale, textDir: dir,
            reduceMotion: reduceMotion, highContrast: highContrast
        ))
    }
}
