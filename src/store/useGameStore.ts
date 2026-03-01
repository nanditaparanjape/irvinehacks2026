import { create } from "zustand";

export const MAX_ROUNDS = 20;

export const TUTORIAL_ROUNDS = 8;

export type Player = 1 | 2;

export interface ScoreEntry {
  roundNumber: number;
  player: Player;
  baseTime: number;
  penalty: number;
  totalTime: number;
}

export type RoundTestType = "stroop" | "speedgrid" | "equation" | "gonogo";

export type TutorialStep = "preview" | "sandbox";
export type TutorialSandboxPhase = "TRYING" | "COMPLETE";

export const TUTORIAL_MISSION_TESTS: RoundTestType[] = [
  "stroop",
  "speedgrid",
  "equation",
  "gonogo",
];

export interface GameState {
  gameStarted: boolean;
  isTutorial: boolean;
  tutorialComplete: boolean;
  tutorialMission: number;
  tutorialStep: TutorialStep;
  tutorialSandboxPhase: TutorialSandboxPhase;
  tutorialSandboxRetryCount: number;
  player1Name: string;
  player2Name: string;
  currentTurn: Player;
  roundNumber: number;
  isGameOver: boolean;
  turnOrder: Player[];
  roundTestTypes: RoundTestType[];
  scoreLog: ScoreEntry[];
  player1TotalTime: number;
  player2TotalTime: number;
}

interface GameStore extends GameState {
  setGameStarted: (started: boolean) => void;
  setPlayer1Name: (name: string) => void;
  setPlayer2Name: (name: string) => void;
  startTutorial: () => void;
  setTutorialTryIt: () => void;
  setTutorialSandboxPhase: (phase: TutorialSandboxPhase) => void;
  setTutorialSandboxTryAgain: () => void;
  setTutorialNextMission: () => void;
  setTutorialCompleteFromSandbox: () => void;
  skipToTutorialComplete: () => void;
  startMainGame: () => void;
  startNewGame: () => void;
  resetGame: () => void;
  endGameEarly: () => void;
  addScore: (baseTime: number, penalty: number) => void;
  nextTurn: () => void;
}

const ROUNDS_PER_PLAYER = MAX_ROUNDS / 2;
const MAX_SAME_IN_ROW = 3;
const MAX_TURN_ORDER_ATTEMPTS = 10000;

export function generateTurnOrder(): Player[] {
  const base: Player[] = [
    ...Array(ROUNDS_PER_PLAYER).fill(1),
    ...Array(ROUNDS_PER_PLAYER).fill(2),
  ];

  const isValidSequence = (sequence: Player[]): boolean => {
    let streakPlayer: Player | null = null;
    let streakCount = 0;

    for (const p of sequence) {
      if (p === streakPlayer) {
        streakCount += 1;
      } else {
        streakPlayer = p;
        streakCount = 1;
      }

      if (streakCount > MAX_SAME_IN_ROW) {
        return false;
      }
    }

    return true;
  };

  for (let attempt = 0; attempt < MAX_TURN_ORDER_ATTEMPTS; attempt += 1) {
    const arr = [...base];

    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j] as Player;
      arr[j] = tmp as Player;
    }

    if (isValidSequence(arr)) {
      return arr;
    }
  }

  const fallback: Player[] = [];
  for (let i = 0; i < MAX_ROUNDS; i += 1) {
    fallback.push((i % 2 === 0 ? 1 : 2) as Player);
  }
  return fallback;
}

const TESTS: RoundTestType[] = ["stroop", "speedgrid", "equation", "gonogo"];

const PER_PLAYER_COUNTS: Record<RoundTestType, number> = {
  stroop: 2,
  speedgrid: 3,
  equation: 3,
  gonogo: 2,
};

export const TUTORIAL_TURN_ORDER: Player[] = [1, 2, 1, 2, 1, 2, 1, 2];
export const TUTORIAL_TEST_TYPES: RoundTestType[] = [
  "stroop",
  "stroop",
  "speedgrid",
  "speedgrid",
  "equation",
  "equation",
  "gonogo",
  "gonogo",
];

function generateRoundTestTypes(turnOrder: Player[]): RoundTestType[] {
  const result: RoundTestType[] = [];
  const p1Count: Record<RoundTestType, number> = {
    stroop: 0,
    speedgrid: 0,
    equation: 0,
    gonogo: 0,
  };
  const p2Count: Record<RoundTestType, number> = {
    stroop: 0,
    speedgrid: 0,
    equation: 0,
    gonogo: 0,
  };

  for (let i = 0; i < MAX_ROUNDS; i += 1) {
    const player = turnOrder[i] ?? 1;
    const counts = player === 1 ? p1Count : p2Count;

    const candidates = (TESTS as RoundTestType[]).filter(
      (t) => counts[t] < PER_PLAYER_COUNTS[t],
    );
    const prevTest = result[i - 1];
    const noBackToBack =
      prevTest != null
        ? candidates.filter((t) => t !== prevTest)
        : candidates;
    const options = noBackToBack.length > 0 ? noBackToBack : candidates;
    const chosen =
      options[Math.floor(Math.random() * options.length)] ?? "stroop";

    result.push(chosen);
    counts[chosen] += 1;
  }

  return result;
}

const initialTurnOrder = generateTurnOrder();
const initialRoundTestTypes = generateRoundTestTypes(initialTurnOrder);

const initialState: GameState = {
  gameStarted: false,
  isTutorial: false,
  tutorialComplete: false,
  tutorialMission: 1,
  tutorialStep: "preview",
  tutorialSandboxPhase: "TRYING",
  tutorialSandboxRetryCount: 0,
  player1Name: "",
  player2Name: "",
  currentTurn: initialTurnOrder[0] ?? 1,
  roundNumber: 1,
  isGameOver: false,
  turnOrder: initialTurnOrder,
  roundTestTypes: initialRoundTestTypes,
  scoreLog: [],
  player1TotalTime: 0,
  player2TotalTime: 0,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setGameStarted: (started) => set(() => ({ gameStarted: started })),
  setPlayer1Name: (name) => set(() => ({ player1Name: name })),
  setPlayer2Name: (name) => set(() => ({ player2Name: name })),

  startTutorial: () =>
    set(() => ({
      gameStarted: true,
      isTutorial: true,
      tutorialComplete: false,
      tutorialMission: 1,
      tutorialStep: "preview",
      tutorialSandboxPhase: "TRYING",
      tutorialSandboxRetryCount: 0,
      scoreLog: [],
      player1TotalTime: 0,
      player2TotalTime: 0,
      isGameOver: false,
    })),

  setTutorialTryIt: () =>
    set(() => ({ tutorialStep: "sandbox", tutorialSandboxPhase: "TRYING" })),

  setTutorialSandboxPhase: (phase) => set(() => ({ tutorialSandboxPhase: phase })),

  setTutorialSandboxTryAgain: () =>
    set((s) => ({
      tutorialSandboxPhase: "TRYING" as TutorialSandboxPhase,
      tutorialSandboxRetryCount: s.tutorialSandboxRetryCount + 1,
    })),

  setTutorialNextMission: () =>
    set((s) => {
      if (s.tutorialMission >= 4) return s;
      return {
        tutorialMission: s.tutorialMission + 1,
        tutorialStep: "preview",
        tutorialSandboxPhase: "TRYING" as TutorialSandboxPhase,
        tutorialSandboxRetryCount: 0,
      };
    }),

  setTutorialCompleteFromSandbox: () =>
    set(() => ({ tutorialComplete: true })),

  skipToTutorialComplete: () =>
    set(() => ({
      gameStarted: true,
      isTutorial: false,
      tutorialComplete: true,
    })),

  startMainGame: () => {
    const newTurnOrder = generateTurnOrder();
    const newRoundTestTypes = generateRoundTestTypes(newTurnOrder);
    set(() => ({
      isTutorial: false,
      tutorialComplete: false,
      roundNumber: 1,
      currentTurn: newTurnOrder[0] ?? 1,
      turnOrder: newTurnOrder,
      roundTestTypes: newRoundTestTypes,
      isGameOver: false,
    }));
  },

  startNewGame: () => set(() => ({ ...initialState })),

  endGameEarly: () => set((s) => ({ ...s, isGameOver: true })),

  resetGame: () => {
    const newTurnOrder = generateTurnOrder();
    const newRoundTestTypes = generateRoundTestTypes(newTurnOrder);
    set((s) => ({
      ...initialState,
      gameStarted: true,
      isTutorial: false,
      tutorialComplete: false,
      player1Name: s.player1Name,
      player2Name: s.player2Name,
      turnOrder: newTurnOrder,
      roundTestTypes: newRoundTestTypes,
      currentTurn: newTurnOrder[0] ?? 1,
    }));
  },

  addScore: (baseTime, penalty) =>
    set((state) => {
      if (state.isGameOver) return state;
      if (state.isTutorial) return state;

      const totalTime = baseTime + penalty;
      const entry: ScoreEntry = {
        roundNumber: state.roundNumber,
        player: state.currentTurn,
        baseTime,
        penalty,
        totalTime,
      };

      const player1TotalTime =
        state.currentTurn === 1
          ? state.player1TotalTime + totalTime
          : state.player1TotalTime;
      const player2TotalTime =
        state.currentTurn === 2
          ? state.player2TotalTime + totalTime
          : state.player2TotalTime;

      return {
        ...state,
        scoreLog: [...state.scoreLog, entry],
        player1TotalTime,
        player2TotalTime,
      };
    }),

  nextTurn: () =>
    set((state) => {
      if (state.isGameOver) return state;

      const nextRound = state.roundNumber + 1;
      const isTutorialPhase = state.isTutorial;
      const tutorialLength = TUTORIAL_ROUNDS;

      if (isTutorialPhase && nextRound > tutorialLength) {
        return { ...state, tutorialComplete: true };
      }

      if (!isTutorialPhase && nextRound > state.turnOrder.length) {
        return { ...state, isGameOver: true };
      }

      const nextPlayer = state.turnOrder[nextRound - 1] ?? state.currentTurn;
      const isGameOver =
        !isTutorialPhase && nextRound >= state.turnOrder.length;

      return {
        ...state,
        roundNumber: nextRound,
        currentTurn: nextPlayer,
        isGameOver,
      };
    }),
}));

