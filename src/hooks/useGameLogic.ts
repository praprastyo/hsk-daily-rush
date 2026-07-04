import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/useGameStore';
import { playSound } from '../utils/soundSynth';
import { useHaptic } from './useHaptic';
import { shuffle } from '../utils/shuffle';
import type { Question, GameMode, GamePhase } from '../types/game';
import HSK_QUESTIONS_JSON from '../data/questions.json';

const QUESTION_POOL: Question[] = HSK_QUESTIONS_JSON as Question[];

/**
 * Returns a copy of `question` with ALL visible options randomized:
 *  - `options` (conversation)
 *  - `dragOptions` (pinyin drag)
 *  - `rightItems` (match — right column)
 *  - `leftItems` (match — left column, previously not shuffled)
 *  - `pinyinSlots` (pinyin drag — slot order)
 */
function shuffleQuestionOptions(q: Question): Question {
  return {
    ...q,
    options: q.options ? shuffle(q.options) : q.options,
    dragOptions: q.dragOptions ? shuffle(q.dragOptions) : q.dragOptions,
    rightItems: q.rightItems ? shuffle(q.rightItems) : q.rightItems,
    leftItems: q.leftItems ? shuffle(q.leftItems) : q.leftItems,
    pinyinSlots: q.pinyinSlots ? shuffle(q.pinyinSlots) : q.pinyinSlots,
  };
}

export function useGameLogic() {
  const store = useGameStore();
  const {
    hearts,
    score,
    bestScore,
    dailyStreak,
    hintsRemaining,
    activeMode,
    setMode,
    resetGame,
    useHint,
    loseHeart,
    addScore,
    checkDailyReset,
    incrementStreak,
  } = store;

  const triggerHaptic = useHaptic();

  // ── Local UI state ──
  const [appView, setAppView] = useState<'game' | 'tutor'>('game');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [questions, setQuestions] = useState<Question[]>(QUESTION_POOL);
  const [showPinyinChart, setShowPinyinChart] = useState(false);
  const [gameState, setGameState] = useState<GamePhase>('lobby');
  const [wrongEffect, setWrongEffect] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Timer
  const [timer, setTimer] = useState(60);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Question interaction states
  const [pinyinAnswers, setPinyinAnswers] = useState<Record<string, string>>({});
  const [selectedChatReply, setSelectedChatReply] = useState<string | null>(null);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [completedMatches, setCompletedMatches] = useState<Record<string, string>>({});
  const [manualInputValue, setManualInputValue] = useState('');
  const [isManualInputCorrect, setIsManualInputCorrect] = useState<boolean | null>(null);

  // ── Refs for latest values in callbacks ──
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const idxRef = useRef(currentQuestionIdx);
  idxRef.current = currentQuestionIdx;

  // ── Effects ──

  useEffect(() => { checkDailyReset(); }, [checkDailyReset]);

  // Time Attack timer
  useEffect(() => {
    if (gameState === 'playing' && activeMode === 'timeAttack') {
      setTimer(60);
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameState, activeMode]);

  // Timer zero → game over (decoupled from updater)
  useEffect(() => {
    if (gameState === 'playing' && activeMode === 'timeAttack' && timer <= 0) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      handleGameOver();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, gameState, activeMode]);

  // Hearts hit zero → game over (ALL modes — fixes bug where user could
  // keep answering with 0 hearts)
  useEffect(() => {
    if (gameState === 'playing' && hearts <= 0) {
      handleGameOver();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hearts, gameState]);

  // Typing simulation for conversation questions
  useEffect(() => {
    if (gameState === 'playing' && questions[currentQuestionIdx]?.type === 'conversation') {
      setIsTyping(true);
      const t = setTimeout(() => setIsTyping(false), 1200);
      return () => clearTimeout(t);
    }
  }, [currentQuestionIdx, gameState, questions]);

  // ── Handlers ──

  const handleGameOver = useCallback(() => {
    setGameState('gameover');
    playSound('buzz');
    triggerHaptic('error');
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }, [triggerHaptic]);

  const resetQuestionStates = useCallback(() => {
    setPinyinAnswers({});
    setSelectedChatReply(null);
    setSelectedLeft(null);
    setSelectedRight(null);
    setCompletedMatches({});
    setManualInputValue('');
    setIsManualInputCorrect(null);
  }, []);

  const triggerErrorEffect = useCallback(() => {
    setWrongEffect(true);
    playSound('buzz');
    triggerHaptic('error');
    loseHeart();
    setTimeout(() => setWrongEffect(false), 400);
  }, [triggerHaptic, loseHeart]);

  const triggerSuccessEffect = useCallback(() => {
    playSound('ding');
    triggerHaptic('success');
    addScore(10);
  }, [triggerHaptic, addScore]);

  const nextQuestion = useCallback(() => {
    const idx = idxRef.current;
    const qs = questionsRef.current;
    if (idx < qs.length - 1) {
      setCurrentQuestionIdx(idx + 1);
      resetQuestionStates();
      playSound('whoosh');
    } else {
      setGameState('success');
      incrementStreak();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  }, [resetQuestionStates, incrementStreak]);

  const startMode = useCallback(
    (mode: GameMode) => {
      setMode(mode);
      resetGame();
      setQuestions(shuffle(QUESTION_POOL).map(shuffleQuestionOptions));
      setCurrentQuestionIdx(0);
      resetQuestionStates();
      setGameState('playing');
    },
    [setMode, resetGame, resetQuestionStates],
  );

  const handleCheckAnswer = useCallback(() => {
    const question = questionsRef.current[idxRef.current];
    if (!question) return;

    if (question.type === 'pinyin_drag') {
      const allCorrect = question.pinyinSlots?.every(
        (slot) => pinyinAnswers[slot.id] === slot.correctValue,
      );
      if (allCorrect) { triggerSuccessEffect(); nextQuestion(); }
      else { triggerErrorEffect(); }
    } else if (question.type === 'conversation') {
      if (selectedChatReply === question.correctOption) { triggerSuccessEffect(); nextQuestion(); }
      else { triggerErrorEffect(); }
    } else if (question.type === 'match') {
      const totalPairs = Object.keys(question.matchPairs || {}).length;
      const completedPairs = Object.keys(completedMatches).length;
      if (completedPairs === totalPairs) {
        const isCorrect = Object.entries(completedMatches).every(
          ([left, right]) => question.matchPairs?.[left] === right,
        );
        if (isCorrect) { triggerSuccessEffect(); nextQuestion(); }
        else { triggerErrorEffect(); setCompletedMatches({}); }
      } else { triggerHaptic('medium'); }
    } else if (question.type === 'manual') {
      const sanitized = manualInputValue.trim().toLowerCase();
      if (sanitized === question.correctManualAnswer) {
        setIsManualInputCorrect(true);
        triggerSuccessEffect();
        setTimeout(() => nextQuestion(), 800);
      } else { setIsManualInputCorrect(false); triggerErrorEffect(); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinyinAnswers, selectedChatReply, completedMatches, manualInputValue,
    triggerSuccessEffect, triggerErrorEffect, nextQuestion, triggerHaptic]);

  const handleUseHint = useCallback(() => {
    if (hintsRemaining <= 0) return;
    const question = questionsRef.current[idxRef.current];
    const success = useHint();
    if (!success) return;
    playSound('chime');
    triggerHaptic('medium');

    if (question.type === 'pinyin_drag' && question.pinyinSlots) {
      const empty = question.pinyinSlots.find((s) => !pinyinAnswers[s.id]);
      if (empty) setPinyinAnswers((prev) => ({ ...prev, [empty.id]: empty.correctValue }));
    } else if (question.type === 'conversation') {
      setSelectedChatReply(question.correctOption || null);
    } else if (question.type === 'match' && question.matchPairs) {
      const next = question.leftItems?.find((item) => !completedMatches[item.id]);
      if (next) setCompletedMatches((prev) => ({ ...prev, [next.id]: question.matchPairs![next.id] }));
    } else if (question.type === 'manual') {
      setManualInputValue(question.correctManualAnswer || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintsRemaining, pinyinAnswers, completedMatches, useHint, triggerHaptic]);

  const goToLobby = useCallback(() => setGameState('lobby'), []);
  const goToTutor = useCallback(() => setAppView('tutor'), []);
  const goToGame = useCallback(() => setAppView('game'), []);

  return {
    // State
    hearts, score, bestScore, dailyStreak, hintsRemaining, activeMode,
    appView, gameState, currentQuestionIdx, questions, showPinyinChart,
    wrongEffect, isTyping, timer,
    pinyinAnswers, selectedChatReply, selectedLeft, selectedRight,
    completedMatches, manualInputValue, isManualInputCorrect,

    // Setters (for direct interaction in question components)
    setShowPinyinChart, setPinyinAnswers, setSelectedChatReply,
    setSelectedLeft, setSelectedRight, setCompletedMatches,
    setManualInputValue, setIsManualInputCorrect,

    // Actions
    goToLobby, goToTutor, goToGame,
    startMode, handleCheckAnswer, handleUseHint, triggerHaptic,
  };
}