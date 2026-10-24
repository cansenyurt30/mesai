import { format } from 'date-fns';
import { MAX_HOURS } from './config';
import { isLeaveType } from './leave';
import { isPaletteId } from './palettes';
import { shareOrDownload } from './shareFile';
import type { SaveResult } from './shareFile';
import { DEFAULT_SETTINGS } from '../types';
import type { DayEntry, Settings, ThemeMode } from '../types';

/**
 * Yedeğe giren ayarlar. Yedek hatırlatıcısı alanları (lastBackupAt vb.) bilerek dışarıda.
 * Yıllık izin alanları sonradan eklendi: eski yedekte yoksa geri yüklemede mevcut değerler korunur.
 */
export type BackupSettings = Pick<Settings, 'hourlyRate' | 'theme' | 'sound' | 'palette'> &
  Partial<Pick<Settings, 'annualLeaveDays' | 'hireDate' | 'leaveCarryOver'>>;

export type Backup = {
  app: 'mesai';
  version: 1;
  exportedAt: string;
  entries: DayEntry[];
  settings: BackupSettings;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const THEMES: ThemeMode[] = ['light', 'dark', 'system'];

export function createBackup(entries: DayEntry[], settings: Settings): Backup {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const { hourlyRate, theme, sound, palette, annualLeaveDays, hireDate, leaveCarryOver } = settings;
  return {
    app: 'mesai',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: sorted,
    settings: {
      hourlyRate,
      theme,
      sound,
      palette,
      annualLeaveDays,
      leaveCarryOver,
      ...(hireDate ? { hireDate } : {}),
    },
  };
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Gün sayısı ayarı: 0–366 arası tam sayı. */
const isDayCount = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 366;

function parseEntry(raw: unknown): DayEntry {
  if (!isObject(raw)) throw new Error('Geçersiz kayıt');
  const { date, type, hours, note, leaveType } = raw;

  if (typeof date !== 'string' || !DATE_RE.test(date)) throw new Error('Geçersiz tarih');

  if (type === 'izin') {
    // Türü olmayan (eski) izin kayıtları 'genel' sayılır; 'genel' için alan yazılmaz.
    return isLeaveType(leaveType) && leaveType !== 'genel'
      ? { date, type, leaveType }
      : { date, type };
  }

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
  const settings: BackupSettings = {
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
  // Yıllık izin ayarları: yalnızca yedekte geçerli olarak varsa alınır (yoksa mevcutlar korunur).
  if (isDayCount(raw.annualLeaveDays)) settings.annualLeaveDays = raw.annualLeaveDays;
  if (isDayCount(raw.leaveCarryOver)) settings.leaveCarryOver = raw.leaveCarryOver;
  if (typeof raw.hireDate === 'string' && DATE_RE.test(raw.hireDate)) {
    settings.hireDate = raw.hireDate;
  }

  return {
    app: 'mesai',
    version: 1,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '',
    entries: [...byDate.values()],
    settings,
  };
}

export type { SaveResult } from './shareFile';

/** Yedeği `.json` dosyası olarak kaydeder (iPhone'da paylaşım menüsüyle, masaüstünde indirerek). */
export function saveBackupFile(backup: Backup): Promise<SaveResult> {
  const json = JSON.stringify(backup, null, 2);
  const fileName = `mesai-yedek-${format(new Date(), 'yyyy-MM-dd')}.json`;
  const file = new File([json], fileName, { type: 'application/json' });
  return shareOrDownload(file, 'Mesai yedeği');
}
