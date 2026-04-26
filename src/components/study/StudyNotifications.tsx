"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { aiClient } from "@/lib/apollo";
import { GET_STUDY_NOTIFICATIONS, MARK_NOTIFICATIONS_READ } from "@/graphql/ai/operations";
import { Bell, BellRing, X, Lightbulb, AlertCircle, Trophy, TrendingUp, Settings2 } from "lucide-react";

const TYPE_META: Record<string, { icon: typeof Bell; color: string }> = {
  insight:     { icon: Lightbulb,   color: "text-amber-400" },
  reminder:    { icon: BellRing,    color: "text-blue-400"  },
  achievement: { icon: Trophy,      color: "text-emerald-400" },
  prediction:  { icon: TrendingUp,  color: "text-purple-400" },
  adapt:       { icon: Settings2,   color: "text-rose-400" },
};

export function StudyNotifications() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const { data, refetch } = useQuery(GET_STUDY_NOTIFICATIONS, {
    client: aiClient,
    variables: { unreadOnly: false, limit: 15 },
    fetchPolicy: "cache-and-network",
    skip: !session?.user,
  });

  const [markRead] = useMutation(MARK_NOTIFICATIONS_READ, {
    client: aiClient,
    onCompleted: () => refetch(),
  });

  const notifications: Array<{
    id: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
  }> = data?.studyNotifications ?? [];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpen = () => {
    setOpen(true);
    if (unreadCount > 0) markRead();
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("es-ES", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  return (
    <div className="relative">
      <button
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className={cn(
          "relative p-1.5 rounded-lg border transition-colors",
          open
            ? "bg-primary/10 border-primary/30 text-primary"
            : "border-border/50 text-muted-foreground hover:text-foreground"
        )}
        title="Notificaciones de estudio"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 z-50 w-80 bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <p className="text-sm font-semibold">Notificaciones</p>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border/30">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Sin notificaciones aún
                  </div>
                ) : (
                  notifications.map((n) => {
                    const meta = TYPE_META[n.type] ?? TYPE_META.insight;
                    const Icon = meta.icon;
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 transition-colors",
                          !n.read && "bg-primary/3"
                        )}
                      >
                        <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", meta.color)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-relaxed text-foreground/90">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                        </div>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
