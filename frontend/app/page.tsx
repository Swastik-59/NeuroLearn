"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SubjectSelect from "./quiz";
import QuizPage from "./diagnostic";
import LessonPage from "./lesson";
import ExercisePage from "./exercise";
import DashboardPage from "./dashboard";
import Flashcards from "./flashcards";
import MaterialUpload from "./material-upload";
import PodcastPage from "./podcast";
import SoundscapePlayer from "@/components/SoundscapePlayer";
import WellnessCoach from "@/components/WellnessCoach";

export type Step = "select" | "quiz" | "lesson" | "exercise" | "dashboard" | "flashcards" | "upload" | "podcast";

export interface AppState {
  sessionId: string;
  subject: string;
  level: string;
  hasMaterial: boolean;
}

const pageVariants = {
  initial: { opacity: 0, y: 24, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -16, filter: "blur(4px)" },
};

const STEP_LABELS: Record<string, string> = {
  quiz: "Assessment",
  lesson: "Lesson",
  exercise: "Practice",
  dashboard: "Progress",
  flashcards: "Flashcards",
  upload: "Material",
};

export default function Home() {
  const [step, setStep] = useState<Step>("select");
  const [prevStep, setPrevStep] = useState<Step>("select");
  const [appState, setAppState] = useState<AppState>({
    sessionId: "",
    subject: "",
    level: "unknown",
    hasMaterial: false,
  });
  const [wellnessOpen, setWellnessOpen] = useState(false);

  const navigate = (to: Step) => {
    setPrevStep(step);
    setStep(to);
  };

  const coreSteps = ["quiz", "lesson", "exercise", "dashboard"] as Step[];
  const currentIndex = coreSteps.indexOf(step);
  const soundMode =
    step === "lesson" || step === "dashboard" || step === "flashcards" || step === "upload"
      ? "reading"
      : step === "podcast"
      ? "podcast"
      : step === "quiz" || step === "exercise"
      ? "speaking"
      : "neutral";

  return (
    <main className="relative min-h-screen bg-bg-primary">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40" />
        <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-gradient-radial from-accent-primary/[0.07] to-transparent" />
        <div className="absolute -bottom-[200px] -left-[200px] h-[500px] w-[500px] rounded-full bg-gradient-radial from-accent-cyan/[0.04] to-transparent" />
        <div className="absolute -bottom-[200px] -right-[200px] h-[500px] w-[500px] rounded-full bg-gradient-radial from-accent-primary/[0.04] to-transparent" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-border-primary/50 bg-bg-primary/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <button
            onClick={() => {
              setStep("select");
              setAppState({ sessionId: "", subject: "", level: "unknown", hasMaterial: false });
            }}
            className="group flex items-center gap-2.5 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary/10 transition-all group-hover:bg-accent-primary/15 group-hover:shadow-glow-sm">
              <svg className="h-4.5 w-4.5 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-text-primary group-hover:text-accent-secondary transition-colors">
              NeuroLearn
            </span>
          </button>

          {appState.sessionId && (
            <nav className="flex items-center gap-0.5">
              {coreSteps.map((s, i) => {
                const isActive = step === s;
                const isPast = currentIndex > i;
                return (
                  <div key={s} className="flex items-center">
                    <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-accent-primary/12 text-accent-secondary"
                        : isPast
                        ? "text-text-secondary"
                        : "text-text-dim"
                    }`}>
                      <span className={`flex h-4.5 w-4.5 items-center justify-center rounded-full text-[9px] font-bold ${
                        isActive
                          ? "bg-accent-primary text-white"
                          : isPast
                          ? "bg-accent-primary/20 text-accent-secondary"
                          : "bg-border-primary text-text-dim"
                      }`}>
                        {isPast ? (
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
                    </div>
                    {i < coreSteps.length - 1 && (
                      <div className={`mx-0.5 h-px w-4 ${isPast ? "bg-accent-primary/30" : "bg-border-primary"}`} />
                    )}
                  </div>
                );
              })}
            </nav>
          )}

          {appState.subject && (
            <div className="hidden sm:flex items-center gap-2">
              {/* Current subject badge */}
              <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-card px-3 py-1.5">
                <span className="text-xs text-text-dim">Subject:</span>
                <span className="text-xs font-medium text-text-secondary">{appState.subject}</span>
              </div>
            </div>
          )}

          {/* Quick-access: Upload, Flashcards, Podcast + Zen sound */}
          <div className="flex items-center gap-2">
            <SoundscapePlayer mode={soundMode} />

            <button
              onClick={() => setWellnessOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border-primary bg-bg-card px-2.5 py-1.5 text-xs font-medium text-text-dim transition-all hover:text-text-secondary hover:border-border-hover"
              title="Wellness Coach"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 8.25h-4.5m8.25 0A2.25 2.25 0 0120.25 10.5v8.25A2.25 2.25 0 0118 21H6a2.25 2.25 0 01-2.25-2.25V10.5A2.25 2.25 0 016 8.25m12 0V6A2.25 2.25 0 0015.75 3.75h-7.5A2.25 2.25 0 006 6v2.25m12 0h-12" />
              </svg>
              Wellness
            </button>

            <button
              onClick={() => navigate("upload")}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                step === "upload"
                  ? "border-accent-primary/40 bg-accent-primary/10 text-accent-secondary"
                  : "border-border-primary bg-bg-card text-text-dim hover:text-text-secondary hover:border-border-hover"
              }`}
              title="Upload PDF / PPTX"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Upload
            </button>

            <button
              onClick={() => navigate("flashcards")}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                step === "flashcards"
                  ? "border-accent-primary/40 bg-accent-primary/10 text-accent-secondary"
                  : "border-border-primary bg-bg-card text-text-dim hover:text-text-secondary hover:border-border-hover"
              }`}
              title="Flashcards"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25L12 17.25 2.25 12l4.179-2.25" />
              </svg>
              Cards
            </button>

            <button
              onClick={() => navigate("podcast")}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                step === "podcast"
                  ? "border-accent-primary/40 bg-accent-primary/10 text-accent-secondary"
                  : "border-border-primary bg-bg-card text-text-dim hover:text-text-secondary hover:border-border-hover"
              }`}
              title="AI Podcast"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
              Podcast
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {step === "select" && (
              <SubjectSelect
                onStart={(sessionId, subject) => {
                  setAppState({ ...appState, sessionId, subject });
                  navigate("quiz");
                }}
              />
            )}

            {step === "quiz" && (
              <QuizPage
                sessionId={appState.sessionId}
                subject={appState.subject}
                onComplete={(level) => {
                  setAppState({ ...appState, level });
                  navigate("lesson");
                }}
              />
            )}

            {step === "lesson" && (
              <LessonPage
                sessionId={appState.sessionId}
                subject={appState.subject}
                level={appState.level}
                onNext={() => navigate("exercise")}
              />
            )}

            {step === "exercise" && (
              <ExercisePage
                sessionId={appState.sessionId}
                subject={appState.subject}
                level={appState.level}
                onComplete={(newLevel) => {
                  setAppState({ ...appState, level: newLevel });
                  navigate("dashboard");
                }}
              />
            )}

            {step === "dashboard" && (
              <DashboardPage
                sessionId={appState.sessionId}
                onContinue={() => navigate("lesson")}
                onRestart={() => {
                  setStep("select");
                  setPrevStep("select");
                  setAppState({ sessionId: "", subject: "", level: "unknown", hasMaterial: false });
                }}
                onFlashcards={() => navigate("flashcards")}
                onUpload={() => navigate("upload")}
              />
            )}

            {step === "flashcards" && (
              <Flashcards
                sessionId={appState.sessionId || undefined}
                subject={appState.subject || undefined}
                hasMaterial={appState.hasMaterial}
                onBack={() => navigate(prevStep === "flashcards" || prevStep === "upload" ? (appState.sessionId ? "dashboard" : "select") : prevStep)}
              />
            )}

            {step === "upload" && (
              <MaterialUpload
                sessionId={appState.sessionId || undefined}
                subject={appState.subject || undefined}
                onMaterialReady={() => setAppState({ ...appState, hasMaterial: true })}
                onBack={() => navigate(prevStep === "flashcards" || prevStep === "upload" ? (appState.sessionId ? "dashboard" : "select") : prevStep)}
              />
            )}

            {step === "podcast" && (
              <PodcastPage
                onBack={() => navigate(prevStep === "podcast" ? (appState.sessionId ? "dashboard" : "select") : prevStep)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <WellnessCoach open={wellnessOpen} onClose={() => setWellnessOpen(false)} />
    </main>
  );
}
