import { PGlite } from '@electric-sql/pglite';

// ─── Singleton DB instance (IndexedDB persistence = survives page refresh) ────

let _db: PGlite | null = null;

export async function getDB(): Promise<PGlite> {
  if (_db) return _db;
  _db = new PGlite('idb://ucp-db');
  await _db.exec(SCHEMA);
  return _db;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
// Two separate tables as required:
//   1. ucp_metadata  — content assets + UI component records
//   2. ucp_activity  — audit / activity log

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS ucp_metadata (
    id           TEXT PRIMARY KEY,
    kind         TEXT NOT NULL,          -- 'CONTENT_ASSET' | 'UI_COMPONENT'
    name         TEXT NOT NULL,
    biz_line_id  TEXT NOT NULL,
    group_id     TEXT NOT NULL,
    status       TEXT NOT NULL,          -- ACTIVE | ARCHIVED | DEPRECATED
    payload      JSONB NOT NULL,         -- full object serialised
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS ucp_activity (
    id           TEXT PRIMARY KEY,
    ts           TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_id     TEXT NOT NULL,
    actor_role   TEXT NOT NULL,
    action       TEXT NOT NULL,
    entity_kind  TEXT NOT NULL,          -- 'CONTENT_ASSET' | 'UI_COMPONENT' | 'AD_GROUP'
    entity_id    TEXT NOT NULL,
    entity_name  TEXT NOT NULL,
    details      TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_ucp_metadata_kind    ON ucp_metadata(kind);
  CREATE INDEX IF NOT EXISTS idx_ucp_metadata_biz     ON ucp_metadata(biz_line_id);
  CREATE INDEX IF NOT EXISTS idx_ucp_activity_ts      ON ucp_activity(ts DESC);
  CREATE INDEX IF NOT EXISTS idx_ucp_activity_entity  ON ucp_activity(entity_id);
`;

// ─── Typed row shapes returned from queries ───────────────────────────────────

export interface MetadataRow {
  id: string;
  kind: 'CONTENT_ASSET' | 'UI_COMPONENT';
  name: string;
  biz_line_id: string;
  group_id: string;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ActivityRow {
  id: string;
  ts: string;
  actor_id: string;
  actor_role: string;
  action: string;
  entity_kind: string;
  entity_id: string;
  entity_name: string;
  details: string | null;
}

// ─── Metadata writes ──────────────────────────────────────────────────────────

export async function upsertMetadata(
  db: PGlite,
  row: Omit<MetadataRow, 'created_at' | 'updated_at'>
) {
  await db.query(
    `INSERT INTO ucp_metadata (id, kind, name, biz_line_id, group_id, status, payload, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       biz_line_id = EXCLUDED.biz_line_id,
       group_id    = EXCLUDED.group_id,
       status      = EXCLUDED.status,
       payload     = EXCLUDED.payload,
       updated_at  = now()`,
    [row.id, row.kind, row.name, row.biz_line_id, row.group_id, row.status, row.payload]
  );
}

export async function deleteMetadata(db: PGlite, id: string) {
  await db.query(`DELETE FROM ucp_metadata WHERE id = $1`, [id]);
}

// ─── Activity writes ──────────────────────────────────────────────────────────

export async function insertActivity(
  db: PGlite,
  row: Omit<ActivityRow, 'ts'>
) {
  await db.query(
    `INSERT INTO ucp_activity (id, ts, actor_id, actor_role, action, entity_kind, entity_id, entity_name, details)
     VALUES ($1, now(), $2, $3, $4, $5, $6, $7, $8)`,
    [row.id, row.actor_id, row.actor_role, row.action, row.entity_kind, row.entity_id, row.entity_name, row.details ?? null]
  );
}

// ─── Query helpers ────────────────────────────────────────────────────────────

export async function queryMetadata(
  db: PGlite,
  opts: { kind?: string; search?: string; limit?: number } = {}
): Promise<MetadataRow[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let p = 1;

  if (opts.kind) { conditions.push(`kind = $${p++}`); params.push(opts.kind); }
  if (opts.search) { conditions.push(`name ILIKE $${p++}`); params.push(`%${opts.search}%`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = opts.limit ?? 500;
  const result = await db.query<MetadataRow>(
    `SELECT * FROM ucp_metadata ${where} ORDER BY updated_at DESC LIMIT ${limit}`,
    params
  );
  return result.rows;
}

export async function queryActivity(
  db: PGlite,
  opts: { entityId?: string; entityKind?: string; search?: string; limit?: number } = {}
): Promise<ActivityRow[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let p = 1;

  if (opts.entityId)   { conditions.push(`entity_id = $${p++}`);       params.push(opts.entityId); }
  if (opts.entityKind) { conditions.push(`entity_kind = $${p++}`);     params.push(opts.entityKind); }
  if (opts.search)     { conditions.push(`(entity_name ILIKE $${p++} OR action ILIKE $${p++} OR actor_id ILIKE $${p++})`); params.push(`%${opts.search}%`, `%${opts.search}%`, `%${opts.search}%`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = opts.limit ?? 500;
  const result = await db.query<ActivityRow>(
    `SELECT * FROM ucp_activity ${where} ORDER BY ts DESC LIMIT ${limit}`,
    params
  );
  return result.rows;
}

// ─── Seed from mock data on first run ────────────────────────────────────────

export async function seedIfEmpty(
  db: PGlite,
  contentAssets: Record<string, unknown>[],
  uiComponents: Record<string, unknown>[]
) {
  const { rows } = await db.query<{ c: string }>(`SELECT COUNT(*)::text AS c FROM ucp_metadata`);
  if (parseInt(rows[0].c) > 0) return; // already seeded

  for (const a of contentAssets) {
    await upsertMetadata(db, {
      id: a.assetId as string,
      kind: 'CONTENT_ASSET',
      name: a.name as string,
      biz_line_id: a.bizLineId as string,
      group_id: (a.marketId as string) ?? 'GLOBAL',
      status: a.status as string,
      payload: a as Record<string, unknown>,
    });
  }
  for (const c of uiComponents) {
    await upsertMetadata(db, {
      id: c.componentId as string,
      kind: 'UI_COMPONENT',
      name: c.label as string,
      biz_line_id: 'WEB_ENABLER',
      group_id: 'GLOBAL',
      status: c.status as string,
      payload: c as Record<string, unknown>,
    });
  }
}
