import { motion } from 'framer-motion';
import { playSound } from '../../../utils/soundSynth';
import { useHaptic } from '../../../hooks/useHaptic';
import type { Question } from '../../../types/game';

interface Props {
  question: Question;
  pinyinAnswers: Record<string, string>;
  setPinyinAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function PinyinDragQuestion({ question, pinyinAnswers, setPinyinAnswers }: Props) {
  const triggerHaptic = useHaptic();
  const slots = question.pinyinSlots ?? [];
  const options = question.dragOptions ?? [];

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
      className="flex flex-col gap-6 py-4"
    >
      {/* Slots */}
      <div className="flex gap-4 justify-center items-center flex-wrap">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[100px] bg-gray-50"
          >
            <span className="font-extrabold text-sm mb-2">{slot.placeholder.split(' ')[0]}</span>
            {pinyinAnswers[slot.id] ? (
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                onClick={() => {
                  setPinyinAnswers((prev) => {
                    const next = { ...prev };
                    delete next[slot.id];
                    return next;
                  });
                  playSound('click');
                  triggerHaptic('light');
                }}
                className="bg-[#FFD100] text-black font-extrabold px-3 py-1.5 border-2 border-black rounded-xl cursor-pointer hover:bg-red-100 hover:border-red-400 active:translate-y-0.5 transition-all"
              >
                {pinyinAnswers[slot.id]}
              </motion.div>
            ) : (
              <span className="text-gray-400 text-xs font-bold font-mono">Drop here</span>
            )}
          </div>
        ))}
      </div>

      {/* Drag options */}
      <div className="flex flex-wrap gap-3 justify-center pt-4 border-t border-gray-100">
        {options.map((opt) => {
          const isUsed = Object.values(pinyinAnswers).includes(opt);
          return (
            <motion.button
              key={opt}
              type="button"
              whileHover={!isUsed ? { scale: 1.05, y: -2 } : {}}
              whileTap={!isUsed ? { scale: 0.95, y: 4 } : {}}
              disabled={isUsed}
              onClick={() => {
                const unfilled = slots.find((s) => !pinyinAnswers[s.id]);
                if (unfilled) {
                  setPinyinAnswers((prev) => ({ ...prev, [unfilled.id]: opt }));
                  playSound('click');
                  triggerHaptic('light');
                }
              }}
              className={`px-4 py-2 border-b-4 rounded-xl font-extrabold text-base transition-all ${
                isUsed
                  ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed shadow-none translate-y-1'
                  : 'bg-white border-2 border-gray-300 hover:border-gray-400 active:translate-y-0.5'
              }`}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}