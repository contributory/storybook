/** @jsxImportSource npm:hono@4.5.11/jsx */
import { html } from "npm:hono/html";
import * as db from "../db.ts";

import { renderCommentsArea } from "./comments.tsx";

// Storyverses directory list view
export function renderStoryverses(storyverses: db.Storyverse[]) {
  return html`
    <div class="space-y-4 text-left max-w-4xl mx-auto mb-10">
        <h1 class="text-3xl font-black text-gray-900 dark:text-white">Vũ Trụ Cốt Truyện</h1>
        <p class="text-gray-600 dark:text-gray-400">Các vũ trụ cốt truyện (Storyverses) là nơi kết nối nhiều bộ truyện và chia sẻ chung một dàn nhân vật phong phú.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        ${storyverses.map(sv => html`
        <div class="p-6 bg-white dark:bg-[#161925]/60 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-4 text-left shadow-lg">
            <div class="space-y-1">
                <a href="/storyverses/${sv.id}">
                    <h3 class="text-2xl font-bold text-amber-400 hover:underline">${sv.title}</h3>
                </a>
                <span class="text-xs text-gray-500 dark:text-gray-500 block">Sáng lập bởi: @${sv.author}</span>
            </div>

            <p class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">${sv.description}</p>

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
  `;
}

// Individual Storyverse view with Characters & Books
export function renderStoryverseDetail(sv: db.Storyverse, characters: db.SharedCharacter[]) {
  return html`
    <div class="max-w-4xl mx-auto space-y-8 text-left">
        <!-- Header -->
        <div class="p-8 bg-gradient-to-tr from-white dark:from-[#161925] via-[#10131f] to-amber-900/10 border border-gray-200 dark:border-gray-800 rounded-3xl relative">
            <span class="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-md text-xs font-semibold"><i class="fa-solid fa-earth-asia mr-1"></i> Vũ trụ cốt truyện</span>
            <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mt-4 mb-2">${sv.title}</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400">Sáng tạo bởi: <span class="text-gray-800 dark:text-gray-200">@${sv.author}</span> &bull; ${new Date(sv.created_at).toLocaleDateString("vi-VN")}</p>
            <p class="text-gray-700 dark:text-gray-300 text-base mt-4 leading-relaxed">${sv.description}</p>

            <button onclick="toggleLike('storyverse', '${sv.id}', this)" class="absolute top-8 right-8 px-4 py-2 bg-gray-200 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700/80 border border-gray-300 dark:border-gray-700/60 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all">
                <i class="fa-regular fa-heart"></i>
                <span>${sv.likes_count || 0} thích</span>
            </button>
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

            <!-- Shared Characters in Universe -->
            <div class="space-y-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2"><i class="fa-solid fa-users mr-2 text-amber-500"></i> Nhân vật dùng chung</h2>
                ${characters && characters.length > 0 ? html`
                <div class="space-y-3">
                    ${characters.map(c => html`
                    <div class="p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 rounded-xl">
                        <h4 class="font-bold text-amber-400">${c.name}</h4>
                        <span class="text-[10px] text-gray-500 dark:text-gray-500 block">Tạo bởi: @${c.author}</span>
                        <p class="text-xs text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">${c.other_info}</p>
                    </div>
                    `)}
                </div>
                ` : html`<p class="text-sm text-gray-500 dark:text-gray-500 italic">Chưa có nhân vật nào trong vũ trụ này.</p>`}
            </div>
        </div>

        <!-- Comments Area -->
        ${renderCommentsArea("storyverse", sv.id)}
    </div>
  `;
}
