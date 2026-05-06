import React, { createContext, useContext, useEffect, useState } from 'react';
import type { PGlite } from '@electric-sql/pglite';
import { getDB, seedIfEmpty } from './ocdpDB';
import { ALL_PAGES, MOCK_JOURNEYS } from '../store/mockData';

interface DBContextValue { db: PGlite | null; ready: boolean }
const DBContext = createContext<DBContextValue>({ db: null, ready: false });

export function OCDPDBProvider({ children }: { children: React.ReactNode }) {
  const [db,    setDb]    = useState<PGlite | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const instance = await getDB();
      await seedIfEmpty(
        instance,
        ALL_PAGES     as unknown as Record<string, unknown>[],
        MOCK_JOURNEYS as unknown as Record<string, unknown>[]
      );
      if (!cancelled) { setDb(instance); setReady(true); }
    })();
    return () => { cancelled = true; };
  }, []);

  return <DBContext.Provider value={{ db, ready }}>{children}</DBContext.Provider>;
}

export function useOCDPDB() {
  return useContext(DBContext);
}
