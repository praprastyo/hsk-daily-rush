import { AnimatePresence, motion } from 'framer-motion';

import { useGameLogic } from './hooks/useGameLogic';
import { PinyinChart } from './components/PinyinChart';
import { TutorView } from './components/tutor/TutorView';
import { GameHeader } from './components/game/GameHeader';
import { LobbyView } from './components/game/LobbyView';
import { PlayingView } from './components/game/PlayingView';
import { GameOverView } from './components/game/GameOverView';
import { SuccessView } from './components/game/SuccessView';

export default function App() {
  const {
    // State
    hearts, score, bestScore, dailyStreak, hintsRemaining, activeMode,
    appView, gameState, currentQuestionIdx, questions, showPinyinChart,
    wrongEffect, isTyping, timer,
    pinyinAnswers, selectedChatReply, selectedLeft, selectedRight,
    completedMatches, manualInputValue, isManualInputCorrect,
    // Setters
    setShowPinyinChart, setPinyinAnswers, setSelectedChatReply,
    setSelectedLeft, setSelectedRight, setCompletedMatches,
    setManualInputValue, setIsManualInputCorrect,
    // Actions
    goToLobby, goToTutor, goToGame,
    startMode, handleCheckAnswer, handleUseHint, triggerHaptic,
  } = useGameLogic();

  // ── Tutor view (full screen with back button) ──
  if (appView === 'tutor') {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-white">
        <header className="flex items-center px-4 py-3 border-b-2 border-gray-100">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              goToGame();
              triggerHaptic('light');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-gray-200 bg-white font-black text-xs text-[#111] transition-all hover:bg-gray-50 active:translate-y-0.5"
          >
            ← Kembali
          </motion.button>
        </header>
        <TutorView />
      </div>
    );
  }

  // ── Game views ──
  return (
    <div className="flex flex-col flex-1 min-h-screen relative bg-white">
      {/* Wrong answer flash overlay (global, outside main) */}
      <AnimatePresence>
        {wrongEffect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.25, 0.05] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-red-500 pointer-events-none z-50 rounded-2xl"
          />
        )}
      </AnimatePresence>

      {/* Header — always visible except lobby */}
      {gameState !== 'lobby' && (
        <GameHeader
          hearts={hearts}
          bestScore={bestScore}
          dailyStreak={dailyStreak}
          hintsRemaining={hintsRemaining}
          gameState={gameState}
          onUseHint={handleUseHint}
        />
      )}

      {/* Phase-specific view with AnimatePresence transition */}
      <AnimatePresence mode="wait">
        {gameState === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <LobbyView
              onStartMode={startMode}
              onOpenTutor={() => { goToTutor(); triggerHaptic('medium'); }}
              onOpenPinyinChart={() => setShowPinyinChart(true)}
            />
          </motion.div>
        )}

        {gameState === 'playing' && questions[currentQuestionIdx] && (
          <motion.div
            key={`q-${questions[currentQuestionIdx].id}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col"
          >
            <PlayingView
              question={questions[currentQuestionIdx]}
              questionIndex={currentQuestionIdx}
              totalQuestions={questions.length}
              timer={timer}
              activeMode={activeMode}
              hearts={hearts}
              wrongEffect={wrongEffect}
              isTyping={isTyping}
              pinyinAnswers={pinyinAnswers}
              selectedChatReply={selectedChatReply}
              selectedLeft={selectedLeft}
              selectedRight={selectedRight}
              completedMatches={completedMatches}
              manualInputValue={manualInputValue}
              isManualInputCorrect={isManualInputCorrect}
              setPinyinAnswers={setPinyinAnswers}
              setSelectedChatReply={setSelectedChatReply}
              setSelectedLeft={setSelectedLeft}
              setSelectedRight={setSelectedRight}
              setCompletedMatches={setCompletedMatches}
              setManualInputValue={setManualInputValue}
              setIsManualInputCorrect={setIsManualInputCorrect}
              onCheckAnswer={handleCheckAnswer}
            />
          </motion.div>
        )}

        {gameState === 'gameover' && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <GameOverView onGoToLobby={goToLobby} />
          </motion.div>
        )}

        {gameState === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <SuccessView
              score={score}
              dailyStreak={dailyStreak}
              bestScore={bestScore}
              onGoToLobby={goToLobby}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinyin chart overlay */}
      <PinyinChart open={showPinyinChart} onClose={() => setShowPinyinChart(false)} />
    </div>
  );
}