"use client";

type KeyCapVariant = "positive" | "negative" | "neutral";

const variantStyles: Record<
  KeyCapVariant,
  { bg: string; text: string }
> = {
  positive: {
    bg: "bg-emerald-200",
    text: "text-emerald-900",
  },
  negative: {
    bg: "bg-red-200",
    text: "text-red-900",
  },
  neutral: {
    bg: "bg-slate-200",
    text: "text-slate-800",
  },
};

function getVariantForKey(key: string): KeyCapVariant {
  const k = key.toUpperCase();
  if (k === "Y") return "positive";
  if (k === "N") return "negative";
  return "neutral";
}

export interface KeyCapProps {
  /** Key label: "Y", "N", "Space", or any letter */
  children: string;
  /** Override variant; default: Y=green, N=red, else neutral */
  variant?: KeyCapVariant;
  /** Optional extra class for the wrapper */
  className?: string;
}

export function KeyCap({ children, variant, className = "" }: KeyCapProps) {
  const v = variant ?? getVariantForKey(children);
  const { bg, text } = variantStyles[v];
  const raw = children.trim();
  const isSpace = raw.toUpperCase() === "SPACE";
  const label = isSpace ? "Space" : children;

  return (
    <kbd
      className={`inline-flex items-center justify-center rounded px-1 py-0.5 align-middle text-[0.85em] font-semibold shadow-sm ${bg} ${text} ${className} ${isSpace ? "min-w-[2.25em] h-[1.35em]" : "aspect-square min-w-[1.35em] max-w-[1.35em]"}`}
      style={{ lineHeight: 1 }}
    >
      {label}
    </kbd>
  );
}
