"use client";

import { useGameStore } from "@/store/useGameStore";
import { DiveInPage } from "@/features/setup/DiveInPage";
import { TutorialFlow } from "@/features/setup/TutorialFlow";
import { TutorialCompleteScreen } from "@/features/setup/TutorialCompleteScreen";
import { GameController } from "@/features/game/GameController";
import { ResultsScreen } from "@/features/results/ResultsScreen";

export default function Home() {
  const gameStarted = useGameStore((s) => s.gameStarted);
  const isTutorial = useGameStore((s) => s.isTutorial);
  const tutorialComplete = useGameStore((s) => s.tutorialComplete);
  const isGameOver = useGameStore((s) => s.isGameOver);

  if (!gameStarted) {
    return <DiveInPage />;
  }

  if (isGameOver) {
    return <ResultsScreen />;
  }

  if (tutorialComplete) {
    return <TutorialCompleteScreen />;
  }

  if (isTutorial) {
    return <TutorialFlow />;
  }

  return <GameController />;
}
