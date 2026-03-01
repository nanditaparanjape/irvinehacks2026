"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/useGameStore";

const GRID_SIZE = 9;
const SEQUENCE_LENGTH = 5;
const HIGHLIGHT_DURATION_MS = 600;
const BLOCK_TIMEOUT_MS = 6000;

type BlockStatus = "idle" | "sequence" | "correct" | "incorrect";

export interface CorsiTestProps {
  onComplete?: (elapsedMs: number) => void;
}

export const CorsiTest = ({ onComplete }: CorsiTestProps) => {
  const addScore = useGameStore((state) => state.addScore);
  const nextTurn = useGameStore((state) => state.nextTurn);

  const [blockLetters] = useState<string[]>(() => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const shuffled = [...alphabet].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, GRID_SIZE);
  });

  const [sequence] = useState<number[]>(() => {
    const indices = Array.from({ length: GRID_SIZE }, (_, i) => i);
    const shuffled = [...indices].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, SEQUENCE_LENGTH);
  });

  const [blockStatus, setBlockStatus] = useState<BlockStatus[]>(
    () => Array(GRID_SIZE).fill("idle") as BlockStatus[],
  );

  const [phase, setPhase] = useState<"sequence" | "recall" | "done">("sequence");
  const [sequenceStep, setSequenceStep] = useState(0);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  const [inputIndex, setInputIndex] = useState(0);

  const recallStartRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const penaltySecondsRef = useRef(0);
  const currentInputIndexRef = useRef(0);

  useEffect(() => {
    if (phase !== "sequence") return;

    if (sequenceStep >= sequence.length) {
      setHighlightedIndex(null);
      setPhase("recall");
      const start = performance.now();
      recallStartRef.current = start;
      currentInputIndexRef.current = 0;
      setInputIndex(0);
      return;
    }

    const indexToShow = sequence[sequenceStep];
    setHighlightedIndex(indexToShow);
    setBlockStatus((prev) => {
      const next = [...prev];
      next[indexToShow] = "sequence";
      return next;
    });

    const timeoutId = setTimeout(() => {
      setHighlightedIndex(null);
      setBlockStatus((prev) => {
        const next = [...prev];
        if (next[indexToShow] === "sequence") {
          next[indexToShow] = "idle";
        }
        return next;
      });
      setSequenceStep((step) => step + 1);
    }, HIGHLIGHT_DURATION_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [phase, sequenceStep, sequence]);

  useEffect(() => {
    if (phase !== "recall" || finishedRef.current) return;

    const timeoutId = setTimeout(() => {
      if (finishedRef.current) return;

      const idx = currentInputIndexRef.current;
      if (idx >= sequence.length) return;

      const blockIndex = sequence[idx];
      penaltySecondsRef.current += 0.5;

      setBlockStatus((prev) => {
        const next = [...prev];
        next[blockIndex] = "incorrect";
        return next;
      });

      const nextIdx = idx + 1;
      currentInputIndexRef.current = nextIdx;
      setInputIndex(nextIdx);

      if (nextIdx >= sequence.length) {
        const now = performance.now();
        const baseTimeSeconds =
          recallStartRef.current != null
            ? (now - recallStartRef.current) / 1000
            : 0;
        const penaltySeconds = penaltySecondsRef.current;

        finishedRef.current = true;
        setPhase("done");

        addScore(baseTimeSeconds, penaltySeconds);

        setTimeout(() => {
          nextTurn();
          if (recallStartRef.current != null) {
            const elapsedMs = now - recallStartRef.current;
            onComplete?.(elapsedMs);
          }
        }, 200);
      }
    }, BLOCK_TIMEOUT_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [phase, addScore, nextTurn, onComplete, sequence]);

  useEffect(() => {
    if (phase !== "recall" || finishedRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (finishedRef.current) return;

      const key = event.key.toUpperCase();
      if (!/^[A-Z]$/.test(key)) return;

      const idx = currentInputIndexRef.current;
      if (idx >= sequence.length) return;

      const blockIndex = sequence[idx];
      const expectedLetter = blockLetters[blockIndex];

      if (key === expectedLetter) {
        setBlockStatus((prev) => {
          const next = [...prev];
          next[blockIndex] = "correct";
          return next;
        });

        const nextIdx = idx + 1;
        currentInputIndexRef.current = nextIdx;
        setInputIndex(nextIdx);

        if (nextIdx >= sequence.length) {
          const now = performance.now();
          const baseTimeSeconds =
            recallStartRef.current != null
              ? (now - recallStartRef.current) / 1000
              : 0;
          const penaltySeconds = penaltySecondsRef.current;

          finishedRef.current = true;
          setPhase("done");

          addScore(baseTimeSeconds, penaltySeconds);

          setTimeout(() => {
            nextTurn();
            if (recallStartRef.current != null) {
              const elapsedMs = now - recallStartRef.current;
              onComplete?.(elapsedMs);
            }
          }, 200);
        }
      } else {
        penaltySecondsRef.current += 0.5;

        setBlockStatus((prev) => {
          const next = [...prev];
          next[blockIndex] = "incorrect";
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [phase, addScore, nextTurn, onComplete, blockLetters, sequence]);

  const renderBlock = (index: number) => {
    const status = blockStatus[index];
    const letter = blockLetters[index];

    let bg = "bg-slate-800";
    let ring = "ring-1 ring-slate-700";

    if (phase === "sequence" && highlightedIndex === index) {
      bg = "bg-yellow-400";
      ring = "ring-2 ring-yellow-200";
    }

    if (status === "correct") {
      bg = "bg-emerald-500";
      ring = "ring-2 ring-emerald-200";
    } else if (status === "incorrect") {
      bg = "bg-red-500";
      ring = "ring-2 ring-red-200";
    }

    return (
      <div
        key={index}
        className={`flex aspect-square items-center justify-center rounded-lg text-xl font-semibold text-slate-900 shadow-sm transition-all duration-150 ${bg} ${ring}`}
      >
        <span>{letter}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        Corsi Block Task
      </p>

      <div className="grid h-52 w-52 grid-cols-3 gap-3 md:h-60 md:w-60">
        {Array.from({ length: GRID_SIZE }, (_, i) => renderBlock(i))}
      </div>

      <p className="text-[11px] text-slate-300">
        {phase === "sequence"
          ? "Watch the sequence carefully."
          : phase === "recall"
            ? `Type the letters in the order they flashed. Progress: ${
                inputIndex + 1
              } / ${SEQUENCE_LENGTH}`
            : "Sequence complete."}
      </p>
    </div>
  );
};

