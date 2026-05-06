/**
 * OCDPDBSync — mounts once at app level, watches store state changes,
 * and persists to the PGlite ocdp-db IndexedDB database.
 * Runs as a React component (returns null) so it can use hooks.
 */
import { useEffect, useRef } from 'react';
import { useOCDP } from '../store/OCDPStore';
import { useOCDPDB } from '../db/OCDPDBProvider';
import { upsertMetadata, deleteMetadata, insertActivity } from '../db/ocdpDB';

function diffIds(prev: string[], next: string[]) {
  const added   = next.filter(id => !prev.includes(id));
  const removed = prev.filter(id => !next.includes(id));
  return { added, removed };
}

export function OCDPDBSync() {
  const { state } = useOCDP();
  const { db, ready } = useOCDPDB();

  const prevPageIds    = useRef<string[]>([]);
  const prevJourneyIds = useRef<string[]>([]);
  const prevAuditIds   = useRef<string[]>([]);

  // ── Sync pages ───────────────────────────────────────────────────────────────
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

  // ── Sync journeys ────────────────────────────────────────────────────────────
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

  // ── Sync audit log (new entries only) ────────────────────────────────────────
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
