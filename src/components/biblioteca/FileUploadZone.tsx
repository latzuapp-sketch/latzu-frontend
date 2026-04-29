"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { UploadCloud, Loader2, AlertCircle } from "lucide-react";

interface FileUploadZoneProps {
  onUpload: (file: File) => Promise<unknown>;
  uploading: boolean;
  error: string | null;
}

const ALLOWED = ".txt,.md,.pdf,.csv";
const ALLOWED_SET = new Set(["txt", "md", "pdf", "csv"]);

export function FileUploadZone({ onUpload, uploading, error }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_SET.has(ext)) {
      setLocalError(`Tipo .${ext} no soportado. Usa PDF, TXT, MD o CSV.`);
      return;
    }
    setLocalError(null);
    onUpload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const displayError = error || localError;

  return (
    <div className="space-y-2">
      <div
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 py-10 rounded-xl border-2 border-dashed transition-all cursor-pointer",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border/50 bg-card/30 hover:border-primary/40 hover:bg-card/50",
          uploading && "cursor-not-allowed opacity-60"
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Procesando archivo…</p>
          </>
        ) : (
          <>
            <UploadCloud className={cn("w-8 h-8 transition-colors", dragging ? "text-primary" : "text-muted-foreground/40")} />
            <p className="text-sm font-medium">
              {dragging ? "Suelta aquí" : "Arrastra un archivo o haz clic"}
            </p>
            <p className="text-xs text-muted-foreground/60">PDF, TXT, Markdown, CSV — hasta 10 MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {displayError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {displayError}
        </div>
      )}
    </div>
  );
}
