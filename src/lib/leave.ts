import { addDays, endOfMonth, format, isWithinInterval } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { EntryMap } from '../hooks/useEntries';
import type { LeaveType, Settings } from '../types';

export const LEAVE_TYPES: { id: LeaveType; label: string; cell: string }[] = [
  { id: 'genel', label: 'Genel', cell: 'İzin' },
  { id: 'yillik', label: 'Yıllık', cell: 'Yıllık' },
  { id: 'rapor', label: 'Rapor', cell: 'Rapor' },
  // Hücreye sığması için kısa yazılır (dar ekranda "Mazeret" taşar).
  { id: 'mazeret', label: 'Mazeret', cell: 'Maz.' },
];

export const isLeaveType = (v: unknown): v is LeaveType =>
  LEAVE_TYPES.some((t) => t.id === v);

/** Takvim hücresindeki kısa etiket; türü olmayan izin "İzin". */
export const leaveCellLabel = (type: LeaveType | undefined): string =>
  LEAVE_TYPES.find((t) => t.id === (type ?? 'genel'))?.cell ?? 'İzin';

export type LeaveSettings = Pick<Settings, 'annualLeaveDays' | 'hireDate' | 'leaveCarryOver'>;

export type LeavePeriod = { start: Date; end: Date };

const parseKey = (key: string): Date => new Date(`${key}T00:00:00`);

/** Yıldönümü: 29 Şubat gibi günler olmayan yıllarda ayın son gününe düşer. */
function anniversary(year: number, hire: Date): Date {
  const last = endOfMonth(new Date(year, hire.getMonth(), 1)).getDate();
  return new Date(year, hire.getMonth(), Math.min(hire.getDate(), last));
}

/**
 * `date`'i içeren izin dönemi. İşe giriş tarihi varsa dönem her yıl onun yıldönümünde
 * başlar; yoksa takvim yılıdır (1 Ocak – 31 Aralık).
 */
export function getLeavePeriod(date: Date, hireDate?: string): LeavePeriod {
  if (!hireDate) {
    return {
      start: new Date(date.getFullYear(), 0, 1),
      end: new Date(date.getFullYear(), 11, 31),
    };
  }
  const hire = parseKey(hireDate);
  let start = anniversary(date.getFullYear(), hire);
  if (start > date) start = anniversary(date.getFullYear() - 1, hire);
  const end = addDays(anniversary(start.getFullYear() + 1, hire), -1);
  return { start, end };
}

export type LeaveBalance = {
  period: LeavePeriod;
  /** Dönemin toplam hakkı (+ içinde bulunulan dönemse devreden gün). */
  total: number;
  /** Dönemde kullanılan yıllık izin günü. */
  used: number;
  /** total - used (negatifse hak aşılmıştır). */
  remaining: number;
};

/**
 * `date`'in dönemindeki yıllık izin durumu.
 * Devreden gün yalnızca **bugünü içeren döneme** eklenir (eski dönemler için bilgi yok).
 * `excludeDate` verilirse o günün kaydı kullanılanlara sayılmaz (düzenlenen gün için).
 */
export function leaveBalance(
  entries: EntryMap,
  date: Date,
  settings: LeaveSettings,
  now: Date = new Date(),
  excludeDate?: string,
): LeaveBalance {
  const period = getLeavePeriod(date, settings.hireDate);
  const used = Object.values(entries).filter(
    (e) =>
      e.type === 'izin' &&
      e.leaveType === 'yillik' &&
      e.date !== excludeDate &&
      isWithinInterval(parseKey(e.date), period),
  ).length;

  const isCurrent = isWithinInterval(now, {
    start: period.start,
    end: addDays(period.end, 1), // bugünün saatiyle son günü de kapsasın
  });
  const total = settings.annualLeaveDays + (isCurrent ? settings.leaveCarryOver : 0);
  return { period, total, used, remaining: total - used };
}

/** "12 Mart 2026 – 11 Mart 2027" */
export function formatPeriod(period: LeavePeriod): string {
  const f = (d: Date) => format(d, 'd MMMM yyyy', { locale: tr });
  return `${f(period.start)} – ${f(period.end)}`;
}
