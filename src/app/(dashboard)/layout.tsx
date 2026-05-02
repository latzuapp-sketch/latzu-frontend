"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { QuickCapture } from "@/components/capture/QuickCapture";
import { ChatOverlay } from "@/components/chat/ChatOverlay";
import { CommandPalette } from "@/components/search/CommandPalette";
import { useUserStore, useSidebarCollapsed, useIsGuest } from "@/stores/userStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { websocket } from "@/lib/websocket";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const collapsed = useSidebarCollapsed();
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const isGuest = useIsGuest();
  const guestId = useUserStore((state) => state.guestId);
  const setProfileType = useUserStore((state) => state.setProfileType);
  const setTenantId = useUserStore((state) => state.setTenantId);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Sync session data to store for authenticated users
  useEffect(() => {
    if (session?.user) {
      if (session.user.profileType) {
        setProfileType(session.user.profileType);
      }
      if (session.user.tenantId) {
        setTenantId(session.user.tenantId);
      }

      // Connect WebSocket for authenticated users
      websocket.connect(session.user.id, session.user.tenantId).catch((err) => {
        console.error("WebSocket connection failed:", err);
      });
    } else if (isGuest && guestId) {
      // Connect WebSocket for guest users
      websocket.connect(guestId, "demo").catch((err) => {
        console.error("WebSocket connection failed:", err);
      });
    }

    return () => {
      websocket.disconnect();
    };
  }, [session, isGuest, guestId, setProfileType, setTenantId]);

  // Get local profileType from store (updated after onboarding)
  const localProfileType = useUserStore((state) => state.profileType);

  // Check for onboarding (only for authenticated users, not guests)
  // Skip if localProfileType is set (onboarding completed but session not refreshed)
  useEffect(() => {
    if (session?.user?.needsOnboarding && !isGuest && !localProfileType) {
      router.push("/onboarding");
    }
  }, [session, isGuest, router, localProfileType]);

  // Loading state - only show when authenticating (not for guests)
  if (status === "loading" && !isGuest) {
    return (
      <div className="min-h-screen bg-gradient-latzu flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse-glow mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </motion.div>
      </div>
    );
  }

  // Allow access for:
  // 1. Authenticated users
  // 2. Guest users (isGuest === true)
  const hasAccess = status === "authenticated" || isGuest;

  // If not authenticated and not guest, redirect to login
  if (!hasAccess && status === "unauthenticated") {
    // Don't redirect, let them see the landing page
    // The main page.tsx will handle showing the landing for unauthenticated users
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-latzu">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <motion.main
        initial={false}
        animate={{ marginLeft: isMobile ? 0 : (collapsed ? 72 : 256) }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="min-h-screen"
      >
        <Header onMenuClick={() => setMobileSidebarOpen(true)} onSearchClick={openPalette} />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-3 md:p-6"
        >
          {children}
        </motion.div>
      </motion.main>

      {/* Floating quick capture — only for authenticated users */}
      {!isGuest && <QuickCapture />}

      {/* Invocable chat overlay (Cmd+J) — only for authenticated users */}
      {!isGuest && <ChatOverlay />}

      {/* Global command palette */}
      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </div>
  );
}
