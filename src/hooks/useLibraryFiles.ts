"use client";

import { useState, useCallback, useEffect } from "react";
import { getSession } from "next-auth/react";
import { API_BASE_URL } from "@/lib/apollo";
import type { LibraryFile } from "@/types/library";

const STORAGE_KEY = "latzu_library_files";

function loadFiles(): LibraryFile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LibraryFile[]) : [];
  } catch {
    return [];
  }
}

function saveFiles(files: LibraryFile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch {}
}

export function useLibraryFiles() {
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    setFiles(loadFiles());
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<LibraryFile | null> => {
    setUploading(true);
    setUploadError(null);

    try {
      const session = await getSession();
      const token = (session as { backendToken?: string } | null)?.backendToken;

      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API_BASE_URL}/api/files/extract`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });

      if (!res.ok) {
        const data = await res.json();
        setUploadError(data.error ?? "Error al procesar el archivo.");
        return null;
      }

      const { text, chars, truncated } = await res.json() as {
        text: string;
        chars: number;
        truncated: boolean;
      };

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

      const newFile: LibraryFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: file.size,
        ext,
        uploadedAt: new Date().toISOString(),
        extractedText: text,
        truncated,
        chars,
      };

      setFiles((prev) => {
        const updated = [newFile, ...prev];
        saveFiles(updated);
        return updated;
      });

      return newFile;
    } catch {
      setUploadError("Error al subir el archivo.");
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const deleteFile = useCallback((id: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      saveFiles(updated);
      return updated;
    });
  }, []);

  return { files, uploading, uploadError, uploadFile, deleteFile };
}
