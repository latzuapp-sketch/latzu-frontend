"use client";

import { useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { useCallback } from "react";

import { GET_USER_SUBSCRIPTION } from "@/graphql/api/operations";
import { client } from "@/lib/apollo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface SubscriptionInfo {
  plan: "free" | "pro";
  status: string | null;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
}

export function useSubscription() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? "";

  const { data, loading, refetch } = useQuery<{ userSubscription: SubscriptionInfo }>(
    GET_USER_SUBSCRIPTION,
    { variables: { userId }, skip: !userId, client },
  );

  const subscription: SubscriptionInfo = data?.userSubscription ?? {
    plan: "free",
    status: null,
    currentPeriodEnd: null,
    stripeCustomerId: null,
  };

  return { subscription, loading, refetch };
}

export function useBillingActions() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? "";

  const startCheckout = useCallback(
    async (priceId: string) => {
      const res = await fetch(`${API_BASE}/api/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, price_id: priceId }),
      });
      if (!res.ok) throw new Error("Error al crear sesión de pago");
      const { url } = await res.json();
      window.location.href = url;
    },
    [userId],
  );

  const openPortal = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/billing/portal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) throw new Error("Error al abrir portal");
    const { url } = await res.json();
    window.location.href = url;
  }, [userId]);

  return { startCheckout, openPortal };
}
