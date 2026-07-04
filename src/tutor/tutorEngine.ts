// Tutor finite-state-machine engine for the HSK Master AI tutor.
//
// `reduce` is a pure reducer: given the current `TutorState`, a learner
// `TutorEvent`, and the question `bank`, it returns the next state plus an
// ordered list of learner-facing `ResponseBlock`s. The engine never touches
// the DOM or storage; persistence and rendering happen in the store/UI layers.
//
// This module is built incrementally across three tasks:
//   - 9.1 (this file): onboarding phases — greeting, name capture, level capture.
//   - 9.2: question presentation + answer evaluation flow.
//   - 9.3: offering, change-level, and stop transitions.
// The `reduce` skeleton and `EngineResult` assembly below are designed so that
// 9.2 and 9.3 can fill in their event handlers without reshaping the engine.
//
// Cross-cutting rule (Requirements 8.1, 8.2, 8.4): EVERY response that produces
// output ends with a `progressCard` block. This is enforced centrally by the
// `finish` helper so individual handlers never have to remember to append it.

import { evaluate } from './evaluator';
import { accuracyPercent, applyResult, setLevel } from './progress';
import { selectNextQuestion, shuffleChoices } from './questionSelector';
import type {
  EngineResult,
  HskLevel,
  Progress,
  Question,
  ResponseBlock,
  TutorEvent,
  TutorState,
} from './types';

/** Greeting shown when onboarding a learner with no recorded name (Requirement 1.1, 1.2). */
const GREETING_NEW = {
  mandarin: '你好！我是你的 HSK 老师。请问你叫什么名字？',
  indonesian: 'Halo! Saya guru HSK Anda. Siapa nama Anda?',
} as const;

/** Prompt asking the learner to choose a target HSK level (Requirement 1.3). */
const ASK_LEVEL = {
  mandarin: '请选择你的 HSK 等级（1 到 6）。',
  indonesian: 'Silakan pilih level HSK target Anda (1 sampai 6).',
} as const;

/** Farewell shown when the learner ends the session (Requirement 9.7). */
const CLOSING = {
  mandarin: '谢谢你的练习，再见！我们下次再学习。',
  indonesian: 'Terima kasih sudah berlatih, sampai jumpa! Sampai bertemu lagi.',
} as const;

/**
 * A fresh tutor state for a brand-new session. `now` is injectable so the
 * factory stays pure and testable (defaults to the wall clock).
 */
export function initialState(now: number = Date.now()): TutorState {
  return {
    phase: 'greeting',
    session: {
      progress: { name: '', level: 1, correct: 0, wrong: 0, streak: 0 },
      startedAt: now,
    },
    currentQuestionId: null,
    currentQuestion: null,
    answeredIds: [],
  };
}

/**
 * The tutor reducer. Pure: returns a new state and ordered response blocks for
 * the given event; the input state is never mutated.
 *
 * Onboarding events (`start`, `submitName`, `submitLevel`) are fully handled
 * here (task 9.1). The remaining events are placeholders that keep the engine
 * type-safe and always emit a progress card; tasks 9.2 and 9.3 replace them.
 */
export function reduce(
  state: TutorState,
  event: TutorEvent,
  bank: Question[],
  rng: () => number = Math.random
): EngineResult {
  switch (event.kind) {
    case 'start':
      return handleStart(state);
    case 'submitName':
      return handleSubmitName(state, event.name);
    case 'submitLevel':
      return handleSubmitLevel(state, event.level, bank, rng);

    // --- Implemented by task 9.2 (presentation + evaluation) ---
    case 'submitAnswer':
      return handleSubmitAnswer(state, event.answer);

    // --- Implemented by task 9.3 (offering, change-level, stop) ---
    case 'continue':
      return handleContinue(state, bank, rng);
    case 'changeLevel':
      return handleChangeLevel(state);
    case 'stop':
      return handleStop(state);

    default:
      return assertNever(event);
  }
}

// ---------------------------------------------------------------------------
// Onboarding handlers (task 9.1)
// ---------------------------------------------------------------------------

/**
 * `start`: greet the learner (Requirement 1.1 — greeting carries both Mandarin
 * and Indonesian text). If a name is already recorded, skip the name request
 * and move straight to asking for a level (Requirement 1.7); otherwise ask for
 * the name (Requirement 1.2).
 */
function handleStart(state: TutorState): EngineResult {
  const { name } = state.session.progress;

  if (hasName(name)) {
    // Returning learner: greet by name and request a level (Requirements 1.3, 1.7).
    const greeting: ResponseBlock = {
      kind: 'message',
      mandarin: `欢迎回来，${name}！${ASK_LEVEL.mandarin}`,
      indonesian: `Selamat datang kembali, ${name}! ${ASK_LEVEL.indonesian}`,
    };
    return finish({ ...state, phase: 'askLevel' }, [greeting]);
  }

  // New learner: greet and ask for the name (Requirements 1.1, 1.2).
  const greeting: ResponseBlock = { kind: 'message', ...GREETING_NEW };
  return finish({ ...state, phase: 'askName' }, [greeting]);
}

/**
 * `submitName`: store a non-empty name and advance to the level request
 * (Requirements 1.4, 1.3). An empty or whitespace-only name is treated as
 * not-provided: emit an error and stay in `askName` (Requirements 1.2, 1.4).
 */
function handleSubmitName(state: TutorState, rawName: string): EngineResult {
  const name = rawName.trim();

  if (name.length === 0) {
    const error: ResponseBlock = {
      kind: 'error',
      text: 'Nama tidak boleh kosong. Silakan masukkan nama Anda.',
    };
    return finish({ ...state, phase: 'askName' }, [error]);
  }

  const progress: Progress = { ...state.session.progress, name };
  const nextState: TutorState = {
    ...state,
    phase: 'askLevel',
    session: { ...state.session, progress },
  };

  const ask: ResponseBlock = {
    kind: 'message',
    mandarin: `你好，${name}！${ASK_LEVEL.mandarin}`,
    indonesian: `Halo, ${name}! ${ASK_LEVEL.indonesian}`,
  };
  return finish(nextState, [ask]);
}

/**
 * `submitLevel`: store a valid integer level in 1..6 and present the first
 * question for that level (Requirements 1.5, 3.4). An out-of-range or
 * non-integer level is rejected with an error block; the engine stays in
 * `askLevel` and the recorded level is left unchanged (Requirement 1.6).
 *
 * On the valid path the acknowledgement is followed immediately by the result
 * of `present` (a single question, or a level-exhausted offer), so the learner
 * receives a question in the same response (Property 9).
 */
function handleSubmitLevel(
  state: TutorState,
  level: number,
  bank: Question[],
  rng: () => number
): EngineResult {
  if (!isValidLevel(level)) {
    const error: ResponseBlock = {
      kind: 'error',
      text: 'Level HSK harus berupa angka dari 1 sampai 6. Silakan coba lagi.',
    };
    return finish({ ...state, phase: 'askLevel' }, [error]);
  }

  const progress = setLevel(state.session.progress, level as HskLevel);
  const leveledState: TutorState = {
    ...state,
    phase: 'presenting',
    session: { ...state.session, progress },
  };

  const ack: ResponseBlock = {
    kind: 'message',
    mandarin: `好的，我们开始 HSK ${level} 级的练习吧！`,
    indonesian: `Baik, mari kita mulai latihan HSK level ${level}!`,
  };

  // Present the first question (or a level-exhausted offer) in the same
  // response, prefixed by the acknowledgement.
  const presented = present(leveledState, bank, rng);
  return finish(presented.state, [ack, ...presented.blocks]);
}

// ---------------------------------------------------------------------------
// Presentation + evaluation handlers (task 9.2)
// ---------------------------------------------------------------------------

/** Standard post-question / exhausted-level choices (Requirements 3.3, 9.4). */
function offerBlock(): ResponseBlock {
  return { kind: 'offer', options: ['continue', 'changeLevel', 'stop'] };
}

/**
 * Present exactly one question for the current level, or fall back to a
 * level-exhausted offer when nothing eligible remains.
 *
 * Returns the next state together with the presentation blocks ONLY (no
 * progress card); the caller composes any leading blocks and runs `finish`
 * once so the progress card stays last (Requirement 8.1).
 *
 * - Question available: emit exactly one `question` block, record
 *   `currentQuestionId`, and await the answer (Requirements 3.4, 9.1, 9.2 —
 *   Property 9: one question block, no result/explanation/vocab, then waiting).
 * - None eligible: enter `levelExhausted`, present no question, and offer
 *   advance/change/stop with an informational message (Requirement 3.3 —
 *   Property 8).
 */
function present(
  state: TutorState,
  bank: Question[],
  rng: () => number = Math.random
): { state: TutorState; blocks: ResponseBlock[] } {
  const { level } = state.session.progress;
  const selected = selectNextQuestion(bank, level, state.answeredIds, rng);

  if (selected === null) {
    const exhaustedState: TutorState = {
      ...state,
      phase: 'levelExhausted',
      currentQuestionId: null,
      currentQuestion: null,
    };
    const notice: ResponseBlock = {
      kind: 'message',
      mandarin: `太棒了！你已经完成了 HSK ${level} 级的所有题目。`,
      indonesian: `Luar biasa! Anda telah menyelesaikan semua soal HSK level ${level}.`,
    };
    return { state: exhaustedState, blocks: [notice, offerBlock()] };
  }

  // Shuffle the answer choices so the correct option is not always in slot A
  // (the raw bank lists the correct choice first). The presented question — with
  // its randomized order and remapped `correctLabel` — is stored in state so the
  // answer is later evaluated against exactly what the learner saw.
  const question = shuffleChoices(selected, rng);

  const awaitingState: TutorState = {
    ...state,
    phase: 'awaitingAnswer',
    currentQuestionId: question.id,
    currentQuestion: question,
  };
  return { state: awaitingState, blocks: [{ kind: 'question', question }] };
}

/**
 * `submitAnswer`: evaluate the learner's answer to the currently presented
 * question. Only meaningful while `awaitingAnswer`; otherwise it is a no-op that
 * still emits a progress card.
 *
 * - Invalid label: emit an `error`, stay in `awaitingAnswer`, and leave progress
 *   untouched (Requirement 4.5 — Property 13).
 * - Correct / wrong: update progress (Requirements 6.1–6.4), record the answered
 *   id, transition to `offering`, and emit blocks in the required order —
 *   `result` → `explanation` → `vocabTable` → `offer` — with the progress card
 *   appended last by `finish` (Requirements 4.1–4.4, 5.1, 5.3, 5.4, 9.3, 9.4 —
 *   Properties 22, 23).
 */
function handleSubmitAnswer(
  state: TutorState,
  answer: string
): EngineResult {
  if (state.phase !== 'awaitingAnswer' || state.currentQuestion === null) {
    return finish(state, []);
  }

  // Evaluate against the presented question (shuffled order, remapped
  // correctLabel) so scoring matches exactly what the learner saw.
  const question = state.currentQuestion;
  const result = evaluate(question, answer);

  if (result.kind === 'invalid') {
    const error: ResponseBlock = {
      kind: 'error',
      text: 'Jawaban harus salah satu dari pilihan A, B, C, atau D. Silakan coba lagi.',
    };
    // Stay awaiting an answer; progress is left unchanged (Requirement 4.5).
    return finish(state, [error]);
  }

  const resultBlock: ResponseBlock =
    result.kind === 'correct'
      ? { kind: 'result', correct: true }
      : { kind: 'result', correct: false, correctAnswer: result.correctAnswer };

  const explanation: ResponseBlock = {
    kind: 'explanation',
    text: question.explanationId,
  };
  const vocabTable: ResponseBlock = {
    kind: 'vocabTable',
    entries: question.vocab,
  };

  const progress = applyResult(state.session.progress, result);
  const nextState: TutorState = {
    ...state,
    phase: 'offering',
    currentQuestionId: null,
    currentQuestion: null,
    answeredIds: [...state.answeredIds, question.id],
    session: { ...state.session, progress },
  };

  // Order: result → explanation → vocabTable → offer, then progressCard last
  // (Properties 20, 22, 23).
  return finish(nextState, [resultBlock, explanation, vocabTable, offerBlock()]);
}

// ---------------------------------------------------------------------------
// Offering, change-level, and stop handlers (task 9.3)
// ---------------------------------------------------------------------------

/**
 * `continue`: present the next question and keep practicing.
 *
 * - From `offering`: present the next question at the current level using the
 *   shared `present` helper (Requirement 9.5 — Property 9: exactly one question
 *   block, then awaiting an answer, with the progress card appended last).
 * - From `levelExhausted`: the learner has cleared the level, so the primary
 *   action is to advance to the next higher level (Requirement 3.3). Increment
 *   the level by 1 (capped at 6) via `setLevel`, then present at the new level.
 *   If already at level 6 and exhausted, re-presenting simply re-enters
 *   `levelExhausted` (no higher level exists), which is the correct terminal
 *   behavior for the top tier.
 *
 * Any other phase is treated as a no-op that still emits a progress card so the
 * cross-cutting rule holds (Requirement 8.1).
 */
function handleContinue(
  state: TutorState,
  bank: Question[],
  rng: () => number
): EngineResult {
  if (state.phase === 'offering') {
    const presented = present(state, bank, rng);
    return finish(presented.state, presented.blocks);
  }

  if (state.phase === 'levelExhausted') {
    const { level } = state.session.progress;
    const advancedState =
      level < 6
        ? {
            ...state,
            session: {
              ...state.session,
              progress: setLevel(state.session.progress, (level + 1) as HskLevel),
            },
          }
        : state;

    const presented = present(advancedState, bank, rng);
    return finish(presented.state, presented.blocks);
  }

  // Not in a phase where continuing is meaningful: emit only the progress card.
  return finish(state, []);
}

/**
 * `changeLevel`: re-request the target HSK level. Transition to `askLevel` and
 * emit the level prompt; do NOT present a question yet. The subsequent
 * `submitLevel` event (handled in task 9.1/9.2) validates the new level and
 * presents a question at it, which makes Property 24 hold (change level →
 * submitLevel(new) → question at the new level) (Requirement 9.6).
 */
function handleChangeLevel(state: TutorState): EngineResult {
  const prompt: ResponseBlock = { kind: 'message', ...ASK_LEVEL };
  return finish({ ...state, phase: 'askLevel' }, [prompt]);
}

/**
 * `stop`: end the session. Transition to `closed` and emit a bilingual closing
 * message; the progress card is appended last by `finish` (Requirement 9.7 —
 * Property 25: stop closes the session with a closing message and a progress
 * card).
 */
function handleStop(state: TutorState): EngineResult {
  const farewell: ResponseBlock = { kind: 'message', ...CLOSING };
  return finish({ ...state, phase: 'closed' }, [farewell]);
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Assemble an `EngineResult`, appending the cross-cutting progress-card block as
 * the final element of any response that carries output (Requirements 8.1, 8.2,
 * 8.4). The accuracy value is derived from the current progress counts.
 */
function finish(state: TutorState, blocks: ResponseBlock[]): EngineResult {
  const { progress } = state.session;
  const progressCard: ResponseBlock = {
    kind: 'progressCard',
    progress,
    accuracy: accuracyPercent(progress),
  };
  return { state, responseBlocks: [...blocks, progressCard] };
}

/** A name counts as recorded only when it has non-whitespace content. */
function hasName(name: string): boolean {
  return name.trim().length > 0;
}

/** A level is valid iff it is an integer in the inclusive range 1..6. */
function isValidLevel(level: number): boolean {
  return Number.isInteger(level) && level >= 1 && level <= 6;
}

/** Exhaustiveness guard: forces a compile error if a new event kind is unhandled. */
function assertNever(event: never): never {
  throw new Error(`Unhandled tutor event: ${JSON.stringify(event)}`);
}
