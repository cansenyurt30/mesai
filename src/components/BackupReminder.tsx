import { AnimatePresence, motion } from 'framer-motion';
import { Download } from 'lucide-react';

type Props = {
  /** Gösterilecek yazı; null ise kart görünmez. */
  message: string | null;
  onBackup: () => void;
  onSnooze: () => void;
};

/** Özet kartının altında, ince ve sade yedek hatırlatması. */
export default function BackupReminder({ message, onBackup, onSnooze }: Props) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          key="backup-reminder"
          role="status"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          {/* Üst boşluk bu kutuda: kart gizlenirken boşluk da birlikte kapanır */}
          <div className="pt-3">
            <div
              className="flex items-center gap-2 rounded-2xl py-1 pl-4 pr-1"
              style={{ background: 'var(--surface)' }}
            >
              <p className="min-w-0 flex-1 text-sm" style={{ color: 'var(--text)' }}>
                {message}
              </p>
              <button
                type="button"
                onClick={onBackup}
                className="flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold"
                style={{ background: 'var(--accent)', color: 'var(--on-fill)' }}
              >
                <Download size={16} />
                Yedekle
              </button>
              <button
                type="button"
                onClick={onSnooze}
                className="h-11 rounded-xl px-3 text-sm font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                Sonra
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
