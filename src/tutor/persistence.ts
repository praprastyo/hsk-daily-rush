// Progress persistence serialization for the HSK Master AI tutor.
// Pure helpers used by the Zustand store to serialize progress to client-side
// storage and to defensively rehydrate it on load.
//
// Accuracy is intentionally NOT persisted; it is recomputed on load from the
// correct/wrong counts (Requirement 7.3).

import type { HskLevel, Progress } from './types';

/**
 * The persisted shape written to client-side storage (Requirement 7.1).
 * Mirrors {@link Progress} minus any derived values (accuracy is recomputed).
 */
export interface PersistedProgress {
  name: string;
  level: HskLevel;
  correct: number;
  wrong: number;
  streak: number;
}

/** A sensible empty progress used when nothing readable is persisted. */
const DEFAULT_PROGRESS: Progress = {
  name: '',
  level: 1,
  correct: 0,
  wrong: 0,
  streak: 0,
};

/** True for a finite, non-negative number (rejects NaN, Infinity, negatives). */
function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** True for an integer level in the valid HSK range 1..6 (Requirement 10.1). */
function isHskLevel(value: unknown): value is HskLevel {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 6
  );
}

/**
 * Serialize progress for persistence (Requirement 7.1).
 * Stores name, level, correct, wrong, and streak; accuracy is omitted and
 * recomputed on load (Requirement 7.3).
 */
export function serialize(p: Progress): PersistedProgress {
  return {
    name: p.name,
    level: p.level,
    correct: p.correct,
    wrong: p.wrong,
    streak: p.streak,
  };
}

/**
 * Defensively parse persisted progress (Requirement 7.2).
 * `raw` may be an already-parsed object or anything at all. Returns a valid
 * {@link Progress} when the input has the correct shape, otherwise `null` on
 * missing, malformed, or corrupt input (Requirement 7.4).
 */
export function deserialize(raw: unknown): Progress | null {
  if (raw === null || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Record<string, unknown>;

  if (typeof candidate.name !== 'string') {
    return null;
  }
  if (!isHskLevel(candidate.level)) {
    return null;
  }
  if (
    !isNonNegativeNumber(candidate.correct) ||
    !isNonNegativeNumber(candidate.wrong) ||
    !isNonNegativeNumber(candidate.streak)
  ) {
    return null;
  }

  return {
    name: candidate.name,
    level: candidate.level,
    correct: candidate.correct,
    wrong: candidate.wrong,
    streak: candidate.streak,
  };
}

/**
 * Provide default progress when loaded data is absent (Requirement 7.4).
 * Returns zeros for correct/wrong/streak (and an empty name at level 1) when
 * `loaded` is null; otherwise returns the loaded progress unchanged.
 */
export function withDefaults(loaded: Progress | null): Progress {
  if (loaded === null) {
    return { ...DEFAULT_PROGRESS };
  }
  return loaded;
}
