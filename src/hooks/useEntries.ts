import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearEntries,
  deleteEntry,
  getAllEntries,
  putEntry,
  replaceEntries,
} from '../lib/db';
import type { DayEntry } from '../types';

export type EntryMap = Record<string, DayEntry>;

const SAVE_ERROR = 'Kaydedilemedi, tekrar dene';
const LOAD_ERROR = 'Kayıtlar okunamadı';

function toMap(list: DayEntry[]): EntryMap {
  return Object.fromEntries(list.map((e) => [e.date, e]));
}

/**
 * Kayıtları okur ve yazar. Ekran anında güncellenir, IndexedDB'ye arkadan yazılır;
 * yazım başarısız olursa ekran eski haline döner ve `onError` ile kısa bir uyarı verilir.
 */
export function useEntries(onError?: (message: string) => void) {
  const [entries, setEntriesState] = useState<EntryMap>({});
  const [loaded, setLoaded] = useState(false);
  // Geri alma için güncel haritayı senkron okumak gerekir.
  const latest = useRef<EntryMap>({});
  const notify = useRef(onError);
  notify.current = onError;

  const setEntries = useCallback((next: EntryMap) => {
    latest.current = next;
    setEntriesState(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAllEntries()
      .then((list) => {
        if (!cancelled) setEntries(toMap(list));
      })
      .catch(() => notify.current?.(LOAD_ERROR))
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [setEntries]);

  const saveEntry = useCallback(
    async (entry: DayEntry) => {
      const previous = latest.current[entry.date];
      setEntries({ ...latest.current, [entry.date]: entry });
      try {
        await putEntry(entry);
      } catch {
        const reverted = { ...latest.current };
        if (previous) reverted[entry.date] = previous;
        else delete reverted[entry.date];
        setEntries(reverted);
        notify.current?.(SAVE_ERROR);
      }
    },
    [setEntries],
  );

  const removeEntry = useCallback(
    async (date: string) => {
      const previous = latest.current[date];
      const { [date]: _removed, ...rest } = latest.current;
      setEntries(rest);
      try {
        await deleteEntry(date);
      } catch {
        if (previous) setEntries({ ...latest.current, [date]: previous });
        notify.current?.(SAVE_ERROR);
      }
    },
    [setEntries],
  );

  // Toplu işlemlerde hata çağırana da iletilir (Ayarlar paneli kendi mesajını gösterir).
  const replaceAll = useCallback(
    async (list: DayEntry[]) => {
      const previous = latest.current;
      setEntries(toMap(list));
      try {
        await replaceEntries(list);
      } catch (err) {
        setEntries(previous);
        throw err;
      }
    },
    [setEntries],
  );

  const clearAll = useCallback(async () => {
    const previous = latest.current;
    setEntries({});
    try {
      await clearEntries();
    } catch (err) {
      setEntries(previous);
      throw err;
    }
  }, [setEntries]);

  return { entries, loaded, saveEntry, removeEntry, replaceAll, clearAll };
}
