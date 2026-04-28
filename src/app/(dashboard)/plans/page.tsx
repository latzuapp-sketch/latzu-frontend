"use client";

import { useState, useMemo, useCallback, useDeferredValue } from "react";
import { useMutation } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { usePlans } from "@/hooks/usePlans";
import { useTasks } from "@/hooks/usePlanning";
import { aiClient } from "@/lib/apollo";
import { SEND_MESSAGE } from "@/graphql/ai/operations";
import type { ActionPlan, CreatePlanInput, PlanStatus, PlanType } from "@/types/planning";
import {
  Plus, ClipboardList, Target, BookOpen, Zap,
  CheckCircle2, PauseCircle, PlayCircle, X, Loader2, Sparkles,
  CalendarDays, Search, ChevronDown, Circle,
  ArrowUpDown, TrendingUp, Clock, Maximize2,
} from "lucide-react";
import { CreatePlanModal } from "@/components/planning/CreatePlanModal";

// ─── Meta ─────────────────────────────────────────────────────────────────────

const TYPE_META: Record<PlanType, { label: string; color: string; bg: string; Icon: typeof Circle }> = {
  study:  { label: "Estudio", color: "text-blue-400",  bg: "bg-blue-500/10 border-blue-500/20",  Icon: BookOpen },
  action: { label: "Acción",  color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", Icon: Zap },
};

const STATUS_META: Record<PlanStatus, { label: string; Icon: typeof Circle; color: string; dot: string }> = {
  active:    { label: "Activo",     Icon: PlayCircle,   color: "text-emerald-400", dot: "bg-emerald-400" },
  completed: { label: "Completado", Icon: CheckCircle2, color: "text-blue-400",    dot: "bg-blue-400" },
  paused:    { label: "Pausado",    Icon: PauseCircle,  color: "text-muted-foreground", dot: "bg-muted-foreground" },
};

type SortKey = "recent" | "dueDate" | "progress";
const SORT_LABELS: Record<SortKey, string> = {
  recent:   "Más recientes",
  dueDate:  "Fecha límite",
  progress: "Progreso",
};

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan, taskCount, doneCount, onClick,
}: {
  plan: ActionPlan; taskCount: number; doneCount: number; onClick: () => void;
}) {
  const pct = taskCount === 0 ? 0 : Math.round((doneCount / taskCount) * 100);
  const { label: typeLabel, bg: typeBg, color: typeColor, Icon: TypeIcon } = TYPE_META[plan.type];
  const { dot: statusDot, label: statusLabel } = STATUS_META[plan.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
    >
      <Card
        onClick={onClick}
        className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group relative"
      >
        <CardContent className="p-4 space-y-3">
          {/* Open-page icon — top right, appears on hover */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-primary transition-colors" />
          </div>

          {/* Type + status */}
          <div className="flex items-center gap-2 pr-6">
            <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border", typeBg, typeColor)}>
              <TypeIcon className="w-2.5 h-2.5" />
              {typeLabel}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className={cn("w-1.5 h-1.5 rounded-full", statusDot)} />
              {statusLabel}
            </span>
            {plan.aiGenerated && (
              <span className="flex items-center gap-0.5 text-[10px] text-violet-400 ml-auto">
                <Sparkles className="w-2.5 h-2.5" />
                IA
              </span>
            )}
          </div>

          {/* Title */}
          <p className="font-semibold text-sm leading-snug line-clamp-2">{plan.title}</p>

          {/* Goal */}
          {plan.goal && (
            <p className="text-xs text-muted-foreground line-clamp-2 flex items-start gap-1.5">
              <Target className="w-3 h-3 mt-0.5 shrink-0 text-primary/50" />
              {plan.goal}
            </p>
          )}

          {/* Progress */}
          {taskCount > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{doneCount}/{taskCount} tareas</span>
                <span className={cn(pct === 100 && "text-emerald-400 font-medium")}>{pct}%</span>
              </div>
              <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Due date */}
          {plan.dueDate && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
              <CalendarDays className="w-3 h-3" />
              Vence {new Date(plan.dueDate + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Stats strip ──────────────────────────────────────────────────────────────

function StatsStrip({ plans }: { plans: ActionPlan[] }) {
  const active    = plans.filter(p => p.status === "active").length;
  const completed = plans.filter(p => p.status === "completed").length;
  const study     = plans.filter(p => p.type === "study").length;
  const action    = plans.filter(p => p.type === "action").length;

  const items = [
    { label: "Total",       value: plans.length,   icon: <ClipboardList className="w-3.5 h-3.5 text-primary" /> },
    { label: "Activos",     value: active,          icon: <PlayCircle className="w-3.5 h-3.5 text-emerald-400" /> },
    { label: "Completados", value: completed,       icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> },
    { label: "Estudio",     value: study,           icon: <BookOpen className="w-3.5 h-3.5 text-blue-400" /> },
    { label: "Acción",      value: action,          icon: <Zap className="w-3.5 h-3.5 text-amber-400" /> },
  ];

  return (
    <div className="flex gap-3 flex-wrap">
      {items.map(({ label, value, icon }) => (
        <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/30">
          {icon}
          <span className="text-xs font-semibold tabular-nums">{value}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const router = useRouter();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rawSearch, setRawSearch]             = useState("");
  const [statusFilter, setStatusFilter]       = useState<PlanStatus | "all">("all");
  const [typeFilter, setTypeFilter]           = useState<PlanType | "all">("all");
  const [sort, setSort]                       = useState<SortKey>("recent");
  const [generatingAI, setGeneratingAI]       = useState(false);

  const search = useDeferredValue(rawSearch);

  const { plans, loading, createPlan } = usePlans();
  const { tasks }                       = useTasks();
  const [sendMessage]                   = useMutation(SEND_MESSAGE, { client: aiClient });

  // Task counts per plan
  const planCounts = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    for (const t of tasks) {
      if (!t.planId) continue;
      if (!map[t.planId]) map[t.planId] = { total: 0, done: 0 };
      map[t.planId].total++;
      if (t.status === "done") map[t.planId].done++;
    }
    return map;
  }, [tasks]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = plans;
    if (rawSearch) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.goal.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "all") list = list.filter(p => p.status === statusFilter);
    if (typeFilter !== "all")   list = list.filter(p => p.type === typeFilter);

    return [...list].sort((a, b) => {
      if (sort === "dueDate") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sort === "progress") {
        const ap = planCounts[a.id] ?? { total: 0, done: 0 };
        const bp = planCounts[b.id] ?? { total: 0, done: 0 };
        const aPct = ap.total ? ap.done / ap.total : 0;
        const bPct = bp.total ? bp.done / bp.total : 0;
        return bPct - aPct;
      }
      // recent: newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [plans, search, rawSearch, statusFilter, typeFilter, sort, planCounts]);

  const hasFilters = rawSearch !== "" || statusFilter !== "all" || typeFilter !== "all";

  // Create plan + optional AI tasks
  const handleCreate = useCallback(async (input: CreatePlanInput): Promise<ActionPlan | null> => {
    const plan = await createPlan(input);
    if (!plan) return null;
    if (input.generateWithAI) {
      setGeneratingAI(true);
      try {
        const phasesContext = input.phases && input.phases.length > 0
          ? `\nFases del plan:\n${input.phases.map((p, i) => `${i + 1}. ${p.title}${p.topics?.length ? `: ${p.topics.join(", ")}` : ""}`).join("\n")}`
          : "";
        const prompt =
          `Crea tareas concretas para este plan ${input.type === "study" ? "de estudio" : "de acción"}:\n\n` +
          `Título: ${input.title}\nMeta: ${input.goal}${phasesContext}\n\n` +
          `Usa create_multiple_tasks para crear entre 5 y 10 tareas ordenadas y priorizadas. ` +
          `Incluye plan_id="${plan.id}" en cada tarea. Asigna phaseIndex según la fase (0 = primera fase). No respondas con texto.`;
        await sendMessage({ variables: { input: { message: prompt, useRag: false } } });
      } catch { /* silent */ } finally { setGeneratingAI(false); }
    }
    router.push(`/plans/${plan.id}`);
    return plan;
  }, [createPlan, sendMessage, router]);

  const STATUS_PILLS: { id: PlanStatus | "all"; label: string }[] = [
    { id: "all",       label: "Todos" },
    { id: "active",    label: "Activos" },
    { id: "paused",    label: "Pausados" },
    { id: "completed", label: "Completados" },
  ];

  const TYPE_PILLS: { id: PlanType | "all"; label: string }[] = [
    { id: "all",    label: "Todos los tipos" },
    { id: "study",  label: "Estudio" },
    { id: "action", label: "Acción" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mx-6 -mb-6 overflow-hidden">
      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-4 border-b border-border/40 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Planes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {loading ? "Cargando…" : `${plans.length} plan${plans.length !== 1 ? "es" : ""}`}
            </p>
          </div>
          <Button size="sm" onClick={() => setShowCreateModal(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Nuevo plan
          </Button>
        </div>

        {/* Stats */}
        {plans.length > 0 && <StatsStrip plans={plans} />}

        {/* Search + sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              placeholder="Buscar por título, meta o contenido…"
              className="pl-9 h-9 text-sm"
            />
            {rawSearch && (
              <button onClick={() => setRawSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 shrink-0 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5" />
                {SORT_LABELS[sort]}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSort("recent")}    className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Más recientes</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort("dueDate")}   className="flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5" /> Fecha límite</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort("progress")}  className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> Progreso</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_PILLS.map(({ id, label }) => (
            <button key={id} onClick={() => setStatusFilter(id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                statusFilter === id ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {id !== "all" && <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5 -translate-y-px", STATUS_META[id as PlanStatus]?.dot)} />}
              {label}
            </button>
          ))}

          <div className="w-px h-4 bg-border/50 mx-1" />

          {TYPE_PILLS.map(({ id, label }) => (
            <button key={id} onClick={() => setTypeFilter(id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                typeFilter === id
                  ? id === "study"  ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                  : id === "action" ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-primary text-primary-foreground border-primary"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {id === "study"  && <BookOpen className="w-2.5 h-2.5 inline mr-1" />}
              {id === "action" && <Zap      className="w-2.5 h-2.5 inline mr-1" />}
              {label}
            </button>
          ))}

          {hasFilters && (
            <button
              onClick={() => { setRawSearch(""); setStatusFilter("all"); setTypeFilter("all"); }}
              className="px-2 py-1 rounded-full text-xs text-muted-foreground hover:text-destructive border border-border/40 hover:border-destructive/40 transition-all flex items-center gap-1 ml-1"
            >
              <X className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-64 text-center space-y-3"
          >
            <ClipboardList className="w-12 h-12 text-muted-foreground/20" />
            <div>
              <p className="font-semibold text-sm">{hasFilters ? "Sin resultados" : "Sin planes aún"}</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {hasFilters ? "Prueba ajustando los filtros o la búsqueda." : "Crea tu primer plan y organiza tus objetivos."}
              </p>
            </div>
            {!hasFilters && (
              <Button size="sm" variant="outline" onClick={() => setShowCreateModal(true)} className="gap-1.5">
                <Plus className="w-4 h-4" /> Crear plan
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <AnimatePresence>
              {filtered.map(plan => {
                const counts = planCounts[plan.id] ?? { total: 0, done: 0 };
                return (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    taskCount={counts.total}
                    doneCount={counts.done}
                    onClick={() => router.push(`/plans/${plan.id}`)}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <CreatePlanModal onClose={() => setShowCreateModal(false)} onCreate={handleCreate} />
        )}
      </AnimatePresence>

      {generatingAI && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-violet-500/30 shadow-lg text-sm text-violet-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Generando tareas con IA…
        </div>
      )}
    </div>
  );
}
