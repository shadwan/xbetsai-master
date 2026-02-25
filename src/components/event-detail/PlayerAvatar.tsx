"use client";

import { useState } from "react";
import Image from "next/image";
import { usePlayerHeadshot } from "@/src/lib/hooks/use-player-headshot";

interface PlayerAvatarProps {
  playerName: string;
  league: string;
  size?: number;
  headshotUrl?: string | null;
}

// Derive a deterministic hue from the player name for the initials fallback
function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PlayerAvatar({ playerName, league, size = 48, headshotUrl: directUrl }: PlayerAvatarProps) {
  // When a direct URL is provided, skip the per-player ESPN search API call
  const skipHook = !!directUrl;
  const hookResult = usePlayerHeadshot(skipHook ? "" : playerName, skipHook ? "" : league);
  const headshotUrl = directUrl ?? hookResult.headshotUrl;
  const isLoading = skipHook ? false : hookResult.isLoading;
  const [imgError, setImgError] = useState(false);

  const hue = nameToHue(playerName);
  const initials = getInitials(playerName);
  const showImage = headshotUrl && !imgError;

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      {/* Colored initials background — always rendered behind */}
      <div
        className="absolute inset-0 flex items-center justify-center text-white/90 font-bold"
        style={{
          backgroundColor: `hsl(${hue}, 35%, 28%)`,
          fontSize: size * 0.36,
        }}
      >
        {initials}
      </div>

      {/* Headshot image — overlays when available */}
      {showImage && (
        <Image
          src={headshotUrl}
          alt={playerName}
          width={size}
          height={size}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImgError(true)}
          unoptimized
        />
      )}

      {/* Loading shimmer */}
      {isLoading && !showImage && (
        <div className="absolute inset-0 animate-pulse bg-white/[0.06]" />
      )}
    </div>
  );
}
