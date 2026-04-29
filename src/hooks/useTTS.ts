"use client";

import { useState, useRef, useCallback } from "react";
import { getSession } from "next-auth/react";
import type { LessonBlock } from "@/types/lesson";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://latzu-api-610441107033.us-central1.run.app";

// Strip markdown to plain text for TTS narration
function toPlainText(md: string): string {
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

export function extractBlockText(block: LessonBlock): string {
  switch (block.type) {
    case "content":
      return toPlainText(block.markdown);
    case "callout":
      return `${block.title ? block.title + ". " : ""}${block.body}`;
    case "quiz":
      return `Pregunta: ${block.question}. ${block.options.map((o, i) => `Opción ${i + 1}: ${o}`).join(". ")}.`;
    case "exercise":
      return `Ejercicio: ${block.prompt}`;
    case "reflection":
      return `Reflexión: ${block.prompt}`;
    default:
      return "";
  }
}

export function useTTS() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
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

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      stop();

      setIsLoading(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const session = await getSession();
        const token = (session as { backendToken?: string } | null)?.backendToken;

        const res = await fetch(`${API_URL}/tts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ text, voice: "Kore" }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`TTS error ${res.status}`);
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
          }
        };
        audio.onerror = () => {
          setIsPlaying(false);
        };

        setIsLoading(false);
        setIsPlaying(true);
        await audio.play();
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("TTS error:", err);
        }
        setIsLoading(false);
        setIsPlaying(false);
      }
    },
    [stop]
  );

  const toggle = useCallback(() => {
    setIsEnabled((prev) => {
      if (prev) stop();
      return !prev;
    });
  }, [stop]);

  return { isEnabled, isLoading, isPlaying, speak, stop, toggle };
}
