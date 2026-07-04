// Pure progress-tracking logic for the HSK Master AI tutor.
// All functions are pure: they return a new Progress object and never mutate
// their inputs. This module is the single source of truth for count/streak
// updates (Requirements 6.1–6.4), accuracy math (6.5, 6.6), and level changes (6.7).

import type { HskLevel, Progress } from './types';
import type { EvalResult } from './evaluator';

/**
 * Apply an evaluation result to a progress state (Requirements 6.1–6.4).
 *
 * - `correct`: correct + 1, streak + 1, wrong unchanged.
 * - `wrong`:   wrong + 1, streak reset to 0, correct unchanged.
 * - `invalid`: no change (returns the progress unchanged).
 *
 * Pure: returns a new Progress, never mutates the input.
 */
export function applyResult(p: Progress, result: EvalResult): Progress {
  switch (result.kind) {
    case 'correct':
      return { ...p, correct: p.correct + 1, streak: p.streak + 1 };
    case 'wrong':
      return { ...p, wrong: p.wrong + 1, streak: 0 };
    case 'invalid':
      return p;
  }
}

/**
 * Compute accuracy as a percentage (Requirements 6.5, 6.6).
 *
 * Returns 0 when no question has been answered (correct + wrong === 0);
 * otherwise correct / (correct + wrong) * 100. The raw percentage is returned
 * without rounding.
 */
export function accuracyPercent(p: Progress): number {
  const answered = p.correct + p.wrong;
  if (answered === 0) {
    return 0;
  }
  return (p.correct / answered) * 100;
}

/**
 * Update the current HSK level (Requirement 6.7).
 *
 * Pure: returns a new Progress with the updated level while preserving the
 * name, correct count, wrong count, and streak.
 */
export function setLevel(p: Progress, level: HskLevel): Progress {
  return { ...p, level };
}
