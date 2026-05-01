"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserStore, useIsGuest } from "@/stores/userStore";
import { useEventStore } from "@/stores/eventStore";
import { useFocusSignals, useDismissFocusSignal } from "@/hooks/useOrganizerAgent";
import { getTemplate } from "@/config/templates";
import type { FocusSignalType } from "@/graphql/types";
import {
  Bell,
  Search,
  Sparkles,
  Wifi,
  WifiOff,
  User,
  LogIn,
  Menu,
  AlertTriangle,
  Trophy,
  Lightbulb,
  X,
} from "lucide-react";

const SIGNAL_ICONS: Record<FocusSignalType, React.ElementType> = {
  reminder: Bell,
  insight: Sparkles,
  warning: AlertTriangle,
  milestone: Trophy,
  suggestion: Lightbulb,
};

const SIGNAL_COLORS: Record<FocusSignalType, string> = {
  reminder: "text-blue-400",
  insight: "text-violet-400",
  warning: "text-amber-400",
  milestone: "text-emerald-400",
  suggestion: "text-sky-400",
};

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
}

export function Header({ title, onMenuClick, onSearchClick }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const profileType = useUserStore((state) => state.profileType);
  const isGuest = useIsGuest();
  const disableGuestMode = useUserStore((state) => state.disableGuestMode);
  const isConnected = useEventStore((state) => state.isConnected);
  const notifications = useEventStore((state) => state.notifications);
  const unreadCount = useEventStore((state) => state.unreadCount);
  const markNotificationRead = useEventStore((state) => state.markNotificationRead);

  const { signals: focusSignals } = useFocusSignals("pending");
  const { dismiss: dismissSignal } = useDismissFocusSignal();
  const now = new Date().toISOString();
  const dueSignals = focusSignals.filter((s) => s.deliverAt <= now);
  const totalUnread = unreadCount + dueSignals.length;

  const template = getTemplate(profileType || undefined);
  const displayTitle = title || template.dashboardTitle;

  const handleSignOut = async () => {
    if (isGuest) {
      disableGuestMode();
      router.push("/");
    } else {
      await signOut({ callbackUrl: "/" });
    }
  };

  const handleSignIn = () => {
    if (isGuest) {
      disableGuestMode();
    }
    router.push("/login");
  };

  const userName = isGuest ? "Invitado" : session?.user?.name || "Usuario";
  const userEmail = isGuest ? "Modo de prueba" : session?.user?.email;
  const userImage = isGuest ? undefined : session?.user?.image;

  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Title */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-base md:text-xl font-heading font-semibold truncate max-w-[140px] sm:max-w-none"
          >
            {displayTitle}
          </motion.h1>

          {/* Connection Status */}
          <div
            className={`flex items-center gap-1.5 text-xs ${
              isConnected ? "text-emerald-500" : "text-muted-foreground"
            }`}
          >
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {isConnected ? "Conectado" : "Desconectado"}
            </span>
          </div>

          {/* Guest Mode Badge */}
          {isGuest && (
            <Badge variant="secondary" className="gap-1">
              <User className="w-3 h-3" />
              Modo Prueba
            </Badge>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Search — opens command palette */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex"
            onClick={onSearchClick}
            title="Buscar (⌘K)"
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* Proactive AI Indicator */}
          {template.proactivePrompts && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-primary hidden md:flex"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">IA Activa</span>
            </Button>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notificaciones
                {totalUnread > 0 && (
                  <Badge variant="secondary">{totalUnread} nuevas</Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Focus Signals (agent-generated) */}
              {dueSignals.map((signal) => {
                const Icon = SIGNAL_ICONS[signal.type] ?? Bell;
                return (
                  <DropdownMenuItem
                    key={signal.id}
                    className="flex items-start gap-3 p-3 bg-primary/5 cursor-default focus:bg-primary/5"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${SIGNAL_COLORS[signal.type]}`} />
                    <span className="flex-1 text-sm leading-snug">{signal.message}</span>
                    <button
                      onClick={() => dismissSignal(signal.id)}
                      className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuItem>
                );
              })}

              {dueSignals.length > 0 && notifications.length > 0 && (
                <DropdownMenuSeparator />
              )}

              {/* Regular system notifications */}
              {notifications.length === 0 && dueSignals.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay notificaciones</p>
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onClick={() => markNotificationRead(notification.id)}
                    className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                      !notification.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium text-sm">
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary rounded-full ml-auto" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 pl-2 pr-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={userImage || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {isGuest ? <User className="w-4 h-4" /> : userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium">
                  {userName.split(" ")[0]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{userName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {userEmail}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Badge variant="outline" className="capitalize">
                  {profileType || "Sin perfil"}
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {isGuest ? (
                <>
                  <DropdownMenuItem onClick={handleSignIn} className="gap-2">
                    <LogIn className="w-4 h-4" />
                    Iniciar sesión
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/settings">Configuración</a>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <a href="/settings">Configuración</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/settings/profile">Mi Perfil</a>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                {isGuest ? "Salir del modo prueba" : "Cerrar sesión"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
