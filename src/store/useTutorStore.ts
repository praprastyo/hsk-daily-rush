// Zustand store for the HSK Master AI tutor.
//
// This is the thin state layer between the React presentation components and
// the pure-logic core (`tutorEngine.reduce`). It owns the live `TutorState` and
// the most recent ordered `responseBlocks`, and exposes a single `dispatch`
// action that runs the reducer and stores its output.
//
// Persistence (Requirements 7.1–7.4) uses Zustand's `persist` middleware keyed
// to `hsk-master-ai-progress` (mirroring the existing `useGameStore` pattern).
// Only the learner's progress is persisted — and only the serialized subset
// (name, level, correct, wrong, streak); accuracy is intentionally NOT stored
// and is recomputed from the loaded counts on every render (Requirement 7.3).
//
// On a reload the conversation itself starts fresh (phase `greeting`, empty
// `answeredIds`, no current question) but the persisted progress counts, name,
// and level are merged back in, so the learner keeps their score across reloads.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { initialState, reduce } from '../tutor/tutorEngine';
import { questionBank } from '../tutor/questionBank';
import { deserialize, serialize, withDefaults } from '../tutor/persistence';
import type { ResponseBlock, TutorEvent, TutorState } from '../tutor/types';

/** localStorage key for persisted tutor progress (Requirement 7.1). */
const STORAGE_KEY = 'hsk-master-ai-progress';

/** Shape of the tutor store: live FSM state, latest output blocks, and dispatch. */
export interface TutorStore {
  /** The current tutor finite-state-machine state. */
  state: TutorState;
  /** The ordered response blocks produced by the most recent dispatch. */
  responseBlocks: ResponseBlock[];
  /**
   * Feed a learner event through the pure reducer and store the result.
   * The reducer is the single source of truth; the store only persists progress
   * (via `partialize` below) and holds the rendered blocks.
   */
  dispatch: (event: TutorEvent) => void;
}

/** The only slice of the store that is persisted: the serialized progress. */
interface PersistedTutor {
  progress: ReturnType<typeof serialize>;
}

export const useTutorStore = create<TutorStore>()(
  persist(
    (set, get) => ({
      state: initialState(),
      responseBlocks: [],

      dispatch: (event) => {
        const { state } = get();
        const result = reduce(state, event, questionBank);
        set({ state: result.state, responseBlocks: result.responseBlocks });
      },
    }),
    {
      name: STORAGE_KEY,

      // Persist ONLY the progress, in its serialized form. Accuracy is derived,
      // never stored (Requirements 7.1, 7.3).
      partialize: (store): PersistedTutor => ({
        progress: serialize(store.state.session.progress),
      }),

      // Rehydrate defensively (Requirements 7.2–7.4): deserialize the persisted
      // progress, fall back to zeroed defaults when it is missing/corrupt, then
      // merge it into a FRESH initial state so a reload starts a new conversation
      // while retaining the learner's name, level, and counts. Accuracy is
      // recomputed downstream from the loaded counts (Requirement 7.3).
      merge: (persisted, current) => {
        const fresh = current.state ?? initialState();
        const persistedProgress = (persisted as PersistedTutor | undefined)
          ?.progress;
        const progress = withDefaults(deserialize(persistedProgress ?? null));

        return {
          ...current,
          state: {
            ...fresh,
            session: { ...fresh.session, progress },
          },
        };
      },
    }
  )
);
