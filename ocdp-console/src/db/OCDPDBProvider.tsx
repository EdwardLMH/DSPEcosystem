import React, { createContext, useContext, useEffect, useState } from 'react';
import type { PGlite } from '@electric-sql/pglite';
import { getDB, seedIfEmpty, seedConfigParamsIfEmpty } from './ocdpDB';
import {
  ALL_PAGES, MOCK_JOURNEYS,
  MARKETS, BIZ_LINES, AD_GROUPS, APPROVAL_FLOWS,
  CUSTOMER_SEGMENT_DEFS, ACCOUNT_TYPE_DEFS, LOCATION_DEFS,
} from '../store/mockData';

interface DBContextValue { db: PGlite | null; ready: boolean }
const DBContext = createContext<DBContextValue>({ db: null, ready: false });

export function OCDPDBProvider({ children }: { children: React.ReactNode }) {
  const [db,    setDb]    = useState<PGlite | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const instance = await getDB();

      // Seed pages + journeys (existing behaviour)
      await seedIfEmpty(
        instance,
        ALL_PAGES     as unknown as Record<string, unknown>[],
        MOCK_JOURNEYS as unknown as Record<string, unknown>[]
      );

      // Seed each config param type from mock data on first run
      await seedConfigParamsIfEmpty(instance, 'MARKET',
        MARKETS.map(m => ({ id: m.marketId, payload: m as unknown as Record<string, unknown> })));

      await seedConfigParamsIfEmpty(instance, 'BIZ_LINE',
        BIZ_LINES.map(b => ({ id: b.bizLineId, payload: b as unknown as Record<string, unknown> })));

      await seedConfigParamsIfEmpty(instance, 'AD_GROUP',
        AD_GROUPS.map(g => ({ id: g.groupId, payload: g as unknown as Record<string, unknown> })));

      await seedConfigParamsIfEmpty(instance, 'APPROVAL_FLOW',
        APPROVAL_FLOWS.map(f => ({ id: f.flowId, payload: f as unknown as Record<string, unknown> })));

      await seedConfigParamsIfEmpty(instance, 'CUSTOMER_SEGMENT',
        CUSTOMER_SEGMENT_DEFS.map(d => ({ id: d.segmentId, payload: d as unknown as Record<string, unknown> })));

      await seedConfigParamsIfEmpty(instance, 'ACCOUNT_TYPE',
        ACCOUNT_TYPE_DEFS.map(d => ({ id: d.typeId, payload: d as unknown as Record<string, unknown> })));

      await seedConfigParamsIfEmpty(instance, 'LOCATION',
        LOCATION_DEFS.map(d => ({ id: d.locationId, payload: d as unknown as Record<string, unknown> })));

      if (!cancelled) { setDb(instance); setReady(true); }
    })();
    return () => { cancelled = true; };
  }, []);

  return <DBContext.Provider value={{ db, ready }}>{children}</DBContext.Provider>;
}

export function useOCDPDB() {
  return useContext(DBContext);
}
