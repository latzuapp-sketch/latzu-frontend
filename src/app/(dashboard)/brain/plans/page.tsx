"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { BrainPlanCard } from "@/components/brain/BrainItemCards";
import { usePlans } from "@/hooks/usePlans";
import { useAllPlanHealth } from "@/hooks/usePlanHealth";

/** Plans — vertical card list, active first. Health bar + velocity per card. */
export default function BrainPlansPage() {
  const { plans, loading, refetch } = usePlans();
  const { healthByPlanId } = useAllPlanHealth();

  const ordered = useMemo(() => {
    return [...plans].sort((a, b) => {
      const aActive = a.status === "active" ? 0 : 1;
      const bActive = b.status === "active" ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [plans]);

  return (
    <BrainPageShell
      title="Planes"
      subtitle="Hojas de ruta con fases, salud y velocidad"
      count={plans.length}
      onCreated={refetch}
    >
      {loading && plans.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : ordered.length === 0 ? (
        <div className="text-center py-20 text-sm text-muted-foreground">
          Aún no hay planes. Usá el botón <span className="text-emerald-300 font-medium">Plan</span> de arriba.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {ordered.map((p) => (
            <BrainPlanCard
              key={p.id}
              plan={p}
              health={healthByPlanId[p.id] ?? null}
              onClick={() => { /* inline expansion is handled by the card itself */ }}
            />
          ))}
        </div>
      )}
    </BrainPageShell>
  );
}
