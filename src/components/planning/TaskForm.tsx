"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CreateTaskInput, TaskCategory, TaskPriority } from "@/types/planning";
import { X, Plus, ArrowUpCircle, BookOpen, Bell } from "lucide-react";

interface TaskFormProps {
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  onClose: () => void;
  defaultDate?: string; // YYYY-MM-DD
}

const categoryOptions: { value: TaskCategory; label: string; Icon: typeof Plus }[] = [
  { value: "task", label: "Tarea", Icon: ArrowUpCircle },
  { value: "lesson", label: "Lección", Icon: BookOpen },
  { value: "reminder", label: "Recordatorio", Icon: Bell },
];

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Baja", color: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
  { value: "medium", label: "Media", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { value: "high", label: "Alta", color: "text-red-400 border-red-500/30 bg-red-500/10" },
];

export function TaskForm({ onSubmit, onClose, defaultDate }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(defaultDate ?? "");
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState<TaskCategory>("task");
  const [submitting, setSubmitting] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      priority,
      category,
      status: "todo",
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-xl border border-primary/30 bg-card/90 p-4 space-y-3 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Nueva tarea</p>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Title */}
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nombre de la tarea…"
          className="text-sm h-9"
        />

        {/* Date + time row */}
        <div className="flex gap-2">
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="text-sm h-8 flex-1"
          />
          <Input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="text-sm h-8 w-24"
          />
        </div>

        {/* Priority */}
        <div className="flex gap-1.5">
          {priorityOptions.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={cn(
                "flex-1 py-1 rounded-lg text-xs font-medium border transition-all",
                priority === p.value
                  ? p.color
                  : "border-border/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Category */}
        <div className="flex gap-1.5">
          {categoryOptions.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs border flex items-center justify-center gap-1.5 transition-all",
                category === value
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Description toggle */}
        <button
          type="button"
          onClick={() => setShowExtra((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showExtra ? "− Ocultar descripción" : "+ Añadir descripción"}
        </button>

        <AnimatePresence>
          {showExtra && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción opcional…"
                className="text-xs min-h-[70px] resize-none"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          disabled={!title.trim() || submitting}
          className="w-full gap-1.5 h-8 text-sm"
        >
          <Plus className="w-4 h-4" />
          {submitting ? "Guardando…" : "Crear tarea"}
        </Button>
      </form>
    </motion.div>
  );
}
