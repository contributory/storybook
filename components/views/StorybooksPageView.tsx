"use client";

import type { PageResult, Storybook, User } from "@/lib/db";
import { markdownToText } from "@/lib/markdown";
import Pagination from "@/components/Pagination";

// Category filter logic (identical DOM behavior to the previous inline script)
function filterCategory(cat: string) {
  const chips = document.querySelectorAll(".category-chip");
  chips.forEach((chip) => {
    if (chip.textContent === cat || (cat === "All" && chip.textContent === "Tất cả")) {
      chip.className =
        "category-chip px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-black border border-amber-500 transition-all";
    } else {
      chip.className =
        "category-chip px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:text-white transition-all";
    }
  });

  const cards = document.querySelectorAll(".book-card");
  cards.forEach((card) => {
    const el = card as HTMLElement;
    if (cat === "All") {
      el.style.display = "flex";
    } else {
      const cats = el.getAttribute("data-categories") || "";
      el.style.display = cats.includes(cat) ? "flex" : "none";
    }
  });
}

// Storybooks library page view
export default function StorybooksPageView({
  booksResult,
  user,
}: {
  booksResult: PageResult<Storybook>;
  user: User | null;
}) {
  const storybooks = booksResult.items;
  const isCreator = user ? user.is_creator || user.is_admin || user.is_owner : false;
  // Compute Categories from books
  const allCategories = new Set<string>();
  storybooks.forEach((b) => {
    b.categories.split(",").forEach((c) => {
      const cat = c.trim();
      if (cat) allCategories.add(cat);
    });
  });

  const like = (e: React.MouseEvent<HTMLButtonElement>, id: string) =>
    (window as any).toggleLike("storybook", id, e.currentTarget);

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-10 max-w-6xl mx-auto text-left">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Thư Viện Bộ Truyện</h1>
          <p className="text-gray-650 dark:text-gray-400">
            Khám phá toàn bộ thế giới tác phẩm phong phú được sáng tác bởi cộng đồng và các tác giả AI.
          </p>
        </div>
        {isCreator ? (
          <a
            href="/create/storybook"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/10 hover:brightness-110 transition-all flex items-center space-x-1.5 flex-shrink-0"
          >
            <i className="fa-solid fa-book"></i>
            <span>Tạo bộ truyện mới</span>
          </a>
        ) : null}
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2.5 max-w-6xl mx-auto mb-10 text-left">
        <button
          onClick={() => filterCategory("All")}
          className="category-chip px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-black border border-amber-500 transition-all"
        >
          Tất cả
        </button>
        {Array.from(allCategories).map((cat) => (
          <button
            key={cat}
            onClick={() => filterCategory(cat)}
            className="category-chip px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:text-white transition-all"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Storybooks Grid */}
      <div id="booksGrid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {storybooks.map((b) => (
          <article
            key={b.id}
            data-categories={b.categories}
            className="book-card group relative bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700/80 rounded-2xl overflow-hidden flex flex-col hover:translate-y-[-4px] transition-all duration-300 shadow-xl text-left"
          >
            {/* Cover Image Placeholder (gradient-mesh style) */}
            <div className="h-40 bg-gradient-to-br from-amber-600/20 via-slate-800 to-yellow-600/10 p-6 flex flex-col justify-end relative overflow-hidden border-b border-gray-200 dark:border-gray-800">
              <div
                className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity bg-cover bg-center"
                style={{
                  backgroundImage: `url('${b.thumbnail_url || "https://maxm-imggenurl.web.val.run/a-minimalistic-fantasy-novel-cover-illustration-art-style"}')`,
                }}
              ></div>
              <div className="absolute top-4 right-4 flex space-x-1.5 z-10">
                {b.allow_other_author_edit ? (
                  <span
                    className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold"
                    title="Những người dùng khác được phép đồng sáng tác"
                  >
                    <i className="fa-solid fa-users mr-1"></i> Cộng tác
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-gray-500/20 text-gray-600 dark:text-gray-400 text-[10px] font-bold">
                    <i className="fa-solid fa-lock mr-1"></i> Đóng
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2 relative z-10">
                {b.categories.split(",").map((cat, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold"
                  >
                    {cat.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Book Body */}
            <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <a href={`/storybook/${b.id}`} className="after:absolute after:inset-0">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                    {b.title}
                  </h3>
                </a>
                <p className="text-sm text-gray-650 dark:text-gray-400 line-clamp-3 leading-relaxed relative z-10">
                  {markdownToText(b.description)}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800/80 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 relative z-10">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  <i className="fa-solid fa-pen-nib mr-1.5 text-amber-500/80"></i>
                  {b.authors.split(",").map((auth, idx) => (
                    <span key={idx}>
                      <a href={`/profile/${auth.trim()}`} className="hover:underline text-amber-500 font-semibold">
                        @{auth.trim()}
                      </a>
                      {idx < b.authors.split(",").length - 1 ? ", " : ""}
                    </span>
                  ))}
                </span>
                <div className="flex items-center space-x-3">
                  <span>
                    <i className="fa-solid fa-book-open mr-1"></i> {b.chapters_count || 0} ch
                  </span>
                  <button
                    onClick={(e) => like(e, b.id)}
                    className="hover:text-red-400 transition-colors flex items-center space-x-1"
                  >
                    <i className="fa-regular fa-heart"></i>
                    <span>{b.likes_count || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Pagination pageInfo={booksResult} basePath="/storybooks" />
    </>
  );
}
