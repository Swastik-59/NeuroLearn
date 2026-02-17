"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SoundMode = "reading" | "speaking" | "podcast" | "neutral";

interface SoundscapePlayerProps {
  mode: SoundMode;
}

interface Track {
  id: string;
  label: string;
  src: string;
}

const TRACKS: Track[] = [
  { id: "rain", label: "Rain", src: "/soundscapes/rain.ogg" },
  { id: "nature", label: "Forest Nature", src: "/soundscapes/forest.ogg" },
  { id: "ocean", label: "Ocean Waves", src: "/soundscapes/ocean.ogg" },
  { id: "brown", label: "Brown Noise", src: "/soundscapes/brown-noise.ogg" },
  { id: "lofi", label: "Lo-fi Piano", src: "/soundscapes/lofi-piano.ogg" },
];

export default function SoundscapePlayer({ mode }: SoundscapePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeTimerRef = useRef<number | null>(null);

  const [selectedId, setSelectedId] = useState(TRACKS[0].id);
  const [baseVolume, setBaseVolume] = useState(0.35);
  const [isPlaying, setIsPlaying] = useState(false);
  // Whether the user *wants* the soundscape on (persists across mode changes)
  const [wantsPlaying, setWantsPlaying] = useState(false);
  const prevModeRef = useRef<SoundMode>(mode);

  const selectedTrack = useMemo(
    () => TRACKS.find((t) => t.id === selectedId) ?? TRACKS[0],
    [selectedId]
  );

  const clearFadeTimer = () => {
    if (fadeTimerRef.current !== null) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  };

  const fadeTo = (target: number, durationMs = 800, onDone?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;
    clearFadeTimer();

    const stepMs = 40;
    const steps = Math.max(1, Math.floor(durationMs / stepMs));
    const start = audio.volume;
    const delta = (target - start) / steps;
    let n = 0;

    fadeTimerRef.current = window.setInterval(() => {
      const a = audioRef.current;
      if (!a) {
        clearFadeTimer();
        return;
      }
      n += 1;
      const next = n >= steps ? target : Math.max(0, Math.min(1, a.volume + delta));
      a.volume = next;
      if (n >= steps) {
        clearFadeTimer();
        onDone?.();
      }
    }, stepMs);
  };

  const playWithFadeIn = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.volume = Math.min(baseVolume, 0.02);
      await audio.play();
      setIsPlaying(true);
      fadeTo(baseVolume, 900);
    } catch {
      setIsPlaying(false);
    }
  };

  const pauseWithFadeOut = () => {
    const audio = audioRef.current;
    if (!audio) return;
    fadeTo(0, 700, () => {
      audio.pause();
      setIsPlaying(false);
      audio.volume = baseVolume;
    });
  };

  const pauseNow = () => {
    const audio = audioRef.current;
    if (!audio) return;
    clearFadeTimer();
    audio.pause();
    audio.volume = baseVolume;
    setIsPlaying(false);
  };

  const handleToggle = async () => {
    if (isPlaying) {
      setWantsPlaying(false);
      pauseWithFadeOut();
    } else {
      setWantsPlaying(true);
      await playWithFadeIn();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.volume = baseVolume;
  }, [baseVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const wasPlaying = !audio.paused;
    audio.src = selectedTrack.src;
    audio.load();
    if (wasPlaying) {
      void playWithFadeIn();
    } else {
      setIsPlaying(false);
    }
  }, [selectedTrack.src]);

  useEffect(() => {
    const prevMode = prevModeRef.current;
    prevModeRef.current = mode;

    if (mode === "podcast") {
      // Pause when entering podcast (but keep wantsPlaying so it resumes after)
      if (isPlaying) pauseNow();
      return;
    }

    // Resume playback when leaving podcast (or any mode) if user wants it
    if (wantsPlaying && !isPlaying) {
      void playWithFadeIn();
    }
  }, [mode]);

  useEffect(() => {
    return () => {
      clearFadeTimer();
    };
  }, []);

  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 backdrop-blur-sm transition-all duration-500 ${isPlaying
          ? "border-accent-primary/30 bg-accent-primary/[0.06] shadow-glow-sm"
          : "border-border-primary bg-bg-card"
        }`}
    >
      <audio ref={audioRef} preload="none" />

      {/* Play/Pause button with glow ring */}
      <button
        onClick={handleToggle}
        className={`relative flex h-7 w-7 items-center justify-center rounded-md transition-all duration-300 ${isPlaying
            ? "bg-accent-primary/20 text-accent-secondary animate-glow-ring"
            : "bg-accent-primary/10 text-accent-secondary hover:bg-accent-primary/20"
          }`}
        title={isPlaying ? "Pause soundscape" : "Play soundscape"}
      >
        {isPlaying ? (
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="ml-0.5 h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Track selector */}
      <div className="relative">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="max-w-[110px] appearance-none rounded-md border border-border-primary bg-bg-elevated pl-2 pr-6 py-1 text-[11px] text-text-secondary outline-none transition-all focus:border-accent-primary/40 hover:border-border-hover"
          title="Choose soundscape"
        >
          {TRACKS.map((track) => (
            <option key={track.id} value={track.id}>
              {track.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-text-dim"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {/* Volume slider — styled via CSS */}
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(baseVolume * 100)}
        onChange={(e) => setBaseVolume(Number(e.target.value) / 100)}
        className="sound-slider w-16"
        title="Volume"
      />
    </div>
  );
}
