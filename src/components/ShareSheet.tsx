import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import BottomSheet from './BottomSheet';
import Segmented from './Segmented';
import { formatHoursLong, formatMonthTitle } from '../lib/dates';
import { buildMonthReport, shareMonthReport } from '../lib/report';
import { summarizeMonth } from '../lib/summary';
import type { EntryMap } from '../hooks/useEntries';

type Props = {
  open: boolean;
  month: Date;
  entries: EntryMap;
  hourlyRate: number;
  onClose: () => void;
};

type PayChoice = 'no' | 'yes';

const PAY_OPTIONS = [
  { value: 'no' as const, label: 'Hayır' },
  { value: 'yes' as const, label: 'Evet' },
];

export default function ShareSheet({ open, ...rest }: Props) {
  return <AnimatePresence>{open && <ShareContent {...rest} />}</AnimatePresence>;
}

function ShareContent({ month, entries, hourlyRate, onClose }: Omit<Props, 'open'>) {
  // Ücret varsayılan olarak rapora EKLENMEZ.
  const [pay, setPay] = useState<PayChoice>('no');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const { totalHours, leaveDays } = summarizeMonth(entries, month);

  const share = async () => {
    setBusy(true);
    setError(false);
    try {
      const report = buildMonthReport(entries, month, hourlyRate, pay === 'yes');
      const result = await shareMonthReport(report);
      if (result !== 'cancelled') onClose();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet title="Ay raporunu paylaş" onClose={onClose}>
      <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        {formatMonthTitle(month)} · {formatHoursLong(totalHours)} · {leaveDays} gün izin
      </p>

      <p className="mb-2 mt-5 px-1 text-sm font-semibold">Ücret bilgisi eklensin mi?</p>
      <Segmented label="Ücret bilgisi" options={PAY_OPTIONS} value={pay} onChange={setPay} />
      <p className="mt-2 px-1 text-xs" style={{ color: 'var(--text-muted)' }}>
        {pay === 'yes'
          ? 'Rapora toplam ücret yazılır. Paylaşmadan önce kime gönderdiğine dikkat et.'
          : 'Rapor yalnızca saat ve gün bilgisini içerir.'}
      </p>

      {error && (
        <motion.p
          role="status"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center text-sm"
          style={{ color: '#dc2626' }}
        >
          Rapor hazırlanamadı, tekrar dene.
        </motion.p>
      )}

      <motion.button
        type="button"
        disabled={busy}
        onClick={() => void share()}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold transition-opacity disabled:opacity-60"
        style={{ background: 'var(--accent)', color: 'var(--on-fill)' }}
      >
        <Share2 size={18} />
        Paylaş
      </motion.button>
    </BottomSheet>
  );
}
