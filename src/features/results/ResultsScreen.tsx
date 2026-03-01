"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";
import type { RoundTestType } from "@/store/useGameStore";
import { CharacterImg } from "@/components/CharacterImg";

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
          winner: null,
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
        className="pointer-events-none fixed inset-0 z-[-50]"
        style={{ backgroundColor }}
        aria-hidden
      >
        <ResultsBubbleField scrollYProgress={scrollYProgress} />
      </motion.div>

      {/* Section 1: Results + scroll CTA — crew-names style */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-between px-4 py-16">
        <div className="flex w-full max-w-lg flex-1 flex-col justify-center gap-8 rounded-3xl border-2 border-cyan-400/60 bg-[var(--modal-bg)]/95 p-8 shadow-2xl backdrop-blur-md">
          {/* Winner / Tie headline */}
          <div className="text-center">
            {isTie ? (
              <motion.h1
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="font-bubbly text-4xl font-black tracking-tight text-cyan-100 md:text-5xl"
              >
                It&apos;s a Tie!
              </motion.h1>
            ) : (
              <motion.h1
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="font-bubbly text-4xl font-black tracking-tight text-cyan-100 md:text-5xl"
              >
                {winner === 1 ? p1Name : p2Name} Wins!
              </motion.h1>
            )}
          </div>

          {/* Character avatars with scores above: tie = same size; winner larger, loser smaller */}
          <div className="flex flex-wrap items-end justify-center gap-6">
            {isTie ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="flex flex-col items-center gap-1"
                >
                  <p className="text-center text-xl font-bold text-cyan-100 md:text-2xl">
                    {player1TotalTime.toFixed(1)}s
                  </p>
                  <div className="h-28 w-28 md:h-32 md:w-32">
                    <CharacterImg player={1} className="h-full w-full" alt={p1Name} />
                  </div>
                  <span className="text-base font-bold text-cyan-100">{p1Name}</span>
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
                  className="flex flex-col items-center gap-1"
                >
                  <p className="text-center text-xl font-bold text-cyan-100 md:text-2xl">
                    {player2TotalTime.toFixed(1)}s
                  </p>
                  <div className="h-28 w-28 md:h-32 md:w-32">
                    <CharacterImg player={2} className="h-full w-full" alt={p2Name} />
                  </div>
                  <span className="text-base font-bold text-cyan-100">{p2Name}</span>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: winner === 1 ? [0, 1.15, 1] : [0, 1],
                    opacity: 1,
                    transition: {
                      scale: { times: winner === 1 ? [0, 0.7, 1] : [0, 1], duration: 0.5 },
                    },
                  }}
                  className="flex flex-col items-center gap-1"
                >
                  <p
                    className={
                      winner === 1
                        ? "text-center text-xl font-bold text-cyan-300 md:text-2xl"
                        : "text-center text-lg font-semibold text-cyan-100/85 md:text-xl"
                    }
                  >
                    {player1TotalTime.toFixed(1)}s
                  </p>
                  <div
                    className={
                      winner === 1
                        ? "h-36 w-36 md:h-40 md:w-40"
                        : "h-20 w-20 md:h-24 md:w-24 opacity-90"
                    }
                  >
                    <CharacterImg player={1} className="h-full w-full" alt={p1Name} />
                  </div>
                  <span
                    className={
                      winner === 1
                        ? "text-base font-bold text-cyan-300"
                        : "text-base font-semibold text-cyan-100/85"
                    }
                  >
                    {p1Name}
                  </span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: winner === 2 ? [0, 1.15, 1] : [0, 1],
                    opacity: 1,
                    transition: {
                      scale: { times: winner === 2 ? [0, 0.7, 1] : [0, 1], duration: 0.5 },
                      delay: 0.1,
                    },
                  }}
                  className="flex flex-col items-center gap-1"
                >
                  <p
                    className={
                      winner === 2
                        ? "text-center text-xl font-bold text-cyan-300 md:text-2xl"
                        : "text-center text-lg font-semibold text-cyan-100/85 md:text-xl"
                    }
                  >
                    {player2TotalTime.toFixed(1)}s
                  </p>
                  <div
                    className={
                      winner === 2
                        ? "h-36 w-36 md:h-40 md:w-40"
                        : "h-20 w-20 md:h-24 md:w-24 opacity-90"
                    }
                  >
                    <CharacterImg player={2} className="h-full w-full" alt={p2Name} />
                  </div>
                  <span
                    className={
                      winner === 2
                        ? "text-base font-bold text-cyan-300"
                        : "text-base font-semibold text-cyan-100/85"
                    }
                  >
                    {p2Name}
                  </span>
                </motion.div>
              </>
            )}
          </div>

          {/* Run breakdown */}
          <div className="border-t-2 border-cyan-400/40 pt-6">
            <ul className="space-y-2.5 text-base text-cyan-100">
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
          <p className="mt-2 text-center text-4xl font-black text-cyan-300 md:text-5xl" aria-hidden>
            ↓
          </p>
        </motion.div>
      </section>

      {/* Section 2: Learn the Science — crew style + flip cards */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pb-32 pt-24">
        <div className="w-full max-w-3xl rounded-3xl border-2 border-cyan-400/60 bg-[var(--modal-bg)]/95 p-8 shadow-2xl backdrop-blur-md md:p-10">
          <h2 className="font-bubbly text-center text-3xl font-bold text-cyan-100 md:text-4xl">
            Learn the Science
          </h2>
          <p className="mt-2 text-center text-base text-cyan-100/95">
            Hover over a card to read the science behind the challenges.
          </p>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2">
            {[
              { name: "Color Coral", science: "The Stroop effect measures selective attention and cognitive control. When word meaning and ink color conflict, your brain must inhibit automatic reading; faster, accurate responses reflect stronger executive control." },
              { name: "Bubble Burst", science: "Inspired by the Corsi block test: you react to each letter as it appears. This taps processing speed and visuospatial attention; your reaction time reflects how quickly you can locate a target and execute a response." },
              { name: "Deep Dive", science: "Mental arithmetic and working memory. Verifying equations under time pressure measures calculation speed and sustained attention; both accuracy and speed reflect how well you manage cognitive load." },
              { name: "Shark Attack", science: "Response inhibition. Press when you see the shark; do nothing when it's clear. This tests reaction time to a target and the ability to withhold when there's no shark—key parts of executive function." },
            ].map(({ name, science }) => (
              <li key={name} className="group [perspective:600px]">
                <div className="relative min-h-[11rem] transition-transform duration-[800ms] ease-out [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] sm:min-h-[13rem]">
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-cyan-400/50 bg-white/25 p-4 [backface-visibility:hidden]">
                    <strong className="font-bubbly line-clamp-2 text-center text-lg font-semibold text-cyan-100 sm:text-xl">{name}</strong>
                  </div>
                  <div className="absolute inset-0 flex flex-col overflow-hidden rounded-xl border-2 border-cyan-400/50 bg-cyan-500/30 p-4 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto">
                      <p className="text-center text-xs leading-snug text-cyan-50 sm:text-sm">{science}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex justify-center">
            <motion.button
              type="button"
              onClick={handleNewGame}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl border-2 border-cyan-400 bg-cyan-500 px-8 py-4 text-xl font-bold text-[var(--modal-bg)] transition hover:bg-cyan-400"
            >
              New Game
            </motion.button>
          </div>
        </div>
      </section>
    </div>
  );
}
