"use client";

import { useMemo } from "react";

/**
 * Renders chat text with basic markdown support:
 * **bold**, *italic*, `code`, and line breaks.
 * No external deps — just regex.
 */
export default function ChatBubble({ text }: { text: string }) {
  const rendered = useMemo(() => parseMarkdown(text), [text]);
  return <span dangerouslySetInnerHTML={{ __html: rendered }} />;
}

function parseMarkdown(text: string): string {
  return text
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    // Italic: *text* or _text_ (but not inside words with underscores)
    .replace(/(?<!\w)\*(.+?)\*(?!\w)/g, "<em>$1</em>")
    .replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>")
    // Inline code: `text`
    .replace(
      /`([^`]+)`/g,
      '<code style="background:rgba(255,255,255,0.08);padding:1px 4px;border-radius:3px;font-size:0.9em">$1</code>'
    )
    // Line breaks
    .replace(/\n/g, "<br />");
}
