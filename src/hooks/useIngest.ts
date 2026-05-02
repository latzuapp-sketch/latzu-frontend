"use client";

/**
 * useIngest — universal content-ingestion orchestrator.
 *
 * Accepts text, URLs (incl. YouTube) and files. Routes each item to the
 * correct backend pipeline and tracks per-item status so the UI can render
 * a live processing queue.
 *
 *  text  → extractText
 *  file  → /api/files/extract → extractText (with the extracted text)
 *  url   → scrapeUrl  (or processYoutube if it's a YouTube link)
 */

import { useCallback, useState } from "react";
import { useMutation } from "@apollo/client";
import { getSession, useSession } from "next-auth/react";
import { aiClient, API_BASE_URL } from "@/lib/apollo";
import { EXTRACT_TEXT, PROCESS_YOUTUBE, SCRAPE_URL } from "@/graphql/ai/operations";

// ─── Types ────────────────────────────────────────────────────────────────────

export type IngestKind = "text" | "url" | "youtube" | "file";
export type IngestStatus = "pending" | "processing" | "done" | "error";

export interface IngestItem {
  id: string;
  kind: IngestKind;
  /** Human label for the queue chip */
  label: string;
  /** Raw input (text content / URL / File) */
  input: string | File;
  status: IngestStatus;
  /** When done: short summary of what was indexed */
  summary?: string;
  /** When done: counts from the extraction backend */
  nodesCreated?: number;
  relationshipsCreated?: number;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const YT_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);

export function detectUrlKind(raw: string): "youtube" | "url" | null {
  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  return YT_HOSTS.has(url.hostname) ? "youtube" : "url";
}

export function looksLikeUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/\s/.test(trimmed)) return false;
  return /^(https?:\/\/|www\.)/i.test(trimmed) || /^[\w-]+\.[\w.-]+\/?/.test(trimmed);
}

function shortLabel(raw: string, max = 60): string {
  const t = raw.trim().replace(/\s+/g, " ");
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function uid() {
  return crypto.randomUUID();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useIngest() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const [queue, setQueue] = useState<IngestItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [extractMutation] = useMutation(EXTRACT_TEXT, { client: aiClient });
  const [youtubeMutation] = useMutation(PROCESS_YOUTUBE, { client: aiClient });
  const [scrapeMutation] = useMutation(SCRAPE_URL, { client: aiClient });

  // ── Adders ──────────────────────────────────────────────────────────────

  const addText = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const item: IngestItem = {
      id: uid(),
      kind: "text",
      label: shortLabel(trimmed),
      input: trimmed,
      status: "pending",
    };
    setQueue((q) => [...q, item]);
    return item.id;
  }, []);

  const addUrl = useCallback((rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;
    const kind = detectUrlKind(trimmed);
    if (!kind) return null;
    const fullUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    const item: IngestItem = {
      id: uid(),
      kind,
      label: kind === "youtube" ? `YouTube · ${shortLabel(fullUrl, 40)}` : shortLabel(fullUrl, 50),
      input: fullUrl,
      status: "pending",
    };
    setQueue((q) => [...q, item]);
    return item.id;
  }, []);

  const addFile = useCallback((file: File) => {
    const item: IngestItem = {
      id: uid(),
      kind: "file",
      label: file.name,
      input: file,
      status: "pending",
    };
    setQueue((q) => [...q, item]);
    return item.id;
  }, []);

  const addFiles = useCallback((files: File[] | FileList) => {
    Array.from(files).forEach((f) => addFile(f));
  }, [addFile]);

  /**
   * Smart adder: text input that may be a URL — routes to addUrl when it
   * looks like one, addText otherwise.
   */
  const addSmart = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (looksLikeUrl(trimmed) && !/\s/.test(trimmed)) return addUrl(trimmed);
    return addText(trimmed);
  }, [addText, addUrl]);

  // ── Removers ────────────────────────────────────────────────────────────

  const removeItem = useCallback((id: string) => {
    setQueue((q) => q.filter((i) => i.id !== id));
  }, []);

  const clearDone = useCallback(() => {
    setQueue((q) => q.filter((i) => i.status !== "done"));
  }, []);

  const clearAll = useCallback(() => {
    setQueue([]);
  }, []);

  // ── Per-item processors ────────────────────────────────────────────────

  const updateItem = useCallback((id: string, patch: Partial<IngestItem>) => {
    setQueue((q) => q.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const runText = async (item: IngestItem, sourceRef: string) => {
    const text = typeof item.input === "string" ? item.input : "";
    const { data } = await extractMutation({
      variables: {
        input: {
          text,
          sourceRef,
          hint: null,
          userId,
          visibility: "private",
        },
      },
    });
    const r = data?.extractText;
    return {
      summary: r?.summary ?? "Indexado",
      nodesCreated: r?.nodesCreated ?? 0,
      relationshipsCreated: r?.relationshipsCreated ?? 0,
    };
  };

  const runYoutube = async (item: IngestItem) => {
    const url = typeof item.input === "string" ? item.input : "";
    const { data } = await youtubeMutation({ variables: { url } });
    const r = data?.processYoutube;
    return {
      summary: r?.summary ?? "Video indexado",
      nodesCreated: r?.nodesCreated ?? 0,
      relationshipsCreated: r?.relationshipsCreated ?? 0,
    };
  };

  const runUrl = async (item: IngestItem) => {
    const url = typeof item.input === "string" ? item.input : "";
    const { data } = await scrapeMutation({
      variables: { url, sourceRef: url, visibility: "private" },
    });
    const r = data?.scrapeUrl;
    return {
      summary: r?.summary ?? "Página indexada",
      nodesCreated: r?.nodesCreated ?? 0,
      relationshipsCreated: r?.relationshipsCreated ?? 0,
    };
  };

  const runFile = async (item: IngestItem) => {
    const file = item.input as File;
    const sess = await getSession();
    const token = (sess as { backendToken?: string } | null)?.backendToken;

    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`${API_BASE_URL}/api/files/extract`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `Error al procesar ${file.name}`);
    }

    const { text } = (await res.json()) as { text: string };

    if (!text || text.trim().length < 10) {
      throw new Error("No se pudo extraer texto del archivo.");
    }

    // Now feed that text into the knowledge graph
    return runText({ ...item, input: text }, `file:${file.name}`);
  };

  // ── Main runner ─────────────────────────────────────────────────────────

  const processQueue = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Snapshot pending items at start so additions during processing don't
      // race; new items can be processed by a subsequent call.
      const pending = queue.filter((i) => i.status === "pending");

      for (const item of pending) {
        updateItem(item.id, { status: "processing" });
        try {
          let result: { summary: string; nodesCreated: number; relationshipsCreated: number };
          if (item.kind === "text") {
            result = await runText(item, "quick-capture");
          } else if (item.kind === "youtube") {
            result = await runYoutube(item);
          } else if (item.kind === "url") {
            result = await runUrl(item);
          } else {
            result = await runFile(item);
          }
          updateItem(item.id, { status: "done", ...result });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Error desconocido";
          updateItem(item.id, { status: "error", error: msg });
        }
      }
    } finally {
      setIsProcessing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, isProcessing, userId]);

  return {
    queue,
    isProcessing,
    addText,
    addUrl,
    addFile,
    addFiles,
    addSmart,
    removeItem,
    clearDone,
    clearAll,
    processQueue,
  };
}
