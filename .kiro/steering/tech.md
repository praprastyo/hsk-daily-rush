# Tech Stack

## Core
- **React 19** + **TypeScript** (function components only, ES modules, `"type": "module"`)
- **Vite 8** for dev server, HMR, and production build
- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin (config lives in CSS/Vite plugin, not a `tailwind.config.js`)

## Key libraries
- **Zustand 5** — global state with the `persist` middleware (localStorage). Single store at `src/store/useGameStore.ts`.
- **Framer Motion** — animations, transitions, and "juicy" micro-interactions.
- **lucide-react** — icon set.
- **Web Audio API** — programmatic sound synthesis in `src/utils/soundSynth.ts` (no static audio payloads required).
- **Navigator Vibration API** — haptics via the `useHaptic` hook.

## Persistence
- Game progress (hearts, score, best score, streak, hints, last played date) persists to **localStorage** under the key `hsk-daily-rush-storage`. There is no backend.

## Common commands
```bash
npm run dev      # start Vite dev server with HMR
npm run build    # type-check (tsc -b) then production build
npm run preview  # preview the production build locally
npm run lint     # run ESLint over the project
```

## Conventions
- TypeScript is configured across `tsconfig.json`, `tsconfig.app.json`, and `tsconfig.node.json`.
- ESLint flat config in `eslint.config.js` with `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`.
- Prefer the existing APIs over adding dependencies: use Zustand for shared state, `soundSynth` for audio, and `useHaptic` for vibration.
- The React Compiler is intentionally not enabled.

## Notes for changes
- This is a client-only app — do not introduce server code, network calls, or auth without explicit direction.
- Long-running processes (`npm run dev`, `preview`) should be started manually by the user, not run as blocking commands.
