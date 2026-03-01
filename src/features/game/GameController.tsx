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
    <span className="text-cyan-100">
      <KeyCap>Y</KeyCap> Correct — <KeyCap>N</KeyCap> Incorrect
    </span>
  ),
  speedgrid: (
    <span className="text-cyan-100">
      Type or click the letter that appears
    </span>
  ),
  equation: (
    <span className="text-cyan-100">
      <KeyCap>Y</KeyCap> Correct — <KeyCap>N</KeyCap> Incorrect
    </span>
  ),
  gonogo: (
    <span className="text-cyan-100">
      Press <KeyCap>Space</KeyCap> if a shark is present!
    </span>
  ),
};

function ProgressBar() {
  const roundNumber = useGameStore((s) => s.roundNumber);
  const fillPercent = Math.min(100, (roundNumber / MAX_ROUNDS) * 100);
  return (
    <div className="w-full px-2 md:px-4">
      <div className="h-4 w-full overflow-hidden rounded-full border-2 border-cyan-400/50 bg-cyan-800/50 shadow-[inset_0_2px_6px_rgba(0,0,0,0.2)] md:h-5" aria-hidden>
        <div
          className="h-full rounded-full bg-cyan-100 transition-all duration-500 ease-out"
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      <p className="mt-1.5 text-left text-sm font-semibold text-cyan-200/90 md:text-base">
        {roundNumber}/{MAX_ROUNDS}
      </p>
    </div>
  );
}

const TEST_COMPONENTS: Record<
  RoundTestType,
  React.ComponentType<{
    onComplete?: (elapsedMs: number) => void;
    onFeedbackChange?: (feedback: "correct" | "incorrect" | null) => void;
  }>
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

  const [phase, setPhase] = useState<Phase>("flash");
  const [testFeedback, setTestFeedback] = useState<"correct" | "incorrect" | null>(null);
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

  useEffect(() => {
    if (phase !== "test") setTestFeedback(null);
  }, [phase, currentTurn, roundNumber]);


  const handleTestComplete = () => {
    if (startTimeRef.current) {
      const elapsed = performance.now() - startTimeRef.current;
      // Optional: pass to parent if needed
    }
  };

  const handleEndGame = () => {
    useGameStore.getState().endGameEarly();
  };

  return (
    <div className="relative flex min-h-[70vh] flex-col md:min-h-[75vh]">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleEndGame();
        }}
        className="fixed bottom-8 right-8 z-50 rounded-lg border-2 border-cyan-400 bg-[var(--modal-bg)]/90 px-3 py-2 text-sm font-bold text-cyan-100 shadow-lg backdrop-blur-sm transition hover:bg-cyan-500/40 hover:text-white md:px-4 md:py-2.5 md:text-base"
      >
        End Game
      </button>
      {/* Centered area: fixed-size modal (flash or test) */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4">
        {phase === "flash" && (
          <div className="game-modal flex flex-col items-center justify-center rounded-3xl border-2 border-[var(--modal-border)] bg-[var(--modal-bg)] p-8 shadow-2xl">
            <span className="font-bubbly text-center text-4xl font-black uppercase tracking-widest text-cyan-100 md:text-5xl">
              {activePlayerName}, your turn!
            </span>
          </div>
        )}

        {phase === "test" && (
          <div
            className={`game-modal relative flex flex-col items-center justify-center rounded-3xl border-2 bg-[var(--modal-bg)] p-8 shadow-2xl transition-all duration-200 ${testFeedback === "correct" ? "ring-4 ring-cyan-500 border-cyan-500/50" : testFeedback === "incorrect" ? "ring-4 ring-red-500 border-red-500/50 shadow-[0_0_24px_rgba(239,68,68,0.4)]" : "border-[var(--modal-border)]"}`}
          >
            {testFeedback === "incorrect" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-red-500/30 pointer-events-none" aria-hidden>
                <span className="font-bubbly text-3xl font-black uppercase text-white drop-shadow-lg">Wrong!</span>
              </div>
            )}
            <TestComponent onComplete={handleTestComplete} onFeedbackChange={setTestFeedback} />
          </div>
        )}
      </div>

      {/* Fixed width: help text, player turn, progress bar, End Game */}
      <div className="mx-auto w-full max-w-xl shrink-0 space-y-4 pb-12 pt-6 md:space-y-5 md:pb-14 md:pt-8">
        <p className="text-center text-base md:text-lg">
          {HELP_BY_TEST[testType]}
        </p>
        <p className="font-bubbly text-center text-3xl font-black uppercase tracking-widest text-cyan-100 md:text-4xl">
          {activePlayerName}&apos;s turn
        </p>
        <ProgressBar />
      </div>
    </div>
  );
};
