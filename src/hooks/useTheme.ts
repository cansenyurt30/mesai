import { useEffect } from 'react';
import type { ThemeMode } from '../types';

export const THEME_STORAGE_KEY = 'mesai-theme';
const THEME_COLORS = { light: '#f4f5fb', dark: '#0e0f1a' };

/**
 * Temayı <html> üzerindeki `dark` sınıfına uygular. Sistem seçiliyken cihazın
 * açık/koyu değişimini de takip eder.
 *
 * Seçim IndexedDB'den asenkron okunduğu için, açılışta yanıp sönmeyi önlemek
 * adına son seçim ayrıca localStorage'a yazılır ve index.html içindeki küçük
 * betik sayfa çizilmeden önce okur. Ayarlar yüklenene kadar (`ready`) dokunulmaz.
 */
export function useTheme(theme: ThemeMode, ready: boolean) {
  useEffect(() => {
    if (!ready) return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
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
  }, [theme, ready]);
}
