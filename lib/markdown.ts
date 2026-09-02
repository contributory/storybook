import MarkdownIt from "markdown-it";

// Shared Markdown renderer used for chapter content & descriptions.
// html:false keeps raw HTML escaped (XSS-safe); breaks:true maps newlines to <br>.
const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true,
});

/**
 * Render markdown to an HTML string safe to inject with
 * `dangerouslySetInnerHTML` (raw HTML from users is escaped by markdown-it).
 */
export function renderMarkdownHtml(text: string | null | undefined): string {
  return md.render(text ?? "");
}

/**
 * Render markdown to plain text (tags & markdown syntax stripped), useful for
 * short line-clamped previews on cards where formatted HTML would break layout.
 */
export function markdownToText(text: string | null | undefined): string {
  if (!text) return "";
  return md
    .render(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
