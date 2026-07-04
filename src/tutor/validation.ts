// Hanzi validation and question-validity guard for the HSK Master AI tutor.
//
// This module is the single enforcement point for Requirement 2 (full-Hanzi
// question surface) and Requirement 10 (question-bank structural validity).
// All functions are pure and operate on trusted/untrusted data at boundaries,
// so they make no assumptions about their inputs beyond their declared types.

import {
  AUTHENTIC_FORMATS,
  type AnswerChoice,
  type HskLevel,
  type Question,
  type VocabEntry,
} from './types';

/** The ordered set of valid multiple-choice labels (Requirement 2.6, 10.3). */
const VALID_LABELS = ['A', 'B', 'C', 'D'] as const;

/**
 * CJK punctuation permitted inside a Hanzi-only surface (Requirement 2).
 * The design lists `，。？！：；、「」（）` as examples; we permit that set plus
 * the common companions a question body might legitimately contain. Notably we do
 * NOT permit fullwidth Latin letters or fullwidth digits — only punctuation marks.
 */
const PERMITTED_PUNCTUATION = new Set<string>([
  '，', '。', '？', '！', '：', '；', '、',
  '「', '」', '『', '』', '（', '）', '《', '》', '【', '】', '〈', '〉',
  '·', '…', '—', '～', '‥', '﹏', '．', '“', '”', '‘', '’',
]);

/** Matches a single character that belongs to the Han (CJK ideograph) script. */
const HAN_CHAR = /\p{Script=Han}/u;

/** Matches a single whitespace character. */
const WHITESPACE = /\s/;

/**
 * Returns true when every character of `text` is a Han ideograph, permitted CJK
 * punctuation, or whitespace. Latin letters (a–z, A–Z), Pinyin tone-marked vowels
 * (ā á ǎ à …), and digits used as text are rejected because they fall outside the
 * whitelist. (Requirements 2.1–2.5)
 */
export function isHanziOnly(text: string): boolean {
  if (typeof text !== 'string') return false;
  // Iterate by code point so astral-plane (extension) ideographs are handled correctly.
  for (const ch of text) {
    if (HAN_CHAR.test(ch)) continue;
    if (PERMITTED_PUNCTUATION.has(ch)) continue;
    if (WHITESPACE.test(ch)) continue;
    return false;
  }
  return true;
}

/**
 * Returns true when the question's learner-facing surface — its body, its reading
 * text (when present), and every answer choice's text — is Hanzi-only. This is the
 * render-time guard used as defense in depth by the QuestionRenderer. (Requirement 2)
 */
export function assertQuestionSurfaceHanzi(q: Question): boolean {
  if (!isHanziOnly(q.body)) return false;
  if (q.readingText !== undefined && !isHanziOnly(q.readingText)) return false;
  for (const choice of q.choices) {
    if (!isHanziOnly(choice.hanzi)) return false;
  }
  return true;
}

/** Narrowing guard: a non-empty string. */
function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

/** Narrowing guard: an integer HSK level in the range 1..6. */
function isHskLevel(v: unknown): v is HskLevel {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 6;
}

/**
 * Validates the answer-choice set: a non-empty array whose labels form an ordered
 * prefix of A, B, C, D (which simultaneously guarantees ordering and uniqueness),
 * each carrying non-empty Hanzi-only text. (Requirements 2.3, 2.6, 10.3)
 */
function areChoicesValid(choices: unknown): choices is AnswerChoice[] {
  if (!Array.isArray(choices)) return false;
  if (choices.length === 0 || choices.length > VALID_LABELS.length) return false;
  for (let i = 0; i < choices.length; i++) {
    const c = choices[i];
    if (typeof c !== 'object' || c === null) return false;
    const { label, hanzi } = c as { label?: unknown; hanzi?: unknown };
    // Ordered prefix of A–D guarantees both correct order and no duplicates.
    if (label !== VALID_LABELS[i]) return false;
    if (!isNonEmptyString(hanzi) || !isHanziOnly(hanzi)) return false;
  }
  return true;
}

/**
 * Validates a single vocabulary entry: non-empty Hanzi, Pinyin, and Indonesian
 * meaning, plus a level in 1..6. (Requirements 5.4, 10.5)
 */
function isVocabEntryComplete(v: unknown): v is VocabEntry {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as { hanzi?: unknown; pinyin?: unknown; meaningId?: unknown; level?: unknown };
  return (
    isNonEmptyString(e.hanzi) &&
    isNonEmptyString(e.pinyin) &&
    isNonEmptyString(e.meaningId) &&
    isHskLevel(e.level)
  );
}

/**
 * Full structural validity guard for a question record (Requirement 10). A record
 * is valid — and therefore eligible for selection — iff:
 *  - `id` is a number;
 *  - `level` is an integer in 1..6;
 *  - `format` is a known authentic HSK format identifier;
 *  - `body` is a non-empty Hanzi-only string;
 *  - `readingText`, when present, is Hanzi-only;
 *  - `choices` is a non-empty A–D-ordered set of unique Hanzi-only choices;
 *  - `correctLabel` is one of the present choice labels;
 *  - `explanationId` is a non-empty string;
 *  - `vocab` has at least one complete entry.
 * Otherwise the record is excluded. (Requirement 10.6)
 */
export function isValidQuestion(q: unknown): q is Question {
  if (typeof q !== 'object' || q === null) return false;
  const r = q as Record<string, unknown>;

  if (typeof r.id !== 'number') return false;
  if (!isHskLevel(r.level)) return false;
  if (typeof r.format !== 'string' || !(AUTHENTIC_FORMATS as readonly string[]).includes(r.format)) {
    return false;
  }
  if (!isNonEmptyString(r.body) || !isHanziOnly(r.body)) return false;
  if (r.readingText !== undefined) {
    if (typeof r.readingText !== 'string' || !isHanziOnly(r.readingText)) return false;
  }
  if (!areChoicesValid(r.choices)) return false;

  const correctLabel = r.correctLabel;
  if (
    correctLabel !== 'A' &&
    correctLabel !== 'B' &&
    correctLabel !== 'C' &&
    correctLabel !== 'D'
  ) {
    return false;
  }
  // The correct label must correspond to one of the present choices.
  if (!r.choices.some((c) => (c as AnswerChoice).label === correctLabel)) return false;

  if (!isNonEmptyString(r.explanationId)) return false;

  if (!Array.isArray(r.vocab) || r.vocab.length < 1) return false;
  if (!r.vocab.every(isVocabEntryComplete)) return false;

  return true;
}
