"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useInView } from "framer-motion";
import { getProgress, ProgressResponse } from "@/lib/api";
import DifficultyBadge from "@/components/DifficultyBadge";
import ProgressBar from "@/components/ProgressBar";
import { sectionReveal } from "@/lib/animations";

/** Animated counter that counts up from 0 */
function AnimatedCounter({ value, suffix = "", className }: { value: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 80, damping: 20 });

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, value, motionVal]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      if (ref.current) ref.current.textContent = `${Math.round(latest)}${suffix}`;
    });
    return unsubscribe;
  }, [spring, suffix]);

  return <span ref={ref} className={className}>0{suffix}</span>;
}

/** SVG circular mastery ring */
function MasteryRing({ value, size = 100 }: { value: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value >= 70 ? "#22c55e" : value >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={5} className="text-border-primary" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedCounter value={value} suffix="%" className="text-xl font-bold text-text-primary" />
        <span className="text-[9px] uppercase tracking-widest text-text-dim">Mastery</span>
      </div>
    </div>
  );
}

interface DashboardPageProps {
  sessionId: string;
  onContinue: () => void;
  onRestart: () => void;
  onFlashcards?: () => void;
  onUpload?: () => void;
}

export default function DashboardPage({
  sessionId,
  onContinue,
  onRestart,
  onFlashcards,
  onUpload,
}: DashboardPageProps) {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getProgress(sessionId);
        setProgress(res);
      } catch {
        setError("Failed to load progress.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-5 py-24">
        <div className="relative">
          <div className="loading-spinner h-8 w-8" />
          <div className="absolute inset-0 rounded-full bg-accent-primary/10 animate-ping" />
        </div>
        <p className="text-sm text-text-secondary">Loading your progress...</p>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-status-error/10">
          <svg className="h-6 w-6 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-sm text-status-error">{error || "No progress data available."}</p>
      </div>
    );
  }

  const levelIndex = { Beginner: 0, Intermediate: 1, Advanced: 2 }[progress.level] ?? 0;
  const levelProgress = ((levelIndex + 1) / 3) * 100;

  const masteryColor =
    progress.mastery >= 70
      ? "text-status-success"
      : progress.mastery >= 40
        ? "text-amber-400"
        : "text-status-error";

  // Topic accuracy entries sorted by total desc
  const topicEntries = Object.entries(progress.topic_accuracy || {}).sort(
    (a, b) => (b[1] as any).total - (a[1] as any).total
  );

  // Type accuracy entries
  const typeEntries = Object.entries(progress.type_accuracy || {});

  // Cognitive / NeuroAdaptive derived values
  const csi = progress.cognitive_strain_index ?? 0;
  const stabilityScore = Math.max(0, Math.round(100 - csi));
  const avgRT = progress.avg_response_time ?? 0;
  const adaptiveMode = progress.adaptive_mode ?? null;
  const weaknessEntries = Object.entries(progress.weakness_profile ?? {}).sort(
    (a, b) => (a[1] as any).mastery_score - (b[1] as any).mastery_score
  );

  const adaptiveModeLabel: Record<string, { label: string; color: string }> = {
    fluency_training:      { label: "Fluency Training",      color: "text-sky-400 border-sky-400/25 bg-sky-400/8" },
    concept_reinforcement: { label: "Concept Reinforcement", color: "text-amber-400 border-amber-400/25 bg-amber-400/8" },
    cognitive_overload:    { label: "Cognitive Overload",    color: "text-red-400 border-red-400/25 bg-red-400/8" },
    standard:              { label: "Standard",               color: "text-text-secondary border-border-primary bg-bg-elevated" },
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 shadow-glow-sm">
          <svg className="h-7 w-7 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <h2 className="mb-1 text-2xl font-bold text-text-primary">Progress Dashboard</h2>
        <p className="text-sm text-text-secondary">
          Your learning journey in <span className="font-medium text-accent-secondary">{progress.subject}</span>
        </p>
      </motion.div>

      {/* Top stats: responsive grid */}
      <div className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Level", value: progress.level, type: "badge" as const, color: "text-accent-secondary" },
          { label: "Mastery", value: `${progress.mastery}%`, type: "text" as const, color: masteryColor },
          { label: "Accuracy", value: `${progress.accuracy}%`, type: "text" as const, color: progress.accuracy >= 70 ? "text-status-success" : progress.accuracy >= 40 ? "text-amber-400" : "text-status-error" },
          { label: "Questions", value: `${progress.total_attempts}`, type: "text" as const, color: "text-sky-400" },
          { label: "Correct", value: `${progress.total_correct}`, type: "text" as const, color: "text-emerald-400" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 + i * 0.07 }}
            className="group relative overflow-hidden rounded-xl border border-border-primary bg-bg-card p-4 transition-colors hover:border-border-hover"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-text-dim">{stat.label}</p>
            {stat.type === "badge" ? (
              <DifficultyBadge level={stat.value} />
            ) : (
              <p className={`text-xl sm:text-2xl font-bold ${stat.color}`}>
                <AnimatedCounter value={parseInt(stat.value)} suffix={stat.value.includes('%') ? '%' : ''} className={stat.color} />
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Mastery ring + accuracy bars */}
      <motion.div
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mb-6 overflow-hidden rounded-xl border border-border-primary bg-bg-card"
      >
        <div className="h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent" />
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6">
          <MasteryRing value={progress.mastery} size={110} />
          <div className="flex-1 w-full space-y-5">
            <ProgressBar value={progress.mastery} label="Mastery Score" size="lg" showGlow />
            <ProgressBar value={progress.accuracy} label="Overall Accuracy" />
            <ProgressBar value={levelProgress} label="Level Progression" />
          </div>
        </div>
      </motion.div>

      {/* Cognitive Metrics */}
      <motion.div
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mb-6 overflow-hidden rounded-xl border border-border-primary bg-bg-card"
      >
        <div className="h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
        <div className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Cognitive Metrics
            {adaptiveMode && adaptiveModeLabel[adaptiveMode] && (
              <span className={`ml-auto rounded-lg border px-2.5 py-0.5 text-xs font-medium ${adaptiveModeLabel[adaptiveMode].color}`}>
                {adaptiveModeLabel[adaptiveMode].label}
              </span>
            )}
          </h3>
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 mb-5">
            <div className="rounded-lg border border-border-primary bg-bg-elevated p-3 text-center">
              <p className="text-lg font-bold text-violet-400">{stabilityScore}</p>
              <p className="text-[10px] uppercase tracking-wider text-text-dim mt-0.5">Stability Score</p>
            </div>
            <div className="rounded-lg border border-border-primary bg-bg-elevated p-3 text-center">
              <p className={`text-lg font-bold ${csi >= 70 ? "text-status-error" : csi >= 40 ? "text-amber-400" : "text-status-success"}`}>
                {Math.round(csi)}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-text-dim mt-0.5">Strain Index</p>
            </div>
            <div className="rounded-lg border border-border-primary bg-bg-elevated p-3 text-center">
              <p className="text-lg font-bold text-sky-400">{avgRT > 0 ? avgRT.toFixed(1) : "—"}s</p>
              <p className="text-[10px] uppercase tracking-wider text-text-dim mt-0.5">Avg Response</p>
            </div>
          </div>
          <ProgressBar value={stabilityScore} label="Cognitive Stability" showGlow />
          <div className="mt-3">
            <ProgressBar value={csi} label="Cognitive Strain Index" />
          </div>
        </div>
      </motion.div>

      {/* Weakness DNA */}
      {weaknessEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.41 }}
          className="mb-6 overflow-hidden rounded-xl border border-red-500/20 bg-bg-card"
        >
          <div className="h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
          <div className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Weakness DNA
              <span className="ml-auto text-[10px] text-text-dim font-normal">Topics needing reinforcement</span>
            </h3>
            <div className="space-y-4">
              {weaknessEntries.map(([topic, data]: [string, any]) => {
                const mastery = Math.round(data.mastery_score ?? 0);
                const masteryCol =
                  mastery >= 60 ? "text-status-success" : mastery >= 35 ? "text-amber-400" : "text-status-error";
                return (
                  <div key={topic}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-text-secondary capitalize">{topic}</span>
                      <span className={`text-xs font-bold ${masteryCol}`}>{mastery}% mastery</span>
                    </div>
                    <ProgressBar value={mastery} />
                    {(data.error_types?.length > 0 || data.recurring_patterns?.length > 0) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {data.error_types?.map((e: string) => (
                          <span key={e} className="rounded bg-status-error/10 px-2 py-0.5 text-[10px] text-status-error">
                            {e}
                          </span>
                        ))}
                        {data.recurring_patterns?.map((p: string) => (
                          <span key={p} className="rounded bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-400">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Topic accuracy heatmap */}
      {topicEntries.length > 0 && (
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="mb-6 overflow-hidden rounded-xl border border-border-primary bg-bg-card"
        >
          <div className="h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent" />
          <div className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-text-primary">Topic Performance</h3>
            <div className="space-y-2">
              {topicEntries.map(([topic, data]: [string, any]) => {
                const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                return (
                  <div key={topic} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="w-full sm:w-28 truncate text-xs text-text-secondary" title={topic}>
                      {topic}
                    </span>
                    <div className="flex-1">
                      <ProgressBar value={acc} />
                    </div>
                    <span className="w-12 text-right text-xs font-medium text-text-dim">
                      {data.correct}/{data.total}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Type accuracy */}
      {typeEntries.length > 0 && (
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="mb-6 overflow-hidden rounded-xl border border-border-primary bg-bg-card"
        >
          <div className="h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent" />
          <div className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-text-primary">Performance by Question Type</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {typeEntries.map(([qtype, data]: [string, any]) => {
                const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                const label = qtype === "true_false" ? "True/False" : qtype === "mcq" ? "MCQ" : qtype === "qa" ? "Open-ended" : "Short Answer";
                return (
                  <div key={qtype} className="rounded-lg border border-border-primary bg-bg-elevated p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-text-secondary">{label}</span>
                      <span className="text-xs text-text-dim">{data.correct}/{data.total}</span>
                    </div>
                    <ProgressBar value={acc} />
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Weaknesses */}
      {progress.weaknesses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.5 }}
          className="mb-6 overflow-hidden rounded-xl border border-status-error/20 bg-bg-card"
        >
          <div className="h-px bg-gradient-to-r from-transparent via-status-error/30 to-transparent" />
          <div className="p-6">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Areas to Improve</h3>
            <div className="flex flex-wrap gap-2">
              {progress.weaknesses.map((w, i) => (
                <span key={i} className="rounded-lg bg-status-error/10 px-2.5 py-1 text-xs text-status-error">
                  {w.name} ({w.accuracy}%)
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      {progress.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.55 }}
          className="mb-6 overflow-hidden rounded-xl border border-accent-primary/20 bg-bg-card"
        >
          <div className="h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent" />
          <div className="p-6">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Recommendations</h3>
            <ul className="space-y-2">
              {progress.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-accent-primary/10 text-[10px] font-bold text-accent-secondary">
                    {i + 1}
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Level history */}
      {progress.level_history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.6 }}
          className="mb-8 overflow-hidden rounded-xl border border-border-primary bg-bg-card"
        >
          <div className="h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent" />
          <div className="p-6">
            <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <svg className="h-4 w-4 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Level Journey
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              {progress.level_history.map((lvl, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.65 + i * 0.08 }}
                  >
                    <DifficultyBadge level={lvl} />
                  </motion.div>
                  {i < progress.level_history.length - 1 && (
                    <svg className="h-3 w-3 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="flex flex-wrap justify-center gap-3 px-2 sm:px-0"
      >
        <button onClick={onContinue} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
          </svg>
          Continue Learning
        </button>
        {onFlashcards && (
          <button onClick={onFlashcards} className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25L12 17.25 2.25 12l4.179-2.25" />
            </svg>
            Flashcards
          </button>
        )}
        {onUpload && (
          <button onClick={onUpload} className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Upload Material
          </button>
        )}
        <button onClick={onRestart} className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          New Subject
        </button>
      </motion.div>
    </div>
  );
}
