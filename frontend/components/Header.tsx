"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import SoundscapePlayer from "./SoundscapePlayer";

export type NavStep =
  | "select" | "quiz" | "lesson" | "exercise"
  | "dashboard" | "flashcards" | "upload" | "podcast";

interface HeaderProps {
  step: NavStep;
  subject: string;
  sessionId: string;
  soundMode: "reading" | "speaking" | "podcast" | "neutral";
  onLogoClick: () => void;
  onNavigate: (to: NavStep) => void;
  onWellness: () => void;
  onLogout: () => void;
}

const NAV_ITEMS: { key: NavStep; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
  { key: "lesson", label: "Learn", icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" },
  { key: "exercise", label: "Practice", icon: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" },
  { key: "flashcards", label: "Flashcards", icon: "M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25L12 17.25 2.25 12l4.179-2.25" },
  { key: "upload", label: "Material", icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" },
];

export default function Header({
  step, subject, sessionId, soundMode,
  onLogoClick, onNavigate, onWellness, onLogout,
}: HeaderProps) {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(latest > 80 && latest > prev);
    setScrolled(latest > 10);
  });

  return (
    <motion.header
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${
        scrolled
          ? "border-border-primary/60 bg-bg-primary/80 shadow-sm"
          : "border-transparent bg-bg-primary/60"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Logo */}
        <button onClick={onLogoClick} className="group flex items-center gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-primary/10 transition-all duration-300 group-hover:bg-accent-primary/20 group-hover:shadow-glow-sm group-hover:scale-105">
            <svg className="h-5 w-5 text-accent-secondary transition-transform duration-300 group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight gradient-text hidden xs:inline">NeuroLearn</span>
        </button>

        {/* Center nav — desktop only, show when session active */}
        {sessionId && (
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = step === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "text-accent-secondary"
                      : "text-text-muted hover:text-text-primary hover:bg-bg-hover"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.label}
                  {active && (
                    <motion.div
                      layoutId="header-active-tab"
                      className="absolute inset-x-1 -bottom-[9px] h-0.5 rounded-full bg-accent-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <SoundscapePlayer mode={soundMode} />

          {/* Wellness — hidden on small mobile */}
          <button
            onClick={onWellness}
            className="hidden sm:flex btn-nav btn-nav--default"
            title="Wellness Coach"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>

          {/* Podcast — hidden on mobile */}
          {sessionId && (
            <button
              onClick={() => onNavigate("podcast")}
              className={`hidden sm:flex btn-nav ${step === "podcast" ? "btn-nav--active" : "btn-nav--default"}`}
              title="AI Podcast"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </button>
          )}

          {/* Subject badge — tablet+ */}
          {subject && (
            <div className="hidden md:flex items-center rounded-lg border border-border-primary bg-bg-card/80 px-3 py-1.5">
              <span className="text-xs text-text-dim mr-1.5">Subject:</span>
              <span className="text-xs font-medium text-text-secondary truncate max-w-[120px]">{subject}</span>
            </div>
          )}

          <ThemeToggle />

          <button
            onClick={onLogout}
            className="btn-nav btn-nav--default text-status-error/70 hover:text-status-error hover:bg-status-error/10 hover:border-status-error/20"
            title="Log out"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </motion.header>
  );
}
