"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";

const COUNTDOWN_DURATION_MS = 1000;
const READY_DURATION_MS = 2500;

export function TutorialCompleteScreen() {
  const startMainGame = useGameStore((s) => s.startMainGame);
  const [phase, setPhase] = useState<"card" | "ready" | 3 | 2 | 1>("card");

  useEffect(() => {
    if (phase === "ready") {
      const t = setTimeout(() => setPhase(3), READY_DURATION_MS);
      return () => clearTimeout(t);
    }
    if (phase === 3 || phase === 2 || phase === 1) {
      const t = setTimeout(() => {
        if (phase === 1) {
          startMainGame();
        } else {
          setPhase(phase === 3 ? 2 : 1);
        }
      }, COUNTDOWN_DURATION_MS);
      return () => clearTimeout(t);
    }
  }, [phase, startMainGame]);

  if (phase === "ready") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-bubbly text-center text-3xl font-black uppercase tracking-wide text-cyan-300 md:text-4xl"
        >
          Ready to dive in?!
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-bubbly mt-2 text-center text-2xl font-bold uppercase tracking-wider text-white/90 md:text-3xl"
        >
          LET&apos;S BEGIN —
        </motion.p>
      </div>
    );
  }

  if (phase === 3 || phase === 2 || phase === 1) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <motion.span
          key={phase}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.2, opacity: 0 }}
          className="font-bubbly text-8xl font-black tabular-nums text-cyan-300 drop-shadow-[0_0_30px_rgba(34,211,238,0.6)] md:text-9xl"
        >
          {phase}
        </motion.span>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex w-full max-w-2xl flex-col rounded-3xl border-2 border-[var(--modal-border)] bg-[var(--modal-bg)] p-8 shadow-2xl md:p-10"
      >
        <div className="flex flex-col items-center gap-8 text-center">
          <h1 className="font-bubbly text-3xl font-black uppercase tracking-wide text-cyan-100 md:text-4xl">
            Tutorial Complete!
          </h1>

          <div className="space-y-6 text-left">
            <p className="text-lg leading-relaxed text-cyan-100/95">
              The mission is calculated based on <strong className="text-cyan-100">Speed</strong> and{" "}
              <strong className="text-cyan-100">Accuracy</strong>. Every millisecond counts, but every
              mistake adds a time penalty to your score.
            </p>
            <p className="text-lg leading-relaxed text-cyan-100/95">
              Whoever gets the <strong className="text-cyan-100">fastest overall reaction time</strong>{" "}
              at the end wins the race.
            </p>
          </div>

          <motion.div
            className="relative inline-block"
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              scale: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          >
            <motion.div
              className="absolute -inset-2 rounded-3xl border-2 border-cyan-400/60"
              animate={{
                opacity: [0.5, 0.2, 0.5],
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.button
              type="button"
              onClick={() => setPhase("ready")}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              className="relative rounded-2xl border-2 border-cyan-400 bg-cyan-500 px-10 py-5 text-xl font-black uppercase tracking-wider text-white shadow-[0_0_30px_rgba(34,211,238,0.5)]"
            >
              Dive In — Start the Race
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
