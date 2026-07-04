# Project Structure

## Top level
```
china-hsk/
├── public/              # static assets served as-is
├── src/                 # application source
├── dist/                # build output (generated)
├── .kiro/               # specs and steering
├── index.html           # Vite HTML entrypoint
├── vite.config.ts       # Vite + React + Tailwind plugins
├── eslint.config.js     # ESLint flat config
├── tsconfig*.json        # TS project references (root / app / node)
├── ARCHITECTURE.md       # aspirational blueprint (see note below)
└── package.json
```

## `src/` layout
```
src/
├── main.tsx             # mounts <App /> into #root
├── App.tsx              # root component: view switcher + all game logic & rendering
├── index.css            # global styles + Tailwind v4 setup
├── App.css              # component-scoped global styles
├── assets/              # local images / SVGs (hero, logos)
├── components/
│   ├── PinyinChart.tsx  # pinyin reference modal with tone playback
│   └── ui/              # reusable UI primitives (e.g. Button)
├── data/
│   └── questions.json   # the HSK question pool (imported directly into App)
├── hooks/
│   └── useHaptic.ts     # vibration wrapper hook
├── store/
│   └── useGameStore.ts  # single Zustand store (persisted game state + actions)
└── utils/
    ├── shuffle.ts       # array shuffle for randomizing question order
    └── soundSynth.ts    # Web Audio synthesizers + playSound/playPinyinTone
```

## Organization conventions
- **Components** use PascalCase filenames and named exports (e.g. `export function PinyinChart`). `App` is the default export.
- **Hooks** live in `src/hooks/`, are named `useX`, and use camelCase filenames.
- **State**: shared/persisted game state belongs in `useGameStore`. Transient, view-specific state (selected answers, timers, typing flags) stays as local `useState` inside `App.tsx`.
- **Question data** is typed via the `Question` interface (currently declared in `App.tsx`) and loaded from `data/questions.json`. New question types must be added to that union and handled in the render + `handleCheckAnswer` + `handleUseHint` branches.
- **Styling** is Tailwind utility classes inline in JSX. Brand colors appear as literals (e.g. `#FFD100` yellow, `#58CC02` green, `#1CB0F6` blue, `#FF4B4B` red) — reuse these for consistency.
- **Feedback pattern**: interactions typically combine `playSound(...)`, `triggerHaptic(...)`, and a Framer Motion animation. Follow this trio when adding new interactive elements.

## Note on ARCHITECTURE.md
`ARCHITECTURE.md` describes a fuller, planned structure (e.g. `components/games/`, `components/layout/`, `types/game.types.ts`, `hooks/useAudio.ts`, `utils/dailyReset.ts`). Much of this is not yet implemented — the current code keeps game logic centralized in `App.tsx`. Treat ARCHITECTURE.md as a target direction, but match the **actual** structure above when editing existing code. Extracting types and game components into dedicated files is welcome when it reduces `App.tsx` complexity.
