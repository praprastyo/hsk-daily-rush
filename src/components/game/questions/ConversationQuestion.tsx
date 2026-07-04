import { motion } from 'framer-motion';
import { playSound } from '../../../utils/soundSynth';
import { useHaptic } from '../../../hooks/useHaptic';
import type { Question } from '../../../types/game';

interface Props {
  question: Question;
  isTyping: boolean;
  selectedChatReply: string | null;
  setSelectedChatReply: (v: string | null) => void;
}

export function ConversationQuestion({ question, isTyping, selectedChatReply, setSelectedChatReply }: Props) {
  const triggerHaptic = useHaptic();
  const chatHistory = question.chatHistory ?? [];
  const options = question.options ?? [];

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
      className="flex flex-col gap-6 py-2"
    >
      {/* Chat bubble area */}
      <div className="bg-gray-50 border border-gray-100 rounded-3xl p-4 min-h-[160px] flex flex-col justify-end gap-3">
        {chatHistory.map((chat, idx) => (
          <motion.div
            key={idx}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: idx * 0.15, type: 'spring' as const, stiffness: 400, damping: 25 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-2 text-sm font-extrabold max-w-[85%] shadow-sm">
              {chat.text}
            </div>
          </motion.div>
        ))}

        {isTyping ? (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-400 rounded-2xl rounded-tl-none px-4 py-2 text-xs font-bold animate-pulse">
              Seseorang sedang mengetik...
            </div>
          </div>
        ) : (
          selectedChatReply && (
            <motion.div
              initial={{ x: 20, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              className="flex justify-end"
            >
              <div
                onClick={() => setSelectedChatReply(null)}
                className="bg-[#1CB0F6] text-white border-2 border-[#1899D6] rounded-2xl rounded-tr-none px-4 py-2 text-sm font-extrabold max-w-[85%] cursor-pointer hover:bg-red-400 hover:border-red-500 transition-all"
              >
                {selectedChatReply}
              </div>
            </motion.div>
          )
        )}
      </div>

      {/* Reply options — staggered entrance */}
      {!isTyping && (
        <div className="flex flex-col gap-2 pt-2">
          {options.map((opt, i) => (
            <motion.button
              key={opt}
              type="button"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.06, type: 'spring' as const, stiffness: 400, damping: 25 }}
              whileHover={{ scale: 1.01, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedChatReply(opt);
                playSound('click');
                triggerHaptic('light');
              }}
              className={`w-full text-left px-5 py-3 border-2 rounded-2xl font-extrabold transition-all ${
                selectedChatReply === opt
                  ? 'bg-[#1CB0F6] text-white border-[#1899D6] translate-y-0.5'
                  : 'bg-white border-gray-200 text-gray-800 hover:border-gray-300'
              }`}
            >
              💬 {opt}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}