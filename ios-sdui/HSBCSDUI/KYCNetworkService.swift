import Foundation
import UIKit

// Base URL points to mock BFF — 127.0.0.1 works in simulator, use Mac IP for real device
#if targetEnvironment(simulator)
private let BASE_URL = "http://127.0.0.1:4000/api/v1"
#else
// Replace with your Mac's LAN IP when testing on a real device
private let BASE_URL = "http://10.81.103.103:4000/api/v1"
#endif

// MARK: - Config bootstrap response

struct BFFConfig: Codable {
    let locale: String
    let textDir: String
    let supportedLocales: [String]
    let channel: String
    let platform: String
    let a11y: BFFAccessibility
    let featureFlags: [String: Bool]
    let sdui: BFFSDUIConfig
    let wcag: BFFWCAGConfig
}

struct BFFAccessibility: Codable {
    let reduceMotion: Bool
    let highContrast: Bool
    let largeText: Bool
    let voiceOver: Bool
    let talkBack: Bool
    let screenReader: Bool
}

struct BFFSDUIConfig: Codable {
    let schemaVersion: String
    let ttlSeconds: Int
    let cacheStrategy: String
}

struct BFFWCAGConfig: Codable {
    let level: String
    let version: String
}

// MARK: - Locale / A11y helpers

struct IOSLocaleContext {
    // Resolved BCP-47 locale tag derived from device Locale, overridable per session.
    static var current: String {
        let id = Locale.current.identifier          // e.g. "zh_HK", "en_US"
        let lang = Locale.current.language.languageCode?.identifier ?? "en"
        let region = Locale.current.region?.identifier ?? ""
        if lang == "zh" {
            return region == "CN" || region == "SG" ? "zh-CN" : "zh-HK"
        }
        return lang
    }

    static var a11yFlags: String {
        var flags: [String] = []
        if UIAccessibility.isReduceMotionEnabled  { flags.append("reduceMotion") }
        if UIAccessibility.isDarkerSystemColorsEnabled { flags.append("highContrast") }
        if UIAccessibility.isBoldTextEnabled       { flags.append("largeText") }
        if UIAccessibility.isVoiceOverRunning      { flags.append("voiceOver") }
        return flags.joined(separator: ",")
    }
}

// MARK: - Network service

final class KYCNetworkService: Sendable {
    private let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 15
        return URLSession(configuration: config)
    }()

    private var decoder: JSONDecoder { JSONDecoder() }
    private var encoder: JSONEncoder { JSONEncoder() }

    // MARK: - Client config bootstrap

    func fetchConfig() async throws -> BFFConfig {
        var req = URLRequest(url: url("/config"))
        attachCommonHeaders(&req, platform: "ios")
        let (data, _) = try await session.data(for: req)
        return try decoder.decode(BFFConfig.self, from: data)
    }

    // MARK: - Start session

    func startSession(platform: String) async throws -> StartSessionResponse {
        var req = URLRequest(url: url("/kyc/sessions/start"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        attachCommonHeaders(&req, platform: platform)
        req.httpBody = try encoder.encode(["journeyType": "PERSONAL_ACCOUNT_OPENING", "market": "HK"])
        let (data, _) = try await session.data(for: req)
        return try decoder.decode(StartSessionResponse.self, from: data)
    }

    // MARK: - Resume (get current step)

    func resume(sessionId: String, platform: String) async throws -> SDUIScreenPayload {
        var req = URLRequest(url: url("/kyc/sessions/\(sessionId)/resume"))
        req.setValue("2.3", forHTTPHeaderField: "x-sdui-version")
        attachCommonHeaders(&req, platform: platform)
        let (data, _) = try await session.data(for: req)
        return try decoder.decode(SDUIScreenPayload.self, from: data)
    }

    // MARK: - Get specific step

    func getStep(sessionId: String, stepId: String, platform: String) async throws -> SDUIScreenPayload {
        var req = URLRequest(url: url("/kyc/sessions/\(sessionId)/steps/\(stepId)"))
        req.setValue("2.3", forHTTPHeaderField: "x-sdui-version")
        attachCommonHeaders(&req, platform: platform)
        let (data, _) = try await session.data(for: req)
        return try decoder.decode(SDUIScreenPayload.self, from: data)
    }

    // MARK: - Submit answers

    func submitStep(sessionId: String, stepId: String, answers: [AnswerEntry]) async throws -> SubmitResponse {
        var req = URLRequest(url: url("/kyc/sessions/\(sessionId)/steps/\(stepId)/submit"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        attachCommonHeaders(&req, platform: "ios")
        req.httpBody = try encoder.encode(SubmitRequest(answers: answers))
        let (data, resp) = try await session.data(for: req)
        // 422 validation errors are still parseable
        if let http = resp as? HTTPURLResponse, http.statusCode == 422 {
            return try decoder.decode(SubmitResponse.self, from: data)
        }
        return try decoder.decode(SubmitResponse.self, from: data)
    }

    // MARK: - Common header injection

    private func attachCommonHeaders(_ req: inout URLRequest, platform: String) {
        req.setValue(platform, forHTTPHeaderField: "x-platform")
        req.setValue(IOSLocaleContext.current, forHTTPHeaderField: "x-locale")
        req.setValue(IOSLocaleContext.a11yFlags, forHTTPHeaderField: "x-a11y-flags")
        req.setValue("SDUI", forHTTPHeaderField: "x-channel")
    }

    private func url(_ path: String) -> URL {
        URL(string: BASE_URL + path)!
    }
}
