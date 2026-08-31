/** @jsxImportSource hono/jsx */
import { html } from "hono/html";

export interface PageInfo {
  page: number;
  totalPages: number;
  total?: number;
}

// Build a compact window of page numbers around the current page, with ellipses
function pageWindow(current: number, total: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  const windowSize = 2;
  const start = Math.max(1, current - windowSize);
  const end = Math.min(total, current + windowSize);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("...");
  }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total) {
    if (end < total - 1) pages.push("...");
    pages.push(total);
  }
  return pages;
}

// Reusable server-side pagination control.
// basePath: e.g. "/storybooks". extraParams preserved on every page link.
// pageParam: query key used for the page number (defaults to "page").
export function renderPagination(
  pageInfo: PageInfo,
  basePath: string,
  extraParams: Record<string, string> = {},
  pageParam = "page"
) {
  const { page, totalPages } = pageInfo;
  if (!totalPages || totalPages <= 1) return "";

  const buildUrl = (p: number) => {
    const params = new URLSearchParams(extraParams);
    params.set(pageParam, String(p));
    const qs = params.toString();
    return `${basePath}${qs ? "?" + qs : ""}`;
  };

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return html`
    <nav class="flex items-center justify-center gap-1.5 mt-10 flex-wrap" aria-label="Phân trang">
      ${prevDisabled ? html`
      <span class="px-3.5 py-2 bg-gray-100 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 rounded-lg text-xs font-semibold cursor-not-allowed flex items-center space-x-1.5">
        <i class="fa-solid fa-chevron-left text-[10px]"></i>
        <span>Trước</span>
      </span>
      ` : html`
      <a href="${buildUrl(page - 1)}" class="px-3.5 py-2 bg-white dark:bg-[#161925] border border-gray-200 dark:border-gray-800 hover:border-amber-500/40 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5">
        <i class="fa-solid fa-chevron-left text-[10px]"></i>
        <span>Trước</span>
      </a>
      `}

      ${pageWindow(page, totalPages).map(p =>
        p === "..." ? html`
        <span class="px-2 py-2 text-gray-400 dark:text-gray-600 text-xs select-none">…</span>
        ` : p === page ? html`
        <span class="w-9 h-9 flex items-center justify-center bg-amber-500 text-black font-bold text-xs rounded-lg shadow-lg shadow-yellow-500/10 select-none">${p}</span>
        ` : html`
        <a href="${buildUrl(p)}" class="w-9 h-9 flex items-center justify-center bg-white dark:bg-[#161925] border border-gray-200 dark:border-gray-800 hover:border-amber-500/40 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors">${p}</a>
        `
      )}

      ${nextDisabled ? html`
      <span class="px-3.5 py-2 bg-gray-100 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 rounded-lg text-xs font-semibold cursor-not-allowed flex items-center space-x-1.5">
        <span>Sau</span>
        <i class="fa-solid fa-chevron-right text-[10px]"></i>
      </span>
      ` : html`
      <a href="${buildUrl(page + 1)}" class="px-3.5 py-2 bg-white dark:bg-[#161925] border border-gray-200 dark:border-gray-800 hover:border-amber-500/40 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5">
        <span>Sau</span>
        <i class="fa-solid fa-chevron-right text-[10px]"></i>
      </a>
      `}
    </nav>
  `;
}
