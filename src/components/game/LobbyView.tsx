import { motion, type Variants } from 'framer-motion';
import { playSound } from '../../utils/soundSynth';
import { useHaptic } from '../../hooks/useHaptic';
import type { GameMode } from '../../types/game';

interface LobbyViewProps {
  onStartMode: (mode: GameMode) => void;
  onOpenTutor: () => void;
  onOpenPinyinChart: () => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.3 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 40, opacity: 0, scale: 0.92 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
  },
};

const glowClasses: Record<string, string> = {
  primary: 'hover:shadow-[0_8px_30px_rgba(255,209,0,0.4)]',
  info: 'hover:shadow-[0_8px_30px_rgba(28,176,246,0.4)]',
  danger: 'hover:shadow-[0_8px_30px_rgba(255,75,75,0.4)]',
  success: 'hover:shadow-[0_8px_30px_rgba(88,204,2,0.4)]',
  ghost: 'hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]',
};

const gradientClasses: Record<string, string> = {
  primary:
    'bg-gradient-to-br from-[#FFD100] via-[#FFE04D] to-[#FFB800] border-b-[6px] border-[#C29D00] text-[#111]',
  info:
    'bg-gradient-to-br from-[#1CB0F6] via-[#35C4FF] to-[#0099E6] border-b-[6px] border-[#1899D6] text-white',
  danger:
    'bg-gradient-to-br from-[#FF4B4B] via-[#FF6666] to-[#E63E3E] border-b-[6px] border-[#D63333] text-white',
  success:
    'bg-gradient-to-br from-[#58CC02] via-[#68E20B] to-[#46A302] border-b-[6px] border-[#46A302] text-white',
  ghost:
    'bg-white border-2 border-gray-200 text-[#111] border-b-[6px] border-b-gray-300',
};

interface ModeButtonProps {
  variant: 'primary' | 'info' | 'danger' | 'success' | 'ghost';
  emoji: string;
  label: string;
  soundType?: 'whoosh' | 'click' | 'chime';
  onClick: () => void;
}

function ModeButton({ variant, emoji, label, soundType = 'whoosh', onClick }: ModeButtonProps) {
  const triggerHaptic = useHaptic();

  return (
    <motion.button
      type="button"
      variants={itemVariants}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97, y: 6 }}
      onClick={() => {
        playSound(soundType);
        triggerHaptic('medium');
        onClick();
      }}
      className={`relative w-full px-6 py-4 rounded-2xl font-extrabold text-lg transition-all cursor-pointer overflow-hidden ${gradientClasses[variant]} ${glowClasses[variant]}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        <span className="text-xl">{emoji}</span>
        {label}
      </span>
    </motion.button>
  );
}

export function LobbyView({ onStartMode, onOpenTutor, onOpenPinyinChart }: LobbyViewProps) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      {/* Hero Section */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.05 }}
        className="mb-8"
      >
        <div className="relative inline-block mb-4">
          <motion.span
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="text-7xl block drop-shadow-lg"
          >
            🐉
          </motion.span>
          <motion.span
            animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="absolute -top-2 -right-4 text-4xl"
          >
            🔥
          </motion.span>
        </div>

        <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-2">
          HSK{' '}
          <motion.span
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="bg-gradient-to-r from-[#FFD100] to-[#FFB800] px-3 py-1 rounded-xl border-2 border-black inline-block shadow-[0_4px_0_#C29D00]"
          >
            Daily Rush
          </motion.span>
        </h1>
        <p className="text-gray-500 font-semibold max-w-sm mt-3 text-sm leading-relaxed">
          Latihan harian HSK 1-6 super seru, imersif, dan tergamifikasi. Tanpa login!
        </p>
      </motion.div>

      {/* Mode Buttons — staggered entrance */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-3.5 w-full max-w-xs"
      >
        <ModeButton variant="primary" emoji="🔥" label="Daily Streak Mode" onClick={() => onStartMode('streak')} />
        <ModeButton variant="info" emoji="⏱️" label="Time Attack (60s)" onClick={() => onStartMode('timeAttack')} />
        <ModeButton variant="danger" emoji="💀" label="Sudden Death (3 HP)" onClick={() => onStartMode('suddenDeath')} />
        <ModeButton variant="success" emoji="🐼" label="HSK Master (Tutor)" onClick={onOpenTutor} />
        <ModeButton variant="ghost" emoji="🧪" label="Tabel Pinyin" soundType="chime" onClick={onOpenPinyinChart} />
      </motion.div>
    </main>
  );
}