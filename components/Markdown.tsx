import { renderMarkdownHtml } from "@/lib/markdown";

// Server-rendered markdown block (safe: markdown-it escapes raw HTML)
export default function Markdown({
  text,
  className = "",
}: {
  text: string | null | undefined;
  className?: string;
}) {
  return (
    <div
      className={`md ${className}`}
      dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(text) }}
    />
  );
}
