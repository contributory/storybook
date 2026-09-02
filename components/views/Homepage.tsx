"use client";

import type { PageResult, ReadingProgress, Storybook } from "@/lib/db";
import { markdownToText } from "@/lib/markdown";
import { fmtDate } from "@/lib/format";
import Pagination from "@/components/Pagination";

// Category filter logic (identical DOM behavior to the previous inline script)
function filterCategory(cat: string) {
  // Update chips active state
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

  // Filter cards
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

// Homepage View
export default function Homepage({
  booksResult,
  progress,
}: {
  booksResult: PageResult<Storybook>;
  progress: ReadingProgress[];
}) {
  const storybooks = booksResult.items;
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
      {/* Reading Progress Section (Đọc tiếp) */}
      {progress && progress.length > 0 ? (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center text-gray-900 dark:text-white">
              <i className="fa-solid fa-clock-rotate-left mr-2.5 text-amber-500"></i> Đọc tiếp
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {progress.map((p) => (
              <a
                key={p.storybook_id}
                href={`/storybook/${p.storybook_id}/chapter/${p.chapter_number}`}
                className="group p-5 bg-white dark:bg-[#161925] border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-amber-500/40 hover:bg-gray-100 dark:bg-[#1a1e2e]/90 transition-all flex justify-between items-center shadow-lg"
              >
                <div className="space-y-1.5 flex-grow pr-4">
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-amber-400 transition-colors line-clamp-1">
                    {p.storybook_title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Đang đọc Chương {p.chapter_number}
                  </p>
                  <span className="text-[10px] text-gray-500 dark:text-gray-500 block" suppressHydrationWarning>
                    Cập nhật: {fmtDate(p.updated_at)}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-colors">
                  <i className="fa-solid fa-play ml-0.5 text-sm"></i>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {/* Categories Filters */}
      <section id="discover" className="mb-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              Khám Phá Tác Phẩm
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Lọc qua các bộ truyện độc đáo được đóng góp bởi cộng đồng.
            </p>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2.5 max-w-xl">
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
        </div>

        {/* Storybooks Grid */}
        <div id="booksGrid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {storybooks.map((b) => (
            <article
              key={b.id}
              data-categories={b.categories}
              className="book-card group relative bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700/80 rounded-2xl overflow-hidden flex flex-col hover:translate-y-[-4px] transition-all duration-300 shadow-xl"
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
                <div className="space-y-2 text-left">
                  <a href={`/storybook/${b.id}`} className="after:absolute after:inset-0">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                      {b.title}
                    </h3>
                  </a>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed relative z-10">
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
      </section>

      <Pagination pageInfo={booksResult} basePath="/" />
    </>
  );
}
