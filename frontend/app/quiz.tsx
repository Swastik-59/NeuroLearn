"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { startSession } from "@/lib/api";

const SUBJECTS = [
  {
    id: "Data Structures & Algorithms",
    label: "DSA",
    description: "Arrays, trees, graphs, sorting, dynamic programming",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    color: "from-violet-500/20 to-purple-500/20",
    borderHover: "hover:border-violet-500/30",
    iconActive: "text-violet-400",
  },
  {
    id: "Machine Learning",
    label: "Machine Learning",
    description: "Regression, classification, neural networks, NLP",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    color: "from-cyan-500/20 to-teal-500/20",
    borderHover: "hover:border-cyan-500/30",
    iconActive: "text-cyan-400",
  },
  {
    id: "Operating Systems",
    label: "Operating Systems",
    description: "Processes, threads, memory management, scheduling",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
      </svg>
    ),
    color: "from-orange-500/20 to-amber-500/20",
    borderHover: "hover:border-orange-500/30",
    iconActive: "text-orange-400",
  },
  {
    id: "Database Management",
    label: "DBMS",
    description: "SQL, normalization, transactions, indexing",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
    color: "from-emerald-500/20 to-green-500/20",
    borderHover: "hover:border-emerald-500/30",
    iconActive: "text-emerald-400",
  },
  {
    id: "Computer Networks",
    label: "Computer Networks",
    description: "TCP/IP, OSI model, routing, protocols",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    color: "from-blue-500/20 to-indigo-500/20",
    borderHover: "hover:border-blue-500/30",
    iconActive: "text-blue-400",
  },
  {
    id: "Object Oriented Programming",
    label: "OOP",
    description: "Classes, inheritance, polymorphism, design patterns",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
    color: "from-pink-500/20 to-rose-500/20",
    borderHover: "hover:border-pink-500/30",
    iconActive: "text-pink-400",
  },
  {
    id: "Web Development",
    label: "Web Development",
    description: "HTML, CSS, JavaScript, React, APIs, REST",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    color: "from-sky-500/20 to-blue-500/20",
    borderHover: "hover:border-sky-500/30",
    iconActive: "text-sky-400",
  },
  {
    id: "Discrete Mathematics",
    label: "Discrete Math",
    description: "Logic, sets, combinatorics, graph theory",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.745 3A23.933 23.933 0 003 12c0 3.183.62 6.22 1.745 9M19.5 3c.967 2.78 1.5 5.817 1.5 9s-.533 6.22-1.5 9M8.25 8.885l1.444-.89a.75.75 0 011.11.649v6.712a.75.75 0 01-1.11.649l-1.444-.89m4.5-5.24h3m-3 2.62h3" />
      </svg>
    ),
    color: "from-amber-500/20 to-yellow-500/20",
    borderHover: "hover:border-amber-500/30",
    iconActive: "text-amber-400",
  },
  {
    id: "Computer Architecture",
    label: "Computer Architecture",
    description: "CPU design, pipelining, cache, memory hierarchy",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
      </svg>
    ),
    color: "from-slate-500/20 to-gray-500/20",
    borderHover: "hover:border-slate-400/30",
    iconActive: "text-slate-400",
  },
  {
    id: "Cyber Security",
    label: "Cyber Security",
    description: "Encryption, authentication, network security, threats",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    color: "from-red-500/20 to-rose-500/20",
    borderHover: "hover:border-red-500/30",
    iconActive: "text-red-400",
  },
  {
    id: "Cloud Computing",
    label: "Cloud Computing",
    description: "AWS, virtualization, containers, serverless",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    ),
    color: "from-indigo-500/20 to-violet-500/20",
    borderHover: "hover:border-indigo-500/30",
    iconActive: "text-indigo-400",
  },
  {
    id: "Artificial Intelligence",
    label: "AI Fundamentals",
    description: "Search algorithms, knowledge representation, planning",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    color: "from-fuchsia-500/20 to-purple-500/20",
    borderHover: "hover:border-fuchsia-500/30",
    iconActive: "text-fuchsia-400",
  },
];

interface SubjectSelectProps {
  onStart: (sessionId: string, subject: string) => void;
}

export default function SubjectSelect({ onStart }: SubjectSelectProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      const res = await startSession(selected);
      onStart(res.session_id, selected);
    } catch {
      setError("Failed to start session. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hero section */}
      <div className="mb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent-primary/20 bg-accent-primary/10 shadow-glow-sm">
            <svg className="h-8 w-8 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
          </div>
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight">
            <span className="gradient-text">NeuroLearn</span>
          </h1>
          <p className="text-base text-text-secondary max-w-md mx-auto leading-relaxed">
            Adaptive learning tutor powered by AI. Select a subject to begin your personalized learning path.
          </p>
        </motion.div>
      </div>

      {/* Subject heading */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-5 w-full max-w-4xl"
      >
        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted">Choose your subject</h2>
      </motion.div>

      {/* Subject grid */}
      <div className="grid w-full max-w-4xl gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {SUBJECTS.map((subject, i) => (
          <motion.button
            key={subject.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 + i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={() => setSelected(subject.id)}
            className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-300 ${selected === subject.id
                ? "border-accent-primary/50 bg-accent-primary/[0.06] ring-1 ring-accent-primary/20 shadow-glow-sm scale-[1.01]"
                : `border-border-primary bg-bg-card ${subject.borderHover} hover:bg-bg-elevated hover:shadow-glow-sm hover:scale-[1.02] hover:-translate-y-0.5`
              }`}
          >
            {/* Gradient overlay on select */}
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${subject.color} opacity-0 transition-opacity duration-300 ${selected === subject.id ? "opacity-100" : "group-hover:opacity-50"
              }`} />

            {/* Top shimmer line */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            <div className="relative flex items-start gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 ${selected === subject.id
                  ? `border-transparent bg-white/[0.08] ${subject.iconActive}`
                  : "border-border-primary bg-bg-secondary text-text-dim group-hover:text-text-secondary group-hover:border-border-secondary"
                }`}>
                {subject.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className={`text-sm font-semibold transition-colors ${selected === subject.id ? "text-text-primary" : "text-text-primary/90"
                  }`}>
                  {subject.label}
                </h3>
                <p className="mt-0.5 text-xs text-text-muted line-clamp-1">{subject.description}</p>
              </div>

              {/* Checkmark */}
              {selected === subject.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-primary"
                >
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-center gap-2 rounded-lg border border-status-error/20 bg-status-error/[0.06] px-4 py-2.5"
        >
          <svg className="h-4 w-4 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-status-error">{error}</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-8 flex flex-col items-center gap-3"
      >
        <button
          onClick={handleStart}
          disabled={!selected || loading}
          className="btn-primary relative flex items-center gap-2.5 px-10 py-3.5"
        >
          {loading ? (
            <>
              <span className="loading-spinner" />
              Starting session...
            </>
          ) : (
            <>
              Begin Assessment
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>
        {selected && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-text-dim"
          >
            Selected: {SUBJECTS.find(s => s.id === selected)?.label}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
