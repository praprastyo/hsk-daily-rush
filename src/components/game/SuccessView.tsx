import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy } from 'lucide-react';

interface Props {
  score: number;
  dailyStreak: number;
  bestScore: number;
  onGoToLobby: () => void;
}

/** Confetti emoji particles that rain down over the success screen. */
function ConfettiLayer() {
  const [particles] = useState(() => {
    const emojis = ['🎉', '✨', '🎊', '💫', '⭐', '🌟', '🎆', '🏅', '🔥', '🏆'];
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
    }));
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: '110vh', opacity: [0, 1, 1, 0] }}
          transition={{
            delay: p.delay,
            duration: p.duration,
            repeat: Infinity,
            repeatDelay: Math.random() * 3,
            ease: 'linear',
          }}
          className="absolute text-2xl"
          style={{ left: `${p.left}%` }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
}

/** Animated score counter that counts up from 0 to the final score. */
function AnimatedScore({ score }: { score: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (score <= 0) return;
    const step = Math.max(1, Math.floor(score / 30));
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, score);
      setDisplay(current);
      if (current >= score) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [score]);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.35, type: 'spring' as const, stiffness: 300 }}
      className="mt-4 px-6 py-2 rounded-full bg-gradient-to-r from-[#58CC02] to-[#68E20B] border-b-4 border-[#46A302] shadow-[0_4px_0_#3A8A01]"
    >
      <span className="text-white font-black text-2xl">+{display}</span>
      <span className="text-white/80 font-bold text-lg ml-1">Skor Didapat!</span>
    </motion.div>
  );
}

export function SuccessView({ score, dailyStreak, bestScore, onGoToLobby }: Props) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-emerald-50/20 relative overflow-hidden">
      <ConfettiLayer />

      <motion.div
        initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring' as const, stiffness: 180, damping: 12 }}
        className="mb-8 flex flex-col items-center relative z-10"
      >
        {/* Trophy with sparkle effects */}
        <div className="relative">
          <motion.span
            animate={{ scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="text-9xl block drop-shadow-xl"
          >
            🏆
          </motion.span>
          <motion.span
            animate={{ scale: [1, 1.4, 1], rotate: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="absolute -top-2 -right-3 text-4xl"
          >
            ✨
          </motion.span>
          <motion.span
            animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 0.5 }}
            className="absolute -bottom-1 -left-3 text-3xl"
          >
            🎊
          </motion.span>
        </div>

        <h1 className="text-4xl font-black text-gray-900 mt-6 leading-none">
          Daily Mission Cleared!
        </h1>

        <AnimatedScore score={score} />

        {/* Stats card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 flex flex-col gap-2.5 bg-white border-2 border-gray-100 p-4 rounded-2xl w-full max-w-xs shadow-sm"
        >
          <div className="flex justify-between items-center text-sm font-bold text-gray-600">
            <span>Total Streak Saat Ini:</span>
            <span className="text-orange-600 font-black flex items-center gap-1">
              <Flame className="w-4 h-4 fill-current" /> {dailyStreak} Hari
            </span>
          </div>
          <div className="flex justify-between items-center text-sm font-bold text-gray-600">
            <span>Skor Terbaik:</span>
            <span className="text-amber-600 font-black flex items-center gap-1">
              <Trophy className="w-4 h-4 fill-current" /> {bestScore} pts
            </span>
          </div>
        </motion.div>
      </motion.div>

      <motion.button
        type="button"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, type: 'spring' as const, stiffness: 300, damping: 25 }}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97, y: 6 }}
        onClick={onGoToLobby}
        className="w-full max-w-xs px-8 py-4 rounded-2xl font-extrabold text-lg relative z-10
          bg-gradient-to-br from-[#58CC02] via-[#68E20B] to-[#46A302]
          border-b-[6px] border-[#46A302] text-white transition-all
          hover:shadow-[0_8px_30px_rgba(88,204,2,0.4)] cursor-pointer"
      >
        🚀 Lanjutkan Latihan
      </motion.button>
    </main>
  );
}