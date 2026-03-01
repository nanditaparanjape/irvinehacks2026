"use client";

export interface DummyTestProps {
  onComplete?: (elapsedMs: number) => void;
}

export const DummyTest = ({ onComplete }: DummyTestProps) => {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-sm text-slate-200">
        This is a placeholder test component. Imagine a Stroop, Corsi, or Go/No-Go task here.
      </p>
      <button
        type="button"
        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-400"
        onClick={() => onComplete?.(0)}
      >
        Complete Round
      </button>
    </div>
  );
};

