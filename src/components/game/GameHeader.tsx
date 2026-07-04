import { motion } from 'framer-motion';
import { Flame, Heart, Lightbulb, Trophy } from 'lucide-react';
import type { GamePhase } from '../../types/game';

interface GameHeaderProps {
  hearts: number;
  bestScore: number;
  dailyStreak: number;
  hintsRemaining: number;
  gameState: GamePhase;
  onUseHint: () => void;
}

export function GameHeader({
  hearts, bestScore, dailyStreak, hintsRemaining, gameState, onUseHint,
}: GameHeaderProps) {
  const canHint = hintsRemaining > 0 && gameState === 'playing';

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.05 }}
      className="flex items-center justify-between px-3 py-2.5 border-b-2 border-gray-100 bg-white/80 backdrop-blur-md gap-2"
    >
      {/* Streak */}
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600 px-2.5 py-1.5 rounded-full border border-orange-200 shrink-0">
        <Flame className="w-4 h-4 fill-current" />
        <span className="font-extrabold text-xs">{dailyStreak}d</span>
      </div>

      {/* Health — pulses when critical */}
      <motion.div
        animate={hearts <= 1 && hearts > 0 ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border shrink-0 ${
          hearts <= 1
            ? 'bg-red-100 text-red-600 border-red-300'
            : 'bg-rose-50 text-rose-600 border-rose-200'
        }`}
      >
        <Heart className="w-4 h-4 fill-current" />
        <span className="font-extrabold text-xs">{hearts} HP</span>
      </motion.div>

      {/* Best Score */}
      <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-50/80 to-amber-50/80 border border-yellow-300/50 text-[#111] px-2.5 py-1.5 rounded-full shrink-0">
        <Trophy className="w-4 h-4 text-amber-600 fill-current" />
        <span className="font-black text-xs">{bestScore}</span>
      </div>

      {/* Hint */}
      <motion.button
        type="button"
        whileHover={canHint ? { scale: 1.05 } : {}}
        whileTap={canHint ? { scale: 0.95 } : {}}
        onClick={onUseHint}
        disabled={!canHint}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border-2 transition-all font-black text-xs shrink-0 ${
          canHint
            ? 'border-[#FFD100] bg-[#FFD100] text-[#111] shadow-[0_3px_0_#C29D00] active:translate-y-0.5 active:shadow-none'
            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Lightbulb className="w-4 h-4 fill-current" />
        <span>{hintsRemaining}</span>
      </motion.button>
    </motion.header>
  );
}