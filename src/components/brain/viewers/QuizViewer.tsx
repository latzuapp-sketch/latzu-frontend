"use client";

/**
 * QuizViewer — opens a quiz task inside the brain's UniversalViewer.
 *
 * Fetches the generated quiz content via taskContent(taskId).
 * If content doesn't exist yet, offers to generate it.
 * Renders the question list with reveal-on-click answers.
 */

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client";
import { aiClient } from "@/lib/apollo";
import {
  ClipboardCheck, Loader2, ArrowRight, CheckCircle2, XCircle, Sparkles,
} from "lucide-react";
import {
  GET_TASK_CONTENT, GENERATE_TASK_CONTENT,
} from "@/graphql/ai/operations";
import type { PlanningTask } from "@/types/planning";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface TaskContent {
  taskId: string;
  contentType: string;
  content: string;       // JSON string with { questions: QuizQuestion[] }
  basedOnOutcome: string | null;
  generatedAt: string;
}

function parseQuestions(raw: string): QuizQuestion[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as QuizQuestion[];
    if (parsed?.questions && Array.isArray(parsed.questions)) {
      return parsed.questions as QuizQuestion[];
    }
    return [];
  } catch {
    return [];
  }
}

export function QuizViewer({ task }: { task: PlanningTask }) {
  const { data, loading } = useQuery<{ taskContent: TaskContent | null }>(GET_TASK_CONTENT, {
    client: aiClient,
    variables: { taskId: task.id },
    fetchPolicy: "cache-and-network",
  });
  const [generate, { loading: generating }] = useMutation<{ generateTaskContent: TaskContent }>(
    GENERATE_TASK_CONTENT,
    { client: aiClient },
  );

  const content = data?.taskContent;
  const questions = content ? parseQuestions(content.content) : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
          <ClipboardCheck className="w-5 h-5 text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Quiz</span>
          <h1 className="text-xl font-heading font-bold leading-tight mt-0.5">{task.title}</h1>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
          )}
          {content?.basedOnOutcome && (
            <p className="text-[11px] text-violet-300/80 mt-2 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Adaptado a tu desempeño previo
            </p>
          )}
        </div>
      </div>

      {/* Loading initial */}
      {loading && !content && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* No content yet */}
      {!loading && !content && (
        <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 text-center space-y-3">
          <ClipboardCheck className="w-8 h-8 mx-auto text-amber-300/50" />
          <p className="text-sm font-medium">Este quiz todavía no fue generado.</p>
          <button
            onClick={() => generate({ variables: { taskId: task.id, forceRegenerate: false } })}
            disabled={generating}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors",
              generating
                ? "bg-muted/30 text-muted-foreground/50 cursor-wait"
                : "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25",
            )}
          >
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Generar con IA
          </button>
        </div>
      )}

      {/* Questions */}
      {questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <QuestionCard key={i} index={i} question={q} />
          ))}
        </div>
      )}

      {/* Open in planning fallback */}
      <Link
        href="/planning"
        className="flex items-center justify-between rounded-lg border border-border/40 bg-card/30 hover:bg-card/50 p-3 transition-colors text-xs"
      >
        <span className="text-muted-foreground">Abrir tarea en /planning</span>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
      </Link>
    </div>
  );
}

function QuestionCard({ index, question }: { index: number; question: QuizQuestion }) {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = question.correctIndex;
  const revealed = picked !== null;

  return (
    <div className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 shrink-0 mt-0.5">
          P{index + 1}
        </span>
        <p className="text-sm font-semibold leading-snug">{question.question}</p>
      </div>
      <div className="space-y-1.5">
        {question.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === correct;
          return (
            <button
              key={i}
              onClick={() => picked === null && setPicked(i)}
              disabled={picked !== null}
              className={cn(
                "w-full text-left text-sm px-3 py-2 rounded-md border transition-colors flex items-start gap-2",
                !revealed && "border-border/40 bg-card/40 hover:bg-card/70",
                revealed && isCorrect && "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
                revealed && isPicked && !isCorrect && "border-rose-500/40 bg-rose-500/10 text-rose-200",
                revealed && !isPicked && !isCorrect && "border-border/30 bg-card/20 text-muted-foreground/70",
              )}
            >
              {revealed && isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0 mt-0.5" />}
              {revealed && isPicked && !isCorrect && <XCircle className="w-3.5 h-3.5 text-rose-300 shrink-0 mt-0.5" />}
              <span className="leading-snug">{opt}</span>
            </button>
          );
        })}
      </div>
      {revealed && question.explanation && (
        <div className="text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-2">
          <span className="font-semibold text-foreground/80">Por qué: </span>
          {question.explanation}
        </div>
      )}
    </div>
  );
}
