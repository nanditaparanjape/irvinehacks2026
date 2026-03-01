"use client";

import { motion } from "framer-motion";
import type { RoundTestType } from "@/store/useGameStore";
import { TUTORIAL_MISSION_TESTS } from "@/store/useGameStore";
import { KeyCap } from "@/components/KeyCap";
import { ChallengeExampleModal } from "./ChallengeDemos";

const PREVIEW_CONTENT: Record<RoundTestType, { title: string; instruction: string }> = {
  stroop: {
    title: "Color Coral",
    instruction:
      "The reef is changing colors! Click Y if the color of the text matches the word, or N if not.",
  },
  speedgrid: {
    title: "Bubble Burst",
    instruction:
      "A letter flashes inside a bubble on the grid. Pop it by typing the letter as fast as you can!",
  },
  equation: {
    title: "Deep Dive",
    instruction:
      "Check the math to keep your air! Type Y if the sum is right or N if it's wrong.",
  },
  gonogo: {
    title: "Shark Attack",
    instruction:
      "Press SPACE if a shark is present!",
  },
};

function instructionWithKeyCaps(instruction: string) {
  const parts = instruction.split(/\b(Y|N|SPACE)\b/gi);
  return parts.map((p, i) => {
    const u = p.toUpperCase();
    if (u === "Y") return <KeyCap key={i}>Y</KeyCap>;
    if (u === "N") return <KeyCap key={i}>N</KeyCap>;
    if (u === "SPACE") return <KeyCap key={i}>Space</KeyCap>;
    return <span key={i}>{p}</span>;
  });
}

export function TutorialPreview({
  mission,
  onTryIt,
}: {
  mission: number;
  onTryIt: () => void;
}) {
  const testType = TUTORIAL_MISSION_TESTS[mission - 1] ?? "stroop";
  const { title, instruction } = PREVIEW_CONTENT[testType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full max-w-xl min-w-0 flex-col gap-5 rounded-2xl border-2 border-cyan-500/40 bg-white/10 p-6"
    >
      <div className="rounded-xl border border-cyan-500/40 bg-white/10 p-4">
        <h2 className="font-bubbly text-center text-2xl font-semibold text-cyan-300 md:text-3xl">
          {title}
        </h2>
      </div>

      <div className="rounded-xl border border-cyan-500/40 bg-white/10 p-4">
        <p className="text-lg leading-relaxed text-white/95 md:text-xl">
          {instructionWithKeyCaps(instruction)}
        </p>
      </div>

      <ChallengeExampleModal testType={testType} />

      <button
        type="button"
        onClick={onTryIt}
        className="rounded-xl border-2 border-cyan-400 bg-cyan-500/50 py-4 text-xl font-bold text-cyan-200 transition hover:bg-cyan-500/70"
      >
        Try it
      </button>
    </motion.div>
  );
}
