import { format } from 'date-fns';
import type { EntryMap } from '../hooks/useEntries';

export type MonthSummary = {
  totalHours: number;
  leaveDays: number;
};

/** Toplamlar her seferinde kayıtlardan hesaplanır, ayrıca saklanmaz. */
export function summarizeMonth(entries: EntryMap, month: Date): MonthSummary {
  const prefix = format(month, 'yyyy-MM');
  let totalHours = 0;
  let leaveDays = 0;

  for (const entry of Object.values(entries)) {
    if (!entry.date.startsWith(prefix)) continue;
    if (entry.type === 'mesai') totalHours += entry.hours ?? 0;
    else leaveDays += 1;
  }

  return { totalHours, leaveDays };
}
