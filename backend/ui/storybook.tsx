/** @jsxImportSource npm:hono@4.5.11/jsx */
import { html } from "npm:hono/html";
import * as db from "../db.ts";

import { renderCommentsArea } from "./comments.tsx";

// Storybook detail page View
export function renderStorybookDetail(book: db.Storybook, chapters: Omit<db.Chapter, "content">[], user: db.User | null) {
  const allowEdit = book.allow_other_author_edit;

  return html`
    <div class="max-w-4xl mx-auto space-y-8 text-left">
        <!-- Breadcrumb / Header Cover -->
        <div class="p-8 bg-gradient-to-br from-white dark:from-[#161925] via-gray-100 dark:via-slate-900 to-amber-950/20 border border-gray-200 dark:border-gray-800 rounded-3xl relative">
            <div class="flex flex-wrap gap-1.5 mb-3">
                ${book.categories.split(",").map(c => html`
                <span class="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">${c.trim()}</span>
                `)}
            </div>

            <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-2">${book.title}</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Bởi: <span class="font-medium text-gray-700 dark:text-gray-300">${book.authors}</span> &bull; Phát hành: ${new Date(book.created_at).toLocaleDateString("vi-VN")}
            </p>

            <p class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">${book.description}</p>

            <div class="flex flex-wrap gap-3 mt-6">
                ${chapters && chapters.length > 0 ? html`
                <a href="/storybook/${book.id}/chapter/1" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/10 flex items-center space-x-1.5 transition-colors">
                    <i class="fa-solid fa-book-open"></i>
                    <span>Đọc từ đầu (Chương 1)</span>
                </a>
                ` : html`
                <button class="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 text-xs rounded-xl cursor-not-allowed font-semibold" disabled>Chưa có chương</button>
                `}

                ${book.storyverse_id ? html`
                <a href="/storyverses/${book.storyverse_id}" class="px-4 py-2 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-700/80 text-gray-900 dark:text-white font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1.5">
                    <i class="fa-solid fa-earth-asia text-amber-400"></i>
                    <span>Vũ trụ cốt truyện</span>
                </a>
                ` : ""}
            </div>

            <!-- Side action floats -->
            <div class="absolute top-8 right-8 flex flex-col space-y-2">
                <button onclick="toggleLike('storybook', '${book.id}', this)" class="px-3.5 py-1.5 bg-gray-200 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700/80 border border-gray-300 dark:border-gray-700/60 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all">
                    <i class="fa-regular fa-heart"></i>
                    <span>${book.likes_count || 0}</span>
                </button>

                ${allowEdit ? html`
                <span class="px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold text-center"><i class="fa-solid fa-users mr-1"></i> Cho phép đồng tác giả</span>
                ` : ""}
            </div>
        </div>

        <!-- Chapters & Summary Area -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Side: Chapters List -->
            <div class="lg:col-span-2 space-y-4">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2"><i class="fa-solid fa-list mr-2 text-amber-500"></i> Mục lục chương (${chapters.length})</h3>

                ${chapters && chapters.length > 0 ? html`
                <div class="space-y-2">
                    ${chapters.map(ch => html`
                    <a href="/storybook/${book.id}/chapter/${ch.chapter_number}" class="flex items-center justify-between p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-amber-500/40 rounded-xl hover:bg-gray-100 dark:bg-[#1a1e2e]/30 transition-all group">
                        <div class="text-left space-y-1">
                            <h4 class="font-bold text-gray-800 dark:text-gray-200 group-hover:text-amber-400 transition-colors">Chương ${ch.chapter_number}: ${ch.title}</h4>
                            <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 italic">Tóm tắt: ${ch.summary || "Chưa có tóm tắt"}</p>
                        </div>
                        <i class="fa-solid fa-chevron-right text-gray-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all"></i>
                    </a>
                    `)}
                </div>
                ` : html`
                <div class="p-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                    <i class="fa-solid fa-book-open-reader text-gray-600 text-3xl mb-3"></i>
                    <p class="text-sm text-gray-500 dark:text-gray-500">Truyện này chưa có chương nào được viết.</p>
                </div>
                `}
            </div>

            <!-- Right Side: Collaboration / AI context card -->
            <div class="space-y-4">
                <div class="p-5 bg-gradient-to-tr from-white dark:from-[#161925] to-gray-100 dark:to-[#1d2133] border border-gray-200 dark:border-gray-800 rounded-2xl text-left space-y-4 shadow-lg">
                    <h4 class="font-bold text-amber-400 flex items-center">
                        <i class="fa-solid fa-robot mr-2"></i> Trợ lý viết tiếp (AI)
                    </h4>
                    <p class="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        Bạn có muốn viết tiếp cho bộ truyện này? Hệ thống của chúng tôi hỗ trợ tự động **gói tóm tắt các chương** trước đó và gửi trực tiếp sang AI để nó tiếp thu cốt truyện nhanh nhất mà không bị quá tải ngữ cảnh.
                    </p>
                    <div class="p-3 bg-gray-50 dark:bg-[#0f111a] rounded-lg border border-gray-200 dark:border-gray-850">
                        <span class="text-[10px] uppercase font-semibold text-gray-500 dark:text-gray-500 block">Lợi thế tóm tắt:</span>
                        <p class="text-[11px] text-amber-500/90 mt-1"><i class="fa-solid fa-check mr-1"></i> Tiết kiệm 90% dung lượng Token.</p>
                        <p class="text-[11px] text-amber-500/90 mt-0.5"><i class="fa-solid fa-check mr-1"></i> Logic cốt truyện được duy trì hoàn hảo.</p>
                    </div>
                    ${allowEdit || (user && book.authors.toLowerCase().includes(user.username.toLowerCase())) ? html`
                    <a href="/creator?book_id=${book.id}" class="block w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-center font-bold text-xs rounded-lg hover:brightness-110 transition-all">
                        <i class="fa-solid fa-feather-pointed mr-1"></i> Viết chương mới
                    </a>
                    ` : ""}
                </div>
            </div>
        </div>

        <!-- Comments Area -->
        ${renderCommentsArea("storybook", book.id)}
    </div>
  `;
}

// Chapter Reader Page
export function renderChapterReader(book: db.Storybook, chapter: db.Chapter, nextNum: number | null, prevNum: number | null) {
  return html`
    <div class="max-w-3xl mx-auto space-y-8">

        <!-- Breadcrumbs & Actions -->
        <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 pb-4">
            <a href="/storybook/${book.id}" class="hover:text-amber-400 transition-colors flex items-center space-x-1.5">
                <i class="fa-solid fa-chevron-left"></i>
                <span class="font-semibold text-gray-700 dark:text-gray-300">Quay lại: ${book.title}</span>
            </a>

            <div class="flex items-center space-x-3">
                <button onclick="setNextTheme()" class="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors" title="Đổi màu nền toàn trang">
                    <i class="fa-solid fa-circle-half-stroke"></i>
                </button>
            </div>
        </div>

        <!-- Book & Chapter Title -->
        <div class="text-center space-y-3 pt-4">
            <span class="text-xs uppercase tracking-widest font-semibold text-amber-500">Chương ${chapter.chapter_number}</span>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight font-serif">${chapter.title}</h1>
            <p class="text-xs text-gray-500 dark:text-gray-500">Người viết: ${book.authors} &bull; Cập nhật: ${new Date(chapter.created_at).toLocaleDateString("vi-VN")}</p>
        </div>

        <!-- AI Summary Infobox -->
        ${chapter.summary ? html`
        <div class="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-left space-y-2 relative overflow-hidden">
            <div class="absolute -right-8 -bottom-8 text-amber-500/5 text-6xl pointer-events-none">
                <i class="fa-solid fa-robot"></i>
            </div>
            <h4 class="text-xs uppercase tracking-wider font-bold text-amber-400 flex items-center">
                <i class="fa-solid fa-robot mr-1.5"></i> Tóm tắt hỗ trợ AI (AI Summary)
            </h4>
            <p class="text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic">${chapter.summary}</p>
        </div>
        ` : ""}

        <!-- Reading Content Box -->
        <article id="readerContent" class="reader-font bg-white dark:bg-[#161925]/25 border border-gray-200 dark:border-gray-800/50 rounded-3xl p-6 sm:p-10 text-gray-800 dark:text-gray-200 text-lg sm:text-xl leading-loose text-justify whitespace-pre-wrap selection:bg-amber-500/20">
            ${chapter.content}
        </article>

        <!-- Chapter Navigation Bar -->
        <div class="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-800">
            ${prevNum ? html`
            <a href="/storybook/${book.id}/chapter/${prevNum}" class="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5">
                <i class="fa-solid fa-arrow-left"></i>
                <span>Chương trước</span>
            </a>
            ` : html`<span class="text-gray-600 text-xs italic">Chương đầu tiên</span>`}

            <a href="/storybook/${book.id}" class="px-4 py-2 bg-white dark:bg-[#161925] border border-gray-200 dark:border-gray-800 hover:border-amber-500/30 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-all">
                <i class="fa-solid fa-list mr-1"></i> Mục lục
            </a>

            ${nextNum ? html`
            <a href="/storybook/${book.id}/chapter/${nextNum}" class="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-bold rounded-xl shadow shadow-yellow-500/10 hover:brightness-110 transition-all flex items-center space-x-1.5">
                <span>Chương tiếp</span>
                <i class="fa-solid fa-arrow-right"></i>
            </a>
            ` : html`
            <div class="text-right space-y-1">
                <span class="text-xs text-amber-500/80 font-bold block"><i class="fa-solid fa-check-double mr-1"></i> Hết chương</span>
                ${book.allow_other_author_edit ? html`
                <a href="/creator?book_id=${book.id}" class="text-[10px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors underline block">Đóng góp chương tiếp?</a>
                ` : ""}
            </div>
            `}
        </div>
    </div>
  `;
}
