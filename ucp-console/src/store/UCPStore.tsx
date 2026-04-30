import React, { createContext, useContext, useReducer } from 'react';
import {
  CanvasSlice, PageLayout, PageType, WorkflowEntry, WorkflowStatus,
  AuditEntry, StaffUser, SliceType, Channel, BizLineId, NavView,
  Market, ReleaseTarget, BizLine, AdGroup, ApprovalFlow,
  WeChatServiceAccount, WeChatMessageTemplate,
  PageMarketStatus, PageSubmission, AEOScore, PageUsageStat,
  ServiceAccountMessage, CampaignSchedule,
} from '../types/ucp';
import {
  ALL_PAGES, MOCK_WORKFLOW_ENTRIES, MOCK_AUDIT, MOCK_USERS,
  MARKETS, RELEASE_TARGETS, BIZ_LINES, AD_GROUPS, APPROVAL_FLOWS,
  WECHAT_ACCOUNTS, WECHAT_TEMPLATES,
  MOCK_MARKET_STATUS, MOCK_SUBMISSIONS, MOCK_AEO_SCORES,
  MOCK_USAGE_STATS, MOCK_SA_MESSAGES,
} from './mockData';
import { v4 } from '../utils/uuid';
import { SLICE_DEFINITIONS } from '../utils/sliceDefinitions';

// ─── State ────────────────────────────────────────────────────────────────────

export interface UCPState {
  currentUser:          StaffUser;
  navView:              NavView;

  // Reference data
  markets:              Market[];
  releaseTargets:       ReleaseTarget[];
  bizLines:             BizLine[];
  adGroups:             AdGroup[];
  approvalFlows:        ApprovalFlow[];
  wechatAccounts:       WeChatServiceAccount[];
  wechatTemplates:      WeChatMessageTemplate[];

  // Content
  pages:                PageLayout[];
  activePageId:         string;
  layout:               PageLayout;
  selectedInstanceId:   string | null;

  // Workflow
  workflow:             WorkflowEntry[];
  marketStatus:         PageMarketStatus[];
  submissions:          PageSubmission[];
  aeoScores:            AEOScore[];
  usageStats:           PageUsageStat[];
  saMessages:           ServiceAccountMessage[];

  // Audit
  audit:                AuditEntry[];

  // UI flags
  isDirty:              boolean;
  showSimulator:        boolean;
  showWorkflow:         boolean;
  showPageLibrary:      boolean;
  showNewPageModal:     boolean;
  showSubmitDialog:     boolean;
  showEditLiveWarning:  boolean;
  showAEOPanel:         boolean;
  showStatsPanel:       boolean;
  showWeChatComposer:   boolean;

  dragOverIndex:        number | null;
  toast: { id: string; message: string; type: 'success' | 'error' | 'info' } | null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_USER';                user: StaffUser }
  | { type: 'SET_NAV_VIEW';            view: NavView }
  | { type: 'OPEN_PAGE';               pageId: string }
  | { type: 'CREATE_PAGE';             name: string; pageType: PageType; platform: PageLayout['platform']; locale: string; channel: Channel; bizLineId: BizLineId; scope: 'GLOBAL' | 'MARKET'; description?: string; campaignSchedule?: CampaignSchedule }
  | { type: 'UPDATE_PAGE_INFO'; name: string; pageType: PageType; locale: string; description: string; releaseMarketIds: string[] }
  | { type: 'DUPLICATE_PAGE';          pageId: string }
  | { type: 'DELETE_PAGE';             pageId: string }
  | { type: 'RENAME_PAGE';             name: string }
  | { type: 'SELECT_SLICE';            instanceId: string | null }
  | { type: 'ADD_SLICE';               sliceType: SliceType; atIndex?: number }
  | { type: 'REMOVE_SLICE';            instanceId: string }
  | { type: 'MOVE_SLICE';              fromIndex: number; toIndex: number }
  | { type: 'UPDATE_SLICE_PROPS';      instanceId: string; props: Record<string, unknown> }
  | { type: 'TOGGLE_SLICE_VISIBLE';    instanceId: string }
  | { type: 'TOGGLE_SLICE_LOCK';       instanceId: string }
  | { type: 'SUBMIT_FOR_APPROVAL';     targets: string[]; comment?: string }
  | { type: 'APPROVE_STEP';            instanceId: string; comment: string }
  | { type: 'REJECT_STEP';             instanceId: string; comment: string }
  | { type: 'RELEASE_TO_MARKET';       instanceId: string }
  | { type: 'APPROVE';                 comment: string }
  | { type: 'REJECT';                  comment: string }
  | { type: 'PUBLISH' }
  | { type: 'SEND_TO_DRAFT' }
  | { type: 'STOP_CAMPAIGN_TIMER' }
  | { type: 'UPDATE_CAMPAIGN_SCHEDULE'; publishAt: string; takedownAt: string }
  | { type: 'EDIT_LIVE_PAGE' }
  | { type: 'TOGGLE_SIMULATOR' }
  | { type: 'TOGGLE_WORKFLOW' }
  | { type: 'TOGGLE_PAGE_LIBRARY' }
  | { type: 'TOGGLE_NEW_PAGE_MODAL' }
  | { type: 'TOGGLE_SUBMIT_DIALOG' }
  | { type: 'TOGGLE_AEO_PANEL' }
  | { type: 'TOGGLE_STATS_PANEL' }
  | { type: 'TOGGLE_WECHAT_COMPOSER' }
  | { type: 'DISMISS_EDIT_LIVE_WARNING' }
  | { type: 'SET_DRAG_OVER';           index: number | null }
  | { type: 'SHOW_TOAST';              message: string; toastType: 'success' | 'error' | 'info' }
  | { type: 'CLEAR_TOAST' }
  // ── Reference data CRUD ──────────────────────────────────────────────────────
  | { type: 'ADD_MARKET';           market: Market }
  | { type: 'EDIT_MARKET';          oldMarketId: string; market: Market }
  | { type: 'DELETE_MARKET';        marketId: string }
  | { type: 'ADD_BIZ_LINE';         bizLine: BizLine }
  | { type: 'EDIT_BIZ_LINE';        bizLineId: string; updates: Partial<BizLine> }
  | { type: 'DELETE_BIZ_LINE';      bizLineId: string }
  | { type: 'ADD_AD_GROUP';         group: AdGroup }
  | { type: 'EDIT_AD_GROUP';        groupId: string; updates: Partial<AdGroup> }
  | { type: 'DELETE_AD_GROUP';      groupId: string }
  | { type: 'ADD_APPROVAL_FLOW';    flow: ApprovalFlow }
  | { type: 'EDIT_APPROVAL_FLOW';   flowId: string; flow: ApprovalFlow }
  | { type: 'DELETE_APPROVAL_FLOW'; flowId: string };

// ─── Default props ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function defaultPropsFor(sliceType: SliceType): Record<string, any> {
  switch (sliceType) {
    case 'HEADER_NAV':        return { title: '搜尋', searchPlaceholder: '搜尋功能、產品', showNotificationBell: true, showQRScanner: true };
    case 'QUICK_ACCESS':      return { items: [] };
    case 'PROMO_BANNER':      return { title: '全新活動', subtitle: '點擊了解更多', ctaLabel: '立即參與', ctaDeepLink: '', imageUrl: '', backgroundColor: '#E8F4FD' };
    case 'FUNCTION_GRID':     return { rows: [] };
    case 'AI_ASSISTANT':      return { greeting: 'Hi，我是你的智能財富助理', avatarUrl: '' };
    case 'AD_BANNER':         return { title: '精選推廣', ctaLabel: '了解更多', ctaDeepLink: '', imageUrl: '', dismissible: true };
    case 'FLASH_LOAN':        return { productName: '閃電貸', tagline: '最高可借額度', maxAmount: 300000, currency: 'HKD', ctaLabel: '獲取額度', ctaDeepLink: '' };
    case 'WEALTH_SELECTION':  return { sectionTitle: '財富精選', products: [], moreDeepLink: '' };
    case 'FEATURED_RANKINGS': return { sectionTitle: '特色榜單', items: [], moreDeepLink: '' };
    case 'LIFE_DEALS':        return { sectionTitle: '生活特惠', deals: [], moreDeepLink: '', bottomLinks: [] };
    case 'SPACER':            return { height: 16 };
  }
}

const PAGE_TYPE_META: Record<PageType, { thumbnail: string; slices: SliceType[] }> = {
  WEALTH_HUB:  { thumbnail: '💰', slices: ['HEADER_NAV', 'QUICK_ACCESS', 'PROMO_BANNER'] },
  KYC_JOURNEY: { thumbnail: '🪪', slices: ['HEADER_NAV', 'PROMO_BANNER'] },
  PRODUCT:     { thumbnail: '📦', slices: ['HEADER_NAV', 'PROMO_BANNER', 'SPACER'] },
  CAMPAIGN:    { thumbnail: '🎪', slices: ['HEADER_NAV', 'AD_BANNER', 'SPACER'] },
  CUSTOM:      { thumbnail: '📝', slices: [] },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAudit(user: StaffUser, action: string, pageId: string, pageName: string, details?: string): AuditEntry {
  return {
    id: v4(),
    timestamp: new Date().toISOString(),
    actorId: user.id,
    actorRole: user.role,
    action,
    pageId,
    pageName,
    details,
    marketId: user.marketId,
    bizLineId: user.bizLineId,
  };
}

function syncLayout(state: UCPState): UCPState {
  const page = state.pages.find(p => p.pageId === state.activePageId) ?? state.pages[0];
  return { ...state, layout: page };
}

function updateActivePageSlices(state: UCPState, slices: CanvasSlice[]): UCPState {
  const pages = state.pages.map(p =>
    p.pageId === state.activePageId ? { ...p, slices } : p
  );
  return syncLayout({ ...state, pages });
}

function getWorkflowStatus(state: UCPState, pageId: string): WorkflowStatus {
  return state.workflow.find(w => w.pageId === pageId)?.status ?? 'DRAFT';
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: UCPState, action: Action): UCPState {
  switch (action.type) {

    case 'SET_USER':     return { ...state, currentUser: action.user };
    case 'SET_NAV_VIEW': return { ...state, navView: action.view, showPageLibrary: false, showWorkflow: false };

    // ── Page library ─────────────────────────────────────────────────────────

    case 'OPEN_PAGE': {
      const page = state.pages.find(p => p.pageId === action.pageId);
      if (!page) return state;
      const wfStatus = getWorkflowStatus(state, action.pageId);
      return syncLayout({
        ...state,
        activePageId: action.pageId,
        selectedInstanceId: null,
        isDirty: false,
        showPageLibrary: false,
        showEditLiveWarning: wfStatus === 'LIVE',
        navView: 'editor',
      });
    }

    case 'CREATE_PAGE': {
      const meta = PAGE_TYPE_META[action.pageType];
      const pageId = `page-${v4().slice(0, 8)}`;
      const newSlices: CanvasSlice[] = action.channel === 'SDUI'
        ? meta.slices.map(st => ({
            instanceId: `slice-${v4().slice(0, 8)}`,
            type: st,
            props: defaultPropsFor(st),
            visible: true,
            locked: false,
          }))
        : [];
      const newPage: PageLayout = {
        pageId,
        name: action.name,
        pageType: action.pageType,
        description: action.description,
        platform: action.platform,
        locale: action.locale,
        thumbnail: meta.thumbnail,
        tags: [action.pageType.toLowerCase()],
        slices: newSlices,
        channel: action.channel,
        scope: action.scope,
        marketId: action.scope === 'GLOBAL' ? 'GLOBAL' : state.currentUser.marketId,
        releaseMarketIds: action.scope === 'GLOBAL' ? [] : [state.currentUser.marketId],
        bizLineId: action.bizLineId,
        groupId: state.currentUser.groupId,
        authoringStatus: 'DRAFT',
        campaignSchedule: action.campaignSchedule,
      };
      const wf: WorkflowEntry = {
        entryId: v4(),
        pageId,
        pageName: action.name,
        status: 'DRAFT',
        authorId: state.currentUser.id,
        authorName: state.currentUser.name,
        comments: [],
        layout: newPage,
        version: 1,
      };
      return syncLayout({
        ...state,
        pages: [...state.pages, newPage],
        activePageId: pageId,
        workflow: [...state.workflow, wf],
        audit: [...state.audit, makeAudit(state.currentUser, 'PAGE_CREATED', pageId, action.name, `Channel: ${action.channel}`)],
        showNewPageModal: false,
        showPageLibrary: false,
        isDirty: false,
        selectedInstanceId: null,
        navView: 'editor',
        toast: { id: v4(), message: `Page "${action.name}" created`, type: 'success' },
      });
    }

    case 'UPDATE_PAGE_INFO': {
      const pages = state.pages.map(p =>
        p.pageId === state.activePageId
          ? {
              ...p,
              name: action.name.trim() || p.name,
              pageType: action.pageType,
              locale: action.locale,
              description: action.description,
              releaseMarketIds: action.releaseMarketIds,
              // Reset campaign schedule if type changed away from CAMPAIGN
              campaignSchedule: action.pageType === 'CAMPAIGN' ? p.campaignSchedule : undefined,
            }
          : p
      );
      const updatedLayout = pages.find(p => p.pageId === state.activePageId)!;
      return {
        ...state, pages, layout: updatedLayout, isDirty: true,
        audit: [...state.audit, makeAudit(
          state.currentUser, 'PAGE_INFO_UPDATED', state.activePageId, action.name,
          `Type: ${action.pageType}, Markets: ${action.releaseMarketIds.join(', ') || 'none'}, Locale: ${action.locale}`
        )],
        toast: { id: v4(), message: 'Page info saved', type: 'success' },
      };
    }

    case 'DUPLICATE_PAGE': {
      const src = state.pages.find(p => p.pageId === action.pageId);
      if (!src) return state;
      const pageId = `page-${v4().slice(0, 8)}`;
      const clone: PageLayout = {
        ...src,
        pageId,
        name: `${src.name} (Copy)`,
        authoringStatus: 'DRAFT',
        slices: src.slices.map(s => ({ ...s, instanceId: `slice-${v4().slice(0, 8)}` })),
      };
      const wf: WorkflowEntry = {
        entryId: v4(), pageId, pageName: clone.name, status: 'DRAFT',
        authorId: state.currentUser.id, authorName: state.currentUser.name,
        comments: [], layout: clone, version: 1,
      };
      return syncLayout({
        ...state,
        pages: [...state.pages, clone],
        activePageId: pageId,
        workflow: [...state.workflow, wf],
        audit: [...state.audit, makeAudit(state.currentUser, 'PAGE_DUPLICATED', pageId, clone.name, `From: ${src.name}`)],
        showPageLibrary: false, isDirty: false, selectedInstanceId: null,
        toast: { id: v4(), message: `Duplicated as "${clone.name}"`, type: 'success' },
      });
    }

    case 'DELETE_PAGE': {
      if (state.pages.length <= 1) return { ...state, toast: { id: v4(), message: 'Cannot delete the last page', type: 'error' } };
      const pages = state.pages.filter(p => p.pageId !== action.pageId);
      const deletedName = state.pages.find(p => p.pageId === action.pageId)?.name ?? '';
      const newActiveId = state.activePageId === action.pageId ? pages[0].pageId : state.activePageId;
      return syncLayout({
        ...state, pages,
        activePageId: newActiveId,
        workflow: state.workflow.filter(w => w.pageId !== action.pageId),
        audit: [...state.audit, makeAudit(state.currentUser, 'PAGE_DELETED', action.pageId, deletedName)],
        selectedInstanceId: null, isDirty: false,
        toast: { id: v4(), message: 'Page deleted', type: 'info' },
      });
    }

    case 'RENAME_PAGE': {
      const pages = state.pages.map(p =>
        p.pageId === state.activePageId ? { ...p, name: action.name } : p
      );
      return syncLayout({
        ...state, pages, isDirty: true,
        audit: [...state.audit, makeAudit(state.currentUser, 'PAGE_RENAMED', state.activePageId, action.name)],
      });
    }

    case 'SEND_TO_DRAFT': {
      const wfIdx = state.workflow.findIndex(w => w.pageId === state.activePageId && (w.status === 'APPROVED' || w.status === 'PENDING_APPROVAL'));
      if (wfIdx === -1) return state;
      const updated = { ...state.workflow[wfIdx], status: 'DRAFT' as WorkflowStatus };
      const workflow = [...state.workflow]; workflow[wfIdx] = updated;
      const updatedPages = state.pages.map(p =>
        p.pageId === state.activePageId ? { ...p, authoringStatus: 'DRAFT' as const } : p
      );
      return {
        ...state, workflow, pages: updatedPages, isDirty: false,
        audit: [...state.audit, makeAudit(state.currentUser, 'SENT_TO_DRAFT', state.activePageId, state.layout.name, 'Returned to draft by approver')],
        toast: { id: v4(), message: 'Page returned to Draft', type: 'info' },
      };
    }

    case 'STOP_CAMPAIGN_TIMER': {
      const pages = state.pages.map(p =>
        p.pageId === state.activePageId && p.campaignSchedule
          ? { ...p, campaignSchedule: { ...p.campaignSchedule, timerStopped: true, stoppedAt: new Date().toISOString() } }
          : p
      );
      return {
        ...syncLayout({ ...state, pages }),
        audit: [...state.audit, makeAudit(state.currentUser, 'CAMPAIGN_TIMER_STOPPED', state.activePageId, state.layout.name, 'Auto-publish timer stopped by approver')],
        toast: { id: v4(), message: 'Campaign timer stopped — choose to publish or return to draft', type: 'info' },
      };
    }

    case 'UPDATE_CAMPAIGN_SCHEDULE': {
      const pages = state.pages.map(p =>
        p.pageId === state.activePageId
          ? {
              ...p,
              campaignSchedule: {
                ...(p.campaignSchedule ?? {}),
                publishAt:  action.publishAt,
                takedownAt: action.takedownAt,
                timerStopped: false,
                stoppedAt: undefined,
              },
            }
          : p
      );
      return {
        ...syncLayout({ ...state, pages }), isDirty: true,
        audit: [...state.audit, makeAudit(state.currentUser, 'CAMPAIGN_SCHEDULE_UPDATED', state.activePageId, state.layout.name, `Publish: ${action.publishAt} / Takedown: ${action.takedownAt}`)],
        toast: { id: v4(), message: 'Campaign schedule updated', type: 'success' },
      };
    }

    // ── Live page editing ────────────────────────────────────────────────────

    case 'EDIT_LIVE_PAGE': {
      const wfIdx = state.workflow.findIndex(w => w.pageId === state.activePageId);
      const newEntry: WorkflowEntry = {
        entryId: v4(), pageId: state.activePageId, pageName: state.layout.name,
        status: 'DRAFT', authorId: state.currentUser.id, authorName: state.currentUser.name,
        comments: [{ id: v4(), authorId: state.currentUser.id, authorRole: state.currentUser.role, text: 'Re-editing live page — new draft created', timestamp: new Date().toISOString() }],
        layout: { ...state.layout }, version: (state.workflow[wfIdx]?.version ?? 0) + 1,
      };
      const workflow = [...state.workflow];
      if (wfIdx !== -1) workflow[wfIdx] = newEntry; else workflow.push(newEntry);
      return {
        ...state, workflow, showEditLiveWarning: false, isDirty: false,
        audit: [...state.audit, makeAudit(state.currentUser, 'LIVE_PAGE_EDIT_STARTED', state.activePageId, state.layout.name, 'New draft created')],
        toast: { id: v4(), message: 'New draft created from live page', type: 'info' },
      };
    }

    case 'DISMISS_EDIT_LIVE_WARNING': return { ...state, showEditLiveWarning: false };

    // ── Slices ───────────────────────────────────────────────────────────────

    case 'SELECT_SLICE': return { ...state, selectedInstanceId: action.instanceId };

    case 'ADD_SLICE': {
      const def = SLICE_DEFINITIONS[action.sliceType];
      if (def?.singleton && state.layout.slices.some(s => s.type === action.sliceType)) return state;
      const newSlice: CanvasSlice = {
        instanceId: `slice-${v4().slice(0, 8)}`,
        type: action.sliceType,
        props: defaultPropsFor(action.sliceType),
        visible: true, locked: false,
      };
      const slices = [...state.layout.slices];
      slices.splice(action.atIndex ?? slices.length, 0, newSlice);
      return {
        ...updateActivePageSlices(state, slices),
        selectedInstanceId: newSlice.instanceId, isDirty: true,
        audit: [...state.audit, makeAudit(state.currentUser, 'SLICE_ADDED', state.activePageId, state.layout.name, `Added ${action.sliceType}`)],
      };
    }

    case 'REMOVE_SLICE': {
      const removed = state.layout.slices.find(s => s.instanceId === action.instanceId);
      const slices = state.layout.slices.filter(s => s.instanceId !== action.instanceId);
      return {
        ...updateActivePageSlices(state, slices),
        selectedInstanceId: state.selectedInstanceId === action.instanceId ? null : state.selectedInstanceId,
        isDirty: true,
        audit: [...state.audit, makeAudit(state.currentUser, 'SLICE_REMOVED', state.activePageId, state.layout.name, `Removed ${removed?.type}`)],
      };
    }

    case 'MOVE_SLICE': {
      const slices = [...state.layout.slices];
      const [moved] = slices.splice(action.fromIndex, 1);
      slices.splice(action.toIndex, 0, moved);
      return { ...updateActivePageSlices(state, slices), isDirty: true };
    }

    case 'UPDATE_SLICE_PROPS': {
      const slices = state.layout.slices.map(s =>
        s.instanceId === action.instanceId ? { ...s, props: { ...s.props, ...action.props } } : s
      );
      return {
        ...updateActivePageSlices(state, slices), isDirty: true,
        audit: [...state.audit, makeAudit(state.currentUser, 'SLICE_EDITED', state.activePageId, state.layout.name, `Edited ${action.instanceId}`)],
      };
    }

    case 'TOGGLE_SLICE_VISIBLE': {
      const slices = state.layout.slices.map(s =>
        s.instanceId === action.instanceId ? { ...s, visible: !s.visible } : s
      );
      return { ...updateActivePageSlices(state, slices), isDirty: true };
    }

    case 'TOGGLE_SLICE_LOCK': {
      const slices = state.layout.slices.map(s =>
        s.instanceId === action.instanceId ? { ...s, locked: !s.locked } : s
      );
      return updateActivePageSlices(state, slices);
    }

    // ── Submission & approval ────────────────────────────────────────────────

    case 'SUBMIT_FOR_APPROVAL': {
      // Legacy single-workflow path (kept for SDUI compat)
      const entry: WorkflowEntry = {
        entryId: v4(), pageId: state.activePageId, pageName: state.layout.name,
        status: 'PENDING_APPROVAL', authorId: state.currentUser.id, authorName: state.currentUser.name,
        submittedAt: new Date().toISOString(), comments: [], layout: { ...state.layout },
        version: (state.workflow.find(w => w.pageId === state.activePageId)?.version ?? 0) + 1,
      };
      const workflow = state.workflow.filter(w => w.pageId !== state.activePageId);
      workflow.push(entry);
      const updatedPages = state.pages.map(p =>
        p.pageId === state.activePageId ? { ...p, authoringStatus: 'PENDING_APPROVAL' as const } : p
      );
      return {
        ...state, workflow, pages: updatedPages, isDirty: false,
        showSubmitDialog: false,
        audit: [...state.audit, makeAudit(state.currentUser, 'PAGE_SUBMITTED', state.activePageId, state.layout.name, `Targets: ${action.targets.join(', ')}`)],
        toast: { id: v4(), message: `Submitted for approval — ${action.targets.join(', ')}`, type: 'success' },
      };
    }

    case 'APPROVE': {
      const wfIdx = state.workflow.findIndex(w => w.pageId === state.activePageId && w.status === 'PENDING_APPROVAL');
      if (wfIdx === -1) return state;
      const updated = {
        ...state.workflow[wfIdx], status: 'APPROVED' as WorkflowStatus,
        reviewerId: state.currentUser.id, reviewerName: state.currentUser.name,
        reviewedAt: new Date().toISOString(),
        comments: action.comment
          ? [...state.workflow[wfIdx].comments, { id: v4(), authorId: state.currentUser.id, authorRole: state.currentUser.role, text: action.comment, timestamp: new Date().toISOString() }]
          : state.workflow[wfIdx].comments,
      };
      const workflow = [...state.workflow]; workflow[wfIdx] = updated;
      const updatedPages = state.pages.map(p =>
        p.pageId === state.activePageId ? { ...p, authoringStatus: 'APPROVED' as const } : p
      );
      return {
        ...state, workflow, pages: updatedPages,
        audit: [...state.audit, makeAudit(state.currentUser, 'APPROVED', state.activePageId, state.layout.name, action.comment)],
        toast: { id: v4(), message: 'Approved — ready to publish', type: 'success' },
      };
    }

    case 'REJECT': {
      const wfIdx = state.workflow.findIndex(w => w.pageId === state.activePageId && w.status === 'PENDING_APPROVAL');
      if (wfIdx === -1) return state;
      const updated = {
        ...state.workflow[wfIdx], status: 'REJECTED' as WorkflowStatus,
        reviewerId: state.currentUser.id, reviewerName: state.currentUser.name,
        reviewedAt: new Date().toISOString(),
        comments: [...state.workflow[wfIdx].comments, { id: v4(), authorId: state.currentUser.id, authorRole: state.currentUser.role, text: action.comment, timestamp: new Date().toISOString() }],
      };
      const workflow = [...state.workflow]; workflow[wfIdx] = updated;
      const updatedPages = state.pages.map(p =>
        p.pageId === state.activePageId ? { ...p, authoringStatus: 'REJECTED' as const } : p
      );
      return {
        ...state, workflow, pages: updatedPages, isDirty: true,
        audit: [...state.audit, makeAudit(state.currentUser, 'REJECTED', state.activePageId, state.layout.name, action.comment)],
        toast: { id: v4(), message: 'Rejected — returned for revision', type: 'error' },
      };
    }

    case 'PUBLISH': {
      const wfIdx = state.workflow.findIndex(w => w.pageId === state.activePageId && w.status === 'APPROVED');
      if (wfIdx === -1) return state;
      const updated = { ...state.workflow[wfIdx], status: 'LIVE' as WorkflowStatus };
      const workflow = [...state.workflow]; workflow[wfIdx] = updated;
      const pages = state.pages.map(p =>
        p.pageId === state.activePageId ? { ...state.layout, authoringStatus: 'APPROVED' as const } : p
      );
      return {
        ...state, pages, workflow,
        audit: [...state.audit, makeAudit(state.currentUser, 'PUBLISHED', state.activePageId, state.layout.name, 'Published to production')],
        toast: { id: v4(), message: '🚀 Page published to production!', type: 'success' },
      };
    }

    // ── UI toggles ───────────────────────────────────────────────────────────

    case 'TOGGLE_SIMULATOR':       return { ...state, showSimulator: !state.showSimulator };
    case 'TOGGLE_WORKFLOW':        return { ...state, showWorkflow: !state.showWorkflow };
    case 'TOGGLE_PAGE_LIBRARY':    return { ...state, showPageLibrary: !state.showPageLibrary };
    case 'TOGGLE_NEW_PAGE_MODAL':  return { ...state, showNewPageModal: !state.showNewPageModal };
    case 'TOGGLE_SUBMIT_DIALOG':   return { ...state, showSubmitDialog: !state.showSubmitDialog };
    case 'TOGGLE_AEO_PANEL':       return { ...state, showAEOPanel: !state.showAEOPanel };
    case 'TOGGLE_STATS_PANEL':     return { ...state, showStatsPanel: !state.showStatsPanel };
    case 'TOGGLE_WECHAT_COMPOSER': return { ...state, showWeChatComposer: !state.showWeChatComposer };
    case 'SET_DRAG_OVER':          return { ...state, dragOverIndex: action.index };
    case 'SHOW_TOAST':             return { ...state, toast: { id: v4(), message: action.message, type: action.toastType } };
    case 'CLEAR_TOAST':            return { ...state, toast: null };

    // ── Reference data CRUD ────────────────────────────────────────────────────

    case 'ADD_MARKET':
      return { ...state, markets: [...state.markets, action.market] };

    case 'EDIT_MARKET': {
      const { oldMarketId, market } = action;
      const idChanged = market.marketId !== oldMarketId;
      return {
        ...state,
        markets: state.markets.map(m => m.marketId === oldMarketId ? market : m),
        adGroups: idChanged
          ? state.adGroups.map(g => g.marketId === oldMarketId ? { ...g, marketId: market.marketId } : g)
          : state.adGroups,
        approvalFlows: idChanged
          ? state.approvalFlows.map(f => f.marketId === oldMarketId ? { ...f, marketId: market.marketId } : f)
          : state.approvalFlows,
      };
    }

    case 'DELETE_MARKET':
      return {
        ...state,
        markets:       state.markets.filter(m => m.marketId !== action.marketId),
        adGroups:      state.adGroups.filter(g => g.marketId !== action.marketId),
        approvalFlows: state.approvalFlows.filter(f => f.marketId !== action.marketId),
      };

    case 'ADD_BIZ_LINE':
      return { ...state, bizLines: [...state.bizLines, action.bizLine] };

    case 'EDIT_BIZ_LINE':
      return {
        ...state,
        bizLines: state.bizLines.map(b =>
          b.bizLineId === action.bizLineId ? { ...b, ...action.updates } : b
        ),
      };

    case 'DELETE_BIZ_LINE':
      return { ...state, bizLines: state.bizLines.filter(b => b.bizLineId !== action.bizLineId) };

    case 'ADD_AD_GROUP':
      return { ...state, adGroups: [...state.adGroups, action.group] };

    case 'EDIT_AD_GROUP': {
      const adGroups = state.adGroups.map(g =>
        g.groupId === action.groupId ? { ...g, ...action.updates } : g
      );
      const newName = action.updates.groupName;
      const approvalFlows = newName
        ? state.approvalFlows.map(f => ({
            ...f,
            steps: f.steps.map(s =>
              s.approverGroupId === action.groupId ? { ...s, approverGroupName: newName } : s
            ),
          }))
        : state.approvalFlows;
      return { ...state, adGroups, approvalFlows };
    }

    case 'DELETE_AD_GROUP':
      return {
        ...state,
        adGroups:      state.adGroups.filter(g => g.groupId !== action.groupId),
        approvalFlows: state.approvalFlows.filter(f => (f.bizLineId as string) !== action.groupId),
      };

    case 'ADD_APPROVAL_FLOW':
      return { ...state, approvalFlows: [...state.approvalFlows, action.flow] };

    case 'EDIT_APPROVAL_FLOW':
      return {
        ...state,
        approvalFlows: state.approvalFlows.map(f => f.flowId === action.flowId ? action.flow : f),
      };

    case 'DELETE_APPROVAL_FLOW':
      return { ...state, approvalFlows: state.approvalFlows.filter(f => f.flowId !== action.flowId) };

    default: return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface UCPContextValue { state: UCPState; dispatch: React.Dispatch<Action> }
const UCPContext = createContext<UCPContextValue | null>(null);

export function UCPProvider({ children }: { children: React.ReactNode }) {
  const initialState: UCPState = {
    currentUser:          MOCK_USERS[0],
    navView:              'editor',
    markets:              MARKETS,
    releaseTargets:       RELEASE_TARGETS,
    bizLines:             BIZ_LINES,
    adGroups:             AD_GROUPS,
    approvalFlows:        APPROVAL_FLOWS,
    wechatAccounts:       WECHAT_ACCOUNTS,
    wechatTemplates:      WECHAT_TEMPLATES,
    pages:                ALL_PAGES,
    activePageId:         ALL_PAGES[0].pageId,
    layout:               ALL_PAGES[0],
    selectedInstanceId:   null,
    workflow:             MOCK_WORKFLOW_ENTRIES,
    marketStatus:         MOCK_MARKET_STATUS,
    submissions:          MOCK_SUBMISSIONS,
    aeoScores:            MOCK_AEO_SCORES,
    usageStats:           MOCK_USAGE_STATS,
    saMessages:           MOCK_SA_MESSAGES,
    audit:                MOCK_AUDIT,
    isDirty:              false,
    showSimulator:        false,
    showWorkflow:         false,
    showPageLibrary:      false,
    showNewPageModal:     false,
    showSubmitDialog:     false,
    showEditLiveWarning:  false,
    showAEOPanel:         false,
    showStatsPanel:       false,
    showWeChatComposer:   false,
    dragOverIndex:        null,
    toast:                null,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  return <UCPContext.Provider value={{ state, dispatch }}>{children}</UCPContext.Provider>;
}

export function useUCP() {
  const ctx = useContext(UCPContext);
  if (!ctx) throw new Error('useUCP must be used inside UCPProvider');
  return ctx;
}
