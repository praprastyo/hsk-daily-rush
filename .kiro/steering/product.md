# Product

**HSK Daily Rush** is a mobile-first, gamified web app for practicing Chinese (HSK levels 1–6).

## Concept
A Duolingo-style, immersive, "juicy" learning experience with no login required. Progress is stored locally on the device. The UI copy is primarily in Indonesian (the target audience), so user-facing strings should be written in Indonesian unless told otherwise.

## Core gameplay
- Players answer a series of HSK practice tasks across several question types:
  - `conversation` — pick the correct chat reply
  - `match` — connect Mandarin terms to their translation ("tarik garis")
  - `pinyin_drag` — drag/drop pinyin syllables into the correct order
  - `manual` — type the answer
- Three game modes:
  - **Daily Streak** — keep a daily practice streak alive
  - **Time Attack** — answer as much as possible in 60 seconds
  - **Sudden Death** — 3 hearts (HP), one mistake costs a heart
- Supporting features: hearts/HP system, score + best score, daily streaks, limited daily hints, and a reference **Pinyin chart** with tappable tone playback.

## Experience principles
- Mobile-first and tactile: haptic feedback, sound effects, and elastic animations on every interaction.
- Gamified and forgiving: clear success/error feedback, hints, and "try again tomorrow" framing.
- Zero-friction: no accounts, instant play, offline-capable via localStorage.
