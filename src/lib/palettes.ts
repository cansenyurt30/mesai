/**
 * Renk paletleri. Her palet açık ve koyu tema için ayrı renk içerir:
 * - accent: mesai günleri, butonlar, seçili öğeler
 * - leave:  izin günleri
 * - g1..g3: özet kartının gradient renkleri
 *
 * Yeni palet eklemek için listeye bir kayıt eklemek yeterli.
 */

export type PaletteColors = {
  accent: string;
  leave: string;
  g1: string;
  g2: string;
  g3: string;
};

export type Palette = {
  id: string;
  name: string;
  light: PaletteColors;
  dark: PaletteColors;
};

export const PALETTES: Palette[] = [
  {
    id: 'mor',
    name: 'Mor',
    light: { accent: '#4f46e5', leave: '#0d9488', g1: '#6366f1', g2: '#8b5cf6', g3: '#d946ef' },
    dark: { accent: '#818cf8', leave: '#2dd4bf', g1: '#4338ca', g2: '#5b21b6', g3: '#581c87' },
  },
  {
    id: 'okyanus',
    name: 'Okyanus',
    light: { accent: '#0284c7', leave: '#b45309', g1: '#0ea5e9', g2: '#3b82f6', g3: '#6366f1' },
    dark: { accent: '#38bdf8', leave: '#fbbf24', g1: '#0369a1', g2: '#1d4ed8', g3: '#312e81' },
  },
  {
    id: 'orman',
    name: 'Orman',
    light: { accent: '#047857', leave: '#b45309', g1: '#10b981', g2: '#14b8a6', g3: '#06b6d4' },
    dark: { accent: '#34d399', leave: '#fbbf24', g1: '#047857', g2: '#0f766e', g3: '#155e75' },
  },
  {
    id: 'gunbatimi',
    name: 'Gün Batımı',
    light: { accent: '#c2410c', leave: '#0d9488', g1: '#f97316', g2: '#f43f5e', g3: '#ec4899' },
    dark: { accent: '#fb923c', leave: '#2dd4bf', g1: '#c2410c', g2: '#be123c', g3: '#9d174d' },
  },
  {
    id: 'gul',
    name: 'Gül',
    light: { accent: '#e11d48', leave: '#0d9488', g1: '#fb7185', g2: '#f43f5e', g3: '#a855f7' },
    dark: { accent: '#fb7185', leave: '#2dd4bf', g1: '#be123c', g2: '#9f1239', g3: '#6b21a8' },
  },
  {
    id: 'lavanta',
    name: 'Lavanta',
    light: { accent: '#7c3aed', leave: '#db2777', g1: '#a78bfa', g2: '#818cf8', g3: '#60a5fa' },
    dark: { accent: '#a78bfa', leave: '#f472b6', g1: '#6d28d9', g2: '#4338ca', g3: '#1d4ed8' },
  },
  {
    id: 'altin',
    name: 'Altın',
    light: { accent: '#b45309', leave: '#0d9488', g1: '#f59e0b', g2: '#f97316', g3: '#ef4444' },
    dark: { accent: '#fbbf24', leave: '#2dd4bf', g1: '#b45309', g2: '#c2410c', g3: '#991b1b' },
  },
  {
    id: 'gece',
    name: 'Gece',
    light: { accent: '#475569', leave: '#0d9488', g1: '#64748b', g2: '#475569', g3: '#334155' },
    dark: { accent: '#94a3b8', leave: '#2dd4bf', g1: '#334155', g2: '#1e293b', g3: '#0f172a' },
  },
];

export const DEFAULT_PALETTE_ID = 'mor';

/** Açılışta renkler yanıp sönmesin diye son palet localStorage'a da yazılır (bkz. index.html). */
export const PALETTE_STORAGE_KEY = 'mesai-palette';

export const isPaletteId = (id: unknown): id is string =>
  typeof id === 'string' && PALETTES.some((p) => p.id === id);

export function findPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

/** Paletin renklerini CSS değişkenleri olarak <html> üzerine yazar. */
export function applyPalette(id: string, dark: boolean) {
  const palette = findPalette(id);
  const colors = dark ? palette.dark : palette.light;
  const style = document.documentElement.style;
  for (const [key, value] of Object.entries(colors)) {
    style.setProperty(`--${key}`, value);
  }
  try {
    localStorage.setItem(
      PALETTE_STORAGE_KEY,
      JSON.stringify({ light: palette.light, dark: palette.dark }),
    );
  } catch {
    // localStorage kapalıysa yalnızca açılıştaki ön uygulama atlanır.
  }
}
