// ─── SDUI Component Slice Types for UCP Console ──────────────────────────────

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
  configurable: string[];  // which prop keys are user-editable
  minHeight: number;       // px for canvas preview
  singleton?: boolean;     // only one instance allowed
}

// ─── Instance Props per Slice Type ───────────────────────────────────────────

export interface HeaderNavProps {
  title: string;
  searchPlaceholder: string;
  showNotificationBell: boolean;
  showQRScanner: boolean;
}

export interface QuickAccessItem {
  id: string;
  icon: string;       // emoji or URL
  label: string;
  deepLink: string;
}

export interface QuickAccessProps {
  items: QuickAccessItem[];
}

export interface PromoBannerProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaDeepLink: string;
  imageUrl: string;
  backgroundColor: string;
  badgeText?: string;
}

export interface FunctionGridItem {
  id: string;
  icon: string;
  label: string;
  deepLink: string;
  badge?: string;
}

export interface FunctionGridProps {
  rows: FunctionGridItem[][];  // each inner array is a row of up to 5
}

export interface AIAssistantProps {
  greeting: string;
  avatarUrl?: string;
}

export interface AdBannerProps {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaDeepLink: string;
  imageUrl: string;
  dismissible: boolean;
  validUntil?: string;
}

export interface FlashLoanProps {
  productName: string;
  tagline: string;
  maxAmount: number;
  currency: string;
  ctaLabel: string;
  ctaDeepLink: string;
}

export interface WealthProduct {
  id: string;
  productName: string;
  tag: string;
  yield7Day?: string;
  riskLevel: string;
  redemption: string;
  ctaLabel: string;
  ctaDeepLink: string;
  highlighted?: boolean;
}

export interface WealthSelectionProps {
  sectionTitle: string;
  products: WealthProduct[];
  moreDeepLink: string;
}

export interface RankingItem {
  id: string;
  icon: string;
  badge: string;
  title: string;
  description: string;
  ctaDeepLink: string;
}

export interface FeaturedRankingsProps {
  sectionTitle: string;
  items: RankingItem[];
  moreDeepLink: string;
}

export interface LifeDealItem {
  id: string;
  brandName: string;
  logoUrl: string;
  tag: string;
  ctaDeepLink: string;
}

export interface LifeDealsProps {
  sectionTitle: string;
  deals: LifeDealItem[];
  moreDeepLink: string;
  bottomLinks: { label: string; icon: string; deepLink: string }[];
}

export interface SpacerProps {
  height: number;
}

export type SliceProps =
  | HeaderNavProps
  | QuickAccessProps
  | PromoBannerProps
  | FunctionGridProps
  | AIAssistantProps
  | AdBannerProps
  | FlashLoanProps
  | WealthSelectionProps
  | FeaturedRankingsProps
  | LifeDealsProps
  | SpacerProps;

// ─── Canvas Slice Instance ────────────────────────────────────────────────────

export interface CanvasSlice {
  instanceId: string;
  type: SliceType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  visible: boolean;
  locked: boolean;
}

// ─── Page Layout (what gets saved / published) ────────────────────────────────

export interface PageLayout {
  pageId: string;
  name: string;
  platform: 'ios' | 'android';
  locale: string;
  slices: CanvasSlice[];
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
  authorRole: 'AUTHOR' | 'APPROVER' | 'ADMIN';
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
}

// ─── Staff Identity ───────────────────────────────────────────────────────────

export type StaffRole =
  | 'WEALTH-AUTHOR'
  | 'WEALTH-APPROVER'
  | 'CARDS-AUTHOR'
  | 'CARDS-APPROVER'
  | 'ADMIN'
  | 'AUDITOR';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
}
