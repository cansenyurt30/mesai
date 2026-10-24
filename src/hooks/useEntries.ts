import { useCallback, useEffect, useState } from 'react';
import {
  clearEntries,
  deleteEntry,
  getAllEntries,
  putEntry,
  replaceEntries,
} from '../lib/db';
import type { DayEntry } from '../types';

export type EntryMap = Record<string, DayEntry>;

function toMap(list: DayEntry[]): EntryMap {
  return Object.fromEntries(list.map((e) => [e.date, e]));
}

export function useEntries() {
  const [entries, setEntries] = useState<EntryMap>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAllEntries()
      .then((list) => {
        if (!cancelled) setEntries(toMap(list));
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Ekran anında güncellenir, IndexedDB'ye arkadan yazılır.
  const saveEntry = useCallback(async (entry: DayEntry) => {
    setEntries((prev) => ({ ...prev, [entry.date]: entry }));
    await putEntry(entry);
  }, []);

  const removeEntry = useCallback(async (date: string) => {
    setEntries((prev) => {
      const { [date]: _removed, ...rest } = prev;
      return rest;
    });
    await deleteEntry(date);
  }, []);

  const replaceAll = useCallback(async (list: DayEntry[]) => {
    setEntries(toMap(list));
    await replaceEntries(list);
  }, []);

  const clearAll = useCallback(async () => {
    setEntries({});
    await clearEntries();
  }, []);

  return { entries, loaded, saveEntry, removeEntry, replaceAll, clearAll };
}
