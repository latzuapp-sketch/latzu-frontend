"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { BlockEditor } from "@/components/biblioteca/BlockEditor";
import { Button } from "@/components/ui/button";
import { Link2, Loader2, Play, FileText, StickyNote, FileType2, Mic2, Video } from "lucide-react";
import type { WorkspacePage, PageType } from "@/types/workspace";

// ─── Emoji picker ─────────────────────────────────────────────────────────────

const EMOJI_GRID = [
  "📄","📝","📑","🎙","🎬","📚","📖","🎓","💡","🧠","🔬","🎯",
  "📊","💼","🚀","🌟","💻","📱","🎨","🎵","🔗","📌","🏆","🌍",
  "🧩","⚡","🔭","🧪","🎤","🎸","📋","🗂️","📁","🌐","🔐","✨",
  "🏠","🌱","🧬","📰","🗺️","🎭","🔑","💎","🧲","🌊","🔥","❄️",
];

function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 top-full left-0 mt-2 p-2 rounded-xl border border-border/60 bg-card shadow-xl"
    >
      <div className="grid grid-cols-8 gap-1">
        {EMOJI_GRID.map((emoji) => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose(); }}
            className="w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-muted/40 transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Inline title ─────────────────────────────────────────────────────────────

function PageTitle({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select(); } }, [editing]);

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
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        className="w-full bg-transparent outline-none text-4xl font-heading font-bold leading-tight tracking-tight border-b border-primary/40"
        placeholder="Sin título"
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
      {value || "Sin título"}
    </h1>
  );
}

// ─── Media URL input ──────────────────────────────────────────────────────────

function MediaUrlInput({
  label,
  placeholder,
  current,
  onSave,
}: {
  label: string;
  placeholder: string;
  current: string | null;
  onSave: (url: string) => void;
}) {
  const [editing, setEditing] = useState(!current);
  const [draft, setDraft] = useState(current ?? "");

  useEffect(() => {
    setDraft(current ?? "");
    setEditing(!current);
  }, [current]);

  const commit = () => {
    if (draft.trim()) {
      onSave(draft.trim());
      setEditing(false);
    }
  };

  if (!editing && current) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground/70 mb-4">
        <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate flex-1 font-mono text-xs">{current}</span>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wide">{label}</p>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
          placeholder={placeholder}
          autoFocus={!current}
          className="flex-1 text-sm bg-muted/30 border border-border/50 rounded-lg px-3 py-2 outline-none focus:border-primary/50 transition-colors font-mono"
        />
        <Button size="sm" onClick={commit} disabled={!draft.trim()} className="px-4">
          Cargar
        </Button>
        {current && (
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── YouTube embed helper ─────────────────────────────────────────────────────

function youtubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

// ─── Media renderers ──────────────────────────────────────────────────────────

function PdfEmbed({ url }: { url: string }) {
  return (
    <div className="mb-6 rounded-xl overflow-hidden border border-border/40 bg-muted/10">
      <iframe
        src={url}
        className="w-full"
        style={{ height: "70vh" }}
        title="PDF"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

function PodcastEmbed({ url }: { url: string }) {
  return (
    <div className="mb-6 p-4 rounded-xl border border-border/40 bg-muted/10">
      <audio controls className="w-full" src={url}>
        Tu navegador no soporta el elemento de audio.
      </audio>
    </div>
  );
}

function VideoEmbed({ url }: { url: string }) {
  const embedUrl = youtubeEmbedUrl(url);

  if (embedUrl) {
    return (
      <div className="mb-6 rounded-xl overflow-hidden border border-border/40 aspect-video">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isDirectVideo(url)) {
    return (
      <div className="mb-6 rounded-xl overflow-hidden border border-border/40">
        <video controls className="w-full max-h-[60vh]" src={url}>
          Tu navegador no soporta el elemento de vídeo.
        </video>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 rounded-xl border border-border/40 bg-muted/10 flex items-center gap-3 text-sm text-muted-foreground">
      <Play className="w-4 h-4 flex-shrink-0" />
      <span>URL de vídeo no reconocida. Asegúrate de usar un enlace de YouTube o un archivo .mp4</span>
    </div>
  );
}

// ─── Notes section label ──────────────────────────────────────────────────────

function NotesSeparator() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-border/40" />
      <span className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider">Notas</span>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}

// ─── PageContent ──────────────────────────────────────────────────────────────

interface PageContentProps {
  page: WorkspacePage;
  onSave: (pageId: string, updates: Partial<WorkspacePage>) => Promise<void>;
}

export function PageContent({ page, onSave }: PageContentProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const saveContent = useCallback(
    (content: string) => onSave(page.id, { content }),
    [page.id, onSave]
  );

  const saveTitle = useCallback(
    (title: string) => onSave(page.id, { title }),
    [page.id, onSave]
  );

  const saveIcon = useCallback(
    (icon: string) => onSave(page.id, { icon }),
    [page.id, onSave]
  );

  const saveMedia = useCallback(
    (mediaUrl: string) => onSave(page.id, { mediaUrl }),
    [page.id, onSave]
  );

  const isMediaPage = page.pageType === "pdf" || page.pageType === "podcast" || page.pageType === "video";

  return (
    <div className="max-w-3xl mx-auto px-8 py-10 pb-20">
      {/* Icon */}
      <div className="relative mb-3 inline-block">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="text-5xl hover:bg-muted/20 rounded-xl p-1 -m-1 transition-colors"
          title="Cambiar icono"
        >
          {page.icon}
        </button>
        {showEmojiPicker && (
          <EmojiPicker
            onSelect={saveIcon}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </div>

      {/* Title */}
      <div className="mb-8">
        <PageTitle value={page.title} onSave={saveTitle} />
      </div>

      {/* Media URL + embed */}
      {page.pageType === "pdf" && (
        <>
          <MediaUrlInput
            label="URL del PDF"
            placeholder="https://example.com/documento.pdf"
            current={page.mediaUrl}
            onSave={saveMedia}
          />
          {page.mediaUrl && <PdfEmbed url={page.mediaUrl} />}
          {page.mediaUrl && <NotesSeparator />}
        </>
      )}

      {page.pageType === "podcast" && (
        <>
          <MediaUrlInput
            label="URL del audio"
            placeholder="https://example.com/episodio.mp3"
            current={page.mediaUrl}
            onSave={saveMedia}
          />
          {page.mediaUrl && <PodcastEmbed url={page.mediaUrl} />}
          {page.mediaUrl && <NotesSeparator />}
        </>
      )}

      {page.pageType === "video" && (
        <>
          <MediaUrlInput
            label="URL del vídeo"
            placeholder="https://youtube.com/watch?v=... o .mp4"
            current={page.mediaUrl}
            onSave={saveMedia}
          />
          {page.mediaUrl && <VideoEmbed url={page.mediaUrl} />}
          {page.mediaUrl && <NotesSeparator />}
        </>
      )}

      {/* Block editor — always shown; for media pages it's below the embed as notes */}
      {(!isMediaPage || page.mediaUrl) && (
        <BlockEditor
          nodeId={page.id}
          content={page.content}
          onSave={saveContent}
        />
      )}

      {/* If media page with no URL yet, show a hint */}
      {isMediaPage && !page.mediaUrl && (
        <p className="text-sm text-muted-foreground/40 italic mt-4 text-center">
          Carga el recurso para comenzar a tomar notas.
        </p>
      )}
    </div>
  );
}
