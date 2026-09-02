"use client";

import type { Character, Storybook, Storyverse } from "@/lib/db";
import { markdownToText } from "@/lib/markdown";
import { fmtDate } from "@/lib/format";

interface SearchUser {
  username: string;
  display_name: string;
  avatar?: string;
  is_creator?: boolean;
}

function switchSearchTab(tabName: string) {
  // Hide all contents
  document.querySelectorAll(".search-tab-content").forEach((c) => c.classList.add("hidden"));
  // Remove active classes
  document.querySelectorAll(".search-tab-btn").forEach((btn) => {
    (btn as HTMLElement).className =
      "search-tab-btn border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-semibold px-6 py-3 text-sm flex-shrink-0 transition-all flex items-center space-x-2";
  });

  // Activate chosen
  document.getElementById("searchTab-" + tabName)?.classList.remove("hidden");
  const tabBtn = document.getElementById("tabBtn-" + tabName);
  if (tabBtn) {
    tabBtn.className =
      "search-tab-btn border-b-2 border-amber-500 text-amber-400 font-bold px-6 py-3 text-sm flex-shrink-0 transition-all flex items-center space-x-2";
  }
}

// Search results view with client-side tabs
export default function SearchResultsView({
  query,
  books,
  universes,
  characters,
  users,
}: {
  query: string;
  books: Storybook[];
  universes: Storyverse[];
  characters: Character[];
  users: SearchUser[];
}) {
  const totalResults = books.length + universes.length + characters.length + users.length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-left">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
          <i className="fa-solid fa-magnifying-glass mr-2 text-amber-500"></i> Kết Quả Tìm Kiếm
        </h1>
        <p className="text-gray-650 dark:text-gray-400">
          Tìm thấy <span className="font-bold text-amber-500">{totalResults}</span> kết quả phù hợp với từ
          khóa "<span className="italic text-gray-900 dark:text-white font-medium">{query}</span>"
        </p>
      </div>

      {/* Search Tabs Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
        <button
          onClick={() => switchSearchTab("books")}
          id="tabBtn-books"
          className="search-tab-btn border-b-2 border-amber-500 text-amber-400 font-bold px-6 py-3 text-sm flex-shrink-0 transition-all flex items-center space-x-2"
        >
          <i className="fa-solid fa-book"></i>
          <span>Bộ truyện ({books.length})</span>
        </button>
        <button
          onClick={() => switchSearchTab("universes")}
          id="tabBtn-universes"
          className="search-tab-btn border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-semibold px-6 py-3 text-sm flex-shrink-0 transition-all flex items-center space-x-2"
        >
          <i className="fa-solid fa-earth-asia"></i>
          <span>Vũ trụ ({universes.length})</span>
        </button>
        <button
          onClick={() => switchSearchTab("characters")}
          id="tabBtn-characters"
          className="search-tab-btn border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-semibold px-6 py-3 text-sm flex-shrink-0 transition-all flex items-center space-x-2"
        >
          <i className="fa-solid fa-users"></i>
          <span>Nhân vật ({characters.length})</span>
        </button>
        <button
          onClick={() => switchSearchTab("users")}
          id="tabBtn-users"
          className="search-tab-btn border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-semibold px-6 py-3 text-sm flex-shrink-0 transition-all flex items-center space-x-2"
        >
          <i className="fa-solid fa-user-astronaut"></i>
          <span>Thành viên ({users.length})</span>
        </button>
      </div>

      {/* Search Content Area */}
      <div className="bg-transparent rounded-2xl min-h-[300px]">
        {/* Tab: Books */}
        <div id="searchTab-books" className="search-tab-content space-y-6">
          {books.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              <p className="text-sm text-gray-500 dark:text-gray-500">Không tìm thấy bộ truyện nào phù hợp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((b) => (
                <article
                  key={b.id}
                  className="group relative bg-white dark:bg-[#161925]/45 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 rounded-2xl overflow-hidden flex flex-col hover:translate-y-[-2px] transition-all duration-300 shadow-lg text-left"
                >
                  <div className="h-32 bg-gradient-to-br from-amber-600/10 via-slate-800 to-yellow-600/10 p-5 flex flex-col justify-end relative overflow-hidden border-b border-gray-200 dark:border-gray-800">
                    <div
                      className="absolute inset-0 opacity-15 group-hover:opacity-20 transition-opacity bg-cover bg-center"
                      style={{
                        backgroundImage: `url('${b.thumbnail_url || "https://maxm-imggenurl.web.val.run/a-minimalistic-fantasy-novel-cover-illustration-art-style"}')`,
                      }}
                    ></div>
                    <div className="flex flex-wrap gap-1 mb-1 relative z-10">
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
                  <div className="p-5 flex-grow flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <a href={`/storybook/${b.id}`} className="after:absolute after:inset-0">
                        <h3 className="font-bold text-gray-950 dark:text-gray-100 group-hover:text-amber-400 transition-colors line-clamp-1 text-lg">
                          {b.title}
                        </h3>
                      </a>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {markdownToText(b.description)}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-450 relative z-10">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        <i className="fa-solid fa-pen-nib mr-1 text-amber-500/70"></i>
                        {b.authors.split(",").map((auth, idx) => (
                          <span key={idx}>
                            <a href={`/profile/${auth.trim()}`} className="hover:underline text-amber-500">
                              @{auth.trim()}
                            </a>
                            {idx < b.authors.split(",").length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </span>
                      <span>
                        <i className="fa-solid fa-book-open mr-1"></i> {b.chapters_count || 0} ch
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Tab: Universes */}
        <div id="searchTab-universes" className="search-tab-content space-y-6 hidden">
          {universes.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              <p className="text-sm text-gray-500 dark:text-gray-500">Không tìm thấy vũ trụ nào phù hợp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {universes.map((sv) => (
                <div
                  key={sv.id}
                  className="p-5 bg-white dark:bg-[#161925]/45 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-3 shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <a href={`/storyverses/${sv.id}`}>
                      <h3 className="text-xl font-bold text-amber-400 hover:underline line-clamp-1">{sv.title}</h3>
                    </a>
                    <span className="text-xs text-gray-500 dark:text-gray-500 block">
                      Sáng lập bởi:{" "}
                      <a href={`/profile/${sv.author}`} className="hover:text-amber-400 hover:underline">
                        @{sv.author}
                      </a>
                    </span>
                    <div className="text-xs text-gray-750 dark:text-gray-400 line-clamp-3 leading-relaxed">
                      {markdownToText(sv.description)}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-550 dark:text-gray-500">
                    <span suppressHydrationWarning>
                      <i className="fa-solid fa-calendar mr-1"></i> {fmtDate(sv.created_at)}
                    </span>
                    <div className="flex space-x-3">
                      <span>
                        <i className="fa-solid fa-heart mr-0.5"></i> {sv.likes_count || 0}
                      </span>
                      <span>
                        <i className="fa-solid fa-comments mr-0.5"></i> {sv.comments_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tab: Characters */}
        <div id="searchTab-characters" className="search-tab-content space-y-6 hidden">
          {characters.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              <p className="text-sm text-gray-500 dark:text-gray-500">Không tìm thấy nhân vật nào phù hợp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((c) => (
                <div
                  key={c.id}
                  className="p-5 bg-white dark:bg-[#161925]/45 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-3 shadow-lg flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    {c.thumbnail_url ? (
                      <img
                        src={c.thumbnail_url}
                        className="w-12 h-12 object-cover rounded-xl shadow border border-gray-200 dark:border-gray-800 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/10 to-yellow-400/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-lg flex-shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-gray-200 text-base truncate">{c.name}</h4>
                      <span className="text-[10px] text-gray-500 dark:text-gray-500 block truncate">
                        Bởi:{" "}
                        <a href={`/profile/${c.author}`} className="hover:text-amber-400 hover:underline">
                          @{c.author}
                        </a>
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-650 dark:text-gray-400 line-clamp-3 leading-relaxed flex-grow">
                    {markdownToText(c.description)}
                  </p>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-800/80 text-[11px]">
                    <a
                      href={`/storyverses/${c.storyverse_id}`}
                      className="text-amber-500 hover:underline font-semibold flex items-center space-x-1 justify-center"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      <span>Xem vũ trụ</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tab: Users */}
        <div id="searchTab-users" className="search-tab-content space-y-6 hidden">
          {users.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              <p className="text-sm text-gray-500 dark:text-gray-500">Không tìm thấy thành viên nào phù hợp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {users.map((u) => (
                <a
                  key={u.username}
                  href={`/profile/${u.username}`}
                  className="p-4 bg-white dark:bg-[#161925]/45 border border-gray-200 dark:border-gray-800 hover:border-amber-500/30 rounded-2xl flex items-center gap-4 transition-all shadow-md"
                >
                  {u.avatar ? (
                    <img src={u.avatar} className="w-12 h-12 object-cover rounded-full shadow" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black font-black text-lg uppercase shadow">
                      {u.display_name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 text-left">
                    <h4 className="font-bold text-gray-900 dark:text-gray-150 truncate leading-tight">
                      {u.display_name}
                    </h4>
                    <p className="text-xs text-amber-500 mt-0.5">@{u.username}</p>
                    {u.is_creator ? (
                      <span className="mt-1 inline-block px-1.5 py-0.2 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-bold rounded">
                        Creator
                      </span>
                    ) : null}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
