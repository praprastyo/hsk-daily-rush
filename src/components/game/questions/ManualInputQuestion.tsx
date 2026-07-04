import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Question } from '../../../types/game';

interface Props {
  question: Question;
  manualInputValue: string;
  isManualInputCorrect: boolean | null;
  setManualInputValue: (v: string) => void;
  setIsManualInputCorrect: (v: boolean | null) => void;
}

export function ManualInputQuestion({
  question, manualInputValue, isManualInputCorrect,
  setManualInputValue, setIsManualInputCorrect,
}: Props) {
  const [showHint, setShowHint] = useState(false);

  // Reset hint visibility when question changes
  useEffect(() => {
    setShowHint(false);
  }, [question.id]);

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
      className="flex flex-col gap-4 py-6"
    >
      {/* Hint — hidden by default, revealed on click */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowHint((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-bold text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all"
        >
          💡 {showHint ? 'Sembunyikan Petunjuk' : 'Tampilkan Petunjuk'}
        </button>
        {showHint && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-gray-400 font-semibold"
          >
            {question.hintContent}
          </motion.p>
        )}
      </div>

      <input
        type="text"
        placeholder="Ketik jawaban di sini..."
        value={manualInputValue}
        onChange={(e) => {
          setManualInputValue(e.target.value);
          setIsManualInputCorrect(null);
        }}
        className={`w-full px-5 py-4 border-2 rounded-2xl font-extrabold text-lg text-center outline-hidden transition-all ${
          isManualInputCorrect === true
            ? 'border-[#58CC02] bg-emerald-50 text-emerald-700 shadow-[0_0_20px_rgba(88,204,2,0.2)]'
            : isManualInputCorrect === false
              ? 'border-[#FF4B4B] bg-red-50 text-red-700 shadow-[0_0_20px_rgba(255,75,75,0.2)]'
              : 'border-gray-300 bg-white text-gray-800 focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.05)]'
        }`}
      />

      {/* Correct/wrong feedback badge */}
      {isManualInputCorrect !== null && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
          className={`text-center font-extrabold text-sm py-2 rounded-xl ${
            isManualInputCorrect
              ? 'text-emerald-600 bg-emerald-50 border border-emerald-200'
              : 'text-red-600 bg-red-50 border border-red-200'
          }`}
        >
          {isManualInputCorrect ? '✅ Jawaban benar!' : '❌ Coba lagi!'}
        </motion.div>
      )}
    </motion.div>
  );
}