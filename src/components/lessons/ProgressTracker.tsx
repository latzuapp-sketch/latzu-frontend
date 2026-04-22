"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LessonBlock } from "@/types/lesson";
import {
  FileText,
  HelpCircle,
  PenTool,
  MessageSquare,
  Lightbulb,
  Check,
  Video,
  Code2,
  Info,
  Image,
  Minus,
} from "lucide-react";

interface ProgressTrackerProps {
  blocks: LessonBlock[];
  currentIndex: number;
  completedBlocks: number[];
  onBlockClick: (index: number) => void;
}

const blockMeta: Record<
  string,
  { Icon: React.ElementType; label: string; color: string }
> = {
  content: { Icon: FileText, label: "Contenido", color: "text-sky-400" },
  callout: { Icon: Info, label: "Nota", color: "text-blue-400" },
  image: { Icon: Image, label: "Imagen", color: "text-indigo-400" },
  divider: { Icon: Minus, label: "Sección", color: "text-muted-foreground" },
  quiz: { Icon: HelpCircle, label: "Quiz", color: "text-primary" },
  exercise: { Icon: PenTool, label: "Ejercicio", color: "text-amber-400" },
  reflection: { Icon: Lightbulb, label: "Reflexión", color: "text-violet-400" },
  "ai-interaction": { Icon: MessageSquare, label: "IA", color: "text-accent" },
  video: { Icon: Video, label: "Video", color: "text-rose-400" },
  code: { Icon: Code2, label: "Código", color: "text-violet-500" },
};

const fallbackMeta = { Icon: FileText, label: "Bloque", color: "text-muted-foreground" };

export function ProgressTracker({
  blocks,
  currentIndex,
  completedBlocks,
  onBlockClick,
}: ProgressTrackerProps) {
  const progressPct = blocks.length > 0
    ? Math.round((completedBlocks.length / blocks.length) * 100)
    : 0;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-3">
        {/* Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium tabular-nums">
              {completedBlocks.length}/{blocks.length} bloques
            </span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>

        {/* Block indicators */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {blocks.map((block, index) => {
            const meta = blockMeta[block.type] ?? fallbackMeta;
            const { Icon, label, color } = meta;
            const isCompleted = completedBlocks.includes(index);
            const isCurrent = index === currentIndex;

            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => onBlockClick(index)}
                    className={cn(
                      "relative w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all border-2",
                      isCurrent &&
                        "border-primary bg-primary/10 shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]",
                      isCompleted &&
                        !isCurrent &&
                        "border-emerald-500/60 bg-emerald-500/10",
                      !isCurrent &&
                        !isCompleted &&
                        "border-border/50 hover:border-border bg-transparent"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Icon
                        className={cn(
                          "w-3.5 h-3.5",
                          isCurrent ? color : "text-muted-foreground/60"
                        )}
                      />
                    )}

                    {/* Current indicator dot */}
                    {isCurrent && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary border-2 border-background" />
                    )}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p className="font-medium">{label}</p>
                  <p className="text-muted-foreground">
                    {isCompleted
                      ? "Completado"
                      : isCurrent
                      ? "En curso"
                      : "Pendiente"}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
