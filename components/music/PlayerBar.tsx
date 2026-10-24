import React from "react";
import Link from "next/link";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
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

/** Shared player bar, mounted once by MusicPlayerProvider across the public app. */
export default function PlayerBar() {
  const {
    release,
    track,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    error,
    tone,
    toggle,
    next,
    prev,
    seek,
    setVolume,
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
  const iconButton = dark
    ? "text-neutral-500 hover:text-white focus-visible:outline-white"
    : "text-neutral-500 hover:text-neutral-900 focus-visible:outline-neutral-900";
  const rangeClass = dark ? "accent-white" : "accent-neutral-900";
  const rangeBase =
    "h-1 min-w-0 flex-1 cursor-pointer rounded-full disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 " +
    (dark ? "focus-visible:outline-white" : "focus-visible:outline-neutral-900");
  const controlBase =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

  const progress = (
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      <span className={`w-9 shrink-0 text-right text-xs tabular-nums ${secondary}`}>
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
        className={`${rangeBase} ${rangeClass}`}
      />
      <span className={`w-9 shrink-0 text-xs tabular-nums ${secondary}`}>
        {formatTime(duration)}
      </span>
    </div>
  );

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t shadow-[0_-5px_24px_rgba(0,0,0,0.08)] ${shell}`}
      role="region"
      aria-label="Music player"
    >
      <div className="mx-auto grid max-w-[1600px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-3 py-2.5 sm:px-5 md:grid-cols-[minmax(220px,1fr)_minmax(280px,1.5fr)_minmax(180px,1fr)] md:gap-x-8 md:px-8 md:py-3">
        <div className="row-span-1 flex min-w-0 items-center gap-3 md:row-span-2">
          <Link
            href={`/music/${release.slug}`}
            className="relative h-11 w-11 shrink-0 overflow-hidden rounded-sm bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current sm:h-14 sm:w-14"
            aria-label={`Open ${release.title}`}
          >
            {release.coverImage ? (
              <OptimizedImage
                src={release.coverImage}
                alt=""
                fill
                preset="thumb"
                sizes="56px"
                className="object-cover"
              />
            ) : null}
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/music/${release.slug}`}
              className="block truncate text-sm font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              {track?.title ?? release.title}
            </Link>
            <p className={`truncate text-xs ${secondary}`}>{release.artistName}</p>
            {error && (
              <p role="alert" className={`truncate text-xs ${dark ? "text-red-400" : "text-red-600"}`}>
                {error}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close player"
            className={`${controlBase} h-8 w-8 shrink-0 md:hidden ${iconButton}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="col-start-2 row-start-1 flex items-center justify-end gap-1 sm:gap-2 md:col-start-2 md:justify-center">
          <button
            type="button"
            onClick={prev}
            disabled={!multiTrack}
            aria-label="Previous track"
            className={`${controlBase} ${iconButton} disabled:opacity-30`}
          >
            <SkipBack className="h-[18px] w-[18px] fill-current" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={toggle}
            disabled={isLoading}
            aria-label={isPlaying ? "Pause" : "Play"}
            className={`${controlBase} h-10 w-10 ${dark ? "bg-white text-neutral-950 hover:bg-neutral-200" : "bg-neutral-900 text-white hover:bg-neutral-700"} disabled:opacity-50`}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={!multiTrack}
            aria-label="Next track"
            className={`${controlBase} ${iconButton} disabled:opacity-30`}
          >
            <SkipForward className="h-[18px] w-[18px] fill-current" aria-hidden="true" />
          </button>
        </div>

        <div className="col-span-2 row-start-2 md:col-span-1 md:col-start-2 md:row-start-2">
          {progress}
        </div>

        <div className="hidden items-center justify-end gap-4 md:col-start-3 md:row-span-2 md:row-start-1 md:flex">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVolume(volume === 0 ? 1 : 0)}
              aria-label={volume === 0 ? "Unmute" : "Mute"}
              className={`${controlBase} h-8 w-8 ${iconButton}`}
            >
              {volume === 0 ? (
                <VolumeX className="h-[18px] w-[18px]" aria-hidden="true" />
              ) : (
                <Volume2 className="h-[18px] w-[18px]" aria-hidden="true" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
              className={`h-1 w-20 cursor-pointer rounded-full ${rangeClass}`}
            />
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close player"
            className={`${controlBase} h-8 w-8 ${iconButton}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
