import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { startOfMonth } from 'date-fns';
import { Palette, Settings as SettingsIcon } from 'lucide-react';
import Calendar from './components/Calendar';
import DaySheet from './components/DaySheet';
import PaletteSheet from './components/PaletteSheet';
import SettingsSheet from './components/SettingsSheet';
import SummaryCard from './components/SummaryCard';
import { useEntries } from './hooks/useEntries';
import { useSettings } from './hooks/useSettings';
import { useTheme } from './hooks/useTheme';
import { requestPersistentStorage } from './lib/db';
import { toDateKey } from './lib/dates';
import { setSoundEnabled } from './lib/sound';
import type { Backup } from './lib/backup';

export default function App() {
  const { entries, saveEntry, removeEntry, replaceAll, clearAll } = useEntries();
  const { settings, loaded: settingsLoaded, updateSettings, resetSettings } = useSettings();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useTheme(settings.theme, settings.palette, settingsLoaded);

  useEffect(() => {
    setSoundEnabled(settings.sound);
  }, [settings.sound]);

  useEffect(() => {
    void requestPersistentStorage();
  }, []);

  const closeSheet = useCallback(() => setSelectedDay(null), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  const restore = useCallback(
    async (backup: Backup) => {
      await replaceAll(backup.entries);
      await updateSettings(backup.settings);
    },
    [replaceAll, updateSettings],
  );

  const deleteAll = useCallback(async () => {
    await clearAll();
    await resetSettings();
  }, [clearAll, resetSettings]);

  return (
    <div
      className="mx-auto min-h-dvh max-w-md px-4"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <motion.header
        className="flex items-center justify-between py-2"
        {...enter(0)}
      >
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Renk paleti"
            whileTap={{ scale: 0.85, rotate: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full"
            style={{ color: 'var(--accent)' }}
          >
            <Palette size={22} />
          </motion.button>
          <h1 className="text-2xl font-bold">Mesai</h1>
        </div>
        <motion.button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Ayarlar"
          whileTap={{ scale: 0.85, rotate: 60 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full"
          style={{ color: 'var(--text-muted)' }}
        >
          <SettingsIcon size={22} />
        </motion.button>
      </motion.header>

      <main className="flex flex-col gap-4 pb-6">
        <motion.div {...enter(0.07)}>
          <SummaryCard
            month={month}
            entries={entries}
            hourlyRate={settings.hourlyRate}
            onRateChange={(rate) => void updateSettings({ hourlyRate: rate })}
          />
        </motion.div>
        <motion.div {...enter(0.15)}>
          <Calendar
            month={month}
            onMonthChange={setMonth}
            entries={entries}
            onSelectDay={setSelectedDay}
          />
        </motion.div>
      </main>

      <DaySheet
        date={selectedDay}
        entry={selectedDay ? entries[toDateKey(selectedDay)] : undefined}
        onSave={saveEntry}
        onClear={removeEntry}
        onClose={closeSheet}
      />

      <PaletteSheet
        open={paletteOpen}
        value={settings.palette}
        onChange={(palette) => void updateSettings({ palette })}
        onClose={closePalette}
      />

      <SettingsSheet
        open={settingsOpen}
        entries={entries}
        settings={settings}
        onThemeChange={(theme) => void updateSettings({ theme })}
        onSoundChange={(sound) => void updateSettings({ sound })}
        onRestore={restore}
        onDeleteAll={deleteAll}
        onClose={closeSettings}
      />
    </div>
  );
}

/** Açılışta bileşenlerin sırayla, aşağıdan yumuşakça belirmesi. */
const enter = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
});
