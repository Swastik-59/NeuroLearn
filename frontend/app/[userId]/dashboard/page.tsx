"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SubjectSelect from "../../quiz";
import QuizPage from "../../diagnostic";
import LessonPage from "../../lesson";
import ExercisePage from "../../exercise";
import DashboardPage from "../../dashboard";
import Flashcards from "../../flashcards";
import MaterialUpload from "../../material-upload";
import PodcastPage from "../../podcast";
import WellnessCoach from "@/components/WellnessCoach";
import Header, { type NavStep } from "@/components/Header";
import MobileDock from "@/components/MobileDock";

export type Step = NavStep;

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

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [prevStep, setPrevStep] = useState<Step>("select");

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
    }
    router.push("/login");
  };
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
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-[var(--grid-opacity)]" />
        <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-gradient-radial from-accent-primary/[0.07] to-transparent" />
        <div className="absolute -bottom-[200px] -left-[200px] h-[500px] w-[500px] rounded-full bg-gradient-radial from-accent-cyan/[0.04] to-transparent" />
        <div className="absolute -bottom-[200px] -right-[200px] h-[500px] w-[500px] rounded-full bg-gradient-radial from-accent-primary/[0.04] to-transparent" />
        <div className="absolute inset-0" style={{ opacity: "var(--noise-opacity)", backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />
      </div>

      {/* Sticky Header */}
      <Header
        step={step}
        subject={appState.subject}
        sessionId={appState.sessionId}
        soundMode={soundMode}
        onLogoClick={() => {
          setStep("select");
          setAppState({ sessionId: "", subject: "", level: "unknown", hasMaterial: false });
        }}
        onNavigate={navigate}
        onWellness={() => setWellnessOpen(true)}
        onLogout={handleLogout}
      />

      {/* Mobile Bottom Dock */}
      <MobileDock
        step={step}
        sessionId={appState.sessionId}
        onNavigate={navigate}
        onWellness={() => setWellnessOpen(true)}
      />

      {/* Content — offset for fixed header + mobile dock clearance */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-28 lg:pb-12">
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
