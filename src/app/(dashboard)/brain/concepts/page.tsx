"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { GroupedConcepts } from "@/components/brain/GroupedConcepts";
import { UniversalViewer, type ViewerItem } from "@/components/brain/UniversalViewer";
import { useKnowledgeNodes } from "@/hooks/useLibrary";
import { useUserModel } from "@/hooks/useOrganizerAgent";

interface LifeAreaParsed {
  name: string;
  description?: string;
  node_ids?: string[];
  strength?: number;
}

function safeJsonArray<T = unknown>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Concepts — knowledge nodes (excluding books) grouped by auto-category or life area. */
export default function BrainConceptsPage() {
  const { nodes, loading } = useKnowledgeNodes({ limit: 300 });
  const { userModel } = useUserModel();
  const [viewing, setViewing] = useState<ViewerItem | null>(null);

  const concepts = useMemo(() => nodes.filter((n) => n.type !== "book"), [nodes]);
  const lifeAreas = useMemo(
    () => safeJsonArray<LifeAreaParsed>(userModel?.lifeAreas),
    [userModel?.lifeAreas]
  );

  return (
    <BrainPageShell
      title="Conceptos"
      subtitle="Tu grafo de conocimiento — agrupado automáticamente por categoría"
      count={concepts.length}
    >
      <AnimatePresence>
        {viewing && (
          <UniversalViewer item={viewing} onClose={() => setViewing(null)} />
        )}
      </AnimatePresence>

      {loading && concepts.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : concepts.length === 0 ? (
        <div className="text-center py-20 text-sm text-muted-foreground">
          Aún no hay conceptos. Usá el botón <span className="text-indigo-300 font-medium">Concepto</span> de arriba o pegá texto para extraer.
        </div>
      ) : (
        <GroupedConcepts
          nodes={concepts}
          lifeAreas={lifeAreas}
          onPick={(node) => setViewing({ kind: "node", node })}
        />
      )}
    </BrainPageShell>
  );
}
