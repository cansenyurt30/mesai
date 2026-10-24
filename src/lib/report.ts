import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatHoursLong, formatMonthTitle } from './dates';
import { formatCurrency } from './format';
import { shareOrDownload } from './shareFile';
import type { SaveResult } from './shareFile';
import { summarizeMonth } from './summary';
import type { EntryMap } from '../hooks/useEntries';

export type MonthReport = {
  month: Date;
  totalHours: number;
  leaveDays: number;
  /** Mesai yapılan günler (tarih sırasıyla). */
  days: { date: Date; hours: number }[];
  /** Yalnızca kullanıcı "ücret eklensin" derse dolu. */
  totalPay?: number;
};

/** Rapor verisi. Ücret yalnızca `includePay` ise hesaplanır ve rapora girer. */
export function buildMonthReport(
  entries: EntryMap,
  month: Date,
  hourlyRate: number,
  includePay: boolean,
): MonthReport {
  const { totalHours, leaveDays } = summarizeMonth(entries, month);
  const prefix = format(month, 'yyyy-MM');

  const days = Object.values(entries)
    .filter((e) => e.type === 'mesai' && e.date.startsWith(prefix))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ date: new Date(`${e.date}T00:00:00`), hours: e.hours ?? 0 }));

  return {
    month,
    totalHours,
    leaveDays,
    days,
    ...(includePay ? { totalPay: totalHours * hourlyRate } : {}),
  };
}

const WIDTH = 1080;
const PAD = 72;
const ROW_H = 64;
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const cssVar = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/** Raporu, uygulamanın renk paletiyle bir PNG'ye çizer (ek paket yok, canvas). */
export function renderReportPng(report: MonthReport): Promise<Blob> {
  const { days } = report;
  const columns = days.length > 8 ? 2 : 1;
  const rows = Math.max(1, Math.ceil(days.length / columns));
  const panelY = 620;
  const panelH = rows * ROW_H + 72;
  const height = panelY + panelH + PAD;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas desteklenmiyor'));

  // Zemin: uygulamadaki özet kartının gradient'i
  const bg = ctx.createLinearGradient(0, 0, WIDTH, height);
  bg.addColorStop(0, cssVar('--g1', '#6366f1'));
  bg.addColorStop(0.55, cssVar('--g2', '#8b5cf6'));
  bg.addColorStop(1, cssVar('--g3', '#d946ef'));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'alphabetic';

  ctx.globalAlpha = 0.85;
  ctx.font = `600 38px ${FONT}`;
  ctx.fillText('Mesai', PAD, 120);
  ctx.globalAlpha = 1;

  ctx.font = `700 84px ${FONT}`;
  ctx.fillText(formatMonthTitle(report.month), PAD, 230);

  ctx.font = `800 168px ${FONT}`;
  ctx.fillText(formatHoursLong(report.totalHours), PAD, 400);

  ctx.globalAlpha = 0.8;
  ctx.font = `500 36px ${FONT}`;
  ctx.fillText('Toplam mesai', PAD, 456);
  ctx.globalAlpha = 1;

  // İzin çipi
  const chip = `${report.leaveDays} gün izin`;
  ctx.font = `600 34px ${FONT}`;
  const chipW = ctx.measureText(chip).width + 56;
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  roundRect(ctx, PAD, 500, chipW, 64, 32);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(chip, PAD + 28, 544);

  if (report.totalPay !== undefined) {
    ctx.globalAlpha = 0.85;
    ctx.font = `500 36px ${FONT}`;
    ctx.fillText('Toplam ücret', PAD + chipW + 48, 544);
    ctx.globalAlpha = 1;
    ctx.font = `700 40px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(formatCurrency(report.totalPay), WIDTH - PAD, 544);
    ctx.textAlign = 'left';
  }

  // Mesai günleri paneli
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  roundRect(ctx, PAD / 2, panelY, WIDTH - PAD, panelH, 44);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  if (days.length === 0) {
    ctx.globalAlpha = 0.85;
    ctx.font = `500 38px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('Bu ay mesai kaydı yok', WIDTH / 2, panelY + panelH / 2 + 12);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  } else {
    const innerX = PAD / 2 + 44;
    const innerW = WIDTH - PAD - 88;
    const colW = innerW / columns;
    days.forEach((d, i) => {
      const col = Math.floor(i / rows);
      const row = i % rows;
      const x = innerX + col * colW;
      const y = panelY + 36 + row * ROW_H + 44;
      const gutter = columns === 2 ? 32 : 0;

      ctx.font = `500 36px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(format(d.date, 'd MMMM, EEE', { locale: tr }), x, y);
      ctx.font = `700 36px ${FONT}`;
      ctx.textAlign = 'right';
      ctx.fillText(`${d.hours} sa`, x + colW - gutter, y);
    });
    ctx.textAlign = 'left';
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG üretilemedi'))), 'image/png');
  });
}

/** PNG'yi üretir ve paylaşım menüsüyle gönderir (olmazsa indirir). */
export async function shareMonthReport(report: MonthReport): Promise<SaveResult> {
  const blob = await renderReportPng(report);
  const fileName = `mesai-${format(report.month, 'yyyy-MM')}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });
  return shareOrDownload(file, `Mesai · ${formatMonthTitle(report.month)}`);
}
