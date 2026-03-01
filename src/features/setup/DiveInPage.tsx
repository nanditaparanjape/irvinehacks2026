"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";

const BUBBLE_COUNT = 42;

function BubbleField({
  scrollYProgress,
}: {
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const [speedFactor, setSpeedFactor] = useState(1);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setSpeedFactor(1 + v * 1.2);
  });
  const bubbleOpacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5],
    [0.25, 0.45, 0.65],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: BUBBLE_COUNT }).map((_, i) => (
        <Bubble key={i} index={i} speedFactor={speedFactor} opacity={bubbleOpacity} />
      ))}
    </div>
  );
}

function Bubble({
  index,
  speedFactor,
  opacity,
}: {
  index: number;
  speedFactor: number;
  opacity: ReturnType<typeof useTransform>;
}) {
  const baseDuration = 2.2 + (index % 6) * 0.25;
  const left = (index * 19 + (index % 7) * 11) % 98;
  const bottom = (index * 23 + (index % 5) * 17) % 92;
  return (
    <motion.div
      className="absolute rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]"
      style={{
        width: 10 + (index % 6) * 3,
        height: 10 + (index % 6) * 3,
        left: `${left}%`,
        bottom: `${bottom}%`,
        opacity,
      }}
      animate={{ y: [0, -14, 0] }}
      transition={{
        duration: baseDuration / speedFactor,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.08,
      }}
    />
  );
}

export function DiveInPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.4, 0.8],
    ["#1AA4B8", "#1A94B8", "#1A84B8"],
  );

  const divePromptOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [showBriefing, setShowBriefing] = useState(false);
  const p2InputRef = useRef<HTMLInputElement>(null);

  const setPlayer1Name = useGameStore((s) => s.setPlayer1Name);
  const setPlayer2Name = useGameStore((s) => s.setPlayer2Name);
  const startTutorial = useGameStore((s) => s.startTutorial);
  const skipToTutorialComplete = useGameStore((s) => s.skipToTutorialComplete);

  const canStart = p1.trim().length > 0 && p2.trim().length > 0;

  const handleContinue = useCallback(() => {
    if (!canStart) return;
    setPlayer1Name(p1.trim());
    setPlayer2Name(p2.trim());
    setShowBriefing(true);
  }, [canStart, p1, p2, setPlayer1Name, setPlayer2Name]);

  const handleDiveNow = useCallback(() => {
    setPlayer1Name(p1.trim());
    setPlayer2Name(p2.trim());
    startTutorial();
  }, [p1, p2, setPlayer1Name, setPlayer2Name, startTutorial]);

  const handleSkipTutorial = useCallback(() => {
    setPlayer1Name(p1.trim());
    setPlayer2Name(p2.trim());
    skipToTutorialComplete();
  }, [p1, p2, setPlayer1Name, setPlayer2Name, skipToTutorialComplete]);

  return (
    <div ref={containerRef} className="relative min-h-[200vh]">
      {/* Ocean Canvas: absolute bottom layer; no overflow/background on parent */}
      <motion.div
        className="fixed inset-0 z-[-50]"
        style={{ backgroundColor }}
        aria-hidden
      >
        <BubbleField scrollYProgress={scrollYProgress} />
      </motion.div>

      {/* Surface — interactive layer above background */}
      <section className="relative z-10 flex min-h-[100vh] flex-col items-center justify-center px-4 pt-16">
        <div className="relative z-10 flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-bubbly flex flex-wrap justify-center gap-1 text-center text-5xl font-bold tracking-tight text-white drop-shadow-lg md:gap-2 md:text-7xl"
          >
            {"SEAQUEST".split("").map((char, i) => (
              <motion.span
                key={`${char}-${i}`}
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 2.2 + i * 0.15,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.08,
                }}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </motion.h1>
          <div className="mt-12 flex gap-16">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-white/40 bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.3)] backdrop-blur-sm"
            >
              <span className="font-bubbly text-xs font-bold text-white">Voyager</span>
              <span className="font-bubbly mt-0.5 text-2xl font-bold text-white/95">1</span>
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-white/40 bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.3)] backdrop-blur-sm"
            >
              <span className="font-bubbly text-xs font-bold text-white">Voyager</span>
              <span className="font-bubbly mt-0.5 text-2xl font-bold text-white/95">2</span>
            </motion.div>
          </div>
          <motion.div
            className="mt-16"
            style={{ opacity: divePromptOpacity }}
          >
            <p className="font-bubbly text-center text-xl font-bold text-white md:text-2xl">
              Scroll to dive
            </p>
            <p className="mt-2 text-center text-2xl text-cyan-300" aria-hidden>
              ↓
            </p>
          </motion.div>
        </div>
      </section>

      {/* Underwater — Crew names + mascots; always visible, no fade */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pb-32 pt-24">
        <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8">
          <div className="w-full rounded-3xl border border-cyan-400/40 bg-white/10 p-6 backdrop-blur-md">
            <h2 className="font-bubbly text-center text-xl font-bold text-cyan-300">
              Crew names
            </h2>
            <p className="mt-1 text-center text-sm text-white/90">
              Enter names then continue for mission briefing
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-cyan-200/90">
                  Player 1
                </label>
                <input
                  type="text"
                  value={p1}
                  onChange={(e) => setP1(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      p2InputRef.current?.focus();
                    }
                  }}
                  placeholder="Voyager name"
                  className="mt-1 w-full rounded-xl border border-cyan-500/50 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 backdrop-blur-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-cyan-200/90">
                  Player 2
                </label>
                <input
                  ref={p2InputRef}
                  type="text"
                  value={p2}
                  onChange={(e) => setP2(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (canStart) handleContinue();
                    }
                  }}
                  placeholder="Voyager name"
                  className="mt-1 w-full rounded-xl border border-cyan-500/50 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 backdrop-blur-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canStart}
              className="mt-6 w-full rounded-xl bg-cyan-500/80 py-3 font-bold text-white transition hover:bg-cyan-400 disabled:opacity-50"
            >
              Dive in
            </button>
          </div>
          <div className="flex gap-12">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-cyan-400/50 bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.3)] backdrop-blur-md"
            >
              <span className="font-bubbly text-2xl font-bold text-cyan-300">1</span>
            </motion.div>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{
                repeat: Infinity,
                duration: 3,
                delay: 0.3,
                ease: "easeInOut",
              }}
              className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-cyan-400/50 bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.3)] backdrop-blur-md"
            >
              <span className="font-bubbly text-2xl font-bold text-cyan-300">2</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission Briefing modal */}
      {showBriefing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#03045E]/70 p-4 backdrop-blur-sm"
          onClick={() => setShowBriefing(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-cyan-400/50 bg-[#0077B6] p-6 shadow-2xl"
          >
            <h2 className="font-bubbly text-center text-2xl font-bold text-cyan-300">
              Mission Briefing
            </h2>
            <p className="mt-2 text-center text-sm text-white/80">
              Four challenges. Speed wins.
            </p>
            <ul className="mt-6 space-y-4 text-sm text-white/90">
              <li className="rounded-xl border border-cyan-500/30 bg-[#03045E]/25 p-3">
                <strong className="text-cyan-300">Color Coral</strong> — The reef is changing colors! Click Y if the color of the text matches the word, or N if not.
              </li>
              <li className="rounded-xl border border-cyan-500/30 bg-[#03045E]/25 p-3">
                <strong className="text-cyan-300">Bubble Burst</strong> — A letter flashes inside a bubble on the grid. Pop it by typing the letter as fast as you can!
              </li>
              <li className="rounded-xl border border-cyan-500/30 bg-[#03045E]/25 p-3">
                <strong className="text-cyan-300">Deep Dive</strong> — Check the math to keep your air! Type Y if the sum is right or N if it&apos;s wrong.
              </li>
              <li className="rounded-xl border border-cyan-500/30 bg-[#03045E]/25 p-3">
                <strong className="text-cyan-300">Shark Attack</strong> — Press if SHARK present!
              </li>
            </ul>
            <button
              type="button"
              onClick={handleDiveNow}
              className="mt-8 w-full rounded-xl bg-cyan-400 py-4 text-lg font-black uppercase tracking-wide text-[#000814] shadow-lg shadow-cyan-400/50 transition hover:bg-cyan-300"
            >
              Dive into TUTORIAL
            </button>
            <button
              type="button"
              onClick={handleSkipTutorial}
              className="mt-3 w-full rounded-xl border-2 border-cyan-400/60 bg-transparent py-3 text-base font-bold text-cyan-200 transition hover:bg-cyan-400/20"
            >
              Skip Tutorial
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
