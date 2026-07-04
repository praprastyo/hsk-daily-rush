# HSK Daily Rush - Folder & File Architecture Specification

A Mobile-First, Immersive, Gamified EdTech App for HSK Practice.

## 1. Project Directory Structure

```
hsk-daily-rush/
├── .github/                   # CI/CD Workflows
├── public/                    # Static assets (icons, placeholder sound files, etc.)
│   └── audio/                 # Sound effects (ding, buzz, whoosh, chime)
├── src/
│   ├── assets/                # Local images, SVG icons, visual assets
│   ├── components/            # UI components and layout blocks
│   │   ├── layout/            # Layout configurations (Header, Navigation, Mobile Container)
│   │   ├── ui/                # Bubbly 3D UI primitives (Buttons, Cards, Progress Bars)
│   │   │   ├── Button.tsx     # Reusable Duolingo-style 3D bubbly button
│   │   │   ├── Card.tsx       # Bubbly 3D cards
│   │   │   └── ProgressBar.tsx# Gamified indicator/progress bar
│   │   └── games/             # Game interactions by type
│   │       ├── ChatBubble.tsx # Chat dialog components with typing effects
│   │       ├── ConnectionLine.tsx # SVG Canvas connector lines for grammar matching
│   │       ├── MatchGrammar.tsx   # Match Grammar game interaction
│   │       ├── PinyinDragDrop.tsx # Drag & drop character/Pinyin order interactions
│   │       └── ManualInput.tsx    # Manual form inputs with real-time feedback
│   ├── hooks/                 # Reusable React custom hooks
│   │   ├── useAudio.ts        # Web Audio API hook for game sounds
│   │   └── useHaptic.ts       # Haptic vibration wrapper hook
│   ├── store/                 # Global Zustand state management
│   │   └── useGameStore.ts    # Centralized state (hearts, score, streaks, hints)
│   ├── types/                 # TypeScript type and interface declarations
│   │   └── game.types.ts      # Typing for HSK task levels, scores, questions, user data
│   ├── utils/                 # General-purpose utility functions
│   │   ├── dailyReset.ts      # Checks and triggers daily reset of hints & streaks
│   │   └── soundSynth.ts      # Audio synthesizers (Web Audio API synth fallback if MP3s missing)
│   ├── App.tsx                # Main Router / Dashboard View switcher
│   ├── index.css              # Global styles & Tailwind CSS v4 variables
│   └── main.tsx               # Entrypoint mounting App component
├── ARCHITECTURE.md            # Structural blueprint (this file)
├── package.json               # Package configuration
├── tailwind.config.js         # Tailwind settings (optional if configured via css or vite plugin)
└── vite.config.ts             # Vite configurations including `@tailwindcss/vite`
```

## 2. Technical Stack Specification

* **Vite + React (TypeScript):** Provides fast HMR and clean module management.
* **Tailwind CSS v4:** Direct compile-time stylesheet optimization.
* **Framer Motion:** Handles elastic, juicy micro-interactions, drag animations, state changes.
* **Zustand:** Simplified hooks-based stores with native `persist` middleware.
* **Web Audio API:** Provides programmatic audio synthesis and playback fallback to avoid heavy static payloads.
* **HTML5 Canvas / SVG:** Renders connection lines for matching games.
* **localStorage:** Stores game progress, streaks, daily hints limit, and high scores.