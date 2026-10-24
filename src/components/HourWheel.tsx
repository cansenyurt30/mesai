import { useLayoutEffect, useRef } from 'react';
import { HOUR_VALUES } from '../lib/config';

const ITEM_HEIGHT = 48;
const VISIBLE_ROWS = 5;
const SIDE_PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ROWS / 2);

type Props = {
  value: number;
  onChange: (value: number) => void;
  /** Bir değere doğrudan dokunulunca (otomatik kayıt için). */
  onPick?: (value: number) => void;
};

const clampIndex = (i: number) => Math.min(HOUR_VALUES.length - 1, Math.max(0, i));

function indexOfValue(value: number): number {
  let best = 0;
  HOUR_VALUES.forEach((v, i) => {
    if (Math.abs(v - value) < Math.abs(HOUR_VALUES[best] - value)) best = i;
  });
  return best;
}

const label = (v: number) => String(v).replace('.', ',');

/**
 * iOS tarzı dikey kaydırmalı saat seçici. Parmakla kaydırınca orta satıra
 * oturur (scroll-snap); orta satırdaki değer seçili olur.
 */
export default function HourWheel({ value, onChange, onPick }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const ready = useRef(false);
  const selected = indexOfValue(value);

  // İlk açılışta mevcut değere konumlan; bu sırada oluşan kaydırma olayını yok say.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = selected * ITEM_HEIGHT;
    const timer = setTimeout(() => {
      ready.current = true;
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = () => {
    const el = scroller.current;
    if (!el || !ready.current) return;
    const index = clampIndex(Math.round(el.scrollTop / ITEM_HEIGHT));
    if (index === selected) return;

    onChange(HOUR_VALUES[index]);
  };

  const scrollToIndex = (index: number) => {
    scroller.current?.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      scrollToIndex(clampIndex(selected + (e.key === 'ArrowDown' ? 1 : -1)));
    }
  };

  return (
    <div className="relative" style={{ height: ITEM_HEIGHT * VISIBLE_ROWS }}>
      {/* Orta satırı vurgulayan şerit ve birim etiketi */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 rounded-2xl"
        style={{ top: SIDE_PADDING, height: ITEM_HEIGHT, background: 'var(--bg)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-8 flex items-center text-sm font-medium"
        style={{ top: SIDE_PADDING, height: ITEM_HEIGHT, color: 'var(--text-muted)' }}
      >
        saat
      </div>

      <div
        ref={scroller}
        role="listbox"
        aria-label="Mesai saati"
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="no-scrollbar relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain outline-none"
        style={{
          paddingBlock: SIDE_PADDING,
          touchAction: 'pan-y',
          maskImage:
            'linear-gradient(to bottom, transparent, black 28%, black 72%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent, black 28%, black 72%, transparent)',
        }}
      >
        {HOUR_VALUES.map((v, i) => {
          const distance = Math.abs(i - selected);
          return (
            <div
              key={v}
              role="option"
              aria-selected={i === selected}
              onClick={() => {
                scrollToIndex(i);
                onPick?.(v);
              }}
              className="flex snap-center items-center justify-center text-2xl transition-[opacity,color] duration-150"
              style={{
                height: ITEM_HEIGHT,
                fontWeight: distance === 0 ? 700 : 500,
                color: distance === 0 ? 'var(--accent)' : 'var(--text)',
                opacity: distance === 0 ? 1 : distance === 1 ? 0.55 : 0.28,
              }}
            >
              {label(v)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
