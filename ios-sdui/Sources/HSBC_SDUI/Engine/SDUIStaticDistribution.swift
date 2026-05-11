// SDUIStaticDistribution.swift
// HSBC SDUI iOS Renderer
//
// Implements the three-tier resolution chain for SDUI screens:
//   1. Fetch manifest.json from CDN — compare version against local storage
//   2a. Version unchanged → serve local storage (no download)
//   2b. Version changed / no local file → download, SHA-256 verify, persist, render
//   3. CDN unreachable → serve local storage; if absent → serve bundled baseline
//
// Also manages self-pick entry-point customisation:
//   • Customer preferences stored in UserDefaults under "selfPick_{userId}_{screenId}"
//   • Preferences are preserved across remote updates unless selfPickForceUpdate == true

import Foundation
import CryptoKit

// MARK: - Manifest types

struct SDUIManifest: Codable {
    let schemaVersion: String
    let generatedAt: String
    let screens: [String: SDUIScreenEntry]
    let selfPickForceUpdate: Bool

    enum CodingKeys: String, CodingKey {
        case schemaVersion      = "schemaVersion"
        case generatedAt        = "generatedAt"
        case screens
        case selfPickForceUpdate = "selfPickForceUpdate"
    }
}

struct SDUIScreenEntry: Codable {
    let version: String
    let etag: String
    let sizeBytes: Int
}

// MARK: - SelfPickEntry

struct SelfPickEntry: Codable {
    let items: [[String: String]]   // ordered list of entry-point ids + labels
    let savedAt: String             // ISO-8601
}

// MARK: - SDUIStaticDistribution

/// Encapsulates the full CDN manifest-check → local-storage → bundled-baseline resolution
/// chain and the self-pick preference layer. Thread-safe; all work done on a background
/// actor — callers switch back to MainActor before updating UI.
actor SDUIStaticDistribution {

    // MARK: Configuration

    private let cdnBase: String
    private let appId: String
    private let platform: String
    private let userId: String
    private let session: URLSession
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    // File-cache directory: <Caches>/SDUI/
    private let cacheDir: URL

    // UserDefaults key prefixes
    private let localVersionPrefix = "hsbc_sdui_version_"
    private let selfPickPrefix     = "selfPick_"

    // MARK: Init

    init(
        cdnBase: String  = "https://cdn.hsbc.com/sdui",
        appId: String    = "hsbcmobile",
        platform: String = "ios",
        userId: String,
        session: URLSession = .shared
    ) {
        self.cdnBase   = cdnBase
        self.appId     = appId
        self.platform  = platform
        self.userId    = userId
        self.session   = session

        let base = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        self.cacheDir = base.appendingPathComponent("SDUI", isDirectory: true)
        try? FileManager.default.createDirectory(at: cacheDir, withIntermediateDirectories: true)
    }

    // MARK: - Public API

    /// Resolves the best available SDUI JSON data for `screenId` using the 3-tier chain.
    /// Returns `(data, isStale)` where `isStale` is true when falling back to local/bundled.
    func resolve(screenId: String) async -> (Data?, isStale: Bool) {
        // Step 1 — try CDN manifest
        if let manifest = await fetchManifest() {
            if let entry = manifest.screens[screenId] {
                let localVersion = storedVersion(for: screenId)
                if localVersion == entry.version, let local = loadLocalFile(screenId: screenId) {
                    // Version unchanged — serve local storage (no download)
                    return (local, false)
                }
                // Version changed or no local file — download from CDN
                if let downloaded = await downloadScreen(screenId: screenId, version: entry.version, etag: entry.etag) {
                    persistLocalFile(screenId: screenId, data: downloaded, version: entry.version)
                    return (downloaded, false)
                }
                // Download failed (corrupted / missing) — keep existing local
                AnalyticsClient.fire(
                    event: "sdui_cdn_download_failed",
                    properties: ["screen_id": screenId, "version": entry.version]
                )
            }
        }

        // Step 3 — CDN unreachable or no screen entry
        if let local = loadLocalFile(screenId: screenId) {
            return (local, true)
        }

        // Last resort — bundled baseline
        if let bundled = loadBundledBaseline(screenId: screenId) {
            return (bundled, true)
        }

        return (nil, true)
    }

    // MARK: - Self-Pick

    /// Returns merged self-pick items for the `SELF_PICK_ENTRY_POINTS` slice.
    /// Remote defaults are used as-is when `forceUpdate` is true (and saved prefs are cleared).
    /// Otherwise, saved customer preferences override the remote defaults.
    func resolvedSelfPickItems(
        screenId: String,
        remoteDefaults: [[String: String]],
        forceUpdate: Bool
    ) -> [[String: String]] {
        let key = selfPickKey(screenId: screenId)

        if forceUpdate {
            // Clear saved preferences — customer sees new defaults, can re-customise
            UserDefaults.standard.removeObject(forKey: key)
            return remoteDefaults
        }

        guard
            let data = UserDefaults.standard.data(forKey: key),
            let saved = try? decoder.decode(SelfPickEntry.self, from: data)
        else {
            return remoteDefaults
        }

        return saved.items
    }

    /// Persists customer self-pick preferences to UserDefaults.
    func saveCustomerSelfPick(screenId: String, items: [[String: String]]) {
        let entry = SelfPickEntry(items: items, savedAt: ISO8601DateFormatter().string(from: Date()))
        guard let data = try? encoder.encode(entry) else { return }
        UserDefaults.standard.set(data, forKey: selfPickKey(screenId: screenId))
    }

    // MARK: - Manifest

    private func fetchManifest() async -> SDUIManifest? {
        guard let url = URL(string: "\(cdnBase)/\(appId)/\(platform)/manifest.json") else { return nil }
        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 10)
        request.httpMethod = "GET"

        do {
            let (data, response) = try await session.data(for: request)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { return nil }
            return try decoder.decode(SDUIManifest.self, from: data)
        } catch {
            return nil
        }
    }

    // MARK: - CDN Screen Download

    private func downloadScreen(screenId: String, version: String, etag: String) async -> Data? {
        guard let url = URL(string: "\(cdnBase)/\(appId)/\(platform)/\(screenId)/\(version).json") else {
            return nil
        }

        do {
            let (data, response) = try await session.data(for: URLRequest(url: url))
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { return nil }

            // SHA-256 verify against etag (etag stored as hex-encoded SHA-256)
            let stripped = etag.trimmingCharacters(in: CharacterSet(charactersIn: "\""))
            let digest   = SHA256.hash(data: data)
            let computed = digest.compactMap { String(format: "%02x", $0) }.joined()
            guard computed.lowercased() == stripped.lowercased() else {
                AnalyticsClient.fire(
                    event: "sdui_integrity_fail",
                    properties: ["screen_id": screenId, "expected": stripped, "got": computed]
                )
                return nil
            }
            return data
        } catch {
            return nil
        }
    }

    // MARK: - Local File Cache

    private func localFileURL(screenId: String) -> URL {
        cacheDir.appendingPathComponent("\(screenId).json")
    }

    private func loadLocalFile(screenId: String) -> Data? {
        try? Data(contentsOf: localFileURL(screenId: screenId))
    }

    private func persistLocalFile(screenId: String, data: Data, version: String) {
        try? data.write(to: localFileURL(screenId: screenId), options: .atomic)
        UserDefaults.standard.set(version, forKey: localVersionPrefix + screenId)
    }

    private func storedVersion(for screenId: String) -> String? {
        UserDefaults.standard.string(forKey: localVersionPrefix + screenId)
    }

    // MARK: - Bundled Baseline

    private func loadBundledBaseline(screenId: String) -> Data? {
        // Baselines shipped as JSON files in the app bundle under Resources/SDUIBaseline/
        guard let url = Bundle.main.url(forResource: screenId, withExtension: "json", subdirectory: "SDUIBaseline") else {
            return nil
        }
        return try? Data(contentsOf: url)
    }

    // MARK: - Helpers

    private func selfPickKey(screenId: String) -> String {
        "\(selfPickPrefix)\(userId)_\(screenId)"
    }
}
