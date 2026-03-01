"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { KeyCap } from "@/components/KeyCap";

const CUE_COUNT = 4;
const NO_SHARK_TIMEOUT_MS = 3000; // NO SHARK: after 3s without press, advance with red outline
const GO_PROBABILITY = 0.8;
const FEEDBACK_MS = 220;
const BLANK_BEFORE_NEXT_MS = 380;

type CueType = "go" | "nogo";
type FeedbackFlash = "green" | "red" | null;

export interface GoNoGoTestProps {
  onComplete?: (elapsedMs: number) => void;
  onTutorialComplete?: () => void;
  onFeedbackChange?: (feedback: "correct" | "incorrect" | null) => void;
}

export const GoNoGoTest = ({ onComplete, onTutorialComplete, onFeedbackChange }: GoNoGoTestProps) => {
  const addScore = useGameStore((state) => state.addScore);
  const nextTurn = useGameStore((state) => state.nextTurn);
  const isTutorial = useGameStore((state) => state.isTutorial);

  const [sequence] = useState<CueType[]>(() =>
    isTutorial
      ? (["go", "nogo", "go", "nogo"] as CueType[])
      : Array.from({ length: CUE_COUNT }, () =>
          Math.random() < GO_PROBABILITY ? "go" : "nogo",
        ),
  );

  const [cueIndex, setCueIndex] = useState(0);
  const [feedbackFlash, setFeedbackFlash] = useState<FeedbackFlash>(null);
  const [showWrongPopup, setShowWrongPopup] = useState(false);
  const [blankBeforeNext, setBlankBeforeNext] = useState(false);

  const roundStartRef = useRef<number>(0);
  const cueStartRef = useRef<number>(0);
  const totalSecondsRef = useRef(0);
  const handledRef = useRef(false);
  const blankTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noSharkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentCue = sequence[cueIndex];
  const isGo = currentCue === "go"; // SHARK: must press. NO SHARK: must not press.

  useEffect(() => {
    if (cueIndex === 0) roundStartRef.current = performance.now();
    handledRef.current = false;
    cueStartRef.current = performance.now();
  }, [cueIndex]);

  // NO SHARK only: after 3s without press, show red outline and advance
  useEffect(() => {
    if (isGo) return;
    noSharkTimeoutRef.current = setTimeout(() => {
      if (handledRef.current) return;
      handledRef.current = true;
      setFeedbackFlash("red"); // timeout = missed = red outline
      onFeedbackChange?.("incorrect");

      setTimeout(() => {
        setFeedbackFlash(null);
        setShowWrongPopup(false);
        onFeedbackChange?.(null);
        setBlankBeforeNext(true);
        blankTimerRef.current = setTimeout(() => {
          blankTimerRef.current = null;
          setBlankBeforeNext(false);
          if (cueIndex + 1 >= CUE_COUNT) {
            if (onTutorialComplete) {
              setTimeout(() => {
                onTutorialComplete();
                onComplete?.(performance.now() - roundStartRef.current);
              }, 200);
            } else {
              addScore(totalSecondsRef.current, 0);
              setTimeout(() => {
                nextTurn();
                onComplete?.(performance.now() - roundStartRef.current);
              }, 200);
            }
          } else {
            setCueIndex((i) => i + 1);
          }
        }, BLANK_BEFORE_NEXT_MS);
      }, FEEDBACK_MS);
    }, NO_SHARK_TIMEOUT_MS);

    return () => {
      if (noSharkTimeoutRef.current) {
        clearTimeout(noSharkTimeoutRef.current);
        noSharkTimeoutRef.current = null;
      }
      if (blankTimerRef.current) {
        clearTimeout(blankTimerRef.current);
        blankTimerRef.current = null;
      }
    };
  }, [cueIndex, isGo, addScore, nextTurn, onComplete, onTutorialComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      e.preventDefault();
      if (handledRef.current) return;
      handledRef.current = true;

      const elapsedSec = (performance.now() - cueStartRef.current) / 1000;

      if (isGo) {
        // SHARK: press = correct
        totalSecondsRef.current += elapsedSec;
        setFeedbackFlash("green");
        onFeedbackChange?.("correct");
        advanceToNextCue();
      } else {
        // NO SHARK: press = wrong — cancel the 3s timeout; show wrong feedback then advance (no blank phase to avoid stuck screen)
        if (noSharkTimeoutRef.current) {
          clearTimeout(noSharkTimeoutRef.current);
          noSharkTimeoutRef.current = null;
        }
        if (wrongPressTimeoutRef.current) {
          clearTimeout(wrongPressTimeoutRef.current);
          wrongPressTimeoutRef.current = null;
        }
        totalSecondsRef.current += 2.5;
        setShowWrongPopup(true);
        setFeedbackFlash("red");
        onFeedbackChange?.("incorrect");
        wrongPressTimeoutRef.current = setTimeout(() => {
          wrongPressTimeoutRef.current = null;
          setFeedbackFlash(null);
          setShowWrongPopup(false);
          onFeedbackChange?.(null);
          setBlankBeforeNext(false);
          if (cueIndex + 1 >= CUE_COUNT) {
            if (onTutorialComplete) {
              setTimeout(() => {
                onTutorialComplete();
                onComplete?.(performance.now() - roundStartRef.current);
              }, 200);
            } else {
              addScore(totalSecondsRef.current, 0);
              setTimeout(() => {
                nextTurn();
                onComplete?.(performance.now() - roundStartRef.current);
              }, 200);
            }
          } else {
            setCueIndex((i) => i + 1);
          }
        }, FEEDBACK_MS);
      }
    };

    function advanceToNextCue() {
      setTimeout(() => {
        setFeedbackFlash(null);
        setShowWrongPopup(false);
        onFeedbackChange?.(null);
        setBlankBeforeNext(true);
        blankTimerRef.current = setTimeout(() => {
          blankTimerRef.current = null;
          setBlankBeforeNext(false);
          if (cueIndex + 1 >= CUE_COUNT) {
            if (onTutorialComplete) {
              setTimeout(() => {
                onTutorialComplete();
                onComplete?.(performance.now() - roundStartRef.current);
              }, 200);
            } else {
              addScore(totalSecondsRef.current, 0);
              setTimeout(() => {
                nextTurn();
                onComplete?.(performance.now() - roundStartRef.current);
              }, 200);
            }
          } else {
            setCueIndex((i) => i + 1);
          }
        }, BLANK_BEFORE_NEXT_MS);
      }, FEEDBACK_MS);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cueIndex, isGo, addScore, nextTurn, onComplete, onTutorialComplete, onFeedbackChange]);

  const circleBg = "bg-cyan-500";

  return (
    <div className="relative flex min-h-full w-full flex-col items-center justify-center gap-6 rounded-2xl px-6 py-8 transition-all duration-200">
      <div className="flex min-h-[16rem] min-w-[16rem] items-center justify-center md:min-h-[18rem] md:min-w-[18rem]">
        {!blankBeforeNext && (
          <div
            className={`flex h-44 w-44 items-center justify-center rounded-full ${circleBg} drop-shadow-[0_4px_16px_rgba(0,0,0,0.25)] [filter:drop-shadow(0_0_8px_rgba(34,211,238,0.25))] md:h-52 md:w-52 lg:h-56 lg:w-56`}
          >
            {isGo ? (
              <img
                src="/shark.svg"
                alt="Shark"
                className="h-3/4 w-3/4 object-contain"
              />
            ) : (
              <img
                src="/seaweed.svg"
                alt="No shark"
                className="h-3/4 w-3/4 object-contain"
              />
            )}
          </div>
        )}
      </div>
      {!blankBeforeNext && isTutorial && (
        <p className="mt-2 text-center text-base font-bold tracking-wide text-cyan-100 md:text-lg">
          Press <KeyCap>Space</KeyCap> if a shark is present!
        </p>
      )}
    </div>
  );
};
