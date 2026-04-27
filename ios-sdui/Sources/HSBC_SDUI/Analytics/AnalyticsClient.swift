// AnalyticsClient.swift
// HSBC SDUI iOS Renderer
// Batching analytics client that ships events to the DAP Event Ingestion API.

import Foundation
import CryptoKit

// MARK: - AnalyticsClient

/// Thread-safe singleton that batches SDUI analytics events and flushes them
/// to the DAP Event Ingestion API every 5 seconds or when 20 events accumulate.
///
/// User IDs are SHA-256 hashed before transmission to comply with HSBC data
/// minimisation requirements.
public final class AnalyticsClient {

    // MARK: Shared instance

    public static let shared = AnalyticsClient()

    // MARK: Configuration

    private let ingestionEndpoint = URL(string: "https://dap.hsbc.com/v2/events/ingest")!
    private let flushInterval: TimeInterval = 5
    private let maxBatchSize = 20
    private let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
    private let platform = "ios"

    // MARK: Internal state

    private var eventQueue: [AnalyticsEvent] = []
    private let queueLock = NSLock()
    private var flushTimer: DispatchSourceTimer?
    private let session: URLSession

    // MARK: Init

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 10
        session = URLSession(configuration: config)
        startFlushTimer()
    }

    // MARK: - Public API

    /// Enqueues an analytics event for batched delivery.
    /// - Parameters:
    ///   - event: The event name (e.g. `"promo_banner_impression"`).
    ///   - properties: Arbitrary key-value metadata. Any `userId` value is SHA-256 hashed.
    public static func fire(event: String, properties: [String: Any] = [:]) {
        shared.enqueue(event: event, properties: properties)
    }

    /// Convenience overload accepting a pre-built `AnalyticsEvent`.
    public static func fire(analyticsEvent: AnalyticsEvent) {
        shared.enqueue(analyticsEvent: analyticsEvent)
    }

    /// Forces an immediate flush of the event queue (e.g. on app background).
    public static func flush() {
        shared.flushQueue()
    }

    // MARK: - Private enqueue

    private func enqueue(event: String, properties: [String: Any]) {
        var sanitised = properties
        if let userId = sanitised["user_id"] as? String {
            sanitised["user_id"] = sha256(userId)
        }
        if let userId = sanitised["userId"] as? String {
            sanitised["userId"] = sha256(userId)
        }

        let analyticsEvent = AnalyticsEvent(
            name: event,
            timestamp: ISO8601DateFormatter().string(from: Date()),
            platform: platform,
            appVersion: appVersion,
            properties: sanitised
        )
        enqueue(analyticsEvent: analyticsEvent)
    }

    private func enqueue(analyticsEvent: AnalyticsEvent) {
        queueLock.lock()
        eventQueue.append(analyticsEvent)
        let shouldFlush = eventQueue.count >= maxBatchSize
        queueLock.unlock()

        if shouldFlush {
            flushQueue()
        }
    }

    // MARK: - Timer

    private func startFlushTimer() {
        let timer = DispatchSource.makeTimerSource(queue: DispatchQueue.global(qos: .utility))
        timer.schedule(deadline: .now() + flushInterval, repeating: flushInterval)
        timer.setEventHandler { [weak self] in
            self?.flushQueue()
        }
        timer.resume()
        flushTimer = timer
    }

    // MARK: - Flush

    private func flushQueue() {
        queueLock.lock()
        guard !eventQueue.isEmpty else {
            queueLock.unlock()
            return
        }
        let batch = eventQueue
        eventQueue.removeAll()
        queueLock.unlock()

        sendBatch(batch)
    }

    private func sendBatch(_ events: [AnalyticsEvent]) {
        guard let body = try? JSONEncoder().encode(EventBatch(events: events)) else { return }

        var request = URLRequest(url: ingestionEndpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("ios", forHTTPHeaderField: "x-platform")
        request.setValue(appVersion, forHTTPHeaderField: "x-app-version")
        request.httpBody = body

        session.dataTask(with: request) { _, response, error in
            if let error = error {
                // Re-queue events on network failure (best-effort, no infinite retry)
                self.queueLock.lock()
                self.eventQueue.insert(contentsOf: events, at: 0)
                // Cap queue to avoid unbounded growth during prolonged offline periods
                if self.eventQueue.count > 200 {
                    self.eventQueue = Array(self.eventQueue.suffix(200))
                }
                self.queueLock.unlock()
                NSLog("[AnalyticsClient] Flush failed: \(error.localizedDescription)")
            }
        }.resume()
    }

    // MARK: - SHA-256 helper

    private func sha256(_ input: String) -> String {
        let data = Data(input.utf8)
        let digest = SHA256.hash(data: data)
        return digest.compactMap { String(format: "%02x", $0) }.joined()
    }
}

// MARK: - Supporting types

public struct AnalyticsEvent: Codable {
    public let name: String
    public let timestamp: String
    public let platform: String
    public let appVersion: String
    public let properties: [String: AnyCodableEvent]

    public init(name: String, timestamp: String, platform: String, appVersion: String, properties: [String: Any]) {
        self.name = name
        self.timestamp = timestamp
        self.platform = platform
        self.appVersion = appVersion
        self.properties = properties.compactMapValues { AnyCodableEvent($0) }
    }

    enum CodingKeys: String, CodingKey {
        case name, timestamp, platform
        case appVersion = "app_version"
        case properties
    }
}

/// Lightweight Codable wrapper for analytics property values.
public struct AnyCodableEvent: Codable {
    public let value: Any

    public init(_ value: Any) { self.value = value }

    public init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let b = try? c.decode(Bool.self)   { value = b; return }
        if let i = try? c.decode(Int.self)    { value = i; return }
        if let d = try? c.decode(Double.self) { value = d; return }
        if let s = try? c.decode(String.self) { value = s; return }
        value = ""
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch value {
        case let b as Bool:   try c.encode(b)
        case let i as Int:    try c.encode(i)
        case let d as Double: try c.encode(d)
        case let s as String: try c.encode(s)
        default:              try c.encode(String(describing: value))
        }
    }
}

private struct EventBatch: Codable {
    let events: [AnalyticsEvent]
}
