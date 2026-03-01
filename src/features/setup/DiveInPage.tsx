"use client";

import { useCallback, useRef, useState } from "react";
import { type MotionValue, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";
import { KeyCap } from "@/components/KeyCap";
import { CharacterImg } from "@/components/CharacterImg";

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
  opacity: MotionValue<number>;
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
        className="pointer-events-none fixed inset-0 z-[-50]"
        style={{ backgroundColor }}
        aria-hidden
      >
        <BubbleField scrollYProgress={scrollYProgress} />
      </motion.div>

      {/* Surface — interactive layer above background; hidden when briefing open */}
      <section
        className="relative z-10 flex min-h-[100vh] flex-col items-center justify-center px-4 pt-16"
        aria-hidden={showBriefing}
        style={{ visibility: showBriefing ? "hidden" : "visible" }}
      >
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
          <div className="mt-12 flex gap-20">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="flex h-40 w-40 items-center justify-center drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)] [filter:drop-shadow(0_0_12px_rgba(255,255,255,0.25))] md:h-48 md:w-48"
            >
              <CharacterImg player={1} className="h-full w-full" alt="Player 1" />
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="flex h-40 w-40 items-center justify-center drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)] [filter:drop-shadow(0_0_12px_rgba(255,255,255,0.25))] md:h-48 md:w-48"
            >
              <CharacterImg player={2} className="h-full w-full" alt="Player 2" />
            </motion.div>
          </div>
          <motion.div
            className="mt-16"
            style={{ opacity: divePromptOpacity }}
          >
            <p className="font-bubbly text-center text-xl font-bold text-white md:text-2xl">
              scroll to dive!
            </p>
            <p className="mt-2 text-center text-2xl text-cyan-300" aria-hidden>
              ↓
            </p>
          </motion.div>
        </div>
      </section>

      {/* Underwater — Crew Names + mascots; hidden when briefing open */}
      <section
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pb-32 pt-24"
        aria-hidden={showBriefing}
        style={{ visibility: showBriefing ? "hidden" : "visible" }}
      >
        <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-10">
          <div className="w-full rounded-3xl border-2 border-cyan-400/60 bg-[var(--modal-bg)]/95 p-8 shadow-2xl backdrop-blur-md">
            <h2 className="font-bubbly text-center text-3xl font-bold text-cyan-100 md:text-4xl">
              Crew Names
            </h2>
            <p className="mt-2 text-center text-base text-cyan-100/95">
              Enter names then continue for mission briefing
            </p>
            <div className="mt-8 space-y-5">
              <div>
                <label className="text-sm font-semibold uppercase tracking-wide text-cyan-100">
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
                  className="mt-2 w-full rounded-xl border-2 border-cyan-400/50 bg-white/20 px-5 py-4 text-lg text-white placeholder:text-white/60 backdrop-blur-sm focus:border-cyan-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold uppercase tracking-wide text-cyan-100">
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
                  className="mt-2 w-full rounded-xl border-2 border-cyan-400/50 bg-white/20 px-5 py-4 text-lg text-white placeholder:text-white/60 backdrop-blur-sm focus:border-cyan-300 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canStart}
              className="mt-8 w-full rounded-xl bg-cyan-400 py-4 text-lg font-bold text-[#0d4a6e] transition hover:bg-cyan-300 disabled:opacity-50"
            >
              Dive in
            </button>
          </div>
          <div className="flex gap-16">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="flex h-32 w-32 items-center justify-center drop-shadow-[0_6px_20px_rgba(0,0,0,0.3)] [filter:drop-shadow(0_0_10px_rgba(255,255,255,0.2))] md:h-36 md:w-36"
            >
              <CharacterImg player={1} className="h-full w-full" alt="Player 1" />
            </motion.div>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{
                repeat: Infinity,
                duration: 3,
                delay: 0.3,
                ease: "easeInOut",
              }}
              className="flex h-32 w-32 items-center justify-center drop-shadow-[0_6px_20px_rgba(0,0,0,0.3)] [filter:drop-shadow(0_0_10px_rgba(255,255,255,0.2))] md:h-36 md:w-36"
            >
              <CharacterImg player={2} className="h-full w-full" alt="Player 2" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission Briefing modal */}
      {showBriefing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--modal-overlay)] p-4"
          onClick={() => setShowBriefing(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mission-briefing-title"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="onboarding-modal flex min-h-[70vh] max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto rounded-3xl border-2 border-[var(--modal-border)] bg-[var(--modal-bg)] p-8 shadow-2xl"
          >
            <h2 id="mission-briefing-title" className="font-bubbly text-center text-3xl font-bold text-cyan-100 md:text-4xl">
              Mission Briefing
            </h2>
            <p className="mt-3 text-center text-lg text-cyan-100/95">
              Four challenges. Speed wins.
            </p>
            <ul className="mt-8 space-y-5 text-lg text-cyan-100/95">
              <li className="rounded-xl border border-cyan-400/40 bg-white/15 p-4">
                <strong className="font-bubbly font-semibold text-cyan-100">Color Coral</strong> — The reef is changing colors! Click <KeyCap>Y</KeyCap> if the color of the text matches the word, or <KeyCap>N</KeyCap> if not.
              </li>
              <li className="rounded-xl border border-cyan-400/40 bg-white/15 p-4">
                <strong className="font-bubbly font-semibold text-cyan-100">Bubble Burst</strong> — A letter flashes inside a bubble on the grid. Pop it by typing the letter as fast as you can!
              </li>
              <li className="rounded-xl border border-cyan-400/40 bg-white/15 p-4">
                <strong className="font-bubbly font-semibold text-cyan-100">Deep Dive</strong> — Check the math to keep your air! Type <KeyCap>Y</KeyCap> if the sum is right or <KeyCap>N</KeyCap> if it&apos;s wrong.
              </li>
              <li className="rounded-xl border border-cyan-400/40 bg-white/15 p-4">
                <strong className="font-bubbly font-semibold text-cyan-100">Shark Attack</strong> — Press <KeyCap>Space</KeyCap> if a shark is present!
              </li>
            </ul>
            <button
              type="button"
              onClick={handleDiveNow}
              className="mt-10 w-full rounded-xl bg-cyan-400 py-4 text-xl font-black uppercase tracking-wide text-[var(--modal-bg)] shadow-lg shadow-cyan-500/40 transition hover:bg-cyan-300"
            >
              Dive into TUTORIAL
            </button>
          </motion.div>
          <button
            type="button"
            onClick={handleSkipTutorial}
            className="fixed bottom-8 right-8 z-[60] rounded-xl border-2 border-cyan-500/60 bg-[var(--modal-bg)]/90 px-5 py-2.5 text-base font-bold text-cyan-100 backdrop-blur-sm transition hover:bg-cyan-500/20 hover:text-cyan-50"
          >
            Skip Tutorial
          </button>
        </motion.div>
      )}
    </div>
  );
}
