"use client";

import type { Character, PageResult, Storyverse, User } from "@/lib/db";
import { markdownToText } from "@/lib/markdown";
import Pagination from "@/components/Pagination";

// Characters directory page view
export default function CharactersPageView({
  charsResult,
  universes,
  user,
}: {
  charsResult: PageResult<Character>;
  universes: Storyverse[];
  user: User | null;
}) {
  const characters = charsResult.items;
  const universeTitles = new Map<string, string>();
  universes.forEach((u) => universeTitles.set(u.id, u.title));
  const isCreator = user ? user.is_creator || user.is_admin || user.is_owner : false;

  return (
    <>
      <div className="space-y-4 text-left max-w-6xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">
              <i className="fa-solid fa-users mr-2 text-amber-500"></i> Nhân Vật
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Bộ sưu tập các nhân vật dùng chung được xây dựng trong các vũ trụ cốt truyện.
            </p>
          </div>
          {isCreator ? (
            <a
              href="/create/character"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/10 hover:brightness-110 transition-all flex items-center space-x-1.5 flex-shrink-0"
            >
              <i className="fa-solid fa-user-plus"></i>
              <span>Tạo nhân vật mới</span>
            </a>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {characters.length === 0 ? (
          <div className="col-span-full p-10 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <i className="fa-solid fa-user-slash text-gray-500 text-3xl mb-3"></i>
            <p className="text-sm text-gray-500 dark:text-gray-500">Chưa có nhân vật nào được tạo.</p>
          </div>
        ) : (
          characters.map((c) => {
            const svTitle = universeTitles.get(c.storyverse_id) || c.storyverse_id;
            return (
              <div
                key={c.id}
                className="p-6 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700/80 rounded-2xl space-y-4 text-left shadow-lg flex flex-col"
              >
                <div className="flex items-start gap-4">
                  {c.thumbnail_url ? (
                    <img
                      src={c.thumbnail_url}
                      className="w-16 h-16 object-cover rounded-2xl shadow border border-gray-200 dark:border-gray-800 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/15 to-yellow-400/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-2xl flex-shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{c.name}</h3>
                    <span className="text-[10px] text-gray-500 dark:text-gray-500 block mt-0.5 truncate">
                      <i className="fa-solid fa-earth-asia mr-1 text-amber-500/80"></i>
                      {svTitle}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-500 block mt-0.5">
                      Bởi:{" "}
                      <a href={`/profile/${c.author}`} className="hover:text-amber-400 hover:underline">
                        @{c.author}
                      </a>
                    </span>
                  </div>
                </div>
                <div className="md text-xs leading-relaxed flex-grow line-clamp-4">
                  {markdownToText(c.description)}
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800/80 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <a
                    href={`/storyverses/${c.storyverse_id}`}
                    className="text-amber-500 hover:underline font-semibold flex items-center space-x-1.5"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    <span>Xem trong vũ trụ</span>
                  </a>
                  <div className="flex items-center space-x-3">
                    <span>
                      <i className="fa-regular fa-heart mr-1"></i> {c.likes_count || 0}
                    </span>
                    <span>
                      <i className="fa-regular fa-comment mr-1"></i> {c.comments_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Pagination pageInfo={charsResult} basePath="/characters" />
    </>
  );
}
