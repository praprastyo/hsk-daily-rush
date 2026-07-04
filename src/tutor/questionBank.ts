// Typed loader for the HSK Master AI question bank.
//
// The authentic per-level HSK questions live in `src/data/hskQuestions.json`
// (a new data source introduced for the tutor — see design "Question Bank Schema").
// The legacy Pinyin-drill data in `src/data/questions.json` is intentionally
// left untouched so the existing game in `App.tsx` keeps compiling.
//
// This module imports the JSON once and exposes it as a typed `Question[]`.
// Structural/validity filtering (Requirement 10.6) is performed downstream by
// `questionSelector` via `isValidQuestion`; this loader only provides the typed
// array so callers do not have to repeat the cast.

import type { Question } from './types';
import rawQuestions from '../data/hskQuestions.json';

/** The full HSK question bank, typed as `Question[]`. */
export const questionBank: Question[] = rawQuestions as Question[];

/** Returns the question bank as `Question[]`. */
export function loadQuestionBank(): Question[] {
  return questionBank;
}
