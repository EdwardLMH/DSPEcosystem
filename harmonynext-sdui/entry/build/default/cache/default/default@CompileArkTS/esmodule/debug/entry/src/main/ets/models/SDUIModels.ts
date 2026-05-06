// SDUIModels.ets
// HSBC HarmonyNext SDUI — ArkTS data models matching SDUI JSON schema v2.3
export interface SDUIScreenPayload {
    schemaVersion: string;
    screen: string;
    ttl: number;
    integrity: string;
    layout: SDUINode;
    metadata: ScreenMetadata;
}
export interface ScreenMetadata {
    sessionId: string;
    stepId: string;
    stepIndex: number;
    totalSteps: number;
    sectionTitle: string;
    platform: string;
}
export interface SDUINode {
    type: string;
    id: string;
    props?: Record<string, any>;
    children?: SDUINode[];
    analytics?: AnalyticsConfig;
    visibility?: VisibilityRules;
    fallback?: SDUINode;
}
export interface AnalyticsConfig {
    impressionEvent: string;
    clickEvent?: string;
    componentId: string;
    variantId?: string;
    customProperties?: Record<string, string>;
}
export interface VisibilityRules {
    segment?: string[];
    platform?: string[];
    locale?: string[];
    minSdui?: string;
}
export interface ActionDefinition {
    type: 'NAVIGATE' | 'DEEP_LINK' | 'API_CALL' | 'MODAL' | 'TRACK' | 'SHARE';
    destination?: string;
    params?: Record<string, string>;
    payload?: Record<string, any>;
}
// ─── KYC DTOs ─────────────────────────────────────────────────────────────────
export interface StartSessionResponse {
    sessionId: string;
    totalSteps: number;
    platform: string;
}
export interface SubmitRequest {
    answers: AnswerEntry[];
}
export interface AnswerEntry {
    questionId: string;
    value: any;
}
export interface SubmitResponse {
    status: string;
    nextStepId?: string;
    totalSteps?: number;
    validationErrors?: ValidationErrorDto[];
}
export interface ValidationErrorDto {
    questionId: string;
    message: string;
}
// ─── Actions — mirrors iOS KYCAction enum / Android ViewModel named methods ───
//
// type values:
//   START_SESSION         dispatched by shell "Begin Application" button
//   SESSION_STARTED       dispatched by store after BFF session start succeeds
//   STEP_LOADED           dispatched by store after BFF returns step payload
//   SET_ANSWER            dispatched by step views on each field change
//   SUBMIT_STEP           dispatched by shell "Continue / Submit" button
//   STEP_SUBMIT_SUCCESS   dispatched by store after BFF submit returns NEXT_STEP
//   JOURNEY_COMPLETE      dispatched by store after BFF submit returns COMPLETE
//   SET_ERROR             dispatched by store on any network failure
//   SET_VALIDATION_ERRORS dispatched by store when BFF returns INVALID
//   CLEAR_VALIDATION_ERROR dispatched by step views on re-focus of a field
export interface KYCAction {
    type: string;
    questionId?: string;
    answerValue?: any;
    sessionId?: string;
    totalSteps?: number;
    payload?: SDUIScreenPayload;
    nextStepId?: string;
    errorMessage?: string;
    validationErrors?: ValidationErrorDto[];
}
// ─── UI State ─────────────────────────────────────────────────────────────────
@Observed
export class KYCState {
    sessionId: string = '';
    currentStepId: string = '';
    currentStepIndex: number = 0;
    totalSteps: number = 0;
    sectionTitle: string = '';
    screenPayload: SDUIScreenPayload | null = null;
    answers: Record<string, any> = {};
    validationErrors: Record<string, string> = {};
    isLoading: boolean = false;
    isSubmitting: boolean = false;
    isComplete: boolean = false;
    errorMessage: string = '';
    // Encapsulated answer mutation — use instead of direct answers[key] = v.
    // Mirrors Android viewModel.setAnswer() and iOS dispatch(.setAnswer(...)).
    setAnswer(questionId: string, value: any): void {
        this.answers[questionId] = value;
    }
    // Synchronous reducer — pure state mutation, no side effects.
    // Called by KYCStore.dispatch() before handleEffect().
    dispatch(action: KYCAction): void {
        if (action.type === 'START_SESSION') {
            this.isLoading = true;
            this.errorMessage = '';
        }
        else if (action.type === 'SESSION_STARTED') {
            this.sessionId = action.sessionId ?? '';
            this.totalSteps = action.totalSteps ?? 0;
            this.isLoading = false;
        }
        else if (action.type === 'STEP_LOADED') {
            const p = action.payload;
            if (p !== undefined && p !== null) {
                this.screenPayload = p;
                this.currentStepId = p.metadata.stepId;
                this.currentStepIndex = p.metadata.stepIndex;
                this.totalSteps = p.metadata.totalSteps;
                this.sectionTitle = p.metadata.sectionTitle;
            }
            this.isLoading = false;
            this.isSubmitting = false;
            this.validationErrors = {};
            this.errorMessage = '';
        }
        else if (action.type === 'SET_ANSWER') {
            const qId = action.questionId;
            if (qId !== undefined && qId !== null && qId !== '') {
                this.answers[qId] = action.answerValue ?? ('' as any);
            }
        }
        else if (action.type === 'SUBMIT_STEP') {
            this.isSubmitting = true;
            this.validationErrors = {};
            this.errorMessage = '';
        }
        else if (action.type === 'STEP_SUBMIT_SUCCESS') {
            this.isSubmitting = false;
            this.totalSteps = action.totalSteps ?? this.totalSteps;
        }
        else if (action.type === 'JOURNEY_COMPLETE') {
            this.isSubmitting = false;
            this.isComplete = true;
        }
        else if (action.type === 'SET_ERROR') {
            this.errorMessage = action.errorMessage ?? '';
            this.isLoading = false;
            this.isSubmitting = false;
        }
        else if (action.type === 'SET_VALIDATION_ERRORS') {
            const newErrors: Record<string, string> = {};
            const errs = action.validationErrors ?? [];
            errs.forEach((e: ValidationErrorDto) => {
                newErrors[e.questionId] = e.message;
            });
            this.validationErrors = newErrors;
            this.isSubmitting = false;
        }
        else if (action.type === 'CLEAR_VALIDATION_ERROR') {
            const qId = action.questionId;
            if (qId !== undefined && qId !== null) {
                const newErrors: Record<string, string> = {};
                Object.keys(this.validationErrors).forEach((k: string) => {
                    if (k !== qId) {
                        newErrors[k] = this.validationErrors[k];
                    }
                });
                this.validationErrors = newErrors;
            }
        }
    }
}
