import { motion } from 'framer-motion';
import type { GameMode } from '../../types/game';
import type { Question } from '../../types/game';
import { PinyinDragQuestion } from './questions/PinyinDragQuestion';
import { ConversationQuestion } from './questions/ConversationQuestion';
import { MatchQuestion } from './questions/MatchQuestion';
import { ManualInputQuestion } from './questions/ManualInputQuestion';

interface Props {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  timer: number;
  activeMode: GameMode | null;
  hearts: number;
  wrongEffect: boolean;
  isTyping: boolean;
  pinyinAnswers: Record<string, string>;
  selectedChatReply: string | null;
  selectedLeft: string | null;
  selectedRight: string | null;
  completedMatches: Record<string, string>;
  manualInputValue: string;
  isManualInputCorrect: boolean | null;
  setPinyinAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSelectedChatReply: (v: string | null) => void;
  setSelectedLeft: (v: string | null) => void;
  setSelectedRight: (v: string | null) => void;
  setCompletedMatches: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setManualInputValue: (v: string) => void;
  setIsManualInputCorrect: (v: boolean | null) => void;
  onCheckAnswer: () => void;
}

export function PlayingView({
  question, questionIndex, totalQuestions, timer, activeMode, hearts,
  wrongEffect, isTyping,
  pinyinAnswers, selectedChatReply, selectedLeft, selectedRight,
  completedMatches, manualInputValue, isManualInputCorrect,
  setPinyinAnswers, setSelectedChatReply, setSelectedLeft, setSelectedRight,
  setCompletedMatches, setManualInputValue, setIsManualInputCorrect,
  onCheckAnswer,
}: Props) {
  const isDead = hearts <= 0;

  const timerBg =
    timer <= 5
      ? 'from-red-600 to-red-400'
      : timer <= 15
        ? 'from-orange-600 to-orange-400'
        : 'from-blue-500 to-cyan-400';

  return (
    <main className="flex-1 flex flex-col p-5 relative">
      {/* Wrong answer flash overlay */}
      {wrongEffect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.2, 0.05] }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-red-500 pointer-events-none z-50 rounded-2xl"
        />
      )}

      {/* Game-over overlay when hearts = 0 */}
      {isDead && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 z-40 flex items-center justify-center rounded-2xl"
        >
          <div className="text-white text-center font-extrabold text-2xl animate-pulse">
            💔 Game Over
          </div>
        </motion.div>
      )}

      <div className={`flex flex-col flex-1 ${isDead ? 'pointer-events-none opacity-40' : ''}`}>
        {/* Timer bar — only in timeAttack mode */}
        {activeMode === 'timeAttack' && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Time Attack
              </span>
              <motion.span
                animate={timer <= 10 ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="text-xs font-black text-white bg-black/20 px-2.5 py-0.5 rounded-full"
              >
                ⏱️ {timer}s
              </motion.span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: `${(timer / 60) * 100}%` }}
                transition={{ duration: 0.3 }}
                className={`h-full bg-gradient-to-r ${timerBg} rounded-full`}
              />
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Soal {questionIndex + 1} dari {totalQuestions}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((questionIndex) / totalQuestions) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-[#58CC02] to-[#68E20B] rounded-full"
            />
          </div>
        </div>

        {/* Question instruction */}
        <motion.h2
          key={question.id}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="text-xl font-extrabold text-[#111] mb-6 leading-snug"
        >
          {question.instruction}
        </motion.h2>

        {/* Question body — animated per-question */}
        <div className="flex-1">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
          >
            {question.type === 'pinyin_drag' && (
              <PinyinDragQuestion
                question={question}
                pinyinAnswers={pinyinAnswers}
                setPinyinAnswers={setPinyinAnswers}
              />
            )}
            {question.type === 'conversation' && (
              <ConversationQuestion
                question={question}
                isTyping={isTyping}
                selectedChatReply={selectedChatReply}
                setSelectedChatReply={setSelectedChatReply}
              />
            )}
            {question.type === 'match' && (
              <MatchQuestion
                question={question}
                selectedLeft={selectedLeft}
                selectedRight={selectedRight}
                completedMatches={completedMatches}
                setSelectedLeft={setSelectedLeft}
                setSelectedRight={setSelectedRight}
                setCompletedMatches={setCompletedMatches}
              />
            )}
            {question.type === 'manual' && (
              <ManualInputQuestion
                question={question}
                manualInputValue={manualInputValue}
                isManualInputCorrect={isManualInputCorrect}
                setManualInputValue={setManualInputValue}
                setIsManualInputCorrect={setIsManualInputCorrect}
              />
            )}
          </motion.div>
        </div>

        {/* Check answer button — disabled when hearts = 0 */}
        <div className="pt-6 border-t-2 border-gray-100 flex flex-col gap-3">
          <motion.button
            type="button"
            whileHover={!isDead ? { scale: 1.02, y: -2 } : {}}
            whileTap={!isDead ? { scale: 0.98, y: 4 } : {}}
            onClick={onCheckAnswer}
            disabled={isDead}
            className={`w-full px-8 py-4 rounded-2xl font-extrabold text-lg border-b-[6px] transition-all ${
              isDead
                ? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-[#58CC02] via-[#68E20B] to-[#46A302] border-[#46A302] text-white hover:shadow-[0_8px_30px_rgba(88,204,2,0.4)] cursor-pointer active:shadow-none'
            }`}
          >
            {isDead ? '💔 Tidak Ada Nyawa' : '✅ Periksa Jawaban'}
          </motion.button>
        </div>
      </div>
    </main>
  );
}