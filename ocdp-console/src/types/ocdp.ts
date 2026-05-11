// ─── OCDP Type Definitions ────────────────────────────────────────────────────

export type Channel = 'SDUI' | 'WEB_STANDARD' | 'WEB_WECHAT';

// ─── Page Templates (sourced from UCP) ────────────────────────────────────────

export interface PageTemplateStarterSlice {
  type: string;
  props: Record<string, unknown>;
  locked?: boolean;
}

export interface PageTemplate {
  templateId: string;
  name: string;
  description: string;
  icon: string;
  channels: Channel[];
  bizLineIds: BizLineId[];
  category: 'generic' | 'campaign' | 'product' | 'insight' | 'journey';
  starterSlices: PageTemplateStarterSlice[];
  seoRequired: boolean;
  aeoRequired: boolean;
  status: 'ACTIVE' | 'DEPRECATED';
  createdAt: string;
  updatedAt: string;
  maintainedBy: string;
  usageCount: number;
}

export type BizLineId = 'PAYMENT' | 'WEB_ENABLER' | 'LENDING' | 'COLLECTION' | 'WEALTH' | 'MARKETING';

export interface BizLine {
  bizLineId: string;
  displayName: string;
  description: string;
  active: boolean;
}

export interface Market {
  marketId: string;
  marketName: string;
  active: boolean;
  timezone: string;
  tzLabel: string;
  // AD groups that are the default author/approver pool for this market.
  // Global Admin AD groups (marketId === 'GLOBAL') apply as fallback when unset.
  defaultAuthorGroupId?: string;
  defaultApproverGroupId?: string;
}

export interface ReleaseTarget {
  targetId: string;
  displayName: string;
  domainSuffix: string;
  isGlobal: boolean;
  active: boolean;
}

export type GroupType = 'AD_GROUP' | 'AUDIT_GROUP' | 'ADMIN_GROUP';
export type MemberRole = 'AUTHOR' | 'APPROVER';

export interface AdGroup {
  groupId: string;
  groupName: string;
  marketId: string;
  bizLineId: BizLineId;
  groupType: GroupType;
}

export interface ApprovalFlowStep {
  stepOrder: number;
  approverGroupId: string;
  approverGroupName: string;
}

export interface ApprovalFlow {
  flowId: string;
  flowName: string;
  marketId: string;
  bizLineId: BizLineId | null;
  minApprovers: number;
  steps: ApprovalFlowStep[];
  samePersionRestriction: boolean;
}

export interface WeChatServiceAccount {
  accountId: string;
  displayName: string;
  wechatName: string;
  appid: string;
  accountType: 'SERVICE_ACCOUNT' | 'SUBSCRIPTION_ACCOUNT';
  verified: boolean;
  followerCount: number;
  primaryMarketId: string;
  scope: 'MARKET' | 'GLOBAL';
  active: boolean;
  assignedMarkets: { marketId: string; marketName: string; isDefault: boolean }[];
}

export interface WeChatMessageTemplate {
  templateId: string;
  accountId: string;
  wechatTemplateId: string;
  templateName: string;
  fields: { key: string; label: string; type: string }[];
  bizLineScope: BizLineId[] | null;
  active: boolean;
}

export type SliceType =
  | 'HEADER_NAV' | 'AI_SEARCH_BAR' | 'QUICK_ACCESS' | 'PROMO_BANNER' | 'FUNCTION_GRID'
  | 'AI_ASSISTANT' | 'AD_BANNER' | 'FLASH_LOAN' | 'WEALTH_SELECTION'
  | 'FEATURED_RANKINGS' | 'LIFE_DEALS' | 'SPACER'
  | 'VIDEO_PLAYER'            // Inline video player sourced from UCP content asset
  | 'MARKET_BRIEFING_TEXT'    // Rich-text market briefing sourced from UCP content
  | 'CONTACT_RM_CTA'          // Sticky CTA button — routes to RM finder deep link
  | 'DEPOSIT_RATE_TABLE'      // Time deposit interest rate table (rates only, no CTA)
  | 'DEPOSIT_OPEN_CTA'        // Full-width "Open a Deposit" CTA button for deposit campaigns
  | 'DEPOSIT_FAQ'             // Collapsible FAQ accordion for deposit products
  | 'CAMPAIGN_HERO'           // Full-width hero banner with headline + sub-copy (campaign pages)
  | 'CAMPAIGN_BENEFITS'       // Icon + text benefit grid (campaign pages)
  | 'CAMPAIGN_CTA'            // Primary CTA button block (campaign pages)
  // Home Hub components (new design)
  | 'HOME_SEARCH_HEADER'      // Segment-adaptive header (red/jade/orange/silver) + AI search bar combined
  | 'PREMIER_HEADER'          // Red HSBC Premier top header bar
  | 'ELITE_HEADER'            // Jade-coloured HSBC Elite top header bar
  | 'ADVANCE_HEADER'          // Orange HSBC Advance top header bar
  | 'MASS_HEADER'             // Silver HSBC Personal Banking top header bar
  | 'HOME_SEARCH_BAR'         // White pill search bar below header
  | 'CONTENT_TAB_BAR'         // Horizontal pill tab switcher (My pick / Invest / Global…)
  | 'QUICK_ACCESS_GRID'       // 5-icon quick-access row (row 1 or row 2)
  | 'COMBO_QUICK_ACCESS'      // Combined: tab bar + row-1 icons + row-2 icons (single card)
  | 'CARD_ACTIVATION_BANNER'  // Notification banner for card activation prompt
  | 'QUEST_BANNER'            // Getting-started quest progress banner
  | 'FEATURE_PRODUCT'         // Fund tab list with returns (Top performers etc.)
  | 'WEALTH_STUDIO_CAROUSEL'  // Premier Elite Wealth Studio horizontal video carousel
  | 'GUIDES_INSIGHTS_CAROUSEL'         // Guides and insights article card carousel
  | 'FX_WATCHLIST'            // FX currency pair watchlist with tier badge
  | 'DISCOVER_MORE_CAROUSEL'           // Discover more horizontal campaign cards
  | 'KYC_NAME_DOB' | 'KYC_SINGLE_SELECT' | 'KYC_ID_CAPTURE' | 'KYC_DOC_UPLOAD'
  | 'KYC_CONTACT' | 'KYC_ADDRESS' | 'KYC_EMPLOYMENT' | 'KYC_SOURCE_OF_FUNDS'
  | 'KYC_LIVENESS' | 'KYC_OPEN_BANKING' | 'KYC_DECLARATION'
  // Web KYC — compound steps for wider viewport (groups multiple mobile steps into one page)
  | 'KYC_WEB_IDENTITY'        // Personal info + nationality + ID document (mobile steps 1–3)
  | 'KYC_WEB_UPLOAD_CONTACT'  // Doc upload + contact details (mobile steps 4–5)
  | 'KYC_WEB_BACKGROUND'      // Address + employment + source of funds (mobile steps 6–8)
  | 'KYC_WEB_LIVENESS'        // Liveness check — same as mobile but with wider layout
  | 'KYC_WEB_OPEN_BANKING'    // Open banking — wider layout with bank cards
  | 'KYC_WEB_DECLARATION';    // Legal declarations — two-column review + sign

// ─── Rule Engine ──────────────────────────────────────────────────────────────

export type CustomerSegment = string;  // seeded from CustomerSegmentDef.segmentId

export type AccountType = string;      // seeded from AccountTypeDef.typeId

export type CustomerLocation = string; // seeded from LocationDef.locationId

// ─── Rule Parameter Definitions (admin-managed catalogue) ─────────────────────

export interface CustomerSegmentDef {
  segmentId: string;
  displayName: string;
  description: string;
  active: boolean;
}

export interface AccountTypeDef {
  typeId: string;
  displayName: string;
  description: string;
  active: boolean;
}

export interface LocationDef {
  locationId: string;
  displayName: string;
  description: string;
  active: boolean;
}

export type RuleOperator = 'is' | 'is_not' | 'in' | 'not_in';

export interface SegmentCondition {
  field: 'customerSegment';
  operator: RuleOperator;
  value: CustomerSegment | CustomerSegment[];
}

export interface AccountTypeCondition {
  field: 'accountType';
  operator: RuleOperator;
  value: AccountType | AccountType[];
}

export interface LocationCondition {
  field: 'customerLocation';
  operator: RuleOperator;
  value: CustomerLocation | CustomerLocation[];
}

// Free-form condition: match any field path in the request JSON by name
export interface CustomFieldCondition {
  field: 'custom';
  customFieldName: string;   // e.g. "request.body.isPremiumUser"
  operator: RuleOperator;
  value: string;             // string to compare against
}

export type RuleCondition = SegmentCondition | AccountTypeCondition | LocationCondition | CustomFieldCondition;

export type RuleAction = 'show' | 'hide';

export interface VisibilityRule {
  ruleId: string;
  label: string;
  conditions: RuleCondition[];
  conditionLogic: 'AND' | 'OR';
  action: RuleAction;
}

// Preview context for the editor — simulates a user profile for rule evaluation.
// `customFields` holds free-form key→value pairs used by CustomFieldCondition.
export interface PreviewContext {
  customerSegment: CustomerSegment;
  accountType: AccountType;
  customerLocation: CustomerLocation;
  customFields?: Record<string, string>;
}

export interface CanvasSlice {
  instanceId: string;
  type: SliceType;
  props: Record<string, unknown>;
  visible: boolean;
  locked: boolean;
  visibilityRule?: VisibilityRule;
}

export type PageType = 'WEALTH_HUB' | 'KYC_JOURNEY' | 'PRODUCT' | 'CAMPAIGN' | 'MARKET_INSIGHT' | 'CUSTOM';

export interface CampaignSchedule {
  publishAt: string;
  takedownAt: string;
  timerStopped?: boolean;
  stoppedAt?: string;
}

export type AuthoringStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'LIVE';

export type NativeTarget = 'ios' | 'android' | 'harmonynext' | 'web';

export interface PageLayout {
  pageId: string;
  name: string;
  pageType: PageType;
  pageTemplateId?: string;
  description?: string;
  // SDUI: which native clients render this page. Empty = none selected. Ignored for WEB_STANDARD/WEB_WECHAT.
  nativeTargets: NativeTarget[];
  locale: string;
  // Multi-language support
  supportedLocales: string[];  // locales this page is authored in; first entry = primary (same as locale)
  translations: Record<string, Record<string, Record<string, string>>>;  // locale → instanceId → propKey → value
  thumbnail: string;
  tags: string[];
  channel: Channel;
  scope: 'GLOBAL' | 'MARKET';
  marketId: string;
  releaseMarketIds: string[];
  bizLineId: BizLineId;
  groupId: string;
  authoringStatus: AuthoringStatus;
  slices: CanvasSlice[];
  // WEB_STANDARD only: whether the page is publicly accessible (indexed, SEO/AEO assessed)
  isPublic?: boolean;
  webSlug?: string;
  webMetaTitle?: string;
  webMetaDescription?: string;
  webLayoutTemplate?: string;
  wechatPageUrl?: string;
  wechatShareTitle?: string;
  wechatShareDesc?: string;
  lastReviewedAt?: string;
  authorCredentials?: string;
  campaignSchedule?: CampaignSchedule;
}

export type WorkflowStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'LIVE';

export interface WorkflowComment {
  id: string;
  authorId: string;
  authorRole: string;
  text: string;
  timestamp: string;
}

export interface WorkflowEntry {
  entryId: string;
  pageId: string;
  pageName: string;
  status: WorkflowStatus;
  authorId: string;
  authorName: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewerId?: string;
  reviewerName?: string;
  comments: WorkflowComment[];
  layout: PageLayout;
  version: number;
}

export type ApprovalStepStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PageApprovalInstance {
  instanceId: string;
  pageId: string;
  targetId: string;
  flowId: string;
  status: ApprovalStepStatus;
  currentStepOrder: number;
  stepStatuses: { stepOrder: number; status: ApprovalStepStatus; actorId?: string; actorName?: string; actedAt?: string; comment?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface PageSubmission {
  submissionId: string;
  pageId: string;
  pageName: string;
  channel: Channel;
  targetIds: string[];
  comment?: string;
  submittedAt: string;
  submittedById: string;
  submittedByName: string;
  approvalInstances: PageApprovalInstance[];
}

export type ProductionStatus = 'LIVE' | 'NEVER_RELEASED' | 'ROLLED_BACK' | 'SUPERSEDED';

export interface PageMarketStatus {
  pageId: string;
  targetId: string;
  productionStatus: ProductionStatus;
  liveVersion?: number;
  lastPublishedAt?: string;
}

export interface AEOScore {
  pageId: string;
  targetId: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  checkedAt: string;
  breakdown: { label: string; score: number; maxScore: number; pass: boolean; recommendation?: string }[];
}

export interface PageUsageStat {
  pageId: string;
  targetId: string;
  // Traffic
  dau: number;           // Daily Active Users
  wau: number;           // Weekly Active Users
  mau: number;           // Monthly Active Users
  newUsers: number;      // New users in current month
  returningUsers: number;
  // Engagement
  avgSessionSec: number;
  avgPageDepth: number;  // avg pages viewed per session
  bounceRate: number;    // 0..1 fraction
  // Conversion
  conversionRate: number; // 0..1 fraction
  ctr: number;            // click-through rate on primary CTA, 0..1
  // Quality
  errorRate: number;      // 0..1 fraction of sessions with errors
}

export interface JourneyUsageStat {
  journeyId: string;
  targetId: string;
  // Traffic
  dau: number;
  wau: number;
  mau: number;
  newUsers: number;
  returningUsers: number;
  // Funnel
  journeyStartRate: number;  // % of page visitors who start the journey, 0..1
  completionRate: number;    // % who complete all steps, 0..1
  dropOffStep: number;       // 1-based step index with highest drop-off
  avgCompletionSec: number;  // avg time to complete full journey in seconds
  // Conversion
  conversionRate: number;    // end-goal conversion (e.g. account opened), 0..1
  // Quality
  errorRate: number;
}

export interface ServiceAccountMessage {
  messageId: string;
  accountId: string;
  templateId?: string;
  subject?: string;
  content: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENT';
  scheduledAt?: string;
  sentAt?: string;
  recipients: number;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: string;
  action: string;
  pageId: string;
  pageName: string;
  details?: string;
  channel?: Channel;
  marketId?: string;
  bizLineId?: string;
  releaseTargetId?: string;
}

export type StaffRole =
  | 'WEALTH-AUTHOR' | 'WEALTH-APPROVER'
  | 'CARDS-AUTHOR' | 'CARDS-APPROVER'
  | 'PAYMENT-AUTHOR' | 'PAYMENT-APPROVER'
  | 'MARKETING-AUTHOR' | 'MARKETING-APPROVER'
  | 'ADMIN' | 'GLOBAL_ADMIN' | 'AUDITOR'
  | 'AI-SEARCH-OPERATOR';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  marketId: string;
  bizLineId: BizLineId;
  groupId: string;
}

export type Persona = 'Personal' | 'Business' | 'Global Banking and Markets' | 'HSBC Private Bank';

export type NavView =
  | 'pages' | 'journeys'
  | 'pending' | 'history'
  | 'stats' | 'aeo'
  | 'admin-markets' | 'admin-bizlines' | 'admin-groups' | 'admin-flows'
  | 'admin-value-streams' | 'admin-rule-params' | 'audit'
  | 'ai-search'
  | 'wechat';

// ─── AI Search Configuration ──────────────────────────────────────────────────

export type AISearchAppId = 'ios' | 'android' | 'harmonynext' | 'web';

export type AISearchRefreshSchedule = 'manual' | 'hourly' | 'daily';

export type AISearchContentSourceType = 'ocdp_page' | 'aem_url';

export interface AISearchContentSource {
  type: AISearchContentSourceType;
  /** For ocdp_page: the pageId. For aem_url: the full AEM page URL. */
  ref: string;
  /** Human-readable label for this source (auto-populated from page name or URL). */
  label: string;
}

export interface AISearchQuickAccessSource {
  /** 'url' — BFF fetches + parses JSON from a remote URL at rebuild time. */
  /** 'json' — Operator pastes/uploads raw JSON (stored inline). */
  mode: 'url' | 'json';
  url?: string;
  json?: string;
}

export interface AISearchConfig {
  configId: string;
  appId: AISearchAppId;
  displayName: string;
  enabled: boolean;

  quickAccessSource: AISearchQuickAccessSource;

  contentSources: AISearchContentSource[];

  searchEndpointOverride?: string;
  refreshSchedule: AISearchRefreshSchedule;

  /** ISO timestamp of the last corpus rebuild. Null = never rebuilt. */
  lastRebuiltAt: string | null;
  /** Number of items in the corpus after the last rebuild. */
  corpusSize: number;

  createdAt: string;
  updatedAt: string;
}

// ─── UCP Content Assets (fetched from /api/v1/ucp/content-assets) ─────────────

export type AssetType = 'IMAGE' | 'VIDEO' | 'FILE' | 'DOCUMENT';
export type AssetStatus = 'ACTIVE' | 'ARCHIVED';

export interface UCPContentAsset {
  assetId: string;
  name: string;
  assetType: AssetType;
  mimeType: string;
  sizeBytes: number;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  tags?: string[];
  marketId: string;
  bizLineId: BizLineId;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  status: AssetStatus;
  // Video-specific metadata (present when assetType === 'VIDEO')
  durationSeconds?: number;
  presenter?: string;
  presenterTitle?: string;
}

// ─── UCP Component Registry (fetched from /api/v1/ucp/components) ─────────────

export interface UCPComponent {
  componentId: string;
  sliceType: SliceType;
  label: string;
  description: string;
  icon: string;
  category: string;
  configurable: string[];
  minHeight: number;
  singleton: boolean;
  version: string;
  maintainedBy: string;
  status: 'ACTIVE' | 'DEPRECATED';
}
