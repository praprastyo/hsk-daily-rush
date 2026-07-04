// Question selection for the HSK Master AI tutor.
//
// Selection is a pure function over the question bank: it filters to questions
// that match the current level, have not yet been answered this session, and
// pass the full structural validity guard (so malformed records are never
// served — Requirement 10.6). One eligible question is then chosen via a
// seedable shuffle so selection is deterministic under test.
//
// Requirements: 3.1 (level match), 3.2 (no repeats), 3.3/3.5 (eligible/authentic),
// 10.6 (exclude malformed records).

import { isValidQuestion } from './validation';
import type { AnswerChoice, HskLevel, Question } from './types';

/** The ordered set of multiple-choice labels (Requirement 10.3). */
const LABELS = ['A', 'B', 'C', 'D'] as const;

/**
 * Returns every question that is eligible for selection at `level`:
 *  - `q.level === level` (Requirement 3.1);
 *  - `q.id` is NOT in `answeredIds` (Requirement 3.2);
 *  - `q` passes `isValidQuestion`, so malformed records are excluded (Requirement 10.6).
 *
 * The input bank is never mutated; a new array is returned.
 */
export function eligibleQuestions(
  bank: Question[],
  level: HskLevel,
  answeredIds: number[]
): Question[] {
  const answered = new Set(answeredIds);
  return bank.filter(
    (q) => isValidQuestion(q) && q.level === level && !answered.has(q.id)
  );
}

/**
 * Selects one eligible question for `level`, or `null` when none remain
 * (Requirements 3.2, 3.3). Selection uses a seedable shuffle so tests can pin
 * the outcome; by default it draws from `Math.random`.
 *
 * @param rng a function returning a float in [0, 1); defaults to `Math.random`.
 */
export function selectNextQuestion(
  bank: Question[],
  level: HskLevel,
  answeredIds: number[],
  rng: () => number = Math.random
): Question | null {
  const eligible = eligibleQuestions(bank, level, answeredIds);
  if (eligible.length === 0) return null;
  return seededShuffle(eligible, rng)[0];
}

/**
 * Returns a copy of `question` whose answer choices have been shuffled and then
 * relabeled to a clean A–D prefix, with `correctLabel` remapped to wherever the
 * originally-correct choice landed.
 *
 * This is what fixes the "answer is always A" problem: the raw bank records have
 * the correct choice listed first, so without shuffling the learner sees the
 * correct option in slot A almost every time. Shuffling here keeps the question
 * structurally valid (labels stay an ordered A–D prefix, per `areChoicesValid`)
 * while randomizing the visible position of the correct answer.
 *
 * The RNG is injectable so presentation stays deterministic under test; it
 * defaults to `Math.random`.
 */
export function shuffleChoices(
  question: Question,
  rng: () => number = Math.random
): Question {
  // Find the choice that is currently marked correct, then shuffle the set.
  const correctChoice = question.choices.find(
    (c) => c.label === question.correctLabel
  );
  const shuffled = seededShuffle(question.choices, rng);

  // Relabel to a fresh A–D prefix in the new order and track where the correct
  // choice ended up so we can remap `correctLabel`.
  let newCorrectLabel: AnswerChoice['label'] = question.correctLabel;
  const relabeled: AnswerChoice[] = shuffled.map((choice, index) => {
    const label = LABELS[index];
    if (correctChoice !== undefined && choice.hanzi === correctChoice.hanzi) {
      newCorrectLabel = label;
    }
    return { label, hanzi: choice.hanzi };
  });

  return { ...question, choices: relabeled, correctLabel: newCorrectLabel };
}

/**
 * Fisher–Yates shuffle driven by a caller-supplied RNG. Returns a new array and
 * leaves the input untouched. Pulling the RNG in as a parameter keeps selection
 * deterministic under test without altering the shared `utils/shuffle` helper.
 */
function seededShuffle<T>(input: readonly T[], rng: () => number): T[] {
  const result = input.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
