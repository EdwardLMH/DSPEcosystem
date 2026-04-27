// SDUIScreenViewModel.swift
// HSBC SDUI iOS Renderer
// ObservableObject ViewModel driving the SDUI screen lifecycle.

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

    // MARK: Init

    public init(
        bffBaseURL: String = "https://bff.hsbc.com/sdui/v1",
        session: URLSession = .shared
    ) {
        self.bffBaseURL = bffBaseURL
        self.session = session
    }

    // MARK: Public API

    /// Fetches the SDUI screen payload for `screenId` from the BFF.
    /// On success, persists the payload to UserDefaults and updates published state.
    /// On failure, attempts to serve from cached payload and marks `isStale = true`.
    public func fetchScreen(screenId: String) async {
        isLoading = true
        error = nil
        isStale = false

        do {
            let freshPayload = try await performFetch(screenId: screenId)
            persistToCache(screenId: screenId, payload: freshPayload)
            payload = freshPayload
            isLoading = false
        } catch let fetchError {
            isLoading = false
            if let cached = loadFromCache(screenId: screenId) {
                payload = cached
                isStale = true
                error = fetchError
                AnalyticsClient.fire(
                    event: "sdui_cache_fallback",
                    properties: [
                        "screen_id": screenId,
                        "error": fetchError.localizedDescription
                    ]
                )
            } else {
                payload = nil
                error = fetchError
                AnalyticsClient.fire(
                    event: "sdui_fetch_failed",
                    properties: [
                        "screen_id": screenId,
                        "error": fetchError.localizedDescription
                    ]
                )
            }
        }
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

        // Auth token sourced from Keychain wrapper (simplified here to env / app delegate)
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

        // Validate integrity hash before decoding
        let remoteIntegrityHeader = httpResponse.value(forHTTPHeaderField: "x-sdui-integrity")
        try validateIntegrity(data: data, expectedHash: remoteIntegrityHeader)

        return try decoder.decode(ScreenPayload.self, from: data)
    }

    // MARK: Integrity

    private func validateIntegrity(data: Data, expectedHash: String?) throws {
        guard let expectedHash = expectedHash, !expectedHash.isEmpty else {
            // No server-side hash header — skip validation (non-enforcing mode)
            return
        }
        let digest = SHA256.hash(data: data)
        let computed = digest.compactMap { String(format: "%02x", $0) }.joined()
        guard computed.lowercased() == expectedHash.lowercased() else {
            throw SDUIError.integrityMismatch(expected: expectedHash, computed: computed)
        }
    }

    // MARK: Cache (UserDefaults with obfuscated key)

    private func cacheKey(for screenId: String) -> String {
        // Obfuscate the cache key so it is not trivially guessable in app storage
        let raw = "\(cacheKeyPrefix)\(screenId)"
        let digest = SHA256.hash(data: Data(raw.utf8))
        return digest.compactMap { String(format: "%02x", $0) }.joined()
    }

    private func persistToCache(screenId: String, payload: ScreenPayload) {
        guard let data = try? encoder.encode(payload) else { return }
        UserDefaults.standard.set(data, forKey: cacheKey(for: screenId))
    }

    private func loadFromCache(screenId: String) -> ScreenPayload? {
        guard let data = UserDefaults.standard.data(forKey: cacheKey(for: screenId)) else {
            return nil
        }
        return try? decoder.decode(ScreenPayload.self, from: data)
    }

    // MARK: Auth token retrieval (stub — replace with Keychain integration)

    private func retrieveBearerToken() -> String? {
        // In production this calls into a Keychain service abstraction.
        // Returning nil causes the request to be sent without Authorization,
        // which the BFF treats as an unauthenticated anonymous request.
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
