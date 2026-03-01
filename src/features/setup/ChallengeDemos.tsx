"use client";

import { useEffect, useState } from "react";
import type { RoundTestType } from "@/store/useGameStore";
import { KeyCap } from "@/components/KeyCap";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const COLOR_CLASS: Record<string, string> = {
  RED: "text-red-400",
  BLUE: "text-sky-400",
  GREEN: "text-emerald-400",
  YELLOW: "text-yellow-300",
};
/** Non-interactive demo: grid of bubbles with one letter appearing then disappearing in sequence */
export function BubbleBurstDemo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const gridSize = 16;
  const cols = 4;
  const rows = 4;
  const cellLetters = LETTERS.slice(0, gridSize).split("");

  useEffect(() => {
    const t = setInterval(() => {
      setActiveIndex((i) => (i + 1) % gridSize);
    }, 800);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        width: "min(100%, 220px)",
      }}
    >
      {cellLetters.map((letter, i) => (
        <div
          key={i}
          className={`flex aspect-square items-center justify-center rounded-full text-sm font-bold transition sm:text-base ${
            activeIndex === i
              ? "bg-cyan-500 text-white ring-2 ring-cyan-300"
              : "bg-white/15 text-white/50"
          }`}
        >
          {activeIndex === i ? letter : ""}
        </div>
      ))}
    </div>
  );
}

/** Non-interactive: one Stroop example with Y (match), one with N (mismatch) */
export function ColorCoralDemo() {
  const matchExample = { text: "RED" as const, color: "RED" as const };
  const mismatchExample = { text: "BLUE" as const, color: "RED" as const }; // word BLUE shown in red

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <div className="flex flex-col items-center gap-2 rounded-xl border border-cyan-500/30 bg-white/10 px-4 py-3">
        <span className={`text-2xl font-bold ${COLOR_CLASS[matchExample.color]}`}>
          {matchExample.text}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-cyan-200">
          <KeyCap variant="positive">Y</KeyCap> match
        </span>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-xl border border-cyan-500/30 bg-white/10 px-4 py-3">
        <span className={`text-2xl font-bold ${COLOR_CLASS[mismatchExample.color]}`}>
          {mismatchExample.text}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-cyan-200">
          <KeyCap variant="negative">N</KeyCap> no match
        </span>
      </div>
    </div>
  );
}

/** Non-interactive: one equation with Y (correct), one with N (incorrect) */
export function DeepDiveDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <div className="flex flex-col items-center gap-2 rounded-xl border border-cyan-500/30 bg-white/10 px-4 py-3">
        <p className="font-mono text-xl font-bold text-slate-100">3 + 5 = 8</p>
        <span className="flex items-center gap-1.5 text-xs text-cyan-200">
          <KeyCap variant="positive">Y</KeyCap> correct
        </span>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-xl border border-cyan-500/30 bg-white/10 px-4 py-3">
        <p className="font-mono text-xl font-bold text-slate-100">10 − 4 = 5</p>
        <span className="flex items-center gap-1.5 text-xs text-cyan-200">
          <KeyCap variant="negative">N</KeyCap> incorrect
        </span>
      </div>
    </div>
  );
}

/** Non-interactive: SHARK and NO SHARK side by side */
export function SharkAttackDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold tracking-wide text-white shadow-lg">
          SHARK
        </div>
        <span className="text-xs text-cyan-200">Press Space</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-600 text-sm font-bold tracking-wide text-white shadow-lg">
          NO SHARK
        </div>
        <span className="text-xs text-cyan-200">Don&apos;t press</span>
      </div>
    </div>
  );
}

export function ChallengeExampleModal({ testType }: { testType: RoundTestType }) {
  return (
    <div className="inline-flex w-fit flex-col self-center rounded-xl border-2 border-cyan-400/50 bg-cyan-300/20 p-4">
      <p className="mb-3 text-center text-sm font-semibold text-cyan-200">Example</p>
      <div className="flex justify-center">
        {testType === "speedgrid" && <BubbleBurstDemo />}
        {testType === "stroop" && <ColorCoralDemo />}
        {testType === "equation" && <DeepDiveDemo />}
        {testType === "gonogo" && <SharkAttackDemo />}
      </div>
    </div>
  );
}
