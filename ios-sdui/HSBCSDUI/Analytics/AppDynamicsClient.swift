import Foundation

public final class AppDynamicsClient {
    public static let shared = AppDynamicsClient()

    private init() {}

    public func reportStartupStep(
        name: String,
        durationMs: Int,
        traceId: String,
        spanId: String,
        startupType: String,
        screenId: String
    ) {
        let attributes = [
            "trace_id": traceId,
            "span_id": spanId,
            "startup_type": startupType,
            "screen_id": screenId
        ]
        reportMetric(name: "SDUI.Startup.\(name)", durationMs: durationMs, attributes: attributes)
    }

    public func reportNetworkStep(
        name: String,
        durationMs: Int,
        traceId: String,
        spanId: String,
        path: String,
        success: Bool
    ) {
        let attributes = [
            "trace_id": traceId,
            "span_id": spanId,
            "path": path,
            "success": String(success)
        ]
        reportMetric(name: "SDUI.Network.\(name)", durationMs: durationMs, attributes: attributes)
    }

    private func reportMetric(name: String, durationMs: Int, attributes: [String: String]) {
        // Production wiring:
        // - Initialise the AppDynamics iOS agent in the app delegate / SwiftUI app entry.
        // - Use the approved HSBC AppDynamics API to report custom timers/metrics.
        // - Attach these low-cardinality attributes as custom data where permitted.
        print("[AppDynamics][SIM] \(name)=\(durationMs)ms \(attributes)")
    }
}
