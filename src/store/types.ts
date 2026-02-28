// ============================================================
// NEURORACE — MASTER DATA CONTRACT
// Last edited by: Dev A only. All others read-only.
// ============================================================

export type GamePhase = 'LOBBY' | 'INTRO' | 'PLAYING' | 'RESULTS';

export type PromptType =
  | 'CLICK_LETTER'
  | 'LETTER_SEQUENCE'
  | 'HOLD_KEY'
  | 'STROOP'
  | 'MATH_EQUATION'
  | 'DONT_PRESS'
  | 'FAKE_OUT';

export type MascotId = 'MASCOT_A' | 'MASCOT_B'; // Designer maps these to actual images

export interface Player {
  id: 1 | 2;
  name: string;             // Entered in Lobby
  mascotId: MascotId;
  cumulativeTime: number;   // In milliseconds — LOWER IS BETTER
  penaltyScore: number;     // Sum of all penalties (in seconds, added to final time)
}

// The core unit — one per screen turn
export interface Prompt {
  id: string;                    // uuid
  type: PromptType;
  assignedPlayerId: 1 | 2;
  
  // Type-specific payload — only relevant fields will be populated
  payload: {
    targetLetter?: string;          // For CLICK_LETTER
    sequence?: string[];            // For LETTER_SEQUENCE e.g. ['Q','R','T']
    holdDurationSeconds?: number;   // For HOLD_KEY e.g. 3
    stroopWord?: string;            // For STROOP e.g. "Green"
    stroopColor?: string;           // For STROOP e.g. "#FF6600" (orange)
    stroopShouldPress?: boolean;    // Pre-computed: does color match word?
    equation?: string;              // For MATH_EQUATION e.g. "7 + 5 = 13"
    equationIsCorrect?: boolean;    // Pre-computed answer
    fakeOutDelayMs?: number;        // For FAKE_OUT — how long before it vanishes
  };
}

export interface PromptResult {
  promptId: string;
  playerId: 1 | 2;
  reactionTimeMs: number;     // Raw time from display to valid response
  penaltyAdded: number;       // 0, 0.25, or 0.5 (in seconds)
  completed: boolean;
}

export interface GameState {
  phase: GamePhase;
  players: [Player, Player];
  promptQueue: Prompt[];          // Full 40-prompt sequence, pre-generated
  currentPromptIndex: number;     // 0–39
  currentPromptStartTime: number | null;  // Date.now() when prompt rendered
  results: PromptResult[];        // Grows as game progresses
  isTie: boolean;                 // Computed at game end
  winnerId: 1 | 2 | null;
}

// ---- STORE ACTIONS CONTRACT (Dev A implements, Dev B & C call) ----
export interface GameActions {
  setPlayerNames: (p1Name: string, p2Name: string) => void;
  startGame: () => void;             // Generates prompt queue, sets phase to PLAYING
  advancePhase: (phase: GamePhase) => void;
  recordPromptStart: () => void;     // Called by Dev B when prompt renders
  submitResponse: (response: PlayerResponse) => void; // Called by Dev B on keypress
  computeFinalScores: () => void;    // Called automatically after prompt 40
}

export interface PlayerResponse {
  playerId: 1 | 2;
  keyPressed: string | null;       // null = no press (for DONT_PRESS, FAKE_OUT)
  heldDurationMs?: number;         // For HOLD_KEY only
  sequenceEntered?: string[];      // For LETTER_SEQUENCE only
  pressTimestamp: number;          // Date.now() at moment of keypress
}
