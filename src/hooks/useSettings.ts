import { useCallback, useEffect, useRef, useState } from 'react';
import { clearSettings, getSettings, putSettings } from '../lib/db';
import { DEFAULT_SETTINGS } from '../types';
import type { Settings } from '../types';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  // Güncel değeri senkron okumak için; ardışık güncellemeler birbirini ezmesin.
  const latest = useRef<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((s) => {
        if (cancelled) return;
        latest.current = s;
        setSettings(s);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setSettings(next);
    await putSettings(next);
  }, []);

  const resetSettings = useCallback(async () => {
    latest.current = DEFAULT_SETTINGS;
    setSettings(DEFAULT_SETTINGS);
    await clearSettings();
  }, []);

  return { settings, loaded, updateSettings, resetSettings };
}
