import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion, useDragControls } from 'framer-motion';
import type { PanInfo } from 'framer-motion';

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

const CLOSE_DISTANCE = 100;
const CLOSE_VELOCITY = 500;

/**
 * Alttan kayan panel. Arka plana dokunarak, başlık/tutamaç alanından aşağı
 * kaydırarak ya da Esc ile kapanır. Giriş/çıkış animasyonu için üst bileşen
 * bunu `AnimatePresence` içinde göstermelidir.
 */
export default function BottomSheet({ title, onClose, children }: Props) {
  const controls = useDragControls();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > CLOSE_DISTANCE || info.velocity.y > CLOSE_VELOCITY) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.div
        className="absolute inset-0 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
        onClick={onClose}
        aria-hidden
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md rounded-t-3xl px-4 shadow-2xl"
        style={{
          background: 'var(--surface)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%', transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] } }}
        transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.9 }}
        drag="y"
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        dragTransition={{ bounceStiffness: 400, bounceDamping: 40 }}
        dragSnapToOrigin
        onDragEnd={handleDragEnd}
      >
        {/* Başlık alanı: aşağı kaydırarak kapatmak için tutamaç */}
        <div
          className="cursor-grab pb-2 pt-3 text-center"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => controls.start(e)}
        >
          <div
            className="mx-auto mb-3 h-1.5 w-10 rounded-full"
            style={{ background: 'var(--text-muted)', opacity: 0.4 }}
          />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>

        <div className="max-h-[calc(85dvh-5rem)] overflow-y-auto">{children}</div>
      </motion.div>
    </div>
  );
}
