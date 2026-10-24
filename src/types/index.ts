export type EntryType = 'mesai' | 'izin';

/** İzin türü. Türü olmayan (eski) izin kayıtları 'genel' sayılır. */
export type LeaveType = 'genel' | 'yillik' | 'rapor' | 'mazeret';

export type DayEntry = {
  date: string; // 'YYYY-MM-DD'
  type: EntryType;
  hours?: number; // sadece 'mesai' için, tam saat (1–24)
  note?: string;
  leaveType?: LeaveType; // sadece 'izin' için; 'genel' ise alan hiç yazılmaz
};

export type ThemeMode = 'light' | 'dark' | 'system';

export type Settings = {
  hourlyRate: number; // ₺
  theme: ThemeMode;
  sound: boolean; // kayıt sesi
  palette: string; // renk paleti kimliği (bkz. lib/palettes.ts)
  // Yıllık izin hakkı (bkz. lib/leave.ts). Yedeğe girer.
  annualLeaveDays: number; // bir dönemdeki yıllık izin hakkı (gün)
  hireDate?: string; // 'YYYY-MM-DD': dönem bu tarihin yıldönümünde yenilenir; yoksa takvim yılı
  leaveCarryOver: number; // önceki dönemden devreden gün (içinde bulunulan döneme eklenir)
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
  annualLeaveDays: 14,
  leaveCarryOver: 0,
};
