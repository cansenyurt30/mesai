import { format } from 'date-fns';
import { MAX_HOURS } from './config';
import { isPaletteId } from './palettes';
import { DEFAULT_SETTINGS } from '../types';
import type { DayEntry, Settings, ThemeMode } from '../types';

export type Backup = {
  app: 'mesai';
  version: 1;
  exportedAt: string;
  entries: DayEntry[];
  settings: Settings;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const THEMES: ThemeMode[] = ['light', 'dark', 'system'];

export function createBackup(entries: DayEntry[], settings: Settings): Backup {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return {
    app: 'mesai',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: sorted,
    settings,
  };
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function parseEntry(raw: unknown): DayEntry {
  if (!isObject(raw)) throw new Error('Geçersiz kayıt');
  const { date, type, hours, note } = raw;

  if (typeof date !== 'string' || !DATE_RE.test(date)) throw new Error('Geçersiz tarih');

  if (type === 'izin') return { date, type };

  if (type === 'mesai') {
    if (typeof hours !== 'number' || !(hours > 0) || hours > MAX_HOURS) {
      throw new Error('Geçersiz saat');
    }
    const entry: DayEntry = { date, type, hours };
    if (typeof note === 'string' && note.trim()) entry.note = note.trim();
    return entry;
  }

  throw new Error('Geçersiz kayıt türü');
}

/** Yedek dosyasının içeriğini doğrular. Geçersizse Türkçe mesajlı hata fırlatır. */
export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Dosya okunamadı. Geçerli bir yedek dosyası değil.');
  }

  if (!isObject(data) || data.app !== 'mesai' || !Array.isArray(data.entries)) {
    throw new Error('Bu dosya bir Mesai yedeği gibi görünmüyor.');
  }

  let entries: DayEntry[];
  try {
    entries = data.entries.map(parseEntry);
  } catch {
    throw new Error('Yedek dosyasındaki kayıtlar bozuk.');
  }

  // Aynı gün iki kez varsa sonuncusu geçerli olur.
  const byDate = new Map(entries.map((e) => [e.date, e]));

  const raw = isObject(data.settings) ? data.settings : {};
  const settings: Settings = {
    hourlyRate:
      typeof raw.hourlyRate === 'number' && raw.hourlyRate >= 0
        ? raw.hourlyRate
        : DEFAULT_SETTINGS.hourlyRate,
    theme: THEMES.includes(raw.theme as ThemeMode)
      ? (raw.theme as ThemeMode)
      : DEFAULT_SETTINGS.theme,
    sound: typeof raw.sound === 'boolean' ? raw.sound : DEFAULT_SETTINGS.sound,
    palette: isPaletteId(raw.palette) ? raw.palette : DEFAULT_SETTINGS.palette,
  };

  return {
    app: 'mesai',
    version: 1,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '',
    entries: [...byDate.values()],
    settings,
  };
}

export type SaveResult = 'shared' | 'downloaded' | 'cancelled';

/**
 * Yedeği `.json` dosyası olarak kaydeder. Dokunmatik cihazlarda (iPhone) paylaşım
 * menüsü açılır ("Dosyalara Kaydet"); olmazsa ya da masaüstünde doğrudan indirilir.
 */
export async function saveBackupFile(backup: Backup): Promise<SaveResult> {
  const json = JSON.stringify(backup, null, 2);
  const fileName = `mesai-yedek-${format(new Date(), 'yyyy-MM-dd')}.json`;
  const file = new File([json], fileName, { type: 'application/json' });

  if (navigator.maxTouchPoints > 0 && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Mesai yedeği' });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      // Paylaşım başarısızsa indirmeye düş.
    }
  }

  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}
