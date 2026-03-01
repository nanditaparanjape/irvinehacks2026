"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore, MAX_ROUNDS } from "@/store/useGameStore";
import type { RoundTestType } from "@/store/useGameStore";
import { StroopTest } from "@/features/game/tests/StroopTest";
import { SpeedGridTest } from "@/features/game/tests/SpeedGridTest";
import { EquationTest } from "@/features/game/tests/EquationTest";
import { GoNoGoTest } from "@/features/game/tests/GoNoGoTest";
import { KeyCap } from "@/components/KeyCap";

const FLASH_MS = 1000;

type Phase = "flash" | "test";

const HELP_BY_TEST: Record<RoundTestType, React.ReactNode> = {
  stroop: (
    <span className="text-sm text-cyan-100">
      <KeyCap>Y</KeyCap> Correct — <KeyCap>N</KeyCap> Incorrect
    </span>
  ),
  speedgrid: (
    <span className="text-sm text-cyan-100">
      Type or click the letter that appears
    </span>
  ),
  equation: (
    <span className="text-sm text-cyan-100">
      <KeyCap>Y</KeyCap> Correct — <KeyCap>N</KeyCap> Incorrect
    </span>
  ),
  gonogo: (
    <span className="text-sm text-cyan-100">
      Press <KeyCap>Space</KeyCap> if SHARK present!
    </span>
  ),
};

function ProgressBar() {
  const roundNumber = useGameStore((s) => s.roundNumber);
  const fillPercent = Math.min(100, (roundNumber / MAX_ROUNDS) * 100);
  return (
    <div className="w-full px-2 md:px-4">
      <div className="h-3 w-full overflow-hidden rounded-full border border-cyan-400/50 bg-cyan-800/50 shadow-[inset_0_2px_6px_rgba(0,0,0,0.2)] md:h-4" aria-hidden>
        <div
          className="h-full rounded-full bg-cyan-100 transition-all duration-500 ease-out"
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}

const TEST_COMPONENTS: Record<
  RoundTestType,
  React.ComponentType<{ onComplete?: (elapsedMs: number) => void }>
> = {
  stroop: StroopTest,
  speedgrid: SpeedGridTest,
  equation: EquationTest,
  gonogo: GoNoGoTest,
};

export const GameController = () => {
  const currentTurn = useGameStore((s) => s.currentTurn);
  const roundNumber = useGameStore((s) => s.roundNumber);
  const roundTestTypes = useGameStore((s) => s.roundTestTypes);
  const player1Name = useGameStore((s) => s.player1Name);
  const player2Name = useGameStore((s) => s.player2Name);
  const isTutorial = useGameStore((s) => s.isTutorial);
  const endGameEarly = useGameStore((s) => s.endGameEarly);

  const [phase, setPhase] = useState<Phase>("flash");
  const startTimeRef = useRef<number | null>(null);

  const activePlayerName =
    (currentTurn === 1 ? player1Name : player2Name) || `Player ${currentTurn}`;
  const testType = roundTestTypes[roundNumber - 1] ?? "stroop";
  const TestComponent = TEST_COMPONENTS[testType];

  useEffect(() => {
    setPhase("flash");
    const t = setTimeout(() => {
      setPhase("test");
    }, FLASH_MS);
    return () => clearTimeout(t);
  }, [currentTurn, roundNumber]);

  useEffect(() => {
    if (phase === "test") {
      startTimeRef.current = performance.now();
    } else {
      startTimeRef.current = null;
    }
  }, [phase]);

  const handleTestComplete = () => {
    if (startTimeRef.current) {
      const elapsed = performance.now() - startTimeRef.current;
      // Optional: pass to parent if needed
    }
  };

  return (
    <div className="relative flex min-h-[70vh] flex-col md:min-h-[75vh]">
      {/* Centered area: fixed-size modal (flash or test) */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4">
        {phase === "flash" && (
          <div className="game-modal flex flex-col items-center justify-center rounded-3xl border-2 border-[var(--modal-border)] bg-[var(--modal-bg)] p-6 shadow-2xl">
            <span className="font-bubbly text-center text-3xl font-black uppercase tracking-widest text-cyan-300 md:text-5xl">
              {activePlayerName}, your turn!
            </span>
          </div>
        )}

        {phase === "test" && (
          <div className="game-modal flex flex-col items-center justify-center rounded-3xl border-2 border-[var(--modal-border)] bg-[var(--modal-bg)]/90 p-6 shadow-2xl">
            <TestComponent onComplete={handleTestComplete} />
          </div>
        )}
      </div>

      {/* Fixed width: help text, player turn, progress bar, End Game */}
      <div className="mx-auto w-full max-w-lg shrink-0 space-y-3 pb-10 pt-4 md:space-y-4 md:pb-12 md:pt-5">
        <p className="text-center">
          {HELP_BY_TEST[testType]}
        </p>
        <p className="font-bubbly text-center text-2xl font-black uppercase tracking-widest text-cyan-100 md:text-4xl">
          {activePlayerName}&apos;s turn
        </p>
        <ProgressBar />
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => endGameEarly()}
            className="rounded-xl border-2 border-cyan-400/80 bg-cyan-500/30 px-5 py-3 text-sm font-bold text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.3)] backdrop-blur-sm transition hover:bg-cyan-500/50 hover:text-white hover:shadow-[0_0_24px_rgba(34,211,238,0.4)] md:px-6 md:py-3 md:text-base"
          >
            End Game
          </button>
        </div>
      </div>
    </div>
  );
};
