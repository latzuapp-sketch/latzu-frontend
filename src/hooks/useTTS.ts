"use client";

import { useState, useRef, useCallback } from "react";
import { getSession } from "next-auth/react";
import { API_BASE_URL } from "@/lib/apollo";

// In dev, use the local backend if NEXT_PUBLIC_API_URL is set; otherwise use production
const TTS_BASE = process.env.NEXT_PUBLIC_API_URL || API_BASE_URL;
import type { LessonBlock } from "@/types/lesson";

export function extractBlockText(block: LessonBlock): string {
  switch (block.type) {
    case "content":   return stripMd(block.markdown);
    case "callout":   return `${block.title ? block.title + ". " : ""}${block.body}`;
    case "quiz":      return `Pregunta: ${block.question}. ${block.options.map((o, i) => `Opción ${i + 1}: ${o}`).join(". ")}.`;
    case "exercise":  return `Ejercicio: ${block.prompt}`;
    case "reflection":return `Reflexión: ${block.prompt}`;
    default:          return "";
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

export function useTTS() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const session = await getSession();
      const token = (session as { backendToken?: string } | null)?.backendToken;

      const res = await fetch(`${TTS_BASE}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, voice: "Kore" }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const msg = res.status === 401 ? "Sin autenticación" : `Error ${res.status}`;
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setIsPlaying(false);
        if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
      };
      audio.onerror = () => setIsPlaying(false);

      setIsLoading(false);
      setIsPlaying(true);
      await audio.play();
    } catch (err) {
      if ((err as Error).name === "AbortError") { setIsLoading(false); return; }
      const msg = err instanceof Error ? err.message : "Error de audio";
      setError(msg);
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [stop]);

  // Enable TTS and immediately speak text
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
