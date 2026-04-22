"use client";

import { useState, useCallback, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TaskCard } from "@/components/planning/TaskCard";
import { TaskForm } from "@/components/planning/TaskForm";
import { WeekView, TodayStrip } from "@/components/planning/WeekView";
import {
  useTasks,
  useCalendarEvents,
  useWeekNavigation,
  toDateString,
  isSameDay,
} from "@/hooks/usePlanning";
import type { CreateTaskInput, PlanningTask, TaskStatus } from "@/types/planning";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ListTodo,
  LayoutTemplate,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Circle,
  Loader2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_TABS: { value: TaskStatus | "all"; label: string; Icon: typeof Circle }[] = [
  { value: "all", label: "Todas", Icon: ListTodo },
  { value: "todo", label: "Pendiente", Icon: Circle },
  { value: "in_progress", label: "En progreso", Icon: Clock },
  { value: "done", label: "Listas", Icon: CheckCircle2 },
];

function formatWeekRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
  const s = start.toLocaleDateString("es-ES", opts);
  const e = end.toLocaleDateString("es-ES", { ...opts, year: "numeric" });
  return `${s} – ${e}`;
}

// ── Google Calendar Connect Banner ────────────────────────────────────────────

function CalendarConnectBanner({ onConnect }: { onConnect: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/5 px-4 py-3"
    >
      <Calendar className="w-5 h-5 text-blue-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-300">Conecta Google Calendar</p>
        <p className="text-xs text-muted-foreground">
          Ve tus eventos junto a las tareas y sincroniza con un clic.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onConnect}
        className="shrink-0 border-blue-500/40 text-blue-300 hover:bg-blue-500/10 gap-1.5"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Conectar
      </Button>
    </motion.div>
  );
}

// ── Main tabs: Semana | Tareas ────────────────────────────────────────────────

type MainTab = "week" | "tasks";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlanningPage() {
  const { data: session } = useSession();
  const [mainTab, setMainTab] = useState<MainTab>("week");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Week navigation
  const { weekStart, weekEnd, days, prevWeek, nextWeek, goToToday } =
    useWeekNavigation();

  // Tasks (from Entity API)
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, setStatus } =
    useTasks();

  // Google Calendar events
  const timeMin = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 1);
    return d;
  }, [weekStart]);

  const timeMax = useMemo(() => {
    const d = new Date(weekEnd);
    d.setDate(d.getDate() + 1);
    return d;
  }, [weekEnd]);

  const {
    events: calendarEvents,
    connected: calendarConnected,
    loading: calendarLoading,
    pushEvent,
    refetch: refetchCalendar,
  } = useCalendarEvents(timeMin, timeMax);

  // Push task to Google Calendar
  const handlePushToCalendar = useCallback(
    async (task: PlanningTask) => {
      const eventId = await pushEvent(task);
      if (eventId) {
        await updateTask(task.id, { googleEventId: eventId });
      }
    },
    [pushEvent, updateTask]
  );

  // Create task
  const handleCreateTask = useCallback(
    async (input: CreateTaskInput) => {
      await createTask(input);
      setShowTaskForm(false);
    },
    [createTask]
  );

  // Filtered task list (Tareas tab)
  const filteredTasks = useMemo(() => {
    let list = [...tasks];
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    return list.sort((a, b) => {
      // Sort: overdue first, then by dueDate, then undated
      const order: Record<TaskStatus, number> = { todo: 0, in_progress: 1, done: 2 };
      if (a.status !== b.status) return order[a.status] - order[b.status];
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  }, [tasks, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter((t) => t.status === "done").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    overdue: tasks.filter(
      (t) =>
        t.dueDate &&
        t.status !== "done" &&
        new Date(t.dueDate + "T00:00:00") < new Date(new Date().setHours(0, 0, 0, 0))
    ).length,
  }), [tasks]);

  // Today's tasks (for side panel)
  const todayTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.dueDate &&
          isSameDay(new Date(t.dueDate + "T00:00:00"), new Date())
      ),
    [tasks]
  );

  const connectCalendar = () => {
    signIn("google", { callbackUrl: "/planning" });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mx-6 -mb-6 overflow-hidden">
      {/* ── Top bar ── */}
      <div className="px-6 py-4 border-b border-border/50 space-y-3 shrink-0">
        {/* Title + main tabs */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-heading font-bold">Planificación</h1>
            {/* Tab switcher */}
            <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
              {[
                { id: "week" as MainTab, label: "Semana", Icon: LayoutTemplate },
                { id: "tasks" as MainTab, label: "Tareas", Icon: ListTodo },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setMainTab(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    mainTab === id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Calendar status */}
            {calendarConnected === true && (
              <div className="flex items-center gap-1.5 text-xs text-blue-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Google Calendar</span>
                {calendarLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
            )}
            <Button
              size="sm"
              onClick={() => setShowTaskForm((v) => !v)}
              className="gap-1.5 h-8"
            >
              <Plus className="w-4 h-4" />
              Nueva tarea
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{stats.total} tareas</span>
          {stats.inProgress > 0 && (
            <span className="text-amber-400">{stats.inProgress} en progreso</span>
          )}
          {stats.overdue > 0 && (
            <span className="text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {stats.overdue} atrasada{stats.overdue !== 1 ? "s" : ""}
            </span>
          )}
          {stats.done > 0 && (
            <span className="text-emerald-400">{stats.done} completada{stats.done !== 1 ? "s" : ""}</span>
          )}
        </div>

        {/* Google Calendar connect banner */}
        {calendarConnected === false && (
          <CalendarConnectBanner onConnect={connectCalendar} />
        )}

        {/* Week navigator (week tab only) */}
        {mainTab === "week" && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={prevWeek} className="h-7 w-7 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="h-7 px-2 text-xs"
              >
                Hoy
              </Button>
              <Button variant="ghost" size="sm" onClick={nextWeek} className="h-7 w-7 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {formatWeekRange(weekStart, weekEnd)}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={refetchCalendar}
              disabled={calendarLoading}
              className="h-7 w-7 p-0 text-muted-foreground"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", calendarLoading && "animate-spin")}
              />
            </Button>
          </div>
        )}
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Quick task form (global) */}
        <AnimatePresence>
          {showTaskForm && (
            <div className="px-6 pt-4">
              <TaskForm
                onSubmit={handleCreateTask}
                onClose={() => setShowTaskForm(false)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* ── Week view ── */}
        {mainTab === "week" && (
          <div className="flex h-full gap-0 min-h-0">
            {/* Calendar grid */}
            <div className="flex-1 min-w-0 overflow-hidden p-4">
              {tasksLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <WeekView
                  days={days}
                  tasks={tasks}
                  calendarEvents={calendarEvents}
                  calendarConnected={calendarConnected}
                  onStatusChange={setStatus}
                  onDelete={deleteTask}
                  onCreateTask={async (input) => { await createTask(input); }}
                  onPushToCalendar={handlePushToCalendar}
                />
              )}
            </div>

            {/* Today sidebar */}
            <div className="w-64 shrink-0 border-l border-border/50 overflow-y-auto p-4 space-y-4">
              <p className="text-sm font-semibold">
                Hoy —{" "}
                <span className="text-muted-foreground font-normal">
                  {new Date().toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </p>

              {/* Today's GCal events */}
              <TodayStrip events={calendarEvents} connected={calendarConnected} />

              {/* Today's tasks */}
              {todayTasks.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <ListTodo className="w-3.5 h-3.5" />
                    Tareas de hoy
                  </p>
                  <AnimatePresence>
                    {todayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={(s) => setStatus(task.id, s)}
                        onDelete={() => deleteTask(task.id)}
                        onPushToCalendar={
                          calendarConnected ? () => handlePushToCalendar(task) : undefined
                        }
                        canPushToCalendar={!!calendarConnected}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground space-y-1">
                  <CalendarDays className="w-6 h-6 mx-auto text-muted-foreground/40" />
                  <p>Sin tareas para hoy</p>
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="text-primary hover:underline"
                  >
                    + Añadir tarea
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tasks list view ── */}
        {mainTab === "tasks" && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Status filter */}
            <div className="px-6 pt-4 flex items-center gap-1.5 shrink-0">
              {STATUS_TABS.map(({ value, label, Icon }) => {
                const count =
                  value === "all"
                    ? tasks.length
                    : tasks.filter((t) => t.status === value).length;
                return (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      statusFilter === value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                    <span
                      className={cn(
                        "text-[10px] tabular-nums",
                        statusFilter === value
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground/60"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {tasksLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                  <ListTodo className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm font-medium">Sin tareas</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    {statusFilter === "all"
                      ? "Crea tu primera tarea con el botón 'Nueva tarea'."
                      : `No hay tareas con estado "${
                          STATUS_TABS.find((s) => s.value === statusFilter)?.label
                        }".`}
                  </p>
                  {statusFilter === "all" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowTaskForm(true)}
                      className="mt-2 gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Crear tarea
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-w-2xl">
                  <AnimatePresence>
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={(s) => setStatus(task.id, s)}
                        onDelete={() => deleteTask(task.id)}
                        onPushToCalendar={
                          calendarConnected
                            ? () => handlePushToCalendar(task)
                            : undefined
                        }
                        canPushToCalendar={!!calendarConnected}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
