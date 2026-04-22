"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getNodeTypeConfig } from "./NodeTypeConfig";
import { useKnowledgeNodeDetail, useDeleteKnowledgeNode, useUpdateKnowledgeNode } from "@/hooks/useLibrary";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Pencil,
  Trash2,
  Check,
  Loader2,
  Link2,
  AlertTriangle,
  Maximize2,
} from "lucide-react";

interface NodeDetailProps {
  nodeId: string | null;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

function RelationshipRow({
  relType,
  nodeName,
  nodeType,
  direction,
  onNavigate,
}: {
  relType: string;
  nodeName: string;
  nodeType: string;
  direction: "outgoing" | "incoming";
  onNavigate: () => void;
}) {
  const cfg = getNodeTypeConfig(nodeType);
  const { Icon } = cfg;

  return (
    <button
      onClick={onNavigate}
      className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left group"
    >
      {/* Direction arrow */}
      <span className="text-muted-foreground/50 shrink-0">
        {direction === "outgoing" ? (
          <ArrowRight className="w-3.5 h-3.5" />
        ) : (
          <ArrowLeft className="w-3.5 h-3.5" />
        )}
      </span>

      {/* Rel type */}
      <span className="text-xs font-mono text-muted-foreground/70 shrink-0 min-w-0 truncate max-w-[90px]">
        {relType}
      </span>

      {/* Target node */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
        <span className="text-sm truncate group-hover:text-primary transition-colors">
          {nodeName}
        </span>
        <Icon className={cn("w-3 h-3 shrink-0 ml-auto", cfg.text)} />
      </div>
    </button>
  );
}

export function NodeDetail({ nodeId, onClose, onNavigate }: NodeDetailProps) {
  const router = useRouter();
  const { node, loading } = useKnowledgeNodeDetail(nodeId);
  const { deleteNode, loading: deleting } = useDeleteKnowledgeNode();
  const { updateNode, loading: updating } = useUpdateKnowledgeNode();

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editName, setEditName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const cfg = node ? getNodeTypeConfig(node.type) : null;
  const { Icon } = cfg ?? { Icon: () => null };

  const startEdit = () => {
    if (!node) return;
    setEditName(node.name);
    setEditContent(node.content);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!node) return;
    await updateNode(node.id, {
      name: editName || undefined,
      content: editContent || undefined,
    });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!node) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const ok = await deleteNode(node.id);
    if (ok) onClose();
    setConfirmDelete(false);
  };

  const outgoing = node?.relationships.filter((r) => r.direction === "outgoing") ?? [];
  const incoming = node?.relationships.filter((r) => r.direction === "incoming") ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col bg-background border-l border-border overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <span className="text-sm font-semibold text-muted-foreground">
          Detalle del nodo
        </span>
        <div className="flex items-center gap-1">
          {nodeId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/library/${nodeId}`)}
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary"
              title="Abrir como página"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Abrir
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && node && cfg && (
          <>
            {/* Type badge */}
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                cfg.bg,
                cfg.text,
                cfg.border
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {cfg.label}
            </div>

            {/* Name */}
            {editing ? (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Nombre</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-base font-bold bg-muted/40 rounded-lg px-3 py-2 outline-none border border-border focus:border-primary/50 transition-colors"
                />
              </div>
            ) : (
              <h2 className="text-base font-bold leading-snug">{node.name}</h2>
            )}

            {/* Source */}
            {node.sourceRef && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link2 className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {node.sourceRef.startsWith("youtube:")
                    ? `YouTube · ${node.sourceRef.slice(8)}`
                    : node.sourceRef}
                </span>
              </div>
            )}

            {/* Content */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Descripción
              </p>
              {editing ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[120px] text-sm resize-y"
                />
              ) : (
                <p className="text-sm leading-relaxed text-foreground/85">
                  {node.content || (
                    <span className="text-muted-foreground italic">Sin descripción</span>
                  )}
                </p>
              )}
            </div>

            {/* Relationships */}
            {(outgoing.length > 0 || incoming.length > 0) && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Relaciones ({outgoing.length + incoming.length})
                </p>

                {outgoing.length > 0 && (
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground/60 pl-1 mb-1">
                      Salientes
                    </p>
                    {outgoing.map((r, i) => (
                      <RelationshipRow
                        key={i}
                        relType={r.relType}
                        nodeName={r.nodeName}
                        nodeType={r.nodeType}
                        direction="outgoing"
                        onNavigate={() => onNavigate(r.nodeId)}
                      />
                    ))}
                  </div>
                )}

                {incoming.length > 0 && (
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground/60 pl-1 mb-1">
                      Entrantes
                    </p>
                    {incoming.map((r, i) => (
                      <RelationshipRow
                        key={i}
                        relType={r.relType}
                        nodeName={r.nodeName}
                        nodeType={r.nodeType}
                        direction="incoming"
                        onNavigate={() => onNavigate(r.nodeId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      {!loading && node && (
        <div className="p-4 border-t border-border shrink-0 space-y-2">
          {editing ? (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={saveEdit}
                disabled={updating}
                className="flex-1 gap-1.5"
              >
                {updating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Guardar
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={startEdit}
                className="flex-1 gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </Button>
              <Button
                variant={confirmDelete ? "destructive" : "outline"}
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 gap-1.5"
              >
                {deleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : confirmDelete ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                {confirmDelete ? "¿Confirmar?" : "Eliminar"}
              </Button>
            </div>
          )}

          {confirmDelete && (
            <AnimatePresence>
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive text-center"
              >
                Esta acción no se puede deshacer. Pulsa de nuevo para confirmar.
              </motion.p>
            </AnimatePresence>
          )}
        </div>
      )}
    </motion.div>
  );
}
