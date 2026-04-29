"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { QuizBlock } from "./QuizBlock";
import { ProgressTracker } from "./ProgressTracker";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { useLessons } from "@/hooks/useLessons";
import { useTTS, extractBlockText } from "@/hooks/useTTS";
import { cn } from "@/lib/utils";
import type {
  LessonBlock,
  ContentBlock,
  CalloutBlock,
  CalloutVariant,
  ImageBlock,
  DividerBlock,
  ExerciseBlock as ExerciseBlockType,
  ReflectionBlock as ReflectionBlockType,
  AIInteractionBlock as AIInteractionBlockType,
  VideoBlock as VideoBlockType,
  CodeBlock as CodeBlockType,
} from "@/types/lesson";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  Lightbulb,
  PenTool,
  Clock,
  Award,
  Send,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Play,
  Pause,
  Code2,
  Copy,
  Check,
  ArrowLeft,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";

// ── Helpers ─────────────────────────────────────────────────────────────────

function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?\s]+)/
  );
  return m?.[1] ?? null;
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// ── Callout ──────────────────────────────────────────────────────────────────

const calloutConfig: Record<
  CalloutVariant,
  { icon: React.ReactNode; classes: string; titleColor: string }
> = {
  info: {
    icon: <Info className="w-4 h-4" />,
    classes: "border-blue-500/30 bg-blue-500/5 text-blue-400",
    titleColor: "text-blue-400",
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    classes: "border-amber-500/30 bg-amber-500/5 text-amber-400",
    titleColor: "text-amber-400",
  },
  success: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    classes: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
    titleColor: "text-emerald-400",
  },
  tip: {
    icon: <Sparkles className="w-4 h-4" />,
    classes: "border-violet-500/30 bg-violet-500/5 text-violet-400",
    titleColor: "text-violet-400",
  },
  danger: {
    icon: <XCircle className="w-4 h-4" />,
    classes: "border-red-500/30 bg-red-500/5 text-red-400",
    titleColor: "text-red-400",
  },
};

// ── Block renderers ───────────────────────────────────────────────────────────

function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  return (
    <Card className="glass">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {block.title || "Contenido"}
          </span>
        </div>
        <MarkdownRenderer>{block.markdown}</MarkdownRenderer>
      </CardContent>
    </Card>
  );
}

function CalloutBlockRenderer({ block }: { block: CalloutBlock }) {
  const cfg = calloutConfig[block.variant];
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3.5 flex gap-3",
        cfg.classes
      )}
    >
      <span className="mt-0.5 shrink-0">{cfg.icon}</span>
      <div className="space-y-1 flex-1 min-w-0">
        {block.title && (
          <p className={cn("text-sm font-semibold", cfg.titleColor)}>
            {block.title}
          </p>
        )}
        <p className="text-sm text-foreground/80 leading-relaxed">{block.body}</p>
      </div>
    </div>
  );
}

function ImageBlockRenderer({ block }: { block: ImageBlock }) {
  return (
    <figure
      className={cn(
        "my-2",
        block.size === "half" && "max-w-sm mx-auto"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.src}
        alt={block.alt || ""}
        className="rounded-xl w-full object-cover border border-border/30 shadow-sm"
      />
      {block.caption && (
        <figcaption className="text-center text-xs text-muted-foreground mt-2 italic">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

function DividerBlockRenderer({ block }: { block: DividerBlock }) {
  if (block.label) {
    return (
      <div className="flex items-center gap-3 my-2">
        <hr className="flex-1 border-border/50" />
        <span className="text-xs text-muted-foreground px-2">{block.label}</span>
        <hr className="flex-1 border-border/50" />
      </div>
    );
  }
  return <hr className="my-2 border-border/50" />;
}

function ExerciseBlockRenderer({
  block,
  value,
  onChange,
  onSubmit,
  isCompleted,
  submission,
}: {
  block: ExerciseBlockType;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isCompleted: boolean;
  submission?: string;
}) {
  const [showHints, setShowHints] = useState(false);

  return (
    <Card className="glass border-amber-500/20">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <PenTool className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">
              Ejercicio
            </p>
            <p className="font-medium text-sm leading-relaxed">{block.prompt}</p>
          </div>
        </div>

        {block.hints && block.hints.length > 0 && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHints(!showHints)}
              className="gap-2 text-xs h-7"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {showHints ? "Ocultar pistas" : `Ver pistas (${block.hints.length})`}
            </Button>
            <AnimatePresence>
              {showHints && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-1.5 overflow-hidden"
                >
                  {block.hints.map((hint, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/60 shrink-0" />
                      {hint}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}

        {isCompleted && submission ? (
          <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">Enviado</span>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{submission}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Escribe tu respuesta aquí..."
              className="min-h-[120px] text-sm resize-y"
            />
            <Button
              onClick={onSubmit}
              disabled={!value.trim()}
              className="w-full gap-2"
            >
              <Send className="w-4 h-4" />
              Enviar respuesta
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReflectionBlockRenderer({
  block,
  value,
  onChange,
  onSubmit,
  isCompleted,
  previousReflection,
}: {
  block: ReflectionBlockType;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isCompleted: boolean;
  previousReflection?: string;
}) {
  return (
    <Card className="glass border-primary/20">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">
              Reflexión
            </p>
            <p className="font-medium text-sm leading-relaxed">{block.prompt}</p>
          </div>
        </div>

        {block.guidingQuestions && block.guidingQuestions.length > 0 && (
          <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Preguntas guía
            </p>
            <ul className="space-y-1.5">
              {block.guidingQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/60 shrink-0" />
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isCompleted && previousReflection ? (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {previousReflection}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Comparte tus reflexiones..."
              className="min-h-[140px] text-sm resize-y"
            />
            <Button
              onClick={onSubmit}
              disabled={!value.trim()}
              variant="secondary"
              className="w-full"
            >
              Guardar reflexión
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AIInteractionBlockRenderer({
  block,
  showChat,
  onToggleChat,
}: {
  block: AIInteractionBlockType;
  showChat: boolean;
  onToggleChat: () => void;
}) {
  return (
    <Card className="glass border-accent/20">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">
                Interacción con IA
              </p>
              <p className="font-medium text-sm">Conversa para profundizar</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onToggleChat} className="shrink-0">
            {showChat ? <Pause className="w-4 h-4 mr-1.5" /> : <Play className="w-4 h-4 mr-1.5" />}
            {showChat ? "Minimizar" : "Abrir chat"}
          </Button>
        </div>

        {block.suggestedQuestions && block.suggestedQuestions.length > 0 && !showChat && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Preguntas sugeridas</p>
            <div className="flex flex-wrap gap-2">
              {block.suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={onToggleChat}
                  className="px-3 py-1.5 rounded-lg text-xs bg-secondary hover:bg-accent/10 hover:text-accent border border-border/50 hover:border-accent/30 transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 420 }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-border/50 overflow-hidden"
            >
              <ChatContainer className="h-full" />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function VideoBlockRenderer({ block }: { block: VideoBlockType }) {
  const youtubeId = getYouTubeId(block.url);

  return (
    <Card className="glass overflow-hidden">
      <CardContent className="p-0">
        <div className="aspect-video bg-zinc-950">
          {youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
              title={block.title || "Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <video controls className="w-full h-full">
              <source src={block.url} />
              Tu navegador no soporta video HTML5.
            </video>
          )}
        </div>

        {(block.title || (block.timestamps && block.timestamps.length > 0)) && (
          <div className="p-4 space-y-3">
            {block.title && (
              <h3 className="font-semibold text-sm">{block.title}</h3>
            )}
            {block.duration && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatSeconds(block.duration)}</span>
              </div>
            )}
            {block.timestamps && block.timestamps.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Capítulos
                </p>
                {block.timestamps.map((ts, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm hover:text-primary transition-colors cursor-pointer"
                  >
                    <span className="font-mono text-xs text-muted-foreground w-10 shrink-0">
                      {formatSeconds(ts.time)}
                    </span>
                    <span>{ts.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CopyCodeButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      title="Copiar código"
      className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeChallengeBlockRenderer({
  block,
  onComplete,
  isCompleted,
}: {
  block: CodeBlockType;
  onComplete: (code: string) => void;
  isCompleted: boolean;
}) {
  const [code, setCode] = useState(block.starterCode ?? "");
  const [submitted, setSubmitted] = useState(isCompleted);

  const handleSubmit = () => {
    setSubmitted(true);
    onComplete(code);
  };

  return (
    <Card className="glass border-violet-500/20">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <Code2 className="w-5 h-5 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">
              Reto de código
            </p>
            {block.prompt && (
              <p className="font-medium text-sm leading-relaxed">{block.prompt}</p>
            )}
          </div>
        </div>

        {/* Code editor */}
        <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              {block.language}
            </span>
            <CopyCodeButton text={code} />
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={submitted}
            className={cn(
              "w-full p-4 font-mono text-xs text-zinc-100 bg-transparent resize-y min-h-[180px] outline-none leading-relaxed",
              submitted && "opacity-60 cursor-not-allowed"
            )}
            spellCheck={false}
            placeholder="// Escribe tu código aquí..."
          />
        </div>

        {/* Test cases */}
        {block.testCases && block.testCases.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Casos de prueba
            </p>
            <div className="space-y-1.5">
              {block.testCases.map((tc, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-xs font-mono p-2.5 rounded-lg bg-muted/40 border border-border/30"
                >
                  <span className="text-muted-foreground shrink-0">Entrada:</span>
                  <code className="text-foreground flex-1">{tc.input}</code>
                  <span className="text-muted-foreground shrink-0">→</span>
                  <code className="text-emerald-400 shrink-0">{tc.expectedOutput}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {submitted ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Código enviado</span>
          </div>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!code.trim()}
            className="w-full gap-2"
          >
            <Send className="w-4 h-4" />
            Enviar código
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface InteractiveLessonProps {
  lessonId: string;
}

export function InteractiveLesson({ lessonId }: InteractiveLessonProps) {
  const {
    lesson,
    progress,
    currentBlockIndex,
    currentBlock,
    isLoading,
    error,
    nextBlock: hookNextBlock,
    previousBlock: hookPreviousBlock,
    goToBlock: hookGoToBlock,
    submitQuizAnswer,
    submitExercise,
    submitReflection,
    completeBlock,
    isBlockCompleted,
    isLessonComplete,
    totalBlocks,
  } = useLessons({ lessonId });

  // Per-block input state (keyed by block index)
  const [exerciseInputs, setExerciseInputs] = useState<Record<number, string>>({});
  const [reflectionInputs, setReflectionInputs] = useState<Record<number, string>>({});
  const [showAIChat, setShowAIChat] = useState(false);

  const blockRef = useRef<HTMLDivElement>(null);
  const tts = useTTS();

  // Auto-scroll to block area on navigation
  useEffect(() => {
    blockRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentBlockIndex]);

  // TTS: narrate current block when enabled
  useEffect(() => {
    if (!tts.isEnabled || !currentBlock) return;
    const text = extractBlockText(currentBlock);
    if (text) tts.speak(text);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBlockIndex, tts.isEnabled]);

  // Auto-complete content/callout/image/divider/video blocks on navigation away
  const autoCompletePassiveBlock = useCallback(
    (index: number) => {
      if (!lesson) return;
      const block = lesson.blocks[index];
      const passiveTypes = ["content", "callout", "image", "divider", "video"];
      if (passiveTypes.includes(block.type) && !isBlockCompleted(index)) {
        completeBlock(index);
      }
    },
    [lesson, completeBlock, isBlockCompleted]
  );

  const goToBlock = useCallback(
    (index: number) => {
      autoCompletePassiveBlock(currentBlockIndex);
      setShowAIChat(false);
      hookGoToBlock(index);
    },
    [currentBlockIndex, autoCompletePassiveBlock, hookGoToBlock]
  );

  const nextBlock = useCallback(() => {
    autoCompletePassiveBlock(currentBlockIndex);
    setShowAIChat(false);
    hookNextBlock();
  }, [currentBlockIndex, autoCompletePassiveBlock, hookNextBlock]);

  const previousBlock = useCallback(() => {
    autoCompletePassiveBlock(currentBlockIndex);
    setShowAIChat(false);
    hookPreviousBlock();
  }, [currentBlockIndex, autoCompletePassiveBlock, hookPreviousBlock]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") nextBlock();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") previousBlock();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextBlock, previousBlock]);

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderBlock = useCallback(
    (block: LessonBlock, index: number) => {
      switch (block.type) {
        case "content":
          return <ContentBlockRenderer block={block} />;

        case "callout":
          return <CalloutBlockRenderer block={block} />;

        case "image":
          return <ImageBlockRenderer block={block} />;

        case "divider":
          return <DividerBlockRenderer block={block} />;

        case "quiz":
          return (
            <QuizBlock
              block={block}
              onSubmit={(selected) => submitQuizAnswer(index, selected)}
              isCompleted={isBlockCompleted(index)}
            />
          );

        case "exercise":
          return (
            <ExerciseBlockRenderer
              block={block}
              value={exerciseInputs[index] ?? ""}
              onChange={(v) =>
                setExerciseInputs((prev) => ({ ...prev, [index]: v }))
              }
              onSubmit={() => {
                submitExercise(index, exerciseInputs[index] ?? "");
                setExerciseInputs((prev) => ({ ...prev, [index]: "" }));
              }}
              isCompleted={isBlockCompleted(index)}
              submission={progress?.exerciseSubmissions[index]}
            />
          );

        case "reflection":
          return (
            <ReflectionBlockRenderer
              block={block}
              value={reflectionInputs[index] ?? ""}
              onChange={(v) =>
                setReflectionInputs((prev) => ({ ...prev, [index]: v }))
              }
              onSubmit={() => {
                submitReflection(index, reflectionInputs[index] ?? "");
                setReflectionInputs((prev) => ({ ...prev, [index]: "" }));
              }}
              isCompleted={isBlockCompleted(index)}
              previousReflection={progress?.reflections[index]}
            />
          );

        case "ai-interaction":
          return (
            <AIInteractionBlockRenderer
              block={block}
              showChat={showAIChat}
              onToggleChat={() => setShowAIChat((v) => !v)}
            />
          );

        case "video":
          return <VideoBlockRenderer block={block} />;

        case "code":
          return (
            <CodeChallengeBlockRenderer
              block={block}
              isCompleted={isBlockCompleted(index)}
              onComplete={(code) => submitExercise(index, code)}
            />
          );

        default:
          return null;
      }
    },
    [
      exerciseInputs,
      reflectionInputs,
      showAIChat,
      progress,
      isBlockCompleted,
      submitQuizAnswer,
      submitExercise,
      submitReflection,
    ]
  );

  // ── Loading / error ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="space-y-3 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse mx-auto" />
          <p className="text-sm text-muted-foreground animate-pulse">Cargando lección…</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <Card className="glass">
        <CardContent className="py-12 text-center space-y-3">
          <XCircle className="w-10 h-10 text-destructive mx-auto" />
          <p className="text-destructive font-medium">{error || "Lección no encontrada"}</p>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </CardContent>
      </Card>
    );
  }

  const difficultyColor: Record<string, string> = {
    beginner: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
    intermediate: "text-amber-500 border-amber-500/30 bg-amber-500/10",
    advanced: "text-red-500 border-red-500/30 bg-red-500/10",
  };

  const difficultyLabel: Record<string, string> = {
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
  };

  return (
    <div className="space-y-5">
      {/* Lesson header */}
      <Card className="glass">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full border",
                    difficultyColor[lesson.difficulty]
                  )}
                >
                  {difficultyLabel[lesson.difficulty]}
                </span>
                {lesson.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="text-xl font-bold font-heading">{lesson.title}</h1>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {lesson.description}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 text-sm text-muted-foreground shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lesson.estimatedMinutes} min</span>
                </div>
                <button
                  onClick={tts.toggle}
                  title={tts.isEnabled ? "Desactivar narración" : "Narrar lección con IA"}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all",
                    tts.isEnabled
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/50 bg-secondary hover:border-primary/30 hover:text-primary"
                  )}
                >
                  {tts.isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : tts.isPlaying ? (
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                  ) : tts.isEnabled ? (
                    <Volume2 className="w-3.5 h-3.5" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" />
                  )}
                  <span>{tts.isEnabled ? "Narrando" : "Escuchar"}</span>
                </button>
              </div>
              {progress && progress.score > 0 && (
                <div className="flex items-center gap-1.5 text-primary">
                  <Award className="w-3.5 h-3.5" />
                  <span className="font-semibold">{progress.score} pts</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <ProgressTracker
              blocks={lesson.blocks}
              currentIndex={currentBlockIndex}
              completedBlocks={progress?.completedBlocks || []}
              onBlockClick={goToBlock}
            />
          </div>
        </CardContent>
      </Card>

      {/* Block area */}
      <div ref={blockRef} className="scroll-mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBlockIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            {currentBlock && renderBlock(currentBlock, currentBlockIndex)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-1">
        <Button
          variant="outline"
          onClick={previousBlock}
          disabled={currentBlockIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        <span className="text-xs text-muted-foreground">
          {currentBlockIndex + 1} / {totalBlocks}
        </span>

        {currentBlockIndex < totalBlocks - 1 ? (
          <Button onClick={nextBlock} className="gap-2">
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={() => {
              autoCompletePassiveBlock(currentBlockIndex);
              if (isLessonComplete()) {
                window.location.href = "/learn";
              }
            }}
            variant={isLessonComplete() ? "default" : "secondary"}
            className="gap-2"
          >
            <Award className="w-4 h-4" />
            {isLessonComplete() ? "Completar lección" : "Finalizar"}
          </Button>
        )}
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-muted-foreground/50">
        Usa las flechas del teclado para navegar
      </p>
    </div>
  );
}
