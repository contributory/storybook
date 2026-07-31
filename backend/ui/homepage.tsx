/** @jsxImportSource npm:hono@4.5.11/jsx */
import { html } from "npm:hono/html";
import * as db from "../db.ts";

// Homepage View
export function renderHomepage(storybooks: db.Storybook[], progress: db.ReadingProgress[], user: db.User | null) {
  // Compute Categories from books
  const allCategories = new Set<string>();
  storybooks.forEach(b => {
    b.categories.split(",").forEach(c => {
      const cat = c.trim();
      if (cat) allCategories.add(cat);
    });
  });

  return html`
    <!-- Hero Banner -->
    <section class="relative bg-gradient-to-r from-amber-600/10 via-yellow-500/5 to-transparent border border-amber-500/10 rounded-3xl p-8 sm:p-12 mb-12 flex flex-col md:flex-row items-center justify-between overflow-hidden">
        <div class="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none"></div>

        <div class="space-y-6 max-w-2xl text-left">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <i class="fa-solid fa-sparkles mr-1.5"></i> Kỷ Nguyên Kể Chuyện Cộng Tác
            </span>
            <h1 class="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight">
                Nơi Thế Giới Truyện Được <span class="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">Dệt Nên</span> Cùng Nhau
            </h1>
            <p class="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                Đọc, sáng tạo và mở rộng các vũ trụ cốt truyện đa chiều. Kết hợp giữa trí tuệ cộng đồng và AI Assistant thông minh để tạo nên những tác phẩm bất hủ.
            </p>
            <div class="flex flex-wrap gap-4 pt-2">
                <a href="#discover" class="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl shadow-lg shadow-yellow-500/15 hover:brightness-110 transition-all flex items-center space-x-2">
                    <span>Khám phá ngay</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </a>
                <a href="/storyverses" class="px-6 py-3 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700/80 transition-all flex items-center space-x-2">
                    <i class="fa-solid fa-earth-asia"></i>
                    <span>Xem các vũ trụ</span>
                </a>
            </div>
        </div>

        <!-- Decorative Book Stack / Illustration -->
        <div class="hidden lg:block relative w-80 h-64">
            <img src="https://maxm-imggenurl.web.val.run/a-beautiful-mystical-golden-book-opening-with-stardust-and-constellations-fantasy-dark-background" alt="Mystical Book" class="w-full h-full object-cover rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800/80 hover:rotate-2 transition-transform duration-500">
        </div>
    </section>

    <!-- Reading Progress Section (Đọc tiếp) -->
    ${progress && progress.length > 0 ? html`
    <section class="mb-12">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl sm:text-2xl font-bold flex items-center text-gray-900 dark:text-white">
                <i class="fa-solid fa-clock-rotate-left mr-2.5 text-amber-500"></i> Đọc tiếp
            </h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            ${progress.map(p => html`
            <a href="/storybook/${p.storybook_id}/chapter/${p.chapter_number}" class="group p-5 bg-white dark:bg-[#161925] border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-amber-500/40 hover:bg-gray-100 dark:bg-[#1a1e2e]/90 transition-all flex justify-between items-center shadow-lg">
                <div class="space-y-1.5 flex-grow pr-4">
                    <h3 class="font-bold text-gray-800 dark:text-gray-200 group-hover:text-amber-400 transition-colors line-clamp-1">${p.storybook_title}</h3>
                    <p class="text-xs text-gray-600 dark:text-gray-400">Đang đọc Chương ${p.chapter_number}</p>
                    <span class="text-[10px] text-gray-500 dark:text-gray-500 block">Cập nhật: ${new Date(p.updated_at).toLocaleDateString("vi-VN")}</span>
                </div>
                <div class="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-colors">
                    <i class="fa-solid fa-play ml-0.5 text-sm"></i>
                </div>
            </a>
            `)}
        </div>
    </section>
    ` : ""}

    <!-- Categories Filters -->
    <section id="discover" class="mb-10">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div class="space-y-1">
                <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">Khám Phá Tác Phẩm</h2>
                <p class="text-sm text-gray-600 dark:text-gray-400">Lọc qua các bộ truyện độc đáo được đóng góp bởi cộng đồng.</p>
            </div>

            <!-- Category Chips -->
            <div class="flex flex-wrap gap-2.5 max-w-xl">
                <button onclick="filterCategory('All')" class="category-chip px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-black border border-amber-500 transition-all">Tất cả</button>
                ${Array.from(allCategories).map(cat => html`
                <button onclick="filterCategory('${cat}')" class="category-chip px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:text-white transition-all">${cat}</button>
                `)}
            </div>
        </div>

        <!-- Storybooks Grid -->
        <div id="booksGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${storybooks.map(b => html`
            <article data-categories="${b.categories}" class="book-card group relative bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700/80 rounded-2xl overflow-hidden flex flex-col hover:translate-y-[-4px] transition-all duration-300 shadow-xl">
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
                    <div class="space-y-2 text-left">
                        <a href="/storybook/${b.id}" class="after:absolute after:inset-0">
                            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-amber-400 transition-colors line-clamp-1">${b.title}</h3>
                        </a>
                        <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed relative z-10">${b.description}</p>
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
    </section>

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
