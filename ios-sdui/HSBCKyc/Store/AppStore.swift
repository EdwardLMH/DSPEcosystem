import Foundation
import Observation

// ─── State ───────────────────────────────────────────────────────────────────

struct KYCState {
    var sessionId: String?
    var currentStepId: String?
    var currentStepIndex: Int = 0
    var totalSteps: Int = 0
    var sectionTitle: String = ""
    var platform: String = "mobile"
    var screenPayload: SDUIScreenPayload?
    var answers: [String: AnyCodable] = [:]
    var isLoading: Bool = false
    var isSubmitting: Bool = false
    var isComplete: Bool = false
    var errorMessage: String?
    var validationErrors: [ValidationError] = []
}

struct ValidationError: Codable, Identifiable {
    var id: String { questionId }
    let questionId: String
    let message: String
}

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

// ─── Reducer ─────────────────────────────────────────────────────────────────

func kycReducer(state: inout KYCState, action: KYCAction) {
    switch action {
    case .startSession:
        state.isLoading = true
        state.errorMessage = nil

    case .sessionStarted(let id, let total):
        state.sessionId = id
        state.totalSteps = total
        state.isLoading = false

    case .stepLoaded(let payload):
        state.screenPayload = payload
        state.currentStepId = payload.metadata.stepId
        state.currentStepIndex = payload.metadata.stepIndex
        state.totalSteps = payload.metadata.totalSteps
        state.sectionTitle = payload.metadata.sectionTitle
        state.isLoading = false
        state.isSubmitting = false   // ← clear submitting when new step loads
        state.validationErrors = []
        state.errorMessage = nil     // ← clear any previous error

    case .setAnswer(let qId, let value):
        state.answers[qId] = value

    case .submitStep:
        state.isSubmitting = true
        state.validationErrors = []

    case .stepSubmitSuccess(let nextStepId, let total):
        state.isSubmitting = false
        state.totalSteps = total
        // screenPayload will be loaded by the effect

    case .journeyComplete:
        state.isSubmitting = false
        state.isComplete = true

    case .setLoading(let v):
        state.isLoading = v

    case .setSubmitting(let v):
        state.isSubmitting = v

    case .setError(let msg):
        state.errorMessage = msg
        state.isLoading = false
        state.isSubmitting = false

    case .setValidationErrors(let errors):
        state.validationErrors = errors
        state.isSubmitting = false

    case .clearValidationError(let qId):
        state.validationErrors.removeAll { $0.questionId == qId }
    }
}

// ─── Store (Observable — replaces Redux in Swift) ─────────────────────────────

@Observable
final class AppStore {
    private(set) var kyc = KYCState()
    private let network = KYCNetworkService()

    func dispatch(_ action: KYCAction) {
        kycReducer(state: &kyc, action: action)
        Task { await handleEffect(action) }
    }

    @MainActor
    private func handleEffect(_ action: KYCAction) async {
        switch action {

        case .startSession:
            TealiumClient.kycJourneyStarted()
            do {
                let result = try await network.startSession(platform: kyc.platform)
                dispatch(.sessionStarted(sessionId: result.sessionId, totalSteps: result.totalSteps))
                let payload = try await network.resume(sessionId: result.sessionId, platform: kyc.platform)
                dispatch(.stepLoaded(payload))
            } catch {
                dispatch(.setError("Could not connect to server. Is the mock BFF running?\n\(error.localizedDescription)"))
            }

        case .stepLoaded(let payload):
            TealiumClient.kycStepViewed(
                stepId:     payload.metadata.stepId,
                stepIndex:  payload.metadata.stepIndex,
                totalSteps: payload.metadata.totalSteps,
                section:    payload.metadata.sectionTitle
            )

        case .submitStep:
            guard let sessionId = kyc.sessionId,
                  let stepId = kyc.currentStepId else { return }
            TealiumClient.kycStepCompleted(
                stepId:    stepId,
                stepIndex: kyc.currentStepIndex,
                section:   kyc.sectionTitle
            )
            do {
                let answerList = kyc.answers.map { AnswerEntry(questionId: $0.key, value: $0.value) }
                let result = try await network.submitStep(
                    sessionId: sessionId, stepId: stepId, answers: answerList)

                switch result.status {
                case "COMPLETE":
                    TealiumClient.kycJourneyCompleted()
                    dispatch(.journeyComplete)
                case "NEXT_STEP":
                    dispatch(.stepSubmitSuccess(nextStepId: result.nextStepId,
                                               totalSteps: result.totalSteps ?? kyc.totalSteps))
                    if let nextId = result.nextStepId {
                        let payload = try await network.getStep(
                            sessionId: sessionId, stepId: nextId, platform: kyc.platform)
                        dispatch(.stepLoaded(payload))
                    }
                case "INVALID":
                    let errors = result.validationErrors?.map {
                        ValidationError(questionId: $0.questionId, message: $0.message)
                    } ?? []
                    // Tag each validation error
                    errors.forEach { err in
                        TealiumClient.kycValidationError(
                            stepId: stepId, questionId: err.questionId, errorMsg: err.message)
                    }
                    dispatch(.setValidationErrors(errors))
                default: break
                }
            } catch {
                dispatch(.setError("Submission failed: \(error.localizedDescription)"))
            }

        default: break
        }
    }
}
