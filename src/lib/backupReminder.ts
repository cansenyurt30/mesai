import { addDays, differenceInDays } from 'date-fns';
import {
  BACKUP_FIRST_REMIND_DAYS,
  BACKUP_REMIND_DAYS,
  BACKUP_SNOOZE_DAYS,
} from './config';
import type { Settings } from '../types';

type ReminderInput = Pick<
  Settings,
  'lastBackupAt' | 'backupSnoozeUntil' | 'firstSavedAt'
>;

const daysSince = (iso: string, now: Date) => differenceInDays(now, new Date(iso));

/**
 * Hatırlatma kartında gösterilecek yazı; kart gösterilmeyecekse null.
 *  - Son yedek BACKUP_REMIND_DAYS günden eskiyse, ya da
 *  - hiç yedek yoksa ve ilk kayıt BACKUP_FIRST_REMIND_DAYS günden eskiyse.
 * "Sonra" denmişse (backupSnoozeUntil gelecekteyse) ya da hiç kayıt yoksa gösterilmez.
 */
export function getBackupReminder(
  settings: ReminderInput,
  hasEntries: boolean,
  now: Date = new Date(),
): string | null {
  if (!hasEntries) return null;
  if (settings.backupSnoozeUntil && new Date(settings.backupSnoozeUntil) > now) {
    return null;
  }

  if (settings.lastBackupAt) {
    const days = daysSince(settings.lastBackupAt, now);
    return days >= BACKUP_REMIND_DAYS ? `Son yedeğin ${days} gün önce` : null;
  }

  if (settings.firstSavedAt && daysSince(settings.firstSavedAt, now) >= BACKUP_FIRST_REMIND_DAYS) {
    return 'Henüz yedek almadın';
  }
  return null;
}

/** Ayarlar'daki durum yazısı: "Son yedek: 12 gün önce" / "Henüz yedek alınmadı". */
export function formatLastBackup(lastBackupAt: string | undefined, now: Date = new Date()): string {
  if (!lastBackupAt) return 'Henüz yedek alınmadı';
  const days = daysSince(lastBackupAt, now);
  if (days <= 0) return 'Son yedek: bugün';
  if (days === 1) return 'Son yedek: dün';
  return `Son yedek: ${days} gün önce`;
}

/** "Sonra" butonu: uyarıyı BACKUP_SNOOZE_DAYS gün gizleyen zaman damgası. */
export const snoozeUntil = (now: Date = new Date()): string =>
  addDays(now, BACKUP_SNOOZE_DAYS).toISOString();
