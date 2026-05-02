"use client";

/**
 * UpcomingEventsWidget — list of agent-scheduled events the user has on deck.
 *
 * Shows up to 5 next events with kind icon, time-until, snooze + cancel actions.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock, X, Clock, BookOpen, Zap, Bell, RefreshCw,
  MessageCircle, Mail,
} from "lucide-react";
import { useUpcomingEvents, useSchedulerMutations } from "@/hooks/useScheduler";
import type { ScheduledEvent, ScheduledEventKind, DeliveryChannel } from "@/graphql/types";
import { parseDeliveredVia } from "@/graphql/types";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<ScheduledEventKind, React.ElementType> = {
  study_session: BookOpen,
  review_session: RefreshCw,
  focus_block: Zap,
  reminder: Bell,
  check_in: Clock,
};

const KIND_COLOR: Record<ScheduledEventKind, string> = {
  study_session: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  review_session: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  focus_block: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  reminder: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  check_in: "text-pink-400 bg-pink-500/10 border-pink-500/30",
};

const KIND_LABEL: Record<ScheduledEventKind, string> = {
  study_session: "Estudio",
  review_session: "Repaso",
  focus_block: "Foco",
  reminder: "Recordatorio",
  check_in: "Check-in",
};

const CHANNEL_META: Record<DeliveryChannel, { Icon: React.ElementType; label: string; color: string }> = {
  whatsapp: { Icon: MessageCircle, label: "WhatsApp", color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" },
  email:    { Icon: Mail,          label: "Email",    color: "text-violet-300 bg-violet-500/10 border-violet-500/30" },
};

function ChannelChip({ channel, sent }: { channel: DeliveryChannel; sent: boolean }) {
  const meta = CHANNEL_META[channel];
  if (!meta) return null;
  const { Icon, label, color } = meta;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[9px] font-medium px-1 py-0 rounded border leading-none h-4",
        color,
        !sent && "opacity-50"
      )}
      title={sent ? `${label} · enviado` : `${label} · pendiente`}
    >
      <Icon className="w-2.5 h-2.5" />
      {label}
      {sent && <span className="text-[9px]">✓</span>}
    </span>
  );
}

function timeUntil(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = then - Date.now();
  const absMin = Math.round(Math.abs(diffMs) / 60000);
  const past = diffMs < 0;

  if (absMin < 1) return past ? "ahora" : "ya";
  if (absMin < 60) return past ? `hace ${absMin}m` : `en ${absMin}m`;

  const absHr = Math.round(absMin / 60);
  if (absHr < 24) return past ? `hace ${absHr}h` : `en ${absHr}h`;

  const absD = Math.round(absHr / 24);
  if (absD < 7) return past ? `hace ${absD}d` : `en ${absD}d`;

  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

interface UpcomingEventsWidgetProps {
  limit?: number;
  className?: string;
}

export function UpcomingEventsWidget({ limit = 5, className }: UpcomingEventsWidgetProps) {
  const { events, loading } = useUpcomingEvents({ daysAhead: 7, limit: 20 });
  const { cancel, snooze, loading: mutating } = useSchedulerMutations();

  const visible = useMemo(
    () => events.filter((e) => e.status !== "cancelled").slice(0, limit),
    [events, limit]
  );

  if (loading && visible.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-border/40 bg-card/40 p-4 h-32 animate-pulse", className)} />
    );
  }

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className={cn("rounded-2xl border border-border/40 bg-card/40 overflow-hidden", className)}>
      <div className="px-4 py-2.5 border-b border-border/30 flex items-center gap-2">
        <CalendarClock className="w-3.5 h-3.5 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-1">
          Próximamente
        </p>
        <span className="text-[10px] text-muted-foreground">{visible.length}</span>
      </div>
      <ul className="divide-y divide-border/30">
        {visible.map((event) => (
          <UpcomingRow
            key={event.id}
            event={event}
            mutating={mutating}
            onCancel={() => cancel(event.id)}
            onSnooze={() => snooze(event.id, 15)}
          />
        ))}
      </ul>
    </div>
  );
}

function UpcomingRow({
  event, mutating, onCancel, onSnooze,
}: {
  event: ScheduledEvent;
  mutating: boolean;
  onCancel: () => void;
  onSnooze: () => void;
}) {
  const Icon = KIND_ICON[event.kind];
  const color = KIND_COLOR[event.kind];
  const isPast = new Date(event.scheduledAt).getTime() < Date.now();
  const deliveredVia = parseDeliveredVia(event.deliveredVia);
  const channels: DeliveryChannel[] = event.channels ?? [];

  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 px-4 py-3 group"
    >
      <div className={cn("w-7 h-7 rounded-lg border flex items-center justify-center shrink-0", color)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">
            {KIND_LABEL[event.kind]}
          </span>
          {event.createdBy === "agent" && (
            <span className="text-[9px] text-primary/70">· por tu agente</span>
          )}
          {event.snoozedCount > 0 && (
            <span className="text-[9px] text-amber-400/80">· snoozed {event.snoozedCount}×</span>
          )}
        </div>
        <p className="text-sm font-medium leading-snug truncate">{event.title}</p>
        <div className="flex items-center gap-2 mt-0.5 text-[11px]">
          <span className={cn("font-medium", isPast ? "text-rose-400" : "text-foreground/70")}>
            {timeUntil(event.scheduledAt)}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-muted-foreground/70 font-mono">{clockTime(event.scheduledAt)}</span>
          {event.durationMinutes && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span className="text-muted-foreground/70">{event.durationMinutes}min</span>
            </>
          )}
        </div>
        {channels.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {channels.map((c) => (
              <ChannelChip key={c} channel={c} sent={!!deliveredVia[c]?.ok} />
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onSnooze}
          disabled={mutating}
          className="p-1 rounded-md text-muted-foreground hover:text-amber-400 hover:bg-muted/30 transition-colors disabled:opacity-50"
          title="Posponer 15 min"
        >
          <Clock className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onCancel}
          disabled={mutating}
          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted/30 transition-colors disabled:opacity-50"
          title="Cancelar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.li>
  );
}
