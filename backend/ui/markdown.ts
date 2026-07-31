import MarkdownIt from "npm:markdown-it@14.1.0";
import { raw, type HtmlEscapedString } from "npm:hono@4.5.11/utils/html";

// Shared Markdown renderer used for chapter content & descriptions.
// html:false keeps raw HTML escaped (XSS-safe); breaks:true maps newlines to <br>.
const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true,
});

/**
 * Render markdown to an HTML string that is safe to interpolate into
 * `html`...`` templates (it is marked as already-escaped so Hono inserts it raw).
 */
export function renderMarkdown(text: string | null | undefined): HtmlEscapedString {
  return raw(md.render(text ?? ""));
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
