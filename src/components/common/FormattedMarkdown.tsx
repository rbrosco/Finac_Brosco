"use client";

import React from "react";

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

export default function FormattedMarkdown({ content, className = "" }: FormattedMarkdownProps) {
  if (!content) return null;

  const lines = content.split("\n");

  const renderInline = (text: string) => {
    const parts: React.ReactNode[] = [];
    let key = 0;

    // Matches **bold**, __bold__, `code`, *italic*
    const regex = /(\*\*(.*?)\*\*|__(.*?)__|`(.*?)`|\*(.*?)\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const fullMatch = match[0];
      if (fullMatch.startsWith("**") || fullMatch.startsWith("__")) {
        const boldText = match[2] || match[3] || "";
        parts.push(
          <strong key={key++} className="font-bold text-white">
            {boldText}
          </strong>
        );
      } else if (fullMatch.startsWith("`")) {
        const codeText = match[4] || "";
        parts.push(
          <code key={key++} className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-indigo-300">
            {codeText}
          </code>
        );
      } else if (fullMatch.startsWith("*")) {
        const italicText = match[5] || "";
        parts.push(
          <em key={key++} className="italic text-slate-200">
            {italicText}
          </em>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Headers ### Header, ## Header, # Header
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-extrabold text-sm text-indigo-200 mt-2 mb-1 flex items-center gap-1.5">
              {renderInline(trimmed.substring(4))}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className="font-extrabold text-base text-indigo-100 mt-2 mb-1">
              {renderInline(trimmed.substring(3))}
            </h3>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={idx} className="font-extrabold text-lg text-white mt-2 mb-1">
              {renderInline(trimmed.substring(2))}
            </h2>
          );
        }

        // Unordered lists (- item, * item)
        if (/^[-*]\s+/.test(trimmed)) {
          const itemText = trimmed.replace(/^[-*]\s+/, "");
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-brand-400 font-bold text-xs shrink-0 mt-0.5">•</span>
              <span className="text-xs text-slate-200 leading-relaxed">{renderInline(itemText)}</span>
            </div>
          );
        }

        // Numbered lists (1. item, 2. item)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const itemText = numMatch[2];
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-indigo-400 font-bold text-xs shrink-0 mt-0.5">{num}.</span>
              <span className="text-xs text-slate-200 leading-relaxed">{renderInline(itemText)}</span>
            </div>
          );
        }

        // Normal paragraph line
        return (
          <p key={idx} className="text-xs leading-relaxed text-slate-200">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}
