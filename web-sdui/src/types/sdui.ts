// HSBC Digital Sales Promotion Platform — SDUI Type Definitions

export type ActionType =
  | 'NAVIGATE'
  | 'DEEP_LINK'
  | 'API_CALL'
  | 'MODAL'
  | 'TRACK'
  | 'SHARE';

export type ContainerType =
  | 'STACK'
  | 'SCROLL'
  | 'GRID'
  | 'CAROUSEL'
  | 'TABS'
  | 'ACCORDION';

export interface Spacing {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface AnalyticsConfig {
  impressionEvent?: string;
  clickEvent?: string;
  properties?: Record<string, string | number | boolean>;
  sampleRate?: number; // 0–1
}

export interface VisibilityRules {
  minAppVersion?: string;
  maxAppVersion?: string;
  segments?: string[];
  locales?: string[];
  startDate?: string; // ISO 8601
  endDate?: string;
  featureFlags?: string[];
}

// ─── Action Definitions ──────────────────────────────────────────────────────

export interface NavigateAction {
  type: 'NAVIGATE';
  route: string;
  params?: Record<string, string>;
  replace?: boolean;
}

export interface DeepLinkAction {
  type: 'DEEP_LINK';
  url: string;
  target?: '_blank' | '_self';
}

export interface ApiCallAction {
  type: 'API_CALL';
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  onSuccessAction?: ActionDefinition;
  onErrorAction?: ActionDefinition;
}

export interface ModalAction {
  type: 'MODAL';
  modalId: string;
  modalNode?: ComponentNode;
  dismissible?: boolean;
}

export interface TrackAction {
  type: 'TRACK';
  eventName: string;
  properties?: Record<string, string | number | boolean>;
}

export interface ShareAction {
  type: 'SHARE';
  title?: string;
  text?: string;
  url?: string;
}

export type ActionDefinition =
  | NavigateAction
  | DeepLinkAction
  | ApiCallAction
  | ModalAction
  | TrackAction
  | ShareAction;

// ─── Container Props ──────────────────────────────────────────────────────────

export interface ContainerProps {
  type: ContainerType;
  gap?: number;
  columns?: number; // for GRID
  scrollDirection?: 'horizontal' | 'vertical'; // for SCROLL
  tabLabels?: string[]; // for TABS
  padding?: Spacing;
  margin?: Spacing;
  backgroundColor?: string;
  borderRadius?: number;
  elevation?: number;
}

// ─── Layout Nodes ─────────────────────────────────────────────────────────────

export interface BaseNode {
  id: string;
  visibility?: VisibilityRules;
  analytics?: AnalyticsConfig;
  testId?: string;
}

export interface ContainerNode extends BaseNode {
  kind: 'container';
  containerProps: ContainerProps;
  children: LayoutNode[];
}

export interface ComponentNode extends BaseNode {
  kind: 'component';
  type: string; // maps to ComponentRegistry key
  props: Record<string, unknown>;
  actions?: Partial<Record<string, ActionDefinition>>;
  fallback?: string; // rendered text if component not found
}

export type LayoutNode = ContainerNode | ComponentNode;

// ─── Screen Payload ───────────────────────────────────────────────────────────

export interface ScreenMetadata {
  screenId: string;
  version: number;
  locale: string;
  platform: 'web' | 'ios' | 'android';
  ttl: number; // seconds
  generatedAt: string; // ISO 8601
  experimentId?: string;
  variantId?: string;
}

export interface ScreenPayload {
  metadata: ScreenMetadata;
  root: LayoutNode;
  globalAnalytics?: AnalyticsConfig;
  theme?: Record<string, string>;
}

// ─── Hook Options ─────────────────────────────────────────────────────────────

export interface SDUIOptions {
  locale?: string;
  sduiVersion?: string;
  revalidateOnFocus?: boolean;
  suspense?: boolean;
}

export interface SDUIScreenState {
  payload: ScreenPayload | null;
  loading: boolean;
  error: Error | null;
  isStale: boolean;
  refresh: () => void;
}
