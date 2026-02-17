"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

type Tab = "trainer" | "breathing" | "eyes";

interface WellnessCoachProps {
  open: boolean;
  onClose: () => void;
}

const TRAINER_STEPS = [
  {
    title: "Tilt Left",
    cue: "Gently bring left ear toward left shoulder. Keep both shoulders relaxed.",
    seconds: 6,
  },
  {
    title: "Tilt Right",
    cue: "Gently bring right ear toward right shoulder. No force.",
    seconds: 6,
  },
  {
    title: "Chin Down",
    cue: "Drop chin toward chest and lengthen the back of your neck.",
    seconds: 6,
  },
  {
    title: "Shoulder Rolls",
    cue: "Roll shoulders slowly backward in smooth circles.",
    seconds: 7,
  },
];

const BREATH_PHASES = [
  { label: "Inhale", seconds: 4, scale: 1.2 },
  { label: "Hold", seconds: 4, scale: 1.2 },
  { label: "Exhale", seconds: 6, scale: 0.9 },
];

export default function WellnessCoach({ open, onClose }: WellnessCoachProps) {
  const [tab, setTab] = useState<Tab>("trainer");

  const [trainerRunning, setTrainerRunning] = useState(false);
  const [trainerStep, setTrainerStep] = useState(0);
  const [trainerRemaining, setTrainerRemaining] = useState(TRAINER_STEPS[0].seconds);
  const [trainerDone, setTrainerDone] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [detectCue, setDetectCue] = useState("Enable camera and press Start");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const detectingRef = useRef(false);
  const shoulderHistoryRef = useRef<number[]>([]);
  const lastTickRef = useRef<number | null>(null);

  const [breathRunning, setBreathRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState(0);
  const [breathRemaining, setBreathRemaining] = useState(BREATH_PHASES[0].seconds);

  const [eyeRunning, setEyeRunning] = useState(false);
  const [eyeProgress, setEyeProgress] = useState(0);
  const [eyeElapsed, setEyeElapsed] = useState(0);
  const eyeRafRef = useRef<number | null>(null);
  const eyeStartRef = useRef<number | null>(null);

  const resetTrainer = () => {
    setTrainerRunning(false);
    setTrainerDone(false);
    setTrainerStep(0);
    setTrainerRemaining(TRAINER_STEPS[0].seconds);
    setDetectCue("Enable camera and press Start");
    lastTickRef.current = null;
  };

  const stopCamera = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  };

  const detectCurrentStep = (landmarks: { x: number; y: number; visibility?: number }[]) => {
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];

    if (!leftEar || !rightEar || !nose || !leftShoulder || !rightShoulder) {
      return { ok: false, cue: "Keep your head and shoulders visible" };
    }

    const earDelta = leftEar.y - rightEar.y;
    const earMidY = (leftEar.y + rightEar.y) / 2;
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    const chinDrop = nose.y - earMidY;
    const shoulderMid = shoulderMidY;

    shoulderHistoryRef.current.push(shoulderMid);
    if (shoulderHistoryRef.current.length > 20) shoulderHistoryRef.current.shift();
    const minS = Math.min(...shoulderHistoryRef.current);
    const maxS = Math.max(...shoulderHistoryRef.current);
    const shoulderRange = maxS - minS;

    if (trainerStep === 0) {
      return earDelta > 0.045
        ? { ok: true, cue: "Great left tilt" }
        : { ok: false, cue: "Tilt left a little more" };
    }
    if (trainerStep === 1) {
      return earDelta < -0.045
        ? { ok: true, cue: "Great right tilt" }
        : { ok: false, cue: "Tilt right a little more" };
    }
    if (trainerStep === 2) {
      return chinDrop > 0.06 && nose.y < shoulderMidY - 0.01
        ? { ok: true, cue: "Great chin-down hold" }
        : { ok: false, cue: "Lower chin gently toward chest" };
    }
    return shoulderRange > 0.02
      ? { ok: true, cue: "Nice shoulder roll motion" }
      : { ok: false, cue: "Roll shoulders in slow circles" };
  };

  useEffect(() => {
    if (!open || tab !== "trainer") {
      stopCamera();
      return;
    }

    let cancelled = false;
    const init = async () => {
      try {
        setCameraError("");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (cancelled) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }
        streamRef.current = stream;
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        poseRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });

        setCameraReady(true);
        const loop = () => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const pose = poseRef.current;
          if (!video || !canvas || !pose) return;
          if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            const result = pose.detectForVideo(video, performance.now());
            const lm = result.landmarks?.[0];
            const ctx = canvas.getContext("2d");
            if (ctx) {
              canvas.width = video.videoWidth || 640;
              canvas.height = video.videoHeight || 480;
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              if (lm) {
                const leftShoulder = lm[11];
                const rightShoulder = lm[12];
                const nose = lm[0];
                if (leftShoulder && rightShoulder) {
                  ctx.strokeStyle = "#38bdf8";
                  ctx.lineWidth = 3;
                  ctx.beginPath();
                  ctx.moveTo(leftShoulder.x * canvas.width, leftShoulder.y * canvas.height);
                  ctx.lineTo(rightShoulder.x * canvas.width, rightShoulder.y * canvas.height);
                  ctx.stroke();
                }
                if (nose) {
                  ctx.fillStyle = "#ef4444";
                  ctx.beginPath();
                  ctx.arc(nose.x * canvas.width, nose.y * canvas.height, 5, 0, Math.PI * 2);
                  ctx.fill();
                }
                if (detectingRef.current) {
                  const now = performance.now();
                  const last = lastTickRef.current ?? now;
                  const dt = (now - last) / 1000;
                  lastTickRef.current = now;
                  const status = detectCurrentStep(lm);
                  setDetectCue(status.cue);
                  if (status.ok) {
                    setTrainerRemaining((v) => Math.max(0, v - dt));
                  }
                } else {
                  lastTickRef.current = null;
                }
              }
            }
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        loop();
      } catch (err: any) {
        setCameraError(err?.message || "Camera unavailable");
      }
    };
    void init();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, tab, trainerStep]);

  useEffect(() => {
    detectingRef.current = trainerRunning;
    if (!trainerRunning) lastTickRef.current = null;
  }, [trainerRunning]);

  useEffect(() => {
    if (!trainerRunning) return;
    if (trainerRemaining > 0) return;
    setTrainerStep((idx) => {
      if (idx >= TRAINER_STEPS.length - 1) {
        setTrainerRunning(false);
        setTrainerDone(true);
        return idx;
      }
      return idx + 1;
    });
    setTrainerRemaining(TRAINER_STEPS[Math.min(trainerStep + 1, TRAINER_STEPS.length - 1)].seconds);
    shoulderHistoryRef.current = [];
  }, [trainerRemaining, trainerRunning, trainerStep]);

  useEffect(() => {
    if (!breathRunning) return;
    const timer = window.setInterval(() => {
      setBreathRemaining((v) => {
        if (v > 1) return v - 1;
        setBreathPhase((p) => (p + 1) % BREATH_PHASES.length);
        return BREATH_PHASES[(breathPhase + 1) % BREATH_PHASES.length].seconds;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [breathRunning, breathPhase]);

  useEffect(() => {
    if (!eyeRunning) {
      if (eyeRafRef.current !== null) cancelAnimationFrame(eyeRafRef.current);
      eyeRafRef.current = null;
      eyeStartRef.current = null;
      return;
    }
    const total = 30_000;
    const tick = (ts: number) => {
      if (eyeStartRef.current === null) eyeStartRef.current = ts;
      const elapsed = ts - eyeStartRef.current;
      const looped = elapsed % total;
      setEyeElapsed(Math.floor(looped / 1000));
      setEyeProgress(looped / total);
      eyeRafRef.current = requestAnimationFrame(tick);
    };
    eyeRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (eyeRafRef.current !== null) cancelAnimationFrame(eyeRafRef.current);
    };
  }, [eyeRunning]);

  useEffect(() => {
    if (!open) {
      setBreathRunning(false);
      setEyeRunning(false);
      resetTrainer();
      stopCamera();
    }
  }, [open]);

  const eyeDotPosition = useMemo(() => {
    const t = eyeProgress;
    if (t < 0.25) return { x: t * 4, y: 0 };
    if (t < 0.5) return { x: 1, y: (t - 0.25) * 4 };
    if (t < 0.75) return { x: 1 - (t - 0.5) * 4, y: 1 };
    return { x: 0, y: 1 - (t - 0.75) * 4 };
  }, [eyeProgress]);

  const trainerPercent = Math.round(((trainerStep + 1) / TRAINER_STEPS.length) * 100);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-border-primary bg-bg-primary shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-primary/70 px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Wellness Coach</h3>
          <button
            onClick={onClose}
            className="rounded-md border border-border-primary px-2 py-1 text-xs text-text-secondary hover:border-border-hover"
          >
            Close
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border-primary/70 px-4 py-3">
          {[
            { id: "trainer", label: "Tension Trainer" },
            { id: "breathing", label: "Breathing" },
            { id: "eyes", label: "Eye Exercise" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                tab === t.id
                  ? "border-accent-primary/50 bg-accent-primary/10 text-accent-secondary"
                  : "border-border-primary text-text-dim hover:text-text-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "trainer" && (
            <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
              <div className="relative overflow-hidden rounded-xl border border-border-primary bg-black">
                <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
                <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
              </div>
              <div className="rounded-xl border border-border-primary bg-bg-card p-5">
                <p className="text-xs uppercase tracking-wide text-text-dim">Camera-tracked trainer</p>
                <div className="mt-3 h-2 w-full rounded-full bg-border-primary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-cyan"
                    style={{ width: `${trainerPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-[11px] text-text-dim">
                  Step {trainerStep + 1} of {TRAINER_STEPS.length}
                </p>
                <p className="mt-1 text-xl font-semibold text-text-primary">{TRAINER_STEPS[trainerStep].title}</p>
                <p className="mt-1 text-sm text-text-secondary">{TRAINER_STEPS[trainerStep].cue}</p>
                <p className="mt-3 text-sm font-medium text-accent-secondary">{detectCue}</p>
                <p className="mt-2 text-3xl font-bold text-text-primary">{Math.ceil(trainerRemaining)}s</p>
                {cameraReady && <p className="mt-2 text-xs text-status-success">Camera active</p>}
                {cameraError && <p className="mt-2 text-xs text-status-error">{cameraError}</p>}
                {trainerDone && (
                  <p className="mt-3 text-sm text-status-success">
                    Great job. Tension release routine completed.
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      if (trainerDone) resetTrainer();
                      setTrainerRunning((v) => !v);
                    }}
                    disabled={!cameraReady}
                    className="rounded-lg bg-accent-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                  >
                    {trainerRunning ? "Pause" : trainerDone ? "Restart" : "Start"}
                  </button>
                  <button
                    onClick={() => {
                      setTrainerRunning(false);
                      setTrainerStep((s) => Math.min(s + 1, TRAINER_STEPS.length - 1));
                      setTrainerRemaining(TRAINER_STEPS[Math.min(trainerStep + 1, TRAINER_STEPS.length - 1)].seconds);
                      shoulderHistoryRef.current = [];
                    }}
                    className="rounded-lg border border-border-primary px-3 py-2 text-xs text-text-secondary"
                  >
                    Skip Step
                  </button>
                  <button
                    onClick={resetTrainer}
                    className="rounded-lg border border-border-primary px-3 py-2 text-xs text-text-secondary"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "breathing" && (
            <div className="rounded-xl border border-border-primary bg-bg-card p-5 text-center">
              <p className="text-xs uppercase tracking-wide text-text-dim">Calm breathing</p>
              <div className="mx-auto mt-4 flex h-40 w-40 items-center justify-center rounded-full border border-accent-primary/30">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-accent-primary/15 text-sm font-semibold text-accent-secondary transition-transform"
                  style={{
                    transform: `scale(${BREATH_PHASES[breathPhase].scale})`,
                    transitionDuration: `${BREATH_PHASES[breathPhase].seconds}s`,
                  }}
                >
                  {BREATH_PHASES[breathPhase].label}
                </div>
              </div>
              <p className="mt-3 text-xl font-bold text-text-primary">{breathRemaining}s</p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => setBreathRunning((v) => !v)}
                  className="rounded-lg bg-accent-primary px-3 py-2 text-xs font-medium text-white"
                >
                  {breathRunning ? "Pause" : "Start"}
                </button>
                <button
                  onClick={() => {
                    setBreathRunning(false);
                    setBreathPhase(0);
                    setBreathRemaining(BREATH_PHASES[0].seconds);
                  }}
                  className="rounded-lg border border-border-primary px-3 py-2 text-xs text-text-secondary"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {tab === "eyes" && (
            <div className="rounded-xl border border-border-primary bg-bg-card p-5">
              <p className="text-xs uppercase tracking-wide text-text-dim">Eye tracking</p>
              <p className="mt-1 text-sm text-text-secondary">Follow the red point smoothly with your eyes only.</p>
              <div className="relative mt-4 h-52 w-full rounded-xl border border-border-primary bg-bg-elevated">
                <div
                  className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.8)]"
                  style={{
                    left: `${8 + eyeDotPosition.x * 84}%`,
                    top: `${8 + eyeDotPosition.y * 84}%`,
                  }}
                />
              </div>
              <p className="mt-3 text-sm text-text-secondary">Cycle time: 30s · Elapsed: {eyeElapsed}s</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setEyeRunning((v) => !v)}
                  className="rounded-lg bg-accent-primary px-3 py-2 text-xs font-medium text-white"
                >
                  {eyeRunning ? "Pause" : "Start"}
                </button>
                <button
                  onClick={() => {
                    setEyeRunning(false);
                    setEyeProgress(0);
                    setEyeElapsed(0);
                  }}
                  className="rounded-lg border border-border-primary px-3 py-2 text-xs text-text-secondary"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
