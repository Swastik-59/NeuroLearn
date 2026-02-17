"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  uploadMaterial,
  generateFromMaterial,
  type MaterialUploadResponse,
  type Question,
  type QuestionType,
} from "../lib/api";
import QuestionCard from "@/components/QuestionCard";
import { staggerContainer, fadeInUp } from "@/lib/animations";

const SUBJECTS = [
  "Data Structures & Algorithms", "Machine Learning", "Operating Systems",
  "Database Management", "Computer Networks", "Object Oriented Programming",
  "Web Development", "Discrete Mathematics", "Computer Architecture",
  "Cyber Security", "Cloud Computing", "Artificial Intelligence",
];

interface MaterialUploadProps {
  sessionId?: string;
  subject?: string;
  onMaterialReady?: () => void;
  onBack: () => void;
}

export default function MaterialUpload({
  sessionId: propSessionId,
  subject: propSubject,
  onMaterialReady,
  onBack,
}: MaterialUploadProps) {
  // Generate a stable standalone ID when no session exists
  const standaloneId = useMemo(() => `standalone-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, []);
  const effectiveSessionId = propSessionId || standaloneId;
  const standalone = !propSessionId;

  const [selectedSubject, setSelectedSubject] = useState(propSubject || "");
  const effectiveSubject = propSubject || selectedSubject;
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<MaterialUploadResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<"lesson" | "exercise">("lesson");
  const [questionType, setQuestionType] = useState<QuestionType>("short");
  const [lessonText, setLessonText] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "pptx") {
      setError("Only PDF and PPTX files are supported");
      return;
    }
    setError("");
    setFile(f);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = await uploadMaterial(effectiveSessionId, file);
      setUploadResult(res);
      onMaterialReady?.();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Upload failed");
    }
    setUploading(false);
  };

  const generate = async () => {
    setGenerating(true);
    setError("");
    setShowAnswers(false);
    try {
      const res = await generateFromMaterial(
        effectiveSessionId,
        mode,
        questionType,
        standalone ? effectiveSubject || undefined : undefined,
        undefined,
      );
      if (mode === "lesson" && "lesson" in res) {
        setLessonText((res as any).lesson);
        setQuestions([]);
        setAnswers([]);
      } else if ("questions" in res) {
        const qs = (res as any).questions as Question[];
        setQuestions(qs);
        setAnswers(new Array(qs.length).fill(""));
        setLessonText("");
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Generation failed");
    }
    setGenerating(false);
  };

  // Reusable markdown-like renderer (same logic as lesson.tsx)
  const renderLesson = (text: string) =>
    text.split("\n").map((line, i) => {
      if (line.startsWith("###")) {
        return (
          <h3 key={i} className="mt-5 mb-2 flex items-center gap-2 text-base font-semibold text-text-primary">
            <span className="inline-block h-1 w-1 rounded-full bg-accent-secondary" />
            {line.replace(/^###\s*/, "")}
          </h3>
        );
      }
      if (line.startsWith("##")) {
        return (
          <h2 key={i} className="mt-6 mb-2 border-b border-border-primary/40 pb-2 text-lg font-bold text-text-primary">
            {line.replace(/^##\s*/, "")}
          </h2>
        );
      }
      if (line.startsWith("#")) {
        return (
          <h1 key={i} className="mt-6 mb-3 text-xl font-bold gradient-text">
            {line.replace(/^#\s*/, "")}
          </h1>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={i} className="ml-4 text-text-secondary list-none flex items-start gap-2 mb-1">
            <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-primary/60" />
            <span>{line.replace(/^[-*]\s*/, "")}</span>
          </li>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-3" />;
      let formatted = line.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="text-text-primary font-semibold">$1</strong>'
      );
      formatted = formatted.replace(
        /`(.*?)`/g,
        '<code class="rounded bg-white/[0.04] px-1.5 py-0.5 text-xs font-mono text-accent-secondary">$1</code>'
      );
      return (
        <p
          key={i}
          className="mb-1.5 text-sm leading-relaxed text-text-secondary"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });

  const filledCount = answers.filter((a) => a.trim().length > 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 shadow-glow-sm">
          <svg className="h-7 w-7 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Upload Study Material</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Upload a <span className="font-medium text-accent-secondary">PDF</span> or{" "}
          <span className="font-medium text-accent-secondary">PPTX</span> file to generate lessons and exercises from your own material
        </p>
      </div>

      {/* Subject selector — standalone mode */}
      {standalone && !uploadResult && (
        <div className="overflow-hidden rounded-xl border border-border-primary bg-bg-card">
          <div className="h-px bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent" />
          <div className="p-5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-text-dim">Subject (optional — helps generate better content)</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full rounded-lg border border-border-primary bg-bg-input px-4 py-2.5 text-sm text-text-primary focus:border-accent-primary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/10 transition-all appearance-none"
              >
                <option value="">Any subject</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg border border-status-error/20 bg-status-error/[0.06] px-4 py-2.5"
        >
          <svg className="h-4 w-4 shrink-0 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-status-error">{error}</p>
        </motion.div>
      )}

      {/* Upload zone */}
      {!uploadResult && (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed p-8 sm:p-12 transition-all duration-300 ${
              dragOver
                ? "border-accent-primary bg-accent-primary/[0.06] shadow-glow-sm animate-pulse-border"
                : file
                ? "border-accent-primary/40 bg-accent-primary/[0.03]"
                : "border-border-secondary bg-bg-card hover:border-accent-primary/30 hover:bg-bg-elevated"
            }`}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.pptx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="flex flex-col items-center gap-4">
              {file ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-primary/15">
                    <svg className="h-6 w-6 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-text-primary">{file.name}</p>
                    <p className="mt-0.5 text-xs text-text-dim">
                      {(file.size / 1024).toFixed(1)} KB &middot;{" "}
                      {file.name.endsWith(".pdf") ? "PDF Document" : "PowerPoint Presentation"}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-xs text-text-dim hover:text-status-error transition-colors"
                  >
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
                    dragOver ? "bg-accent-primary/20" : "bg-bg-elevated"
                  }`}>
                    <svg className="h-7 w-7 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-text-secondary">
                      <span className="font-medium text-accent-secondary">Click to browse</span> or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-text-dim">PDF or PPTX files up to 10 MB</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="rounded-md bg-bg-elevated px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-text-dim">.pdf</span>
                    <span className="rounded-md bg-bg-elevated px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-text-dim">.pptx</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={onBack} className="btn-secondary flex-1">
              Back
            </button>
            <button onClick={upload} disabled={uploading || !file} className="btn-primary flex-1">
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="loading-spinner" />
                  Processing...
                </span>
              ) : (
                <>
                  <svg className="mr-2 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Upload & Process
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* After upload - success banner + generation controls */}
      {uploadResult && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Success banner */}
            <div className="overflow-hidden rounded-xl border border-status-success/20 bg-bg-card">
              <div className="h-px bg-gradient-to-r from-transparent via-status-success/40 to-transparent" />
              <div className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-status-success/10">
                  <svg className="h-5 w-5 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{uploadResult.filename}</p>
                  <p className="text-xs text-text-secondary">
                    {uploadResult.chunks} text chunks extracted and indexed for RAG
                  </p>
                </div>
                <span className="rounded-md bg-status-success/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-status-success">
                  Ready
                </span>
              </div>
            </div>

            {/* Generation controls */}
            <div className="overflow-hidden rounded-xl border border-border-primary bg-bg-card">
              <div className="h-px bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent" />
              <div className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-text-primary">Generate from Material</h3>

                {/* Mode toggle */}
                <div className="flex gap-2">
                  {(["lesson", "exercise"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all ${
                        mode === m
                          ? "border-accent-primary/50 bg-accent-primary/10 text-accent-secondary"
                          : "border-border-primary bg-bg-elevated text-text-secondary hover:border-accent-primary/30"
                      }`}
                    >
                      {m === "lesson" ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                        </svg>
                      )}
                      {m === "lesson" ? "Lesson" : "Exercise"}
                    </button>
                  ))}
                </div>

                {/* Question type selector (exercise mode) */}
                {mode === "exercise" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="mb-1.5 block text-xs font-medium text-text-dim">Question Type</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {([
                        { v: "short" as QuestionType, l: "Short" },
                        { v: "mcq" as QuestionType, l: "MCQ" },
                        { v: "true_false" as QuestionType, l: "T/F" },
                        { v: "qa" as QuestionType, l: "Open" },
                        { v: "mixed" as QuestionType, l: "Mixed" },
                      ]).map((t) => (
                        <button
                          key={t.v}
                          onClick={() => setQuestionType(t.v)}
                          className={`rounded-lg border py-1.5 text-xs font-medium transition-all ${
                            questionType === t.v
                              ? "border-accent-primary/50 bg-accent-primary/10 text-accent-secondary"
                              : "border-border-primary text-text-dim hover:text-text-secondary hover:border-border-secondary"
                          }`}
                        >
                          {t.l}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                <button onClick={generate} disabled={generating} className="btn-primary w-full">
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="loading-spinner" />
                      Generating {mode === "lesson" ? "lesson" : "questions"}...
                    </span>
                  ) : (
                    <>
                      Generate {mode === "lesson" ? "Lesson" : "Questions"}
                      <svg className="ml-2 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Lesson output - proper markdown rendering */}
            {lessonText && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-xl border border-border-primary bg-bg-card"
              >
                <div className="h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent" />
                <div className="flex items-center justify-between border-b border-border-primary/50 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    <span className="text-xs font-medium text-text-primary">Generated Lesson</span>
                  </div>
                  <span className="rounded bg-accent-primary/10 px-2 py-0.5 text-[10px] text-accent-secondary">
                    From uploaded material
                  </span>
                </div>
                <div className="max-h-[500px] overflow-y-auto p-6 sm:p-8">
                  <div className="prose prose-invert prose-sm max-w-none">
                    {renderLesson(lessonText)}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Questions output - interactive QuestionCard */}
            {questions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <svg className="h-4 w-4 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                    Generated Questions ({questions.length})
                  </h3>
                  {!showAnswers && filledCount > 0 && (
                    <button
                      onClick={() => setShowAnswers(true)}
                      className="text-xs font-medium text-accent-secondary hover:text-accent-primary transition-colors"
                    >
                      Check Answers
                    </button>
                  )}
                  {showAnswers && (
                    <span className="rounded bg-status-success/10 px-2 py-0.5 text-[10px] font-medium text-status-success">
                      Answers revealed
                    </span>
                  )}
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-3"
                >
                  {questions.map((q, i) => (
                    <motion.div key={i} variants={fadeInUp} custom={i}>
                      <QuestionCard
                        index={i}
                        question={q.question}
                        questionType={q.type || questionType}
                        options={q.options}
                        expectedPoints={q.expected_points}
                        userAnswer={answers[i]}
                        onChange={(val) => {
                          const updated = [...answers];
                          updated[i] = val;
                          setAnswers(updated);
                        }}
                        disabled={showAnswers}
                        correctAnswer={showAnswers ? String(q.answer ?? "") : undefined}
                        showResult={showAnswers}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {showAnswers && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => {
                      setShowAnswers(false);
                      setQuestions([]);
                      setAnswers([]);
                    }}
                    className="btn-secondary w-full text-sm"
                  >
                    Generate New Questions
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Back button */}
            <button onClick={onBack} className="btn-secondary w-full flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Dashboard
            </button>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
