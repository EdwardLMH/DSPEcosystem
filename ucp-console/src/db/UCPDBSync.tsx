/**
 * UCPDBSync — mounts once at app level, watches store state changes,
 * and persists to the PGlite ucp-db IndexedDB database.
 * Runs as a React component (returns null) so it can use hooks.
 */
import { useEffect, useRef } from 'react';
import { useUCP } from '../store/UCPStore';
import { useUCPDB } from './UCPDBProvider';
import { upsertMetadata, deleteMetadata, insertActivity } from './ucpDB';
import { v4 } from '../utils/uuid';

// tiny helper so we can detect which items were added/removed
function diffIds(prev: string[], next: string[]) {
  const added   = next.filter(id => !prev.includes(id));
  const removed = prev.filter(id => !next.includes(id));
  return { added, removed };
}

export function UCPDBSync() {
  const { state } = useUCP();
  const { db, ready } = useUCPDB();

  // track previous arrays by id so we can detect mutations
  const prevAssetIds    = useRef<string[]>([]);
  const prevCompIds     = useRef<string[]>([]);
  const prevAuditIds    = useRef<string[]>([]);

  // ── Sync content assets ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!db || !ready) return;
    const assets  = state.contentAssets ?? [];
    const ids     = assets.map(a => a.assetId);
    const { added, removed } = diffIds(prevAssetIds.current, ids);

    for (const id of removed) {
      deleteMetadata(db, id).catch(console.error);
    }
    for (const id of added) {
      const a = assets.find(x => x.assetId === id)!;
      upsertMetadata(db, {
        id: a.assetId, kind: 'CONTENT_ASSET', name: a.name,
        biz_line_id: a.bizLineId, group_id: a.marketId ?? 'GLOBAL',
        status: a.status, payload: a as unknown as Record<string, unknown>,
      }).catch(console.error);
    }
    // upsert every asset on status/name change
    for (const a of assets) {
      upsertMetadata(db, {
        id: a.assetId, kind: 'CONTENT_ASSET', name: a.name,
        biz_line_id: a.bizLineId, group_id: a.marketId ?? 'GLOBAL',
        status: a.status, payload: a as unknown as Record<string, unknown>,
      }).catch(console.error);
    }
    prevAssetIds.current = ids;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, ready, state.contentAssets]);

  // ── Sync UI components ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!db || !ready) return;
    const comps = state.uiComponents ?? [];
    const ids   = comps.map(c => c.componentId);
    const { removed } = diffIds(prevCompIds.current, ids);

    for (const id of removed) {
      deleteMetadata(db, id).catch(console.error);
    }
    for (const c of comps) {
      upsertMetadata(db, {
        id: c.componentId, kind: 'UI_COMPONENT', name: c.label,
        biz_line_id: 'WEB_ENABLER', group_id: 'GLOBAL',
        status: c.status, payload: c as unknown as Record<string, unknown>,
      }).catch(console.error);
    }
    prevCompIds.current = ids;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, ready, state.uiComponents]);

  // ── Sync audit log (new entries only) ──────────────────────────────────────
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
        entity_kind: 'CONTENT_ASSET',
        entity_id:   entry.pageId ?? entry.id,
        entity_name: entry.pageName ?? entry.action,
        details:     entry.details ?? null,
      }).catch(console.error);
    }
    prevAuditIds.current = ids;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, ready, state.audit]);

  return null;
}

// re-export v4 so the panel can generate IDs without importing uuid directly
export { v4 };
