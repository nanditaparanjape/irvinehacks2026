"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";

const TUTORIAL_FLASH_MS = 1000;
import { useGameStore } from "@/store/useGameStore";
import type { RoundTestType } from "@/store/useGameStore";
import { TUTORIAL_MISSION_TESTS } from "@/store/useGameStore";
import { TutorialPreview } from "./TutorialPreview";
import { StroopTest } from "@/features/game/tests/StroopTest";
import { SpeedGridTest } from "@/features/game/tests/SpeedGridTest";
import { EquationTest } from "@/features/game/tests/EquationTest";
import { GoNoGoTest } from "@/features/game/tests/GoNoGoTest";

const TEST_COMPONENTS: Record<
  RoundTestType,
  React.ComponentType<{
    onComplete?: (elapsedMs: number) => void;
    onTutorialComplete?: () => void;
    onFeedbackChange?: (feedback: "correct" | "incorrect" | null) => void;
  }>
> = {
  stroop: StroopTest,
  speedgrid: SpeedGridTest,
  equation: EquationTest,
  gonogo: GoNoGoTest,
};

export function TutorialFlow() {
  const tutorialMission = useGameStore((s) => s.tutorialMission);
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const tutorialSandboxPhase = useGameStore((s) => s.tutorialSandboxPhase);
  const tutorialSandboxRetryCount = useGameStore((s) => s.tutorialSandboxRetryCount);
  const player1Name = useGameStore((s) => s.player1Name);
  const player2Name = useGameStore((s) => s.player2Name);
  const setTutorialTryIt = useGameStore((s) => s.setTutorialTryIt);
  const setTutorialSandboxPhase = useGameStore((s) => s.setTutorialSandboxPhase);
  const setTutorialSandboxTryAgain = useGameStore((s) => s.setTutorialSandboxTryAgain);
  const setTutorialNextMission = useGameStore((s) => s.setTutorialNextMission);
  const setTutorialCompleteFromSandbox = useGameStore(
    (s) => s.setTutorialCompleteFromSandbox,
  );
  const skipToTutorialComplete = useGameStore((s) => s.skipToTutorialComplete);

  const testType = TUTORIAL_MISSION_TESTS[tutorialMission - 1] ?? "stroop";
  const TestComponent = TEST_COMPONENTS[testType];
  const isTrying = tutorialSandboxPhase === "TRYING";
  const isComplete = tutorialSandboxPhase === "COMPLETE";
  const isLastMission = tutorialMission === 4;

  // Tutorials 1 & 3 = Player 1, Tutorials 2 & 4 = Player 2 — mimic game turn order
  const tutorialPlayerNum = tutorialMission === 1 || tutorialMission === 3 ? 1 : 2;
  const activeTutorialPlayerName =
    tutorialPlayerNum === 1
      ? (player1Name || "Player 1")
      : (player2Name || "Player 2");

  const [sandboxFlashVisible, setSandboxFlashVisible] = useState(false);
  const [tutorialTestFeedback, setTutorialTestFeedback] = useState<"correct" | "incorrect" | null>(null);

  useEffect(() => {
    if (tutorialStep !== "sandbox" || !isTrying) return;
    setSandboxFlashVisible(true);
    const t = setTimeout(() => setSandboxFlashVisible(false), TUTORIAL_FLASH_MS);
    return () => clearTimeout(t);
  }, [tutorialStep, isTrying, tutorialMission, tutorialSandboxRetryCount]);

  const handleSandboxComplete = useCallback(() => {
    setTutorialSandboxPhase("COMPLETE");
  }, [setTutorialSandboxPhase]);

  useEffect(() => {
    if (tutorialStep !== "sandbox" || !isTrying) setTutorialTestFeedback(null);
  }, [tutorialStep, isTrying, tutorialMission, tutorialSandboxRetryCount]);

  const modalContent = (
    <>
      {tutorialStep === "preview" && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <div className="game-modal flex w-full max-w-xl flex-col items-center justify-center gap-6 p-8">
            <TutorialPreview mission={tutorialMission} onTryIt={setTutorialTryIt} />
          </div>
        </div>
      )}

      {tutorialStep === "sandbox" && isTrying && (
        <div className="flex w-full flex-1 flex-col items-center justify-center p-8">
          <div
            className={`game-modal relative flex w-full flex-col items-center justify-center rounded-3xl border-2 bg-[var(--modal-bg)] p-8 shadow-2xl transition-all duration-200 ${tutorialTestFeedback === "correct" ? "ring-4 ring-cyan-500 border-cyan-500/50" : tutorialTestFeedback === "incorrect" ? "ring-4 ring-red-500 border-red-500/50 shadow-[0_0_24px_rgba(239,68,68,0.4)]" : "border-[var(--modal-border)]"}`}
          >
            {tutorialTestFeedback === "incorrect" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-red-500/30 pointer-events-none" aria-hidden>
                <span className="font-bubbly text-3xl font-black uppercase text-white drop-shadow-lg">Wrong!</span>
              </div>
            )}
            {sandboxFlashVisible ? (
              <span className="font-bubbly text-center text-4xl font-black uppercase tracking-widest text-cyan-100 md:text-5xl">
                {activeTutorialPlayerName}, your turn!
              </span>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center">
                <TestComponent
                  key={`tutorial-${tutorialMission}-${tutorialSandboxRetryCount}`}
                  onTutorialComplete={handleSandboxComplete}
                  onFeedbackChange={setTutorialTestFeedback}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {tutorialStep === "sandbox" && isComplete && (
        <div className="flex w-full flex-1 flex-col items-center justify-end gap-4 p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="game-modal flex w-full flex-col items-center justify-center gap-6 rounded-3xl border-2 border-[var(--modal-border)] bg-[var(--modal-bg)] p-8 shadow-2xl"
          >
            <p className="mx-auto max-w-prose text-center text-xl font-medium text-cyan-100 md:text-2xl">
              Tutorial {tutorialMission} complete!
            </p>
            <div className="flex flex-row flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={setTutorialSandboxTryAgain}
                className="rounded-xl border-2 border-cyan-400/60 bg-[var(--modal-bg)] px-6 py-3.5 font-bold text-cyan-100 transition hover:bg-cyan-500/30"
              >
                Try again
              </button>
              {isLastMission ? (
                <button
                  type="button"
                  onClick={setTutorialCompleteFromSandbox}
                  className="rounded-xl border-2 border-cyan-400 bg-cyan-500 px-6 py-3.5 text-lg font-bold text-[var(--modal-bg)] transition hover:bg-cyan-400"
                >
                  Complete tutorial
                </button>
              ) : (
                <button
                  type="button"
                  onClick={setTutorialNextMission}
                  className="rounded-xl border-2 border-cyan-400 bg-cyan-500/90 px-6 py-3.5 text-lg font-bold text-[var(--modal-bg)] transition hover:bg-cyan-400"
                >
                  Next tutorial
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );

  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center px-4 py-6">
      <div className="relative w-full max-w-2xl">
        <div className="absolute left-0 top-0 z-10 -translate-y-full pb-2 text-base font-semibold text-cyan-100 md:text-lg">
          {tutorialMission}/4
        </div>
        <div className="onboarding-modal flex w-full flex-col rounded-3xl border-2 border-[var(--modal-border)] bg-[var(--modal-bg)] p-8 shadow-2xl">
          {modalContent}
        </div>
      </div>
      <button
        type="button"
        onClick={skipToTutorialComplete}
        className="fixed bottom-8 right-8 z-[60] rounded-xl border-2 border-cyan-500/60 bg-[var(--modal-bg)]/90 px-5 py-2.5 text-base font-bold text-cyan-100 backdrop-blur-sm transition hover:bg-cyan-500/20 hover:text-cyan-50"
      >
        Skip Tutorial
      </button>
    </div>
  );
}
