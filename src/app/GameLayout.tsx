"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";

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
    <div className="min-h-screen bg-[#1A84B8]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-stretch gap-2 px-2 py-4 md:px-4">
        <motion.aside
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="hidden w-24 flex-col items-center justify-center p-2 text-center md:flex"
        >
          <span className="text-[10px] font-bold uppercase text-cyan-400/90">
            Voyager
          </span>
          <span className="mt-1 text-sm font-semibold text-cyan-200">
            {player1Name || "P1"}
          </span>
        </motion.aside>

        <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-5">
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
          className="hidden w-24 flex-col items-center justify-center p-2 text-center md:flex"
        >
          <span className="text-[10px] font-bold uppercase text-cyan-400/90">
            Voyager
          </span>
          <span className="mt-1 text-sm font-semibold text-cyan-200">
            {player2Name || "P2"}
          </span>
        </motion.aside>
      </div>
    </div>
  );
}
