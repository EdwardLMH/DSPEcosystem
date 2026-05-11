/**
 * OCDPDBSync — mounts once at app level, watches store state changes,
 * and persists to the PGlite ocdp-db IndexedDB database.
 * Runs as a React component (returns null) so it can use hooks.
 *
 * Config params (markets, bizLines, adGroups, approvalFlows, rule param defs)
 * are loaded from ocdp_config_params on mount and written back on every change.
 * Pages, journeys, and the audit log are synced as before.
 */
import { useEffect, useRef } from 'react';
import { useOCDP } from '../store/OCDPStore';
import { useOCDPDB } from '../db/OCDPDBProvider';
import {
  upsertMetadata, deleteMetadata, insertActivity,
  upsertConfigParam, deleteConfigParam, loadConfigParams,
} from '../db/ocdpDB';
import type {
  Market, BizLine, AdGroup, ApprovalFlow,
  CustomerSegmentDef, AccountTypeDef, LocationDef,
  AISearchConfig,
} from '../types/ocdp';

function diffIds(prev: string[], next: string[]) {
  const added   = next.filter(id => !prev.includes(id));
  const removed = prev.filter(id => !next.includes(id));
  return { added, removed };
}

export function OCDPDBSync() {
  const { state, dispatch } = useOCDP();
  const { db, ready } = useOCDPDB();

  const prevPageIds    = useRef<string[]>([]);
  const prevJourneyIds = useRef<string[]>([]);
  const prevAuditIds   = useRef<string[]>([]);

  // Track previous entity_ids for each config type to detect deletes
  const prevMarketIds   = useRef<string[]>([]);
  const prevBizLineIds  = useRef<string[]>([]);
  const prevGroupIds    = useRef<string[]>([]);
  const prevFlowIds     = useRef<string[]>([]);
  const prevSegmentIds  = useRef<string[]>([]);
  const prevAccountIds  = useRef<string[]>([]);
  const prevLocationIds = useRef<string[]>([]);
  const prevAISearchIds = useRef<string[]>([]);

  // ── Load all config params from DB on first ready ─────────────────────────
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!db || !ready || loadedRef.current) return;
    loadedRef.current = true;

    (async () => {
      const [
        marketRows, bizRows, groupRows, flowRows,
        segRows, accRows, locRows, aiSearchRows,
      ] = await Promise.all([
        loadConfigParams(db, 'MARKET'),
        loadConfigParams(db, 'BIZ_LINE'),
        loadConfigParams(db, 'AD_GROUP'),
        loadConfigParams(db, 'APPROVAL_FLOW'),
        loadConfigParams(db, 'CUSTOMER_SEGMENT'),
        loadConfigParams(db, 'ACCOUNT_TYPE'),
        loadConfigParams(db, 'LOCATION'),
        loadConfigParams(db, 'AI_SEARCH_CONFIG'),
      ]);

      dispatch({
        type: 'LOAD_CONFIG_FROM_DB',
        markets:             marketRows.map(r => r.payload as unknown as Market),
        bizLines:            bizRows.map(r => r.payload as unknown as BizLine),
        adGroups:            groupRows.map(r => r.payload as unknown as AdGroup),
        approvalFlows:       flowRows.map(r => r.payload as unknown as ApprovalFlow),
        customerSegmentDefs: segRows.map(r => r.payload as unknown as CustomerSegmentDef),
        accountTypeDefs:     accRows.map(r => r.payload as unknown as AccountTypeDef),
        locationDefs:        locRows.map(r => r.payload as unknown as LocationDef),
        aiSearchConfigs:     aiSearchRows.map(r => r.payload as unknown as AISearchConfig),
      });

      // Prime the prev-id refs so the first write-back effects don't re-persist everything
      prevMarketIds.current   = marketRows.map(r => r.entity_id);
      prevBizLineIds.current  = bizRows.map(r => r.entity_id);
      prevGroupIds.current    = groupRows.map(r => r.entity_id);
      prevFlowIds.current     = flowRows.map(r => r.entity_id);
      prevSegmentIds.current  = segRows.map(r => r.entity_id);
      prevAccountIds.current  = accRows.map(r => r.entity_id);
      prevLocationIds.current = locRows.map(r => r.entity_id);
      prevAISearchIds.current = aiSearchRows.map(r => r.entity_id);
    })().catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, ready]);

  // ── Generic config sync helper ────────────────────────────────────────────
  // Upserts every item and deletes removed ones.
  function useSyncConfig<T extends object>(
    items: T[],
    getId: (item: T) => string,
    paramType: Parameters<typeof upsertConfigParam>[1],
    prevRef: React.MutableRefObject<string[]>
  ) {
    useEffect(() => {
      if (!db || !ready) return;
      const ids = items.map(getId);
      const { removed } = diffIds(prevRef.current, ids);

      for (const id of removed) {
        deleteConfigParam(db, paramType, id).catch(console.error);
      }
      for (const item of items) {
        upsertConfigParam(db, paramType, getId(item), item as unknown as Record<string, unknown>).catch(console.error);
      }
      prevRef.current = ids;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db, ready, items]);
  }

  useSyncConfig(state.markets,             m => m.marketId,   'MARKET',            prevMarketIds);
  useSyncConfig(state.bizLines,            b => b.bizLineId,  'BIZ_LINE',          prevBizLineIds);
  useSyncConfig(state.adGroups,            g => g.groupId,    'AD_GROUP',          prevGroupIds);
  useSyncConfig(state.approvalFlows,       f => f.flowId,     'APPROVAL_FLOW',     prevFlowIds);
  useSyncConfig(state.customerSegmentDefs, d => d.segmentId,  'CUSTOMER_SEGMENT',  prevSegmentIds);
  useSyncConfig(state.accountTypeDefs,     d => d.typeId,     'ACCOUNT_TYPE',      prevAccountIds);
  useSyncConfig(state.locationDefs,        d => d.locationId, 'LOCATION',          prevLocationIds);
  useSyncConfig(state.aiSearchConfigs,     c => c.configId,   'AI_SEARCH_CONFIG',  prevAISearchIds);

  // ── Sync pages ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!db || !ready) return;
    const pages = state.pages ?? [];
    const ids   = pages.map(p => p.pageId);
    const { removed } = diffIds(prevPageIds.current, ids);

    for (const id of removed) {
      deleteMetadata(db, id).catch(console.error);
    }
    for (const p of pages) {
      upsertMetadata(db, {
        id: p.pageId,
        kind: 'PAGE',
        name: p.name,
        channel: p.channel ?? null,
        biz_line_id: p.bizLineId,
        market_id: p.marketId ?? 'GLOBAL',
        status: p.authoringStatus,
        payload: p as unknown as Record<string, unknown>,
      }).catch(console.error);
    }
    prevPageIds.current = ids;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, ready, state.pages]);

  // ── Sync journeys ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!db || !ready) return;
    const journeys = state.journeys ?? [];
    const ids      = journeys.map(j => j.journeyId);
    const { removed } = diffIds(prevJourneyIds.current, ids);

    for (const id of removed) {
      deleteMetadata(db, id).catch(console.error);
    }
    for (const j of journeys) {
      upsertMetadata(db, {
        id: j.journeyId,
        kind: 'JOURNEY',
        name: j.name,
        channel: 'SDUI',
        biz_line_id: j.bizLineId,
        market_id: j.marketId ?? 'GLOBAL',
        status: j.status,
        payload: j as unknown as Record<string, unknown>,
      }).catch(console.error);
    }
    prevJourneyIds.current = ids;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, ready, state.journeys]);

  // ── Sync audit log (new entries only) ────────────────────────────────────
  useEffect(() => {
    if (!db || !ready) return;
    const audit = state.audit ?? [];
    const ids   = audit.map(a => a.id);
    const { added } = diffIds(prevAuditIds.current, ids);

    for (const id of added) {
      const entry = audit.find(a => a.id === id)!;
      insertActivity(db, {
        id: entry.id,
        actor_id:    entry.actorId,
        actor_role:  entry.actorRole,
        action:      entry.action,
        entity_kind: entry.pageId?.startsWith('journey-') ? 'JOURNEY' : 'PAGE',
        entity_id:   entry.pageId ?? entry.id,
        entity_name: entry.pageName ?? entry.action,
        details:     entry.details ?? null,
        market_id:   entry.marketId ?? null,
        biz_line_id: entry.bizLineId ?? null,
      }).catch(console.error);
    }
    prevAuditIds.current = ids;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, ready, state.audit]);

  return null;
}
