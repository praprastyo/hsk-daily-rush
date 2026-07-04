// Answer evaluation for the HSK Master AI tutor.
// Pure, label-based evaluation of a learner's submitted multiple-choice answer.
// See design.md "evaluator" and Requirements 4.1, 4.2, 4.3, 4.5.

import type { Question } from './types';

/**
 * The outcome of evaluating a submitted answer against a question.
 * - `correct`: the submitted label matches the question's recorded correct label.
 * - `wrong`: the submitted label is a valid choice label other than the correct one;
 *   `correctAnswer` reveals the recorded correct label (Requirement 4.3).
 * - `invalid`: the submitted text is not one of the question's valid choice labels
 *   (Requirement 4.5); progress must not change on an invalid result.
 */
export type EvalResult =
  | { kind: 'correct' }
  | { kind: 'wrong'; correctAnswer: string }
  | { kind: 'invalid' };

/**
 * Evaluate a submitted answer against a question.
 *
 * Comparison is label-based and normalized: the submitted string is trimmed and
 * upper-cased, then it is only considered a valid label if it matches one of the
 * question's actual choice labels (the A/B/C/D labels present in `question.choices`).
 *
 * - Matching the question's `correctLabel` yields `{ kind: 'correct' }` (Requirement 4.2).
 * - Matching a different valid choice label yields
 *   `{ kind: 'wrong', correctAnswer: question.correctLabel }` (Requirement 4.3).
 * - Anything else (empty, whitespace, out-of-range labels, arbitrary text) yields
 *   `{ kind: 'invalid' }` (Requirement 4.5).
 */
export function evaluate(question: Question, submitted: string): EvalResult {
  const normalized = submitted.trim().toUpperCase();

  const isValidLabel = question.choices.some(
    (choice) => choice.label === normalized,
  );
  if (!isValidLabel) {
    return { kind: 'invalid' };
  }

  if (normalized === question.correctLabel) {
    return { kind: 'correct' };
  }

  return { kind: 'wrong', correctAnswer: question.correctLabel };
}
