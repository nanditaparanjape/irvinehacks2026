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

  useEffect(() => {
    if (tutorialStep !== "sandbox" || !isTrying) return;
    setSandboxFlashVisible(true);
    const t = setTimeout(() => setSandboxFlashVisible(false), TUTORIAL_FLASH_MS);
    return () => clearTimeout(t);
  }, [tutorialStep, isTrying, tutorialMission, tutorialSandboxRetryCount]);

  const handleSandboxComplete = useCallback(() => {
    setTutorialSandboxPhase("COMPLETE");
  }, [setTutorialSandboxPhase]);

  const skipButton = (
    <button
      type="button"
      onClick={skipToTutorialComplete}
      className="rounded-lg border border-cyan-500/50 bg-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/30"
    >
      Skip Tutorial
    </button>
  );

  const modalContent = (
    <>
      <div className="absolute left-4 top-4 text-sm font-semibold text-cyan-300/90">
        {tutorialMission}/4
      </div>
      <div className="absolute bottom-4 right-4">{skipButton}</div>

      {tutorialStep === "preview" && (
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-6 overflow-y-auto pt-10">
          <TutorialPreview mission={tutorialMission} onTryIt={setTutorialTryIt} />
        </div>
      )}

      {tutorialStep === "sandbox" && isTrying && (
        <div className="flex w-full flex-1 flex-col items-center justify-center overflow-y-auto pt-10">
          <div className="flex w-full flex-1 flex-col items-center justify-center rounded-2xl border-2 border-[var(--modal-border)] bg-[var(--modal-bg)]/80 px-4 py-6 md:px-6">
            {sandboxFlashVisible ? (
              <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-cyan-500/30 bg-[var(--modal-bg)] p-6">
                <span className="font-bubbly text-center text-3xl font-semibold uppercase tracking-widest text-cyan-300 md:text-5xl">
                  {activeTutorialPlayerName}, your turn!
                </span>
              </div>
            ) : (
              <div className="flex w-full flex-1 flex-col items-center justify-center">
                <TestComponent
                  key={`tutorial-${tutorialMission}-${tutorialSandboxRetryCount}`}
                  onTutorialComplete={handleSandboxComplete}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {tutorialStep === "sandbox" && isComplete && (
        <div className="flex w-full flex-1 flex-col items-end justify-end gap-4 overflow-y-auto pt-10 pb-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center gap-4 rounded-2xl border-2 border-[var(--modal-border)] bg-[var(--modal-bg)]/90 p-6"
          >
            <p className="mx-auto max-w-prose text-center text-lg font-medium text-cyan-200 md:text-xl">
              Tutorial {tutorialMission} complete
            </p>
            <div className="flex flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={setTutorialSandboxTryAgain}
                className="rounded-xl border border-cyan-500/50 bg-cyan-500/20 px-6 py-3 font-bold text-cyan-200 transition hover:bg-cyan-500/40"
              >
                Try again
              </button>
              {isLastMission ? (
                <button
                  type="button"
                  onClick={setTutorialCompleteFromSandbox}
                  className="rounded-xl border-2 border-cyan-400 bg-cyan-500 px-6 py-3 font-bold text-[var(--modal-bg)] transition hover:bg-cyan-400"
                >
                  Complete tutorial
                </button>
              ) : (
                <button
                  type="button"
                  onClick={setTutorialNextMission}
                  className="rounded-xl border-2 border-cyan-400 bg-cyan-500/50 px-6 py-3 font-bold text-cyan-100 transition hover:bg-cyan-400/60"
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
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-6">
      <div className="onboarding-modal relative flex w-full max-w-lg flex-col overflow-y-auto rounded-3xl border-2 border-[var(--modal-border)] bg-[var(--modal-bg)] p-6 shadow-2xl">
        {modalContent}
      </div>
    </div>
  );
}
