/** Question types for the HSK Daily Rush game. */
export type QuestionType = 'conversation' | 'match' | 'pinyin_drag' | 'manual';

/** Game modes available from the lobby. */
export type GameMode = 'streak' | 'timeAttack' | 'suddenDeath';

/** Game state lifecycle phases. */
export type GamePhase = 'lobby' | 'playing' | 'gameover' | 'success';

/** A single game question from the question pool. */
export interface Question {
  id: number;
  type: QuestionType;
  instruction: string;
  hintContent: string;
  // Conversation
  chatHistory?: { sender: 'bot' | 'user'; text: string; isTyping?: boolean }[];
  options?: string[];
  correctOption?: string;
  // Match
  leftItems?: { id: string; text: string }[];
  rightItems?: { id: string; text: string }[];
  matchPairs?: Record<string, string>; // leftId -> rightId
  // Pinyin drag
  pinyinSlots?: { id: string; placeholder: string; correctValue: string }[];
  dragOptions?: string[];
  // Manual input
  correctManualAnswer?: string;
}