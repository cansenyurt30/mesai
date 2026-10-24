import { useEffect } from 'react';
import { applyPalette } from '../lib/palettes';
import type { ThemeMode } from '../types';

export const THEME_STORAGE_KEY = 'mesai-theme';
const THEME_COLORS = { light: '#f4f5fb', dark: '#0e0f1a' };

/**
 * Temayı (açık/koyu) <html> üzerindeki `dark` sınıfına, paleti de CSS
 * değişkenlerine uygular. Sistem seçiliyken cihazın açık/koyu değişimini de takip eder.
 *
 * Seçimler IndexedDB'den asenkron okunduğu için, açılışta yanıp sönmeyi önlemek
 * adına son tema ve palet ayrıca localStorage'a yazılır; index.html içindeki küçük
 * betik sayfa çizilmeden önce bunları okur. Ayarlar yüklenene kadar (`ready`) dokunulmaz.
 */
export function useTheme(theme: ThemeMode, palette: string, ready: boolean) {
  useEffect(() => {
    if (!ready) return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
      applyPalette(palette, dark);
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? THEME_COLORS.dark : THEME_COLORS.light);
    };

    apply();
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage kapalıysa yalnızca açılıştaki ön uygulama atlanır.
    }

    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme, palette, ready]);
}
