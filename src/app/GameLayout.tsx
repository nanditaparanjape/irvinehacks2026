"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";
import { CharacterImg } from "@/components/CharacterImg";

const GAME_BUBBLE_COUNT = 16;

function GameBubbles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: GAME_BUBBLE_COUNT }).map((_, i) => {
        const left = i % 2 === 0 ? (i * 6) % 15 : 85 + ((i * 5) % 12);
        const bottom = (i * 17 + 23) % 95;
        const size = 8 + (i % 4) * 2;
        const duration = 4 + (i % 5) * 0.8;
        const delay = i * 0.15;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/40"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              bottom: `${bottom}%`,
              boxShadow: "0 0 8px rgba(255,255,255,0.3)",
            }}
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay,
            }}
          />
        );
      })}
    </div>
  );
}

export function GameLayout({ children }: { children: React.ReactNode }) {
  const gameStarted = useGameStore((s) => s.gameStarted);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const player1Name = useGameStore((s) => s.player1Name);
  const player2Name = useGameStore((s) => s.player2Name);

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-transparent">
        <main className="min-h-screen">{children}</main>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="min-h-screen bg-transparent">
        <main className="min-h-screen">{children}</main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#1A84B8]">
      <GameBubbles />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-stretch gap-2 px-2 py-4 md:px-4">
        <motion.aside
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="hidden w-40 flex-col items-center justify-center gap-2 p-2 md:flex lg:w-52"
        >
          <div className="h-40 w-40 shrink-0 md:h-44 md:w-44 lg:h-48 lg:w-48">
            <CharacterImg player={1} className="h-full w-full" alt="" />
          </div>
          <span className="text-center text-base font-semibold text-cyan-200">
            {player1Name || "P1"}
          </span>
        </motion.aside>

        <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-6">
          {children}
        </main>

        <motion.aside
          animate={{ y: [0, 6, 0] }}
          transition={{
            repeat: Infinity,
            duration: 2.5,
            ease: "easeInOut",
            delay: 0.25,
          }}
          className="hidden w-40 flex-col items-center justify-center gap-2 p-2 md:flex lg:w-52"
        >
          <div className="h-40 w-40 shrink-0 md:h-44 md:w-44 lg:h-48 lg:w-48">
            <CharacterImg player={2} className="h-full w-full" alt="" />
          </div>
          <span className="text-center text-base font-semibold text-cyan-200">
            {player2Name || "P2"}
          </span>
        </motion.aside>
      </div>
    </div>
  );
}
