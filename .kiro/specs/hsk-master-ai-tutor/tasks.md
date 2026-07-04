# Implementation Plan: HSK Master AI Tutor

## Overview

This plan implements the HSK Master AI tutor as a deterministic pure-function core (`validation`, `questionSelector`, `evaluator`, `progress`, `persistence`, `tutorEngine`) wrapped by a Zustand store and a thin React presentation layer, per the approved design. Work proceeds bottom-up: testing infrastructure and shared types first, then each pure module with its property-based tests, then the FSM engine that orchestrates them, then the store, components, and app wiring.

Implementation language is **TypeScript** (React 19 + Vite + Zustand), matching the design and existing codebase. Property-based tests use **Vitest + fast-check**; component tests use **@testing-library/react + jsdom**. Each of Properties 1–26 is implemented as a single property-based test running a minimum of 100 iterations and tagged with `// Feature: hsk-master-ai-tutor, Property {n}: ...`.

## Tasks

- [x] 1. Set up testing infrastructure and shared domain types
  - [x] 1.1 Configure the test toolchain
    - Add dev dependencies: `vitest`, `fast-check`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
    - Create `vitest.config.ts` (or extend `vite.config.ts`) with `jsdom` environment and globals enabled
    - Add `"test": "vitest --run"` script to `package.json` (single-run mode, not watch)
    - Verify the runner executes with a trivial smoke test
    - _Requirements: 10.6 (testability foundation)_

  - [x] 1.2 Define core domain types
    - Create `src/tutor/types.ts` with `HskLevel`, `QuestionFormat`, `VocabEntry`, `AnswerChoice`, `Question`, `Progress`, `SessionState`, `Phase`, `TutorEvent`, `TutorState`, `EngineResult`, `ResponseBlock`
    - Export the authentic-format identifier set used for validity/selection checks
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 2. Implement Hanzi validation and question validity guard
  - [x] 2.1 Implement `src/tutor/validation.ts`
    - Implement `isHanziOnly` (permit CJK ideographs + listed CJK punctuation + whitespace; reject Latin letters, tone-marked vowels, digit-as-text)
    - Implement `assertQuestionSurfaceHanzi` (checks body, readingText when present, every choice)
    - Implement `isValidQuestion` (full structural validity per design: id, level 1..6, known format, non-empty Hanzi-only body, A–D-ordered unique Hanzi-only choices, correctLabel among choices, non-empty explanationId, ≥1 complete vocab entry)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 2.2 Write property test for Hanzi-only question surface
    - **Property 4: Question surface is Hanzi-only**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
    - Use `genValidQuestion` and `genNonHanziString` for negative coverage (Latin, tone-marked vowels, digits)

  - [ ]* 2.3 Write property test for answer-choice labeling
    - **Property 5: Answer choices are labeled A–D in order without duplicates**
    - **Validates: Requirements 2.6**

- [x] 3. Create the HSK Question_Bank data source
  - [x] 3.1 Author the new HSK question bank conforming to the schema
    - Replace the legacy Pinyin-drill data in `src/data/questions.json` with authentic per-level HSK questions conforming to the `Question` schema (per design data-model decision), or expose it via a typed loader module `src/tutor/questionBank.ts`
    - Populate questions across HSK Levels 1–6 with Hanzi-only `body`/`readingText`/`choices`, `correctLabel`, `explanationId`, and ≥1 complete `vocab` entry each
    - Provide a typed import/loader returning `Question[]`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 4. Implement question selection
  - [x] 4.1 Implement `src/tutor/questionSelector.ts`
    - Implement `eligibleQuestions` (filter by `level === currentLevel`, exclude `answeredIds`, exclude records failing `isValidQuestion`)
    - Implement `selectNextQuestion` (return one eligible question via seedable shuffle, or `null` when none remain)
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 10.6_

  - [ ]* 4.2 Write property test for level-matched selection
    - **Property 6: Selected question matches the current level**
    - **Validates: Requirements 3.1**

  - [ ]* 4.3 Write property test for no-repeat selection
    - **Property 7: Selection never repeats an answered question while unanswered ones remain**
    - **Validates: Requirements 3.2**

  - [ ]* 4.4 Write property test for authentic-format selection
    - **Property 10: Selected questions conform to an authentic format for the level**
    - **Validates: Requirements 3.5**

  - [ ]* 4.5 Write property test for exclusion of malformed records
    - **Property 26: Invalid question records are never selected**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.6**
    - Use `genQuestionBank` mixing valid and deliberately malformed records

- [x] 5. Implement answer evaluation
  - [x] 5.1 Implement `src/tutor/evaluator.ts`
    - Implement `evaluate(question, submitted)` returning `correct` | `wrong` (with `correctAnswer`) | `invalid`
    - Normalize label comparison (trim, case-insensitive on A/B/C/D); non-label input yields `invalid`
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [ ]* 5.2 Write property test for correct-label evaluation
    - **Property 11: Correct label evaluates as correct**
    - **Validates: Requirements 4.2**

  - [ ]* 5.3 Write property test for wrong-label evaluation
    - **Property 12: A valid wrong label evaluates as wrong and reveals the correct answer**
    - **Validates: Requirements 4.3**

  - [ ]* 5.4 Write unit tests for invalid-label edge cases
    - Cover empty string, whitespace, lowercase, and out-of-range labels (E, 1)
    - _Requirements: 4.5_

- [x] 6. Implement progress tracking
  - [x] 6.1 Implement `src/tutor/progress.ts`
    - Implement `applyResult` (correct: +1 correct, +1 streak; wrong: +1 wrong, streak→0; invalid: no change)
    - Implement `accuracyPercent` (0 when correct+wrong===0, else correct/(correct+wrong)*100)
    - Implement `setLevel` (updates level, preserves counts/streak)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 6.2 Write property test for level change preserving counts
    - **Property 2: Valid level selection updates current level and preserves counts**
    - **Validates: Requirements 1.5, 6.7**

  - [ ]* 6.3 Write property test for count and streak updates
    - **Property 16: Result application updates counts and streak correctly**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [ ]* 6.4 Write property test for accuracy computation
    - **Property 17: Accuracy equals the correct ratio, and zero when nothing is answered**
    - **Validates: Requirements 6.5, 6.6**
    - Generator must include the `correct == 0 && wrong == 0` edge case

- [x] 7. Implement progress persistence
  - [x] 7.1 Implement `src/tutor/persistence.ts`
    - Implement `serialize` (name, level, correct, wrong, streak; accuracy omitted)
    - Implement `deserialize` (returns `null` on missing/malformed/corrupt input)
    - Implement `withDefaults` (zeros for correct/wrong/streak when loaded is null)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 7.2 Write property test for persistence round-trip
    - **Property 18: Progress persistence round-trips and recomputes accuracy**
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [ ]* 7.3 Write property test for missing/unreadable data defaults
    - **Property 19: Missing or unreadable persisted data initializes to zeros**
    - **Validates: Requirements 7.4**

- [x] 8. Checkpoint - Ensure all core-module tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement the tutor FSM engine
  - [x] 9.1 Implement onboarding phases of `src/tutor/tutorEngine.ts`
    - Implement the `reduce(state, event, bank)` skeleton and `EngineResult` assembly
    - Handle `start` (greeting with Mandarin + Indonesian), `submitName` (store non-empty name; re-prompt on empty/whitespace), `submitLevel` (store valid 1..6; error + stay on out-of-range), and name-skip when already recorded
    - Append a progress-card block to every output response as a cross-cutting step
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 8.1, 8.2, 8.4_

  - [x] 9.2 Implement question presentation and evaluation flow
    - Handle `presenting` (select one question via `questionSelector`, await answer), `submitAnswer` (evaluate, apply progress, generate vocab table from the question), and ordered `responseBlocks` (result → explanation → vocabTable → progressCard) followed by an offer block
    - Emit `error` and remain in `awaitingAnswer` (no progress change) on invalid answer
    - Enter `levelExhausted` with an advance/change/stop offer when no eligible question remains
    - _Requirements: 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.3, 5.4, 9.1, 9.2, 9.3, 9.4, 3.3_

  - [x] 9.3 Implement offering, change-level, and stop transitions
    - Handle `continue` (present next question at current level), `changeLevel` (re-request level then present at new level), and `stop` (closing message + progress card, transition to `closed`)
    - _Requirements: 9.5, 9.6, 9.7_

  - [ ]* 9.4 Write property test for stored name
    - **Property 1: Provided name is stored**
    - **Validates: Requirements 1.4**

  - [ ]* 9.5 Write property test for out-of-range level rejection
    - **Property 3: Out-of-range level is rejected**
    - **Validates: Requirements 1.6**

  - [ ]* 9.6 Write property test for single-question presentation
    - **Property 9: Presenting yields exactly one question, then waits**
    - **Validates: Requirements 3.4, 9.1, 9.2**

  - [ ]* 9.7 Write property test for exhausted-level handling
    - **Property 8: Exhausted level offers advance, change, or stop and presents no question**
    - **Validates: Requirements 3.3**

  - [ ]* 9.8 Write property test for invalid-answer handling
    - **Property 13: Invalid answers are rejected without changing progress**
    - **Validates: Requirements 4.5**
    - Generator must include arbitrary non-label answer strings

  - [ ]* 9.9 Write property test for vocabulary table contents
    - **Property 14: Vocabulary table is non-empty and drawn from the question**
    - **Validates: Requirements 5.3**

  - [ ]* 9.10 Write property test for vocabulary entry completeness
    - **Property 15: Every vocabulary entry populates all four columns**
    - **Validates: Requirements 5.4, 10.5**

  - [ ]* 9.11 Write property test for evaluation-content ordering
    - **Property 22: Evaluation content appears in the required order**
    - **Validates: Requirements 9.3, 4.4, 5.1**

  - [ ]* 9.12 Write property test for post-evaluation offer
    - **Property 23: Evaluation is followed by an offer of continue, change level, or stop**
    - **Validates: Requirements 9.4**

  - [ ]* 9.13 Write property test for change-level then present
    - **Property 24: Changing level then choosing a new level presents a question at that level**
    - **Validates: Requirements 9.5, 9.6**

  - [ ]* 9.14 Write property test for stop closing the session
    - **Property 25: Stopping closes the session with a progress card**
    - **Validates: Requirements 9.7**

  - [ ]* 9.15 Write property test for progress card on every response
    - **Property 20: Every response ends with a progress card**
    - **Validates: Requirements 8.1**

  - [ ]* 9.16 Write property test for progress card contents
    - **Property 21: Progress card contains all required values as a percentage accuracy**
    - **Validates: Requirements 8.2, 8.4**

- [x] 10. Implement the Zustand store
  - [x] 10.1 Implement `src/store/useTutorStore.ts`
    - Create the store with `persist` middleware keyed `hsk-master-ai-progress`, holding `TutorState` and `responseBlocks`
    - Expose `dispatch(event)` that calls `reduce`, persists progress via `serialize`, and stores response blocks
    - Hydrate on init via `deserialize` / `withDefaults`; recompute accuracy from loaded counts
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 11. Implement the React presentation layer
  - [x] 11.1 Implement `src/components/tutor/QuestionRenderer.tsx`
    - Render body, reading text, and A–D choices; refuse to display any surface text failing `assertQuestionSurfaceHanzi` (defense in depth)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 11.2 Implement `src/components/tutor/VocabularyTable.tsx`
    - Render columns in fixed order: Hanzi, Pinyin, Meaning (Indonesian), HSK Level
    - _Requirements: 5.2, 5.4_

  - [x] 11.3 Implement `src/components/tutor/ProgressCard.tsx`
    - Render labels Name, Current Level, Correct, Wrong, Accuracy, Streak; show Accuracy as a percentage
    - _Requirements: 8.2, 8.3, 8.4_

  - [x] 11.4 Implement `src/components/tutor/TutorView.tsx`
    - Subscribe to `useTutorStore`, dispatch events, render ordered `responseBlocks` followed by the Progress Card
    - _Requirements: 8.1, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 11.5 Write component example/snapshot tests
    - Greeting contains both Mandarin and Indonesian text (1.1)
    - Onboarding requests name then level when none recorded (1.2, 1.3); skips name when recorded (1.7)
    - Vocabulary Table renders columns Hanzi, Pinyin, Meaning (Indonesian), HSK Level in that exact order (5.2)
    - Progress Card renders labels Name, Current Level, Correct, Wrong, Accuracy, Streak (8.3)
    - _Requirements: 1.1, 1.2, 1.3, 1.7, 5.2, 8.3_

- [x] 12. Wire the tutor into the application
  - [x] 12.1 Render `TutorView` from `src/App.tsx`
    - Add navigation/route or section so the tutor is reachable in the running app, connecting store and components end to end
    - _Requirements: 9.1_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each property test references a specific design property and the requirement clause it validates, runs ≥100 iterations, and is tagged with `// Feature: hsk-master-ai-tutor, Property {n}: ...`.
- Custom generators (`genHskLevel`, `genValidQuestion`, `genQuestionBank`, `genProgress`, `genNonHanziString`) should be shared across property tests; build them alongside the first test that needs them.
- Checkpoints provide incremental validation points; run `npm run test` (`vitest --run`) at each.
- Fixed-presentation criteria (1.1–1.3, 1.7, 5.2, 8.3) are covered by example/snapshot tests rather than properties, per the design.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "5.1", "6.1", "7.1"] },
    { "id": 2, "tasks": ["4.1", "2.2", "2.3", "5.2", "5.3", "5.4", "6.2", "6.3", "6.4", "7.2", "7.3"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "4.5", "9.1"] },
    { "id": 4, "tasks": ["9.2"] },
    { "id": 5, "tasks": ["9.3"] },
    { "id": 6, "tasks": ["9.4", "9.5", "9.6", "9.7", "9.8", "9.9", "9.10", "9.11", "9.12", "9.13", "9.14", "9.15", "9.16", "10.1"] },
    { "id": 7, "tasks": ["11.1", "11.2", "11.3"] },
    { "id": 8, "tasks": ["11.4"] },
    { "id": 9, "tasks": ["11.5", "12.1"] }
  ]
}
```
