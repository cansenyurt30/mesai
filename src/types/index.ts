export type EntryType = 'mesai' | 'izin';

export type DayEntry = {
  date: string; // 'YYYY-MM-DD'
  type: EntryType;
  hours?: number; // sadece 'mesai' için, tam saat (1–24)
  note?: string;
};

export type ThemeMode = 'light' | 'dark' | 'system';

export type Settings = {
  hourlyRate: number; // ₺
  theme: ThemeMode;
  sound: boolean; // kayıt sesi
  palette: string; // renk paleti kimliği (bkz. lib/palettes.ts)
  // Yedek hatırlatıcısı için; yedek dosyasına GİRMEZ, geri yükleme de bunlara dokunmaz.
  lastBackupAt?: string; // ISO tarih
  backupSnoozeUntil?: string; // ISO tarih: "Sonra" denince bu zamana kadar uyarı çıkmaz
  firstSavedAt?: string; // ISO tarih: ilk kaydın girildiği an (kayıtlarda giriş zamanı yok)
};

export const DEFAULT_SETTINGS: Settings = {
  hourlyRate: 0,
  theme: 'system',
  sound: true,
  palette: 'mor',
};
