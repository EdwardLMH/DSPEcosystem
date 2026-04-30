// ─── UCP Type Definitions ─────────────────────────────────────────────────────

// ─── Channel ──────────────────────────────────────────────────────────────────

export type Channel = 'SDUI' | 'WEB_STANDARD' | 'WEB_WECHAT';

// ─── Business Lines ───────────────────────────────────────────────────────────

export type BizLineId = 'PAYMENT' | 'WEB_ENABLER' | 'LENDING' | 'COLLECTION' | 'WEALTH' | 'MARKETING';

export interface BizLine {
  bizLineId: string;  // string to support admin-created entries beyond the core union
  displayName: string;
  description: string;
  active: boolean;
}

// ─── Markets & Release Targets ────────────────────────────────────────────────

export interface Market {
  marketId: string;            // "HK" | "SG" | "UK" | "IN" | "CN" | "GLOBAL"
  marketName: string;
  active: boolean;
  timezone: string;            // IANA tz, e.g. "Asia/Hong_Kong"
  tzLabel: string;             // display, e.g. "HKT (UTC+8)"
}

export interface ReleaseTarget {
  targetId: string;            // "HK" | "SG" | "GLOBAL" etc.
  displayName: string;         // "Hong Kong (.com.hk)"
  domainSuffix: string;        // ".com.hk"
  isGlobal: boolean;
  active: boolean;
}

// ─── AD Groups & Members ──────────────────────────────────────────────────────

export type GroupType = 'AD_GROUP' | 'AUDIT_GROUP' | 'ADMIN_GROUP';
export type MemberRole = 'AUTHOR' | 'APPROVER';

export interface AdGroup {
  groupId: string;
  groupName: string;
  marketId: string;
  bizLineId: BizLineId;
  groupType: GroupType;
}

export interface AdGroupMember {
  groupId: string;
  userId: string;
  userName: string;
  role: MemberRole;
}

// ─── Approval Flows ───────────────────────────────────────────────────────────

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

// ─── WeChat Service Accounts ──────────────────────────────────────────────────

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

// ─── SDUI Slice Types (existing) ──────────────────────────────────────────────

export type SliceType =
  | 'HEADER_NAV'
  | 'QUICK_ACCESS'
  | 'PROMO_BANNER'
  | 'FUNCTION_GRID'
  | 'AI_ASSISTANT'
  | 'AD_BANNER'
  | 'FLASH_LOAN'
  | 'WEALTH_SELECTION'
  | 'FEATURED_RANKINGS'
  | 'LIFE_DEALS'
  | 'SPACER';

export type SliceCategory = 'navigation' | 'promotion' | 'function' | 'wealth' | 'lifestyle' | 'layout';

export interface SliceDefinition {
  type: SliceType;
  label: string;
  category: SliceCategory;
  icon: string;
  description: string;
  configurable: string[];
  minHeight: number;
  singleton?: boolean;
}

// ─── Canvas Slice Instance ────────────────────────────────────────────────────

export interface CanvasSlice {
  instanceId: string;
  type: SliceType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  visible: boolean;
  locked: boolean;
}

// ─── Page Layout ──────────────────────────────────────────────────────────────

export type PageType = 'WEALTH_HUB' | 'KYC_JOURNEY' | 'PRODUCT' | 'CAMPAIGN' | 'CUSTOM';

export type AuthoringStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export type WebLayoutTemplate = 'PRODUCT' | 'ARTICLE' | 'CAMPAIGN' | 'LANDING' | 'HOME';

export interface CampaignSchedule {
  publishAt: string;    // ISO datetime — auto-publish after approval
  takedownAt: string;   // ISO datetime — auto-takedown from production
  timerStopped?: boolean;  // approver stopped the auto-publish timer
  stoppedAt?: string;      // ISO datetime when timer was stopped
}

export interface PageLayout {
  pageId: string;
  name: string;
  pageType: PageType;
  description?: string;
  platform: 'ios' | 'android' | 'web' | 'all';
  locale: string;
  slices: CanvasSlice[];
  thumbnail?: string;
  tags?: string[];

  // Extended fields
  channel: Channel;
  scope: 'GLOBAL' | 'MARKET';
  marketId: string;
  releaseMarketIds: string[];    // markets selected for release (multi-select, editable in draft)
  bizLineId: BizLineId;
  groupId: string;
  authoringStatus: AuthoringStatus;

  // Campaign-specific
  campaignSchedule?: CampaignSchedule;

  // Web-specific
  webSlug?: string;
  webMetaTitle?: string;
  webMetaDescription?: string;
  webLayoutTemplate?: WebLayoutTemplate;
  lastReviewedAt?: string;
  authorCredentials?: string;

  // WeChat-specific
  wechatPageUrl?: string;
  wechatShareTitle?: string;
  wechatShareDesc?: string;
}

// ─── Production Status ────────────────────────────────────────────────────────

export type ProductionStatus = 'NEVER_RELEASED' | 'LIVE' | 'ROLLED_BACK' | 'SUPERSEDED';

export interface PageMarketStatus {
  statusId: string;
  pageId: string;
  releaseTargetId: string;
  domainSuffix: string;
  productionStatus: ProductionStatus;
  liveSince?: string;
  version?: number;
}

// ─── Approval Instances & Steps ───────────────────────────────────────────────

export type ApprovalInstanceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RELEASED' | 'WITHDRAWN';
export type ApprovalStepStatus = 'WAITING' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PageApprovalStep {
  stepId: string;
  stepOrder: number;
  requiredGroupId: string;
  requiredGroupName: string;
  status: ApprovalStepStatus;
  approverId?: string;
  approverName?: string;
  actionedAt?: string;
  comment?: string;
}

export interface PageApprovalInstance {
  instanceId: string;
  submissionId: string;
  pageId: string;
  releaseTargetId: string;
  releaseTargetName: string;
  domainSuffix: string;
  approvalFlowId: string;
  overallStatus: ApprovalInstanceStatus;
  steps: PageApprovalStep[];
  createdAt: string;
  completedAt?: string;
}

export interface PageSubmission {
  submissionId: string;
  pageId: string;
  pageVersion: number;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  releaseTargets: string[];
  instances: PageApprovalInstance[];
}

// ─── AEO Score ────────────────────────────────────────────────────────────────

export type AEOGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface AEOScore {
  scoreId: string;
  pageId: string;
  releaseTargetId: string | null;
  pageVersion: number;
  scoredAt: string;
  trigger: 'MANUAL_AUTHOR' | 'ON_SUBMIT' | 'ON_APPROVE' | 'DAP_SYNC';

  // Criteria
  faqSchemaPts: number;        // 0 or 20
  faqSchemaNote?: string;
  productSchemaPts: number;    // 0 or 20
  freshnessPts: number;        // 0 or 15
  freshnessNote?: string;
  authorCredPts: number;       // 0 or 10
  regulatoryRefPts: number;    // 0 or 10
  regulatoryRefNote?: string;
  structuredRatePts: number;   // 0 or 10
  structuredRateNote?: string;
  directAnswerPts: number;     // 0 or 10
  staticScore: number;         // 0-95

  // Live signal
  llmCitationPts: number;      // 0 or 5
  llmCitationNote?: string;

  totalScore: number;
  aeoGrade: AEOGrade;
}

// ─── Usage Statistics ─────────────────────────────────────────────────────────

export type StatPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface PageUsageStat {
  statId: string;
  pageId: string;
  releaseTargetId: string;
  period: StatPeriod;
  periodStart: string;
  totalAccesses: number;
  uniqueUsers: number;
  sourceStack: 'GCP' | 'SENSORDATA' | 'WECHAT_SA' | 'UNIFIED';
  // WeChat-specific
  templateMsgDelivered?: number;
  templateMsgOpened?: number;
  templateMsgClicked?: number;
  wechatShareCount?: number;
}

// ─── Service Account Messages ─────────────────────────────────────────────────

export type SAMessageType = 'TEMPLATE_MESSAGE' | 'RICH_ARTICLE' | 'CUSTOMER_SERVICE';
export type SAMessageStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
export type SAMessageAudience = 'ALL_FOLLOWERS' | 'SEGMENT' | 'TAG' | 'OPENID_LIST';

export interface ServiceAccountMessage {
  messageId: string;
  pageId: string;
  accountId: string;
  accountName: string;
  templateId?: string;
  marketId: string;
  ownedByGroupId: string;
  draftedBy: string;
  draftedByName: string;
  messageType: SAMessageType;
  messageName: string;

  // Template message fields
  templateData?: Record<string, string>;

  // Rich article fields
  articleTitle?: string;
  articleDigest?: string;
  articleAuthor?: string;
  articleHtmlSizeBytes?: number;
  articleSourceUrl?: string;
  articleImagesUploaded?: number;

  // Audience
  audienceType: SAMessageAudience;
  segmentId?: string;
  estimatedRecipients?: number;

  // Scheduling
  scheduledAt?: string;
  status: SAMessageStatus;
  rejectReason?: string;

  // Stats
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  sharedCount: number;

  // Audit
  createdAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  sentAt?: string;
}

// ─── Content Assets ───────────────────────────────────────────────────────────

export type AssetType = 'IMAGE' | 'VIDEO' | 'FILE' | 'DOCUMENT';
export type AssetStatus = 'ACTIVE' | 'ARCHIVED';

export interface ContentAsset {
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
}

// ─── UI Components (custom slice definitions) ─────────────────────────────────

export interface UIComponent {
  componentId: string;
  sliceType: SliceType;
  label: string;
  description: string;
  icon: string;
  category: SliceCategory;
  configurable: string[];
  minHeight: number;
  singleton: boolean;
  version: string;
  maintainedBy: string;
  createdAt: string;
  updatedAt: string;
  status: 'ACTIVE' | 'DEPRECATED';
  // Per-type default meta values (title, subtitle, grid cols, etc.)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>;
}

// ─── Workflow (legacy — kept for SDUI compat) ─────────────────────────────────

export type WorkflowStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'LIVE';

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
  previewToken?: string;
}

// ─── Audit ────────────────────────────────────────────────────────────────────

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

// ─── Staff Identity ───────────────────────────────────────────────────────────

export type StaffRole =
  | 'WEALTH-AUTHOR'
  | 'WEALTH-APPROVER'
  | 'CARDS-AUTHOR'
  | 'CARDS-APPROVER'
  | 'PAYMENT-AUTHOR'
  | 'PAYMENT-APPROVER'
  | 'MARKETING-AUTHOR'
  | 'MARKETING-APPROVER'
  | 'ADMIN'
  | 'AUDITOR';

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

// ─── Nav view ─────────────────────────────────────────────────────────────────

export type NavView =
  | 'editor'
  | 'pages'
  | 'content'
  | 'components'
  | 'pending'
  | 'history'
  | 'stats'
  | 'aeo'
  | 'admin-markets'
  | 'admin-groups'
  | 'admin-bizlines'
  | 'admin-flows'
  | 'audit';
