// Profile-based template configuration for Latzu Platform
import type { ProfileType } from "@/types/user";
import {
  Home,
  MessageSquare,
  CalendarDays,
  Brain,
  Bot,
  type LucideIcon,
} from "lucide-react";

export interface TemplateConfig {
  primaryColor: string;
  accentColor: string;
  dashboardWidgets: WidgetConfig[];
  sidebarItems: SidebarItem[];
  chatPersonality: ChatPersonality;
  proactivePrompts: boolean;
  welcomeMessage: string;
  dashboardTitle: string;
}

export interface WidgetConfig {
  id: string;
  title: string;
  type: "learning-path" | "daily-goals" | "streaks" | "skills-radar" |
        "certifications" | "business-metrics" | "tasks" | "automations" |
        "assigned-training" | "team-progress" | "announcements" | "chat-preview" |
        "plans-summary";
  size: "small" | "medium" | "large";
  priority: number;
}

export interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export type ChatPersonality = "tutor" | "mentor" | "advisor" | "assistant";

export const profileTemplates: Record<ProfileType, TemplateConfig> = {
  estudiante: {
    primaryColor: "teal",
    accentColor: "amber",
    dashboardTitle: "Mi Vida",
    welcomeMessage: "Enfócate en tu tarea más importante de hoy.",
    chatPersonality: "tutor",
    proactivePrompts: true,
    dashboardWidgets: [
      { id: "daily-goals",   title: "Tareas de Hoy", type: "daily-goals",   size: "large",  priority: 1 },
      { id: "plans-summary", title: "Mis Metas",     type: "plans-summary", size: "medium", priority: 2 },
      { id: "chat-preview",  title: "IA Mentor",     type: "chat-preview",  size: "medium", priority: 3 },
    ],
    sidebarItems: [
      { id: "home",         label: "Hoy",          href: "/dashboard", icon: Home },
      { id: "brain",        label: "Mi conocimiento", href: "/brain",  icon: Brain },
      { id: "planning",     label: "Calendario",   href: "/planning",  icon: CalendarDays },
      { id: "chat",         label: "Chat",         href: "/chat",      icon: MessageSquare },
      { id: "agent",        label: "Agente",       href: "/agent",     icon: Bot },
    ],
  },

  aprendiz: {
    primaryColor: "violet",
    accentColor: "teal",
    dashboardTitle: "Mi Vida",
    welcomeMessage: "¡Hola! Soy tu mentor personal. ¿En qué trabajamos hoy?",
    chatPersonality: "mentor",
    proactivePrompts: true,
    dashboardWidgets: [
      { id: "daily-goals",   title: "Tareas de Hoy",    type: "daily-goals",   size: "large",  priority: 1 },
      { id: "plans-summary", title: "Mis Metas",        type: "plans-summary", size: "medium", priority: 2 },
      { id: "chat-preview",  title: "IA Mentor",        type: "chat-preview",  size: "medium", priority: 3 },
    ],
    sidebarItems: [
      { id: "home",         label: "Hoy",          href: "/dashboard", icon: Home },
      { id: "brain",        label: "Mi conocimiento", href: "/brain",  icon: Brain },
      { id: "planning",     label: "Calendario",   href: "/planning",  icon: CalendarDays },
      { id: "chat",         label: "Chat",         href: "/chat",      icon: MessageSquare },
      { id: "agent",        label: "Agente",       href: "/agent",     icon: Bot },
    ],
  },
};

// Get template for a profile type with fallback
export function getTemplate(profileType?: ProfileType): TemplateConfig {
  return profileType ? profileTemplates[profileType] : profileTemplates.estudiante;
}

// Get chat personality description
export function getChatPersonalityDescription(personality: ChatPersonality): string {
  const descriptions: Record<ChatPersonality, string> = {
    tutor: "Un tutor paciente y motivador que te guía paso a paso en tu aprendizaje",
    mentor: "Un mentor experimentado que te ayuda a desarrollar tu carrera profesional",
    advisor: "Un asesor estratégico que te ayuda a tomar decisiones de negocio",
    assistant: "Un asistente eficiente que te ayuda con tus tareas diarias",
  };
  return descriptions[personality];
}

// Get proactive prompts based on context
export function getProactivePrompts(profileType: ProfileType, context?: {
  lastActivity?: string;
  currentStreak?: number;
  recentTopics?: string[];
}): string[] {
  const basePrompts: Record<ProfileType, string[]> = {
    estudiante: [
      "¿Continuamos con la lección que dejaste pendiente?",
      "Basándome en tu progreso, te recomiendo practicar este tema...",
      "¡Tienes una racha de {streak} días! ¿Seguimos aprendiendo?",
      "Descubrí un concepto relacionado con lo que estudiaste ayer...",
    ],
    aprendiz: [
      "¿Continuamos con el tema que dejaste pendiente?",
      "He encontrado nuevo contenido relacionado con tus intereses...",
      "¡Tienes una racha de {streak} días! ¿Seguimos aprendiendo?",
      "Tengo una sugerencia basada en lo que exploraste ayer...",
    ],
  };

  let prompts = basePrompts[profileType];

  if (context?.currentStreak && context.currentStreak > 0) {
    prompts = prompts.map(p => p.replace("{streak}", String(context.currentStreak)));
  }

  return prompts;
}
