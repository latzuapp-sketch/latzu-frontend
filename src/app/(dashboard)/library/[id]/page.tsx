"use client";

/**
 * KnowledgeNode detail page — Notion-style entity page with block editor.
 *
 * • Notion-style properties panel (type, source, relationship count, ID)
 * • Full block-based content editor (BlockEditor)
 * • Ask AI: rewrite/expand/simplify with Gemini (built into BlockEditor)
 * • Relationships section with navigation
 * • Safe delete zone
 */

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BlockEditor } from "@/components/biblioteca/BlockEditor";
import { getNodeTypeConfig } from "@/components/biblioteca/NodeTypeConfig";
import {
  useKnowledgeNodeDetail,
  useUpdateKnowledgeNode,
  useDeleteKnowledgeNode,
} from "@/hooks/useLibrary";
import { useTrackInteraction } from "@/hooks/useOrganizerAgent";
import {
  ArrowLeft, ArrowRight,
  Link2, Loader2,
  Trash2, Tag, Network, Hash, AlertTriangle,
} from "lucide-react";
import { useRef, useEffect } from "react";

// ─── Property row (Notion-style) ──────────────────────────────────────────────

function PropertyRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start min-h-[34px] rounded-md hover:bg-muted/20 transition-colors -mx-2 px-2 py-0.5">
      <div className="flex items-center gap-2 w-36 flex-shrink-0 text-xs text-muted-foreground/70 pt-1.5 select-none">
        <span className="flex-shrink-0 opacity-60">{icon}</span>
        <span className="font-medium tracking-wide">{label}</span>
      </div>
      <div className="flex-1 pt-1">{children}</div>
    </div>
  );
}

// ─── Inline editable title ────────────────────────────────────────────────────

function InlineTitle({
  value,
  onSave,
  placeholder,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) { ref.current?.focus(); ref.current?.select(); }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== value) onSave(draft.trim());
  };

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter")  { e.preventDefault(); commit(); }
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        className="w-full bg-transparent outline-none text-4xl font-heading font-bold leading-tight tracking-tight border-b border-primary/40"
      />
    );
  }

  return (
    <h1
      onClick={() => setEditing(true)}
      className={cn(
        "text-4xl font-heading font-bold leading-tight tracking-tight cursor-text hover:bg-muted/20 rounded px-1 -mx-1 transition-colors",
        !value && "text-muted-foreground/40 italic"
      )}
    >
      {value || placeholder}
    </h1>
  );
}

// ─── Relationship row ─────────────────────────────────────────────────────────

function RelationshipRow({
  relType, nodeName, nodeType, direction, onNavigate,
}: {
  relType: string; nodeName: string; nodeType: string;
  direction: "outgoing" | "incoming"; onNavigate: () => void;
}) {
  const cfg = getNodeTypeConfig(nodeType);
  const { Icon } = cfg;
  return (
    <button
      onClick={onNavigate}
      className="group w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all border-border/40 bg-card/30 hover:border-border hover:bg-card/70"
    >
      {direction === "outgoing"
        ? <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
        : <ArrowLeft  className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
      }
      <span className="text-[10px] font-mono text-muted-foreground/70 shrink-0 uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted/40">
        {relType}
      </span>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      <span className="text-sm flex-1 truncate group-hover:text-primary transition-colors">{nodeName}</span>
      <Icon className={cn("w-3.5 h-3.5 shrink-0", cfg.text)} />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KnowledgeNodePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { node, loading } = useKnowledgeNodeDetail(id);
  const { updateNode } = useUpdateKnowledgeNode();
  const { deleteNode, loading: deleting } = useDeleteKnowledgeNode();
  const { track } = useTrackInteraction();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (node?.id) {
      track("knowledge.viewed", { targetId: node.id, targetType: node.type });
    }
  }, [node?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = useCallback(async () => {
    const ok = await deleteNode(id);
    if (ok) router.push("/library");
  }, [deleteNode, id, router]);

  const saveName = useCallback(async (name: string) => {
    await updateNode(id, { name });
  }, [updateNode, id]);

  const saveContent = useCallback(async (content: string) => {
    await updateNode(id, { content });
    track("knowledge.saved", { targetId: id, targetType: node?.type });
  }, [updateNode, id, track, node?.type]);

  // ── Loading ──
  if (loading && !node) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Nodo no encontrado.</p>
        <Button variant="ghost" size="sm" onClick={() => router.push("/library")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
      </div>
    );
  }

  const cfg        = getNodeTypeConfig(node.type);
  const { Icon }   = cfg;
  const outgoing   = node.relationships.filter(r => r.direction === "outgoing");
  const incoming   = node.relationships.filter(r => r.direction === "incoming");
  const totalRels  = outgoing.length + incoming.length;
  const sourceLabel = node.sourceRef
    ? node.sourceRef.startsWith("youtube:")
      ? `YouTube · ${node.sourceRef.slice(8)}`
      : node.sourceRef
    : null;

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Back */}
      <button
        onClick={() => router.push("/library")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Biblioteca
      </button>

      {/* Icon + Title */}
      <div className="mb-6 space-y-3">
        <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-xl mb-2", cfg.bg)}>
          <Icon className={cn("w-6 h-6", cfg.text)} />
        </div>
        <InlineTitle value={node.name} onSave={saveName} placeholder="Sin nombre" />
      </div>

      {/* Properties */}
      <div className="rounded-xl border border-border/40 bg-card/30 p-4 mb-8 space-y-0.5">
        <PropertyRow icon={<Tag className="w-3.5 h-3.5" />} label="Tipo">
          <span className={cn("inline-flex items-center gap-1.5 text-sm px-2 py-0.5 rounded", cfg.bg, cfg.text)}>
            <Icon className="w-3.5 h-3.5" />
            {cfg.label}
          </span>
        </PropertyRow>

        {sourceLabel && (
          <PropertyRow icon={<Link2 className="w-3.5 h-3.5" />} label="Fuente">
            <span className="text-sm text-muted-foreground/80 px-2 py-0.5 block truncate" title={sourceLabel}>
              {sourceLabel}
            </span>
          </PropertyRow>
        )}

        <PropertyRow icon={<Network className="w-3.5 h-3.5" />} label="Relaciones">
          <span className="text-sm px-2 py-0.5 block text-muted-foreground/80">
            {totalRels === 0 ? (
              <span className="text-muted-foreground/40 italic">Ninguna</span>
            ) : (
              <>
                <span className="tabular-nums font-medium text-foreground/80">{totalRels}</span>
                <span className="text-muted-foreground/60"> · {outgoing.length} salientes, {incoming.length} entrantes</span>
              </>
            )}
          </span>
        </PropertyRow>

        <PropertyRow icon={<Hash className="w-3.5 h-3.5" />} label="ID">
          <span className="text-sm font-mono text-muted-foreground/40 px-2 py-0.5 block truncate">
            {node.id}
          </span>
        </PropertyRow>
      </div>

      {/* Block editor */}
      <div className="mb-10">
        <BlockEditor
          nodeId={node.id}
          content={node.content}
          onSave={saveContent}
        />
      </div>

      {/* Relationships */}
      {totalRels > 0 && (
        <div className="mb-10 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest">
              Relaciones
            </h2>
            <span className="text-xs text-muted-foreground/40">({totalRels})</span>
          </div>

          {outgoing.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground/50 pl-1">Salientes</p>
              <div className="space-y-1">
                {outgoing.map((r, i) => (
                  <RelationshipRow key={`out-${i}`} {...r} onNavigate={() => router.push(`/library/${r.nodeId}`)} />
                ))}
              </div>
            </div>
          )}

          {incoming.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground/50 pl-1">Entrantes</p>
              <div className="space-y-1">
                {incoming.map((r, i) => (
                  <RelationshipRow key={`in-${i}`} {...r} onNavigate={() => router.push(`/library/${r.nodeId}`)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete */}
      <div className="mt-12 pt-6 border-t border-border/20 flex justify-end">
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/40 hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar nodo
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="w-3.5 h-3.5" />
              ¿Eliminar este nodo y todas sus relaciones?
            </span>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs gap-1.5"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Eliminar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
