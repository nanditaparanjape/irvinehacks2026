"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";

export function ReadyToDiveScreen() {
  const startMainGame = useGameStore((s) => s.startMainGame);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-8 rounded-2xl border border-cyan-500/30 bg-black/40 p-8 backdrop-blur-sm"
    >
      <h2 className="text-center text-2xl font-black uppercase tracking-wide text-cyan-300 md:text-3xl">
        Ready to dive?
      </h2>
      <p className="text-center text-sm text-white/80">
        Tutorial complete. The next round is the real race — scores will count.
      </p>
      <motion.button
        type="button"
        onClick={() => startMainGame()}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        className="rounded-xl border-2 border-cyan-500 bg-cyan-500/30 px-8 py-4 text-lg font-bold text-cyan-200 transition hover:bg-cyan-500/50"
      >
        Dive — start race
      </motion.button>
    </motion.div>
  );
}
