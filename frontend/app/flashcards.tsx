"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { generateFlashcards, type Flashcard } from "../lib/api";

const SUBJECTS = [
  "Data Structures & Algorithms", "Machine Learning", "Operating Systems",
  "Database Management", "Computer Networks", "Object Oriented Programming",
  "Web Development", "Discrete Mathematics", "Computer Architecture",
  "Cyber Security", "Cloud Computing", "Artificial Intelligence",
];

interface FlashcardsProps {
  sessionId?: string;
  subject?: string;
  hasMaterial?: boolean;
  onBack: () => void;
}

export default function Flashcards({ sessionId, subject: propSubject, hasMaterial = false, onBack }: FlashcardsProps) {
  const standalone = !sessionId;
  const [selectedSubject, setSelectedSubject] = useState(propSubject || "");
  const effectiveSubject = propSubject || selectedSubject;
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [fromMaterial, setFromMaterial] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState("");
  const [known, setKnown] = useState<Set<number>>(new Set());

  const generate = async () => {
    // Must have at least a subject OR a custom topic
    if (!effectiveSubject && !customTopic.trim()) {
      setError("Please select a subject or enter a custom topic.");
      return;
    }
    if (loading) return; // prevent double submit
    setLoading(true);
    setError("");
    try {
      const res = await generateFlashcards(
        sessionId || undefined,
        topic || undefined,
        fromMaterial,
        standalone ? effectiveSubject || undefined : undefined,
        undefined,
        customTopic.trim() || undefined,
      );
      if (!res.flashcards || res.flashcards.length === 0) {
        setError("No flashcards were generated. Try a different topic.");
        setLoading(false);
        return;
      }
      setCards(res.flashcards);
      setCurrent(0);
      setFlipped(false);
      setGenerated(true);
      setKnown(new Set());
    } catch (err: unknown) {
      const msg =
        err instanceof Error && "response" in err
          ? (err as any).response?.data?.detail || "Failed to generate flashcards."
          : "Failed to generate flashcards. Check backend connection.";
      setError(msg);
    }
    setLoading(false);
  };

  const next = () => {
    if (current < cards.length - 1) {
      setFlipped(false);
      setTimeout(() => setCurrent((c) => c + 1), 150);
    }
  };
  const prev = () => {
    if (current > 0) {
      setFlipped(false);
      setTimeout(() => setCurrent((c) => c - 1), 150);
    }
  };

  const toggleKnown = (idx: number) => {
    setKnown((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Keyboard navigation: Left/Right arrows, Space for flip
  useEffect(() => {
    if (!generated) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") { e.preventDefault(); setFlipped((f) => !f); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [generated, current, cards.length]);

  // Swipe support via drag
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-200, 200], [-8, 8]);
  const dragOpacity = useTransform(dragX, [-200, -80, 0, 80, 200], [0.5, 1, 1, 1, 0.5]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.x > 80) prev();
    else if (info.offset.x < -80) next();
  }, [current, cards.length]);

  // Setup screen
  if (!generated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-xl space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 shadow-glow-sm">
            <svg className="h-7 w-7 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25L12 17.25 2.25 12l4.179-2.25" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Flashcards</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {effectiveSubject ? (
              <>Generate study cards for <span className="font-medium text-accent-secondary">{effectiveSubject}</span></>
            ) : (
              "Pick a subject or enter a custom topic"
            )}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border-primary bg-bg-card">
          <div className="h-px bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent" />
          <div className="space-y-4 p-6">
            {/* Subject selector — only in standalone mode */}
            {standalone && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-text-dim">Subject</span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full rounded-lg border border-border-primary bg-bg-input px-4 py-2.5 text-sm text-text-primary focus:border-accent-primary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/10 transition-all appearance-none"
                >
                  <option value="">Select a subject...</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-text-dim">Topic (optional — refine within subject)</span>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Binary Trees, Sorting, Normalization..."
                className="w-full rounded-lg border border-border-primary bg-bg-input px-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-primary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/10 transition-all"
              />
            </label>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-primary/40" /></div>
              <div className="relative flex justify-center"><span className="bg-bg-card px-3 text-[10px] uppercase tracking-widest text-text-dim">or</span></div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-text-dim">Custom Topic (any topic — no subject needed)</span>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. French Revolution, Quantum Mechanics, Cooking Basics..."
                className="w-full rounded-lg border border-border-primary bg-bg-input px-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-primary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/10 transition-all"
              />
              {customTopic.trim() && (
                <p className="mt-1 text-[10px] text-accent-secondary">Will generate flashcards directly for this topic</p>
              )}
            </label>

            {hasMaterial && sessionId && (
              <label className="flex items-center gap-3 rounded-lg border border-border-primary bg-bg-elevated p-3 text-sm text-text-secondary cursor-pointer hover:border-accent-primary/30 transition-colors">
                <input
                  type="checkbox"
                  checked={fromMaterial}
                  onChange={(e) => setFromMaterial(e.target.checked)}
                  className="h-4 w-4 rounded border-border-primary accent-accent-primary"
                />
                <div>
                  <p className="text-xs font-medium text-text-primary">Generate from uploaded material</p>
                  <p className="text-[10px] text-text-dim">Use your PDF/PPTX content as the source</p>
                </div>
              </label>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-status-error/20 bg-status-error/[0.06] px-3 py-2">
                <svg className="h-3.5 w-3.5 shrink-0 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-xs text-status-error">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={onBack} className="btn-secondary flex-1">
                Back
              </button>
              <button onClick={generate} disabled={loading} className="btn-primary flex-1">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="loading-spinner" />
                    Generating...
                  </span>
                ) : (
                  <>
                    Generate
                    <svg className="ml-2 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Flashcard viewer
  const card = cards[current];
  const knownCount = known.size;
  const remainingCount = cards.length - knownCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-lg flex flex-col min-h-[calc(100vh-10rem)] lg:min-h-0 lg:block space-y-5"
    >
      {/* Header with stats */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Flashcards</h2>
        <div className="mt-2 flex items-center justify-center gap-4">
          <span className="text-xs text-text-dim">
            Card <span className="font-bold text-text-secondary">{current + 1}</span> of{" "}
            <span className="font-bold text-text-secondary">{cards.length}</span>
          </span>
          <span className="h-3 w-px bg-border-primary" />
          <span className="text-xs text-status-success">
            {knownCount} known
          </span>
          <span className="text-xs text-amber-400">
            {remainingCount} remaining
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bg-secondary">
        <motion.div
          animate={{ width: `${((current + 1) / cards.length) * 100}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary"
        />
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setFlipped(false);
              setTimeout(() => setCurrent(i), 120);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${i === current
                ? "w-6 bg-accent-primary shadow-glow-sm"
                : known.has(i)
                  ? "w-2 bg-status-success/60"
                  : "w-2 bg-border-secondary hover:bg-accent-primary/40"
              }`}
          />
        ))}
      </div>

      {/* Card with flip + swipe */}
      <div className="flex-1 lg:flex-none flex items-center justify-center">
        <motion.div
          className="cursor-pointer select-none w-full touch-pan-y"
          onClick={() => setFlipped(!flipped)}
          style={{ perspective: "1200px" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${current}-${flipped}`}
              initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{ x: dragX, rotate: dragRotate, opacity: dragOpacity }}
              className={`relative min-h-[220px] sm:min-h-[240px] overflow-hidden rounded-xl border p-6 sm:p-8 transition-colors ${flipped
                  ? "border-accent-primary/30 bg-accent-primary/[0.04]"
                  : "border-border-primary bg-bg-card"
                }`}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent" />

              <div className="flex min-h-[160px] sm:min-h-[180px] flex-col items-center justify-center">
                <span className={`mb-4 rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${flipped
                    ? "bg-accent-primary/10 text-accent-secondary"
                    : "bg-bg-elevated text-text-dim"
                  }`}>
                  {flipped ? "Answer" : "Question"}
                </span>
                <p className="text-center text-base sm:text-lg leading-relaxed text-text-primary">
                  {flipped ? card?.back : card?.front}
                </p>
              </div>

              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <span className="text-[10px] text-text-dim">
                  {flipped ? "Click to see question" : "Click to reveal answer"} · Swipe or use arrow keys
                </span>
              </div>

              {known.has(current) && (
                <div className="absolute right-4 top-4">
                  <span className="rounded bg-status-success/10 px-1.5 py-0.5 text-[10px] text-status-success">Known</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Controls — bottom-aligned on mobile */}
      <div className="mt-auto lg:mt-0 space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={current === 0}
            className="btn-secondary flex-1 disabled:opacity-30"
          >
            <svg className="mr-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Prev
          </button>
          <button
            onClick={() => toggleKnown(current)}
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${known.has(current)
                ? "border-status-success/30 bg-status-success/10 text-status-success"
                : "border-border-secondary bg-bg-elevated text-text-secondary hover:border-status-success/30 hover:text-status-success"
              }`}
            title="Mark as known"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </button>
          <button
            onClick={next}
            disabled={current === cards.length - 1}
            className="btn-primary flex-1 disabled:opacity-30"
          >
            Next
            <svg className="ml-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setGenerated(false);
            setError("");
          }}
          className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1.5"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          New Set
        </button>
        <button onClick={onBack} className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1.5">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Dashboard
        </button>
      </div>
    </motion.div>
  );
}
