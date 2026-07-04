import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GameState {
  // Game states
  hearts: number;
  score: number;
  bestScore: number;
  dailyStreak: number;
  hintsRemaining: number;
  lastPlayedDate: string | null; // ISO string or local date YYYY-MM-DD
  activeMode: 'streak' | 'timeAttack' | 'suddenDeath' | null;

  // Actions
  setMode: (mode: 'streak' | 'timeAttack' | 'suddenDeath' | null) => void;
  resetGame: () => void;
  useHint: () => boolean;
  gainHeart: () => void;
  loseHeart: () => void;
  addScore: (points: number) => void;
  checkDailyReset: () => void;
  incrementStreak: () => void;
}

const MAX_HEARTS = 3;
const MAX_HINTS = 3;

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      hearts: MAX_HEARTS,
      score: 0,
      bestScore: 0,
      dailyStreak: 0,
      hintsRemaining: MAX_HINTS,
      lastPlayedDate: null,
      activeMode: null,

      setMode: (mode) => {
        set({ activeMode: mode });
        if (mode === 'suddenDeath') {
          set({ hearts: MAX_HEARTS });
        }
      },

      resetGame: () => {
        set({
          hearts: MAX_HEARTS,
          score: 0,
        });
      },

      useHint: () => {
        const { hintsRemaining } = get();
        if (hintsRemaining > 0) {
          set({ hintsRemaining: hintsRemaining - 1 });
          return true;
        }
        return false;
      },

      gainHeart: () => {
        set((state) => ({
          hearts: Math.min(state.hearts + 1, MAX_HEARTS),
        }));
      },

      loseHeart: () => {
        set((state) => ({
          hearts: Math.max(state.hearts - 1, 0),
        }));
      },

      addScore: (points) => {
        set((state) => {
          const newScore = state.score + points;
          const newBest = Math.max(newScore, state.bestScore);
          return {
            score: newScore,
            bestScore: newBest,
          };
        });
      },

      incrementStreak: () => {
        const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const { lastPlayedDate, dailyStreak } = get();

        if (lastPlayedDate === todayStr) {
          return; // Already updated today
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-CA');

        if (lastPlayedDate === yesterdayStr || lastPlayedDate === null) {
          set({
            dailyStreak: dailyStreak + 1,
            lastPlayedDate: todayStr,
          });
        } else {
          // Streak broken
          set({
            dailyStreak: 1,
            lastPlayedDate: todayStr,
          });
        }
      },

      checkDailyReset: () => {
        const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const { lastPlayedDate } = get();

        if (lastPlayedDate !== todayStr) {
          // If the day is completely new, reset daily hints to 3
          set({
            hintsRemaining: MAX_HINTS,
          });

          // Check if streak is broken (more than 1 day missed)
          if (lastPlayedDate) {
            const lastPlay = new Date(lastPlayedDate);
            const today = new Date(todayStr);
            const diffTime = Math.abs(today.getTime() - lastPlay.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 1) {
              set({ dailyStreak: 0 });
            }
          }
        }
      },
    }),
    {
      name: 'hsk-daily-rush-storage', // Key in localStorage
    }
  )
);