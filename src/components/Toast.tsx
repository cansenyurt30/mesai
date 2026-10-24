import { AnimatePresence, motion } from 'framer-motion';

/** Ekranın altında, panellerin üstünde kısa uyarı. */
export default function Toast({ message }: { message: string | null }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
    >
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            role="alert"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg"
            style={{ background: '#1f2937' }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
