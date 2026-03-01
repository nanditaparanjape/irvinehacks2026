"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { KeyCap } from "@/components/KeyCap";

const CUE_COUNT = 4;
const SHARK_TIMEOUT_MS = 5000; // SHARK: must press within 5s or wrong + 5s penalty
const NO_SHARK_TIMEOUT_MS = 2000; // NO SHARK: 2s without press = correct (0 added)
const WRONG_PRESS_PENALTY_SEC = 0.5; // NO SHARK: penalty when they press
const SHARK_MISSED_PENALTY_SEC = 5.0; // SHARK: penalty when they don't press in time
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
  const sharkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongPressBlankRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sharkAdvanceBlankRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noSharkAdvanceBlankRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentCue = sequence[cueIndex];
  const isGo = currentCue === "go"; // SHARK: must press. NO SHARK: must not press.

  useEffect(() => {
    if (cueIndex === 0) roundStartRef.current = performance.now();
    handledRef.current = false;
    cueStartRef.current = performance.now();
  }, [cueIndex]);

  // NO SHARK: after 2s without press = correct (0 added), advance
  useEffect(() => {
    if (isGo) return;
    noSharkTimeoutRef.current = setTimeout(() => {
      if (handledRef.current) return;
      handledRef.current = true;
      totalSecondsRef.current += 0; // correct: no time added
      setFeedbackFlash("green");
      onFeedbackChange?.("correct");

      setTimeout(() => {
        setFeedbackFlash(null);
        onFeedbackChange?.(null);
        setBlankBeforeNext(true);
        const nextIndex = cueIndex + 1;
        noSharkAdvanceBlankRef.current = setTimeout(() => {
          noSharkAdvanceBlankRef.current = null;
          setBlankBeforeNext(false);
          if (nextIndex >= CUE_COUNT) {
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
            setCueIndex(nextIndex);
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

  // SHARK: must press within 5s; if not, wrong + 5s penalty, then advance
  useEffect(() => {
    if (!isGo) return;
    sharkTimeoutRef.current = setTimeout(() => {
      if (handledRef.current) return;
      handledRef.current = true;
      totalSecondsRef.current += SHARK_MISSED_PENALTY_SEC;
      setFeedbackFlash("red");
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
    }, SHARK_TIMEOUT_MS);

    return () => {
      if (sharkTimeoutRef.current) {
        clearTimeout(sharkTimeoutRef.current);
        sharkTimeoutRef.current = null;
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
        // SHARK: press = correct; cancel 5s timeout, add reaction time
        if (sharkTimeoutRef.current) {
          clearTimeout(sharkTimeoutRef.current);
          sharkTimeoutRef.current = null;
        }
        totalSecondsRef.current += elapsedSec;
        setFeedbackFlash("green");
        onFeedbackChange?.("correct");
        advanceToNextCue();
      } else {
        // NO SHARK: press = wrong — cancel 2s timeout; +0.5s penalty, show wrong, advance
        if (noSharkTimeoutRef.current) {
          clearTimeout(noSharkTimeoutRef.current);
          noSharkTimeoutRef.current = null;
        }
        if (wrongPressTimeoutRef.current) {
          clearTimeout(wrongPressTimeoutRef.current);
          wrongPressTimeoutRef.current = null;
        }
        totalSecondsRef.current += WRONG_PRESS_PENALTY_SEC;
        setShowWrongPopup(true);
        setFeedbackFlash("red");
        onFeedbackChange?.("incorrect");
        wrongPressTimeoutRef.current = setTimeout(() => {
          wrongPressTimeoutRef.current = null;
          setFeedbackFlash(null);
          setShowWrongPopup(false);
          onFeedbackChange?.(null);
          setBlankBeforeNext(true);
          const nextIndex = cueIndex + 1;
          wrongPressBlankRef.current = setTimeout(() => {
            wrongPressBlankRef.current = null;
            setBlankBeforeNext(false);
            if (nextIndex >= CUE_COUNT) {
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
              setCueIndex(nextIndex);
            }
          }, BLANK_BEFORE_NEXT_MS);
        }, FEEDBACK_MS);
      }
    };

    function advanceToNextCue() {
      setTimeout(() => {
        setFeedbackFlash(null);
        setShowWrongPopup(false);
        onFeedbackChange?.(null);
        setBlankBeforeNext(true);
        const nextIndex = cueIndex + 1;
        sharkAdvanceBlankRef.current = setTimeout(() => {
          sharkAdvanceBlankRef.current = null;
          setBlankBeforeNext(false);
          if (nextIndex >= CUE_COUNT) {
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
            setCueIndex(nextIndex);
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
