import React, { createContext, useContext, useEffect, useState } from 'react';
import type { PGlite } from '@electric-sql/pglite';
import { getDB, seedIfEmpty } from './ucpDB';
import { MOCK_CONTENT_ASSETS, MOCK_UI_COMPONENTS } from '../store/mockData';

interface DBContextValue { db: PGlite | null; ready: boolean }
const DBContext = createContext<DBContextValue>({ db: null, ready: false });

export function UCPDBProvider({ children }: { children: React.ReactNode }) {
  const [db,    setDb]    = useState<PGlite | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const instance = await getDB();
      // Seed with mock data on first run
      await seedIfEmpty(
        instance,
        MOCK_CONTENT_ASSETS as unknown as Record<string, unknown>[],
        MOCK_UI_COMPONENTS  as unknown as Record<string, unknown>[]
      );
      if (!cancelled) { setDb(instance); setReady(true); }
    })();
    return () => { cancelled = true; };
  }, []);

  return <DBContext.Provider value={{ db, ready }}>{children}</DBContext.Provider>;
}

export function useUCPDB() {
  return useContext(DBContext);
}
