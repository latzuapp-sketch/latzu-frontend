"use client";

/**
 * NotionSidebar — full-app sidebar that mimics Notion's sidebar visually.
 *
 * Layout:
 *   ┌────────────────────────────┐
 *   │ Workspace switcher          │  user name + avatar + collapse chevron
 *   ├────────────────────────────┤
 *   │ ▢ Buscar           ⌘K      │  quick action rows
 *   │ ✦ Latzu AI                  │
 *   │ ✉ Inbox            ●3      │
 *   │ ⚙ Configuración             │
 *   ├────────────────────────────┤
 *   │ MI CONOCIMIENTO        ▾   │  collapsible section header
 *   │  ▸ Mentor                  │  one-line items
 *   │  ▸ Hoy                     │
 *   │  ▾ Mi contenido            │  expandable parent with children
 *   │     · Planes      3        │
 *   │     · Metas       2        │
 *   │     · Tareas      14       │
 *   │     ...                    │
 *   ├────────────────────────────┤
 *   │ SPACES                ▾   │
 *   │  · Universidad             │
 *   │  · Personal                │
 *   ├────────────────────────────┤
 *   │ ⌫ Papelera                  │
 *   │ ⏻ Cerrar sesión             │
 *   └────────────────────────────┘
 *
 * Items navigate via URL searchParams to /brain, e.g. `/brain?kind=plans` or
 * `/brain?kind=workspace&id=...&title=...`. /brain reads the params and sets
 * its internal selection. This means the sidebar drives the whole app.
 */

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronRight, Search, Sparkles, Inbox, Settings,
  Plus, Trash2, LogOut, Sun, Moon, Layers, GraduationCap,
  Lightbulb, Target, Flag, ListTodo, StickyNote, Folder, Layers3,
  ClipboardCheck, BookOpen, Compass, type LucideIcon,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useUserStore, useIsGuest } from "@/stores/userStore";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { useAgentActions } from "@/hooks/useOrganizerAgent";
import { cn } from "@/lib/utils";

export const NOTION_SIDEBAR_WIDTH = 248;

// ─── URL helpers ─────────────────────────────────────────────────────────────

function brainHref(params: Record<string, string>): string {
  const usp = new URLSearchParams(params);
  return `/brain?${usp.toString()}`;
}

// ─── Primitives ──────────────────────────────────────────────────────────────

function Row({
  icon: Icon, label, count, href, active, onClick, indent = 0, trailing,
}: {
  icon?: LucideIcon | null;
  label: string;
  count?: number;
  href?: string;
  active?: boolean;
  onClick?: () => void;
  indent?: number;
  trailing?: ReactNode;
}) {
  const cls = cn(
    "group w-full flex items-center gap-1.5 h-7 rounded-[4px] text-[13px] leading-none transition-colors",
    "text-foreground/75 hover:bg-foreground/[0.06]",
    active && "bg-foreground/[0.08] text-foreground",
  );
  const padLeft = `${0.375 + indent * 0.875}rem`;
  const inner = (
    <>
      {Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70" strokeWidth={1.75} />
      ) : (
        <span className="w-3.5 shrink-0" />
      )}
      <span className="truncate flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[11px] text-muted-foreground/50 mr-1">{count}</span>
      )}
      {trailing}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls} style={{ paddingLeft: padLeft, paddingRight: "0.375rem" }}>
        {inner}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls} style={{ paddingLeft: padLeft, paddingRight: "0.375rem" }}>
      {inner}
    </button>
  );
}

function Section({
  label, defaultOpen = true, children, action,
}: {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
  action?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="px-1.5 mt-3">
      <div className="group flex items-center gap-1 px-1.5 h-6 select-none">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <ChevronRight
            className={cn("w-3 h-3 transition-transform duration-150", open && "rotate-90")}
            strokeWidth={2}
          />
          {label}
        </button>
        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          {action}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="space-y-px">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Expandable({
  icon: Icon, label, indent = 0, defaultOpen = false, children, active, onClick,
}: {
  icon?: LucideIcon;
  label: string;
  indent?: number;
  defaultOpen?: boolean;
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const padLeft = `${0.375 + indent * 0.875}rem`;
  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1.5 h-7 rounded-[4px] text-[13px] leading-none transition-colors",
          "text-foreground/75 hover:bg-foreground/[0.06]",
          active && "bg-foreground/[0.08] text-foreground",
        )}
        style={{ paddingLeft: padLeft, paddingRight: "0.375rem" }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          className="w-4 h-4 flex items-center justify-center rounded hover:bg-foreground/[0.08] shrink-0"
        >
          <ChevronRight
            className={cn("w-3 h-3 text-muted-foreground/70 transition-transform duration-150", open && "rotate-90")}
            strokeWidth={2}
          />
        </button>
        <button onClick={onClick} className="flex items-center gap-1.5 flex-1 min-w-0 text-left">
          {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground/70" strokeWidth={1.75} />}
          <span className="truncate">{label}</span>
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="space-y-px">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sidebar body ────────────────────────────────────────────────────────────

interface SidebarBodyProps {
  onItemClick?: () => void;
  onOpenSearch?: () => void;
  onOpenChat?: () => void;
}

function SidebarBody({ onItemClick, onOpenSearch, onOpenChat }: SidebarBodyProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { workspaces } = useWorkspaces();
  const { actions: pendingProposals } = useAgentActions({ status: "pending", limit: 20 });
  const { theme, setTheme } = useTheme();
  const isGuest = useIsGuest();
  const disableGuestMode = useUserStore((state) => state.disableGuestMode);

  const inboxCount = useMemo(
    () => pendingProposals.filter((a) => a.visibility !== "silent" && a.type !== "clarification_question").length,
    [pendingProposals],
  );

  const currentWorkspaceId = pathname === "/brain"
    && searchParams.get("kind") === "workspace"
    ? searchParams.get("id") ?? null
    : null;

  const isActive = (path: string) => pathname === path;
  const userName = session?.user?.name || (isGuest ? "Invitado" : "Latzu");
  const initial = (userName || "L").charAt(0).toUpperCase();

  const handleSignOut = () => {
    if (isGuest) {
      disableGuestMode();
      router.push("/");
    } else {
      signOut({ callbackUrl: "/" });
    }
  };

  return (
    <div className="flex flex-col h-full text-foreground">
      {/* Workspace switcher */}
      <div className="px-2 pt-2 pb-1 shrink-0">
        <button
          className="group w-full flex items-center gap-2 h-8 px-2 rounded-[4px] text-[13px] hover:bg-foreground/[0.06]"
          onClick={onItemClick}
        >
          <div className="w-5 h-5 rounded-sm bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden">
            {session?.user?.image ? (
              <Image src={session.user.image} alt="" width={20} height={20} className="w-5 h-5" />
            ) : (
              initial
            )}
          </div>
          <span className="font-semibold truncate flex-1 text-left">{userName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100" strokeWidth={2} />
        </button>
      </div>

      {/* Quick actions */}
      <div className="px-1.5 space-y-px shrink-0">
        <Row icon={Search} label="Buscar" onClick={onOpenSearch} trailing={
          <span className="text-[10px] text-muted-foreground/50 font-mono">⌘K</span>
        } />
        <Row icon={Sparkles} label="Latzu AI" onClick={onOpenChat} />
        <Row icon={Inbox} label="Inbox" href="/brain" active={isActive("/brain")}
             trailing={inboxCount > 0 ? (
               <span className="ml-auto h-4 min-w-[16px] px-1 rounded-full bg-primary/80 text-white text-[10px] font-semibold flex items-center justify-center">
                 {inboxCount > 99 ? "99+" : inboxCount}
               </span>
             ) : undefined} />
        <Row icon={Settings} label="Configuración" href="/settings" />
      </div>

      {/* Tree sections */}
      <div className="flex-1 overflow-y-auto pb-2 mt-1">
        <Section label="Mi conocimiento" defaultOpen={true}>
          <Row icon={Sparkles} label="Hoy" href="/brain" active={isActive("/brain")} indent={1} />

          <Expandable icon={Layers} label="Mi contenido" indent={1} defaultOpen={true}>
            <Row icon={Target}     label="Planes"   href="/brain/plans"   active={isActive("/brain/plans")}   indent={2.5} />
            <Row icon={Flag}       label="Metas"    href="/brain/goals"   active={isActive("/brain/goals")}   indent={2.5} />
            <Row icon={ListTodo}   label="Tareas"   href="/brain/tasks"   active={isActive("/brain/tasks")}   indent={2.5} />
            <Row icon={StickyNote} label="Notas"    href="/brain/notes"   active={isActive("/brain/notes")}   indent={2.5} />
            <Row icon={Folder}     label="Archivos" href="/brain/files"   active={isActive("/brain/files")}   indent={2.5} />
            <Row icon={Layers}     label="Spaces"   href="/brain/spaces"  active={isActive("/brain/spaces")}  indent={2.5} />
          </Expandable>

          <Expandable icon={GraduationCap} label="Estudio" indent={1}>
            <Row icon={Layers3}        label="Flashcards" href="/brain/flashcards" active={isActive("/brain/flashcards")} indent={2.5} />
            <Row icon={ClipboardCheck} label="Quizzes"    href="/brain/quizzes"    active={isActive("/brain/quizzes")}    indent={2.5} />
            <Row icon={BookOpen}       label="Lecturas"   href="/brain/readings"   active={isActive("/brain/readings")}   indent={2.5} />
          </Expandable>

          <Expandable icon={Lightbulb} label="Conocimiento" indent={1}>
            <Row icon={Lightbulb} label="Conceptos" href="/brain/concepts" active={isActive("/brain/concepts")} indent={2.5} />
          </Expandable>
        </Section>

        {workspaces.length > 0 && (
          <Section
            label="Spaces"
            defaultOpen={true}
            action={
              <Plus
                className="w-3 h-3 text-muted-foreground/60 hover:text-foreground cursor-pointer"
                onClick={() => router.push("/brain?kind=pages")}
              />
            }
          >
            {workspaces.map((w) => (
              <Row
                key={w.id}
                icon={Compass}
                label={`${w.icon || "📦"}  ${w.title}`}
                href={brainHref({ kind: "workspace", id: w.id, title: w.title })}
                active={currentWorkspaceId === w.id}
                indent={1}
              />
            ))}
          </Section>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/40 px-1.5 py-1.5 shrink-0 space-y-px">
        <Row
          icon={theme === "dark" ? Sun : Moon}
          label={theme === "dark" ? "Tema claro" : "Tema oscuro"}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        />
        <Row icon={Trash2} label="Papelera" onClick={() => { /* placeholder */ }} />
        <Row icon={LogOut} label={isGuest ? "Salir de invitado" : "Cerrar sesión"} onClick={handleSignOut} />
      </div>
    </div>
  );
}

// ─── Wrapper ─────────────────────────────────────────────────────────────────

interface NotionSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  onOpenSearch?: () => void;
  onOpenChat?: () => void;
}

export function NotionSidebar({ mobileOpen, onMobileClose, onOpenSearch, onOpenChat }: NotionSidebarProps) {
  return (
    <>
      {/* Mobile: Sheet */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose()}>
        <SheetContent
          side="left"
          className="p-0 w-72 bg-sidebar border-sidebar-border flex flex-col gap-0 [&>button]:hidden"
        >
          <SidebarBody
            onItemClick={onMobileClose}
            onOpenSearch={() => { onMobileClose(); onOpenSearch?.(); }}
            onOpenChat={() => { onMobileClose(); onOpenChat?.(); }}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop */}
      <aside
        style={{ width: NOTION_SIDEBAR_WIDTH }}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen",
          "bg-sidebar border-r border-sidebar-border",
          "hidden md:flex flex-col",
        )}
      >
        <SidebarBody onOpenSearch={onOpenSearch} onOpenChat={onOpenChat} />
      </aside>
    </>
  );
}
