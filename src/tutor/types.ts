// Core domain types for the HSK Master AI tutor.
// These types are the shared contract across the pure-logic core
// (validation, questionSelector, evaluator, progress, persistence, tutorEngine),
// the Zustand store, and the React presentation layer.

/** Valid HSK difficulty tiers (Requirement 10.1). */
export type HskLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Authentic HSK format identifiers (Requirement 10.2).
 * Used for question validity and selection checks.
 */
export type QuestionFormat =
  | 'listening_picture_match'
  | 'listening_true_false'
  | 'listening_dialogue_choice'
  | 'reading_sentence_match'
  | 'reading_gap_fill'
  | 'reading_choice'
  | 'writing_reorder'
  | 'writing_char_fill';

/**
 * The set of authentic HSK format identifiers used for validity/selection checks.
 * Frozen at runtime so it can serve as the single source of truth for known formats.
 */
export const AUTHENTIC_FORMATS = [
  'listening_picture_match',
  'listening_true_false',
  'listening_dialogue_choice',
  'reading_sentence_match',
  'reading_gap_fill',
  'reading_choice',
  'writing_reorder',
  'writing_char_fill',
] as const satisfies readonly QuestionFormat[];

/** A single vocabulary entry shown in the Hanzi Vocabulary Table (supporting material). */
export interface VocabEntry {
  hanzi: string; // Hanzi only
  pinyin: string; // supporting material only
  meaningId: string; // Indonesian meaning, supporting material only
  level: HskLevel;
}

/** A single multiple-choice option, labeled A–D and written in Hanzi only. */
export interface AnswerChoice {
  label: 'A' | 'B' | 'C' | 'D';
  hanzi: string; // Hanzi only (Requirement 2.3, 10.3)
}

/** A single HSK practice question record from the Question Bank. */
export interface Question {
  id: number;
  level: HskLevel; // Requirement 10.1
  format: QuestionFormat; // Requirement 10.2
  body: string; // Hanzi only (Requirement 2.1)
  readingText?: string; // Hanzi only when present (Requirement 2.2)
  choices: AnswerChoice[]; // Hanzi only, labeled A–D (Requirement 10.3)
  correctLabel: 'A' | 'B' | 'C' | 'D'; // recorded correct answer (Requirement 10.3)
  explanationId: string; // explanation text (Requirement 10.4)
  vocab: VocabEntry[]; // ≥1 entry (Requirement 5.3, 10.4, 10.5)
}

/** Per-session learner progress (counts, streak, current level, name). */
export interface Progress {
  name: string;
  level: HskLevel;
  correct: number; // ≥ 0
  wrong: number; // ≥ 0
  streak: number; // ≥ 0
}

/** The mutable state of a single tutoring session. */
export interface SessionState {
  progress: Progress;
  startedAt: number;
}

/** The conversation phase of the tutor finite state machine. */
export type Phase =
  | 'greeting'
  | 'askName'
  | 'askLevel'
  | 'presenting'
  | 'awaitingAnswer'
  | 'evaluated'
  | 'offering'
  | 'levelExhausted'
  | 'closed';

/** Learner intents fed into the tutor reducer. */
export type TutorEvent =
  | { kind: 'start' }
  | { kind: 'submitName'; name: string }
  | { kind: 'submitLevel'; level: number }
  | { kind: 'submitAnswer'; answer: string }
  | { kind: 'continue' }
  | { kind: 'changeLevel' }
  | { kind: 'stop' };

/** The full state owned by the tutor finite state machine. */
export interface TutorState {
  phase: Phase;
  session: SessionState;
  currentQuestionId: number | null;
  /**
   * The question exactly as presented to the learner, including its shuffled
   * choice order and relabeled A–D / correctLabel. Evaluation reads this so the
   * answer is scored against what the learner actually saw (not the raw bank
   * record, whose choice order differs after shuffling).
   */
  currentQuestion: Question | null;
  answeredIds: number[]; // within session, per Requirement 3.2
}

/**
 * An ordered piece of learner-facing content produced by the engine.
 * The UI renders these in order; the progress-card block is always appended last.
 */
export type ResponseBlock =
  | { kind: 'message'; mandarin: string; indonesian: string } // greeting (1.1)
  | { kind: 'question'; question: Question }
  | { kind: 'result'; correct: boolean; correctAnswer?: string }
  | { kind: 'explanation'; text: string }
  | { kind: 'vocabTable'; entries: VocabEntry[] }
  | { kind: 'progressCard'; progress: Progress; accuracy: number }
  | { kind: 'offer'; options: ('continue' | 'changeLevel' | 'stop')[] }
  | { kind: 'error'; text: string };

/** The result of a single reducer step: the next state plus ordered output blocks. */
export interface EngineResult {
  state: TutorState;
  responseBlocks: ResponseBlock[];
}
