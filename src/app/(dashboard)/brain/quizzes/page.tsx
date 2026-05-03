"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { BrainQuizCard } from "@/components/brain/BrainItemCards";
import { UniversalViewer, type ViewerItem } from "@/components/brain/UniversalViewer";
import { useTasks } from "@/hooks/usePlanning";

/** Quizzes — quiz-typed PlanningTasks listed with completion + score. */
export default function BrainQuizzesPage() {
  const { tasks, loading } = useTasks();
  const [viewing, setViewing] = useState<ViewerItem | null>(null);

  const quizzes = useMemo(
    () => tasks.filter((t) => t.category === "quiz" || t.contentType === "quiz"),
    [tasks],
  );

  return (
    <BrainPageShell
      title="Quizzes"
      subtitle="Evaluaciones generadas por la IA, ligadas a tareas de tus planes"
      count={quizzes.length}
    >
      <AnimatePresence>
        {viewing && (
          <UniversalViewer item={viewing} onClose={() => setViewing(null)} />
        )}
      </AnimatePresence>

      {loading && quizzes.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-20 text-sm text-muted-foreground">
          Aún no hay quizzes. Se generan automáticamente cuando una tarea de tu plan necesita evaluación.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {quizzes.map((q) => (
            <BrainQuizCard key={q.id} task={q} onClick={() => setViewing({ kind: "quiz", task: q })} />
          ))}
        </div>
      )}
    </BrainPageShell>
  );
}
