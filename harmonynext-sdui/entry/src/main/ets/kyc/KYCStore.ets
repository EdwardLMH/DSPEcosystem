// KYCStore.ets
// HSBC HarmonyNext — KYC Redux store.
//
// Mirrors iOS AppStore.swift (dispatch + reduce + handleEffect) and
// Android KYCViewModel.kt (ViewModel owns state + coroutine effects).
//
// Architecture:
//   KYCStore  ←→  @Observed, owned by Index.ets as @State
//     .state    ←→  @Observed KYCState (reactive properties)
//     .dispatch(action)     ← called by shell (START_SESSION, SUBMIT_STEP)
//                              and step views (SET_ANSWER, CLEAR_VALIDATION_ERROR)
//     .handleEffect(action) ← async network calls; dispatches result actions back
//
// Shell components: @ObjectLink store: KYCStore  → call store.dispatch(...)
// Step  components: @ObjectLink state: KYCState  → call state.setAnswer(...) for answers

import {
  KYCState, KYCAction, AnswerEntry, ValidationErrorDto
} from '../models/SDUIModels'
import {
  startSession, resume, getStep, submitStep
} from '../network/KYCNetworkService'
import { SensorDataClient } from '../network/SensorDataClient'

@Observed
export class KYCStore {

  // KYCState is @Observed — nested reactive tracking via @ObjectLink in children.
  state: KYCState = new KYCState()

  // Callbacks wired by KYCRootView to flip its own @State flags, which are the
  // only way to trigger a re-render of the root branch switch in ArkTS.
  onScreenReady: () => void = () => {}
  onComplete: () => void = () => {}

  // ─── Dispatch ──────────────────────────────────────────────────────────────
  // 1. Apply reducer synchronously (pure state mutation — no network).
  // 2. Kick off async side-effect if the action has one.

  dispatch(action: KYCAction): void {
    this.state.dispatch(action)   // synchronous reducer in KYCState
    this.handleEffect(action)     // async effects (network calls)
  }

  // ─── Side Effects ──────────────────────────────────────────────────────────
  // Mirrors iOS AppStore.handleEffect() and Android KYCViewModel coroutine blocks.
  // Only START_SESSION and SUBMIT_STEP trigger network calls.

  handleEffect(action: KYCAction): void {

    if (action.type === 'START_SESSION') {
      SensorDataClient.kycJourneyStarted()
      startSession('harmonynext')
        .then(res => {
          this.dispatch({
            type: 'SESSION_STARTED',
            sessionId: res.sessionId,
            totalSteps: res.totalSteps
          })
          return resume(res.sessionId, 'harmonynext')
        })
        .then(payload => {
          this.dispatch({ type: 'STEP_LOADED', payload })
          this.onScreenReady()
          SensorDataClient.kycStepViewed(
            payload.metadata.stepId,
            payload.metadata.stepIndex,
            payload.metadata.totalSteps,
            payload.metadata.sectionTitle
          )
        })
        .catch((err: Error) => {
          this.dispatch({
            type: 'SET_ERROR',
            errorMessage: `Cannot connect to server. Is the mock BFF running?\n${err.message}`
          })
        })

    } else if (action.type === 'SUBMIT_STEP') {
      const sessionId = this.state.sessionId
      const stepId = this.state.currentStepId
      if (sessionId === '' || stepId === '') {
        this.dispatch({ type: 'SET_ERROR', errorMessage: 'No active session. Please restart.' })
        return
      }

      SensorDataClient.kycStepCompleted(stepId, this.state.currentStepIndex, this.state.sectionTitle)

      // Collect current answers into AnswerEntry list (mirrors iOS answerList build)
      const answers: AnswerEntry[] = []
      Object.keys(this.state.answers).forEach((k: string) => {
        answers.push({ questionId: k, value: this.state.answers[k] })
      })

      submitStep(sessionId, stepId, { answers })
        .then(res => {
          if (res.status === 'COMPLETE') {
            SensorDataClient.kycJourneyCompleted()
            this.dispatch({ type: 'JOURNEY_COMPLETE' })
            this.onComplete()

          } else if (res.status === 'NEXT_STEP') {
            const nextId = res.nextStepId
            this.dispatch({
              type: 'STEP_SUBMIT_SUCCESS',
              nextStepId: nextId,
              totalSteps: res.totalSteps
            })
            if (nextId !== undefined && nextId !== null && nextId !== '') {
              getStep(sessionId, nextId, 'harmonynext')
                .then(payload => {
                  this.dispatch({ type: 'STEP_LOADED', payload })
                  SensorDataClient.kycStepViewed(
                    payload.metadata.stepId,
                    payload.metadata.stepIndex,
                    payload.metadata.totalSteps,
                    payload.metadata.sectionTitle
                  )
                })
                .catch((err: Error) => {
                  this.dispatch({
                    type: 'SET_ERROR',
                    errorMessage: `Failed to load next step: ${err.message}`
                  })
                })
            }

          } else if (res.status === 'INVALID') {
            this.dispatch({
              type: 'SET_VALIDATION_ERRORS',
              validationErrors: res.validationErrors ?? []
            })

          } else {
            // Unexpected status — clear submitting flag via a no-op STEP_SUBMIT_SUCCESS
            this.dispatch({ type: 'STEP_SUBMIT_SUCCESS', totalSteps: this.state.totalSteps })
          }
        })
        .catch((err: Error) => {
          this.dispatch({
            type: 'SET_ERROR',
            errorMessage: `Submission failed: ${err.message}`
          })
        })
    }
    // All other action types (SET_ANSWER, SESSION_STARTED, STEP_LOADED, etc.)
    // have no async side effect — reducer in KYCState.dispatch() handles them fully.
  }
}
