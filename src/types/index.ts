export type EntryType = 'mesai' | 'izin';

export type DayEntry = {
  date: string; // 'YYYY-MM-DD'
  type: EntryType;
  hours?: number; // sadece 'mesai' için, 0.5 adımlı
  note?: string;
};

export type ThemeMode = 'light' | 'dark' | 'system';

export type Settings = {
  hourlyRate: number; // ₺
  theme: ThemeMode;
  sound: boolean; // kayıt ve saat seçimi sesleri
};

export const DEFAULT_SETTINGS: Settings = {
  hourlyRate: 0,
  theme: 'system',
  sound: true,
};
