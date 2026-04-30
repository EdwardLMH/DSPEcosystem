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
}
