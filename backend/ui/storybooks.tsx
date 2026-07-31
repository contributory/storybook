/** @jsxImportSource npm:hono@4.5.11/jsx */
import { html } from "npm:hono/html";
import * as db from "../db.ts";

export function renderStorybooksPage(storybooks: db.Storybook[]) {
  // Compute Categories from books
  const allCategories = new Set<string>();
  storybooks.forEach(b => {
    b.categories.split(",").forEach(c => {
      const cat = c.trim();
      if (cat) allCategories.add(cat);
    });
  });

  return html`
    <div class="space-y-4 text-left max-w-6xl mx-auto mb-10">
        <h1 class="text-3xl font-black text-gray-900 dark:text-white">Thư Viện Bộ Truyện</h1>
        <p class="text-gray-650 dark:text-gray-400">Khám phá toàn bộ thế giới tác phẩm phong phú được sáng tác bởi cộng đồng và các tác giả AI.</p>
    </div>

    <!-- Category Filters -->
    <div class="flex flex-wrap gap-2.5 max-w-6xl mx-auto mb-10 text-left">
        <button onclick="filterCategory('All')" class="category-chip px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-black border border-amber-500 transition-all">Tất cả</button>
        ${Array.from(allCategories).map(cat => html`
        <button onclick="filterCategory('${cat}')" class="category-chip px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:text-white transition-all">${cat}</button>
        `)}
    </div>

    <!-- Storybooks Grid -->
    <div id="booksGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        ${storybooks.map(b => html`
        <article data-categories="${b.categories}" class="book-card group relative bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700/80 rounded-2xl overflow-hidden flex flex-col hover:translate-y-[-4px] transition-all duration-300 shadow-xl text-left">
            <!-- Cover Image Placeholder (gradient-mesh style) -->
            <div class="h-40 bg-gradient-to-br from-amber-600/20 via-slate-800 to-yellow-600/10 p-6 flex flex-col justify-end relative overflow-hidden border-b border-gray-200 dark:border-gray-800">
                <div class="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity bg-cover bg-center" style="background-image: url('${b.thumbnail_url || "https://maxm-imggenurl.web.val.run/a-minimalistic-fantasy-novel-cover-illustration-art-style"}')"></div>
                <div class="absolute top-4 right-4 flex space-x-1.5 relative z-10">
                    ${b.allow_other_author_edit ? html`
                    <span class="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold" title="Những người dùng khác được phép đồng sáng tác"><i class="fa-solid fa-users mr-1"></i> Cộng tác</span>
                    ` : html`
                    <span class="px-2 py-0.5 rounded bg-gray-500/20 text-gray-600 dark:text-gray-400 text-[10px] font-bold"><i class="fa-solid fa-lock mr-1"></i> Đóng</span>
                    `}
                </div>

                <div class="flex flex-wrap gap-1.5 mb-2 relative z-10">
                    ${b.categories.split(",").map(cat => html`
                    <span class="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">${cat.trim()}</span>
                    `)}
                </div>
            </div>

            <!-- Book Body -->
            <div class="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div class="space-y-2">
                    <a href="/storybook/${b.id}" class="after:absolute after:inset-0">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-amber-400 transition-colors line-clamp-1">${b.title}</h3>
                    </a>
                    <p class="text-sm text-gray-650 dark:text-gray-400 line-clamp-3 leading-relaxed relative z-10">${b.description}</p>
                </div>

                <div class="pt-4 border-t border-gray-200 dark:border-gray-800/80 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 relative z-10">
                    <span class="font-medium text-gray-700 dark:text-gray-300"><i class="fa-solid fa-pen-nib mr-1.5 text-amber-500/80"></i>${b.authors.split(",")[0]}</span>
                    <div class="flex items-center space-x-3">
                        <span><i class="fa-solid fa-book-open mr-1"></i> ${b.chapters_count || 0} ch</span>
                        <button onclick="toggleLike('storybook', '${b.id}', this)" class="hover:text-red-400 transition-colors flex items-center space-x-1">
                            <i class="fa-regular fa-heart"></i>
                            <span>${b.likes_count || 0}</span>
                        </button>
                    </div>
                </div>
            </div>
        </article>
        `)}
    </div>

    <script>
        function filterCategory(cat) {
            // Update chips active state
            const chips = document.querySelectorAll('.category-chip');
            chips.forEach(chip => {
                if (chip.innerText === cat || (cat === 'All' && chip.innerText === 'Tất cả')) {
                    chip.className = 'category-chip px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-black border border-amber-500 transition-all';
                } else {
                    chip.className = 'category-chip px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:text-white transition-all';
                }
            });

            // Filter cards
            const cards = document.querySelectorAll('.book-card');
            cards.forEach(card => {
                if (cat === 'All') {
                    card.style.display = 'flex';
                } else {
                    const cats = card.getAttribute('data-categories') || '';
                    if (cats.includes(cat)) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        }
    </script>
  `;
}
