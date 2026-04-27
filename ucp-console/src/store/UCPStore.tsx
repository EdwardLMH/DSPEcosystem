import React, { createContext, useContext, useReducer } from 'react';
import {
  CanvasSlice, PageLayout, WorkflowEntry, WorkflowStatus,
  AuditEntry, StaffUser, SliceType,
} from '../types/ucp';
import { DEFAULT_PAGE_LAYOUT, MOCK_WORKFLOW_ENTRIES, MOCK_AUDIT, MOCK_USERS } from './mockData';
import { v4 } from '../utils/uuid';
import { SLICE_DEFINITIONS } from '../utils/sliceDefinitions';

// ─── State shape ──────────────────────────────────────────────────────────────

export interface UCPState {
  currentUser: StaffUser;
  layout: PageLayout;
  selectedInstanceId: string | null;
  workflow: WorkflowEntry[];
  audit: AuditEntry[];
  isDirty: boolean;
  showSimulator: boolean;
  showWorkflow: boolean;
  toast: { id: string; message: string; type: 'success' | 'error' | 'info' } | null;
  dragOverIndex: number | null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_USER'; user: StaffUser }
  | { type: 'SELECT_SLICE'; instanceId: string | null }
  | { type: 'ADD_SLICE'; sliceType: SliceType; atIndex?: number }
  | { type: 'REMOVE_SLICE'; instanceId: string }
  | { type: 'MOVE_SLICE'; fromIndex: number; toIndex: number }
  | { type: 'UPDATE_SLICE_PROPS'; instanceId: string; props: Record<string, any> }
  | { type: 'TOGGLE_SLICE_VISIBLE'; instanceId: string }
  | { type: 'TOGGLE_SLICE_LOCK'; instanceId: string }
  | { type: 'SUBMIT_FOR_APPROVAL' }
  | { type: 'APPROVE'; comment: string }
  | { type: 'REJECT'; comment: string }
  | { type: 'PUBLISH' }
  | { type: 'TOGGLE_SIMULATOR' }
  | { type: 'TOGGLE_WORKFLOW' }
  | { type: 'SET_DRAG_OVER'; index: number | null }
  | { type: 'SHOW_TOAST'; message: string; toastType: 'success' | 'error' | 'info' }
  | { type: 'CLEAR_TOAST' };

// ─── Default props per slice type ─────────────────────────────────────────────

function defaultPropsFor(sliceType: SliceType): Record<string, any> {
  switch (sliceType) {
    case 'HEADER_NAV':
      return { title: '搜尋', searchPlaceholder: '搜尋功能、產品', showNotificationBell: true, showQRScanner: true };
    case 'QUICK_ACCESS':
      return { items: [
        { id: v4(), icon: '💳', label: '信用卡', deepLink: 'hsbc://cards' },
        { id: v4(), icon: '↔️', label: '轉帳',   deepLink: 'hsbc://transfer' },
        { id: v4(), icon: '📊', label: '賬戶',   deepLink: 'hsbc://accounts' },
      ]};
    case 'PROMO_BANNER':
      return { title: '全新活動', subtitle: '點擊了解更多', ctaLabel: '立即參與', ctaDeepLink: 'hsbc://campaign/new', imageUrl: '', backgroundColor: '#E8F4FD' };
    case 'FUNCTION_GRID':
      return { rows: [[
        { id: v4(), icon: '💳', label: '信用卡', deepLink: 'hsbc://cards' },
        { id: v4(), icon: '📄', label: '明細',   deepLink: 'hsbc://statements' },
        { id: v4(), icon: '🔄', label: '轉入',   deepLink: 'hsbc://transfer/in' },
        { id: v4(), icon: '🏙️', label: '城市',   deepLink: 'hsbc://city' },
        { id: v4(), icon: '⋯',  label: '更多',   deepLink: 'hsbc://all' },
      ]]};
    case 'AI_ASSISTANT':
      return { greeting: 'Hi，我是你的智能財富助理', avatarUrl: '' };
    case 'AD_BANNER':
      return { title: '精選推廣', subtitle: '限時優惠', ctaLabel: '了解更多', ctaDeepLink: 'hsbc://promo/new', imageUrl: '', dismissible: true };
    case 'FLASH_LOAN':
      return { productName: '閃電貸', tagline: '最高可借額度', maxAmount: 300000, currency: 'HKD', ctaLabel: '獲取額度', ctaDeepLink: 'hsbc://loan/flash' };
    case 'WEALTH_SELECTION':
      return { sectionTitle: '財富精選', products: [], moreDeepLink: 'hsbc://wealth/all' };
    case 'FEATURED_RANKINGS':
      return { sectionTitle: '特色榜單', items: [], moreDeepLink: 'hsbc://rankings/all' };
    case 'LIFE_DEALS':
      return { sectionTitle: '生活特惠', deals: [], moreDeepLink: 'hsbc://deals/all', bottomLinks: [] };
    case 'SPACER':
      return { height: 16 };
  }
}

// ─── Audit helper ─────────────────────────────────────────────────────────────

function makeAudit(user: StaffUser, action: string, pageId: string, pageName: string, details?: string): AuditEntry {
  return { id: v4(), timestamp: new Date().toISOString(), actorId: user.id, actorRole: user.role, action, pageId, pageName, details };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: UCPState, action: Action): UCPState {
  switch (action.type) {

    case 'SET_USER':
      return { ...state, currentUser: action.user };

    case 'SELECT_SLICE':
      return { ...state, selectedInstanceId: action.instanceId };

    case 'ADD_SLICE': {
      const def = SLICE_DEFINITIONS[action.sliceType];
      const isSingleton = def?.singleton;
      const alreadyExists = state.layout.slices.some(s => s.type === action.sliceType);
      if (isSingleton && alreadyExists) return { ...state };

      const newSlice: CanvasSlice = {
        instanceId: `slice-${v4().slice(0, 8)}`,
        type: action.sliceType,
        props: defaultPropsFor(action.sliceType),
        visible: true,
        locked: false,
      };
      const slices = [...state.layout.slices];
      const idx = action.atIndex !== undefined ? action.atIndex : slices.length;
      slices.splice(idx, 0, newSlice);
      return {
        ...state,
        layout: { ...state.layout, slices },
        selectedInstanceId: newSlice.instanceId,
        isDirty: true,
        audit: [...state.audit, makeAudit(state.currentUser, 'SLICE_ADDED', state.layout.pageId, state.layout.name, `Added ${action.sliceType}`)],
      };
    }

    case 'REMOVE_SLICE': {
      const slices = state.layout.slices.filter(s => s.instanceId !== action.instanceId);
      const removed = state.layout.slices.find(s => s.instanceId === action.instanceId);
      return {
        ...state,
        layout: { ...state.layout, slices },
        selectedInstanceId: state.selectedInstanceId === action.instanceId ? null : state.selectedInstanceId,
        isDirty: true,
        audit: [...state.audit, makeAudit(state.currentUser, 'SLICE_REMOVED', state.layout.pageId, state.layout.name, `Removed ${removed?.type}`)],
      };
    }

    case 'MOVE_SLICE': {
      const slices = [...state.layout.slices];
      const [moved] = slices.splice(action.fromIndex, 1);
      slices.splice(action.toIndex, 0, moved);
      return { ...state, layout: { ...state.layout, slices }, isDirty: true };
    }

    case 'UPDATE_SLICE_PROPS': {
      const slices = state.layout.slices.map(s =>
        s.instanceId === action.instanceId
          ? { ...s, props: { ...s.props, ...action.props } }
          : s
      );
      return {
        ...state,
        layout: { ...state.layout, slices },
        isDirty: true,
        audit: [...state.audit, makeAudit(state.currentUser, 'SLICE_EDITED', state.layout.pageId, state.layout.name, `Edited ${action.instanceId}`)],
      };
    }

    case 'TOGGLE_SLICE_VISIBLE': {
      const slices = state.layout.slices.map(s =>
        s.instanceId === action.instanceId ? { ...s, visible: !s.visible } : s
      );
      return { ...state, layout: { ...state.layout, slices }, isDirty: true };
    }

    case 'TOGGLE_SLICE_LOCK': {
      const slices = state.layout.slices.map(s =>
        s.instanceId === action.instanceId ? { ...s, locked: !s.locked } : s
      );
      return { ...state, layout: { ...state.layout, slices } };
    }

    case 'SUBMIT_FOR_APPROVAL': {
      const existing = state.workflow.find(w => w.pageId === state.layout.pageId && w.status === 'DRAFT');
      const entry: WorkflowEntry = {
        entryId: v4(),
        pageId: state.layout.pageId,
        pageName: state.layout.name,
        status: 'PENDING_APPROVAL',
        authorId: state.currentUser.id,
        authorName: state.currentUser.name,
        submittedAt: new Date().toISOString(),
        comments: [],
        layout: { ...state.layout },
        version: (existing?.version ?? 0) + 1,
      };
      const workflow = state.workflow.filter(w => w.pageId !== state.layout.pageId);
      workflow.push(entry);
      return {
        ...state,
        workflow,
        isDirty: false,
        audit: [...state.audit, makeAudit(state.currentUser, 'SUBMITTED_FOR_APPROVAL', state.layout.pageId, state.layout.name)],
        toast: { id: v4(), message: '已提交審批，等候批核', type: 'success' },
      };
    }

    case 'APPROVE': {
      const wfIdx = state.workflow.findIndex(w => w.pageId === state.layout.pageId && w.status === 'PENDING_APPROVAL');
      if (wfIdx === -1) return state;
      const updated = {
        ...state.workflow[wfIdx],
        status: 'APPROVED' as WorkflowStatus,
        reviewerId: state.currentUser.id,
        reviewerName: state.currentUser.name,
        reviewedAt: new Date().toISOString(),
        comments: action.comment
          ? [...state.workflow[wfIdx].comments, { id: v4(), authorId: state.currentUser.id, authorRole: state.currentUser.role as any, text: action.comment, timestamp: new Date().toISOString() }]
          : state.workflow[wfIdx].comments,
      };
      const workflow = [...state.workflow];
      workflow[wfIdx] = updated;
      return {
        ...state,
        workflow,
        audit: [...state.audit, makeAudit(state.currentUser, 'APPROVED', state.layout.pageId, state.layout.name, action.comment)],
        toast: { id: v4(), message: '審批通過！可立即發佈', type: 'success' },
      };
    }

    case 'REJECT': {
      const wfIdx = state.workflow.findIndex(w => w.pageId === state.layout.pageId && w.status === 'PENDING_APPROVAL');
      if (wfIdx === -1) return state;
      const updated = {
        ...state.workflow[wfIdx],
        status: 'REJECTED' as WorkflowStatus,
        reviewerId: state.currentUser.id,
        reviewerName: state.currentUser.name,
        reviewedAt: new Date().toISOString(),
        comments: [...state.workflow[wfIdx].comments, { id: v4(), authorId: state.currentUser.id, authorRole: state.currentUser.role as any, text: action.comment, timestamp: new Date().toISOString() }],
      };
      const workflow = [...state.workflow];
      workflow[wfIdx] = updated;
      return {
        ...state,
        workflow,
        isDirty: true,
        audit: [...state.audit, makeAudit(state.currentUser, 'REJECTED', state.layout.pageId, state.layout.name, action.comment)],
        toast: { id: v4(), message: '已退回修改，請查閱意見', type: 'error' },
      };
    }

    case 'PUBLISH': {
      const wfIdx = state.workflow.findIndex(w => w.pageId === state.layout.pageId && w.status === 'APPROVED');
      if (wfIdx === -1) return state;
      const updated = { ...state.workflow[wfIdx], status: 'LIVE' as WorkflowStatus };
      const workflow = [...state.workflow];
      workflow[wfIdx] = updated;
      return {
        ...state,
        workflow,
        audit: [...state.audit, makeAudit(state.currentUser, 'PUBLISHED', state.layout.pageId, state.layout.name, 'Published to production')],
        toast: { id: v4(), message: '🚀 頁面已成功發佈至生產環境！', type: 'success' },
      };
    }

    case 'TOGGLE_SIMULATOR':
      return { ...state, showSimulator: !state.showSimulator };

    case 'TOGGLE_WORKFLOW':
      return { ...state, showWorkflow: !state.showWorkflow };

    case 'SET_DRAG_OVER':
      return { ...state, dragOverIndex: action.index };

    case 'SHOW_TOAST':
      return { ...state, toast: { id: v4(), message: action.message, toastType: action.toastType } as any };

    case 'CLEAR_TOAST':
      return { ...state, toast: null };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface UCPContextValue {
  state: UCPState;
  dispatch: React.Dispatch<Action>;
}

const UCPContext = createContext<UCPContextValue | null>(null);

export function UCPProvider({ children }: { children: React.ReactNode }) {
  const initialState: UCPState = {
    currentUser: MOCK_USERS[0],
    layout: DEFAULT_PAGE_LAYOUT,
    selectedInstanceId: null,
    workflow: MOCK_WORKFLOW_ENTRIES,
    audit: MOCK_AUDIT,
    isDirty: false,
    showSimulator: false,
    showWorkflow: false,
    toast: null,
    dragOverIndex: null,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <UCPContext.Provider value={{ state, dispatch }}>
      {children}
    </UCPContext.Provider>
  );
}

export function useUCP() {
  const ctx = useContext(UCPContext);
  if (!ctx) throw new Error('useUCP must be used inside UCPProvider');
  return ctx;
}
