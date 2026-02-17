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
  const [hasInteracted, setHasInteracted] = useState(false);

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
    setHasInteracted(true);
    if (isPlaying) {
      pauseWithFadeOut();
    } else {
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
    if (mode === "podcast") {
      pauseNow();
      return;
    }
    if (!hasInteracted) return;
    if (mode === "reading" && !isPlaying) {
      void playWithFadeIn();
      return;
    }
    if (mode === "speaking" && isPlaying) {
      pauseWithFadeOut();
    }
  }, [mode, hasInteracted, isPlaying, baseVolume]);

  useEffect(() => {
    return () => {
      clearFadeTimer();
    };
  }, []);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-card px-2.5 py-1.5">
      <audio ref={audioRef} preload="none" />
      <button
        onClick={handleToggle}
        className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-primary/15 text-accent-secondary transition-colors hover:bg-accent-primary/25"
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

      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="max-w-[120px] rounded-md border border-border-primary bg-bg-elevated px-2 py-1 text-[11px] text-text-secondary outline-none transition-colors focus:border-accent-primary/40"
        title="Choose soundscape"
      >
        {TRACKS.map((track) => (
          <option key={track.id} value={track.id}>
            {track.label}
          </option>
        ))}
      </select>

      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(baseVolume * 100)}
        onChange={(e) => setBaseVolume(Number(e.target.value) / 100)}
        className="h-1 w-16 accent-[var(--accent-primary)]"
        title="Volume"
      />
    </div>
  );
}
