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
        TealiumClient.track(
            event: "operational_startup_step",
            category: "Operational",
            action: "startup_step",
            label: step,
            screen: screenId,
            journey: "app_startup",
            step: step,
            custom: [
                "trace_id": traceId,
                "span_id": Self.randomHex(byteCount: 8),
                "startup_type": startupType,
                "startup_step": step,
                "duration_ms": "\(durationMs)",
                "screen_id": screenId
            ]
        )
    }

    public func recordNetworkStep(_ name: String, durationMs: Int, path: String, success: Bool) {
        TealiumClient.track(
            event: "operational_network_step",
            category: "Operational",
            action: "network_step",
            label: name,
            screen: "network",
            journey: "sdui_runtime",
            step: name,
            custom: [
                "trace_id": traceId,
                "span_id": Self.randomHex(byteCount: 8),
                "duration_ms": "\(durationMs)",
                "path": path,
                "success": "\(success)"
            ]
        )
    }

    private static func randomHex(byteCount: Int) -> String {
        var bytes = [UInt8](repeating: 0, count: byteCount)
        _ = SecRandomCopyBytes(kSecRandomDefault, byteCount, &bytes)
        return bytes.map { String(format: "%02x", $0) }.joined()
    }
}
