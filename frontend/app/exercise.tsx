"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { generateExercise, submitExercise, Question, QuestionType } from "@/lib/api";
import QuestionCard from "@/components/QuestionCard";
import DifficultyBadge from "@/components/DifficultyBadge";
import ProgressBar from "@/components/ProgressBar";

interface ExercisePageProps {
  sessionId: string;
  subject: string;
  level: string;
  onComplete: (newLevel: string) => void;
}

const ADAPTIVE_MODE_LABELS: Record<string, { label: string; color: string }> = {
  fluency_training:      { label: "Fluency Training",      color: "text-sky-400 bg-sky-400/10 border-sky-400/20" },
  concept_reinforcement: { label: "Concept Reinforcement", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  cognitive_overload:    { label: "Cognitive Overload",    color: "text-red-400 bg-red-400/10 border-red-400/20" },
  standard:              { label: "Standard",               color: "text-text-secondary bg-bg-elevated border-border-primary" },
};

const STRESS_ACTION_MESSAGES: Record<string, string> = {
  micro_break:             "Performance instability detected. Consider a short break before continuing.",
  simplified_explanation:  "Performance instability detected. Review the lesson to reinforce core concepts.",
  switch_to_review:        "Performance instability detected. Consider switching to review mode.",
};

export default function ExercisePage({ sessionId, subject, level, onComplete }: ExercisePageProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [questionType, setQuestionType] = useState<QuestionType>("short");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    accuracy: number;
    correct: number;
    total: number;
    new_level: string;
    level_changed: boolean;
    mastery: number;
    adaptive_mode: string;
    cognitive_strain_index: number;
    avg_response_time: number;
    stress_detected: boolean;
    recommended_action: string | null;
  } | null>(null);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);

  // Timing state
  const questionStartRef = useRef<number>(Date.now());
  const [perQuestionTimes, setPerQuestionTimes] = useState<number[]>([]);
  const sessionStartRef = useRef<number>(Date.now());

  const fetchQuestions = async (qType: QuestionType) => {
    setLoading(true);
    setError("");
    try {
      const res = await generateExercise(sessionId, qType);
      setQuestions(res.questions);
      setAnswers(new Array(res.questions.length).fill(""));
      setPerQuestionTimes([]);
      questionStartRef.current = Date.now();
      sessionStartRef.current = Date.now();
      setStarted(true);
    } catch {
      setError("Failed to generate exercises.");
    } finally {
      setLoading(false);
    }
  };

  // Called when the user changes an answer — record time for that question slot
  const handleAnswerChange = (index: number, val: string) => {
    const now = Date.now();
    const elapsed = (now - questionStartRef.current) / 1000;
    questionStartRef.current = now;

    setPerQuestionTimes((prev) => {
      const updated = [...prev];
      // Accumulate time per question index
      updated[index] = (updated[index] ?? 0) + elapsed;
      return updated;
    });

    setAnswers((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const totalTime = (Date.now() - sessionStartRef.current) / 1000;
      const payload = questions.map((q, i) => ({
        question: q.question,
        user_answer: answers[i],
        correct_answer: String(q.answer ?? ""),
        type: q.type || questionType,
      }));
      // Fill any unrecorded question times with 0
      const times = questions.map((_, i) => perQuestionTimes[i] ?? 0);
      const res = await submitExercise(sessionId, payload, times, totalTime);
      setResult(res);
    } catch {
      setError("Failed to submit exercises.");
    } finally {
      setSubmitting(false);
    }
  };

  // Question type selection screen
  if (!started && !loading) {
    const types: { value: QuestionType; label: string; desc: string; icon: string }[] = [
      { value: "short", label: "Short Answer", desc: "Type concise answers to test recall", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" },
      { value: "mcq", label: "Multiple Choice", desc: "Pick the correct option from 4 choices", icon: "M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" },
      { value: "true_false", label: "True / False", desc: "Determine if statements are correct", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
      { value: "qa", label: "Open-ended", desc: "Write detailed explanatory responses", icon: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" },
      { value: "mixed", label: "Mixed", desc: "A combination of all question types", icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-xl space-y-6"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 shadow-glow-sm">
            <svg className="h-7 w-7 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Practice Exercises</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {subject} &middot; <span className="text-accent-secondary">{level}</span>
          </p>
          <p className="mt-2 text-xs text-text-dim">Select question format</p>
        </div>

        <div className="space-y-2">
          {types.map((t) => (
            <button
              key={t.value}
              onClick={() => setQuestionType(t.value)}
              className={`group w-full overflow-hidden rounded-xl border p-4 text-left transition-all ${
                questionType === t.value
                  ? "border-accent-primary/50 bg-accent-primary/[0.08]"
                  : "border-border-primary bg-bg-card hover:border-accent-primary/20 hover:bg-bg-elevated"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  questionType === t.value ? "bg-accent-primary/15 text-accent-secondary" : "bg-bg-elevated text-text-dim group-hover:text-text-secondary"
                }`}>
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{t.label}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">{t.desc}</p>
                </div>
                {questionType === t.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-primary"
                  >
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => fetchQuestions(questionType)}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          Start Exercises
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-5 py-24">
        <div className="relative">
          <div className="loading-spinner h-8 w-8" />
          <div className="absolute inset-0 rounded-full bg-accent-primary/10 animate-ping" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">Generating exercises</p>
          <p className="mt-1 text-xs text-text-dim">Preparing practice problems for {subject}...</p>
        </div>
      </div>
    );
  }

  if (result) {
    const levelUp = result.new_level === "Advanced" || (result.new_level === "Intermediate" && level === "Beginner");
    const modeInfo = ADAPTIVE_MODE_LABELS[result.adaptive_mode] ?? ADAPTIVE_MODE_LABELS.standard;
    const stressMessage = result.stress_detected && result.recommended_action
      ? STRESS_ACTION_MESSAGES[result.recommended_action] ?? "Performance instability detected. Consider reviewing the material."
      : null;

    return (
      <div className="mx-auto max-w-2xl">
        {/* Result header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 shadow-glow-sm">
            {result.accuracy >= 70 ? (
              <svg className="h-7 w-7 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            ) : (
              <svg className="h-7 w-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
            )}
          </div>
          <h2 className="mb-1 text-xl sm:text-2xl font-bold text-text-primary">Exercise Results</h2>
          <p className="text-sm text-text-secondary">
            {result.level_changed
              ? `Your level has been ${levelUp ? "raised" : "adjusted"} to ${result.new_level}`
              : `Holding steady at ${result.new_level}`}
          </p>
        </motion.div>

        {/* Stress alert — non-intrusive banner */}
        {stressMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-400/8 px-4 py-3"
          >
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-xs text-amber-400">{stressMessage}</p>
          </motion.div>
        )}

        {/* Adaptive mode badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4 flex items-center gap-2"
        >
          <span className="text-xs text-text-muted">Adaptive mode:</span>
          <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-medium ${modeInfo.color}`}>
            {modeInfo.label}
          </span>
          {result.avg_response_time > 0 && (
            <span className="ml-auto text-xs text-text-muted">
              Avg {result.avg_response_time}s / question
            </span>
          )}
        </motion.div>

        {/* Score card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 overflow-hidden rounded-xl border border-border-primary bg-bg-card"
        >
          <div className="h-px bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />
          <div className="p-6">
            <div className="mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-text-primary">{result.accuracy}%</p>
                  <p className="text-[10px] uppercase tracking-widest text-text-dim">Accuracy</p>
                </div>
                <div className="h-10 w-px bg-border-primary" />
                <div className="flex gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold text-status-success">{result.correct}</p>
                    <p className="text-[10px] uppercase tracking-wider text-text-dim">Correct</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-text-secondary">{result.total}</p>
                    <p className="text-[10px] uppercase tracking-wider text-text-dim">Total</p>
                  </div>
                </div>
              </div>
              <DifficultyBadge level={result.new_level} size="md" />
            </div>

            <ProgressBar value={result.accuracy} label="Score" size="lg" showGlow />

            <div className="mt-4">
              <ProgressBar value={result.mastery} label="Mastery" />
            </div>

            {/* Cognitive strain index */}
            <div className="mt-4">
              <ProgressBar
                value={result.cognitive_strain_index}
                label={`Cognitive Strain Index`}
              />
            </div>

            {result.level_changed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ delay: 0.4 }}
                className="mt-4 flex items-center gap-2 rounded-lg border border-accent-primary/20 bg-accent-primary/[0.05] px-4 py-2.5"
              >
                <svg className="h-4 w-4 text-accent-secondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {levelUp ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                  )}
                </svg>
                <p className="text-xs text-accent-secondary">
                  Difficulty {levelUp ? "increased" : "decreased"} based on your performance
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Answer review */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <svg className="h-4 w-4 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Answer Review
          </h3>
          <div className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <QuestionCard
                key={i}
                index={i}
                question={q.question}
                questionType={q.type || questionType}
                options={q.options}
                expectedPoints={q.expected_points}
                userAnswer={answers[i]}
                onChange={() => {}}
                disabled
                correctAnswer={String(q.answer ?? "")}
                showResult
              />
            ))}
          </div>
        </motion.div>

        <div className="mt-8 flex justify-center">
          <button onClick={() => onComplete(result.new_level)} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
            View Progress
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  const filledCount = answers.filter((a) => a.trim().length > 0).length;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-primary/10 shadow-glow-sm">
            <svg className="h-4.5 w-4.5 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Practice Exercises</h2>
            <p className="text-xs text-text-secondary">Test your understanding of the lesson</p>
          </div>
        </div>
        <DifficultyBadge level={level} size="md" />
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-status-error/20 bg-status-error/[0.06] px-4 py-2.5">
          <svg className="h-4 w-4 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-status-error">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <ProgressBar value={(filledCount / questions.length) * 100} label={`${filledCount} of ${questions.length} answered`} size="sm" />
      </div>

      <div className="flex flex-col gap-3">
        {questions.map((q, i) => (
          <QuestionCard
            key={i}
            index={i}
            question={q.question}
            questionType={q.type || questionType}
            options={q.options}
            expectedPoints={q.expected_points}
            userAnswer={answers[i]}
            onChange={(val) => handleAnswerChange(i, val)}
          />
        ))}
      </div>

      <div className="mt-8 sticky bottom-20 lg:bottom-0 z-30 bg-bg-primary/80 backdrop-blur-sm py-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent sm:backdrop-blur-none">
        <button
          onClick={handleSubmit}
          disabled={submitting || filledCount === 0}
          className="btn-primary w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="loading-spinner" />
              Evaluating...
            </>
          ) : (
            <>
              Submit Answers
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
