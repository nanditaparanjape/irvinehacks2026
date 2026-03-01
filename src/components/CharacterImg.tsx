"use client";

type Player = 1 | 2;

const SRC: Record<Player, string> = {
  1: "/axolotl.svg",
  2: "/starfish.svg",
};

export function CharacterImg({
  player,
  className = "",
  alt = "",
}: {
  player: Player;
  className?: string;
  alt?: string;
}) {
  return (
    <div className={className}>
      <img
        src={SRC[player]}
        alt={alt || `Player ${player} character`}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
