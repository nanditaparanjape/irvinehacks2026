"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/useGameStore";

const INCORRECT_PENALTY_SEC = 0.5;

type Feedback = "correct" | "incorrect" | null;

function generateEquation(): {
  display: string;
  isCorrect: boolean;
} {
  const isAddition = Math.random() < 0.5;
  const showCorrectAnswer = Math.random() < 0.5;

  if (isAddition) {
    const a = Math.floor(Math.random() * 15) + 1;
    const b = Math.floor(Math.random() * (29 - a)) + 1;
    const realSum = a + b;
    const displayedAnswer = showCorrectAnswer
      ? realSum
      : realSum + (Math.random() < 0.5 ? 1 : -1);
    const display = `${a} + ${b} = ${displayedAnswer}`;
    return { display, isCorrect: showCorrectAnswer };
  }

  const b = Math.floor(Math.random() * 14) + 1;
  const a = b + Math.floor(Math.random() * (30 - b));
  const realDiff = a - b;
  let wrongAnswer: number;
  if (realDiff <= 0) wrongAnswer = realDiff + 1;
  else wrongAnswer = realDiff + (Math.random() < 0.5 ? 1 : -1);
  wrongAnswer = Math.max(0, wrongAnswer);
  if (wrongAnswer === realDiff) wrongAnswer = realDiff + 1;

  const displayedAnswer = showCorrectAnswer ? realDiff : wrongAnswer;
  const display = `${a} - ${b} = ${displayedAnswer}`;
  return { display, isCorrect: showCorrectAnswer };
}

export interface EquationTestProps {
  onComplete?: (elapsedMs: number) => void;
  onTutorialComplete?: () => void;
  onFeedbackChange?: (feedback: "correct" | "incorrect" | null) => void;
}

export const EquationTest = ({ onComplete, onTutorialComplete, onFeedbackChange }: EquationTestProps) => {
  const addScore = useGameStore((state) => state.addScore);
  const nextTurn = useGameStore((state) => state.nextTurn);
  const isTutorial = useGameStore((state) => state.isTutorial);

  const [feedback, setFeedback] = useState<Feedback>(null);
  const startTimeRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const [equation] = useState(generateEquation);

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

      const userSaysCorrect = isYes;
      const actualCorrect = equation.isCorrect;
      const judgmentCorrect =
        (userSaysCorrect && actualCorrect) || (!userSaysCorrect && !actualCorrect);

      finishedRef.current = true;
      const elapsedMs = performance.now() - startTimeRef.current;

      if (onTutorialComplete) {
        const fb = judgmentCorrect ? "correct" : "incorrect";
        setFeedback(fb);
        onFeedbackChange?.(fb);
        setTimeout(() => {
          onTutorialComplete();
          onComplete?.(elapsedMs);
        }, 200);
        return;
      }

      const elapsedSec = elapsedMs / 1000;
      const penalty = judgmentCorrect ? 0 : INCORRECT_PENALTY_SEC;
      addScore(elapsedSec, penalty);
      const fb = judgmentCorrect ? "correct" : "incorrect";
      setFeedback(fb);
      onFeedbackChange?.(fb);

      setTimeout(() => {
        nextTurn();
        onComplete?.(elapsedMs);
      }, 200);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addScore, nextTurn, onComplete, onTutorialComplete, onFeedbackChange, equation.isCorrect]);

  return (
    <div className="relative flex min-h-full w-full flex-col items-center justify-center gap-6 px-6 py-8 text-center transition-all duration-200">
      <p className="font-mono text-4xl font-bold tracking-tight text-cyan-100 md:text-5xl">
        {equation.display}
      </p>
    </div>
  );
};
