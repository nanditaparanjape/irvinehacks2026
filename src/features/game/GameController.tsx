"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore, MAX_ROUNDS } from "@/store/useGameStore";
import type { RoundTestType } from "@/store/useGameStore";
import { StroopTest } from "@/features/game/tests/StroopTest";
import { SpeedGridTest } from "@/features/game/tests/SpeedGridTest";
import { EquationTest } from "@/features/game/tests/EquationTest";
import { GoNoGoTest } from "@/features/game/tests/GoNoGoTest";

const FLASH_MS = 1000;

type Phase = "flash" | "test";

function ProgressBar() {
  const roundNumber = useGameStore((s) => s.roundNumber);
  const fillPercent = Math.min(100, (roundNumber / MAX_ROUNDS) * 100);
  return (
    <div className="w-full px-2 md:px-4">
      <p className="font-bubbly mb-1 text-center text-sm font-semibold text-cyan-200/90">
        {roundNumber} / {MAX_ROUNDS}
      </p>
      <div className="h-3 w-full overflow-hidden rounded-full border border-cyan-400/50 bg-slate-800/90 shadow-[inset_0_2px_6px_rgba(0,0,0,0.3)] md:h-4" aria-hidden>
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-700 via-cyan-500 to-cyan-300 transition-all duration-500 ease-out"
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
      {/* Centered area: card (or flash) vertically centered */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center">
        {phase === "flash" && (
          <div className="flex w-full max-w-2xl flex-col items-center justify-center rounded-2xl border border-cyan-500/30 bg-[#0c4a6e] p-6 backdrop-blur-sm">
            <span className="font-bubbly text-center text-3xl font-black uppercase tracking-widest text-cyan-300 md:text-5xl">
              {activePlayerName}, your turn!
            </span>
          </div>
        )}

        {phase === "test" && (
          <div className="flex w-full max-w-2xl flex-col items-center justify-center rounded-2xl border border-cyan-500/30 bg-black/20 p-6 backdrop-blur-sm">
            <TestComponent onComplete={handleTestComplete} />
          </div>
        )}
      </div>

      {/* Progress bar, player turn, and End Game at bottom — centered */}
      <div className="shrink-0 space-y-6 pb-10 pt-4 md:space-y-8 md:pb-12 md:pt-5">
        <ProgressBar />
        <p className="font-bubbly text-center text-2xl font-black uppercase tracking-widest text-cyan-300 md:text-4xl">
          {activePlayerName}&apos;s turn
        </p>
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
