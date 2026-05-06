// ─── OCDP Type Definitions ────────────────────────────────────────────────────

export type Channel = 'SDUI' | 'WEB_STANDARD' | 'WEB_WECHAT';

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
  | 'DEPOSIT_OPEN_CTA'       // Full-width "Open a Deposit" CTA button for deposit campaigns
  | 'DEPOSIT_FAQ'             // Collapsible FAQ accordion for deposit products
  | 'KYC_NAME_DOB' | 'KYC_SINGLE_SELECT' | 'KYC_ID_CAPTURE' | 'KYC_DOC_UPLOAD'
  | 'KYC_CONTACT' | 'KYC_ADDRESS' | 'KYC_EMPLOYMENT' | 'KYC_SOURCE_OF_FUNDS'
  | 'KYC_LIVENESS' | 'KYC_OPEN_BANKING' | 'KYC_DECLARATION'
  // Web KYC — compound steps for wider viewport (groups multiple mobile steps into one page)
  | 'KYC_WEB_IDENTITY'    // Personal info + nationality + ID document (mobile steps 1–3)
  | 'KYC_WEB_UPLOAD_CONTACT' // Doc upload + contact details (mobile steps 4–5)
  | 'KYC_WEB_BACKGROUND'  // Address + employment + source of funds (mobile steps 6–8)
  | 'KYC_WEB_LIVENESS'    // Liveness check — same as mobile but with wider layout
  | 'KYC_WEB_OPEN_BANKING' // Open banking — wider layout with bank cards
  | 'KYC_WEB_DECLARATION'; // Legal declarations — two-column review + sign

// ─── Rule Engine ──────────────────────────────────────────────────────────────

export type CustomerSegment = 'premier' | 'jade' | 'mass' | 'advance';

export type AccountType =
  | 'wealth_account'
  | 'credit_card'
  | 'current_account'
  | 'savings_account'
  | 'mortgage'
  | 'time_deposit';

export type CustomerLocation =
  | 'HK'
  | 'mainland_china'
  | 'macau'
  | 'singapore'
  | 'uk'
  | 'other';

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

export type RuleCondition = SegmentCondition | AccountTypeCondition | LocationCondition;

export type RuleAction = 'show' | 'hide';

export interface VisibilityRule {
  ruleId: string;
  label: string;
  conditions: RuleCondition[];
  conditionLogic: 'AND' | 'OR';
  action: RuleAction;
}

// Preview context for the editor — simulates a user profile for rule evaluation
export interface PreviewContext {
  customerSegment: CustomerSegment;
  accountType: AccountType;
  customerLocation: CustomerLocation;
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
  description?: string;
  // SDUI: which native clients render this page. Empty = none selected. Ignored for WEB_STANDARD/WEB_WECHAT.
  nativeTargets: NativeTarget[];
  locale: string;
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
  breakdown: { label: string; score: number; maxScore: number; pass: boolean }[];
}

export interface PageUsageStat {
  pageId: string;
  targetId: string;
  daily: number;
  weekly: number;
  monthly: number;
  avgSessionSec: number;
  bounceRate: number;
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
  | 'ADMIN' | 'AUDITOR';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  marketId: string;
  bizLineId: BizLineId;
  groupId: string;
  isGlobalAdmin?: boolean;
}

export type Persona = 'Personal' | 'Business' | 'Global Banking and Markets' | 'HSBC Private Bank';

export type NavView =
  | 'pages' | 'journeys'
  | 'pending' | 'history'
  | 'stats' | 'aeo'
  | 'admin-markets' | 'admin-bizlines' | 'admin-groups' | 'admin-flows' | 'audit'
  | 'wechat';

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
