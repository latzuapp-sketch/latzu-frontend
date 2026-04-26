"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import katex from "katex";
import { Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      title="Copiar"
      className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

export function MarkdownRenderer({ children, className }: MarkdownRendererProps) {
  return (
    <div className={cn("text-sm leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold font-heading mt-8 mb-4 first:mt-0 text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-6 mb-3 first:mt-0 pb-2 border-b border-border text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-5 mb-2 text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold mt-4 mb-1 text-foreground/90">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-7 last:mb-0 text-foreground/85">{children}</p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline underline-offset-2 inline-flex items-center gap-0.5 font-medium"
            >
              {children}
              <ExternalLink className="w-3 h-3 inline shrink-0" />
            </a>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 pl-5 space-y-1.5 list-disc marker:text-primary">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 pl-5 space-y-1.5 list-decimal marker:text-primary">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground/85 leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-primary/60 pl-4 pr-3 py-2 bg-primary/5 rounded-r-lg">
              <div className="text-muted-foreground italic text-sm [&_p]:mb-0">
                {children}
              </div>
            </blockquote>
          ),
          code: ({ className: codeClass, children }) => {
            const mathStr = String(children).replace(/\n$/, "");
            if (codeClass?.includes("math-inline")) {
              try {
                return (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(mathStr, { throwOnError: false }),
                    }}
                  />
                );
              } catch {
                return <code>{children}</code>;
              }
            }
            if (codeClass?.includes("math-display")) {
              try {
                return (
                  <span
                    className="block my-4 overflow-x-auto text-center"
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(mathStr, { displayMode: true, throwOnError: false }),
                    }}
                  />
                );
              } catch {
                return <code>{children}</code>;
              }
            }

            const isBlock = !!codeClass?.includes("language-");
            const lang = codeClass?.replace("language-", "") ?? "";

            if (isBlock) {
              return (
                <div className="my-4 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
                    <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">
                      {lang || "código"}
                    </span>
                    <CopyButton text={mathStr} />
                  </div>
                  <pre className="overflow-x-auto p-4 scrollbar-thin">
                    <code className="font-mono text-xs text-zinc-100 leading-relaxed">
                      {mathStr}
                    </code>
                  </pre>
                </div>
              );
            }

            return (
              <code className="px-1.5 py-0.5 rounded-md bg-muted border border-border/60 font-mono text-xs text-primary/90">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/60 border-b border-border">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {children}
            </th>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border/50">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/20 transition-colors">{children}</tr>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 text-sm text-foreground/80">{children}</td>
          ),
          hr: () => <hr className="my-6 border-border/60" />,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/75">{children}</em>
          ),
          img: ({ src, alt }) => (
            <figure className="my-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt || ""}
                className="rounded-lg w-full object-cover border border-border/30"
              />
              {alt && (
                <figcaption className="text-center text-xs text-muted-foreground mt-2">
                  {alt}
                </figcaption>
              )}
            </figure>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
