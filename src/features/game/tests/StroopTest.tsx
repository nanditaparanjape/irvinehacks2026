"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/useGameStore";

const WORDS = ["RED", "BLUE", "GREEN", "YELLOW"] as const;
type WordColor = (typeof WORDS)[number];

const COLOR_CLASS: Record<WordColor, string> = {
  RED: "text-red-400",
  BLUE: "text-sky-400",
  GREEN: "text-emerald-400",
  YELLOW: "text-yellow-300",
};

type Feedback = "correct" | "incorrect" | null;

export interface StroopTestProps {
  onComplete?: (elapsedMs: number) => void;
  onTutorialComplete?: () => void;
  onFeedbackChange?: (feedback: "correct" | "incorrect" | null) => void;
}

export const StroopTest = ({ onComplete, onTutorialComplete, onFeedbackChange }: StroopTestProps) => {
  const addScore = useGameStore((state) => state.addScore);
  const nextTurn = useGameStore((state) => state.nextTurn);
  const isTutorial = useGameStore((state) => state.isTutorial);

  const [feedback, setFeedback] = useState<Feedback>(null);
  const startTimeRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const [stimulus] = useState(() => {
    const textIndex = Math.floor(Math.random() * WORDS.length);
    const text = WORDS[textIndex];

    const shouldMatch = Math.random() < 0.5;

    let color: WordColor;
    if (shouldMatch) {
      color = text;
    } else {
      const otherOptions = WORDS.filter((w) => w !== text);
      color =
        otherOptions[Math.floor(Math.random() * otherOptions.length)] ?? text;
    }

    const isMatch = text === color;

    return { text, color, isMatch };
  });

  useEffect(() => {
    const start = performance.now();
    startTimeRef.current = start;
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (finishedRef.current || !startTimeRef.current) return;

      const key = event.key.toLowerCase();
      const isYes = key === "y";
      const isNo = key === "n";

      if (!isYes && !isNo) return;

      const userSaysMatch = isYes;
      const actualMatch = stimulus.isMatch;
      const isCorrect =
        (userSaysMatch && actualMatch) || (!userSaysMatch && !actualMatch);

      finishedRef.current = true;
      onFeedbackChange?.(isCorrect ? "correct" : "incorrect");

      const elapsedMs = performance.now() - startTimeRef.current;
      const elapsedSeconds = elapsedMs / 1000;

      if (onTutorialComplete) {
        setFeedback(isCorrect ? "correct" : "incorrect");
        setTimeout(() => {
          onTutorialComplete();
          onComplete?.(elapsedMs);
        }, 200);
        return;
      }

      let penalty = 0;
      if (!isCorrect) {
        penalty += 0.5;
      } else if (isCorrect && elapsedSeconds > 2.5) {
        penalty += 0.25;
      }

      addScore(elapsedSeconds, penalty);
      setFeedback(isCorrect ? "correct" : "incorrect");

      setTimeout(() => {
        nextTurn();
        onComplete?.(elapsedMs);
      }, 200);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [addScore, nextTurn, onComplete, onTutorialComplete, onFeedbackChange, stimulus.isMatch]);

  return (
    <div className="relative flex min-h-full w-full flex-col items-center justify-center gap-6 px-6 text-center transition-all duration-200">
      <div className="text-5xl font-bold tracking-tight md:text-6xl">
        <span className={COLOR_CLASS[stimulus.color]}>{stimulus.text}</span>
      </div>
    </div>
  );
};

