"use client";

import { motion } from "framer-motion";

export type DockStep =
  | "select" | "quiz" | "lesson" | "exercise"
  | "dashboard" | "flashcards" | "upload" | "podcast";

interface MobileDockProps {
  step: DockStep;
  sessionId: string;
  onNavigate: (to: DockStep) => void;
  onWellness: () => void;
}

const DOCK_ITEMS: { key: DockStep; label: string; icon: string }[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  },
  {
    key: "lesson",
    label: "Learn",
    icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  },
  {
    key: "exercise",
    label: "Practice",
    icon: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z",
  },
  {
    key: "flashcards",
    label: "Cards",
    icon: "M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25L12 17.25 2.25 12l4.179-2.25",
  },
  {
    key: "upload",
    label: "Material",
    icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5",
  },
];

export default function MobileDock({ step, sessionId, onNavigate, onWellness }: MobileDockProps) {
  if (!sessionId) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden pb-safe">
      <div className="mx-3 mb-3 rounded-2xl border border-glass-border bg-glass-bg backdrop-blur-xl shadow-dock">
        <nav className="flex items-center justify-around px-1 py-1.5">
          {DOCK_ITEMS.map((item) => {
            const active = step === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className="relative flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-[52px] min-h-[44px] rounded-xl transition-colors"
              >
                {active && (
                  <motion.div
                    layoutId="dock-active"
                    className="absolute inset-0 rounded-xl bg-accent-primary/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <svg
                  className={`relative z-10 h-5 w-5 transition-colors duration-200 ${
                    active ? "text-accent-secondary" : "text-text-dim"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={active ? 2 : 1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <motion.span
                  initial={false}
                  animate={{ opacity: active ? 1 : 0.6 }}
                  className={`relative z-10 text-[10px] font-medium leading-none ${
                    active ? "text-accent-secondary" : "text-text-dim"
                  }`}
                >
                  {item.label}
                </motion.span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
