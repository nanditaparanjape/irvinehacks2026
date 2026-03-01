"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { KeyCap } from "@/components/KeyCap";

const CUE_COUNT = 4;
const CUE_DURATION_MS = 2000; // Only used for SHARK: success = no press for this long
const GO_PROBABILITY = 0.8;
const FEEDBACK_MS = 220;
const BLANK_BEFORE_NEXT_MS = 380;

type CueType = "go" | "nogo";
type FeedbackFlash = "green" | "red" | null;

export interface GoNoGoTestProps {
  onComplete?: (elapsedMs: number) => void;
  onTutorialComplete?: () => void;
}

export const GoNoGoTest = ({ onComplete, onTutorialComplete }: GoNoGoTestProps) => {
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
  const [message, setMessage] = useState<string | null>(null);
  const [showWrongPopup, setShowWrongPopup] = useState(false);
  const [blankBeforeNext, setBlankBeforeNext] = useState(false);

  const roundStartRef = useRef<number>(0);
  const cueStartRef = useRef<number>(0);
  const totalSecondsRef = useRef(0);
  const handledRef = useRef(false);
  const blankTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentCue = sequence[cueIndex];
  const isGo = currentCue === "go";

  useEffect(() => {
    if (cueIndex === 0) roundStartRef.current = performance.now();
    handledRef.current = false;
    cueStartRef.current = performance.now();
  }, [cueIndex]);

  // Timeout only for "No shark" (!isGo): success = didn't press for CUE_DURATION_MS.
  // For SHARK (isGo): no timeout — we wait until they press Space.
  useEffect(() => {
    if (isGo) return;
    const timeout = setTimeout(() => {
      if (handledRef.current) return;
      handledRef.current = true;
      setFeedbackFlash("green");

      setTimeout(() => {
        setFeedbackFlash(null);
        setMessage(null);
        setShowWrongPopup(false);
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
    }, CUE_DURATION_MS);

    return () => {
      clearTimeout(timeout);
      if (blankTimerRef.current) clearTimeout(blankTimerRef.current);
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
        totalSecondsRef.current += elapsedSec;
        setFeedbackFlash("green");
        advanceToNextCue();
      } else {
        totalSecondsRef.current += 2.5;
        setShowWrongPopup(true);
        setFeedbackFlash("red");
        // Wrong on SHARK: don't advance — after feedback, show same SHARK again
        setTimeout(() => {
          setFeedbackFlash(null);
          setMessage(null);
          setShowWrongPopup(false);
          setBlankBeforeNext(true);
          blankTimerRef.current = setTimeout(() => {
            blankTimerRef.current = null;
            setBlankBeforeNext(false);
            handledRef.current = false;
          }, BLANK_BEFORE_NEXT_MS);
        }, FEEDBACK_MS);
      }
    };

    function advanceToNextCue() {
      setTimeout(() => {
        setFeedbackFlash(null);
        setMessage(null);
        setShowWrongPopup(false);
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
  }, [cueIndex, isGo, addScore, nextTurn, onComplete, onTutorialComplete]);

  const ringClass =
    feedbackFlash === "green"
      ? "ring-4 ring-cyan-500"
      : feedbackFlash === "red"
        ? "ring-4 ring-fuchsia-500"
        : "ring-2 ring-cyan-500/30";

  const circleBg = "bg-cyan-500";
  const label = isGo ? "SHARK" : "NO SHARK";

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-6 rounded-2xl border border-cyan-500/20 bg-black/30 px-8 py-10 backdrop-blur-sm transition-all duration-200 ${blankBeforeNext ? "ring-2 ring-cyan-500/20" : ringClass}`}
    >
      {showWrongPopup && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-fuchsia-500/20">
          <span className="rounded-lg bg-fuchsia-600 px-6 py-2 text-lg font-black uppercase tracking-wide text-white shadow-lg">
            Wrong!
          </span>
        </div>
      )}
      {!blankBeforeNext && !isTutorial && (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Shark Attack — Cue {cueIndex + 1} of {CUE_COUNT}
        </p>
      )}
      <div className="flex min-h-[9rem] min-w-[9rem] items-center justify-center">
        {!blankBeforeNext && (
          <div
            className={`flex h-36 w-36 items-center justify-center rounded-full ${circleBg} text-xl font-bold tracking-wide text-white shadow-lg`}
          >
            {label}
          </div>
        )}
      </div>
      {!blankBeforeNext && message && (
        <p className="text-sm font-semibold text-amber-400">
          {message}
        </p>
      )}
      {!blankBeforeNext && (
        <p className="mt-2 text-center text-sm font-bold tracking-wide text-accent-muted">
          Press <KeyCap>Space</KeyCap> if SHARK present!
        </p>
      )}
    </div>
  );
};
