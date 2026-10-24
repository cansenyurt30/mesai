import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion';
import { Check, Eye, EyeOff, Pencil, X } from 'lucide-react';
import { formatHoursLong, formatMonthTitle } from '../lib/dates';
import {
  formatCurrency,
  parseDecimal,
  rateToInput,
  sanitizeDecimalInput,
} from '../lib/format';
import { summarizeMonth } from '../lib/summary';
import type { EntryMap } from '../hooks/useEntries';

type Props = {
  month: Date;
  entries: EntryMap;
  hourlyRate: number;
  onRateChange: (rate: number) => void;
};

const HIDDEN_TEXT = '••••• ₺';

export default function SummaryCard({ month, entries, hourlyRate, onRateChange }: Props) {
  // "Açık" durumu kaydedilmez: her açılışta ve arka plandan dönüşte gizli başlar.
  const [revealed, setRevealed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const { totalHours, leaveDays } = useMemo(
    () => summarizeMonth(entries, month),
    [entries, month],
  );
  const totalPay = totalHours * hourlyRate;

  useEffect(() => {
    const hide = () => setRevealed(false);
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', hide);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', hide);
    };
  }, []);

  // Gizlenince yarım kalan düzenleme de iptal olur.
  useEffect(() => {
    if (!revealed) setEditing(false);
  }, [revealed]);

  const startEdit = () => {
    setDraft(rateToInput(hourlyRate));
    setEditing(true);
  };

  const commitEdit = () => {
    const value = parseDecimal(draft);
    if (value !== null) onRateChange(value);
    setEditing(false);
  };

  return (
    <section
      className="relative overflow-clip rounded-3xl p-5 text-white shadow-lg"
      style={{ background: 'linear-gradient(135deg, var(--g1), var(--g2), var(--g3))' }}
      aria-label="Aylık özet"
    >
      {/* Dekoratif ışık lekeleri */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{formatMonthTitle(month)}</p>
          <p className="mt-1 text-4xl font-bold leading-tight">
            <CountUp value={totalHours} />
          </p>
          <p className="mt-1 text-xs text-white/70">Toplam mesai</p>
        </div>

        <motion.button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          aria-label={revealed ? 'Ücretleri gizle' : 'Ücretleri göster'}
          aria-pressed={revealed}
          whileTap={{ scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className="-mr-2 -mt-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-md"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={revealed ? 'open' : 'closed'}
              className="flex"
              initial={{ scale: 0.5, rotate: -40, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.5, rotate: 40, opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              {revealed ? <Eye size={20} /> : <EyeOff size={20} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="relative mt-4 space-y-3 rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur-md">
        <Row label="Toplam ücret">
          <Swap k={revealed ? 'v' : 'h'}>
            <span className="text-xl font-semibold">
              {revealed ? formatCurrency(totalPay) : HIDDEN_TEXT}
            </span>
          </Swap>
        </Row>

        <div className="h-px bg-white/20" />

        {revealed && editing ? (
          <div>
            <span className="text-sm text-white/80">Saatlik ücret (₺)</span>
            <div className="mt-1 flex items-center gap-1">
              <input
                autoFocus
                type="text"
                inputMode="decimal"
                value={draft}
                onChange={(e) => setDraft(sanitizeDecimalInput(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit();
                  if (e.key === 'Escape') setEditing(false);
                }}
                placeholder="0,00"
                aria-label="Saatlik ücret (₺)"
                className="h-11 min-w-0 flex-1 rounded-xl bg-white/90 px-3 text-base font-semibold text-slate-900 outline-none"
              />
              <IconButton label="Kaydet" onClick={commitEdit}>
                <Check size={20} />
              </IconButton>
              <IconButton label="Vazgeç" onClick={() => setEditing(false)}>
                <X size={20} />
              </IconButton>
            </div>
          </div>
        ) : (
          <Row label="Saatlik ücret">
            <Swap k={revealed ? 'v' : 'h'}>
              {revealed ? (
                <div className="flex items-center gap-1">
                  <span className="text-base font-medium">
                    {formatCurrency(hourlyRate)}
                  </span>
                  <IconButton label="Saatlik ücreti düzenle" onClick={startEdit}>
                    <Pencil size={16} />
                  </IconButton>
                </div>
              ) : (
                <span className="text-base font-medium">{HIDDEN_TEXT}</span>
              )}
            </Swap>
          </Row>
        )}
      </div>

      <div className="relative mt-3 flex">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-md">
          {leaveDays} gün izin
        </span>
      </div>
    </section>
  );
}

const hoursNumber = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 });

/** Değer değişince eski sayıdan yenisine yumuşakça sayar (ilk açılışta 0'dan). */
function CountUp({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const shown = useRef(0);
  const [text, setText] = useState(formatHoursLong(0));

  useEffect(() => {
    if (reduce) {
      shown.current = value;
      setText(formatHoursLong(value));
      return;
    }
    const controls = animate(shown.current, value, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        shown.current = v;
        setText(`${hoursNumber.format(v)} saat`);
      },
      onComplete: () => {
        shown.current = value;
        setText(formatHoursLong(value));
      },
    });
    // Animasyon kareleri durursa (arka plan, düşük güç modu) sayı yine de doğru görünsün.
    const fallback = setTimeout(() => {
      shown.current = value;
      setText(formatHoursLong(value));
    }, 1200);
    return () => {
      controls.stop();
      clearTimeout(fallback);
    };
  }, [value, reduce]);

  return <>{text}</>;
}

/** Gizli ↔ açık geçişinde hafif bulanıklaşarak değişen içerik. */
function Swap({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={k}
        initial={{ opacity: 0, filter: 'blur(6px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, filter: 'blur(6px)' }}
        transition={{ duration: 0.16 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <span className="text-sm text-white/80">{label}</span>
      {children}
    </div>
  );
}

function IconButton({
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
      aria-label={label}
      onClick={onClick}
      whileTap={{ scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className="flex h-11 w-11 items-center justify-center rounded-full"
    >
      {children}
    </motion.button>
  );
}
