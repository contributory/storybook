/** @jsxImportSource npm:hono@4.5.11/jsx */
import { html } from "npm:hono/html";
import * as db from "../db.ts";

import { renderCommentsArea } from "./comments.tsx";
import { renderMarkdown } from "./markdown.ts";
import { renderPagination } from "./pagination.tsx";

// Storyverses directory list view
export function renderStoryverses(versesResult: db.PageResult<db.Storyverse>, user: db.User | null) {
  const storyverses = versesResult.items;
  const isCreator = user ? (user.is_creator || user.is_admin || user.is_owner) : false;
  return html`
    <div class="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-10 max-w-4xl mx-auto text-left">
        <div class="space-y-1">
            <h1 class="text-3xl font-black text-gray-900 dark:text-white">Vũ Trụ Cốt Truyện</h1>
            <p class="text-gray-600 dark:text-gray-400">Các vũ trụ cốt truyện (Storyverses) là nơi kết nối nhiều bộ truyện và chia sẻ chung một dàn nhân vật phong phú.</p>
        </div>
        ${isCreator ? html`
        <a href="/create/storyverse" class="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/10 hover:brightness-110 transition-all flex items-center space-x-1.5 flex-shrink-0">
            <i class="fa-solid fa-earth-asia"></i>
            <span>Tạo vũ trụ mới</span>
        </a>
        ` : ""}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        ${storyverses.length === 0 ? html`
        <div class="col-span-full p-10 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <i class="fa-solid fa-earth-asia text-gray-500 text-3xl mb-3"></i>
            <p class="text-sm text-gray-500 dark:text-gray-500">Chưa có vũ trụ nào được tạo.</p>
        </div>
        ` : storyverses.map(sv => html`
        <div class="p-6 bg-white dark:bg-[#161925]/60 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-4 text-left shadow-lg">
            <div class="space-y-1">
                <a href="/storyverses/${sv.id}">
                    <h3 class="text-2xl font-bold text-amber-400 hover:underline">${sv.title}</h3>
                </a>
                <span class="text-xs text-gray-500 dark:text-gray-500 block">Sáng lập bởi: <a href="/profile/${sv.author}" class="hover:text-amber-400 hover:underline">@${sv.author}</a></span>
            </div>

            <div class="md text-sm leading-relaxed">${renderMarkdown(sv.description)}</div>

            <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800/80 text-xs text-gray-600 dark:text-gray-400">
                <span class="font-medium"><i class="fa-solid fa-calendar mr-1.5"></i> ${new Date(sv.created_at).toLocaleDateString("vi-VN")}</span>
                <div class="flex space-x-4">
                    <span><i class="fa-solid fa-heart mr-1"></i> ${sv.likes_count || 0}</span>
                    <span><i class="fa-solid fa-comments mr-1"></i> ${sv.comments_count || 0}</span>
                </div>
            </div>
        </div>
        `)}
    </div>

    ${renderPagination(versesResult, "/storyverses")}
  `;
}

// Individual Storyverse view with Characters & Books
export function renderStoryverseDetail(sv: db.Storyverse, characters: db.Character[], user: db.User | null) {
  const isCreator = user ? (user.is_creator || user.is_admin || user.is_owner) : false;
  return html`
    <div class="max-w-4xl mx-auto space-y-8 text-left">
        <!-- Header -->
        <div class="p-8 bg-gradient-to-tr from-white dark:from-[#161925] via-[#10131f] to-amber-900/10 border border-gray-200 dark:border-gray-800 rounded-3xl relative flex flex-col md:flex-row gap-6">
            ${sv.thumbnail_url ? html`
            <div class="w-24 h-24 rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800 flex-shrink-0">
                <img src="${sv.thumbnail_url}" class="w-full h-full object-cover" />
            </div>
            ` : ""}
            <div class="flex-grow min-w-0">
                <div class="flex items-start justify-between gap-4">
                    <span class="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-md text-xs font-semibold"><i class="fa-solid fa-earth-asia mr-1"></i> Vũ trụ cốt truyện</span>
                    <!-- Side action buttons (in flow so they never overlap the content) -->
                    <div class="flex flex-col space-y-2 items-end flex-shrink-0">
                        <button onclick="toggleLike('storyverse', '${sv.id}', this)" class="px-4 py-2 bg-gray-200 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700/80 border border-gray-300 dark:border-gray-700/60 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all">
                            <i class="fa-regular fa-heart"></i>
                            <span>${sv.likes_count || 0} thích</span>
                        </button>
                        ${isCreator ? html`
                        <a href="/create/character?storyverse_id=${sv.id}" class="px-4 py-2 bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 hover:text-black text-amber-400 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all">
                            <i class="fa-solid fa-user-plus"></i>
                            <span>Tạo nhân vật</span>
                        </a>
                        ` : ""}
                        ${user && (sv.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner) ? html`
                        <a href="/create/storyverse?id=${sv.id}" class="px-4 py-2 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all">
                            <i class="fa-solid fa-pen-to-square"></i>
                            <span>Sửa vũ trụ</span>
                        </a>
                        <button onclick="deleteUniverse('${sv.id}')" class="px-4 py-2 bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:text-black text-red-400 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all">
                            <i class="fa-solid fa-trash-can"></i>
                            <span>Xóa vũ trụ</span>
                        </button>
                        ` : ""}
                    </div>
                </div>
                <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mt-4 mb-2">${sv.title}</h1>
                <p class="text-sm text-gray-650 dark:text-gray-400 font-medium">Sáng tạo bởi: <a href="/profile/${sv.author}" class="text-gray-805 dark:text-gray-200 hover:text-amber-400 hover:underline">@${sv.author}</a> &bull; ${new Date(sv.created_at).toLocaleDateString("vi-VN")}</p>
                <div class="md text-base mt-4 leading-relaxed">${renderMarkdown(sv.description)}</div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Books in Universe -->
            <div class="space-y-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2"><i class="fa-solid fa-book mr-2 text-amber-500"></i> Các bộ truyện liên quan</h2>
                ${sv.storybook_list && sv.storybook_list.length > 0 ? html`
                <div class="space-y-3">
                    ${sv.storybook_list.map(b => html`
                    <a href="/storybook/${b.id}" class="block p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-amber-500/40 rounded-xl hover:bg-gray-100 dark:bg-[#1a1e2e]/30 transition-all">
                        <h4 class="font-bold text-gray-800 dark:text-gray-200">${b.title}</h4>
                        <span class="text-xs text-gray-600 dark:text-gray-400 block mt-1">Tác giả: ${b.authors}</span>
                    </a>
                    `)}
                </div>
                ` : html`<p class="text-sm text-gray-500 dark:text-gray-500 italic">Chưa có truyện nào thuộc vũ trụ này.</p>`}
            </div>

            <!-- Characters in Universe -->
            <div class="space-y-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2"><i class="fa-solid fa-users mr-2 text-amber-500"></i> Nhân Vật</h2>
                ${characters && characters.length > 0 ? html`
                <div class="space-y-3">
                    ${characters.map(c => {
                      const canEditChar = user && (c.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner);
                      return html`
                    <div class="p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 rounded-xl flex gap-4">
                        ${c.thumbnail_url ? html`<img src="${c.thumbnail_url}" class="w-12 h-12 object-cover rounded-xl shadow border border-gray-200 dark:border-gray-800 flex-shrink-0" />` : ""}
                        <div class="flex-grow text-left">
                            <div class="flex items-center justify-between">
                                <h4 class="font-bold text-amber-400">${c.name}</h4>
                                <div class="flex items-center space-x-2">
                                    ${canEditChar ? html`
                                    <a href="/create/character?id=${c.id}" class="p-1 text-gray-500 hover:text-amber-500 transition-colors" title="Sửa nhân vật">
                                        <i class="fa-solid fa-user-pen"></i>
                                    </a>
                                    <button onclick="deleteCharacter('${c.id}')" class="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Xóa nhân vật">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                    ` : ""}
                                </div>
                            </div>
                            <span class="text-[10px] text-gray-500 dark:text-gray-500 block">Tạo bởi: <a href="/profile/${c.author}" class="hover:text-amber-400 hover:underline">@${c.author}</a></span>
                            <div class="md text-xs mt-2">${renderMarkdown(c.description)}</div>
                        </div>
                    </div>
                    `;})}
                </div>
                ` : html`<p class="text-sm text-gray-500 dark:text-gray-500 italic">Chưa có nhân vật nào trong vũ trụ này.</p>`}
            </div>
        </div>


    <script>
        async function deleteUniverse(universeId) {
            if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn vũ trụ này? Các bộ truyện thuộc vũ trụ sẽ mất liên kết.')) return;
            try {
                const res = await fetch(\`/api/storyverses/\${universeId}\`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    window.location.href = '/storyverses';
                } else {
                    alert('Lỗi: ' + (data.error || 'Không thể xóa.'));
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function deleteCharacter(charId) {
            if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn nhân vật này?')) return;
            try {
                const res = await fetch(\`/api/characters/\${charId}\`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                } else {
                    alert('Lỗi: ' + (data.error || 'Không thể xóa.'));
                }
            } catch (err) {
                console.error(err);
            }
        }
    </script>

        <!-- Comments Area -->
        ${renderCommentsArea("storyverse", sv.id)}
    </div>
  `;
}
