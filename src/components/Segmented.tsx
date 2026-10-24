import { motion } from 'framer-motion';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** Seçiliyken kaydıran hapın rengi (varsayılan: vurgu rengi). */
  color?: string;
};

type Props<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
};

/** Seçili hapı yumuşakça kayan iki/üç seçenekli kontrol. */
export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: Props<T>) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="relative grid rounded-2xl p-1"
      style={{
        background: 'var(--bg)',
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      <motion.span
        aria-hidden
        className="absolute bottom-1 left-1 top-1 rounded-xl"
        style={{ width: `calc((100% - 8px) / ${options.length})` }}
        initial={false}
        animate={{
          x: `${index * 100}%`,
          backgroundColor: options[index]?.color ?? 'var(--accent)',
        }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
      />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className="relative z-10 h-11 rounded-xl text-[15px] font-semibold transition-colors"
            style={{ color: active ? 'var(--on-fill)' : 'var(--text-muted)' }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
