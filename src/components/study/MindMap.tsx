"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MindNode {
  topic: string;
  children?: MindNode[];
}

interface LayoutNode {
  id: string;
  topic: string;
  x: number;
  y: number;
  depth: number;
  parentId?: string;
  colorIdx: number;
}

// ── Config ────────────────────────────────────────────────────────────────────

const CX = 400;
const CY = 310;
const RADII = [0, 150, 285, 390];
const BRANCH_COLORS = [
  "#818cf8", "#22d3ee", "#fbbf24", "#34d399",
  "#f87171", "#a78bfa", "#f472b6", "#2dd4bf",
];

// ── Layout ────────────────────────────────────────────────────────────────────

function wrapText(topic: string, maxChars = 14): string[] {
  const words = topic.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current && (current + " " + word).length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function nodeSize(topic: string, depth: number): { w: number; h: number } {
  const lines = wrapText(topic, depth === 0 ? 18 : 14);
  const maxLen = Math.max(...lines.map((l) => l.length));
  const w = Math.max(depth === 0 ? 100 : 64, maxLen * (depth === 0 ? 8.5 : 7.2) + 20);
  const h = lines.length === 1 ? (depth === 0 ? 36 : 28) : lines.length * 16 + 12;
  return { w, h };
}

function layoutTree(root: MindNode): LayoutNode[] {
  const nodes: LayoutNode[] = [];
  let counter = 0;

  function visit(
    node: MindNode, depth: number,
    sectorStart: number, sectorEnd: number,
    parentId?: string, colorIdx = 0
  ) {
    const id = String(counter++);
    const angle = (sectorStart + sectorEnd) / 2;
    const rad = ((angle - 90) * Math.PI) / 180;
    const r = RADII[Math.min(depth, RADII.length - 1)];
    const x = CX + r * Math.cos(rad);
    const y = CY + r * Math.sin(rad);
    nodes.push({ id, topic: node.topic, x, y, depth, parentId, colorIdx });
    const children = node.children ?? [];
    if (!children.length) return;
    const span = sectorEnd - sectorStart;
    const step = span / children.length;
    children.forEach((child, i) => {
      const nextColorIdx = depth === 0 ? i % BRANCH_COLORS.length : colorIdx;
      visit(child, depth + 1, sectorStart + i * step, sectorStart + (i + 1) * step, id, nextColorIdx);
    });
  }

  visit(root, 0, 0, 360);
  return nodes;
}

// ── SVG diagram ───────────────────────────────────────────────────────────────

function MindMapSVG({ data, className }: { data: MindNode; className?: string }) {
  const nodes = useMemo(() => layoutTree(data), [data]);
  const nodeMap = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  const allX = nodes.map((n) => n.x);
  const allY = nodes.map((n) => n.y);
  const pad = 90;
  const minX = Math.min(...allX) - pad;
  const minY = Math.min(...allY) - pad;
  const vw = Math.max(...allX) + pad - minX;
  const vh = Math.max(...allY) + pad - minY;

  return (
    <svg viewBox={`${minX} ${minY} ${vw} ${vh}`} className={cn("w-full h-full", className)} style={{ minHeight: 260 }}>
      {nodes.map((node) => {
        if (!node.parentId) return null;
        const parent = nodeMap[node.parentId];
        if (!parent) return null;
        const color = BRANCH_COLORS[node.colorIdx] ?? BRANCH_COLORS[0];
        const dx = (node.x - parent.x) * 0.5;
        return (
          <path key={`e-${node.id}`}
            d={`M ${parent.x} ${parent.y} C ${parent.x + dx} ${parent.y}, ${node.x - dx} ${node.y}, ${node.x} ${node.y}`}
            stroke={color} strokeWidth={node.depth === 1 ? 2 : 1.5} strokeOpacity={0.7} fill="none" />
        );
      })}
      {nodes.map((node) => {
        const { w, h } = nodeSize(node.topic, node.depth);
        const lines = wrapText(node.topic, node.depth === 0 ? 18 : 14);
        const color = node.depth === 0 ? "#6366f1" : BRANCH_COLORS[node.colorIdx] ?? BRANCH_COLORS[0];
        const isRoot = node.depth === 0;
        const textColor = isRoot ? "#fff" : color;
        const textY = lines.length === 1 ? h / 2 : h / 2 - ((lines.length - 1) * 14) / 2;

        return (
          <g key={node.id} transform={`translate(${node.x - w / 2},${node.y - h / 2})`}>
            <rect width={w} height={h} rx={isRoot ? 14 : 8}
              fill={color} fillOpacity={isRoot ? 1 : 0.15}
              stroke={color} strokeWidth={isRoot ? 0 : 1.5} strokeOpacity={isRoot ? 0 : 1} />
            <text textAnchor="middle" fontSize={isRoot ? 13.5 : 11}
              fontWeight={isRoot ? "700" : "500"} fontFamily="system-ui, sans-serif"
              fill={textColor} fillOpacity={isRoot ? 1 : 0.95}>
              {lines.map((line, i) => (
                <tspan key={i} x={w / 2} y={textY + i * 14}>{line}</tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Pan/zoom canvas ───────────────────────────────────────────────────────────

function PanZoomCanvas({ data }: { data: MindNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const clampScale = (s: number) => Math.min(3, Math.max(0.3, s));

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((t) => ({ ...t, scale: clampScale(t.scale * delta) }));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  const onMouseDown = (e: React.MouseEvent) => {
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isPanning.current) return;
    setTransform((t) => ({
      ...t,
      x: panStart.current.tx + e.clientX - panStart.current.x,
      y: panStart.current.ty + e.clientY - panStart.current.y,
    }));
  };
  const onMouseUp = () => { isPanning.current = false; };

  const reset = () => setTransform({ x: 0, y: 0, scale: 1 });
  const zoomIn = () => setTransform((t) => ({ ...t, scale: clampScale(t.scale * 1.2) }));
  const zoomOut = () => setTransform((t) => ({ ...t, scale: clampScale(t.scale * 0.8) }));

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-background/50 cursor-grab active:cursor-grabbing select-none"
      onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>

      {/* Controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        {[
          { icon: ZoomIn, fn: zoomIn, label: "Acercar" },
          { icon: ZoomOut, fn: zoomOut, label: "Alejar" },
          { icon: RotateCcw, fn: reset, label: "Resetear" },
        ].map(({ icon: Icon, fn, label }) => (
          <button key={label} onClick={(e) => { e.stopPropagation(); fn(); }} title={label}
            className="w-7 h-7 rounded-lg bg-card/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors shadow-sm">
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>

      <div style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: "center center", transition: isPanning.current ? "none" : "transform 0.1s ease-out" }}>
        <MindMapSVG data={data} />
      </div>
    </div>
  );
}

// ── Fullscreen modal ──────────────────────────────────────────────────────────

function MindMapFullscreen({ data, onClose }: { data: MindNode; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/95 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="relative z-10 flex flex-col w-full h-full">
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 shrink-0">
          <p className="font-semibold text-sm">{data.topic}</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <PanZoomCanvas data={data} />
        </div>
        <p className="text-center text-xs text-muted-foreground py-2 shrink-0">
          Rueda del ratón para zoom · Arrastra para navegar · ESC para cerrar
        </p>
      </motion.div>
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export function MindMap({ data }: { data: MindNode }) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <div className="relative rounded-xl border border-border/40 bg-muted/10 overflow-hidden" style={{ minHeight: 260 }}>
        <PanZoomCanvas data={data} />
        <button onClick={() => setFullscreen(true)} title="Ver en pantalla completa"
          className="absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-card/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors shadow-sm z-10">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {fullscreen && (
          <MindMapFullscreen data={data} onClose={() => setFullscreen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
