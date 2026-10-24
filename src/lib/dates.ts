import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { tr } from 'date-fns/locale';

/** Hafta pazartesi ile başlar. */
export const WEEK_STARTS_ON = 1;

export const WEEKDAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);

/** 'YYYY-MM-DD' anahtarı (yerel saat dilimine göre). */
export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Ay başlığı, ör. "Ekim 2026". */
export function formatMonthTitle(month: Date): string {
  return capitalize(format(month, 'LLLL yyyy', { locale: tr }));
}

/** Gün paneli başlığı, ör. "Pazar, 25 Ekim". */
export function formatDayTitle(date: Date): string {
  return capitalize(format(date, 'EEEE, d LLLL', { locale: tr }));
}

/**
 * Ayın takvim ızgarası: haftalar halinde, her hafta 7 hücre.
 * Ay dışında kalan günler `null` olur.
 */
export function buildMonthGrid(month: Date): (Date | null)[][] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({
    start: startOfWeek(start, { weekStartsOn: WEEK_STARTS_ON }),
    end: endOfWeek(end, { weekStartsOn: WEEK_STARTS_ON }),
  });
  const cells = days.map((d) => (d >= start && d <= end ? d : null));
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Saat gösterimi: 3 → "3 saat", 3.5 → "3,5 saat". */
export function formatHoursLong(hours: number): string {
  return `${String(hours).replace('.', ',')} saat`;
}

/** Saat etiketi: 3 → "3s", 3.5 → "3,5s". */
export function formatHoursShort(hours: number): string {
  return `${String(hours).replace('.', ',')}s`;
}
