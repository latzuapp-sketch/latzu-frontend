"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";
import type { PlanningTask, CalendarEvent, CreateTaskInput } from "@/types/planning";
import { isSameDay, toDateString } from "@/hooks/usePlanning";
import { Plus, ExternalLink, CalendarDays } from "lucide-react";

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Google Calendar event colors mapping
const GCAL_COLORS: Record<string, string> = {
  "1": "bg-blue-500/20 border-blue-500/40 text-blue-300",
  "2": "bg-green-500/20 border-green-500/40 text-green-300",
  "3": "bg-purple-500/20 border-purple-500/40 text-purple-300",
  "4": "bg-red-500/20 border-red-500/40 text-red-300",
  "5": "bg-amber-500/20 border-amber-500/40 text-amber-300",
  "6": "bg-teal-500/20 border-teal-500/40 text-teal-300",
  "7": "bg-cyan-500/20 border-cyan-500/40 text-cyan-300",
  default: "bg-primary/20 border-primary/40 text-primary/90",
};

function gcalEventClass(colorId?: string | null) {
  return GCAL_COLORS[colorId ?? ""] ?? GCAL_COLORS.default;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

interface WeekViewProps {
  days: Date[];
  tasks: PlanningTask[];
  calendarEvents: CalendarEvent[];
  calendarConnected: boolean | null;
  onStatusChange: (id: string, status: PlanningTask["status"]) => void;
  onDelete: (id: string) => void;
  onCreateTask: (input: CreateTaskInput) => Promise<void>;
  onPushToCalendar: (task: PlanningTask) => Promise<void>;
}

export function WeekView({
  days,
  tasks,
  calendarEvents,
  calendarConnected,
  onStatusChange,
  onDelete,
  onCreateTask,
  onPushToCalendar,
}: WeekViewProps) {
  const [quickAddDay, setQuickAddDay] = useState<string | null>(null);
  const today = new Date();

  return (
    <div className="grid grid-cols-7 gap-0 h-full min-h-0 overflow-hidden border border-border/50 rounded-xl">
      {days.map((day, i) => {
        const dateStr = toDateString(day);
        const isToday = isSameDay(day, today);
        const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

        const dayTasks = tasks.filter(
          (t) => t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), day)
        );
        const dayEvents = calendarEvents.filter((e) => {
          try {
            const start = new Date(e.start);
            return isSameDay(start, day);
          } catch {
            return false;
          }
        });

        return (
          <div
            key={dateStr}
            className={cn(
              "flex flex-col border-r border-border/50 last:border-r-0 min-w-0",
              isToday && "bg-primary/3"
            )}
          >
            {/* Day header */}
            <div
              className={cn(
                "px-2 py-2 border-b border-border/50 text-center shrink-0",
                isToday && "bg-primary/10"
              )}
            >
              <p
                className={cn(
                  "text-xs font-medium",
                  isToday ? "text-primary" : "text-muted-foreground"
                )}
              >
                {DAY_LABELS[i]}
              </p>
              <div
                className={cn(
                  "text-sm font-bold mx-auto w-7 h-7 flex items-center justify-center rounded-full",
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : isPast
                    ? "text-muted-foreground/50"
                    : "text-foreground"
                )}
              >
                {day.getDate()}
              </div>
            </div>

            {/* Day content */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1 min-h-0">
              {/* GCal events */}
              {dayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className={cn(
                    "text-xs rounded-md px-1.5 py-1 border truncate leading-tight",
                    gcalEventClass(ev.colorId)
                  )}
                  title={ev.title}
                >
                  <div className="font-medium truncate">{ev.title}</div>
                  {!ev.allDay && (
                    <div className="text-[10px] opacity-70">{formatTime(ev.start)}</div>
                  )}
                </div>
              ))}

              {/* Tasks */}
              {dayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  compact
                  onStatusChange={(s) => onStatusChange(task.id, s)}
                  onDelete={() => onDelete(task.id)}
                  onPushToCalendar={
                    calendarConnected
                      ? () => onPushToCalendar(task)
                      : undefined
                  }
                  canPushToCalendar={!!calendarConnected}
                />
              ))}

              {/* Quick add */}
              <AnimatePresence>
                {quickAddDay === dateStr && (
                  <div className="mt-1">
                    <TaskForm
                      onSubmit={async (input) => {
                        await onCreateTask({ ...input, dueDate: dateStr });
                        setQuickAddDay(null);
                      }}
                      onClose={() => setQuickAddDay(null)}
                      defaultDate={dateStr}
                    />
                  </div>
                )}
              </AnimatePresence>

              {/* Add button */}
              {quickAddDay !== dateStr && (
                <button
                  onClick={() => setQuickAddDay(dateStr)}
                  className="w-full text-left text-xs text-muted-foreground/40 hover:text-muted-foreground py-1 px-1 rounded transition-colors flex items-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100"
                  style={{ opacity: dayTasks.length === 0 && dayEvents.length === 0 ? 0.3 : 0 }}
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Hover add button */}
            <div className="p-1 shrink-0 border-t border-border/20">
              <button
                onClick={() => setQuickAddDay(quickAddDay === dateStr ? null : dateStr)}
                className="w-full flex items-center justify-center py-0.5 rounded text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted/30 transition-all"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Compact event strip for "today" panel ────────────────────────────────────

export function TodayStrip({
  events,
  connected,
}: {
  events: CalendarEvent[];
  connected: boolean | null;
}) {
  const today = new Date();
  const todayEvents = events.filter((e) => {
    try {
      return isSameDay(new Date(e.start), today);
    } catch {
      return false;
    }
  });

  if (connected === false) return null;
  if (todayEvents.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
        Google Calendar — hoy
      </p>
      {todayEvents.map((ev) => (
        <div
          key={ev.id}
          className={cn(
            "flex items-start gap-2 text-xs rounded-lg px-2.5 py-2 border",
            gcalEventClass(ev.colorId)
          )}
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{ev.title}</p>
            {!ev.allDay && (
              <p className="text-[10px] opacity-70 mt-0.5">{formatTime(ev.start)}</p>
            )}
          </div>
          {ev.htmlLink && (
            <a
              href={ev.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
