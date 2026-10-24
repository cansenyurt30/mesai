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

/** Son yedek bu kadar günden eskiyse hatırlatma kartı çıkar. */
export const BACKUP_REMIND_DAYS = 30;
/** Hiç yedek alınmadıysa, ilk kayıttan bu kadar gün sonra hatırlat. */
export const BACKUP_FIRST_REMIND_DAYS = 7;
/** "Sonra" denince hatırlatma bu kadar gün gizlenir. */
export const BACKUP_SNOOZE_DAYS = 7;

/** Saat seçicideki değerler: 1 … 24 (tam saatler). */
export const HOUR_VALUES: number[] = Array.from(
  { length: Math.round((MAX_HOURS - MIN_HOURS) / HOURS_STEP) + 1 },
  (_, i) => MIN_HOURS + i * HOURS_STEP,
);
