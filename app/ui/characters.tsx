/** @jsxImportSource hono/jsx */
import { html } from "hono/html";
import * as db from "../db.ts";
import { markdownToText } from "./markdown.ts";
import { renderPagination } from "./pagination.tsx";

export function renderCharactersPage(
  charsResult: db.PageResult<db.Character>,
  universes: db.Storyverse[],
  user: db.User | null
) {
  const characters = charsResult.items;
  const universeTitles = new Map<string, string>();
  universes.forEach(u => universeTitles.set(u.id, u.title));
  const isCreator = user ? (user.is_creator || user.is_admin || user.is_owner) : false;

  return html`
    <div class="space-y-4 text-left max-w-6xl mx-auto mb-10">
        <div class="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
                <h1 class="text-3xl font-black text-gray-900 dark:text-white"><i class="fa-solid fa-users mr-2 text-amber-500"></i> Nhân Vật</h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Bộ sưu tập các nhân vật dùng chung được xây dựng trong các vũ trụ cốt truyện.</p>
            </div>
            ${isCreator ? html`
            <a href="/create/character" class="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/10 hover:brightness-110 transition-all flex items-center space-x-1.5 flex-shrink-0">
                <i class="fa-solid fa-user-plus"></i>
                <span>Tạo nhân vật mới</span>
            </a>
            ` : ""}
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        ${characters.length === 0 ? html`
        <div class="col-span-full p-10 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <i class="fa-solid fa-user-slash text-gray-500 text-3xl mb-3"></i>
            <p class="text-sm text-gray-500 dark:text-gray-500">Chưa có nhân vật nào được tạo.</p>
        </div>
        ` : characters.map(c => {
          const svTitle = universeTitles.get(c.storyverse_id) || c.storyverse_id;
          return html`
          <div class="p-6 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700/80 rounded-2xl space-y-4 text-left shadow-lg flex flex-col">
              <div class="flex items-start gap-4">
                  ${c.thumbnail_url ? html`
                  <img src="${c.thumbnail_url}" class="w-16 h-16 object-cover rounded-2xl shadow border border-gray-200 dark:border-gray-800 flex-shrink-0" />
                  ` : html`
                  <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/15 to-yellow-400/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-2xl flex-shrink-0">${c.name.charAt(0).toUpperCase()}</div>
                  `}
                  <div class="min-w-0">
                      <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">${c.name}</h3>
                      <span class="text-[10px] text-gray-500 dark:text-gray-500 block mt-0.5 truncate"><i class="fa-solid fa-earth-asia mr-1 text-amber-500/80"></i>${svTitle}</span>
                      <span class="text-[10px] text-gray-500 dark:text-gray-500 block mt-0.5">Bởi: <a href="/profile/${c.author}" class="hover:text-amber-400 hover:underline">@${c.author}</a></span>
                  </div>
              </div>
              <div class="md text-xs leading-relaxed flex-grow line-clamp-4">${markdownToText(c.description)}</div>
              <div class="pt-4 border-t border-gray-200 dark:border-gray-800/80 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <a href="/storyverses/${c.storyverse_id}" class="text-amber-500 hover:underline font-semibold flex items-center space-x-1.5">
                      <i class="fa-solid fa-arrow-up-right-from-square"></i>
                      <span>Xem trong vũ trụ</span>
                  </a>
                  <div class="flex items-center space-x-3">
                      <span><i class="fa-regular fa-heart mr-1"></i> ${c.likes_count || 0}</span>
                      <span><i class="fa-regular fa-comment mr-1"></i> ${c.comments_count || 0}</span>
                  </div>
              </div>
          </div>
          `;
        })}
    </div>

    ${renderPagination(charsResult, "/characters")}
  `;
}
