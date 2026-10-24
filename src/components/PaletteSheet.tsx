import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { PALETTES } from '../lib/palettes';

type Props = {
  open: boolean;
  value: string;
  onChange: (id: string) => void;
  onClose: () => void;
};

export default function PaletteSheet({ open, value, onChange, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <BottomSheet title="Renk paleti" onClose={onClose}>
          <div className="grid grid-cols-4 gap-x-2 gap-y-4 pb-2 pt-1">
            {PALETTES.map((p) => {
              const active = p.id === value;
              return (
                <motion.button
                  key={p.id}
                  type="button"
                  aria-pressed={active}
                  aria-label={p.name}
                  onClick={() => onChange(p.id)}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className="relative flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                    style={{
                      background: `linear-gradient(135deg, ${p.light.g1}, ${p.light.g2}, ${p.light.g3})`,
                      boxShadow: active
                        ? `0 0 0 2px var(--surface), 0 0 0 4px ${p.light.accent}`
                        : undefined,
                    }}
                  >
                    {active && <Check size={22} strokeWidth={3} />}
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: active ? 'var(--text)' : 'var(--text-muted)' }}
                  >
                    {p.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </BottomSheet>
      )}
    </AnimatePresence>
  );
}
