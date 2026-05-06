import Foundation
import Observation

// ─── Actions ─────────────────────────────────────────────────────────────────

enum KYCAction {
    case startSession
    case sessionStarted(sessionId: String, totalSteps: Int)
    case stepLoaded(SDUIScreenPayload)
    case setAnswer(questionId: String, value: AnyCodable)
    case submitStep
    case stepSubmitSuccess(nextStepId: String?, totalSteps: Int)
    case journeyComplete
    case setLoading(Bool)
    case setSubmitting(Bool)
    case setError(String?)
    case setValidationErrors([ValidationError])
    case clearValidationError(String)
}

struct ValidationError: Codable, Identifiable {
    var id: String { questionId }
    let questionId: String
    let message: String
}

// ─── Store — all KYC state lives directly here so @Observable tracks every property ──

@Observable
final class AppStore {

    // KYC journey state — all top-level properties so @Observable macro instruments each one
    var sessionId:         String?              = nil
    var currentStepId:     String?              = nil
    var currentStepIndex:  Int                  = 0
    var totalSteps:        Int                  = 0
    var sectionTitle:      String               = ""
    var platform:          String               = "mobile"
    var screenPayload:     SDUIScreenPayload?   = nil
    var answers:           [String: AnyCodable] = [:]
    var isLoading:         Bool                 = false
    var isSubmitting:      Bool                 = false
    var isComplete:        Bool                 = false
    var errorMessage:      String?              = nil
    var validationErrors:  [ValidationError]    = []

    private let network = KYCNetworkService()

    // MARK: - Dispatch

    @MainActor func dispatch(_ action: KYCAction) {
        // Apply reducer synchronously on main actor
        reduce(action)
        // Kick off async side-effects
        Task { @MainActor in await handleEffect(action) }
    }

    // MARK: - Reducer (pure state mutation)

    @MainActor
    private func reduce(_ action: KYCAction) {
        switch action {

        case .startSession:
            isLoading = true
            errorMessage = nil

        case .sessionStarted(let id, let total):
            sessionId = id
            totalSteps = total
            isLoading = false

        case .stepLoaded(let payload):
            screenPayload    = payload
            currentStepId    = payload.metadata.stepId
            currentStepIndex = payload.metadata.stepIndex
            totalSteps       = payload.metadata.totalSteps
            sectionTitle     = payload.metadata.sectionTitle
            isLoading        = false
            isSubmitting     = false
            validationErrors = []
            errorMessage     = nil

        case .setAnswer(let qId, let value):
            answers[qId] = value

        case .submitStep:
            isSubmitting     = true
            validationErrors = []
            errorMessage     = nil

        case .stepSubmitSuccess(_, let total):
            isSubmitting = false
            totalSteps   = total

        case .journeyComplete:
            isSubmitting = false
            isComplete   = true

        case .setLoading(let v):
            isLoading = v

        case .setSubmitting(let v):
            isSubmitting = v

        case .setError(let msg):
            errorMessage = msg
            isLoading    = false
            isSubmitting = false

        case .setValidationErrors(let errors):
            validationErrors = errors
            isSubmitting     = false

        case .clearValidationError(let qId):
            validationErrors.removeAll { $0.questionId == qId }
        }
    }

    // MARK: - Side Effects (network calls)

    @MainActor
    private func handleEffect(_ action: KYCAction) async {
        switch action {

        case .startSession:
            do {
                let result = try await network.startSession(platform: platform)
                dispatch(.sessionStarted(sessionId: result.sessionId, totalSteps: result.totalSteps))
                let payload = try await network.resume(sessionId: result.sessionId, platform: platform)
                dispatch(.stepLoaded(payload))
            } catch {
                dispatch(.setError("Could not connect to the mock BFF on port 4000.\n\(error.localizedDescription)"))
            }

        case .submitStep:
            guard let sid = sessionId, let stepId = currentStepId else {
                dispatch(.setError("No active session. Please restart."))
                return
            }
            do {
                let answerList = answers.map { AnswerEntry(questionId: $0.key, value: $0.value) }
                let result = try await network.submitStep(
                    sessionId: sid, stepId: stepId, answers: answerList)

                switch result.status {
                case "COMPLETE":
                    dispatch(.journeyComplete)

                case "NEXT_STEP":
                    dispatch(.stepSubmitSuccess(
                        nextStepId: result.nextStepId,
                        totalSteps: result.totalSteps ?? totalSteps))
                    if let nextId = result.nextStepId {
                        let payload = try await network.getStep(
                            sessionId: sid, stepId: nextId, platform: platform)
                        dispatch(.stepLoaded(payload))
                    }

                case "INVALID":
                    let errors = result.validationErrors?.map {
                        ValidationError(questionId: $0.questionId, message: $0.message)
                    } ?? []
                    dispatch(.setValidationErrors(errors))

                default:
                    dispatch(.setError("Unexpected response: \(result.status)"))
                }
            } catch {
                dispatch(.setError("Submission failed: \(error.localizedDescription)"))
            }

        default:
            break
        }
    }
}
