import { forwardRef, useMemo, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { addMonths, isSameDay, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  formatHoursShort,
  formatMonthTitle,
  toDateKey,
} from '../lib/dates';
import type { EntryMap } from '../hooks/useEntries';
import type { DayEntry } from '../types';

type Props = {
  month: Date;
  onMonthChange: (month: Date) => void;
  entries: EntryMap;
  onSelectDay: (date: Date) => void;
};

const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 400;
const SLIDE = 56;
const EASE = [0.22, 1, 0.36, 1] as const;

const monthVariants = {
  enter: (dir: number) => ({ x: dir * SLIDE, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: -dir * SLIDE, opacity: 0 }),
};

export default function Calendar({
  month,
  onMonthChange,
  entries,
  onSelectDay,
}: Props) {
  const [direction, setDirection] = useState(0);

  const go = (dir: 1 | -1) => {
    setDirection(dir);
    onMonthChange(dir === 1 ? addMonths(month, 1) : subMonths(month, 1));
  };

  return (
    <section
      className="rounded-3xl p-3 shadow-sm"
      style={{ background: 'var(--surface)' }}
      aria-label="Takvim"
    >
      <div className="flex items-center justify-between">
        <NavButton label="Önceki ay" onClick={() => go(-1)}>
          <ChevronLeft size={22} />
        </NavButton>

        <div className="relative h-7 flex-1 overflow-hidden text-center">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.h2
              key={toDateKey(month)}
              custom={direction}
              variants={monthVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: EASE }}
              className="absolute inset-x-0 text-lg font-semibold leading-7"
            >
              {formatMonthTitle(month)}
            </motion.h2>
          </AnimatePresence>
        </div>

        <NavButton label="Sonraki ay" onClick={() => go(1)}>
          <ChevronRight size={22} />
        </NavButton>
      </div>

      <div className="mt-1 grid grid-cols-7 text-center">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="py-1 text-xs font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="relative">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <MonthGrid
            key={toDateKey(month)}
            month={month}
            direction={direction}
            entries={entries}
            onSelectDay={onSelectDay}
            onSwipe={go}
          />
        </AnimatePresence>
      </div>

      <div
        className="mt-3 flex items-center justify-center gap-5 text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        <LegendItem color="var(--accent)" label="Mesai" />
        <LegendItem color="var(--leave)" label="İzin" />
      </div>
    </section>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      whileTap={{ scale: 0.82 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className="flex h-11 w-11 items-center justify-center rounded-full"
    >
      {children}
    </motion.button>
  );
}

type GridProps = {
  month: Date;
  direction: number;
  entries: EntryMap;
  onSelectDay: (date: Date) => void;
  onSwipe: (dir: 1 | -1) => void;
};

/** Parmağı izleyen, bırakınca yaylanarak dönen ya da aya geçen takvim ızgarası. */
const MonthGrid = forwardRef<HTMLDivElement, GridProps>(function MonthGrid(
  { month, direction, entries, onSelectDay, onSwipe },
  ref,
) {
  const weeks = useMemo(() => buildMonthGrid(month), [month]);
  const today = new Date();

  const x = useMotionValue(0);
  const dragOpacity = useTransform(x, [-160, 0, 160], [0.45, 1, 0.45]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) {
      onSwipe(1);
    } else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) {
      onSwipe(-1);
    }
  };

  return (
    <motion.div
      ref={ref}
      custom={direction}
      variants={monthVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: EASE }}
      style={{ x }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      dragTransition={{ bounceStiffness: 420, bounceDamping: 36 }}
      onDragEnd={handleDragEnd}
      className="w-full"
    >
      {/* Sürüklerken solar; giriş/çıkış opaklığı dıştaki katmanda */}
      <motion.div style={{ opacity: dragOpacity }} className="grid grid-cols-7 gap-y-1">
        {weeks.flat().map((day, i) =>
          day ? (
            <DayCell
              key={toDateKey(day)}
              day={day}
              isToday={isSameDay(day, today)}
              entry={entries[toDateKey(day)]}
              onSelect={onSelectDay}
            />
          ) : (
            <div key={`empty-${i}`} />
          ),
        )}
      </motion.div>
    </motion.div>
  );
});

type DayCellProps = {
  day: Date;
  isToday: boolean;
  entry?: DayEntry;
  onSelect: (date: Date) => void;
};

function DayCell({ day, isToday, entry, onSelect }: DayCellProps) {
  const isMesai = entry?.type === 'mesai';
  const isLeave = entry?.type === 'izin';

  const label = isMesai
    ? formatHoursShort(entry.hours ?? 0)
    : isLeave
      ? 'İzin'
      : null;

  // Kayıt değişince dolgu yeniden "pop" yapar.
  const fillKey = entry ? `${entry.type}-${entry.hours ?? ''}` : '';

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(day)}
      aria-label={`${day.getDate()}${label ? `, ${label}` : ''}`}
      aria-current={isToday ? 'date' : undefined}
      whileTap={{ scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className="relative mx-auto flex h-12 w-12 flex-col items-center justify-center rounded-2xl leading-none"
      style={{
        color: entry ? 'var(--on-fill)' : 'var(--text)',
        boxShadow: isToday ? '0 0 0 2px var(--surface), 0 0 0 4px var(--accent)' : undefined,
        fontWeight: isToday ? 700 : 500,
      }}
    >
      <AnimatePresence initial={false}>
        {entry && (
          <motion.span
            key={fillKey}
            aria-hidden
            className="absolute inset-0 rounded-2xl"
            style={{ background: isLeave ? 'var(--leave)' : 'var(--accent)' }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
          />
        )}
      </AnimatePresence>
      <span className="relative text-[15px]">{day.getDate()}</span>
      {label && (
        <span className="relative mt-0.5 text-[10px] font-semibold">{label}</span>
      )}
    </motion.button>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-3 w-3 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
