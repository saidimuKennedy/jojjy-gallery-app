import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PlayerBar from "@/components/music/PlayerBar";
import {
  MusicPlayerContext,
  type MusicPlayerContextValue,
  type PlayOutcome,
  type PlayerRelease,
  type PlayerTone,
} from "@/components/music/MusicPlayerContext";

export {
  useMusicPlayer,
} from "@/components/music/MusicPlayerContext";
export type {
  PlayOutcome,
  PlayerRelease,
  PlayerTrack,
} from "@/components/music/MusicPlayerContext";

/**
 * Owns the single shared `<audio>` element and playback state for the whole
 * public app, so Music playback survives navigation between Music surfaces.
 *
 * Streaming is unchanged: audio is minted by POST /api/music/play.
 */
export function MusicPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [release, setRelease] = useState<PlayerRelease | null>(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamTrackId, setStreamTrackId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tone, setTone] = useState<PlayerTone>("light");

  // Refs mirror state so callbacks stay stable and always read fresh values.
  const releaseRef = useRef<PlayerRelease | null>(null);
  const streamTrackIdRef = useRef<number | null>(null);
  const trackIndexRef = useRef(0);
  releaseRef.current = release;
  streamTrackIdRef.current = streamTrackId;
  trackIndexRef.current = trackIndex;

  const track = release?.tracks[trackIndex] ?? null;

  const loadAndPlay = useCallback(
    async (nextRelease: PlayerRelease, index: number): Promise<PlayOutcome> => {
      const target = nextRelease.tracks[index];
      if (!target) return { ok: false, reason: "no_tracks" };

      // Already loaded this exact track: resume instead of re-consuming a play.
      if (
        streamTrackIdRef.current === target.id &&
        releaseRef.current?.id === nextRelease.id
      ) {
        setRelease(nextRelease);
        setTrackIndex(index);
        try {
          await audioRef.current?.play();
          setIsPlaying(true);
        } catch {
          /* autoplay may be blocked; user can press play */
        }
        return { ok: true };
      }

      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/music/play", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            releaseId: nextRelease.id,
            trackId: target.id,
          }),
        });
        const raw = await res.text();
        let json: {
          success?: boolean;
          message?: string;
          reason?: string;
          data?: {
            streamUrl?: string;
            accessReason?: string;
            remainingTease?: number | null;
          };
        };
        try {
          json = JSON.parse(raw);
        } catch {
          throw new Error(`Playback failed (${res.status}): non-JSON response`);
        }
        if (!res.ok || !json.data?.streamUrl) {
          const message = json.message || "Playback denied";
          setError(message);
          return { ok: false, reason: json.reason, message };
        }
        setRelease(nextRelease);
        setTrackIndex(index);
        setStreamUrl(json.data.streamUrl);
        setStreamTrackId(target.id);
        setCurrentTime(0);
        setDuration(null);
        setIsPlaying(true);
        return {
          ok: true,
          reason: json.data.accessReason,
          remainingTease: json.data.remainingTease ?? null,
        };
      } catch (e) {
        const message = (e as Error).message || "Playback failed";
        setError(message);
        return { ok: false, message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const play = useCallback(
    async (input: { release: PlayerRelease; trackId?: number }) => {
      const { release: nextRelease, trackId } = input;
      if (!nextRelease || nextRelease.tracks.length === 0) {
        return { ok: false, reason: "no_tracks" } as PlayOutcome;
      }
      const index =
        trackId != null
          ? Math.max(
              0,
              nextRelease.tracks.findIndex((t) => t.id === trackId)
            )
          : 0;
      return loadAndPlay(nextRelease, index);
    },
    [loadAndPlay]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  }, [isPlaying, streamUrl]);

  const next = useCallback(() => {
    const current = releaseRef.current;
    if (!current || current.tracks.length === 0) return;
    const nextIndex = (trackIndexRef.current + 1) % current.tracks.length;
    void loadAndPlay(current, nextIndex);
  }, [loadAndPlay]);

  const prev = useCallback(() => {
    const current = releaseRef.current;
    if (!current || current.tracks.length === 0) return;
    const prevIndex =
      (trackIndexRef.current - 1 + current.tracks.length) %
      current.tracks.length;
    void loadAndPlay(current, prevIndex);
  }, [loadAndPlay]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(seconds)) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  const close = useCallback(() => {
    audioRef.current?.pause();
    setRelease(null);
    setStreamUrl(null);
    setStreamTrackId(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(null);
    setError(null);
  }, []);

  // When a new stream URL loads, start playback from the beginning.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl) return;
    audio.currentTime = 0;
    void audio.play().catch(() => setIsPlaying(false));
  }, [streamUrl]);

  const value = useMemo<MusicPlayerContextValue>(
    () => ({
      release,
      track,
      isPlaying,
      isLoading,
      currentTime,
      duration,
      error,
      tone,
      setTone,
      play,
      toggle,
      next,
      prev,
      seek,
      close,
    }),
    [
      release,
      track,
      isPlaying,
      isLoading,
      currentTime,
      duration,
      error,
      tone,
      play,
      toggle,
      next,
      prev,
      seek,
      close,
    ]
  );

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      {release && <PlayerBar />}
      <audio
        ref={audioRef}
        src={streamUrl ?? undefined}
        className="sr-only"
        preload="none"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          setDuration(Number.isFinite(d) ? d : null);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
    </MusicPlayerContext.Provider>
  );
}
