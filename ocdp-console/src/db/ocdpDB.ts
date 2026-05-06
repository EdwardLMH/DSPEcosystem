import { PGlite } from '@electric-sql/pglite';

// ─── Singleton DB instance ────────────────────────────────────────────────────

let _db: PGlite | null = null;

export async function getDB(): Promise<PGlite> {
  if (_db) return _db;
  _db = new PGlite('idb://ocdp-db');   // separate IndexedDB from UCP
  await _db.exec(SCHEMA);
  return _db;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
// Two separate tables:
//   1. ocdp_metadata  — page + journey records
//   2. ocdp_activity  — audit / activity log

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS ocdp_metadata (
    id              TEXT PRIMARY KEY,
    kind            TEXT NOT NULL,       -- 'PAGE' | 'JOURNEY'
    name            TEXT NOT NULL,
    channel         TEXT,                -- SDUI | WEB_STANDARD | WEB_WECHAT (pages)
    biz_line_id     TEXT NOT NULL,
    market_id       TEXT NOT NULL,
    status          TEXT NOT NULL,       -- authoring / journey status
    payload         JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS ocdp_activity (
    id           TEXT PRIMARY KEY,
    ts           TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_id     TEXT NOT NULL,
    actor_role   TEXT NOT NULL,
    action       TEXT NOT NULL,
    entity_kind  TEXT NOT NULL,          -- 'PAGE' | 'JOURNEY' | 'MARKET' | 'AD_GROUP' etc.
    entity_id    TEXT NOT NULL,
    entity_name  TEXT NOT NULL,
    details      TEXT,
    market_id    TEXT,
    biz_line_id  TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_ocdp_metadata_kind    ON ocdp_metadata(kind);
  CREATE INDEX IF NOT EXISTS idx_ocdp_metadata_channel ON ocdp_metadata(channel);
  CREATE INDEX IF NOT EXISTS idx_ocdp_metadata_market  ON ocdp_metadata(market_id);
  CREATE INDEX IF NOT EXISTS idx_ocdp_activity_ts      ON ocdp_activity(ts DESC);
  CREATE INDEX IF NOT EXISTS idx_ocdp_activity_entity  ON ocdp_activity(entity_id);
`;

// ─── Typed row shapes ─────────────────────────────────────────────────────────

export interface OcdpMetadataRow {
  id: string;
  kind: 'PAGE' | 'JOURNEY';
  name: string;
  channel: string | null;
  biz_line_id: string;
  market_id: string;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OcdpActivityRow {
  id: string;
  ts: string;
  actor_id: string;
  actor_role: string;
  action: string;
  entity_kind: string;
  entity_id: string;
  entity_name: string;
  details: string | null;
  market_id: string | null;
  biz_line_id: string | null;
}

// ─── Metadata writes ──────────────────────────────────────────────────────────

export async function upsertMetadata(
  db: PGlite,
  row: Omit<OcdpMetadataRow, 'created_at' | 'updated_at'>
) {
  await db.query(
    `INSERT INTO ocdp_metadata (id, kind, name, channel, biz_line_id, market_id, status, payload, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
     ON CONFLICT (id) DO UPDATE SET
       name        = EXCLUDED.name,
       channel     = EXCLUDED.channel,
       biz_line_id = EXCLUDED.biz_line_id,
       market_id   = EXCLUDED.market_id,
       status      = EXCLUDED.status,
       payload     = EXCLUDED.payload,
       updated_at  = now()`,
    [row.id, row.kind, row.name, row.channel ?? null, row.biz_line_id, row.market_id, row.status, row.payload]
  );
}

export async function deleteMetadata(db: PGlite, id: string) {
  await db.query(`DELETE FROM ocdp_metadata WHERE id = $1`, [id]);
}

// ─── Activity writes ──────────────────────────────────────────────────────────

export async function insertActivity(
  db: PGlite,
  row: Omit<OcdpActivityRow, 'ts'>
) {
  await db.query(
    `INSERT INTO ocdp_activity (id, ts, actor_id, actor_role, action, entity_kind, entity_id, entity_name, details, market_id, biz_line_id)
     VALUES ($1, now(), $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [row.id, row.actor_id, row.actor_role, row.action, row.entity_kind, row.entity_id, row.entity_name, row.details ?? null, row.market_id ?? null, row.biz_line_id ?? null]
  );
}

// ─── Query helpers ────────────────────────────────────────────────────────────

export async function queryMetadata(
  db: PGlite,
  opts: { kind?: string; channel?: string; marketId?: string; search?: string; limit?: number } = {}
): Promise<OcdpMetadataRow[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let p = 1;

  if (opts.kind)     { conditions.push(`kind = $${p++}`);           params.push(opts.kind); }
  if (opts.channel)  { conditions.push(`channel = $${p++}`);        params.push(opts.channel); }
  if (opts.marketId) { conditions.push(`market_id = $${p++}`);      params.push(opts.marketId); }
  if (opts.search)   { conditions.push(`name ILIKE $${p++}`);       params.push(`%${opts.search}%`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = opts.limit ?? 500;
  const result = await db.query<OcdpMetadataRow>(
    `SELECT * FROM ocdp_metadata ${where} ORDER BY updated_at DESC LIMIT ${limit}`,
    params
  );
  return result.rows;
}

export async function queryActivity(
  db: PGlite,
  opts: { entityId?: string; entityKind?: string; marketId?: string; search?: string; limit?: number } = {}
): Promise<OcdpActivityRow[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let p = 1;

  if (opts.entityId)   { conditions.push(`entity_id = $${p++}`);   params.push(opts.entityId); }
  if (opts.entityKind) { conditions.push(`entity_kind = $${p++}`); params.push(opts.entityKind); }
  if (opts.marketId)   { conditions.push(`market_id = $${p++}`);   params.push(opts.marketId); }
  if (opts.search)     {
    conditions.push(`(entity_name ILIKE $${p++} OR action ILIKE $${p++} OR actor_id ILIKE $${p++})`);
    params.push(`%${opts.search}%`, `%${opts.search}%`, `%${opts.search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = opts.limit ?? 500;
  const result = await db.query<OcdpActivityRow>(
    `SELECT * FROM ocdp_activity ${where} ORDER BY ts DESC LIMIT ${limit}`,
    params
  );
  return result.rows;
}

// ─── Seed from mock data on first run ────────────────────────────────────────

export async function seedIfEmpty(
  db: PGlite,
  pages: Record<string, unknown>[],
  journeys: Record<string, unknown>[]
) {
  const { rows } = await db.query<{ c: string }>(`SELECT COUNT(*)::text AS c FROM ocdp_metadata`);
  if (parseInt(rows[0].c) > 0) return;

  for (const p of pages) {
    await upsertMetadata(db, {
      id: p.pageId as string,
      kind: 'PAGE',
      name: p.name as string,
      channel: p.channel as string,
      biz_line_id: p.bizLineId as string,
      market_id: p.marketId as string,
      status: p.authoringStatus as string,
      payload: p as Record<string, unknown>,
    });
  }
  for (const j of journeys) {
    await upsertMetadata(db, {
      id: j.journeyId as string,
      kind: 'JOURNEY',
      name: j.name as string,
      channel: 'SDUI',
      biz_line_id: j.bizLineId as string,
      market_id: j.marketId as string,
      status: j.status as string,
      payload: j as Record<string, unknown>,
    });
  }
}
