import { motion } from 'framer-motion';
import { playSound } from '../../../utils/soundSynth';
import { useHaptic } from '../../../hooks/useHaptic';
import type { Question } from '../../../types/game';

interface Props {
  question: Question;
  selectedLeft: string | null;
  selectedRight: string | null;
  completedMatches: Record<string, string>;
  setSelectedLeft: (v: string | null) => void;
  setSelectedRight: (v: string | null) => void;
  setCompletedMatches: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function MatchQuestion({
  question, selectedLeft, selectedRight, completedMatches,
  setSelectedLeft, setSelectedRight, setCompletedMatches,
}: Props) {
  const triggerHaptic = useHaptic();
  const leftItems = question.leftItems ?? [];
  const rightItems = question.rightItems ?? [];

  const matchItem = (side: 'left' | 'right', id: string) => {
    playSound('click');
    triggerHaptic('light');
    if (side === 'left') {
      setSelectedLeft(id);
      if (selectedRight) {
        setCompletedMatches((prev) => ({ ...prev, [id]: selectedRight }));
        setSelectedLeft(null);
        setSelectedRight(null);
      }
    } else {
      setSelectedRight(id);
      if (selectedLeft) {
        setCompletedMatches((prev) => ({ ...prev, [selectedLeft]: id }));
        setSelectedLeft(null);
        setSelectedRight(null);
      }
    }
  };

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
      className="flex flex-col gap-4 py-4 relative"
    >
      {/* SVG connecting lines */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <svg className="w-full h-full min-h-[220px]">
          {selectedLeft && (
            <g>
              <line
                x1="25%"
                y1={`${(leftItems.findIndex((i) => i.id === selectedLeft) ?? 0) * 60 + 32}px`}
                x2="50%"
                y2="50%"
                stroke="#FFD100"
                strokeWidth="4"
                strokeDasharray="5,5"
              />
            </g>
          )}
          {Object.entries(completedMatches).map(([leftId, rightId]) => {
            const leftIdx = leftItems.findIndex((i) => i.id === leftId) ?? 0;
            const rightIdx = rightItems.findIndex((i) => i.id === rightId) ?? 0;
            return (
              <motion.line
                key={`${leftId}-${rightId}`}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
                x1="35%"
                y1={`${leftIdx * 62 + 30}px`}
                x2="65%"
                y2={`${rightIdx * 62 + 30}px`}
                stroke="#58CC02"
                strokeWidth="5"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-16 relative z-20">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          {leftItems.map((item, i) => {
            const isMatched = !!completedMatches[item.id];
            return (
              <motion.button
                key={item.id}
                type="button"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.06, type: 'spring' as const, stiffness: 400, damping: 25 }}
                whileHover={!isMatched ? { scale: 1.04, y: -2 } : {}}
                whileTap={!isMatched ? { scale: 0.96 } : {}}
                disabled={isMatched}
                role="option"
                aria-selected={selectedLeft === item.id}
                aria-label={`Mandarin item: ${item.text}`}
                onClick={() => matchItem('left', item.id)}
                className={`p-3 border-2 rounded-2xl font-extrabold text-sm transition-all h-[46px] flex items-center justify-center ${
                  isMatched
                    ? 'bg-emerald-50 border-[#58CC02] text-emerald-600 cursor-not-allowed opacity-60'
                    : selectedLeft === item.id
                      ? 'bg-[#FFD100] border-black shadow-[0_4px_0_#C29D00] -translate-y-0.5'
                      : 'bg-white border-gray-200 hover:border-gray-300 shadow-[0_4px_0_#e5e7eb]'
                }`}
              >
                {item.text}
              </motion.button>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          {rightItems.map((item, i) => {
            const isMatched = Object.values(completedMatches).includes(item.id);
            return (
              <motion.button
                key={item.id}
                type="button"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.06, type: 'spring' as const, stiffness: 400, damping: 25 }}
                whileHover={!isMatched ? { scale: 1.04, y: -2 } : {}}
                whileTap={!isMatched ? { scale: 0.96 } : {}}
                disabled={isMatched}
                role="option"
                aria-selected={selectedRight === item.id}
                aria-label={`Translation item: ${item.text}`}
                onClick={() => matchItem('right', item.id)}
                className={`p-3 border-2 rounded-2xl font-extrabold text-sm transition-all h-[46px] flex items-center justify-center ${
                  isMatched
                    ? 'bg-emerald-50 border-[#58CC02] text-emerald-600 cursor-not-allowed opacity-60'
                    : selectedRight === item.id
                      ? 'bg-[#1CB0F6] text-white border-blue-600 shadow-[0_4px_0_#1899D6] -translate-y-0.5'
                      : 'bg-white border-gray-200 hover:border-gray-300 shadow-[0_4px_0_#e5e7eb]'
                }`}
              >
                {item.text}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="text-center text-xs font-bold text-gray-400 mt-4 bg-gray-50 p-2 rounded-xl border border-gray-100">
        ⚡ Tarik garis: Pilih item kiri lalu pasangkan dengan item kanan.
      </div>
    </motion.div>
  );
}