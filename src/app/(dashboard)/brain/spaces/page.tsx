"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { BrainPageCard } from "@/components/brain/BrainItemCards";
import { UniversalViewer, type ViewerItem } from "@/components/brain/UniversalViewer";
import { useWorkspaces } from "@/hooks/useWorkspace";

/** Spaces — workspace card grid with icons + page counts. */
export default function BrainSpacesPage() {
  const { workspaces, loading, refetch } = useWorkspaces();
  const [viewing, setViewing] = useState<ViewerItem | null>(null);

  return (
    <BrainPageShell
      title="Spaces"
      subtitle="Workspaces temáticos con sus páginas"
      count={workspaces.length}
      onCreated={refetch}
    >
      <AnimatePresence>
        {viewing && (
          <UniversalViewer item={viewing} onClose={() => { setViewing(null); refetch(); }} />
        )}
      </AnimatePresence>

      {loading && workspaces.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-20 text-sm text-muted-foreground">
          Aún no tenés spaces. Usá el botón <span className="text-violet-300 font-medium">Space</span> de arriba.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {workspaces.map((w) => (
            <BrainPageCard key={w.id} workspace={w} onClick={() => setViewing({ kind: "workspace", workspace: w })} />
          ))}
        </div>
      )}
    </BrainPageShell>
  );
}
