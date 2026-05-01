"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskCard } from "@/components/planning/TaskCard";
import { TaskForm } from "@/components/planning/TaskForm";
import { TaskIssueModal } from "@/components/planning/TaskIssueModal";
import { CalendarGrid } from "@/components/planning/CalendarGrid";
import { PlannerAgent } from "@/components/planning/PlannerAgent";
import { TaskBoard } from "@/components/planning/TaskBoard";
import { ProjectBoardShell } from "@/components/planning/ProjectBoardShell";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTrackInteraction } from "@/hooks/useOrganizerAgent";
import {
  useTasks,
  useCalendarEvents,
  useProjectBoards,
  useBoardTasks,
  useTaskActivity,
  useWeekNavigation,
  toDateString,
  isSameDay,
} from "@/hooks/usePlanning";
import type { ActivityEvent, BoardList, CreateTaskInput, PlanningTask, ProjectBoard, ProjectBoardProject, TaskStatus } from "@/types/planning";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ListTodo,
  CalendarRange,
  Columns3,
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
  Sparkles,
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

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Circle; color: string }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 min-w-0", color)}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-base font-bold leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Google Calendar banner ────────────────────────────────────────────────────

function CalendarConnectBanner({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/5 px-4 py-2.5">
      <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
      <p className="text-xs text-blue-300 flex-1">Conecta Google Calendar para ver tus eventos junto a las tareas.</p>
      <Button size="sm" variant="outline" onClick={onConnect} className="shrink-0 border-blue-500/40 text-blue-300 hover:bg-blue-500/10 gap-1.5 h-7 text-xs">
        <ExternalLink className="w-3 h-3" />Conectar
      </Button>
    </div>
  );
}

// ── Mobile day picker ─────────────────────────────────────────────────────────

function MobileDayPicker({ days, selectedDate, tasks, onSelect }: {
  days: Date[]; selectedDate: Date; tasks: PlanningTask[]; onSelect: (d: Date) => void;
}) {
  const today = new Date();
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 px-3 scrollbar-none">
      {days.map((day) => {
        const isToday = isSameDay(day, today);
        const isSelected = isSameDay(day, selectedDate);
        const count = tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), day)).length;
        return (
          <button
            key={toDateString(day)}
            onClick={() => onSelect(day)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-3 py-2 min-w-[3rem] border shrink-0 transition-all",
              isSelected ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : isToday ? "border-primary/40 text-primary bg-primary/5"
                : "border-border/40 text-muted-foreground hover:border-border"
            )}
          >
            <span className="text-[10px] font-medium uppercase">{DAY_SHORT[day.getDay()]}</span>
            <span className="text-base font-bold leading-none">{day.getDate()}</span>
            {count > 0
              ? <span className={cn("text-[9px] font-semibold w-4 h-4 rounded-full flex items-center justify-center", isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary")}>{count}</span>
              : <span className="w-4 h-4" />
            }
          </button>
        );
      })}
    </div>
  );
}

// ── Mobile day view ───────────────────────────────────────────────────────────

function MobileDayView({ day, tasks, calendarEvents, calendarConnected, onStatusChange, onDelete, onCreateTask, onOpenTask }: {
  day: Date;
  tasks: PlanningTask[];
  calendarEvents: import("@/types/planning").CalendarEvent[];
  calendarConnected: boolean | null;
  onStatusChange: (id: string, s: PlanningTask["status"]) => void;
  onDelete: (id: string) => void;
  onCreateTask: (input: CreateTaskInput) => Promise<void>;
  onOpenTask: (id: string) => void;
}) {
  const [quickAdd, setQuickAdd] = useState(false);
  const dateStr = toDateString(day);
  const dayTasks = tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), day));
  const dayEvents = calendarEvents.filter((e) => { try { return isSameDay(new Date(e.start), day); } catch { return false; } });

  const GCAL_COLORS: Record<string, string> = { "1": "bg-blue-500/20 border-blue-500/40 text-blue-300", default: "bg-primary/20 border-primary/40 text-primary/90" };
  const formatTime = (iso: string) => { try { return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false }); } catch { return ""; } };

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
      <p className="text-xs font-semibold text-muted-foreground capitalize">
        {day.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
      </p>
      {dayEvents.map((ev) => (
        <div key={ev.id} className={cn("flex items-center gap-2 text-xs rounded-xl px-3 py-2.5 border", GCAL_COLORS[ev.colorId ?? ""] ?? GCAL_COLORS.default)}>
          <CalendarDays className="w-3.5 h-3.5 shrink-0 opacity-70" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{ev.title}</p>
            {!ev.allDay && <p className="text-[10px] opacity-60">{formatTime(ev.start)}</p>}
          </div>
        </div>
      ))}
      <AnimatePresence>
        {dayTasks.map((task) => (
          <TaskCard key={task.id} task={task}
            onStatusChange={(s) => onStatusChange(task.id, s)}
            onDelete={() => onDelete(task.id)}
            onOpen={() => onOpenTask(task.id)}
            canPushToCalendar={!!calendarConnected}
          />
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {quickAdd && (
          <TaskForm
            onSubmit={async (input) => { await onCreateTask({ ...input, dueDate: dateStr }); setQuickAdd(false); }}
            onClose={() => setQuickAdd(false)}
            defaultDate={dateStr}
          />
        )}
      </AnimatePresence>
      {!quickAdd && (
        <button
          onClick={() => setQuickAdd(true)}
          className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-2.5 px-3 rounded-xl border border-dashed border-border/40 hover:border-border transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />Añadir tarea para este día
        </button>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

type ViewMode = "calendar" | "list" | "board";

export default function PlanningPage() {
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const { track } = useTrackInteraction();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [agentOpen, setAgentOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [issueModalTaskId, setIssueModalTaskId] = useState<string | null>(null);

  const { weekStart, weekEnd, days, prevWeek, nextWeek, goToToday } = useWeekNavigation();

  const timeMin = useMemo(() => { const d = new Date(weekStart); d.setDate(d.getDate() - 1); return d; }, [weekStart]);
  const timeMax = useMemo(() => { const d = new Date(weekEnd); d.setDate(d.getDate() + 1); return d; }, [weekEnd]);

  const { events: calendarEvents, connected: calendarConnected, loading: calendarLoading, pushEvent, updateEvent, deleteEvent, refetch: refetchCalendar } = useCalendarEvents(timeMin, timeMax);

  const calendarActions = useMemo(() => ({ connected: calendarConnected, pushEvent, updateEvent, deleteEvent }), [calendarConnected, pushEvent, updateEvent, deleteEvent]);
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, refetch: refetchTasks } = useTasks(calendarActions);
  const {
    projects,
    boards,
    boardLists,
    loading: boardsLoading,
    createProject,
    createBoard,
    updateProject,
    ensureDefaultWorkspace,
  } = useProjectBoards();
  const { recordActivity } = useTaskActivity();

  useEffect(() => {
    let cancelled = false;
    ensureDefaultWorkspace().then((workspace) => {
      if (cancelled || !workspace) return;
      setSelectedProjectId((current) => current ?? workspace.project.id);
      setSelectedBoardId((current) => current ?? workspace.board?.id ?? null);
    });
    return () => { cancelled = true; };
  }, [ensureDefaultWorkspace]);

  const selectedProject = useMemo(
    () => projects.find((project: ProjectBoardProject) => project.id === selectedProjectId) ?? projects[0] ?? null,
    [projects, selectedProjectId],
  );
  const projectBoards = useMemo(
    () => boards.filter((board: ProjectBoard) => board.projectId === selectedProject?.id),
    [boards, selectedProject?.id],
  );
  const selectedBoard = useMemo(
    () => projectBoards.find((board: ProjectBoard) => board.id === selectedBoardId) ?? projectBoards[0] ?? null,
    [projectBoards, selectedBoardId],
  );
  const selectedBoardLists = useMemo(
    () => boardLists.filter((list: BoardList) => list.boardId === selectedBoard?.id),
    [boardLists, selectedBoard?.id],
  );
  const boardTasks = useBoardTasks(tasks, selectedProject?.id, selectedBoard?.id, selectedBoardLists);
  const issueModalTask = useMemo(
    () => boardTasks.find((t) => t.id === issueModalTaskId) ?? null,
    [boardTasks, issueModalTaskId]
  );

  const handlePushToCalendar = useCallback(async (task: PlanningTask) => {
    const eventId = await pushEvent(task);
    if (eventId) await updateTask(task.id, { googleEventId: eventId });
  }, [pushEvent, updateTask]);

  const handleCreateTask = useCallback(async (input: CreateTaskInput) => {
    const task = await createTask({
      ...input,
      projectId: input.projectId ?? selectedProject?.id,
      boardId: input.boardId ?? selectedBoard?.id,
    });
    if (task) {
      track("task.created", { targetId: task.id, targetType: "task" });
      await recordActivity({
        taskId: task.id,
        projectId: task.projectId,
        boardId: task.boardId,
        action: "created_task",
        summary: "Creó una tarea",
      });
    }
    setShowTaskForm(false);
  }, [createTask, recordActivity, selectedBoard?.id, selectedProject?.id, track]);

  const handleUpdateTask = useCallback(async (id: string, props: Partial<Omit<PlanningTask, "id" | "createdAt">>) => {
    const actorName = session?.user?.name ?? "Usuario";
    await updateTask(id, {
      ...props,
      lastEditedByUserId: session?.user?.id,
      lastEditedByName: actorName,
    });
    if (props.status === "done") {
      track("task.completed", { targetId: id, targetType: "task" });
    } else {
      track("task.updated", { targetId: id, targetType: "task" });
    }
  }, [session?.user?.id, session?.user?.name, updateTask, track]);

  const filteredTasks = useMemo(() => {
    let list = [...boardTasks];
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    return list.sort((a, b) => {
      const order: Record<TaskStatus, number> = { todo: 0, in_progress: 1, done: 2 };
      if (a.status !== b.status) return order[a.status] - order[b.status];
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1; if (b.dueDate) return 1;
      return 0;
    });
  }, [boardTasks, statusFilter]);

  const stats = useMemo(() => ({
    total:      boardTasks.length,
    done:       boardTasks.filter((t) => t.status === "done").length,
    inProgress: boardTasks.filter((t) => t.status === "in_progress").length,
    overdue:    boardTasks.filter((t) => t.dueDate && t.status !== "done" && new Date(t.dueDate + "T00:00:00") < new Date(new Date().setHours(0, 0, 0, 0))).length,
  }), [boardTasks]);

  const firstName = (session?.user?.name?.split(" ")[0]) ?? "Usuario";

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)] -mx-3 md:-mx-6 -mb-3 md:-mb-6 overflow-hidden">

      {/* ── Top bar ── */}
      <div className="px-3 md:px-5 pt-3 pb-2.5 border-b border-border/50 space-y-2.5 shrink-0 bg-background/95 backdrop-blur-sm">

        {/* Row 1: Title + controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-lg font-heading font-bold shrink-0">Planear Hoy</h1>

            {/* View toggle */}
            <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
              {([
                { id: "calendar" as ViewMode, Icon: CalendarRange, label: "Calendario" },
                { id: "list"     as ViewMode, Icon: ListTodo,       label: "Lista" },
                { id: "board"    as ViewMode, Icon: Columns3,       label: "Tablero" },
              ] as const).map(({ id, Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                    viewMode === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
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
              <div className="hidden md:flex items-center gap-1 text-xs text-blue-400/80">
                <Calendar className="w-3.5 h-3.5" />
                <span>GCal</span>
                {calendarLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
            )}

            {/* AI Agent button */}
            <Button
              size="sm"
              variant={agentOpen ? "default" : "outline"}
              onClick={() => setAgentOpen((v) => !v)}
              className={cn(
                "gap-1.5 h-8 text-xs",
                agentOpen
                  ? "bg-violet-600 hover:bg-violet-700 border-violet-600 text-white"
                  : "border-violet-500/40 text-violet-400 hover:bg-violet-500/10"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">IA Planificador</span>
            </Button>

            <Button size="sm" onClick={() => setShowTaskForm((v) => !v)} className="gap-1.5 h-8">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva tarea</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Stats */}
        <ProjectBoardShell
          projects={projects}
          boards={projectBoards}
          selectedProject={selectedProject}
          selectedBoard={selectedBoard}
          onSelectProject={(projectId) => {
            setSelectedProjectId(projectId);
            const nextBoard = boards.find((board: ProjectBoard) => board.projectId === projectId);
            setSelectedBoardId(nextBoard?.id ?? null);
          }}
          onSelectBoard={setSelectedBoardId}
          onCreateProject={async (name) => {
            const project = await createProject({ name, key: name.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, "") || "PROJ" });
            if (project) setSelectedProjectId(project.id);
          }}
          onCreateBoard={async (name) => {
            if (!selectedProject) return;
            const board = await createBoard({ projectId: selectedProject.id, name });
            if (board) setSelectedBoardId(board.id);
          }}
          onAddMember={async (name) => {
            if (!selectedProject) return;
            const memberNames = Array.from(new Set([...(selectedProject.memberNames ?? []), name]));
            await updateProject(selectedProject.id, { memberNames });
          }}
        />

        <div className="grid grid-cols-4 gap-1.5">
          <StatChip label="Total"       value={stats.total}      icon={TrendingUp}   color="border-border/50 bg-card/40" />
          <StatChip label="Progreso"    value={stats.inProgress} icon={Clock}        color="border-amber-500/20 bg-amber-500/5 text-amber-400" />
          <StatChip label="Atrasadas"   value={stats.overdue}    icon={AlertCircle}  color={stats.overdue > 0 ? "border-red-500/20 bg-red-500/5 text-red-400" : "border-border/50 bg-card/40"} />
          <StatChip label="Completadas" value={stats.done}       icon={CheckCircle2} color="border-emerald-500/20 bg-emerald-500/5 text-emerald-400" />
        </div>

        {/* Calendar connect banner */}
        {calendarConnected === false && <CalendarConnectBanner onConnect={() => signIn("google", { callbackUrl: "/planning" })} />}

        {/* Week navigator (calendar mode) */}
        {viewMode === "calendar" && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={prevWeek} className="h-7 w-7 p-0"><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => { goToToday(); setSelectedDay(new Date()); }} className="h-7 px-2.5 text-xs font-medium">Hoy</Button>
              <Button variant="ghost" size="sm" onClick={nextWeek} className="h-7 w-7 p-0"><ChevronRight className="w-4 h-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground font-medium capitalize hidden sm:block">
              {formatWeekRange(weekStart, weekEnd)}
            </p>
            <p className="text-xs text-muted-foreground font-medium sm:hidden">
              {weekStart.getDate()} {MONTH_SHORT[weekStart.getMonth()]} – {weekEnd.getDate()} {MONTH_SHORT[weekEnd.getMonth()]}
            </p>
            <Button variant="ghost" size="sm" onClick={refetchCalendar} disabled={calendarLoading} className="h-7 w-7 p-0 text-muted-foreground">
              <RefreshCw className={cn("w-3.5 h-3.5", calendarLoading && "animate-spin")} />
            </Button>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Quick task form */}
          <AnimatePresence>
            {showTaskForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-3 md:px-5 pt-3 shrink-0"
              >
                <TaskForm onSubmit={handleCreateTask} onClose={() => setShowTaskForm(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Calendar view ── */}
          {viewMode === "calendar" && (
            <>
              {!isMobile && (
                <div className="flex-1 min-h-0 p-3 md:p-4">
                  {tasksLoading || boardsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <CalendarGrid
                      days={days}
                      tasks={boardTasks}
                      calendarEvents={calendarEvents}
                      calendarConnected={calendarConnected}
                      onStatusChange={(id, status) => handleUpdateTask(id, { status })}
                      onCreateTask={handleCreateTask}
                      onPushToCalendar={handlePushToCalendar}
                    />
                  )}
                </div>
              )}

              {/* Mobile: day picker + day view */}
              {isMobile && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="py-3 border-b border-border/40 shrink-0">
                    <MobileDayPicker days={days} selectedDate={selectedDay} tasks={boardTasks} onSelect={setSelectedDay} />
                  </div>
                  {tasksLoading || boardsLoading
                    ? <div className="flex items-center justify-center flex-1"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                    : <MobileDayView
                        day={selectedDay}
                        tasks={boardTasks}
                        calendarEvents={calendarEvents}
                        calendarConnected={calendarConnected}
                        onStatusChange={(id, status) => handleUpdateTask(id, { status })}
                        onDelete={deleteTask}
                        onCreateTask={handleCreateTask}
                        onOpenTask={setIssueModalTaskId}
                      />
                  }
                </div>
              )}
            </>
          )}

          {/* ── List view ── */}
          {viewMode === "list" && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="px-3 md:px-5 pt-3 flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 scrollbar-none">
                {STATUS_TABS.map(({ value, label, Icon }) => {
                  const count = value === "all" ? boardTasks.length : boardTasks.filter((t) => t.status === value).length;
                  return (
                    <button
                      key={value}
                      onClick={() => setStatusFilter(value)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-all whitespace-nowrap shrink-0",
                        statusFilter === value ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                      <span className={cn("text-[10px] tabular-nums", statusFilter === value ? "text-primary-foreground/70" : "text-muted-foreground/60")}>{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 overflow-y-auto px-3 md:px-5 py-3">
                {tasksLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : filteredTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                    <ListTodo className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm font-medium">Sin tareas</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      {statusFilter === "all" ? "Crea tu primera tarea." : `Sin tareas con estado "${STATUS_TABS.find(s => s.value === statusFilter)?.label}".`}
                    </p>
                    {statusFilter === "all" && <Button size="sm" variant="outline" onClick={() => setShowTaskForm(true)} className="mt-2 gap-1.5"><Plus className="w-4 h-4" />Crear tarea</Button>}
                  </div>
                ) : (
                  <div className="space-y-2 max-w-2xl">
                    <AnimatePresence>
                      {filteredTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onStatusChange={(s) => handleUpdateTask(task.id, { status: s })}
                          onDelete={() => deleteTask(task.id)}
                          onOpen={() => setIssueModalTaskId(task.id)}
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

          {/* ── Board view ── */}
          {viewMode === "board" && (
            <div className="flex-1 overflow-hidden">
              {tasksLoading || boardsLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <TaskBoard
                  tasks={boardTasks}
                  lists={selectedBoardLists}
                  onCreateTask={handleCreateTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={deleteTask}
                  onRecordActivity={async (event: Partial<ActivityEvent>) => { await recordActivity(event); }}
                />
              )}
            </div>
          )}
        </div>

        {/* ── AI Agent panel ── */}
        <AnimatePresence>
          {agentOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isMobile ? "100%" : 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className={cn(
                "shrink-0 overflow-hidden",
                isMobile && "absolute inset-0 z-40"
              )}
            >
              <PlannerAgent
                tasks={boardTasks}
                calendarEvents={calendarEvents}
                onClose={() => setAgentOpen(false)}
                onTasksChanged={refetchTasks}
                userName={firstName}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Issue detail modal (list + calendar views) */}
      <TaskIssueModal
        task={issueModalTask}
        open={!!issueModalTask}
        onOpenChange={(open) => { if (!open) setIssueModalTaskId(null); }}
        onUpdate={handleUpdateTask}
        onDelete={async (id) => { await deleteTask(id); setIssueModalTaskId(null); }}
        onCreateTask={handleCreateTask}
        allTasks={boardTasks}
      />
    </div>
  );
}
