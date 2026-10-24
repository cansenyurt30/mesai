import { clear, createStore, del, entries, get, set, setMany } from 'idb-keyval';
import { DEFAULT_SETTINGS } from '../types';
import type { DayEntry, Settings } from '../types';

// Kayıtlar `date` anahtarıyla, ayarlar tek bir anahtarla tutulur.
const entryStore = createStore('mesai-db', 'entries');
const settingsStore = createStore('mesai-settings-db', 'settings');
const SETTINGS_KEY = 'settings';

export async function getAllEntries(): Promise<DayEntry[]> {
  const rows = await entries<string, DayEntry>(entryStore);
  return rows.map(([, value]) => value);
}

export function putEntry(entry: DayEntry): Promise<void> {
  return set(entry.date, entry, entryStore);
}

export function deleteEntry(date: string): Promise<void> {
  return del(date, entryStore);
}

export function clearEntries(): Promise<void> {
  return clear(entryStore);
}

/** Yedekten geri yüklemede mevcut kayıtların yerine geçer. */
export async function replaceEntries(list: DayEntry[]): Promise<void> {
  await clear(entryStore);
  await setMany(
    list.map((e) => [e.date, e] as [string, DayEntry]),
    entryStore,
  );
}

export async function getSettings(): Promise<Settings> {
  const saved = await get<Partial<Settings>>(SETTINGS_KEY, settingsStore);
  return { ...DEFAULT_SETTINGS, ...saved };
}

export function putSettings(settings: Settings): Promise<void> {
  return set(SETTINGS_KEY, settings, settingsStore);
}

export function clearSettings(): Promise<void> {
  return clear(settingsStore);
}

/** Kalıcı depolama izni ister; tarayıcı verileri kendiliğinden silmesin. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
