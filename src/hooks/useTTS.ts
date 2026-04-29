"use client";

import { useState, useRef, useCallback } from "react";
import { getSession } from "next-auth/react";
import type { LessonBlock } from "@/types/lesson";

const TTS_URL = "https://latzu-api-610441107033.us-central1.run.app/tts";

// ── Text helpers ──────────────────────────────────────────────────────────────

export function extractBlockText(block: LessonBlock): string {
  switch (block.type) {
    case "content":    return stripMd(block.markdown);
    case "callout":    return `${block.title ? block.title + ". " : ""}${block.body}`;
    case "quiz":       return `Pregunta: ${block.question}. ${block.options.map((o, i) => `Opción ${i + 1}: ${o}`).join(". ")}.`;
    case "exercise":   return `Ejercicio: ${block.prompt}`;
    case "reflection": return `Reflexión: ${block.prompt}`;
    default:           return "";
  }
}

function stripMd(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\|[^\n]+\|/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*{1,3}([^*\n]+)\*{1,3}/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function toParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 8); // skip very short fragments
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTTS() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const abortRef  = useRef<AbortController | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setIsLoading(false);
    setIsPlaying(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;
    stop();
    setError(null);
    setIsLoading(true);

    const paragraphs = toParagraphs(text);
    if (paragraphs.length === 0) { setIsLoading(false); return; }

    const controller = new AbortController();
    abortRef.current = controller;

    // Get auth token once for the whole sequence
    const session = await getSession();
    const token = (session as { backendToken?: string } | null)?.backendToken;

    const fetchBlob = (para: string): Promise<Blob | null> =>
      fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: para, voice: "Kore" }),
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`Error ${r.status}`))))
        .catch((e) => {
          if (e?.name === "AbortError") return null;
          throw e;
        });

    const playBlob = (blob: Blob): Promise<void> =>
      new Promise((resolve) => {
        if (controller.signal.aborted) { resolve(); return; }
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });

    try {
      // Pipeline: start fetching paragraph 0 immediately
      let prefetch: Promise<Blob | null> = fetchBlob(paragraphs[0]);

      for (let i = 0; i < paragraphs.length; i++) {
        if (controller.signal.aborted) break;

        const blob = await prefetch;
        if (!blob || controller.signal.aborted) break;

        // Start fetching paragraph i+1 while i is playing
        prefetch = i + 1 < paragraphs.length
          ? fetchBlob(paragraphs[i + 1])
          : Promise.resolve(null);

        // First paragraph ready — switch from loading to playing
        if (i === 0) { setIsLoading(false); setIsPlaying(true); }

        await playBlob(blob);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de audio");
    } finally {
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [stop]);

  const enable = useCallback((text: string) => {
    setIsEnabled(true);
    setError(null);
    speak(text);
  }, [speak]);

  const disable = useCallback(() => {
    setIsEnabled(false);
    stop();
  }, [stop]);

  return { isEnabled, isLoading, isPlaying, error, speak, stop, enable, disable };
}
