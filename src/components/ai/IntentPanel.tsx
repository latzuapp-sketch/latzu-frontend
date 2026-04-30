"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Tag,
  Link2,
  FolderPlus,
  FolderInput,
  Eye,
  Archive,
  Check,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAgentIntents, useIntentActions } from "@/hooks/useOrganizerAgent";
import type { AgentIntent, AgentIntentType } from "@/graphql/types";

// ─── Icon map by intent type ──────────────────────────────────────────────────

const INTENT_ICONS: Record<AgentIntentType, React.ElementType> = {
  tag_node: Tag,
  link_nodes: Link2,
  create_workspace: FolderPlus,
  move_to_workspace: FolderInput,
  surface_connection: Eye,
  archive_stale: Archive,
};

const RISK_COLORS: Record<string, string> = {
  low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  high: "text-red-400 bg-red-400/10 border-red-400/20",
};

const RISK_LABELS: Record<string, string> = {
  low: "Auto",
  medium: "Review",
  high: "Confirm",
};

// ─── Single intent card ───────────────────────────────────────────────────────

function IntentCard({
  intent,
  onApprove,
  onDismiss,
}: {
  intent: AgentIntent;
  onApprove: (id: string) => Promise<boolean>;
  onDismiss: (id: string) => Promise<boolean>;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const Icon = INTENT_ICONS[intent.type] ?? Sparkles;

  const handleApprove = async () => {
    setBusy(true);
    const ok = await onApprove(intent.id);
    setBusy(false);
    if (ok) setDone(true);
  };

  const handleDismiss = async () => {
    setBusy(true);
    await onDismiss(intent.id);
    setBusy(false);
    setDone(true);
  };

  if (done) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 space-y-2"
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-md bg-violet-500/15 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-white/90 leading-snug">
              {intent.title}
            </p>
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded border leading-none",
                RISK_COLORS[intent.risk]
              )}
            >
              {RISK_LABELS[intent.risk]}
            </span>
          </div>
          {intent.description && (
            <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
              {intent.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 pl-9">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs text-white/60 hover:text-white hover:bg-white/[0.06]"
          onClick={handleDismiss}
          disabled={busy}
        >
          <X className="w-3 h-3 mr-1" />
          Skip
        </Button>
        <Button
          size="sm"
          className="h-6 px-2 text-xs bg-violet-600/80 hover:bg-violet-600 text-white border-0"
          onClick={handleApprove}
          disabled={busy}
        >
          <Check className="w-3 h-3 mr-1" />
          Apply
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface IntentPanelProps {
  className?: string;
}

export function IntentPanel({ className }: IntentPanelProps) {
  const { intents, loading, refetch } = useAgentIntents("pending");
  const { approve, dismiss, triggerReflection } = useIntentActions();
  const [collapsed, setCollapsed] = useState(false);

  const pending = intents.filter((i) => i.status === "pending");

  if (!loading && pending.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-white/[0.06] bg-white/[0.02] p-3",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400/60" />
            <span className="text-xs text-white/40">
              Organizer al día
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white/30 hover:text-white/60"
            onClick={() => triggerReflection().then(() => refetch())}
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.08] bg-white/[0.025]",
        className
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-violet-400" />
          </div>
          <span className="text-xs font-semibold text-white/80">
            Organizador
          </span>
          {pending.length > 0 && (
            <span className="text-[10px] font-bold bg-violet-500/30 text-violet-300 px-1.5 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-white/30 hover:text-white/60"
            onClick={(e) => {
              e.stopPropagation();
              triggerReflection().then(() => refetch());
            }}
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          {collapsed ? (
            <ChevronDown className="w-3.5 h-3.5 text-white/40" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-white/40" />
          )}
        </div>
      </div>

      {/* Intent list */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {loading && pending.length === 0 && (
                <p className="text-xs text-white/40 py-2 text-center">
                  Analizando tu workspace…
                </p>
              )}
              <AnimatePresence>
                {pending.map((intent) => (
                  <IntentCard
                    key={intent.id}
                    intent={intent}
                    onApprove={approve}
                    onDismiss={dismiss}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
