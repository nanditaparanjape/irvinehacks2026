"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/useGameStore";

const GRID_SIZE_DEFAULT = 16; // 4x4
const GRID_SIZE_TUTORIAL = 25; // 5x5
const TARGET_COUNT = 8;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export interface SpeedGridTestProps {
  onComplete?: (elapsedMs: number) => void;
  onTutorialComplete?: () => void;
}

export const SpeedGridTest = ({ onComplete, onTutorialComplete }: SpeedGridTestProps) => {
  const addScore = useGameStore((s) => s.addScore);
  const nextTurn = useGameStore((s) => s.nextTurn);
  const isTutorial = useGameStore((s) => s.isTutorial);

  const gridSize = isTutorial ? GRID_SIZE_TUTORIAL : GRID_SIZE_DEFAULT;
  const cols = isTutorial ? 5 : 4;
  const rows = gridSize / cols;

  const [cellLetters] = useState(() => {
    const arr = LETTERS.split("")
      .sort(() => Math.random() - 0.5)
      .slice(0, gridSize);
    return arr as string[];
  });

  const [targets] = useState(() =>
    Array.from({ length: TARGET_COUNT }, () =>
      Math.floor(Math.random() * gridSize),
    ),
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [currentTarget, setCurrentTarget] = useState(0);
  const [wrongCellIndex, setWrongCellIndex] = useState<number | null>(null);
  const totalReactionMsRef = useRef(0);
  const flashStartRef = useRef<number>(0);
  const finishedRef = useRef(false);
  const wrongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNext = useCallback(() => {
    const nextIdx = currentTarget;
    if (nextIdx >= targets.length) {
      finishedRef.current = true;
      const totalSec = totalReactionMsRef.current / 1000;
      if (onTutorialComplete) {
        setTimeout(() => {
          onTutorialComplete();
          onComplete?.(totalReactionMsRef.current);
        }, 150);
        return;
      }
      addScore(totalSec, 0);
      setTimeout(() => {
        nextTurn();
        onComplete?.(totalReactionMsRef.current);
      }, 150);
      return;
    }
    setActiveIndex(null);
    const next = targets[nextIdx]!;
    requestAnimationFrame(() => {
      setActiveIndex(next);
      flashStartRef.current = performance.now();
    });
    setCurrentTarget((c) => c + 1);
  }, [currentTarget, targets, addScore, nextTurn, onComplete, onTutorialComplete]);

  useEffect(() => {
    if (activeIndex === null && currentTarget === 0) {
      const first = targets[0]!;
      setActiveIndex(first);
      flashStartRef.current = performance.now();
      setCurrentTarget(1);
    }
  }, [activeIndex, currentTarget, targets]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (finishedRef.current || activeIndex === null) return;
      const key = e.key.toUpperCase();
      if (!/^[A-Z]$/.test(key)) return;
      const expected = cellLetters[activeIndex];
      if (key !== expected) {
        if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current);
        setWrongCellIndex(activeIndex);
        wrongTimeoutRef.current = setTimeout(() => {
          wrongTimeoutRef.current = null;
          setWrongCellIndex(null);
        }, 500);
        return;
      }
      const elapsed = performance.now() - flashStartRef.current;
      totalReactionMsRef.current += elapsed;
      showNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current);
    };
  }, [activeIndex, cellLetters, showNext]);

  const handleCellClick = (index: number) => {
    if (finishedRef.current) return;
    if (activeIndex !== index) {
      if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current);
      setWrongCellIndex(index);
      wrongTimeoutRef.current = setTimeout(() => {
        wrongTimeoutRef.current = null;
        setWrongCellIndex(null);
      }, 500);
      return;
    }
    const elapsed = performance.now() - flashStartRef.current;
    totalReactionMsRef.current += elapsed;
    showNext();
  };

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-6">
      {/* Grid centered in the middle — no overlap with header above or instruction below */}
      <div
        className="grid shrink-0 gap-3 sm:gap-4"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          width: isTutorial ? "min(92vw, 380px)" : "min(92vw, 400px)",
        }}
      >
        {cellLetters.map((letter, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleCellClick(i)}
            className={`flex aspect-square min-w-[2rem] items-center justify-center rounded-full text-lg font-bold shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] transition sm:min-w-[2.5rem] sm:text-xl ${
              wrongCellIndex === i
                ? "bg-red-500 text-white ring-2 ring-red-400"
                : activeIndex === i
                  ? "bg-cyan-500 text-white ring-2 ring-cyan-300"
                  : "bg-white/15 text-white/60 hover:bg-white/25"
            }`}
          >
            {(activeIndex === i || wrongCellIndex === i) ? letter : ""}
          </button>
        ))}
      </div>
      {/* Progress only when not tutorial; no instruction text in tutorial */}
      {!isTutorial && (
        <div className="w-full shrink-0 text-center">
          <p className="text-sm text-cyan-300/80">
            Type or click the letter that appears • {currentTarget} / {TARGET_COUNT}
          </p>
        </div>
      )}
    </div>
  );
};
