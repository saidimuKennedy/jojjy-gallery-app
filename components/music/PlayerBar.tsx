import React from "react";
import Link from "next/link";
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { useMusicPlayer } from "@/components/music/MusicPlayerContext";

function formatTime(totalSeconds: number | null): string {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "0:00";
  }
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Restrained persistent Music player. Lives in the shared MusicPlayerProvider
 * so playback survives navigation between Music surfaces.
 *
 * Deliberately no shuffle/repeat/like/queue — those behaviors do not exist in
 * the JENGA domain model. Only truthful controls: play/pause, previous/next
 * within the current release's real track order, and seek.
 */
export default function PlayerBar() {
  const {
    release,
    track,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    error,
    tone,
    toggle,
    next,
    prev,
    seek,
    close,
  } = useMusicPlayer();

  if (!release) return null;

  const dark = tone === "dark";
  const multiTrack = release.tracks.length > 1;
  const max = duration != null && duration > 0 ? Math.ceil(duration) : 0;

  const shell = dark
    ? "border-neutral-800 bg-neutral-950 text-white"
    : "border-neutral-200 bg-white text-neutral-900";
  const secondary = dark ? "text-neutral-400" : "text-neutral-500";
  const controlBase =
    "flex min-h-11 min-w-11 items-center justify-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
    (dark
      ? "focus-visible:outline-white"
      : "focus-visible:outline-neutral-900");
  const iconBtn = dark
    ? "text-neutral-300 hover:text-white"
    : "text-neutral-600 hover:text-neutral-900";
  const rangeClass = dark ? "accent-white" : "accent-neutral-900";
  const rangeBase =
    "cursor-pointer disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
    (dark ? "focus-visible:outline-white" : "focus-visible:outline-neutral-900");

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t ${shell}`}
      role="region"
      aria-label="Music player"
    >
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-3 sm:gap-4 sm:px-6">
        <Link
          href={`/music/${release.slug}`}
          className="relative h-12 w-12 shrink-0 overflow-hidden bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          aria-label={`Open ${release.title}`}
        >
          {release.coverImage ? (
            <OptimizedImage
              src={release.coverImage}
              alt=""
              fill
              preset="thumb"
              sizes="48px"
              className="object-cover"
            />
          ) : null}
        </Link>

        <div className="min-w-0 flex-1 sm:flex-none sm:w-56">
          <p className="truncate text-sm font-medium">
            {track?.title ?? release.title}
          </p>
          <p className={`truncate text-xs ${secondary}`}>
            {release.artistName}
          </p>
          {error && (
            <p
              role="alert"
              className={`truncate text-xs ${dark ? "text-red-400" : "text-red-600"}`}
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={prev}
            disabled={!multiTrack}
            aria-label="Previous track"
            className={`${controlBase} ${iconBtn} disabled:opacity-30`}
          >
            <SkipBack className="h-4 w-4 fill-current" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={toggle}
            disabled={isLoading}
            aria-label={isPlaying ? "Pause" : "Play"}
            className={`${controlBase} ${
              dark
                ? "bg-white text-neutral-950 hover:bg-neutral-200"
                : "bg-neutral-900 text-white hover:bg-neutral-700"
            } disabled:opacity-50`}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" aria-hidden="true" />
            ) : (
              <Play className="h-5 w-5 fill-current" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={!multiTrack}
            aria-label="Next track"
            className={`${controlBase} ${iconBtn} disabled:opacity-30`}
          >
            <SkipForward className="h-4 w-4 fill-current" aria-hidden="true" />
          </button>
        </div>

        <div className="hidden flex-1 items-center gap-3 md:flex">
          <span className={`w-10 shrink-0 text-right text-xs tabular-nums ${secondary}`}>
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={max}
            step={1}
            value={Math.min(currentTime, max)}
            onChange={(e) => seek(Number(e.target.value))}
            disabled={max === 0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={Math.round(Math.min(currentTime, max))}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            className={`flex-1 ${rangeBase} ${rangeClass}`}
          />
          <span className={`w-10 shrink-0 text-xs tabular-nums ${secondary}`}>
            {formatTime(duration)}
          </span>
        </div>

        <button
          type="button"
          onClick={close}
          aria-label="Close player"
          className={`${controlBase} ${iconBtn}`}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile progress line */}
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={Math.min(currentTime, max)}
        onChange={(e) => seek(Number(e.target.value))}
        disabled={max === 0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(Math.min(currentTime, max))}
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        className={`w-full md:hidden ${rangeBase} ${rangeClass}`}
      />
    </div>
  );
}
