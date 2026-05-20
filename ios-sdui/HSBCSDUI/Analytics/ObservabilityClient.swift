import Foundation
import Security
import UIKit

public final class ObservabilityClient {
    public static let shared = ObservabilityClient()

    private var traceId = ObservabilityClient.randomHex(byteCount: 16)
    private var appStart = Date()
    private var foregroundStart = Date()
    private var startupType = "cold"

    private init() {}

    public func markAppStart() {
        traceId = Self.randomHex(byteCount: 16)
        appStart = Date()
        foregroundStart = appStart
        startupType = "cold"
        recordStartupStep("app_init", durationMs: 0)
    }

    public func markForeground() {
        foregroundStart = Date()
        startupType = "warm"
        recordStartupStep("scene_foreground", durationMs: 0)
    }

    public func traceparent() -> String {
        "00-\(traceId)-\(Self.randomHex(byteCount: 8))-01"
    }

    public func startupElapsedMs() -> Int {
        let start = startupType == "warm" ? foregroundStart : appStart
        return Int(Date().timeIntervalSince(start) * 1000)
    }

    public func recordStartupStep(_ step: String, durationMs: Int, screenId: String = "home-hub-hk") {
        AppDynamicsClient.shared.reportStartupStep(
            name: step,
            durationMs: durationMs,
            traceId: traceId,
            spanId: Self.randomHex(byteCount: 8),
            startupType: startupType,
            screenId: screenId
        )
    }

    public func recordNetworkStep(_ name: String, durationMs: Int, path: String, success: Bool) {
        AppDynamicsClient.shared.reportNetworkStep(
            name: name,
            durationMs: durationMs,
            traceId: traceId,
            spanId: Self.randomHex(byteCount: 8),
            path: path,
            success: success
        )
    }

    private static func randomHex(byteCount: Int) -> String {
        var bytes = [UInt8](repeating: 0, count: byteCount)
        _ = SecRandomCopyBytes(kSecRandomDefault, byteCount, &bytes)
        return bytes.map { String(format: "%02x", $0) }.joined()
    }
}
