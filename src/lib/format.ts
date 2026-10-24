const currency = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
});

/** 1234.5 → "1.234,50 ₺" */
export function formatCurrency(value: number): string {
  return currency.format(value);
}

/** Saatlik ücret alanındaki yazıya izin verilen karakterler: rakam ve tek bir virgül/nokta. */
export function sanitizeDecimalInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, '').replace('.', ',');
  const [int, ...rest] = cleaned.split(',');
  return rest.length ? `${int},${rest.join('')}` : int;
}

/** Türkçe ondalık virgüllü yazıyı sayıya çevirir; geçersizse null. */
export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!normalized) return null;
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Düzenleme alanı için: 123.5 → "123,5", 0 → "". */
export function rateToInput(rate: number): string {
  return rate > 0 ? String(rate).replace('.', ',') : '';
}
