## SeaQuest

SeaQuest is a **1v1 competitive cognitive battle game** built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS v4**, **Zustand**, and **Lucide React**. Two players alternate through a series of cognitive tasks; scores are based on accuracy and reaction time.

### Tech Stack

- **Framework**: Next.js (App Router, TypeScript, `src/` directory)
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand (`src/store/useGameStore.ts`)
- **UI Icons**: Lucide React

### Feature Architecture

All game functionality is organized by domain under `src/features`:

- `src/features/setup/`: player name entry, mascot selection/intro
- `src/features/game/`: core engine, turn switching, timers
- `src/features/game/tests/`: individual cognitive tasks (Corsi, Stroop, Go/No-Go, Equations)
- `src/features/results/`: final score calculation and winner screen
- `src/store/`: global Zustand store for game state

This layout is designed to **minimize merge conflicts** by isolating each feature’s components and logic.

### Global Game Store

The global Zustand store lives at `src/store/useGameStore.ts` and currently tracks:

- `player1Name`, `player2Name`
- `currentTurn`
- `totalRounds` (default 32)
- `scores` (per-round entries)

Additional game state (turn history, timers, penalties) will be layered on in future iterations.

### Local Development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Then visit `http://localhost:3000` to load the main arena. The **Left Mascot** and **Right Mascot** placeholders are rendered in the global layout; the central panel is where setup, game flow, and results UIs will mount.

### Scripts

- `npm run dev` – start the Next.js dev server
- `npm run build` – production build
- `npm run start` – run the production build
- `npm run lint` – run ESLint

