/** @jsxImportSource hono/jsx */
import { html } from "hono/html";
import * as db from "../db.js";
import { markdownToText } from "./markdown.js";

export function renderSearchResults(
  query: string,
  books: db.Storybook[],
  universes: db.Storyverse[],
  characters: db.Character[],
  users: any[]
) {
  const totalResults = books.length + universes.length + characters.length + users.length;

  return html`
    <div class="max-w-5xl mx-auto space-y-8 text-left">
        <div class="space-y-2">
            <h1 class="text-3xl font-black text-gray-900 dark:text-white">
                <i class="fa-solid fa-magnifying-glass mr-2 text-amber-500"></i> Kết Quả Tìm Kiếm
            </h1>
            <p class="text-gray-650 dark:text-gray-400">Tìm thấy <span class="font-bold text-amber-500">${totalResults}</span> kết quả phù hợp với từ khóa "<span class="italic text-gray-900 dark:text-white font-medium">${query}</span>"</p>
        </div>

        <!-- Search Tabs Navigation -->
        <div class="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
            <button onclick="switchSearchTab('books')" id="tabBtn-books" class="search-tab-btn border-b-2 border-amber-500 text-amber-400 font-bold px-6 py-3 text-sm flex-shrink-0 transition-all flex items-center space-x-2">
                <i class="fa-solid fa-book"></i>
                <span>Bộ truyện (${books.length})</span>
            </button>
            <button onclick="switchSearchTab('universes')" id="tabBtn-universes" class="search-tab-btn border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-semibold px-6 py-3 text-sm flex-shrink-0 transition-all flex items-center space-x-2">
                <i class="fa-solid fa-earth-asia"></i>
                <span>Vũ trụ (${universes.length})</span>
            </button>
            <button onclick="switchSearchTab('characters')" id="tabBtn-characters" class="search-tab-btn border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-semibold px-6 py-3 text-sm flex-shrink-0 transition-all flex items-center space-x-2">
                <i class="fa-solid fa-users"></i>
                <span>Nhân vật (${characters.length})</span>
            </button>
            <button onclick="switchSearchTab('users')" id="tabBtn-users" class="search-tab-btn border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-semibold px-6 py-3 text-sm flex-shrink-0 transition-all flex items-center space-x-2">
                <i class="fa-solid fa-user-astronaut"></i>
                <span>Thành viên (${users.length})</span>
            </button>
        </div>

        <!-- Search Content Area -->
        <div class="bg-transparent rounded-2xl min-h-[300px]">
            <!-- Tab: Books -->
            <div id="searchTab-books" class="search-tab-content space-y-6">
                ${books.length === 0 ? html`
                <div class="p-12 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                    <p class="text-sm text-gray-500 dark:text-gray-500">Không tìm thấy bộ truyện nào phù hợp.</p>
                </div>
                ` : html`
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${books.map(b => html`
                    <article class="group relative bg-white dark:bg-[#161925]/45 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 rounded-2xl overflow-hidden flex flex-col hover:translate-y-[-2px] transition-all duration-300 shadow-lg text-left">
                        <div class="h-32 bg-gradient-to-br from-amber-600/10 via-slate-800 to-yellow-600/10 p-5 flex flex-col justify-end relative overflow-hidden border-b border-gray-200 dark:border-gray-800">
                            <div class="absolute inset-0 opacity-15 group-hover:opacity-20 transition-opacity bg-cover bg-center" style="background-image: url('${b.thumbnail_url || "https://maxm-imggenurl.web.val.run/a-minimalistic-fantasy-novel-cover-illustration-art-style"}')"></div>
                            <div class="flex flex-wrap gap-1 mb-1 relative z-10">
                                ${b.categories.split(",").map(cat => html`<span class="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">${cat.trim()}</span>`)}
                            </div>
                        </div>
                        <div class="p-5 flex-grow flex flex-col justify-between space-y-3">
                            <div class="space-y-1.5">
                                <a href="/storybook/${b.id}" class="after:absolute after:inset-0">
                                    <h3 class="font-bold text-gray-950 dark:text-gray-100 group-hover:text-amber-400 transition-colors line-clamp-1 text-lg">${b.title}</h3>
                                </a>
                                <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">${markdownToText(b.description)}</p>
                            </div>
                            <div class="pt-3 border-t border-gray-200 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-450 relative z-10">
                                <span class="font-semibold text-gray-700 dark:text-gray-300">
                                    <i class="fa-solid fa-pen-nib mr-1 text-amber-500/70"></i>
                                    ${b.authors.split(",").map((auth, idx) => html`<a href="/profile/${auth.trim()}" class="hover:underline text-amber-500">@${auth.trim()}</a>${idx < b.authors.split(",").length - 1 ? ", " : ""}`)}
                                </span>
                                <span><i class="fa-solid fa-book-open mr-1"></i> ${b.chapters_count || 0} ch</span>
                            </div>
                        </div>
                    </article>
                    `)}
                </div>
                `}
            </div>

            <!-- Tab: Universes -->
            <div id="searchTab-universes" class="search-tab-content space-y-6 hidden">
                ${universes.length === 0 ? html`
                <div class="p-12 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                    <p class="text-sm text-gray-500 dark:text-gray-500">Không tìm thấy vũ trụ nào phù hợp.</p>
                </div>
                ` : html`
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${universes.map(sv => html`
                    <div class="p-5 bg-white dark:bg-[#161925]/45 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-3 shadow-lg flex flex-col justify-between">
                        <div class="space-y-1.5">
                            <a href="/storyverses/${sv.id}">
                                <h3 class="text-xl font-bold text-amber-400 hover:underline line-clamp-1">${sv.title}</h3>
                            </a>
                            <span class="text-xs text-gray-500 dark:text-gray-500 block">Sáng lập bởi: <a href="/profile/${sv.author}" class="hover:text-amber-400 hover:underline">@${sv.author}</a></span>
                            <div class="text-xs text-gray-750 dark:text-gray-400 line-clamp-3 leading-relaxed">${markdownToText(sv.description)}</div>
                        </div>
                        <div class="pt-3 border-t border-gray-200 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-550 dark:text-gray-500">
                            <span><i class="fa-solid fa-calendar mr-1"></i> ${new Date(sv.created_at).toLocaleDateString("vi-VN")}</span>
                            <div class="flex space-x-3">
                                <span><i class="fa-solid fa-heart mr-0.5"></i> ${sv.likes_count || 0}</span>
                                <span><i class="fa-solid fa-comments mr-0.5"></i> ${sv.comments_count || 0}</span>
                            </div>
                        </div>
                    </div>
                    `)}
                </div>
                `}
            </div>

            <!-- Tab: Characters -->
            <div id="searchTab-characters" class="search-tab-content space-y-6 hidden">
                ${characters.length === 0 ? html`
                <div class="p-12 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                    <p class="text-sm text-gray-500 dark:text-gray-500">Không tìm thấy nhân vật nào phù hợp.</p>
                </div>
                ` : html`
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${characters.map(c => html`
                    <div class="p-5 bg-white dark:bg-[#161925]/45 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-3 shadow-lg flex flex-col justify-between">
                        <div class="flex items-start gap-3">
                            ${c.thumbnail_url ? html`
                            <img src="${c.thumbnail_url}" class="w-12 h-12 object-cover rounded-xl shadow border border-gray-200 dark:border-gray-800 flex-shrink-0" />
                            ` : html`
                            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/10 to-yellow-400/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-lg flex-shrink-0">${c.name.charAt(0).toUpperCase()}</div>
                            `}
                            <div class="min-w-0">
                                <h4 class="font-bold text-gray-900 dark:text-gray-200 text-base truncate">${c.name}</h4>
                                <span class="text-[10px] text-gray-500 dark:text-gray-500 block truncate">Bởi: <a href="/profile/${c.author}" class="hover:text-amber-400 hover:underline">@${c.author}</a></span>
                            </div>
                        </div>
                        <p class="text-xs text-gray-650 dark:text-gray-400 line-clamp-3 leading-relaxed flex-grow">${markdownToText(c.description)}</p>
                        <div class="pt-3 border-t border-gray-200 dark:border-gray-800/80 text-[11px]">
                            <a href="/storyverses/${c.storyverse_id}" class="text-amber-500 hover:underline font-semibold flex items-center space-x-1 justify-center">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i>
                                <span>Xem vũ trụ</span>
                            </a>
                        </div>
                    </div>
                    `)}
                </div>
                `}
            </div>

            <!-- Tab: Users -->
            <div id="searchTab-users" class="search-tab-content space-y-6 hidden">
                ${users.length === 0 ? html`
                <div class="p-12 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                    <p class="text-sm text-gray-500 dark:text-gray-500">Không tìm thấy thành viên nào phù hợp.</p>
                </div>
                ` : html`
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    ${users.map(u => html`
                    <a href="/profile/${u.username}" class="p-4 bg-white dark:bg-[#161925]/45 border border-gray-200 dark:border-gray-800 hover:border-amber-500/30 rounded-2xl flex items-center gap-4 transition-all shadow-md">
                        ${u.avatar ? html`
                        <img src="${u.avatar}" class="w-12 h-12 object-cover rounded-full shadow" />
                        ` : html`
                        <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black font-black text-lg uppercase shadow">
                            ${u.display_name.charAt(0)}
                        </div>
                        `}
                        <div class="min-w-0 text-left">
                            <h4 class="font-bold text-gray-900 dark:text-gray-150 truncate leading-tight">${u.display_name}</h4>
                            <p class="text-xs text-amber-500 mt-0.5">@${u.username}</p>
                            ${u.is_creator ? html`<span class="mt-1 inline-block px-1.5 py-0.2 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-bold rounded">Creator</span>` : ""}
                        </div>
                    </a>
                    `)}
                </div>
                `}
            </div>
        </div>
    </div>

    <!-- Client Tabs Logic -->
    <script>
        function switchSearchTab(tabName) {
            // Hide all contents
            document.querySelectorAll('.search-tab-content').forEach(c => c.classList.add('hidden'));
            // Remove active classes
            document.querySelectorAll('.search-tab-btn').forEach(btn => {
                btn.className = 'search-tab-btn border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-semibold px-6 py-3 text-sm flex-shrink-0 transition-all flex items-center space-x-2';
            });

            // Activate chosen
            document.getElementById('searchTab-' + tabName).classList.remove('hidden');
            document.getElementById('tabBtn-' + tabName).className = 'search-tab-btn border-b-2 border-amber-500 text-amber-400 font-bold px-6 py-3 text-sm flex-shrink-0 transition-all flex items-center space-x-2';
        }
    </script>
  `;
}
