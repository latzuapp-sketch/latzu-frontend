"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AdaptiveCard } from "./AdaptiveCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { WidgetConfig } from "@/config/templates";
import { useTasks, isSameDay } from "@/hooks/usePlanning";
import { usePlans } from "@/hooks/usePlans";
import {
  BookOpen,
  Target,
  Flame,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Bell,
  Zap,
  Award,
  ClipboardList,
  Circle,
  PlayCircle,
  Loader2,
  Plus,
  Sparkles,
} from "lucide-react";
import { useUserStats } from "@/hooks/useRecommendations";
import Link from "next/link";

interface WidgetRendererProps {
  widgets: WidgetConfig[];
}

export function WidgetRenderer({ widgets: rawWidgets }: WidgetRendererProps) {
  const sorted = useMemo(
    () => [...rawWidgets].sort((a, b) => a.priority - b.priority),
    [rawWidgets]
  );

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sorted.map((widget) => (
        <WidgetComponent key={widget.id} widget={widget} />
      ))}
    </div>
  );
}

function WidgetComponent({ widget }: { widget: WidgetConfig }) {
  switch (widget.type) {
    case "learning-path":
      return <LearningPathWidget widget={widget} />;
    case "daily-goals":
      return <DailyGoalsWidget widget={widget} />;
    case "streaks":
      return <StreaksWidget widget={widget} />;
    case "chat-preview":
      return <ChatPreviewWidget widget={widget} />;
    case "skills-radar":
      return <SkillsRadarWidget widget={widget} />;
    case "certifications":
      return <CertificationsWidget widget={widget} />;
    case "business-metrics":
      return <BusinessMetricsWidget widget={widget} />;
    case "tasks":
      return <TasksWidget widget={widget} />;
    case "automations":
      return <AutomationsWidget widget={widget} />;
    case "assigned-training":
      return <AssignedTrainingWidget widget={widget} />;
    case "team-progress":
      return <TeamProgressWidget widget={widget} />;
    case "announcements":
      return <AnnouncementsWidget widget={widget} />;
    case "plans-summary":
      return <PlansSummaryWidget widget={widget} />;
    default:
      return null;
  }
}

// ─── Real-data widgets ────────────────────────────────────────────────────────

/** Today's real tasks from Neo4j */
function DailyGoalsWidget({ widget }: { widget: WidgetConfig }) {
  const { tasks, loading, setStatus } = useTasks();

  const todayTasks = useMemo(() => {
    const today = new Date();
    return tasks
      .filter((t) => t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), today))
      .slice(0, 5);
  }, [tasks]);

  const done = todayTasks.filter((t) => t.status === "done").length;

  return (
    <AdaptiveCard
      title={widget.title}
      description={
        loading
          ? "Cargando..."
          : todayTasks.length === 0
          ? "Sin tareas para hoy"
          : `${done}/${todayTasks.length} completadas`
      }
      icon={<Target className="w-5 h-5 text-primary" />}
      size={widget.size}
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/planning">Ver todo</Link>
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : todayTasks.length === 0 ? (
        <div className="text-center py-4 space-y-2">
          <p className="text-xs text-muted-foreground">
            No tienes tareas programadas para hoy.
          </p>
          <Button size="sm" variant="outline" asChild className="gap-1.5">
            <Link href="/planning">
              <Plus className="w-3.5 h-3.5" />
              Añadir tarea
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {todayTasks.map((task) => (
            <button
              key={task.id}
              onClick={() =>
                setStatus(task.id, task.status === "done" ? "todo" : "done")
              }
              className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all ${
                task.status === "done" ? "bg-primary/10" : "bg-secondary/50 hover:bg-secondary"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  task.status === "done"
                    ? "bg-primary"
                    : "border-2 border-muted-foreground"
                }`}
              >
                {task.status === "done" && (
                  <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                )}
              </div>
              <span
                className={`text-sm flex-1 truncate ${
                  task.status === "done" ? "line-through text-muted-foreground" : ""
                }`}
              >
                {task.title}
              </span>
              {task.priority === "high" && task.status !== "done" && (
                <span className="text-[10px] text-red-400 shrink-0">Alta</span>
              )}
            </button>
          ))}
          {done === todayTasks.length && todayTasks.length > 0 && (
            <p className="text-xs text-center text-emerald-400 pt-1">
              ¡Todas las tareas completadas! 🎉
            </p>
          )}
        </div>
      )}
    </AdaptiveCard>
  );
}

/** Real tasks (high priority + todo) — for entrepreneur profile */
function TasksWidget({ widget }: { widget: WidgetConfig }) {
  const { tasks, loading, setStatus } = useTasks();

  const pendingTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "done")
        .sort((a, b) => {
          const p = { high: 0, medium: 1, low: 2 };
          return (p[a.priority] ?? 1) - (p[b.priority] ?? 1);
        })
        .slice(0, 4),
    [tasks]
  );

  return (
    <AdaptiveCard
      title={widget.title}
      icon={<CheckCircle2 className="w-5 h-5 text-primary" />}
      size={widget.size}
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/planning">Ver todo</Link>
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : pendingTasks.length === 0 ? (
        <div className="text-center py-4 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-xs text-muted-foreground">¡Sin tareas pendientes!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50"
            >
              <button
                onClick={() => setStatus(task.id, "done")}
                className="w-5 h-5 rounded-full border-2 border-muted-foreground hover:border-primary transition-colors shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                {task.dueDate && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(task.dueDate + "T00:00:00").toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                )}
              </div>
              {task.priority === "high" && (
                <Badge variant="destructive" className="text-[10px] px-1.5">
                  Alta
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </AdaptiveCard>
  );
}

/** Real plans summary */
function PlansSummaryWidget({ widget }: { widget: WidgetConfig }) {
  const { plans, loading } = usePlans();
  const { tasks } = useTasks();

  const activePlans = useMemo(
    () => plans.filter((p) => p.status === "active").slice(0, 3),
    [plans]
  );

  const planProgress = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    for (const t of tasks) {
      if (!t.planId) continue;
      if (!map[t.planId]) map[t.planId] = { total: 0, done: 0 };
      map[t.planId].total++;
      if (t.status === "done") map[t.planId].done++;
    }
    return map;
  }, [tasks]);

  return (
    <AdaptiveCard
      title={widget.title}
      description={
        loading
          ? "Cargando..."
          : activePlans.length === 0
          ? "Sin planes activos"
          : `${activePlans.length} activo${activePlans.length !== 1 ? "s" : ""}`
      }
      icon={<ClipboardList className="w-5 h-5 text-primary" />}
      size={widget.size}
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/plans">Ver todo</Link>
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : activePlans.length === 0 ? (
        <div className="text-center py-4 space-y-2">
          <p className="text-xs text-muted-foreground">
            Crea tu primer plan de acción o estudio.
          </p>
          <Button size="sm" variant="outline" asChild className="gap-1.5">
            <Link href="/plans">
              <Plus className="w-3.5 h-3.5" />
              Crear plan
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {activePlans.map((plan) => {
            const counts = planProgress[plan.id] ?? { total: 0, done: 0 };
            const pct =
              counts.total === 0
                ? 0
                : Math.round((counts.done / counts.total) * 100);
            return (
              <Link key={plan.id} href="/plans" className="block group">
                <div className="p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {plan.title}
                    </p>
                    <span
                      className={`text-[10px] shrink-0 px-1.5 py-0.5 rounded border ${
                        plan.type === "study"
                          ? "text-blue-400 border-blue-500/20 bg-blue-500/10"
                          : "text-amber-400 border-amber-500/20 bg-amber-500/10"
                      }`}
                    >
                      {plan.type === "study" ? "Estudio" : "Acción"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {counts.done}/{counts.total} tareas
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AdaptiveCard>
  );
}

// ─── Static / mock widgets ────────────────────────────────────────────────────

function LearningPathWidget({ widget }: { widget: WidgetConfig }) {
  const { plans, loading } = usePlans();
  const { tasks } = useTasks();

  const activePlan = useMemo(() => plans.find((p) => p.status === "active"), [plans]);

  const planTasks = useMemo(() => {
    if (!activePlan) return { total: 0, done: 0 };
    const pts = tasks.filter((t) => t.planId === activePlan.id);
    return { total: pts.length, done: pts.filter((t) => t.status === "done").length };
  }, [activePlan, tasks]);

  const pct = planTasks.total === 0 ? 0 : Math.round((planTasks.done / planTasks.total) * 100);

  const nextTask = useMemo(() => {
    if (!activePlan) return null;
    return tasks.find((t) => t.planId === activePlan.id && t.status !== "done") ?? null;
  }, [activePlan, tasks]);

  return (
    <AdaptiveCard
      title={widget.title}
      description={loading ? "Cargando..." : activePlan ? `${pct}% completado` : "Sin plan activo"}
      icon={<BookOpen className="w-5 h-5 text-primary" />}
      size={widget.size}
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/study">Ver todo</Link>
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : !activePlan ? (
        <div className="text-center py-4 space-y-2">
          <Sparkles className="w-8 h-8 mx-auto text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">Crea un plan de estudio desde el chat.</p>
          <Button size="sm" variant="outline" asChild className="gap-1.5">
            <Link href="/chat"><Sparkles className="w-3.5 h-3.5" />Crear plan</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="font-medium text-sm truncate">{activePlan.title}</p>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={pct} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{planTasks.done}/{planTasks.total} tareas</p>
          </div>
          {nextTask && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Circle className="w-3 h-3 mt-0.5 shrink-0" />
              <span className="line-clamp-2">Siguiente: {nextTask.title}</span>
            </div>
          )}
          <Button className="w-full gap-1.5" asChild>
            <Link href="/study">
              <BookOpen className="w-4 h-4" />
              Continuar aprendiendo
            </Link>
          </Button>
        </div>
      )}
    </AdaptiveCard>
  );
}

function StreaksWidget({ widget }: { widget: WidgetConfig }) {
  const { stats, loading } = useUserStats();
  const { tasks } = useTasks();

  const doneToday = useMemo(() => {
    const today = new Date();
    return tasks.filter(
      (t) => t.status === "done" && t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), today)
    ).length;
  }, [tasks]);

  // Derive a streak approximation from session count (real data)
  const sessionStreak = Math.min(stats.sessionCount, 30);
  const dots = Math.min(sessionStreak, 7);

  return (
    <AdaptiveCard
      title={widget.title}
      icon={<Flame className="w-5 h-5 text-orange-500" />}
      size={widget.size}
      variant="accent"
    >
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="text-center py-2 space-y-3">
          <div>
            <div className="text-4xl font-bold text-orange-500">{sessionStreak}</div>
            <p className="text-xs text-muted-foreground mt-1">sesiones de estudio</p>
          </div>
          <div className="flex justify-center gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                  i < dots ? "bg-orange-500/20" : "bg-muted/20"
                )}
              >
                <Flame className={cn("w-3.5 h-3.5", i < dots ? "text-orange-500" : "text-muted-foreground/20")} />
              </div>
            ))}
          </div>
          {doneToday > 0 && (
            <p className="text-xs text-emerald-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {doneToday} tarea{doneToday !== 1 ? "s" : ""} completada{doneToday !== 1 ? "s" : ""} hoy
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="rounded-lg bg-muted/20 p-2 text-center">
              <p className="text-sm font-semibold">{stats.messageCount}</p>
              <p className="text-[10px] text-muted-foreground">mensajes</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-2 text-center">
              <p className="text-sm font-semibold">{stats.ownedNodes}</p>
              <p className="text-[10px] text-muted-foreground">conceptos</p>
            </div>
          </div>
        </div>
      )}
    </AdaptiveCard>
  );
}

function ChatPreviewWidget({ widget }: { widget: WidgetConfig }) {
  return (
    <AdaptiveCard
      title={widget.title}
      description="Tu asistente está listo"
      icon={<MessageSquare className="w-5 h-5 text-primary" />}
      size={widget.size}
      variant="primary"
    >
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-primary/10 text-sm">
          <p className="italic">
            &quot;¿En qué te gustaría trabajar hoy? Puedo ayudarte a crear tareas,
            buscar información o generar un plan de acción.&quot;
          </p>
        </div>
        <Button className="w-full" asChild>
          <Link href="/chat">
            <MessageSquare className="w-4 h-4 mr-2" />
            Iniciar conversación
          </Link>
        </Button>
      </div>
    </AdaptiveCard>
  );
}

function SkillsRadarWidget({ widget }: { widget: WidgetConfig }) {
  const skills = [
    { name: "Python", level: 75 },
    { name: "Machine Learning", level: 45 },
    { name: "Data Analysis", level: 60 },
    { name: "Communication", level: 80 },
  ];

  return (
    <AdaptiveCard
      title={widget.title}
      icon={<TrendingUp className="w-5 h-5 text-primary" />}
      size={widget.size}
    >
      <div className="space-y-3">
        {skills.map((skill) => (
          <div key={skill.name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{skill.name}</span>
              <span className="text-muted-foreground">{skill.level}%</span>
            </div>
            <Progress value={skill.level} className="h-2" />
          </div>
        ))}
      </div>
    </AdaptiveCard>
  );
}

function CertificationsWidget({ widget }: { widget: WidgetConfig }) {
  return (
    <AdaptiveCard
      title={widget.title}
      icon={<Award className="w-5 h-5 text-primary" />}
      size={widget.size}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="font-medium text-sm">Data Science Fundamentals</p>
            <p className="text-xs text-muted-foreground">En progreso - 60%</p>
          </div>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/study">Ver certificaciones</Link>
        </Button>
      </div>
    </AdaptiveCard>
  );
}

function BusinessMetricsWidget({ widget }: { widget: WidgetConfig }) {
  const metrics = [
    { label: "Ingresos", value: "$12,450", change: "+12%" },
    { label: "Clientes", value: "142", change: "+8%" },
    { label: "Proyectos", value: "7", change: "+2" },
  ];

  return (
    <AdaptiveCard
      title={widget.title}
      icon={<BarChart3 className="w-5 h-5 text-primary" />}
      size={widget.size}
    >
      <div className="grid grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="text-center">
            <p className="text-2xl font-bold">{metric.value}</p>
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <Badge variant="secondary" className="mt-1 text-emerald-500">
              {metric.change}
            </Badge>
          </div>
        ))}
      </div>
    </AdaptiveCard>
  );
}

function AutomationsWidget({ widget }: { widget: WidgetConfig }) {
  return (
    <AdaptiveCard
      title={widget.title}
      icon={<Zap className="w-5 h-5 text-amber-500" />}
      size={widget.size}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
          <span className="text-sm">Email follow-up</span>
          <Badge variant="outline" className="text-emerald-500">Activo</Badge>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
          <span className="text-sm">Facturación mensual</span>
          <Badge variant="outline" className="text-emerald-500">Activo</Badge>
        </div>
        <Button variant="outline" className="w-full">
          Gestionar automatizaciones
        </Button>
      </div>
    </AdaptiveCard>
  );
}

function AssignedTrainingWidget({ widget }: { widget: WidgetConfig }) {
  return (
    <AdaptiveCard
      title={widget.title}
      description="Formación requerida por tu empresa"
      icon={<BookOpen className="w-5 h-5 text-primary" />}
      size={widget.size}
    >
      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">Fecha límite: 15 Dic</span>
          </div>
          <p className="text-sm">Seguridad de la información</p>
          <Progress value={30} className="h-2 mt-2" />
        </div>
        <Button className="w-full" asChild>
          <Link href="/study">Continuar formación</Link>
        </Button>
      </div>
    </AdaptiveCard>
  );
}

function TeamProgressWidget({ widget }: { widget: WidgetConfig }) {
  return (
    <AdaptiveCard
      title={widget.title}
      icon={<Users className="w-5 h-5 text-primary" />}
      size={widget.size}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-medium"
              >
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">+5 más</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progreso del equipo</span>
            <span>72%</span>
          </div>
          <Progress value={72} className="h-2" />
        </div>
      </div>
    </AdaptiveCard>
  );
}

function AnnouncementsWidget({ widget }: { widget: WidgetConfig }) {
  return (
    <AdaptiveCard
      title={widget.title}
      icon={<Bell className="w-5 h-5 text-primary" />}
      size={widget.size}
    >
      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-primary/10">
          <p className="font-medium text-sm">Nueva política de trabajo remoto</p>
          <p className="text-xs text-muted-foreground mt-1">
            Actualización importante sobre las políticas de la empresa
          </p>
        </div>
        <Button variant="ghost" size="sm" className="w-full">
          Ver todos los anuncios
        </Button>
      </div>
    </AdaptiveCard>
  );
}
