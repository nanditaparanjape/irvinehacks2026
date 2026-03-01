"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useGameStore, MAX_ROUNDS } from "@/store/useGameStore";
import type { RoundTestType } from "@/store/useGameStore";

const BUBBLE_COUNT = 42;

function ResultsBubbleField({
  scrollYProgress,
}: {
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const [speedFactor, setSpeedFactor] = useState(1);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setSpeedFactor(1 + v * 0.4);
  });
  const bubbleOpacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5],
    [0.25, 0.45, 0.65],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: BUBBLE_COUNT }).map((_, i) => {
        const baseDuration = 2.2 + (i % 6) * 0.25;
        const left = (i * 19 + (i % 7) * 11) % 98;
        const bottom = (i * 23 + (i % 5) * 17) % 92;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]"
            style={{
              width: 10 + (i % 6) * 3,
              height: 10 + (i % 6) * 3,
              left: `${left}%`,
              bottom: `${bottom}%`,
              opacity: bubbleOpacity,
            }}
            animate={{ y: [0, -14, 0] }}
            transition={{
              duration: baseDuration / speedFactor,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.08,
            }}
          />
        );
      })}
    </div>
  );
}

const TEST_LABELS: Record<RoundTestType, string> = {
  stroop: "Color Coral",
  speedgrid: "Bubble Burst",
  equation: "Deep Dive",
  gonogo: "Shark Attack",
};

export function ResultsScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.4, 0.8],
    ["#1AA4B8", "#1A94B8", "#1A84B8"],
  );
  const learnPromptOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  const startNewGame = useGameStore((state) => state.startNewGame);
  const player1Name = useGameStore((state) => state.player1Name);
  const player2Name = useGameStore((state) => state.player2Name);
  const player1TotalTime = useGameStore((state) => state.player1TotalTime);
  const player2TotalTime = useGameStore((state) => state.player2TotalTime);
  const scoreLog = useGameStore((state) => state.scoreLog);
  const roundTestTypes = useGameStore((state) => state.roundTestTypes);


  const { winner, isTie, p1Name, p2Name } = useMemo(() => {
    const p1 = player1Name || "Player 1";
    const p2 = player2Name || "Player 2";
    const tie = player1TotalTime === player2TotalTime;
    const winner =
      tie ? null : player1TotalTime < player2TotalTime ? 1 : 2;
    return {
      winner,
      isTie: tie,
      p1Name: p1,
      p2Name: p2,
    };
  }, [
    player1Name,
    player2Name,
    player1TotalTime,
    player2TotalTime,
  ]);

  const runBreakdown = useMemo(() => {
    const byTest: Record<
      RoundTestType,
      { p1: number; p2: number }
    > = {
      stroop: { p1: 0, p2: 0 },
      speedgrid: { p1: 0, p2: 0 },
      equation: { p1: 0, p2: 0 },
      gonogo: { p1: 0, p2: 0 },
    };

    scoreLog.forEach((entry) => {
      const testType = roundTestTypes[entry.roundNumber - 1];
      if (!testType) return;
      if (entry.player === 1) {
        byTest[testType].p1 += entry.totalTime;
      } else {
        byTest[testType].p2 += entry.totalTime;
      }
    });

    return (TESTS: RoundTestType[]) =>
      TESTS.map((test) => {
        const { p1, p2 } = byTest[test];
        const total = p1 + p2;
        if (total === 0) return { test, text: `${TEST_LABELS[test]}: No data` };
        if (p1 < p2) {
          const pct = p2 > 0 ? (((p2 - p1) / p2) * 100).toFixed(0) : "0";
          return {
            test,
            text: `${p1Name} was ${pct}% faster at ${TEST_LABELS[test]}`,
            winner: 1 as const,
          };
        }
        if (p2 < p1) {
          const pct = p1 > 0 ? (((p1 - p2) / p1) * 100).toFixed(0) : "0";
          return {
            test,
            text: `${p2Name} was ${pct}% faster at ${TEST_LABELS[test]}`,
            winner: 2 as const,
          };
        }
        return {
          test,
          text: `Tie at ${TEST_LABELS[test]}`,
          winner: null as const,
        };
      });
  }, [
    scoreLog,
    roundTestTypes,
    p1Name,
    p2Name,
  ]);

  const breakdownLines = useMemo(
    () => runBreakdown(["stroop", "speedgrid", "equation", "gonogo"]),
    [runBreakdown],
  );

  const handleNewGame = () => {
    startNewGame();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div ref={containerRef} className="relative min-h-[200vh]">
      {/* Ocean canvas: gradient + bubbles (mimic first page) */}
      <motion.div
        className="fixed inset-0 z-[-50]"
        style={{ backgroundColor }}
        aria-hidden
      >
        <ResultsBubbleField scrollYProgress={scrollYProgress} />
      </motion.div>

      {/* Section 1: Results + scroll CTA */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-between px-4 py-16">
        <div className="flex w-full max-w-lg flex-1 flex-col justify-center gap-8 rounded-2xl border border-cyan-500/30 bg-black/40 p-6 shadow-2xl backdrop-blur-sm">
          {/* Winner / Tie headline */}
          <div className="text-center">
            {isTie ? (
              <motion.h1
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="font-bubbly text-4xl font-black tracking-tight text-cyan-400 md:text-5xl"
              >
                It&apos;s a Tie!
              </motion.h1>
            ) : (
              <motion.h1
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="font-bubbly text-4xl font-black tracking-tight text-cyan-300 md:text-5xl"
              >
                {winner === 1 ? p1Name : p2Name} Wins!
              </motion.h1>
            )}
          </div>

          {/* Mascots */}
          <div className="flex justify-center gap-8">
            {isTie ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 border-cyan-500/60 bg-black/40 text-cyan-400 backdrop-blur-sm"
                >
                  <span className="text-xs font-semibold uppercase">Mascot</span>
                  <span className="text-sm font-bold">{p1Name}</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.1,
                  }}
                  className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 border-cyan-500/60 bg-black/40 text-cyan-400 backdrop-blur-sm"
                >
                  <span className="text-xs font-semibold uppercase">Mascot</span>
                  <span className="text-sm font-bold">{p2Name}</span>
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.15, 1],
                  opacity: 1,
                  transition: {
                    scale: { times: [0, 0.7, 1], duration: 0.5 },
                  },
                }}
                className="flex h-36 w-36 flex-col items-center justify-center rounded-full border-2 border-cyan-400 bg-black/40 text-cyan-300 shadow-lg shadow-cyan-500/30 backdrop-blur-sm"
              >
                <motion.span
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.8,
                    ease: "easeInOut",
                  }}
                  className="flex flex-col items-center"
                >
                  <span className="text-xs font-semibold uppercase">Winner</span>
                  <span className="mt-1 text-lg font-bold">
                    {winner === 1 ? p1Name : p2Name}
                  </span>
                </motion.span>
              </motion.div>
            )}
          </div>

          {/* Stats comparison */}
          <p className="text-center text-xs text-slate-500">
            Collective Action Time over {MAX_ROUNDS} rounds
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-lg">
            <span
              className={
                !isTie && winner === 1
                  ? "font-bold text-cyan-300"
                  : !isTie && winner === 2
                    ? "text-fuchsia-400/90"
                    : "text-slate-300"
              }
            >
              {p1Name}: {player1TotalTime.toFixed(1)}s
            </span>
            <span className="text-slate-500">vs</span>
            <span
              className={
                !isTie && winner === 2
                  ? "font-bold text-cyan-300"
                  : !isTie && winner === 1
                    ? "text-fuchsia-400/90"
                    : "text-slate-300"
              }
            >
              {p2Name}: {player2TotalTime.toFixed(1)}s
            </span>
          </div>

          {/* Run breakdown — always visible */}
          <div className="border-t border-cyan-500/20 pt-6">
            <ul className="space-y-2 text-sm text-slate-300">
              {breakdownLines.map(({ text }, i) => (
                <li key={`breakdown-${i}`}>{text}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Scroll CTA (fades as user scrolls) */}
        <motion.div
          className="shrink-0 pb-10 pt-2"
          style={{ opacity: learnPromptOpacity }}
        >
          <p className="font-bubbly text-center text-xl font-bold text-white md:text-2xl">
            Scroll down to learn the science
          </p>
          <p className="mt-2 text-center text-2xl text-cyan-300" aria-hidden>
            ↓
          </p>
        </motion.div>
      </section>

      {/* Section 2: Learn the Science card (same format as Mission Briefing) + New Game */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pb-32 pt-24">
        <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-black/40 p-6 shadow-2xl backdrop-blur-sm">
          <h2 className="font-bubbly text-center text-2xl font-bold text-cyan-300 md:text-3xl">
            Learn the Science
          </h2>
          <ul className="mt-6 space-y-4 text-sm text-white/90">
            <li className="rounded-xl border border-cyan-500/30 bg-[#03045E]/25 p-3">
              <strong className="text-cyan-300">Color Coral</strong> — The Stroop effect measures selective attention and cognitive control. When word meaning and ink color conflict, your brain must inhibit automatic reading; faster, accurate responses reflect stronger executive control.
            </li>
            <li className="rounded-xl border border-cyan-500/30 bg-[#03045E]/25 p-3">
              <strong className="text-cyan-300">Bubble Burst</strong> — Inspired by the Corsi block test, but with a twist: instead of memorizing a sequence, you react to each letter as it appears. This taps processing speed and visuospatial attention; your reaction time reflects how quickly you can locate a target and execute a response.
            </li>
            <li className="rounded-xl border border-cyan-500/30 bg-[#03045E]/25 p-3">
              <strong className="text-cyan-300">Deep Dive</strong> — Mental arithmetic and working memory. Verifying equations under time pressure measures calculation speed and sustained attention; both accuracy and speed reflect how well you manage cognitive load.
            </li>
            <li className="rounded-xl border border-cyan-500/30 bg-[#03045E]/25 p-3">
              <strong className="text-cyan-300">Shark Attack</strong> — Response inhibition. Press when you see the shark; do nothing when it’s clear. This tests reaction time to a target and the ability to withhold when there’s no shark—key parts of executive function.
            </li>
          </ul>
          <div className="mt-8 flex justify-center">
            <motion.button
              type="button"
              onClick={handleNewGame}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl border-2 border-white/40 bg-white/10 px-8 py-4 text-lg font-bold uppercase tracking-wider text-white/90 transition hover:bg-white/20"
            >
              New Game
            </motion.button>
          </div>
        </div>
      </section>
    </div>
  );
}
