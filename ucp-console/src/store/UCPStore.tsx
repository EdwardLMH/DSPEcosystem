import React, { createContext, useContext, useReducer } from 'react';
import type {
  AuditEntry, StaffUser, NavView, AdGroup, BizLine,
  ContentAsset, UIComponent, ContentApprovalFlow, PageTemplate,
} from '../types/ucp';
import {
  MOCK_AUDIT, MOCK_USERS, AD_GROUPS, BIZ_LINES,
  MOCK_CONTENT_ASSETS, MOCK_UI_COMPONENTS, CONTENT_APPROVAL_FLOWS,
  MOCK_PAGES_REFERENCING_ASSETS, PAGE_TEMPLATES,
} from './mockData';
import { v4 } from '../utils/uuid';
import { mockTranslate } from '../utils/i18n';

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
  pageTemplates:  PageTemplate[];

  editorTemplateId: string | null;

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
  | { type: 'RESTORE_COMPONENT';     componentId: string }
  // Page template CRUD
  | { type: 'CREATE_TEMPLATE';       template: Omit<PageTemplate, 'templateId' | 'createdAt' | 'updatedAt' | 'usageCount'> }
  | { type: 'UPDATE_TEMPLATE';       templateId: string; updates: Partial<PageTemplate> }
  | { type: 'DELETE_TEMPLATE';       templateId: string }
  | { type: 'OPEN_TEMPLATE_EDITOR';  templateId: string }
  | { type: 'CLOSE_TEMPLATE_EDITOR' }
  // Multi-language: assets
  | { type: 'SET_ASSET_LOCALES';      assetId: string; locales: string[] }
  | { type: 'SET_ASSET_TRANSLATION';  assetId: string; locale: string; field: string; value: string }
  | { type: 'TRANSLATE_ASSET';        assetId: string; locale: string }
  // Multi-language: UI components
  | { type: 'SET_COMPONENT_LOCALES';     componentId: string; locales: string[] }
  | { type: 'SET_COMPONENT_TRANSLATION'; componentId: string; locale: string; field: string; value: string }
  | { type: 'TRANSLATE_COMPONENT';       componentId: string; locale: string }
  // Multi-language: page templates
  | { type: 'SET_TEMPLATE_LOCALES';     templateId: string; locales: string[] }
  | { type: 'SET_TEMPLATE_TRANSLATION'; templateId: string; locale: string; field: string; value: string }
  | { type: 'TRANSLATE_TEMPLATE';       templateId: string; locale: string };

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

    case 'CREATE_TEMPLATE': {
      const now = new Date().toISOString();
      const newTpl: PageTemplate = { ...action.template, templateId: v4(), createdAt: now, updatedAt: now, usageCount: 0 };
      return {
        ...state,
        pageTemplates: [...state.pageTemplates, newTpl],
        editorTemplateId: newTpl.templateId,
        navView: 'templates',
        toast: { id: v4(), message: `Template "${newTpl.name}" created`, type: 'success' },
      };
    }

    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        pageTemplates: state.pageTemplates.map(t =>
          t.templateId === action.templateId ? { ...t, ...action.updates, updatedAt: new Date().toISOString() } : t
        ),
      };

    case 'DELETE_TEMPLATE':
      return {
        ...state,
        pageTemplates: state.pageTemplates.filter(t => t.templateId !== action.templateId),
        editorTemplateId: state.editorTemplateId === action.templateId ? null : state.editorTemplateId,
        toast: { id: v4(), message: 'Template deleted', type: 'info' },
      };

    case 'OPEN_TEMPLATE_EDITOR':
      return { ...state, editorTemplateId: action.templateId };

    case 'CLOSE_TEMPLATE_EDITOR':
      return { ...state, editorTemplateId: null };

    // ── Multi-language: assets ────────────────────────────────────────────────
    case 'SET_ASSET_LOCALES': {
      const asset = state.contentAssets.find(a => a.assetId === action.assetId);
      if (!asset) return state;
      const primary = (asset.supportedLocales ?? ['en'])[0];
      let translations = { ...asset.translations };
      const removed = (asset.supportedLocales ?? []).filter(l => l !== primary && !action.locales.includes(l));
      for (const locale of removed) { const { [locale]: _, ...rest } = translations; translations = rest; }
      return { ...state, contentAssets: state.contentAssets.map(a => a.assetId === action.assetId ? { ...a, supportedLocales: action.locales, translations } : a) };
    }

    case 'TRANSLATE_ASSET': {
      const asset = state.contentAssets.find(a => a.assetId === action.assetId);
      if (!asset) return state;
      const existing = asset.translations?.[action.locale] ?? {};
      const translated = {
        name: existing.name || mockTranslate(asset.name, action.locale),
        ...(asset.altText ? { altText: existing.altText || mockTranslate(asset.altText, action.locale) } : {}),
      };
      return { ...state, contentAssets: state.contentAssets.map(a => a.assetId !== action.assetId ? a :
        { ...a, translations: { ...a.translations, [action.locale]: translated } }
      ) };
    }

    case 'SET_ASSET_TRANSLATION':
      return {
        ...state,
        contentAssets: state.contentAssets.map(a =>
          a.assetId !== action.assetId ? a :
          { ...a, translations: { ...a.translations, [action.locale]: { ...(a.translations[action.locale] ?? {}), [action.field]: action.value } } }
        ),
      };

    // ── Multi-language: UI components ────────────────────────────────────────
    case 'SET_COMPONENT_LOCALES': {
      const comp = state.uiComponents.find(c => c.componentId === action.componentId);
      if (!comp) return state;
      const primary = (comp.supportedLocales ?? ['en'])[0];
      let translations = { ...comp.translations };
      const removed = (comp.supportedLocales ?? []).filter(l => l !== primary && !action.locales.includes(l));
      for (const locale of removed) { const { [locale]: _, ...rest } = translations; translations = rest; }
      return { ...state, uiComponents: state.uiComponents.map(c => c.componentId === action.componentId ? { ...c, supportedLocales: action.locales, translations } : c) };
    }

    case 'TRANSLATE_COMPONENT': {
      const comp = state.uiComponents.find(c => c.componentId === action.componentId);
      if (!comp) return state;
      const existing = comp.translations?.[action.locale] ?? {};
      const translated = {
        label: existing.label || mockTranslate(comp.label, action.locale),
        description: existing.description || mockTranslate(comp.description, action.locale),
      };
      return { ...state, uiComponents: state.uiComponents.map(c => c.componentId !== action.componentId ? c :
        { ...c, translations: { ...c.translations, [action.locale]: translated } }
      ) };
    }

    case 'SET_COMPONENT_TRANSLATION':
      return {
        ...state,
        uiComponents: state.uiComponents.map(c =>
          c.componentId !== action.componentId ? c :
          { ...c, translations: { ...c.translations, [action.locale]: { ...(c.translations[action.locale] ?? {}), [action.field]: action.value } } }
        ),
      };

    // ── Multi-language: page templates ───────────────────────────────────────
    case 'SET_TEMPLATE_LOCALES': {
      const tmpl = state.pageTemplates.find(t => t.templateId === action.templateId);
      if (!tmpl) return state;
      const primary = (tmpl.supportedLocales ?? ['en'])[0];
      let translations = { ...tmpl.translations };
      const removed = (tmpl.supportedLocales ?? []).filter(l => l !== primary && !action.locales.includes(l));
      for (const locale of removed) { const { [locale]: _, ...rest } = translations; translations = rest; }
      return { ...state, pageTemplates: state.pageTemplates.map(t => t.templateId === action.templateId ? { ...t, supportedLocales: action.locales, translations } : t) };
    }

    case 'TRANSLATE_TEMPLATE': {
      const tmpl = state.pageTemplates.find(t => t.templateId === action.templateId);
      if (!tmpl) return state;
      const existing = tmpl.translations?.[action.locale] ?? {};
      const translated = {
        name: existing.name || mockTranslate(tmpl.name, action.locale),
        description: existing.description || mockTranslate(tmpl.description, action.locale),
      };
      return { ...state, pageTemplates: state.pageTemplates.map(t => t.templateId !== action.templateId ? t :
        { ...t, translations: { ...t.translations, [action.locale]: translated } }
      ) };
    }

    case 'SET_TEMPLATE_TRANSLATION':
      return {
        ...state,
        pageTemplates: state.pageTemplates.map(t =>
          t.templateId !== action.templateId ? t :
          { ...t, translations: { ...t.translations, [action.locale]: { ...(t.translations[action.locale] ?? {}), [action.field]: action.value } } }
        ),
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
    pageTemplates: PAGE_TEMPLATES,
    editorTemplateId: null,
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
