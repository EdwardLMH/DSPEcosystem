import Foundation

// Base URL points to mock BFF — 127.0.0.1 works in simulator, use Mac IP for real device
#if targetEnvironment(simulator)
private let BASE_URL = "http://127.0.0.1:4000/api/v1"
#else
// Replace with your Mac's LAN IP when testing on a real device
private let BASE_URL = "http://10.81.103.103:4000/api/v1"
#endif

final class KYCNetworkService: Sendable {
    private let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 15
        return URLSession(configuration: config)
    }()

    private var decoder: JSONDecoder { JSONDecoder() }
    private var encoder: JSONEncoder { JSONEncoder() }

    // MARK: - Start session

    func startSession(platform: String) async throws -> StartSessionResponse {
        var req = URLRequest(url: url("/kyc/sessions/start"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(platform, forHTTPHeaderField: "x-platform")
        req.httpBody = try encoder.encode(["journeyType": "PERSONAL_ACCOUNT_OPENING", "market": "HK"])
        let (data, _) = try await session.data(for: req)
        return try decoder.decode(StartSessionResponse.self, from: data)
    }

    // MARK: - Resume (get current step)

    func resume(sessionId: String, platform: String) async throws -> SDUIScreenPayload {
        var req = URLRequest(url: url("/kyc/sessions/\(sessionId)/resume"))
        req.setValue(platform, forHTTPHeaderField: "x-platform")
        req.setValue("2.3", forHTTPHeaderField: "x-sdui-version")
        let (data, _) = try await session.data(for: req)
        return try decoder.decode(SDUIScreenPayload.self, from: data)
    }

    // MARK: - Get specific step

    func getStep(sessionId: String, stepId: String, platform: String) async throws -> SDUIScreenPayload {
        var req = URLRequest(url: url("/kyc/sessions/\(sessionId)/steps/\(stepId)"))
        req.setValue(platform, forHTTPHeaderField: "x-platform")
        req.setValue("2.3", forHTTPHeaderField: "x-sdui-version")
        let (data, _) = try await session.data(for: req)
        return try decoder.decode(SDUIScreenPayload.self, from: data)
    }

    // MARK: - Submit answers

    func submitStep(sessionId: String, stepId: String, answers: [AnswerEntry]) async throws -> SubmitResponse {
        var req = URLRequest(url: url("/kyc/sessions/\(sessionId)/steps/\(stepId)/submit"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try encoder.encode(SubmitRequest(answers: answers))
        let (data, resp) = try await session.data(for: req)
        // 422 validation errors are still parseable
        if let http = resp as? HTTPURLResponse, http.statusCode == 422 {
            return try decoder.decode(SubmitResponse.self, from: data)
        }
        return try decoder.decode(SubmitResponse.self, from: data)
    }

    private func url(_ path: String) -> URL {
        URL(string: BASE_URL + path)!
    }
}
