"use client";

/**
 * useUserProfile — derives user state from NextAuth session + Zustand store.
 *
 * The original version called REST endpoints (/api/users/:id/profile, etc.)
 * that do not exist on the Python backends. Profile state is now managed
 * entirely client-side: NextAuth provides identity, Zustand persists
 * profileType and preferences across page navigations.
 *
 * If a backend user-profile service is added in the future, mutations here
 * can be extended to call it via Apollo or fetch without changing callers.
 */

import { useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/stores/userStore";
import type { ProfileType, UserPreferences, OnboardingData } from "@/types/user";

export function useUserProfile() {
  const { data: session, status } = useSession();

  const {
    profileType,
    preferences,
    progress,
    setProfileType,
    setPreferences,
    setProgress,
    setTenantId,
  } = useUserStore();

  // Sync NextAuth session fields into Zustand on sign-in
  useEffect(() => {
    if (session?.user) {
      if (session.user.profileType) {
        setProfileType(session.user.profileType);
      }
      if (session.user.tenantId) {
        setTenantId(session.user.tenantId);
      }
    }
  }, [session, setProfileType, setTenantId]);

  // Local-only mutations — persist to Zustand (survives page reload via persist)
  const updateProfileType = useCallback(
    (newProfileType: ProfileType) => {
      setProfileType(newProfileType);
    },
    [setProfileType]
  );

  const updatePreferences = useCallback(
    (newPreferences: Partial<UserPreferences>) => {
      setPreferences(newPreferences);
    },
    [setPreferences]
  );

  const completeOnboarding = useCallback(
    (data: OnboardingData) => {
      setProfileType(data.profileType);
    },
    [setProfileType]
  );

  const refetchProfile = useCallback(() => {
    // No-op until a backend user-profile endpoint is available.
    // Profile is already in Zustand persisted storage.
  }, []);

  return {
    // Current state
    profileType,
    preferences,
    progress,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",

    // User identity (from NextAuth)
    userId: session?.user?.id,
    userName: session?.user?.name,
    userEmail: session?.user?.email,
    userImage: session?.user?.image,

    // Actions
    updateProfileType,
    updatePreferences,
    completeOnboarding,
    refetchProfile,

    // Mutation loading states (always false — mutations are now synchronous)
    isUpdatingProfileType: false,
    isUpdatingPreferences: false,
    isCompletingOnboarding: false,
  };
}



