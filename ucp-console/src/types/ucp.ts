// ─── UCP Type Definitions ─────────────────────────────────────────────────────

// ─── Business Lines ───────────────────────────────────────────────────────────

export type BizLineId = 'PAYMENT' | 'WEB_ENABLER' | 'LENDING' | 'COLLECTION' | 'WEALTH' | 'MARKETING';

export interface BizLine {
  bizLineId: string;
  displayName: string;
  description: string;
  active: boolean;
}

// ─── AD Groups ────────────────────────────────────────────────────────────────

export type GroupType = 'AD_GROUP' | 'AUDIT_GROUP' | 'ADMIN_GROUP';

export interface AdGroup {
  groupId: string;
  groupName: string;
  marketId: string;
  bizLineId: BizLineId;
  groupType: GroupType;
}

// ─── SDUI Slice Types ─────────────────────────────────────────────────────────

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
  | 'SPACER'
  | 'MARKET_BRIEFING_TEXT'
  | 'VIDEO_PLAYER'
  | 'CONTACT_RM_CTA'
  | 'DEPOSIT_RATE_TABLE'
  | 'DEPOSIT_OPEN_CTA'
  | 'DEPOSIT_FAQ'
  | 'ANNOUNCEMENT_OVERLAY'
  | 'ANNOUNCEMENT_VISUAL'
  | 'ANNOUNCEMENT_BODY'
  | 'ANNOUNCEMENT_ACTIONS'
  | 'CAMPAIGN_HERO'
  | 'CAMPAIGN_BENEFITS'
  | 'CAMPAIGN_CTA'
  // Home Hub components (new design)
  | 'HOME_SEARCH_HEADER'
  | 'PREMIER_HEADER'
  | 'ELITE_HEADER'
  | 'ADVANCE_HEADER'
  | 'MASS_HEADER'
  | 'HOME_SEARCH_BAR'
  | 'CONTENT_TAB_BAR'
  | 'QUICK_ACCESS_GRID'
  | 'COMBO_QUICK_ACCESS'
  | 'CARD_ACTIVATION_BANNER'
  | 'QUEST_BANNER'
  | 'FEATURE_PRODUCT'
  | 'WEALTH_STUDIO_CAROUSEL'
  | 'GUIDES_INSIGHTS_CAROUSEL'
  | 'FX_WATCHLIST'
  | 'DISCOVER_MORE_CAROUSEL'
  // SEO / AEO compliance slices (predefined, auto-injected)
  | 'SEO_HERO_HEADER'
  | 'SEO_FAQ'
  | 'SEO_STRUCTURED_DATA';

export type SliceCategory = 'navigation' | 'promotion' | 'function' | 'wealth' | 'lifestyle' | 'layout' | 'insight' | 'grid' | 'notice' | string;

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

export type PageType = 'HOME_HUB' | 'WEALTH_HUB' | 'KYC_JOURNEY' | 'PRODUCT' | 'CAMPAIGN' | 'MARKET_INSIGHT' | 'ANNOUNCEMENT' | 'CUSTOM';

export type AuthoringStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

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

  bizLineId: BizLineId;
  groupId: string;
  authoringStatus: AuthoringStatus;
}

// ─── Workflow ─────────────────────────────────────────────────────────────────

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
  bizLineId?: string;
}

// ─── Content Assets ───────────────────────────────────────────────────────────

export type AssetType = 'IMAGE' | 'VIDEO' | 'FILE' | 'DOCUMENT';
export type AssetStatus = 'ACTIVE' | 'ARCHIVED';
export type ContentApprovalStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

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
  // Video-specific metadata
  durationSeconds?: number;
  presenter?: string;
  presenterTitle?: string;
  // Content approval workflow
  approvalStatus?: ContentApprovalStatus;
  approvalGroupId?: string;
  approvalSubmittedAt?: string;
  approvalReviewedAt?: string;
  approvalReviewerId?: string;
  approvalReviewerName?: string;
  approvalComment?: string;
  // Blob object URL for in-browser preview after upload (not persisted)
  localObjectUrl?: string;
  // Multi-language support
  supportedLocales: string[];
  translations: Record<string, Record<string, string>>; // locale → field → value (e.g. 'name', 'altText')
}

export interface ContentApprovalFlow {
  flowId: string;
  flowName: string;
  marketId: string;
  bizLineId: BizLineId | null;
  approverGroupId: string;
  approverGroupName: string;
}

// ─── UI Components ────────────────────────────────────────────────────────────

export interface ComponentSourceFile {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  language: 'typescript' | 'javascript' | 'swift' | 'kotlin' | 'dart' | 'other';
  platform: 'web' | 'ios' | 'android' | 'cross-platform';
  uploadedAt: string;
  uploadedBy: string;
  /** Object URL (in-browser only, not persisted) */
  objectUrl?: string;
  /** Raw source text if already read */
  sourceText?: string;
}

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
  sourceFiles?: ComponentSourceFile[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>;
  // Multi-language support
  supportedLocales: string[];
  translations: Record<string, Record<string, string>>; // locale → field → value (e.g. 'label', 'description')
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
  | 'content'
  | 'components'
  | 'templates'
  | 'audit'
  | 'history'
  | 'admin-bizlines';

// ─── Page Templates ───────────────────────────────────────────────────────────

export type TemplateChannel = 'SDUI' | 'WEB_STANDARD' | 'WEB_WECHAT';

export interface PageTemplateSlice {
  type: SliceType;
  props: Record<string, unknown>;
  locked?: boolean;
}

export interface PageTemplate {
  templateId: string;
  name: string;
  description: string;
  icon: string;
  channels: TemplateChannel[];
  bizLineIds: BizLineId[];
  category: 'generic' | 'campaign' | 'product' | 'insight' | 'journey';
  starterSlices: PageTemplateSlice[];
  seoAeoCompliance: boolean;
  status: 'ACTIVE' | 'DEPRECATED';
  createdAt: string;
  updatedAt: string;
  maintainedBy: string;
  usageCount: number;
  // Multi-language support
  supportedLocales: string[];
  translations: Record<string, Record<string, string>>; // locale → field → value (e.g. 'name', 'description')
}
