"use client";

import { useRef, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TaskForm } from "./TaskForm";
import type { PlanningTask, CalendarEvent, CreateTaskInput, ABCDEPriority } from "@/types/planning";
import { isSameDay, toDateString } from "@/hooks/usePlanning";
import { Plus, ExternalLink, Clock, CheckCircle2, Circle } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_H = 60;           // px per hour
const START_H = 6;           // 6:00
const END_H = 22;            // 22:00
const HOURS = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);
const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// ─── Colors ───────────────────────────────────────────────────────────────────

const ABCDE_EVENT: Record<ABCDEPriority, string> = {
  A: "bg-red-500/25 border-l-[3px] border-red-500 text-red-200 hover:bg-red-500/35",
  B: "bg-orange-500/20 border-l-[3px] border-orange-500 text-orange-200 hover:bg-orange-500/30",
  C: "bg-amber-500/20 border-l-[3px] border-amber-500 text-amber-200 hover:bg-amber-500/30",
  D: "bg-muted/40 border-l-[3px] border-muted-foreground/40 text-muted-foreground hover:bg-muted/60",
  E: "bg-muted/20 border-l-[3px] border-muted-foreground/20 text-muted-foreground/50 hover:bg-muted/30",
};

const DEFAULT_EVENT = "bg-primary/20 border-l-[3px] border-primary text-primary/90 hover:bg-primary/30";

const GCAL_COLORS: Record<string, string> = {
  "1": "bg-blue-500/20 border-l-[3px] border-blue-500 text-blue-300 hover:bg-blue-500/30",
  "2": "bg-green-500/20 border-l-[3px] border-green-500 text-green-300 hover:bg-green-500/30",
  "3": "bg-purple-500/20 border-l-[3px] border-purple-500 text-purple-300 hover:bg-purple-500/30",
  "4": "bg-red-500/20 border-l-[3px] border-red-500 text-red-300 hover:bg-red-500/30",
  "5": "bg-yellow-500/20 border-l-[3px] border-yellow-500 text-yellow-300 hover:bg-yellow-500/30",
  "6": "bg-teal-500/20 border-l-[3px] border-teal-500 text-teal-300 hover:bg-teal-500/30",
  "7": "bg-cyan-500/20 border-l-[3px] border-cyan-500 text-cyan-300 hover:bg-cyan-500/30",
  "8": "bg-slate-500/20 border-l-[3px] border-slate-500 text-slate-300 hover:bg-slate-500/30",
  "9": "bg-blue-700/20 border-l-[3px] border-blue-700 text-blue-200 hover:bg-blue-700/30",
  "10": "bg-green-700/20 border-l-[3px] border-green-700 text-green-200 hover:bg-green-700/30",
  "11": "bg-red-700/20 border-l-[3px] border-red-700 text-red-200 hover:bg-red-700/30",
  default: "bg-primary/20 border-l-[3px] border-primary text-primary/90 hover:bg-primary/30",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeToY(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return ((h - START_H) + m / 60) * HOUR_H;
}

function isoToY(iso: string): number {
  const d = new Date(iso);
  const hhmm = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  return timeToY(hhmm);
}

function isoDurationH(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000;
}

function nowY(): number {
  const now = new Date();
  return ((now.getHours() - START_H) + now.getMinutes() / 60) * HOUR_H;
}

function formatHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

// ─── All-day chip (tasks without time) ───────────────────────────────────────

function AllDayChip({
  task,
  onStatusChange,
}: {
  task: PlanningTask;
  onStatusChange: (s: PlanningTask["status"]) => void;
}) {
  const abcde = task.abcdePriority;
  const cls = abcde ? ABCDE_EVENT[abcde] : DEFAULT_EVENT;
  const isDone = task.status === "done";

  return (
    <button
      onClick={() => onStatusChange(isDone ? "todo" : "done")}
      title={task.title}
      className={cn(
        "w-full text-left rounded px-1.5 py-0.5 text-[11px] font-medium truncate transition-all",
        cls,
        isDone && "opacity-50 line-through"
      )}
    >
      <span className="flex items-center gap-1">
        {isDone
          ? <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
          : <Circle className="w-2.5 h-2.5 shrink-0" />
        }
        {abcde && <span className="font-bold">{abcde}</span>}
        {task.title}
      </span>
    </button>
  );
}

// ─── Timed event block ────────────────────────────────────────────────────────

function TimedBlock({
  top,
  height,
  className,
  children,
}: {
  top: number;
  height: number;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute left-1 right-1 rounded overflow-hidden px-1.5 py-0.5 text-[11px] cursor-pointer transition-all z-10",
        className
      )}
      style={{ top, height: Math.max(height, 18) }}
    >
      {children}
    </div>
  );
}

// ─── Day column ───────────────────────────────────────────────────────────────

interface DayColumnProps {
  day: Date;
  index: number;
  tasks: PlanningTask[];
  events: CalendarEvent[];
  calendarConnected: boolean | null;
  onStatusChange: (id: string, s: PlanningTask["status"]) => void;
  onCreateTask: (input: CreateTaskInput) => Promise<void>;
}

function DayColumn({ day, index, tasks, events, onStatusChange, onCreateTask }: DayColumnProps) {
  const [quickAddSlot, setQuickAddSlot] = useState<string | null>(null);
  const dateStr = toDateString(day);
  const today = new Date();
  const isToday = isSameDay(day, today);
  const isPast = day < new Date(today.setHours(0, 0, 0, 0));

  const allDayTasks = tasks.filter(
    (t) => t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), day) && !t.dueTime
  );

  const timedTasks = tasks.filter(
    (t) => t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), day) && !!t.dueTime
  );

  const timedEvents = events.filter((e) => {
    if (e.allDay) return false;
    try { return isSameDay(new Date(e.start), day); } catch { return false; }
  });

  const allDayEvents = events.filter((e) => {
    if (!e.allDay) return false;
    try { return isSameDay(new Date(e.start), day); } catch { return false; }
  });

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (quickAddSlot) { setQuickAddSlot(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hour = Math.floor(y / HOUR_H) + START_H;
    const minute = Math.round(((y % HOUR_H) / HOUR_H) * 60 / 15) * 15;
    const hhmm = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    setQuickAddSlot(hhmm);
  };

  return (
    <div className={cn("flex flex-col min-w-0 border-r border-border/40 last:border-r-0", isToday && "bg-primary/[0.02]")}>
      {/* Day header */}
      <div className={cn("px-1 py-2 border-b border-border/40 text-center shrink-0", isToday && "bg-primary/8")}>
        <p className={cn("text-[11px] font-medium uppercase tracking-wide", isToday ? "text-primary" : "text-muted-foreground/70")}>
          {DAY_LABELS[index]}
        </p>
        <div className={cn(
          "text-base font-bold mx-auto w-8 h-8 flex items-center justify-center rounded-full mt-0.5",
          isToday ? "bg-primary text-primary-foreground" : isPast ? "text-muted-foreground/40" : "text-foreground"
        )}>
          {day.getDate()}
        </div>
      </div>

      {/* All-day row */}
      <div className="min-h-[36px] max-h-[80px] overflow-y-auto border-b border-border/30 px-1 py-1 space-y-0.5 shrink-0">
        {allDayEvents.map((ev) => (
          <div
            key={ev.id}
            className={cn("text-[11px] rounded px-1.5 py-0.5 truncate font-medium", GCAL_COLORS[ev.colorId ?? ""] ?? GCAL_COLORS.default)}
          >
            {ev.title}
          </div>
        ))}
        {allDayTasks.map((task) => (
          <AllDayChip key={task.id} task={task} onStatusChange={(s) => onStatusChange(task.id, s)} />
        ))}
      </div>

      {/* Time grid */}
      <div
        className="relative flex-1"
        style={{ height: HOURS.length * HOUR_H }}
        onClick={handleGridClick}
      >
        {/* Hour lines */}
        {HOURS.map((h, i) => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-border/20"
            style={{ top: i * HOUR_H }}
          />
        ))}

        {/* Half-hour dotted lines */}
        {HOURS.map((h, i) => (
          <div
            key={`h-${h}`}
            className="absolute left-0 right-0 border-t border-dashed border-border/10"
            style={{ top: i * HOUR_H + HOUR_H / 2 }}
          />
        ))}

        {/* Current time line */}
        {isToday && (() => {
          const y = nowY();
          return y >= 0 && y <= HOURS.length * HOUR_H ? (
            <div
              className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
              style={{ top: y }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 -ml-1" />
              <div className="flex-1 h-px bg-red-500/80" />
            </div>
          ) : null;
        })()}

        {/* Timed GCal events */}
        {timedEvents.map((ev) => {
          const top = isoToY(ev.start);
          const dh = isoDurationH(ev.start, ev.end);
          const height = Math.max(dh * HOUR_H, 20);
          if (top < 0 || top > HOURS.length * HOUR_H) return null;
          const cls = GCAL_COLORS[ev.colorId ?? ""] ?? GCAL_COLORS.default;
          return (
            <TimedBlock key={ev.id} top={top} height={height} className={cls}>
              <p className="font-medium truncate leading-tight">{ev.title}</p>
              <p className="text-[9px] opacity-70">{formatEventTime(ev.start)}</p>
              {ev.htmlLink && (
                <a href={ev.htmlLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="w-2.5 h-2.5 absolute top-1 right-1 opacity-50 hover:opacity-100" />
                </a>
              )}
            </TimedBlock>
          );
        })}

        {/* Timed tasks */}
        {timedTasks.map((task) => {
          if (!task.dueTime) return null;
          const top = timeToY(task.dueTime);
          if (top < 0 || top > HOURS.length * HOUR_H) return null;
          const cls = task.abcdePriority ? ABCDE_EVENT[task.abcdePriority] : DEFAULT_EVENT;
          const isDone = task.status === "done";
          return (
            <TimedBlock key={task.id} top={top} height={HOUR_H * 0.8} className={cn(cls, isDone && "opacity-50")}>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, isDone ? "todo" : "done"); }}
                  className="shrink-0"
                >
                  {isDone
                    ? <CheckCircle2 className="w-2.5 h-2.5" />
                    : <Circle className="w-2.5 h-2.5" />
                  }
                </button>
                {task.abcdePriority && <span className="font-bold shrink-0">{task.abcdePriority}</span>}
                <p className={cn("truncate font-medium", isDone && "line-through")}>{task.title}</p>
              </div>
              <p className="text-[9px] opacity-70 flex items-center gap-0.5">
                <Clock className="w-2 h-2" />
                {task.dueTime}
              </p>
            </TimedBlock>
          );
        })}

        {/* Quick add form */}
        <AnimatePresence>
          {quickAddSlot && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute left-0 right-0 z-30 bg-background border border-border rounded-xl shadow-xl"
              style={{ top: timeToY(quickAddSlot) }}
              onClick={(e) => e.stopPropagation()}
            >
              <TaskForm
                onSubmit={async (input) => {
                  await onCreateTask({ ...input, dueDate: dateStr, dueTime: quickAddSlot });
                  setQuickAddSlot(null);
                }}
                onClose={() => setQuickAddSlot(null)}
                defaultDate={dateStr}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover add button (shown when empty) */}
        {!quickAddSlot && (
          <button
            onClick={(e) => { e.stopPropagation(); setQuickAddSlot(`${String(9).padStart(2,"0")}:00`); }}
            className="absolute bottom-1 right-1 p-1 rounded text-muted-foreground/20 hover:text-muted-foreground/60 hover:bg-muted/40 transition-all opacity-0 hover:opacity-100"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main CalendarGrid ────────────────────────────────────────────────────────

interface CalendarGridProps {
  days: Date[];
  tasks: PlanningTask[];
  calendarEvents: CalendarEvent[];
  calendarConnected: boolean | null;
  onStatusChange: (id: string, status: PlanningTask["status"]) => void;
  onCreateTask: (input: CreateTaskInput) => Promise<void>;
  onPushToCalendar: (task: PlanningTask) => Promise<void>;
}

export function CalendarGrid({
  days,
  tasks,
  calendarEvents,
  calendarConnected,
  onStatusChange,
  onCreateTask,
}: CalendarGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to current time or 8:00 on mount
  useEffect(() => {
    const y = Math.max(0, (8 - START_H) * HOUR_H - 60);
    scrollRef.current?.scrollTo({ top: y, behavior: "instant" });
  }, []);

  return (
    <div className="flex flex-col h-full border border-border/40 rounded-xl overflow-hidden">
      {/* Column headers (sticky) */}
      <div className="flex shrink-0 border-b border-border/40 bg-background/95 backdrop-blur-sm z-10">
        {/* Time gutter */}
        <div className="w-12 shrink-0 border-r border-border/30" />
        {/* Day headers */}
        {days.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

          // All-day items count
          const allDayCount = tasks.filter(
            (t) => t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), day) && !t.dueTime
          ).length;

          return (
            <div key={i} className="flex-1 px-1 py-2 text-center border-r border-border/30 last:border-r-0">
              <p className={cn("text-[11px] font-medium uppercase tracking-wide", isToday ? "text-primary" : "text-muted-foreground/70")}>
                {DAY_LABELS[i]}
              </p>
              <div className={cn(
                "text-base font-bold mx-auto w-8 h-8 flex items-center justify-center rounded-full",
                isToday ? "bg-primary text-primary-foreground" : isPast ? "text-muted-foreground/40" : "text-foreground"
              )}>
                {day.getDate()}
              </div>
              {allDayCount > 0 && (
                <div className={cn("text-[9px] font-semibold rounded-full px-1.5 py-0.5 mx-auto w-fit", isToday ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                  {allDayCount} {allDayCount === 1 ? "tarea" : "tareas"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex">
          {/* Time gutter */}
          <div className="w-12 shrink-0 border-r border-border/30 relative" style={{ height: HOURS.length * HOUR_H }}>
            {HOURS.map((h, i) => (
              <div key={h} className="absolute right-0 pr-1.5" style={{ top: i * HOUR_H - 7 }}>
                <span className="text-[10px] text-muted-foreground/50 tabular-nums">{formatHour(h)}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex flex-1">
            {days.map((day, i) => (
              <div key={i} className="flex-1 min-w-0">
                <DayColumn
                  day={day}
                  index={i}
                  tasks={tasks}
                  events={calendarEvents}
                  calendarConnected={calendarConnected}
                  onStatusChange={onStatusChange}
                  onCreateTask={onCreateTask}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
