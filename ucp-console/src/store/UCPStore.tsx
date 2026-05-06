import React, { createContext, useContext, useReducer } from 'react';
import type {
  AuditEntry, StaffUser, NavView, AdGroup, BizLine,
  ContentAsset, UIComponent, ContentApprovalFlow,
} from '../types/ucp';
import {
  MOCK_AUDIT, MOCK_USERS, AD_GROUPS, BIZ_LINES,
  MOCK_CONTENT_ASSETS, MOCK_UI_COMPONENTS, CONTENT_APPROVAL_FLOWS,
  MOCK_PAGES_REFERENCING_ASSETS,
} from './mockData';
import { v4 } from '../utils/uuid';

// ─── State ────────────────────────────────────────────────────────────────────

export interface UCPState {
  currentUser:    StaffUser;
  navView:        NavView;

  adGroups:       AdGroup[];
  bizLines:       BizLine[];
  approvalFlows:  ContentApprovalFlow[];
  pageRefs:       Record<string, { pageId: string; pageName: string }[]>;

  contentAssets:  ContentAsset[];
  uiComponents:   UIComponent[];

  audit:          AuditEntry[];
  toast: { id: string; message: string; type: 'success' | 'error' | 'info' } | null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_USER';              user: StaffUser }
  | { type: 'SET_NAV_VIEW';          view: NavView }
  | { type: 'SHOW_TOAST';            message: string; toastType: 'success' | 'error' | 'info' }
  | { type: 'CLEAR_TOAST' }
  | { type: 'ADD_AD_GROUP';          group: AdGroup }
  | { type: 'EDIT_AD_GROUP';         groupId: string; updates: Partial<AdGroup> }
  | { type: 'DELETE_AD_GROUP';       groupId: string }
  | { type: 'ADD_BIZ_LINE';          bizLine: BizLine }
  | { type: 'EDIT_BIZ_LINE';         bizLineId: string; updates: Partial<BizLine> }
  | { type: 'DELETE_BIZ_LINE';       bizLineId: string }
  // Content asset CRUD
  | { type: 'ADD_ASSET';             asset: ContentAsset }
  | { type: 'UPDATE_ASSET';          assetId: string; updates: Partial<ContentAsset> }
  | { type: 'DELETE_ASSET';          assetId: string }
  | { type: 'ARCHIVE_ASSET';         assetId: string }
  | { type: 'RESTORE_ASSET';         assetId: string }
  // Content approval workflow
  | { type: 'SUBMIT_ASSET_APPROVAL'; assetId: string; approvalGroupId: string }
  | { type: 'APPROVE_ASSET';         assetId: string; comment?: string }
  | { type: 'REJECT_ASSET';          assetId: string; comment: string }
  // UI component CRUD (status toggle)
  | { type: 'DEPRECATE_COMPONENT';   componentId: string }
  | { type: 'RESTORE_COMPONENT';     componentId: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAudit(user: StaffUser, action: string, pageId: string, pageName: string, details?: string): AuditEntry {
  return { id: v4(), timestamp: new Date().toISOString(), actorId: user.id, actorRole: user.role, action, pageId, pageName, details, bizLineId: user.bizLineId };
}

function assetName(state: UCPState, assetId: string) {
  return state.contentAssets.find(a => a.assetId === assetId)?.name ?? assetId;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: UCPState, action: Action): UCPState {
  switch (action.type) {
    case 'SET_USER':     return { ...state, currentUser: action.user };
    case 'SET_NAV_VIEW': return { ...state, navView: action.view };
    case 'SHOW_TOAST':   return { ...state, toast: { id: v4(), message: action.message, type: action.toastType } };
    case 'CLEAR_TOAST':  return { ...state, toast: null };

    case 'ADD_AD_GROUP':    return { ...state, adGroups: [...state.adGroups, action.group] };
    case 'EDIT_AD_GROUP':   return { ...state, adGroups: state.adGroups.map(g => g.groupId === action.groupId ? { ...g, ...action.updates } : g) };
    case 'DELETE_AD_GROUP': return { ...state, adGroups: state.adGroups.filter(g => g.groupId !== action.groupId) };

    case 'ADD_BIZ_LINE':    return { ...state, bizLines: [...state.bizLines, action.bizLine] };
    case 'EDIT_BIZ_LINE':   return { ...state, bizLines: state.bizLines.map(b => b.bizLineId === action.bizLineId ? { ...b, ...action.updates } : b) };
    case 'DELETE_BIZ_LINE': return { ...state, bizLines: state.bizLines.filter(b => b.bizLineId !== action.bizLineId) };

    case 'ADD_ASSET':
      return {
        ...state,
        contentAssets: [action.asset, ...state.contentAssets],
        audit: [...state.audit, makeAudit(state.currentUser, 'ASSET_CREATED', action.asset.assetId, action.asset.name)],
      };

    case 'UPDATE_ASSET':
      return {
        ...state,
        contentAssets: state.contentAssets.map(a => a.assetId === action.assetId ? { ...a, ...action.updates } : a),
        audit: [...state.audit, makeAudit(state.currentUser, 'ASSET_UPDATED', action.assetId, assetName(state, action.assetId))],
      };

    case 'DELETE_ASSET':
      return {
        ...state,
        contentAssets: state.contentAssets.filter(a => a.assetId !== action.assetId),
        audit: [...state.audit, makeAudit(state.currentUser, 'ASSET_DELETED', action.assetId, assetName(state, action.assetId))],
      };

    case 'ARCHIVE_ASSET':
      return {
        ...state,
        contentAssets: state.contentAssets.map(a => a.assetId === action.assetId ? { ...a, status: 'ARCHIVED' as const } : a),
        audit: [...state.audit, makeAudit(state.currentUser, 'ASSET_ARCHIVED', action.assetId, assetName(state, action.assetId))],
      };

    case 'RESTORE_ASSET':
      return {
        ...state,
        contentAssets: state.contentAssets.map(a => a.assetId === action.assetId ? { ...a, status: 'ACTIVE' as const } : a),
        audit: [...state.audit, makeAudit(state.currentUser, 'ASSET_RESTORED', action.assetId, assetName(state, action.assetId))],
      };

    case 'SUBMIT_ASSET_APPROVAL':
      return {
        ...state,
        contentAssets: state.contentAssets.map(a => a.assetId === action.assetId ? {
          ...a, approvalStatus: 'PENDING_APPROVAL' as const,
          approvalGroupId: action.approvalGroupId,
          approvalSubmittedAt: new Date().toISOString(),
          approvalReviewedAt: undefined, approvalReviewerId: undefined, approvalReviewerName: undefined, approvalComment: undefined,
        } : a),
        audit: [...state.audit, makeAudit(state.currentUser, 'ASSET_SUBMITTED_FOR_APPROVAL', action.assetId, assetName(state, action.assetId))],
      };

    case 'APPROVE_ASSET':
      return {
        ...state,
        contentAssets: state.contentAssets.map(a => a.assetId === action.assetId ? {
          ...a, approvalStatus: 'APPROVED' as const,
          approvalReviewedAt: new Date().toISOString(),
          approvalReviewerId: state.currentUser.id,
          approvalReviewerName: state.currentUser.name,
          approvalComment: action.comment,
        } : a),
        audit: [...state.audit, makeAudit(state.currentUser, 'ASSET_APPROVED', action.assetId, assetName(state, action.assetId), action.comment)],
      };

    case 'REJECT_ASSET':
      return {
        ...state,
        contentAssets: state.contentAssets.map(a => a.assetId === action.assetId ? {
          ...a, approvalStatus: 'REJECTED' as const,
          approvalReviewedAt: new Date().toISOString(),
          approvalReviewerId: state.currentUser.id,
          approvalReviewerName: state.currentUser.name,
          approvalComment: action.comment,
        } : a),
        audit: [...state.audit, makeAudit(state.currentUser, 'ASSET_REJECTED', action.assetId, assetName(state, action.assetId), action.comment)],
      };

    case 'DEPRECATE_COMPONENT':
      return {
        ...state,
        uiComponents: state.uiComponents.map(c => c.componentId === action.componentId ? { ...c, status: 'DEPRECATED' as const } : c),
        audit: [...state.audit, makeAudit(state.currentUser, 'COMPONENT_DEPRECATED', action.componentId, state.uiComponents.find(c => c.componentId === action.componentId)?.label ?? action.componentId)],
      };

    case 'RESTORE_COMPONENT':
      return {
        ...state,
        uiComponents: state.uiComponents.map(c => c.componentId === action.componentId ? { ...c, status: 'ACTIVE' as const } : c),
        audit: [...state.audit, makeAudit(state.currentUser, 'COMPONENT_RESTORED', action.componentId, state.uiComponents.find(c => c.componentId === action.componentId)?.label ?? action.componentId)],
      };

    default: return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface UCPContextValue { state: UCPState; dispatch: React.Dispatch<Action> }
const UCPContext = createContext<UCPContextValue | null>(null);

export function UCPProvider({ children }: { children: React.ReactNode }) {
  const initialState: UCPState = {
    currentUser:   MOCK_USERS[0],
    navView:       'content',
    adGroups:      AD_GROUPS,
    bizLines:      BIZ_LINES,
    approvalFlows: CONTENT_APPROVAL_FLOWS,
    pageRefs:      MOCK_PAGES_REFERENCING_ASSETS,
    contentAssets: MOCK_CONTENT_ASSETS,
    uiComponents:  MOCK_UI_COMPONENTS,
    audit:         MOCK_AUDIT,
    toast:         null,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  return <UCPContext.Provider value={{ state, dispatch }}>{children}</UCPContext.Provider>;
}

export function useUCP() {
  const ctx = useContext(UCPContext);
  if (!ctx) throw new Error('useUCP must be used inside UCPProvider');
  return ctx;
}
