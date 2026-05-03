"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserStore, useIsGuest } from "@/stores/userStore";
import { getTemplate } from "@/config/templates";
import { useLanguage, LangToggle } from "@/lib/i18n";
import {
  Settings,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

export const SIDEBAR_COLLAPSED_WIDTH = 72;

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

// ─── Logo ──────────────────────────────────────────────────────────────────────

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="h-16 flex items-center px-4 border-b border-sidebar-border flex-shrink-0">
      <Link href="/brain" className="flex items-center gap-3">
        <div className="w-10 h-10 flex-shrink-0">
          <Image src="/logo.png" alt="Latzu" width={40} height={40} className="w-10 h-10 object-contain" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-heading font-bold text-xl text-sidebar-foreground overflow-hidden whitespace-nowrap"
            >
              Latzu
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    </div>
  );
}

// ─── Nav ───────────────────────────────────────────────────────────────────────

function SidebarNav({
  collapsed,
  onItemClick,
}: {
  collapsed: boolean;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  const profileType = useUserStore((state) => state.profileType);
  const template = getTemplate(profileType || undefined);
  const { t } = useLanguage();

  const navLabel = (id: string, fallback: string) =>
    (t.sidebar.nav as Record<string, string>)[id] ?? fallback;

  return (
    <ScrollArea className="flex-1 py-4">
      <nav className="px-3 space-y-1">
        {template.sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const label = navLabel(item.id, item.label);

          const linkContent = (
            <Link
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                "hover:bg-sidebar-accent",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-current")} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.badge && !collapsed && (
                <span className="ml-auto bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.id}>{linkContent}</div>;
        })}
      </nav>
    </ScrollArea>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────────

function SidebarFooter({
  collapsed,
  onItemClick,
}: {
  collapsed: boolean;
  onItemClick?: () => void;
}) {
  const router = useRouter();
  const isGuest = useIsGuest();
  const disableGuestMode = useUserStore((state) => state.disableGuestMode);
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  const handleSignOut = () => {
    if (isGuest) {
      disableGuestMode();
      router.push("/");
    } else {
      signOut({ callbackUrl: "/" });
    }
  };

  const themeLabel = theme === "dark" ? t.sidebar.lightMode : t.sidebar.darkMode;

  return (
    <div className="p-3 border-t border-sidebar-border space-y-1 flex-shrink-0">
      {/* Language toggle */}
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex justify-center py-1">
              <LangToggle />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">{t.langToggle === "ES" ? "Switch to Spanish" : "Cambiar a inglés"}</TooltipContent>
        </Tooltip>
      ) : (
        <div className="px-1 py-1 flex items-center gap-3">
          <LangToggle className="w-full justify-start" />
        </div>
      )}

      {/* Theme */}
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-full justify-center"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{themeLabel}</TooltipContent>
        </Tooltip>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full justify-start gap-3"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span>{themeLabel}</span>
        </Button>
      )}

      {/* Settings */}
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" asChild className="w-full justify-center">
              <Link href="/settings" onClick={onItemClick}>
                <Settings className="w-5 h-5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{t.sidebar.settings}</TooltipContent>
        </Tooltip>
      ) : (
        <Button variant="ghost" size="sm" asChild className="w-full justify-start gap-3">
          <Link href="/settings" onClick={onItemClick}>
            <Settings className="w-5 h-5" />
            <span>{t.sidebar.settings}</span>
          </Link>
        </Button>
      )}

      {/* Logout */}
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-center text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isGuest ? t.sidebar.exitGuest : t.sidebar.logout}
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span>{isGuest ? t.sidebar.exitGuest : t.sidebar.logout}</span>
        </Button>
      )}

    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile: Sheet drawer */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose()}>
        <SheetContent
          side="left"
          className="p-0 w-72 bg-sidebar border-sidebar-border flex flex-col gap-0 [&>button]:hidden"
        >
          <SidebarLogo collapsed={false} />
          <SidebarNav collapsed={false} onItemClick={onMobileClose} />
          <SidebarFooter collapsed={false} onItemClick={onMobileClose} />
        </SheetContent>
      </Sheet>

      {/* Desktop: Fixed mini sidebar — always collapsed, tooltips show labels on hover */}
      <aside
        style={{ width: SIDEBAR_COLLAPSED_WIDTH }}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen",
          "bg-sidebar border-r border-sidebar-border",
          "hidden md:flex flex-col"
        )}
      >
        <SidebarLogo collapsed={true} />
        <SidebarNav collapsed={true} />
        <SidebarFooter collapsed={true} />
      </aside>
    </TooltipProvider>
  );
}
