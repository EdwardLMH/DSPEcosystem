import React, { createContext, useContext, useReducer } from 'react';
import type {
  StaffUser, NavView, Persona, Market, ReleaseTarget, BizLine, AdGroup,
  ApprovalFlow, WeChatServiceAccount, WeChatMessageTemplate,
  PageLayout, WorkflowEntry, AuditEntry, PageMarketStatus, AEOScore, PageUsageStat, JourneyUsageStat,
  Channel, AuthoringStatus, BizLineId, CampaignSchedule, CanvasSlice,
  CustomerSegment, VisibilityRule, PreviewContext, PageTemplate,
  CustomerSegmentDef, AccountTypeDef, LocationDef,
  AISearchConfig,
} from '../types/ocdp';
export type { CustomerSegment, VisibilityRule, PreviewContext };import {
  MOCK_USERS, ALL_PAGES, MOCK_WORKFLOW, MOCK_AUDIT, MOCK_MARKET_STATUS,
  MOCK_AEO_SCORES, MOCK_USAGE_STATS, MOCK_JOURNEY_STATS, MOCK_JOURNEYS, MOCK_JOURNEY_PAGES, MOCK_JOURNEY_PAGES_WEB,
  MARKETS, RELEASE_TARGETS, BIZ_LINES, AD_GROUPS, APPROVAL_FLOWS,
  WECHAT_ACCOUNTS, WECHAT_TEMPLATES, PAGE_TEMPLATES,
  CUSTOMER_SEGMENT_DEFS, ACCOUNT_TYPE_DEFS, LOCATION_DEFS,
} from './mockData';
import type { Journey, JourneyStep, JourneyPage } from './mockData';
export type { JourneyPage };
import { v4 } from '../utils/uuid';
import { mockTranslate, translateSliceProps, TRANSLATABLE_PROP_KEYS } from '../utils/i18n';

// ─── State ────────────────────────────────────────────────────────────────────

export interface OCDPState {
  currentUser: StaffUser;
  navView: NavView;
  activePersona: Persona;

  markets: Market[];
  releaseTargets: ReleaseTarget[];
  bizLines: BizLine[];
  adGroups: AdGroup[];
  approvalFlows: ApprovalFlow[];
  wechatAccounts: WeChatServiceAccount[];
  wechatTemplates: WeChatMessageTemplate[];
  pageTemplates: PageTemplate[];

  // Rule parameter catalogue
  customerSegmentDefs: CustomerSegmentDef[];
  accountTypeDefs: AccountTypeDef[];
  locationDefs: LocationDef[];

  // AI Search
  aiSearchConfigs: AISearchConfig[];

  pages: PageLayout[];
  journeys: Journey[];
  journeyPages: JourneyPage[];   // pages owned by journeys, excluded from main pages panel
  activePageId: string;
  activeJourneyId: string;

  workflow: WorkflowEntry[];
  marketStatus: PageMarketStatus[];
  aeoScores: AEOScore[];
  usageStats: PageUsageStat[];
  journeyStats: JourneyUsageStat[];
  audit: AuditEntry[];

  showNewPageModal: boolean;
  showNewJourneyModal: boolean;
  showEntitlementModal: boolean;
  detailPageId: string | null;
  detailJourneyId: string | null;

  // Page editor state
  editorPageId: string | null;       // which page is open in the full-screen editor
  editorReturnView: NavView | null;  // where to go when editor is closed
  editorJourneyId: string | null;    // if editing a journey-step page, track the journey
  editorReadOnly: boolean;           // true = view-only mode (no edits allowed)

  toast: { id: string; message: string; type: 'success' | 'error' | 'info' } | null;

  // Rule engine
  previewContext: PreviewContext | null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_USER';           user: StaffUser }
  | { type: 'SET_NAV_VIEW';       view: NavView }
  | { type: 'SET_PERSONA';        persona: Persona }
  // Bulk-load all config param types from PGlite on startup
  | {
      type: 'LOAD_CONFIG_FROM_DB';
      markets?:              Market[];
      bizLines?:             BizLine[];
      adGroups?:             AdGroup[];
      approvalFlows?:        ApprovalFlow[];
      customerSegmentDefs?:  CustomerSegmentDef[];
      accountTypeDefs?:      AccountTypeDef[];
      locationDefs?:         LocationDef[];
      aiSearchConfigs?:      AISearchConfig[];
    }
  | { type: 'TOGGLE_NEW_PAGE_MODAL' }
  | { type: 'TOGGLE_NEW_JOURNEY_MODAL' }
  | { type: 'TOGGLE_ENTITLEMENT_MODAL' }
  | { type: 'OPEN_PAGE';          pageId: string }
  | { type: 'CLOSE_DETAIL' }
  | { type: 'OPEN_JOURNEY';       journeyId: string }
  // Page CRUD
  | { type: 'CREATE_PAGE'; page: Omit<PageLayout, 'pageId' | 'authoringStatus'> }
  | { type: 'EDIT_PAGE';   pageId: string; updates: Partial<Omit<PageLayout, 'pageId' | 'authoringStatus'>> }
  | { type: 'DELETE_PAGE';        pageId: string }
  | { type: 'ADD_SLICE';          pageId: string; slice: Omit<CanvasSlice, 'instanceId'> }
  | { type: 'REMOVE_SLICE';       pageId: string; instanceId: string }
  | { type: 'SET_PAGE_SCHEDULE'; pageId: string; schedule: CampaignSchedule | undefined }
  | { type: 'SET_CAMPAIGN_SCHEDULE'; pageId: string; schedule: CampaignSchedule | undefined }
  // Journey CRUD
  | { type: 'CREATE_JOURNEY'; journey: Omit<Journey, 'journeyId' | 'status' | 'steps'> }
  | { type: 'ADD_JOURNEY_STEP';    journeyId: string; step: Omit<JourneyStep, 'stepId'> }
  | { type: 'REMOVE_JOURNEY_STEP'; journeyId: string; stepId: string }
  | { type: 'REORDER_JOURNEY_STEP'; journeyId: string; fromIndex: number; toIndex: number }
  // Journey page CRUD (pages that belong to journey steps, not shown in Pages panel)
  | { type: 'ADD_JOURNEY_PAGE';    journeyId: string; stepIndex: number; page: Omit<PageLayout, 'pageId' | 'authoringStatus' | 'slices'> }
  | { type: 'EDIT_JOURNEY_PAGE';   pageId: string; updates: Partial<Omit<PageLayout, 'pageId' | 'authoringStatus'>> }
  | { type: 'REMOVE_JOURNEY_PAGE'; pageId: string }
  | { type: 'ADD_JOURNEY_PAGE_SLICE';    pageId: string; slice: Omit<CanvasSlice, 'instanceId'> }
  | { type: 'REMOVE_JOURNEY_PAGE_SLICE'; pageId: string; instanceId: string }
  | { type: 'TOGGLE_JOURNEY_PAGE_SLICE_VISIBLE'; pageId: string; instanceId: string }
  | { type: 'TOGGLE_JOURNEY_PAGE_SLICE_LOCK';    pageId: string; instanceId: string }
  | { type: 'REORDER_JOURNEY_PAGE_SLICES'; pageId: string; slices: CanvasSlice[] }
  // Page editor navigation
  | { type: 'OPEN_PAGE_EDITOR';  pageId: string; returnView: NavView; journeyId?: string; readOnly?: boolean }
  | { type: 'CLOSE_PAGE_EDITOR' }
  // Admin CRUD
  | { type: 'ADD_MARKET';         market: Market }
  | { type: 'EDIT_MARKET';        oldMarketId: string; market: Market }
  | { type: 'DELETE_MARKET';      marketId: string }
  | { type: 'ADD_BIZ_LINE';       bizLine: BizLine }
  | { type: 'EDIT_BIZ_LINE';      bizLineId: string; updates: Partial<BizLine> }
  | { type: 'DELETE_BIZ_LINE';    bizLineId: string }
  | { type: 'ADD_AD_GROUP';       group: AdGroup }
  | { type: 'EDIT_AD_GROUP';      groupId: string; updates: Partial<AdGroup> }
  | { type: 'DELETE_AD_GROUP';    groupId: string }
  | { type: 'ADD_APPROVAL_FLOW';  flow: ApprovalFlow }
  | { type: 'EDIT_APPROVAL_FLOW'; flowId: string; flow: ApprovalFlow }
  | { type: 'DELETE_APPROVAL_FLOW'; flowId: string }
  // Rule parameter catalogue
  | { type: 'ADD_CUSTOMER_SEGMENT';    def: CustomerSegmentDef }
  | { type: 'EDIT_CUSTOMER_SEGMENT';   segmentId: string; updates: Partial<CustomerSegmentDef> }
  | { type: 'DELETE_CUSTOMER_SEGMENT'; segmentId: string }
  | { type: 'ADD_ACCOUNT_TYPE';        def: AccountTypeDef }
  | { type: 'EDIT_ACCOUNT_TYPE';       typeId: string; updates: Partial<AccountTypeDef> }
  | { type: 'DELETE_ACCOUNT_TYPE';     typeId: string }
  | { type: 'ADD_LOCATION';            def: LocationDef }
  | { type: 'EDIT_LOCATION';           locationId: string; updates: Partial<LocationDef> }
  | { type: 'DELETE_LOCATION';         locationId: string }
  // AI Search config CRUD
  | { type: 'ADD_AI_SEARCH_CONFIG';    config: AISearchConfig }
  | { type: 'EDIT_AI_SEARCH_CONFIG';   configId: string; updates: Partial<AISearchConfig> }
  | { type: 'DELETE_AI_SEARCH_CONFIG'; configId: string }
  // Page approval workflow
  | { type: 'SUBMIT_PAGE';        pageId: string; targetIds: string[]; comment?: string }
  | { type: 'APPROVE_PAGE';       pageId: string; targetId: string; comment: string }
  | { type: 'REJECT_PAGE';        pageId: string; targetId: string; comment: string }
  | { type: 'PUBLISH_PAGE';       pageId: string; targetId: string }
  | { type: 'WITHDRAW_PAGE';      pageId: string }
  | { type: 'TAKEDOWN_PAGE';      pageId: string }
  | { type: 'DRAFT_NEW_VERSION';  pageId: string }
  | { type: 'CANCEL_TIMER_AND_PUBLISH'; pageId: string }
  // Journey approval workflow
  | { type: 'EDIT_JOURNEY';        journeyId: string; updates: Partial<Pick<Journey, 'name' | 'description' | 'nativeTargets'>> }
  | { type: 'REVERT_JOURNEY_TO_DRAFT'; journeyId: string }
  | { type: 'SUBMIT_JOURNEY';     journeyId: string; targetIds: string[]; comment?: string }
  | { type: 'APPROVE_JOURNEY';    journeyId: string; comment: string }
  | { type: 'REJECT_JOURNEY';     journeyId: string; comment: string }
  | { type: 'PUBLISH_JOURNEY';    journeyId: string }
  | { type: 'WITHDRAW_JOURNEY';   journeyId: string }
  | { type: 'TAKEDOWN_JOURNEY';   journeyId: string }
  | { type: 'DRAFT_NEW_JOURNEY_VERSION'; journeyId: string }
  | { type: 'SAVE_AEO_SCORE';     score: AEOScore }
  | { type: 'SHOW_TOAST';         message: string; toastType: 'success' | 'error' | 'info' }
  | { type: 'CLEAR_TOAST' }
  // Rule engine
  | { type: 'SET_PREVIEW_CONTEXT'; context: PreviewContext | null }
  | { type: 'SET_SLICE_RULE';      pageId: string; instanceId: string; rule: VisibilityRule | undefined }
  | { type: 'SET_JOURNEY_SLICE_RULE'; pageId: string; instanceId: string; rule: VisibilityRule | undefined }
  | { type: 'SET_STEP_RULE'; journeyId: string; stepId: string; rule: VisibilityRule | undefined }
  // Multi-language
  | { type: 'SET_PAGE_LOCALES'; pageId: string; locales: string[] }
  | { type: 'SET_PAGE_TRANSLATION'; pageId: string; locale: string; instanceId: string; propKey: string; value: string }
  | { type: 'TRANSLATE_PAGE'; pageId: string; locale: string }
  | { type: 'SET_JOURNEY_LOCALES'; journeyId: string; locales: string[] }
  | { type: 'SET_JOURNEY_TRANSLATION'; journeyId: string; locale: string; field: string; value: string }
  | { type: 'TRANSLATE_JOURNEY'; journeyId: string; locale: string };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function makeAudit(user: StaffUser, action: string, pageId: string, pageName: string, details?: string): AuditEntry {
  return { id: v4(), timestamp: new Date().toISOString(), actorId: user.id, actorRole: user.role, action, pageId, pageName, details, marketId: user.marketId, bizLineId: user.bizLineId };
}

function reducer(state: OCDPState, action: Action): OCDPState {
  switch (action.type) {
    case 'SET_USER':     return { ...state, currentUser: action.user, navView: action.user.role === 'AI-SEARCH-OPERATOR' ? 'ai-search' : state.navView };
    case 'SET_NAV_VIEW': return { ...state, navView: action.view };
    case 'SET_PERSONA':  return { ...state, activePersona: action.persona };

    case 'LOAD_CONFIG_FROM_DB': return {
      ...state,
      ...(action.markets             && { markets:             action.markets }),
      ...(action.bizLines            && { bizLines:            action.bizLines }),
      ...(action.adGroups            && { adGroups:            action.adGroups }),
      ...(action.approvalFlows       && { approvalFlows:       action.approvalFlows }),
      ...(action.customerSegmentDefs && { customerSegmentDefs: action.customerSegmentDefs }),
      ...(action.accountTypeDefs     && { accountTypeDefs:     action.accountTypeDefs }),
      ...(action.locationDefs        && { locationDefs:        action.locationDefs }),
      ...(action.aiSearchConfigs     && { aiSearchConfigs:     action.aiSearchConfigs }),
    };
    case 'OPEN_PAGE':    return { ...state, detailPageId: action.pageId, navView: 'pages' };
    case 'OPEN_JOURNEY': return { ...state, detailJourneyId: action.journeyId, navView: 'journeys' };
    case 'CLOSE_DETAIL': return { ...state, detailPageId: null, detailJourneyId: null };
    case 'TOGGLE_NEW_PAGE_MODAL':    return { ...state, showNewPageModal: !state.showNewPageModal };
    case 'TOGGLE_NEW_JOURNEY_MODAL': return { ...state, showNewJourneyModal: !state.showNewJourneyModal };
    case 'TOGGLE_ENTITLEMENT_MODAL': return { ...state, showEntitlementModal: !state.showEntitlementModal };

    case 'CREATE_PAGE': {
      const newPage: PageLayout = {
        ...action.page,
        pageId: v4(),
        authoringStatus: 'DRAFT',
        slices: action.page.slices ?? [],
        supportedLocales: action.page.supportedLocales?.length ? action.page.supportedLocales : [action.page.locale],
        translations: action.page.translations ?? {},
      };
      const wfEntry: WorkflowEntry = {
        entryId: v4(), pageId: newPage.pageId, pageName: newPage.name,
        status: 'DRAFT', authorId: state.currentUser.id, authorName: state.currentUser.name,
        comments: [], layout: newPage, version: 1,
      };
      return {
        ...state,
        pages: [...state.pages, newPage],
        workflow: [...state.workflow, wfEntry],
        showNewPageModal: false,
        detailPageId: newPage.pageId,
        audit: [...state.audit, makeAudit(state.currentUser, 'PAGE_CREATED', newPage.pageId, newPage.name)],
        toast: { id: v4(), message: `Page "${newPage.name}" created`, type: 'success' },
      };
    }

    case 'EDIT_PAGE': {
      const page = state.pages.find(p => p.pageId === action.pageId);
      if (!page) return state;
      const pages = state.pages.map(p =>
        p.pageId === action.pageId ? { ...p, ...action.updates, authoringStatus: 'DRAFT' as AuthoringStatus } : p
      );
      const workflow = state.workflow.map(w =>
        w.pageId === action.pageId ? { ...w, status: 'DRAFT' as const } : w
      );
      return {
        ...state, pages, workflow,
        audit: [...state.audit, makeAudit(state.currentUser, 'PAGE_EDITED', action.pageId, page.name)],
        toast: { id: v4(), message: `"${page.name}" saved as draft`, type: 'info' },
      };
    }

    case 'DELETE_PAGE': {
      const page = state.pages.find(p => p.pageId === action.pageId);
      if (!page) return state;
      return {
        ...state,
        pages: state.pages.filter(p => p.pageId !== action.pageId),
        workflow: state.workflow.filter(w => w.pageId !== action.pageId),
        detailPageId: state.detailPageId === action.pageId ? null : state.detailPageId,
        audit: [...state.audit, makeAudit(state.currentUser, 'PAGE_DELETED', action.pageId, page.name)],
        toast: { id: v4(), message: `Page "${page.name}" deleted`, type: 'info' },
      };
    }

    case 'ADD_SLICE': {
      const newSlice: CanvasSlice = { ...action.slice, instanceId: `slice-${v4().slice(0, 8)}` };
      return {
        ...state,
        pages: state.pages.map(p =>
          p.pageId === action.pageId ? { ...p, slices: [...p.slices, newSlice] } : p
        ),
      };
    }

    case 'REMOVE_SLICE':
      return {
        ...state,
        pages: state.pages.map(p =>
          p.pageId === action.pageId ? { ...p, slices: p.slices.filter(s => s.instanceId !== action.instanceId) } : p
        ),
      };

    case 'SET_PAGE_SCHEDULE':
    case 'SET_CAMPAIGN_SCHEDULE': {
      const page = state.pages.find(p => p.pageId === action.pageId);
      if (!page) return state;
      const scheduleLabel = page.pageType === 'ANNOUNCEMENT' ? 'ANNOUNCEMENT_SCHEDULE_SET' : 'CAMPAIGN_SCHEDULE_SET';
      return {
        ...state,
        pages: state.pages.map(p =>
          p.pageId === action.pageId ? { ...p, campaignSchedule: action.schedule } : p
        ),
        audit: [...state.audit, makeAudit(state.currentUser, scheduleLabel, action.pageId, page.name,
          action.schedule ? `Publish: ${action.schedule.publishAt} / Takedown: ${action.schedule.takedownAt} / Timezone: ${action.schedule.timezone ?? 'market default'}` : 'Schedule cleared')],
      };
    }

    case 'CREATE_JOURNEY': {
      const newJourney: Journey = {
        ...action.journey,
        journeyId: v4(),
        status: 'DRAFT',
        steps: [],
        supportedLocales: ['en'],
        translations: {},
      };
      return {
        ...state,
        journeys: [...state.journeys, newJourney],
        showNewJourneyModal: false,
        detailJourneyId: newJourney.journeyId,
        audit: [...state.audit, makeAudit(state.currentUser, 'JOURNEY_CREATED', newJourney.journeyId, newJourney.name)],
        toast: { id: v4(), message: `Journey "${newJourney.name}" created`, type: 'success' },
      };
    }

    case 'ADD_JOURNEY_STEP': {
      const step: JourneyStep = { ...action.step, stepId: v4() };
      return {
        ...state,
        journeys: state.journeys.map(j =>
          j.journeyId === action.journeyId ? { ...j, steps: [...j.steps, step] } : j
        ),
      };
    }

    case 'REMOVE_JOURNEY_STEP':
      return {
        ...state,
        journeys: state.journeys.map(j =>
          j.journeyId === action.journeyId ? { ...j, steps: j.steps.filter(s => s.stepId !== action.stepId) } : j
        ),
        journeyPages: state.journeyPages.filter(jp => !(jp.journeyId === action.journeyId && jp.page.pageId === action.stepId)),
      };

    case 'REORDER_JOURNEY_STEP': {
      const journey = state.journeys.find(j => j.journeyId === action.journeyId);
      if (!journey) return state;
      const steps = [...journey.steps];
      const [moved] = steps.splice(action.fromIndex, 1);
      steps.splice(action.toIndex, 0, moved);
      return { ...state, journeys: state.journeys.map(j => j.journeyId === action.journeyId ? { ...j, steps } : j) };
    }

    case 'ADD_JOURNEY_PAGE': {
      const newPage: PageLayout = {
        ...action.page,
        pageId: v4(),
        authoringStatus: 'DRAFT',
        slices: [],
        supportedLocales: action.page.supportedLocales?.length ? action.page.supportedLocales : [action.page.locale],
        translations: action.page.translations ?? {},
      };
      const journeyPage: JourneyPage = { journeyId: action.journeyId, stepIndex: action.stepIndex, page: newPage };
      const newStep: JourneyStep = {
        stepId: newPage.pageId,
        label: action.page.name,
        description: action.page.description ?? `Step ${action.stepIndex + 1}`,
        screenType: action.page.pageType,
        icon: action.page.thumbnail ?? '📄',
      };
      return {
        ...state,
        journeys: state.journeys.map(j =>
          j.journeyId === action.journeyId
            ? { ...j, steps: [...j.steps, newStep] }
            : j
        ),
        journeyPages: [...state.journeyPages, journeyPage],
        editorPageId: newPage.pageId,
        editorReturnView: 'journeys',
        editorJourneyId: action.journeyId,
        editorReadOnly: false,
      };
    }

    case 'EDIT_JOURNEY_PAGE': {
      const existing = state.journeyPages.find(jp => jp.page.pageId === action.pageId);
      if (!existing) return state;
      return {
        ...state,
        journeyPages: state.journeyPages.map(jp =>
          jp.page.pageId === action.pageId
            ? { ...jp, page: { ...jp.page, ...action.updates, authoringStatus: 'DRAFT' as AuthoringStatus } }
            : jp
        ),
      };
    }

    case 'REMOVE_JOURNEY_PAGE': {
      const removedJP = state.journeyPages.find(jp => jp.page.pageId === action.pageId);
      return {
        ...state,
        journeyPages: state.journeyPages.filter(jp => jp.page.pageId !== action.pageId),
        journeys: removedJP
          ? state.journeys.map(j =>
              j.journeyId === removedJP.journeyId
                ? { ...j, steps: j.steps.filter(s => s.stepId !== action.pageId) }
                : j
            )
          : state.journeys,
        editorPageId: state.editorPageId === action.pageId ? null : state.editorPageId,
      };
    }

    case 'ADD_JOURNEY_PAGE_SLICE': {
      const newSlice: CanvasSlice = { ...action.slice, instanceId: `slice-${v4().slice(0, 8)}` };
      return {
        ...state,
        journeyPages: state.journeyPages.map(jp =>
          jp.page.pageId === action.pageId
            ? { ...jp, page: { ...jp.page, slices: [...jp.page.slices, newSlice] } }
            : jp
        ),
      };
    }

    case 'REMOVE_JOURNEY_PAGE_SLICE':
      return {
        ...state,
        journeyPages: state.journeyPages.map(jp =>
          jp.page.pageId === action.pageId
            ? { ...jp, page: { ...jp.page, slices: jp.page.slices.filter(s => s.instanceId !== action.instanceId) } }
            : jp
        ),
      };

    case 'TOGGLE_JOURNEY_PAGE_SLICE_VISIBLE':
      return {
        ...state,
        journeyPages: state.journeyPages.map(jp =>
          jp.page.pageId === action.pageId
            ? { ...jp, page: { ...jp.page, slices: jp.page.slices.map(s => s.instanceId === action.instanceId ? { ...s, visible: !s.visible } : s) } }
            : jp
        ),
      };

    case 'TOGGLE_JOURNEY_PAGE_SLICE_LOCK':
      return {
        ...state,
        journeyPages: state.journeyPages.map(jp =>
          jp.page.pageId === action.pageId
            ? { ...jp, page: { ...jp.page, slices: jp.page.slices.map(s => s.instanceId === action.instanceId ? { ...s, locked: !s.locked } : s) } }
            : jp
        ),
      };

    case 'REORDER_JOURNEY_PAGE_SLICES':
      return {
        ...state,
        journeyPages: state.journeyPages.map(jp =>
          jp.page.pageId === action.pageId ? { ...jp, page: { ...jp.page, slices: action.slices } } : jp
        ),
      };

    case 'OPEN_PAGE_EDITOR':
      return {
        ...state,
        editorPageId: action.pageId,
        editorReturnView: action.returnView,
        editorJourneyId: action.journeyId ?? null,
        editorReadOnly: action.readOnly ?? false,
      };

    case 'CLOSE_PAGE_EDITOR':
      return {
        ...state,
        editorPageId: null,
        navView: state.editorReturnView ?? 'pages',
        editorReturnView: null,
        editorJourneyId: null,
        editorReadOnly: false,
      };

    case 'ADD_MARKET':    return { ...state, markets: [...state.markets, action.market] };
    case 'EDIT_MARKET': {
      const idChanged = action.market.marketId !== action.oldMarketId;
      return {
        ...state,
        markets: state.markets.map(m => m.marketId === action.oldMarketId ? action.market : m),
        adGroups: idChanged ? state.adGroups.map(g => g.marketId === action.oldMarketId ? { ...g, marketId: action.market.marketId } : g) : state.adGroups,
        approvalFlows: idChanged ? state.approvalFlows.map(f => f.marketId === action.oldMarketId ? { ...f, marketId: action.market.marketId } : f) : state.approvalFlows,
      };
    }
    case 'DELETE_MARKET': return { ...state, markets: state.markets.filter(m => m.marketId !== action.marketId), adGroups: state.adGroups.filter(g => g.marketId !== action.marketId), approvalFlows: state.approvalFlows.filter(f => f.marketId !== action.marketId) };

    case 'ADD_BIZ_LINE':    return { ...state, bizLines: [...state.bizLines, action.bizLine] };
    case 'EDIT_BIZ_LINE':   return { ...state, bizLines: state.bizLines.map(b => b.bizLineId === action.bizLineId ? { ...b, ...action.updates } : b) };
    case 'DELETE_BIZ_LINE': return { ...state, bizLines: state.bizLines.filter(b => b.bizLineId !== action.bizLineId) };

    case 'ADD_AD_GROUP':    return { ...state, adGroups: [...state.adGroups, action.group] };
    case 'EDIT_AD_GROUP':   return { ...state, adGroups: state.adGroups.map(g => g.groupId === action.groupId ? { ...g, ...action.updates } : g) };
    case 'DELETE_AD_GROUP': return { ...state, adGroups: state.adGroups.filter(g => g.groupId !== action.groupId) };

    case 'ADD_APPROVAL_FLOW':    return { ...state, approvalFlows: [...state.approvalFlows, action.flow] };
    case 'EDIT_APPROVAL_FLOW':   return { ...state, approvalFlows: state.approvalFlows.map(f => f.flowId === action.flowId ? action.flow : f) };
    case 'DELETE_APPROVAL_FLOW': return { ...state, approvalFlows: state.approvalFlows.filter(f => f.flowId !== action.flowId) };

    case 'ADD_CUSTOMER_SEGMENT':    return { ...state, customerSegmentDefs: [...state.customerSegmentDefs, action.def] };
    case 'EDIT_CUSTOMER_SEGMENT':   return { ...state, customerSegmentDefs: state.customerSegmentDefs.map(d => d.segmentId === action.segmentId ? { ...d, ...action.updates } : d) };
    case 'DELETE_CUSTOMER_SEGMENT': return { ...state, customerSegmentDefs: state.customerSegmentDefs.filter(d => d.segmentId !== action.segmentId) };

    case 'ADD_ACCOUNT_TYPE':    return { ...state, accountTypeDefs: [...state.accountTypeDefs, action.def] };
    case 'EDIT_ACCOUNT_TYPE':   return { ...state, accountTypeDefs: state.accountTypeDefs.map(d => d.typeId === action.typeId ? { ...d, ...action.updates } : d) };
    case 'DELETE_ACCOUNT_TYPE': return { ...state, accountTypeDefs: state.accountTypeDefs.filter(d => d.typeId !== action.typeId) };

    case 'ADD_LOCATION':    return { ...state, locationDefs: [...state.locationDefs, action.def] };
    case 'EDIT_LOCATION':   return { ...state, locationDefs: state.locationDefs.map(d => d.locationId === action.locationId ? { ...d, ...action.updates } : d) };
    case 'DELETE_LOCATION': return { ...state, locationDefs: state.locationDefs.filter(d => d.locationId !== action.locationId) };

    case 'SUBMIT_PAGE': {
      const page = state.pages.find(p => p.pageId === action.pageId);
      if (!page) return state;
      const pages = state.pages.map(p => p.pageId === action.pageId ? { ...p, authoringStatus: 'PENDING_APPROVAL' as AuthoringStatus } : p);
      const workflow = state.workflow.map(w => w.pageId === action.pageId ? { ...w, status: 'PENDING_APPROVAL' as const, submittedAt: new Date().toISOString() } : w);
      return {
        ...state, pages, workflow,
        audit: [...state.audit, makeAudit(state.currentUser, 'PAGE_SUBMITTED', action.pageId, page.name, `Targets: ${action.targetIds.join(', ')}`)],
        toast: { id: v4(), message: `Submitted "${page.name}" for approval`, type: 'success' },
      };
    }

    case 'APPROVE_PAGE': {
      const page = state.pages.find(p => p.pageId === action.pageId);
      if (!page) return state;
      const isSchedulable = page.pageType === 'CAMPAIGN' || page.pageType === 'ANNOUNCEMENT';
      const pages = state.pages.map(p => p.pageId === action.pageId ? { ...p, authoringStatus: 'APPROVED' as AuthoringStatus } : p);
      const workflow = state.workflow.map(w => w.pageId === action.pageId ? { ...w, status: 'APPROVED' as const, reviewedAt: new Date().toISOString(), reviewerId: state.currentUser.id, reviewerName: state.currentUser.name } : w);
      return {
        ...state, pages, workflow,
        audit: [...state.audit, makeAudit(state.currentUser, 'APPROVED', action.pageId, page.name, action.comment)],
        toast: { id: v4(), message: isSchedulable ? `${page.pageType === 'ANNOUNCEMENT' ? 'Announcement' : 'Campaign'} approved — set timer before releasing` : 'Approved — ready to publish', type: 'success' },
      };
    }

    case 'REJECT_PAGE': {
      const page = state.pages.find(p => p.pageId === action.pageId);
      if (!page) return state;
      const pages = state.pages.map(p => p.pageId === action.pageId ? { ...p, authoringStatus: 'REJECTED' as AuthoringStatus } : p);
      const workflow = state.workflow.map(w => w.pageId === action.pageId ? { ...w, status: 'REJECTED' as const, reviewedAt: new Date().toISOString() } : w);
      return { ...state, pages, workflow, audit: [...state.audit, makeAudit(state.currentUser, 'REJECTED', action.pageId, page.name, action.comment)], toast: { id: v4(), message: 'Rejected — returned for revision', type: 'error' } };
    }

    case 'PUBLISH_PAGE': {
      const page = state.pages.find(p => p.pageId === action.pageId);
      if (!page) return state;
      const pages = state.pages.map(p => p.pageId === action.pageId ? { ...p, authoringStatus: 'LIVE' as AuthoringStatus } : p);
      const marketStatus = state.marketStatus.filter(ms => !(ms.pageId === action.pageId && ms.targetId === action.targetId));
      marketStatus.push({ pageId: action.pageId, targetId: action.targetId, productionStatus: 'LIVE', lastPublishedAt: new Date().toISOString().split('T')[0] });
      const workflow = state.workflow.map(w => w.pageId === action.pageId ? { ...w, status: 'LIVE' as const } : w);
      return { ...state, pages, marketStatus, workflow, audit: [...state.audit, makeAudit(state.currentUser, 'PUBLISHED', action.pageId, page.name, `Target: ${action.targetId}`)], toast: { id: v4(), message: `Published to ${action.targetId} production`, type: 'success' } };
    }

    case 'WITHDRAW_PAGE': {
      const page = state.pages.find(p => p.pageId === action.pageId);
      if (!page) return state;
      const pages = state.pages.map(p => p.pageId === action.pageId ? { ...p, authoringStatus: 'DRAFT' as AuthoringStatus } : p);
      const workflow = state.workflow.map(w => w.pageId === action.pageId ? { ...w, status: 'DRAFT' as const } : w);
      return { ...state, pages, workflow, audit: [...state.audit, makeAudit(state.currentUser, 'WITHDRAWN', action.pageId, page.name)], toast: { id: v4(), message: `Withdrawn "${page.name}" back to Draft`, type: 'info' } };
    }

    case 'TAKEDOWN_PAGE': {
      const page = state.pages.find(p => p.pageId === action.pageId);
      if (!page) return state;
      const pages = state.pages.map(p => p.pageId === action.pageId ? { ...p, authoringStatus: 'DRAFT' as AuthoringStatus, campaignSchedule: undefined } : p);
      const marketStatus = state.marketStatus.filter(ms => ms.pageId !== action.pageId);
      const workflow = state.workflow.map(w => w.pageId === action.pageId ? { ...w, status: 'DRAFT' as const } : w);
      return { ...state, pages, marketStatus, workflow, audit: [...state.audit, makeAudit(state.currentUser, 'TAKEN_DOWN', action.pageId, page.name)], toast: { id: v4(), message: `Taken down "${page.name}" and reverted to Draft`, type: 'info' } };
    }

    case 'DRAFT_NEW_VERSION': {
      const original = state.pages.find(p => p.pageId === action.pageId);
      if (!original) return state;
      const newPage: PageLayout = {
        ...original,
        pageId: v4(),
        name: `${original.name} (v2)`,
        authoringStatus: 'DRAFT',
        campaignSchedule: undefined,
      };
      const wfEntry: WorkflowEntry = {
        entryId: v4(), pageId: newPage.pageId, pageName: newPage.name,
        status: 'DRAFT', authorId: state.currentUser.id, authorName: state.currentUser.name,
        comments: [], layout: newPage, version: 2,
      };
      return {
        ...state,
        pages: [...state.pages, newPage],
        workflow: [...state.workflow, wfEntry],
        detailPageId: newPage.pageId,
        audit: [...state.audit, makeAudit(state.currentUser, 'NEW_VERSION_CREATED', newPage.pageId, newPage.name, `Based on ${original.pageId}`)],
        toast: { id: v4(), message: `New draft version of "${original.name}" created`, type: 'success' },
      };
    }

    case 'CANCEL_TIMER_AND_PUBLISH': {
      const page = state.pages.find(p => p.pageId === action.pageId);
      if (!page) return state;
      const targetId = page.releaseMarketIds?.[0] ?? '';
      const pages = state.pages.map(p => p.pageId === action.pageId ? { ...p, authoringStatus: 'LIVE' as AuthoringStatus, campaignSchedule: undefined } : p);
      const marketStatus = state.marketStatus.filter(ms => !(ms.pageId === action.pageId && ms.targetId === targetId));
      marketStatus.push({ pageId: action.pageId, targetId, productionStatus: 'LIVE', lastPublishedAt: new Date().toISOString().split('T')[0] });
      const workflow = state.workflow.map(w => w.pageId === action.pageId ? { ...w, status: 'LIVE' as const } : w);
      return { ...state, pages, marketStatus, workflow, audit: [...state.audit, makeAudit(state.currentUser, 'TIMER_CANCELLED_AND_PUBLISHED', action.pageId, page.name, `Immediate release to ${targetId}`)], toast: { id: v4(), message: `Timer cancelled — published immediately to ${targetId}`, type: 'success' } };
    }

    case 'EDIT_JOURNEY': {
      const journeys = state.journeys.map(j => j.journeyId === action.journeyId ? { ...j, ...action.updates } : j);
      return { ...state, journeys };
    }

    case 'REVERT_JOURNEY_TO_DRAFT': {
      const journeys = state.journeys.map(j => j.journeyId === action.journeyId ? { ...j, status: 'DRAFT' as Journey['status'] } : j);
      return { ...state, journeys, toast: { id: v4(), message: 'Journey reverted to Draft', type: 'info' } };
    }

    case 'SUBMIT_JOURNEY': {
      const journey = state.journeys.find(j => j.journeyId === action.journeyId);
      if (!journey) return state;
      const journeys = state.journeys.map(j => j.journeyId === action.journeyId ? { ...j, status: 'PENDING_APPROVAL' as Journey['status'] } : j);
      return {
        ...state, journeys,
        audit: [...state.audit, makeAudit(state.currentUser, 'JOURNEY_SUBMITTED', action.journeyId, journey.name, `Targets: ${action.targetIds.join(', ')}`)],
        toast: { id: v4(), message: `Submitted journey "${journey.name}" for approval`, type: 'success' },
      };
    }

    case 'APPROVE_JOURNEY': {
      const journey = state.journeys.find(j => j.journeyId === action.journeyId);
      if (!journey) return state;
      const journeys = state.journeys.map(j => j.journeyId === action.journeyId ? { ...j, status: 'APPROVED' as Journey['status'] } : j);
      return { ...state, journeys, audit: [...state.audit, makeAudit(state.currentUser, 'JOURNEY_APPROVED', action.journeyId, journey.name, action.comment)], toast: { id: v4(), message: 'Journey approved — ready to publish', type: 'success' } };
    }

    case 'REJECT_JOURNEY': {
      const journey = state.journeys.find(j => j.journeyId === action.journeyId);
      if (!journey) return state;
      const journeys = state.journeys.map(j => j.journeyId === action.journeyId ? { ...j, status: 'REJECTED' as Journey['status'] } : j);
      return { ...state, journeys, audit: [...state.audit, makeAudit(state.currentUser, 'JOURNEY_REJECTED', action.journeyId, journey.name, action.comment)], toast: { id: v4(), message: 'Journey rejected — returned for revision', type: 'error' } };
    }

    case 'PUBLISH_JOURNEY': {
      const journey = state.journeys.find(j => j.journeyId === action.journeyId);
      if (!journey) return state;
      const journeys = state.journeys.map(j => j.journeyId === action.journeyId ? { ...j, status: 'LIVE' as Journey['status'] } : j);
      return { ...state, journeys, audit: [...state.audit, makeAudit(state.currentUser, 'JOURNEY_PUBLISHED', action.journeyId, journey.name)], toast: { id: v4(), message: `Journey "${journey.name}" is now LIVE`, type: 'success' } };
    }

    case 'WITHDRAW_JOURNEY': {
      const journey = state.journeys.find(j => j.journeyId === action.journeyId);
      if (!journey) return state;
      const journeys = state.journeys.map(j => j.journeyId === action.journeyId ? { ...j, status: 'DRAFT' as Journey['status'] } : j);
      return { ...state, journeys, audit: [...state.audit, makeAudit(state.currentUser, 'JOURNEY_WITHDRAWN', action.journeyId, journey.name)], toast: { id: v4(), message: `Withdrawn "${journey.name}" back to Draft`, type: 'info' } };
    }

    case 'TAKEDOWN_JOURNEY': {
      const journey = state.journeys.find(j => j.journeyId === action.journeyId);
      if (!journey) return state;
      const journeys = state.journeys.map(j => j.journeyId === action.journeyId ? { ...j, status: 'DRAFT' as Journey['status'] } : j);
      return { ...state, journeys, audit: [...state.audit, makeAudit(state.currentUser, 'JOURNEY_TAKEN_DOWN', action.journeyId, journey.name)], toast: { id: v4(), message: `Taken down "${journey.name}" and reverted to Draft`, type: 'info' } };
    }

    case 'DRAFT_NEW_JOURNEY_VERSION': {
      const original = state.journeys.find(j => j.journeyId === action.journeyId);
      if (!original) return state;
      const newJourney: Journey = {
        ...original,
        journeyId: v4(),
        name: `${original.name} (v2)`,
        status: 'DRAFT',
      };
      return {
        ...state,
        journeys: [...state.journeys, newJourney],
        detailJourneyId: newJourney.journeyId,
        audit: [...state.audit, makeAudit(state.currentUser, 'NEW_JOURNEY_VERSION_CREATED', newJourney.journeyId, newJourney.name, `Based on ${original.journeyId}`)],
        toast: { id: v4(), message: `New draft version of "${original.name}" created`, type: 'success' },
      };
    }

    case 'SAVE_AEO_SCORE': {
      // Remove existing score for same pageId + targetId, then add new one
      const aeoScores = state.aeoScores.filter(s => !(s.pageId === action.score.pageId && s.targetId === action.score.targetId));
      aeoScores.push(action.score);
      return { ...state, aeoScores };
    }

    case 'SHOW_TOAST': return { ...state, toast: { id: v4(), message: action.message, type: action.toastType } };
    case 'CLEAR_TOAST': return { ...state, toast: null };

    case 'SET_PREVIEW_CONTEXT': return { ...state, previewContext: action.context };

    case 'SET_SLICE_RULE':
      return {
        ...state,
        pages: state.pages.map(p =>
          p.pageId === action.pageId
            ? { ...p, slices: p.slices.map(s => s.instanceId === action.instanceId ? { ...s, visibilityRule: action.rule } : s) }
            : p
        ),
      };

    case 'SET_JOURNEY_SLICE_RULE':
      return {
        ...state,
        journeyPages: state.journeyPages.map(jp =>
          jp.page.pageId === action.pageId
            ? { ...jp, page: { ...jp.page, slices: jp.page.slices.map(s => s.instanceId === action.instanceId ? { ...s, visibilityRule: action.rule } : s) } }
            : jp
        ),
      };

    case 'SET_STEP_RULE':
      return {
        ...state,
        journeys: state.journeys.map(j =>
          j.journeyId === action.journeyId
            ? { ...j, steps: j.steps.map(s => s.stepId === action.stepId ? { ...s, visibilityRule: action.rule } : s) }
            : j
        ),
      };

    case 'SET_PAGE_LOCALES': {
      const page = state.pages.find(p => p.pageId === action.pageId)
        ?? state.journeyPages.find(jp => jp.page.pageId === action.pageId)?.page;
      if (!page) return state;
      const primaryLocale = page.locale;
      let translations = { ...page.translations };
      const removedLocales = page.supportedLocales.filter(l => l !== primaryLocale && !action.locales.includes(l));
      for (const locale of removedLocales) {
        const { [locale]: _removed, ...rest } = translations;
        translations = rest;
      }
      const updatePage = (p: PageLayout) =>
        p.pageId === action.pageId ? { ...p, supportedLocales: action.locales, translations } : p;
      return {
        ...state,
        pages: state.pages.map(updatePage),
        journeyPages: state.journeyPages.map(jp => ({ ...jp, page: updatePage(jp.page) })),
      };
    }

    case 'TRANSLATE_PAGE': {
      const page = state.pages.find(p => p.pageId === action.pageId)
        ?? state.journeyPages.find(jp => jp.page.pageId === action.pageId)?.page;
      if (!page) return state;
      const localeTranslations: Record<string, Record<string, string>> = {};
      for (const slice of page.slices) {
        const textKeys = TRANSLATABLE_PROP_KEYS[slice.type] ?? [];
        const translated = translateSliceProps(slice.props, textKeys, action.locale);
        if (Object.keys(translated).length > 0) localeTranslations[slice.instanceId] = translated;
      }
      const translations = { ...page.translations, [action.locale]: { ...(page.translations[action.locale] ?? {}), ...localeTranslations } };
      const updatePage = (p: PageLayout) =>
        p.pageId === action.pageId ? { ...p, translations } : p;
      return {
        ...state,
        pages: state.pages.map(updatePage),
        journeyPages: state.journeyPages.map(jp => ({ ...jp, page: updatePage(jp.page) })),
      };
    }

    case 'SET_PAGE_TRANSLATION': {
      const updatePage = (p: PageLayout) => {
        if (p.pageId !== action.pageId) return p;
        const localeMap = { ...(p.translations[action.locale] ?? {}) };
        const sliceMap = { ...(localeMap[action.instanceId] ?? {}), [action.propKey]: action.value };
        return { ...p, translations: { ...p.translations, [action.locale]: { ...localeMap, [action.instanceId]: sliceMap } } };
      };
      return {
        ...state,
        pages: state.pages.map(updatePage),
        journeyPages: state.journeyPages.map(jp => ({ ...jp, page: updatePage(jp.page) })),
      };
    }

    case 'SET_JOURNEY_LOCALES': {
      const journey = state.journeys.find(j => j.journeyId === action.journeyId);
      if (!journey) return state;
      const primaryLocale = journey.supportedLocales[0] ?? 'en';
      let translations = { ...journey.translations };
      const removedLocales = journey.supportedLocales.filter(l => l !== primaryLocale && !action.locales.includes(l));
      for (const locale of removedLocales) {
        const { [locale]: _removed, ...rest } = translations;
        translations = rest;
      }
      return {
        ...state,
        journeys: state.journeys.map(j =>
          j.journeyId === action.journeyId ? { ...j, supportedLocales: action.locales, translations } : j
        ),
      };
    }

    case 'TRANSLATE_JOURNEY': {
      const journey = state.journeys.find(j => j.journeyId === action.journeyId);
      if (!journey) return state;
      const existing = journey.translations?.[action.locale] ?? {};
      return {
        ...state,
        journeys: state.journeys.map(j =>
          j.journeyId !== action.journeyId ? j : {
            ...j,
            translations: {
              ...j.translations,
              [action.locale]: {
                name: existing.name || mockTranslate(journey.name, action.locale),
                description: existing.description || mockTranslate(journey.description, action.locale),
              },
            },
          }
        ),
      };
    }

    case 'SET_JOURNEY_TRANSLATION':
      return {
        ...state,
        journeys: state.journeys.map(j =>
          j.journeyId === action.journeyId
            ? { ...j, translations: { ...j.translations, [action.locale]: { ...(j.translations[action.locale] ?? {}), [action.field]: action.value } } }
            : j
        ),
      };

    case 'ADD_AI_SEARCH_CONFIG':
      return { ...state, aiSearchConfigs: [...state.aiSearchConfigs, action.config] };
    case 'EDIT_AI_SEARCH_CONFIG':
      return {
        ...state,
        aiSearchConfigs: state.aiSearchConfigs.map(c =>
          c.configId === action.configId ? { ...c, ...action.updates, updatedAt: new Date().toISOString() } : c
        ),
      };
    case 'DELETE_AI_SEARCH_CONFIG':
      return { ...state, aiSearchConfigs: state.aiSearchConfigs.filter(c => c.configId !== action.configId) };

    default: return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface OCDPContextValue { state: OCDPState; dispatch: React.Dispatch<Action> }
const OCDPContext = createContext<OCDPContextValue | null>(null);

export function OCDPProvider({ children }: { children: React.ReactNode }) {
  const initialState: OCDPState = {
    currentUser: MOCK_USERS[0],
    navView: 'pages',
    activePersona: 'Personal',
    markets: MARKETS,
    releaseTargets: RELEASE_TARGETS,
    bizLines: BIZ_LINES,
    adGroups: AD_GROUPS,
    approvalFlows: APPROVAL_FLOWS,
    wechatAccounts: WECHAT_ACCOUNTS,
    wechatTemplates: WECHAT_TEMPLATES,
    pageTemplates: PAGE_TEMPLATES,
    customerSegmentDefs: CUSTOMER_SEGMENT_DEFS,
    accountTypeDefs: ACCOUNT_TYPE_DEFS,
    locationDefs: LOCATION_DEFS,
    aiSearchConfigs: [],
    pages: ALL_PAGES,
    journeys: MOCK_JOURNEYS,
    journeyPages: [...MOCK_JOURNEY_PAGES, ...MOCK_JOURNEY_PAGES_WEB],
    activePageId: ALL_PAGES[0].pageId,
    activeJourneyId: MOCK_JOURNEYS[0].journeyId,
    workflow: MOCK_WORKFLOW,
    marketStatus: MOCK_MARKET_STATUS,
    aeoScores: MOCK_AEO_SCORES,
    usageStats: MOCK_USAGE_STATS,
    journeyStats: MOCK_JOURNEY_STATS,
    audit: MOCK_AUDIT,
    showNewPageModal: false,
    showNewJourneyModal: false,
    showEntitlementModal: false,
    detailPageId: null,
    detailJourneyId: null,
    editorPageId: null,
    editorReturnView: null,
    editorJourneyId: null,
    editorReadOnly: false,
    toast: null,
    previewContext: null,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  return <OCDPContext.Provider value={{ state, dispatch }}>{children}</OCDPContext.Provider>;
}

export function useOCDP() {
  const ctx = useContext(OCDPContext);
  if (!ctx) throw new Error('useOCDP must be used inside OCDPProvider');
  return ctx;
}

// Returns true for market-scoped admins and the cross-market GLOBAL_ADMIN role.
export function isAdmin(role: string) {
  return role === 'ADMIN' || role === 'GLOBAL_ADMIN';
}

// Returns true only for the GLOBAL_ADMIN role (full cross-market access).
export function isGlobalAdmin(role: string) {
  return role === 'GLOBAL_ADMIN';
}
