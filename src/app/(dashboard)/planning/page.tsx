"use client";

import { useState, useCallback, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskCard } from "@/components/planning/TaskCard";
import { TaskForm } from "@/components/planning/TaskForm";
import { WeekView, TodayStrip } from "@/components/planning/WeekView";
import { useIsMobile } from "@/hooks/useIsMobile";
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
  TrendingUp,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_TABS: { value: TaskStatus | "all"; label: string; Icon: typeof Circle }[] = [
  { value: "all",         label: "Todas",       Icon: ListTodo     },
  { value: "todo",        label: "Pendiente",   Icon: Circle       },
  { value: "in_progress", label: "En progreso", Icon: Clock        },
  { value: "done",        label: "Listas",      Icon: CheckCircle2 },
];

const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function formatWeekRange(start: Date, end: Date): string {
  const s = start.toLocaleDateString("es-ES", { month: "long", day: "numeric" });
  const e = end.toLocaleDateString("es-ES", { month: "long", day: "numeric", year: "numeric" });
  return `${s} – ${e}`;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color,
}: { label: string; value: number; icon: typeof Circle; color: string }) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-2.5 min-w-0", color)}>
      <Icon className="w-4 h-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">{label}</p>
      </div>
    </div>
  );
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
        <p className="text-xs text-muted-foreground hidden sm:block">
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

// ── Mobile Day Picker ─────────────────────────────────────────────────────────

function MobileDayPicker({
  days,
  selectedDate,
  tasks,
  onSelect,
}: {
  days: Date[];
  selectedDate: Date;
  tasks: PlanningTask[];
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 px-3 scrollbar-none">
      {days.map((day) => {
        const isToday = isSameDay(day, today);
        const isSelected = isSameDay(day, selectedDate);
        const count = tasks.filter(
          (t) => t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), day)
        ).length;
        return (
          <button
            key={toDateString(day)}
            onClick={() => onSelect(day)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-3 py-2.5 min-w-[3.25rem] transition-all border shrink-0",
              isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : isToday
                ? "border-primary/40 text-primary bg-primary/5"
                : "border-border/40 text-muted-foreground hover:border-border"
            )}
          >
            <span className="text-[10px] font-medium uppercase">{DAY_SHORT[day.getDay()]}</span>
            <span className="text-base font-bold leading-none">{day.getDate()}</span>
            {count > 0 ? (
              <span className={cn(
                "text-[9px] font-semibold w-4 h-4 rounded-full flex items-center justify-center",
                isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
              )}>
                {count}
              </span>
            ) : (
              <span className="w-4 h-4" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Mobile Day View ───────────────────────────────────────────────────────────

function MobileDayView({
  day,
  tasks,
  calendarEvents,
  calendarConnected,
  onStatusChange,
  onDelete,
  onCreateTask,
  onPushToCalendar,
  onAddTask,
}: {
  day: Date;
  tasks: PlanningTask[];
  calendarEvents: import("@/types/planning").CalendarEvent[];
  calendarConnected: boolean | null;
  onStatusChange: (id: string, s: PlanningTask["status"]) => void;
  onDelete: (id: string) => void;
  onCreateTask: (input: CreateTaskInput) => Promise<void>;
  onPushToCalendar: (task: PlanningTask) => Promise<void>;
  onAddTask: () => void;
}) {
  const [quickAdd, setQuickAdd] = useState(false);
  const dateStr = toDateString(day);

  const dayTasks = tasks.filter(
    (t) => t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), day)
  );
  const dayEvents = calendarEvents.filter((e) => {
    try { return isSameDay(new Date(e.start), day); } catch { return false; }
  });

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch { return ""; }
  };

  const GCAL_COLORS: Record<string, string> = {
    "1": "bg-blue-500/20 border-blue-500/40 text-blue-300",
    "2": "bg-green-500/20 border-green-500/40 text-green-300",
    "3": "bg-purple-500/20 border-purple-500/40 text-purple-300",
    default: "bg-primary/20 border-primary/40 text-primary/90",
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
      {/* Date label */}
      <p className="text-xs font-semibold text-muted-foreground capitalize">
        {day.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
      </p>

      {/* GCal events */}
      {dayEvents.length > 0 && (
        <div className="space-y-1.5">
          {dayEvents.map((ev) => (
            <div
              key={ev.id}
              className={cn(
                "flex items-center gap-2 text-xs rounded-xl px-3 py-2.5 border",
                GCAL_COLORS[ev.colorId ?? ""] ?? GCAL_COLORS.default
              )}
            >
              <CalendarDays className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{ev.title}</p>
                {!ev.allDay && <p className="text-[10px] opacity-60 mt-0.5">{formatTime(ev.start)}</p>}
              </div>
              {ev.htmlLink && (
                <a href={ev.htmlLink} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100">
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tasks */}
      <AnimatePresence>
        {dayTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={(s) => onStatusChange(task.id, s)}
            onDelete={() => onDelete(task.id)}
            onPushToCalendar={calendarConnected ? () => onPushToCalendar(task) : undefined}
            canPushToCalendar={!!calendarConnected}
          />
        ))}
      </AnimatePresence>

      {/* Quick add form */}
      <AnimatePresence>
        {quickAdd && (
          <TaskForm
            onSubmit={async (input) => {
              await onCreateTask({ ...input, dueDate: dateStr });
              setQuickAdd(false);
            }}
            onClose={() => setQuickAdd(false)}
            defaultDate={dateStr}
          />
        )}
      </AnimatePresence>

      {/* Empty + add */}
      {dayTasks.length === 0 && dayEvents.length === 0 && !quickAdd && (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">Sin eventos para este día</p>
          <Button size="sm" variant="outline" onClick={() => setQuickAdd(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Añadir tarea
          </Button>
        </div>
      )}

      {(dayTasks.length > 0 || dayEvents.length > 0) && !quickAdd && (
        <button
          onClick={() => setQuickAdd(true)}
          className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-2.5 px-3 rounded-xl border border-dashed border-border/40 hover:border-border transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Añadir tarea para este día
        </button>
      )}
    </div>
  );
}

// ── Main tabs ─────────────────────────────────────────────────────────────────

type MainTab = "week" | "tasks";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlanningPage() {
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const [mainTab, setMainTab] = useState<MainTab>("week");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const { weekStart, weekEnd, days, prevWeek, nextWeek, goToToday } = useWeekNavigation();

  const timeMin = useMemo(() => {
    const d = new Date(weekStart); d.setDate(d.getDate() - 1); return d;
  }, [weekStart]);
  const timeMax = useMemo(() => {
    const d = new Date(weekEnd); d.setDate(d.getDate() + 1); return d;
  }, [weekEnd]);

  const {
    events: calendarEvents,
    connected: calendarConnected,
    loading: calendarLoading,
    pushEvent,
    updateEvent,
    deleteEvent,
    refetch: refetchCalendar,
  } = useCalendarEvents(timeMin, timeMax);

  const calendarActions = useMemo(
    () => ({ connected: calendarConnected, pushEvent, updateEvent, deleteEvent }),
    [calendarConnected, pushEvent, updateEvent, deleteEvent],
  );

  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, setStatus } =
    useTasks(calendarActions);

  // Manual push for tasks that were created before Calendar was connected
  const handlePushToCalendar = useCallback(
    async (task: PlanningTask) => {
      const eventId = await pushEvent(task);
      if (eventId) await updateTask(task.id, { googleEventId: eventId });
    },
    [pushEvent, updateTask],
  );

  const handleCreateTask = useCallback(
    async (input: CreateTaskInput) => { await createTask(input); setShowTaskForm(false); },
    [createTask],
  );

  const filteredTasks = useMemo(() => {
    let list = [...tasks];
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    return list.sort((a, b) => {
      const order: Record<TaskStatus, number> = { todo: 0, in_progress: 1, done: 2 };
      if (a.status !== b.status) return order[a.status] - order[b.status];
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  }, [tasks, statusFilter]);

  const stats = useMemo(() => ({
    total:      tasks.length,
    done:       tasks.filter((t) => t.status === "done").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    overdue:    tasks.filter(
      (t) => t.dueDate && t.status !== "done" &&
             new Date(t.dueDate + "T00:00:00") < new Date(new Date().setHours(0, 0, 0, 0))
    ).length,
  }), [tasks]);

  const todayTasks = useMemo(
    () => tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), new Date())),
    [tasks]
  );

  const connectCalendar = () => signIn("google", { callbackUrl: "/planning" });

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)] -mx-3 md:-mx-6 -mb-3 md:-mb-6 overflow-hidden">

      {/* ── Top bar ── */}
      <div className="px-3 md:px-6 pt-3 md:pt-4 pb-3 border-b border-border/50 space-y-3 shrink-0">

        {/* Row 1: Title + actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <h1 className="text-lg md:text-xl font-heading font-bold shrink-0">Planificación</h1>
            <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
              {([
                { id: "week" as MainTab, label: "Semana", Icon: LayoutTemplate },
                { id: "tasks" as MainTab, label: "Tareas", Icon: ListTodo },
              ] as const).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setMainTab(id)}
                  className={cn(
                    "flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    mainTab === id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {calendarConnected === true && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-blue-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>GCal</span>
                {calendarLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
            )}
            <Button size="sm" onClick={() => setShowTaskForm((v) => !v)} className="gap-1.5 h-8">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva tarea</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Stats cards */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="Total"       value={stats.total}      icon={TrendingUp}   color="border-border/50 bg-card/40" />
          <StatCard label="Progreso"    value={stats.inProgress} icon={Clock}        color="border-amber-500/20 bg-amber-500/5 text-amber-400" />
          <StatCard label="Atrasadas"   value={stats.overdue}    icon={AlertCircle}  color={stats.overdue > 0 ? "border-red-500/20 bg-red-500/5 text-red-400" : "border-border/50 bg-card/40"} />
          <StatCard label="Completadas" value={stats.done}       icon={CheckCircle2} color="border-emerald-500/20 bg-emerald-500/5 text-emerald-400" />
        </div>

        {/* Calendar connect banner */}
        {calendarConnected === false && <CalendarConnectBanner onConnect={connectCalendar} />}

        {/* Week navigator (week tab, desktop only) */}
        {mainTab === "week" && !isMobile && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={prevWeek} className="h-7 w-7 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={goToToday} className="h-7 px-2 text-xs">Hoy</Button>
              <Button variant="ghost" size="sm" onClick={nextWeek} className="h-7 w-7 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground capitalize">{formatWeekRange(weekStart, weekEnd)}</p>
            <Button variant="ghost" size="sm" onClick={refetchCalendar} disabled={calendarLoading} className="h-7 w-7 p-0 text-muted-foreground">
              <RefreshCw className={cn("w-3.5 h-3.5", calendarLoading && "animate-spin")} />
            </Button>
          </div>
        )}

        {/* Week navigator (week tab, mobile: compact) */}
        {mainTab === "week" && isMobile && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={prevWeek} className="h-7 w-7 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { goToToday(); setSelectedDay(new Date()); }} className="h-7 px-2 text-xs">Hoy</Button>
              <Button variant="ghost" size="sm" onClick={nextWeek} className="h-7 w-7 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {weekStart.getDate()} {MONTH_SHORT[weekStart.getMonth()]} – {weekEnd.getDate()} {MONTH_SHORT[weekEnd.getMonth()]}
            </p>
            <Button variant="ghost" size="sm" onClick={refetchCalendar} disabled={calendarLoading} className="h-7 w-7 p-0 text-muted-foreground">
              <RefreshCw className={cn("w-3.5 h-3.5", calendarLoading && "animate-spin")} />
            </Button>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">

        {/* Quick task form */}
        <AnimatePresence>
          {showTaskForm && (
            <div className="px-3 md:px-6 pt-3">
              <TaskForm onSubmit={handleCreateTask} onClose={() => setShowTaskForm(false)} />
            </div>
          )}
        </AnimatePresence>

        {/* ── Week view ── */}
        {mainTab === "week" && (
          <>
            {/* Desktop: grid + today sidebar */}
            {!isMobile && (
              <div className="flex h-full gap-0 min-h-0">
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
                      {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                  </p>
                  <TodayStrip events={calendarEvents} connected={calendarConnected} />
                  {todayTasks.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <ListTodo className="w-3.5 h-3.5" />Tareas de hoy
                      </p>
                      <AnimatePresence>
                        {todayTasks.map((task) => (
                          <TaskCard key={task.id} task={task}
                            onStatusChange={(s) => setStatus(task.id, s)}
                            onDelete={() => deleteTask(task.id)}
                            onPushToCalendar={calendarConnected ? () => handlePushToCalendar(task) : undefined}
                            canPushToCalendar={!!calendarConnected}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground space-y-1">
                      <CalendarDays className="w-6 h-6 mx-auto text-muted-foreground/40" />
                      <p>Sin tareas para hoy</p>
                      <button onClick={() => setShowTaskForm(true)} className="text-primary hover:underline">
                        + Añadir tarea
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile: day picker + day view */}
            {isMobile && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="py-3 border-b border-border/40 shrink-0">
                  <MobileDayPicker
                    days={days}
                    selectedDate={selectedDay}
                    tasks={tasks}
                    onSelect={setSelectedDay}
                  />
                </div>
                {tasksLoading ? (
                  <div className="flex items-center justify-center flex-1">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <MobileDayView
                    day={selectedDay}
                    tasks={tasks}
                    calendarEvents={calendarEvents}
                    calendarConnected={calendarConnected}
                    onStatusChange={setStatus}
                    onDelete={deleteTask}
                    onCreateTask={async (input) => { await createTask(input); }}
                    onPushToCalendar={handlePushToCalendar}
                    onAddTask={() => setShowTaskForm(true)}
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* ── Tasks list ── */}
        {mainTab === "tasks" && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Status filter */}
            <div className="px-3 md:px-6 pt-3 flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 scrollbar-none">
              {STATUS_TABS.map(({ value, label, Icon }) => {
                const count = value === "all" ? tasks.length : tasks.filter((t) => t.status === value).length;
                return (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-all whitespace-nowrap shrink-0",
                      statusFilter === value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                    <span className={cn("text-[10px] tabular-nums", statusFilter === value ? "text-primary-foreground/70" : "text-muted-foreground/60")}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto px-3 md:px-6 py-3">
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
                      : `No hay tareas con estado "${STATUS_TABS.find((s) => s.value === statusFilter)?.label}".`}
                  </p>
                  {statusFilter === "all" && (
                    <Button size="sm" variant="outline" onClick={() => setShowTaskForm(true)} className="mt-2 gap-1.5">
                      <Plus className="w-4 h-4" />Crear tarea
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
                        onPushToCalendar={calendarConnected ? () => handlePushToCalendar(task) : undefined}
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
