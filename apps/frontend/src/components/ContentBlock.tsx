"use client";

import type { ContentNode } from "@api-navigator/shared/pseo";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import React from "react";

type ContentBlockProps = {
  nodes: ContentNode[];
  className?: string;
};

export function ContentBlock({ nodes, className = "" }: ContentBlockProps) {
  return (
    <div className={`content-blocks space-y-4 ${className}`}>
      {nodes.map((node, idx) => (
        <ContentNodeRenderer key={idx} node={node} />
      ))}
    </div>
  );
}

function ContentNodeRenderer({ node }: { node: ContentNode }) {
  switch (node.type) {
    case "heading": {
      const HeadingTag = `h${node.level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      const sizeClasses = {
        1: "text-2xl",
        2: "text-xl",
        3: "text-lg",
        4: "text-base",
        5: "text-sm",
        6: "text-xs",
      };
      return (
        <HeadingTag
          id={node.id}
          className={`font-semibold text-[var(--text-primary)] ${sizeClasses[node.level]}`}
        >
          {node.text}
        </HeadingTag>
      );
    }

    case "paragraph": {
      // Support markdown formatting in paragraphs (bold, italic, links)
      const htmlContent = DOMPurify.sanitize(marked.parseInline(node.text) as string);
      return (
        <p
          className={`text-sm text-[var(--text-secondary)] leading-relaxed ${node.className || ""}`}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
    }

    case "code_block": {
      return (
        <div className="code-block-wrapper">
          {node.filename && (
            <div className="text-xs text-[var(--text-muted)] mb-2 font-mono">
              {node.filename}
            </div>
          )}
          <pre className="ui-surface-muted p-4 rounded-lg overflow-x-auto">
            <code className={`language-${node.language} text-xs font-mono text-[var(--text-primary)]`}>
              {node.code}
            </code>
          </pre>
        </div>
      );
    }

    case "list": {
      const ListTag = node.ordered ? "ol" : "ul";
      const listStyle = node.ordered ? "list-decimal" : "list-disc";
      return (
        <ListTag className={`${listStyle} list-inside space-y-2 text-[var(--text-secondary)] text-sm`}>
          {node.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {typeof item === "string" ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked.parseInline(item) as string),
                  }}
                />
              ) : (
                <div className="ml-6">
                  <ContentNodeRenderer node={item} />
                </div>
              )}
            </li>
          ))}
        </ListTag>
      );
    }

    case "table": {
      return (
        <div className="overflow-x-auto rounded-lg border border-[var(--border-dim)]">
          <table className={`min-w-full divide-y divide-[var(--border-dim)] ${node.className || ""}`}>
            <thead className="ui-surface-muted">
              <tr>
                {node.headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-primary)]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-dim)]">
              {node.rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-[var(--bg-hover)]">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "quote": {
      return (
        <blockquote className="border-l-4 border-[var(--accent-green)] pl-4 italic text-[var(--text-secondary)]">
          <p className="text-sm">{node.text}</p>
          {(node.author || node.source) && (
            <footer className="mt-2 text-xs text-[var(--text-muted)]">
              {node.author && <span>— {node.author}</span>}
              {node.source && node.author && <span>, </span>}
              {node.source && <cite>{node.source}</cite>}
            </footer>
          )}
        </blockquote>
      );
    }

    case "image": {
      return (
        <figure>
          <img
            src={node.src}
            alt={node.alt}
            width={node.width}
            height={node.height}
            className="rounded-lg max-w-full h-auto"
          />
          {node.caption && (
            <figcaption className="mt-2 text-xs text-[var(--text-muted)] text-center">
              {node.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case "link": {
      return (
        <a
          href={node.url}
          className="text-[var(--accent-green)] hover:underline text-sm"
          target={node.external ? "_blank" : undefined}
          rel={node.external ? "noopener noreferrer" : undefined}
        >
          {node.text}
        </a>
      );
    }

    case "component": {
      // Component nodes are placeholders for custom components
      // In a real implementation, you'd map component names to actual components
      return (
        <div className="component-placeholder ui-surface-muted p-4 rounded-lg text-xs text-[var(--text-muted)]">
          Component: {node.name}
        </div>
      );
    }

    default:
      return null;
  }
}
