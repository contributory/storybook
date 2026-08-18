/** @jsxImportSource npm:hono@4.5.11/jsx */
import { html } from "npm:hono/html";
import * as db from "../db.ts";

export function renderAuthorsList(authorsStr: string) {
  const authors = authorsStr.split(",").map(a => a.trim()).filter(Boolean);
  return html`${authors.map((author, index) => html`
    <a href="/profile/${author}" class="font-semibold text-amber-500 hover:underline">@${author}</a>${index < authors.length - 1 ? ", " : ""}
  `)}`;
}

import { renderCommentsArea } from "./comments.tsx";
import { renderMarkdown } from "./markdown.ts";

// Storybook detail page View
export function renderStorybookDetail(book: db.Storybook, chapters: Omit<db.Chapter, "content">[], user: db.User | null) {
  const allowEdit = book.allow_other_author_edit;

  return html`
    <div class="max-w-4xl mx-auto space-y-8 text-left">
        <!-- Breadcrumb / Header Cover -->
        <div class="p-8 bg-gradient-to-br from-white dark:from-[#161925] via-gray-100 dark:via-slate-900 to-amber-950/20 border border-gray-200 dark:border-gray-800 rounded-3xl relative flex flex-col md:flex-row gap-6">
            ${book.thumbnail_url ? html`
            <div class="w-32 h-44 rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800 flex-shrink-0">
                <img src="${book.thumbnail_url}" class="w-full h-full object-cover" />
            </div>
            ` : ""}
            <div class="flex-grow min-w-0">
                <div class="flex items-start justify-between gap-4 mb-3">
                    <div class="flex flex-wrap gap-1.5">
                        ${book.categories.split(",").map(c => html`
                        <span class="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">${c.trim()}</span>
                        `)}
                    </div>

                    <!-- Side action buttons (in flow so they never overlap the title/description) -->
                    <div class="flex flex-col space-y-2 items-end flex-shrink-0">
                        <button onclick="toggleLike('storybook', '${book.id}', this)" class="px-3.5 py-1.5 bg-gray-200 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700/80 border border-gray-300 dark:border-gray-700/60 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all">
                            <i class="fa-regular fa-heart"></i>
                            <span>${book.likes_count || 0}</span>
                        </button>

                        ${allowEdit ? html`
                        <span class="px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold text-center"><i class="fa-solid fa-users mr-1"></i> Cho phép đồng tác giả</span>
                        ` : ""}
                        ${book.storyverse_id ? html`
                        <a href="/create/character?storyverse_id=${book.storyverse_id}" class="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 hover:text-black text-amber-400 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all">
                            <i class="fa-solid fa-user-plus"></i>
                            <span>Tạo nhân vật</span>
                        </a>
                        ` : ""}
                        ${user && (book.authors.toLowerCase().includes(user.username.toLowerCase()) || user.is_admin || user.is_owner) ? html`
                        <a href="/create/storybook?id=${book.id}" class="px-3.5 py-1.5 bg-gray-250 dark:bg-gray-800 border border-gray-300 dark:border-gray-700/60 hover:bg-gray-300 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all">
                            <i class="fa-solid fa-pen-to-square"></i>
                            <span>Sửa truyện</span>
                        </a>
                        <button onclick="deleteBook('${book.id}')" class="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-550 border border-red-500/20 text-red-400 hover:text-black rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all">
                            <i class="fa-solid fa-trash-can"></i>
                            <span>Xóa truyện</span>
                        </button>
                        ` : ""}
                    </div>
                </div>

                <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-2">${book.title}</h1>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Bởi: <span class="font-medium text-gray-700 dark:text-gray-300">${renderAuthorsList(book.authors)}</span> &bull; Phát hành: ${new Date(book.created_at).toLocaleDateString("vi-VN")}
                </p>

                <div class="md text-sm leading-relaxed">${renderMarkdown(book.description)}</div>

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
            </div>
        </div>

        <!-- Chapters & Summary Area -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Side: Chapters List -->
            <div class="lg:col-span-2 space-y-4">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2"><i class="fa-solid fa-list mr-2 text-amber-500"></i> Mục lục chương (${chapters.length})</h3>

                ${chapters && chapters.length > 0 ? html`
                <div class="space-y-2">
                    ${chapters.map(ch => {
                      const isAuth = user && book.authors.toLowerCase().includes(user.username.toLowerCase());
                      const canDelCh = isAuth || (user && (user.is_admin || user.is_owner));
                      const canEditCh = isAuth || (user && (user.is_admin || user.is_owner)) || (user && book.allow_other_author_edit);
                      return html`
                    <div class="flex items-center justify-between p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-amber-500/40 rounded-xl hover:bg-gray-100 dark:bg-[#1a1e2e]/30 transition-all group">
                        <a href="/storybook/${book.id}/chapter/${ch.chapter_number}" class="flex-grow text-left space-y-1">
                            <h4 class="font-bold text-gray-800 dark:text-gray-200 group-hover:text-amber-400 transition-colors">Chương ${ch.chapter_number}: ${ch.title}</h4>
                            <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 italic">Tóm tắt: ${ch.summary || "Chưa có tóm tắt"}</p>
                        </a>
                        <div class="flex items-center space-x-3 ml-4">
                            ${canEditCh ? html`
                            <a href="/create/storybook?id=${book.id}&chapter_number=${ch.chapter_number}" class="p-2 text-gray-500 hover:text-amber-500 transition-colors" title="Sửa chương này">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </a>
                            ` : ""}
                            ${canDelCh ? html`
                            <button onclick="deleteChapter(event, '${book.id}', ${ch.chapter_number})" class="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Xóa chương này">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                            ` : ""}
                            <a href="/storybook/${book.id}/chapter/${ch.chapter_number}" class="text-gray-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all">
                                <i class="fa-solid fa-chevron-right"></i>
                            </a>
                        </div>
                    </div>
                    `;})}
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

        <script>
            async function deleteBook(bookId) {
                if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn bộ truyện này cùng tất cả các chương? Thao tác này không thể hoàn tác!')) return;
                try {
                    const res = await fetch(\`/api/storybooks/\${bookId}\`, { method: 'DELETE' });
                    const data = await res.json();
                    if (data.success) {
                        window.location.href = '/';
                    } else {
                        alert('Lỗi: ' + (data.error || 'Không thể xóa.'));
                    }
                } catch (err) {
                    console.error(err);
                }
            }

            async function deleteChapter(e, bookId, num) {
                e.preventDefault();
                if (!confirm(\`Xác nhận xóa Chương \${num}?\`)) return;
                try {
                    const res = await fetch(\`/api/storybooks/\${bookId}/chapters/\${num}\`, { method: 'DELETE' });
                    const data = await res.json();
                    if (data.success) {
                        window.location.reload();
                    } else {
                        alert('Lỗi: ' + (data.error || 'Không thể xóa chương.'));
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        </script>

        <!-- Characters Section -->
        ${(() => {
          let bookChars = [];
          try {
            bookChars = JSON.parse(book.characters || "[]");
          } catch (_) {}

          if (bookChars.length === 0) return "";

          return html`
          <div class="space-y-4">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2"><i class="fa-solid fa-users mr-2 text-amber-500"></i> Nhân vật chính (${bookChars.length})</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  ${bookChars.map((c: any) => html`
                  <div class="p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 rounded-xl space-y-2">
                      <div class="flex items-center justify-between flex-wrap gap-1.5">
                          <h4 class="font-bold text-gray-800 dark:text-gray-250">${c.name}</h4>
                          ${c.role ? html`<span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider">${c.role}</span>` : ""}
                      </div>
                      ${c.id ? html`
                      <div class="mt-1">
                          ${book.storyverse_id ? html`
                          <a href="/storyverses/${book.storyverse_id}" class="inline-flex items-center px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold hover:underline">
                              <i class="fa-solid fa-link mr-1"></i> Nhân vật liên kết: @${c.id}
                          </a>
                          ` : html`
                          <span class="inline-flex items-center px-2 py-0.5 rounded bg-gray-500/20 text-gray-500 text-[9px] font-bold">
                              <i class="fa-solid fa-link mr-1"></i> Nhân vật liên kết: @${c.id}
                          </span>
                          `}
                      </div>
                      ` : ""}
                      ${c.description ? html`<p class="text-xs text-gray-650 dark:text-gray-400 leading-relaxed">${c.description}</p>` : ""}
                  </div>
                  `)}
              </div>
          </div>
          `;
        })()}

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
            <p class="text-xs text-gray-500 dark:text-gray-500">Người viết: ${renderAuthorsList(book.authors)} &bull; Cập nhật: ${new Date(chapter.created_at).toLocaleDateString("vi-VN")}</p>

            <!-- TTS Reader Controls -->
            <div class="inline-flex items-center space-x-2 bg-white dark:bg-[#161925] border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-2xl shadow-sm mt-3">
                <button onclick="toggleTTS()" id="btn-tts-toggle" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors">
                    <i class="fa-solid fa-play"></i>
                    <span id="tts-toggle-text">Đọc Chương (TTS)</span>
                </button>
                <button onclick="stopTTS()" id="btn-tts-stop" class="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors hidden">
                    <i class="fa-solid fa-square"></i>
                    <span>Dừng</span>
                </button>
            </div>
        </div>

        <script>
            let ttsUtterance = null;
            let ttsPlaying = false;
            let ttsPaused = false;

            function toggleTTS() {
                const toggleBtn = document.getElementById('btn-tts-toggle');
                const toggleText = document.getElementById('tts-toggle-text');
                const stopBtn = document.getElementById('btn-tts-stop');
                const icon = toggleBtn.querySelector('i');

                if (!('speechSynthesis' in window)) {
                    alert('Trình duyệt của bạn không hỗ trợ Text-to-Speech.');
                    return;
                }

                if (!ttsUtterance) {
                    // Extract clean text directly from the rendered HTML using innerText, bypassing markdown markers
                    const contentText = document.getElementById('readerContent').innerText.trim();
                    if (!contentText) {
                        alert('Chương này không có nội dung để đọc.');
                        return;
                    }

                    ttsUtterance = new SpeechSynthesisUtterance(contentText);
                    ttsUtterance.lang = 'vi-VN';

                    ttsUtterance.onend = () => {
                        resetTTSUI();
                    };

                    ttsUtterance.onerror = () => {
                        resetTTSUI();
                    };

                    window.speechSynthesis.speak(ttsUtterance);
                    ttsPlaying = true;
                    ttsPaused = false;

                    // Update UI to show Playing State
                    icon.className = 'fa-solid fa-pause';
                    toggleText.innerText = 'Tạm dừng đọc';
                    stopBtn.classList.remove('hidden');
                } else {
                    if (ttsPaused) {
                        window.speechSynthesis.resume();
                        ttsPaused = false;
                        ttsPlaying = true;
                        icon.className = 'fa-solid fa-pause';
                        toggleText.innerText = 'Tạm dừng đọc';
                    } else if (ttsPlaying) {
                        window.speechSynthesis.pause();
                        ttsPaused = true;
                        ttsPlaying = false;
                        icon.className = 'fa-solid fa-play';
                        toggleText.innerText = 'Tiếp tục đọc';
                    }
                }
            }

            function stopTTS() {
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                }
                resetTTSUI();
            }

            function resetTTSUI() {
                ttsUtterance = null;
                ttsPlaying = false;
                ttsPaused = false;

                const toggleBtn = document.getElementById('btn-tts-toggle');
                const toggleText = document.getElementById('tts-toggle-text');
                const stopBtn = document.getElementById('btn-tts-stop');
                const icon = toggleBtn.querySelector('i');

                if (icon) icon.className = 'fa-solid fa-play';
                if (toggleText) toggleText.innerText = 'Đọc Chương (TTS)';
                if (stopBtn) stopBtn.classList.add('hidden');
            }
        </script>



        <!-- Reading Content Box -->
        <article id="readerContent" class="reader-font md bg-white dark:bg-[#161925]/25 border border-gray-200 dark:border-gray-800/50 rounded-3xl p-6 sm:p-10 text-gray-800 dark:text-gray-200 text-lg sm:text-xl leading-loose text-justify selection:bg-amber-500/20">
            ${renderMarkdown(chapter.content)}
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
