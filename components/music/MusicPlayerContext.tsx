import { createContext, useContext } from "react";

export type PlayerTrack = {
  id: number;
  title: string;
  trackNumber: number;
  duration: number | null;
};

export type PlayerRelease = {
  id: number;
  slug: string;
  title: string;
  artistName: string;
  coverImage: string | null;
  tracks: PlayerTrack[];
};

export type PlayOutcome = {
  ok: boolean;
  reason?: string;
  message?: string;
  remainingTease?: number | null;
};

export type PlayerTone = "light" | "dark";

export type MusicPlayerContextValue = {
  release: PlayerRelease | null;
  track: PlayerTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number | null;
  error: string | null;
  tone: PlayerTone;
  setTone: (tone: PlayerTone) => void;
  play: (input: {
    release: PlayerRelease;
    trackId?: number;
  }) => Promise<PlayOutcome>;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  close: () => void;
};

export const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(
  null
);

export function useMusicPlayer(): MusicPlayerContextValue {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) {
    throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  }
  return ctx;
}
