/**
 * `true` yapılırsa gün panelinde bir saate dokunmak kaydı yapar ve
 * paneli kapatır. Şimdilik kayıt yalnızca "Kaydet" butonuyla yapılır.
 */
export const AUTO_SAVE = false;

export const MIN_HOURS = 1;
export const MAX_HOURS = 24;
export const HOURS_STEP = 1;
/** Yeni bir güne dokunulduğunda seçicinin başlangıç değeri. */
export const DEFAULT_HOURS = 2;

/** Saat seçicideki değerler: 1 … 24 (tam saatler). */
export const HOUR_VALUES: number[] = Array.from(
  { length: Math.round((MAX_HOURS - MIN_HOURS) / HOURS_STEP) + 1 },
  (_, i) => MIN_HOURS + i * HOURS_STEP,
);
