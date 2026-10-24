import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarCheck } from 'lucide-react';
import BottomSheet from './BottomSheet';
import HourWheel from './HourWheel';
import Segmented from './Segmented';
import { AUTO_SAVE, DEFAULT_HOURS } from '../lib/config';
import { formatDayTitle, toDateKey } from '../lib/dates';
import { LEAVE_TYPES, leaveBalance } from '../lib/leave';
import type { LeaveSettings } from '../lib/leave';
import { playClear, playSuccess } from '../lib/sound';
import type { EntryMap } from '../hooks/useEntries';
import type { DayEntry, EntryType, LeaveType } from '../types';

type Props = {
  date: Date | null;
  entry?: DayEntry;
  /** Yıllık izin kalanını hesaplamak için tüm kayıtlar ve izin ayarları. */
  entries: EntryMap;
  leaveSettings: LeaveSettings;
  onSave: (entry: DayEntry) => void;
  onClear: (date: string) => void;
  onClose: () => void;
};

const TYPE_OPTIONS = [
  { value: 'mesai' as const, label: 'Mesai' },
  { value: 'izin' as const, label: 'İzin', color: 'var(--leave)' },
];

export default function DaySheet({
  date,
  entry,
  entries,
  leaveSettings,
  onSave,
  onClear,
  onClose,
}: Props) {
  return (
    <AnimatePresence>
      {date && (
        <SheetContent
          key={toDateKey(date)}
          date={date}
          entry={entry}
          entries={entries}
          leaveSettings={leaveSettings}
          onSave={onSave}
          onClear={onClear}
          onClose={onClose}
        />
      )}
    </AnimatePresence>
  );
}

type ContentProps = Omit<Props, 'date'> & { date: Date };

function SheetContent({
  date,
  entry,
  entries,
  leaveSettings,
  onSave,
  onClear,
  onClose,
}: ContentProps) {
  const dateKey = toDateKey(date);

  const [type, setType] = useState<EntryType>(entry?.type ?? 'mesai');
  const [hours, setHours] = useState(
    entry?.type === 'mesai' ? (entry.hours ?? DEFAULT_HOURS) : DEFAULT_HOURS,
  );
  const [note, setNote] = useState(entry?.note ?? '');
  const [leaveType, setLeaveType] = useState<LeaveType>(
    entry?.type === 'izin' ? (entry.leaveType ?? 'genel') : 'genel',
  );

  // Yıllık izin seçiliyken, bu gün kaydedilirse dönemde kaç gün kalır? (Engellemez, sadece uyarır.)
  const balance = leaveBalance(entries, date, leaveSettings, new Date(), dateKey);
  const remainingAfter = balance.remaining - 1;
  const overLimit = remainingAfter < 0;

  const commit = (nextType: EntryType, nextHours: number) => {
    if (nextType === 'izin') {
      // 'genel' için alan yazılmaz: eski kayıtlarla aynı biçimde kalır.
      onSave({
        date: dateKey,
        type: 'izin',
        ...(leaveType !== 'genel' ? { leaveType } : {}),
      });
    } else {
      const trimmed = note.trim();
      onSave({
        date: dateKey,
        type: 'mesai',
        hours: nextHours,
        ...(trimmed ? { note: trimmed } : {}),
      });
    }
    playSuccess();
    onClose();
  };

  return (
    <BottomSheet title={formatDayTitle(date)} onClose={onClose}>
      <Segmented
        label="Kayıt türü"
        options={TYPE_OPTIONS}
        value={type}
        onChange={setType}
      />

      <motion.div
        key={type}
        className="mt-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {type === 'mesai' ? (
          <>
            <HourWheel
              value={hours}
              onChange={setHours}
              onPick={AUTO_SAVE ? (h) => commit('mesai', h) : undefined}
            />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={120}
              placeholder="Not ekle (isteğe bağlı)"
              enterKeyHint="done"
              className="mt-3 h-12 w-full rounded-2xl px-4 outline-none transition-shadow focus:shadow-[0_0_0_2px_var(--accent)]"
              style={{ background: 'var(--bg)', color: 'var(--text)' }}
            />
          </>
        ) : (
          // Mesai bölümüyle aynı yükseklikte: sekme değişince panel zıplamasın.
          <div
            className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl px-3 text-center"
            style={{ background: 'var(--bg)' }}
          >
            <CalendarCheck size={34} style={{ color: 'var(--leave)' }} />

            <div role="radiogroup" aria-label="İzin türü" className="grid w-full grid-cols-4 gap-2">
              {LEAVE_TYPES.map((t) => {
                const active = t.id === leaveType;
                return (
                  <motion.button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setLeaveType(t.id)}
                    whileTap={{ scale: 0.93 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                    className="h-11 rounded-xl text-[13px] font-semibold transition-colors"
                    style={
                      active
                        ? { background: 'var(--leave)', color: 'var(--on-fill)' }
                        : { background: 'var(--surface)', color: 'var(--text-muted)' }
                    }
                  >
                    {t.label}
                  </motion.button>
                );
              })}
            </div>

            <p
              className="min-h-10 text-sm"
              style={{ color: overLimit ? '#d97706' : 'var(--text-muted)' }}
            >
              {leaveType === 'yillik'
                ? overLimit
                  ? `Yıllık izin hakkını ${-remainingAfter} gün aşıyorsun`
                  : `Bu günle birlikte ${remainingAfter} gün yıllık iznin kalır`
                : 'Bu gün izinli olarak işaretlenecek.'}
            </p>
          </div>
        )}
      </motion.div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <PressButton
          disabled={!entry}
          onClick={() => {
            onClear(dateKey);
            playClear();
            onClose();
          }}
          style={{ background: 'var(--bg)', color: 'var(--text)' }}
        >
          Temizle
        </PressButton>
        <PressButton
          onClick={() => commit(type, hours)}
          style={{ background: 'var(--accent)', color: 'var(--on-fill)' }}
        >
          Kaydet
        </PressButton>
      </div>
    </BottomSheet>
  );
}

function PressButton({
  disabled,
  onClick,
  style,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  style: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="h-12 rounded-2xl font-semibold transition-opacity disabled:opacity-40"
      style={style}
    >
      {children}
    </motion.button>
  );
}
