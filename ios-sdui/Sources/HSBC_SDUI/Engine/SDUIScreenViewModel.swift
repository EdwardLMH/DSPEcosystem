// SDUIScreenViewModel.swift
// HSBC SDUI iOS Renderer
// ObservableObject ViewModel driving the SDUI screen lifecycle.
//
// Resolution order (per §5.10 of the system design):
//   1. CDN manifest check via SDUIStaticDistribution → serve/download latest static JSON
//   2. BFF live endpoint → personalised / A-B enriched payload
//   3. Local file cache (Caches/SDUI/)
//   4. Bundled baseline (shipped in app binary)

import Foundation
import Combine
import CryptoKit

// MARK: - SDUIScreenViewModel

@MainActor
public final class SDUIScreenViewModel: ObservableObject {

    // MARK: Published state

    @Published public var payload: ScreenPayload?
    @Published public var isLoading: Bool = false
    @Published public var error: Error?
    @Published public var isStale: Bool = false

    // MARK: Private constants

    private let bffBaseURL: String
    private let session: URLSession
    private let cacheKeyPrefix = "hsbc_sdui_cache_"
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    // Static distribution layer (manifest + CDN + self-pick)
    private let staticDist: SDUIStaticDistribution

    // MARK: Init

    public init(
        bffBaseURL: String  = "https://bff.hsbc.com/sdui/v1",
        cdnBase: String     = "https://cdn.hsbc.com/sdui",
        appId: String       = "hsbcmobile",
        userId: String      = "",
        session: URLSession = .shared
    ) {
        self.bffBaseURL = bffBaseURL
        self.session    = session
        self.staticDist = SDUIStaticDistribution(
            cdnBase:  cdnBase,
            appId:    appId,
            platform: "ios",
            userId:   userId,
            session:  session
        )
    }

    // MARK: Public API

    /// Resolves the SDUI screen for `screenId` using the full 3-tier chain:
    ///   1. CDN manifest/static JSON (via SDUIStaticDistribution)
    ///   2. BFF live endpoint (personalised)
    ///   3. Bundled baseline fallback (handled inside SDUIStaticDistribution)
    public func fetchScreen(screenId: String) async {
        isLoading = true
        error     = nil
        isStale   = false

        // ── Tier 1: CDN static distribution ────────────────────────────────
        // Run manifest check concurrently with the BFF call so the fastest path wins.
        async let staticResult = staticDist.resolve(screenId: screenId)

        // ── Tier 2: BFF live endpoint (personalised / A-B) ──────────────────
        do {
            let freshPayload = try await performFetch(screenId: screenId)
            persistToCache(screenId: screenId, payload: freshPayload)
            payload   = freshPayload
            isStale   = false
            isLoading = false
        } catch let fetchError {
            // BFF failed — fall back to static distribution result
            let (staticData, stale) = await staticResult
            if let data = staticData, let decoded = try? decoder.decode(ScreenPayload.self, from: data) {
                payload   = decoded
                isStale   = stale
                error     = fetchError
                isLoading = false
                AnalyticsClient.fire(
                    event: "sdui_static_fallback",
                    properties: ["screen_id": screenId, "is_stale": String(stale)]
                )
            } else if let cached = loadFromCache(screenId: screenId) {
                // Tier 3: legacy UserDefaults cache (backwards-compat during migration)
                payload   = cached
                isStale   = true
                error     = fetchError
                isLoading = false
                AnalyticsClient.fire(
                    event: "sdui_cache_fallback",
                    properties: ["screen_id": screenId, "error": fetchError.localizedDescription]
                )
            } else {
                payload   = nil
                error     = fetchError
                isLoading = false
                AnalyticsClient.fire(
                    event: "sdui_fetch_failed",
                    properties: ["screen_id": screenId, "error": fetchError.localizedDescription]
                )
            }
        }
    }

    // MARK: Self-Pick

    /// Resolves the `SELF_PICK_ENTRY_POINTS` slice items for `screenId`.
    /// Reads the `selfPickForceUpdate` flag from the latest manifest (fetched by staticDist).
    /// Pass `remoteDefaults` as the items array received from the SDUI JSON.
    public func resolvedSelfPickItems(
        screenId: String,
        remoteDefaults: [[String: String]],
        forceUpdate: Bool
    ) async -> [[String: String]] {
        await staticDist.resolvedSelfPickItems(
            screenId:       screenId,
            remoteDefaults: remoteDefaults,
            forceUpdate:    forceUpdate
        )
    }

    /// Saves customer's self-pick ordering / selection to device storage.
    public func saveCustomerSelfPick(screenId: String, items: [[String: String]]) async {
        await staticDist.saveCustomerSelfPick(screenId: screenId, items: items)
    }

    // MARK: Network

    private func performFetch(screenId: String) async throws -> ScreenPayload {
        guard let url = URL(string: "\(bffBaseURL)/screens/\(screenId)") else {
            throw SDUIError.invalidURL(screenId)
        }

        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 15)
        request.httpMethod = "GET"
        request.setValue("1.0", forHTTPHeaderField: "x-sdui-version")
        request.setValue("ios", forHTTPHeaderField: "x-platform")
        request.setValue(Locale.current.identifier, forHTTPHeaderField: "x-locale")
        request.setValue(
            Locale.current.region?.identifier ?? "GB",
            forHTTPHeaderField: "x-region"
        )

        if let token = retrieveBearerToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw SDUIError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            throw SDUIError.httpError(statusCode: httpResponse.statusCode)
        }

        let remoteIntegrityHeader = httpResponse.value(forHTTPHeaderField: "x-sdui-integrity")
        try validateIntegrity(data: data, expectedHash: remoteIntegrityHeader)

        return try decoder.decode(ScreenPayload.self, from: data)
    }

    // MARK: Integrity

    private func validateIntegrity(data: Data, expectedHash: String?) throws {
        guard let expectedHash = expectedHash, !expectedHash.isEmpty else { return }
        let digest   = SHA256.hash(data: data)
        let computed = digest.compactMap { String(format: "%02x", $0) }.joined()
        guard computed.lowercased() == expectedHash.lowercased() else {
            throw SDUIError.integrityMismatch(expected: expectedHash, computed: computed)
        }
    }

    // MARK: Legacy UserDefaults cache (retained for migration period)

    private func cacheKey(for screenId: String) -> String {
        let raw    = "\(cacheKeyPrefix)\(screenId)"
        let digest = SHA256.hash(data: Data(raw.utf8))
        return digest.compactMap { String(format: "%02x", $0) }.joined()
    }

    private func persistToCache(screenId: String, payload: ScreenPayload) {
        guard let data = try? encoder.encode(payload) else { return }
        UserDefaults.standard.set(data, forKey: cacheKey(for: screenId))
    }

    private func loadFromCache(screenId: String) -> ScreenPayload? {
        guard let data = UserDefaults.standard.data(forKey: cacheKey(for: screenId)) else { return nil }
        return try? decoder.decode(ScreenPayload.self, from: data)
    }

    // MARK: Auth token retrieval (stub — replace with Keychain integration)

    private func retrieveBearerToken() -> String? {
        return UserDefaults.standard.string(forKey: "hsbc_sdui_bearer_token")
    }
}

// MARK: - SDUIError

public enum SDUIError: LocalizedError {
    case invalidURL(String)
    case invalidResponse
    case httpError(statusCode: Int)
    case integrityMismatch(expected: String, computed: String)
    case decodingFailed(underlying: Error)

    public var errorDescription: String? {
        switch self {
        case .invalidURL(let id):
            return "SDUI: Could not construct URL for screen '\(id)'"
        case .invalidResponse:
            return "SDUI: Server returned a non-HTTP response"
        case .httpError(let code):
            return "SDUI: Server responded with HTTP \(code)"
        case .integrityMismatch(let expected, let computed):
            return "SDUI: Integrity check failed — expected \(expected), got \(computed)"
        case .decodingFailed(let underlying):
            return "SDUI: Failed to decode payload — \(underlying.localizedDescription)"
        }
    }
}
