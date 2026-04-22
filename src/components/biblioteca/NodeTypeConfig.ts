/**
 * Visual configuration for KnowledgeNode types.
 * Maps type strings returned by the AI backend to icons, labels and colors.
 */
import {
  Brain,
  Box,
  User,
  Calendar,
  MapPin,
  Package,
  Lightbulb,
  ArrowRight,
  Puzzle,
  BookOpen,
  Circle,
  Layers,
  type LucideIcon,
} from "lucide-react";

export interface NodeTypeConfig {
  label: string;
  Icon: LucideIcon;
  /** Tailwind color classes: bg, text, border */
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const TYPE_CONFIG: Record<string, NodeTypeConfig> = {
  Concept: {
    label: "Concepto",
    Icon: Brain,
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    dot: "bg-blue-400",
  },
  Entity: {
    label: "Entidad",
    Icon: Box,
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  Character: {
    label: "Personaje",
    Icon: User,
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    border: "border-violet-500/30",
    dot: "bg-violet-400",
  },
  Event: {
    label: "Evento",
    Icon: Calendar,
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
    dot: "bg-orange-400",
  },
  Place: {
    label: "Lugar",
    Icon: MapPin,
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    border: "border-teal-500/30",
    dot: "bg-teal-400",
  },
  Object: {
    label: "Objeto",
    Icon: Package,
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/30",
    dot: "bg-slate-400",
  },
  Principle: {
    label: "Principio",
    Icon: Lightbulb,
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
  },
  Step: {
    label: "Paso",
    Icon: ArrowRight,
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    border: "border-sky-500/30",
    dot: "bg-sky-400",
  },
  Component: {
    label: "Componente",
    Icon: Puzzle,
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    border: "border-pink-500/30",
    dot: "bg-pink-400",
  },
  Term: {
    label: "Término",
    Icon: BookOpen,
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/30",
    dot: "bg-indigo-400",
  },
  Subject: {
    label: "Sujeto",
    Icon: Circle,
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
  },
};

const FALLBACK: NodeTypeConfig = {
  label: "Nodo",
  Icon: Layers,
  bg: "bg-muted/50",
  text: "text-muted-foreground",
  border: "border-border",
  dot: "bg-muted-foreground",
};

export function getNodeTypeConfig(type: string): NodeTypeConfig {
  return TYPE_CONFIG[type] ?? FALLBACK;
}

export { TYPE_CONFIG };
