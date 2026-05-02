"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  ListChecks,
  List,
  RefreshCw,
  BookOpen,
  Search,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolCall } from "@/graphql/types";

interface AgentActionCardProps {
  action: ToolCall;
  isPending?: boolean;
}

// ─── Label builders ───────────────────────────────────────────────────────────

function getPendingLabel(toolName: string, args: Record<string, unknown>): string {
  switch (toolName) {
    case "create_task":
      return `Creando tarea: "${(args.title as string) || "..."}"`;
    case "create_multiple_tasks":
      return "Creando tareas...";
    case "list_tasks":
      return "Consultando tareas...";
    case "update_task":
      return "Actualizando tarea...";
    case "create_knowledge_node":
      return `Guardando en conocimiento: "${(args.name as string) || "..."}"`;
    case "search_knowledge":
      return `Buscando: "${(args.query as string) || "..."}"`;
    default:
      return `${toolName}...`;
  }
}

function getLabel(action: ToolCall): string {
  const { toolName, args, result } = action;
  switch (toolName) {
    case "create_task": {
      const title = (args.title as string) || "tarea";
      return `Crear tarea: "${title}"`;
    }
    case "create_multiple_tasks": {
      const count = (result.created_count as number) ?? 0;
      return `Crear ${count} tarea${count !== 1 ? "s" : ""}`;
    }
    case "list_tasks": {
      const total = (result.total as number) ?? 0;
      const statusFilter = args.status ? ` (${args.status})` : "";
      return `Consultar tareas${statusFilter} — ${total} encontrada${total !== 1 ? "s" : ""}`;
    }
    case "update_task": {
      const updates: string[] = [];
      if (args.status) updates.push(`estado → ${args.status}`);
      if (args.priority) updates.push(`prioridad → ${args.priority}`);
      if (args.title) updates.push(`título → "${args.title}"`);
      return `Actualizar tarea${updates.length ? `: ${updates.join(", ")}` : ""}`;
    }
    case "create_knowledge_node": {
      const name = (args.name as string) || "nodo";
      return `Agregar al conocimiento: "${name}"`;
    }
    case "search_knowledge": {
      const query = (args.query as string) || "";
      const total = (result.total as number) ?? 0;
      return `Buscar: "${query}" — ${total} resultado${total !== 1 ? "s" : ""}`;
    }
    default:
      return toolName;
  }
}

function getIcon(toolName: string) {
  switch (toolName) {
    case "create_task":
      return CheckSquare;
    case "create_multiple_tasks":
      return ListChecks;
    case "list_tasks":
      return List;
    case "update_task":
      return RefreshCw;
    case "create_knowledge_node":
      return BookOpen;
    case "search_knowledge":
      return Search;
    default:
      return Zap;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

function AgentActionCardComponent({ action, isPending = false }: AgentActionCardProps) {
  const router = useRouter();
  const label = isPending
    ? getPendingLabel(action.toolName, (action.args ?? {}) as Record<string, unknown>)
    : getLabel(action);
  const Icon = getIcon(action.toolName);
  const isError = !isPending && action.status === "error";

  const args = (action.args ?? {}) as Record<string, unknown>;
  const planId = !isPending && !isError
    ? (args.plan_id as string | undefined) ?? (action.result as Record<string, unknown>)?.plan_id as string | undefined
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className="mr-auto"
    >
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs",
          "border bg-muted/40 text-muted-foreground",
          isError
            ? "border-destructive/30 bg-destructive/5 text-destructive"
            : isPending
            ? "border-primary/30 bg-primary/5"
            : "border-primary/20 bg-primary/5"
        )}
      >
        {/* Tool icon */}
        <div
          className={cn(
            "flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center",
            isError ? "bg-destructive/15" : "bg-primary/15"
          )}
        >
          <Icon className={cn("w-3.5 h-3.5", isError ? "text-destructive" : "text-primary")} />
        </div>

        {/* Label */}
        <span className="flex-1 min-w-0 truncate font-medium">{label}</span>

        {/* "Ver plan" button — only when tasks were created for a specific plan */}
        {planId && (
          <button
            onClick={() => router.push(`/plans/${planId}`)}
            className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors px-1.5 py-0.5 rounded-md hover:bg-primary/10"
          >
            Ver plan
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        )}

        {/* Status */}
        <div className="flex-shrink-0">
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
          ) : isError ? (
            <XCircle className="w-3.5 h-3.5 text-destructive" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

export const AgentActionCard = memo(AgentActionCardComponent);
