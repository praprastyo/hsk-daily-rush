import { motion } from 'framer-motion';

interface Props {
  onGoToLobby: () => void;
}

export function GameOverView({ onGoToLobby }: Props) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: 10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring' as const, stiffness: 200, damping: 15 }}
        className="mb-8"
      >
        <motion.span
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="text-8xl block mb-4"
        >
          💔
        </motion.span>
        <h1 className="text-4xl font-black text-gray-900 mt-4 leading-none">Game Over</h1>
        <p className="text-gray-500 font-semibold mt-3 text-sm max-w-sm">
          Kamu kehabisan nyawa atau waktu habis! Jangan menyerah, coba lagi besok.
        </p>
      </motion.div>

      <motion.button
        type="button"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring' as const, stiffness: 300, damping: 25 }}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97, y: 6 }}
        onClick={onGoToLobby}
        className="w-full max-w-xs px-8 py-4 rounded-2xl font-extrabold text-lg
          bg-gradient-to-br from-[#FFD100] via-[#FFE04D] to-[#FFB800]
          border-b-[6px] border-[#C29D00] text-[#111] transition-all
          hover:shadow-[0_8px_30px_rgba(255,209,0,0.4)] cursor-pointer"
      >
        🔄 Kembali ke Lobi
      </motion.button>
    </main>
  );
}