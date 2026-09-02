"use client";

import type { PageResult, Storyverse, User } from "@/lib/db";
import Markdown from "@/components/Markdown";
import { fmtDate } from "@/lib/format";
import Pagination from "@/components/Pagination";

// Storyverses directory list view
export default function StoryversesView({
  versesResult,
  user,
}: {
  versesResult: PageResult<Storyverse>;
  user: User | null;
}) {
  const storyverses = versesResult.items;
  const isCreator = user ? user.is_creator || user.is_admin || user.is_owner : false;

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-10 max-w-4xl mx-auto text-left">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Vũ Trụ Cốt Truyện</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Các vũ trụ cốt truyện (Storyverses) là nơi kết nối nhiều bộ truyện và chia sẻ chung một dàn
            nhân vật phong phú.
          </p>
        </div>
        {isCreator ? (
          <a
            href="/create/storyverse"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/10 hover:brightness-110 transition-all flex items-center space-x-1.5 flex-shrink-0"
          >
            <i className="fa-solid fa-earth-asia"></i>
            <span>Tạo vũ trụ mới</span>
          </a>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {storyverses.length === 0 ? (
          <div className="col-span-full p-10 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <i className="fa-solid fa-earth-asia text-gray-500 text-3xl mb-3"></i>
            <p className="text-sm text-gray-500 dark:text-gray-500">Chưa có vũ trụ nào được tạo.</p>
          </div>
        ) : (
          storyverses.map((sv) => (
            <div
              key={sv.id}
              className="p-6 bg-white dark:bg-[#161925]/60 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-4 text-left shadow-lg"
            >
              <div className="space-y-1">
                <a href={`/storyverses/${sv.id}`}>
                  <h3 className="text-2xl font-bold text-amber-400 hover:underline">{sv.title}</h3>
                </a>
                <span className="text-xs text-gray-500 dark:text-gray-500 block">
                  Sáng lập bởi:{" "}
                  <a href={`/profile/${sv.author}`} className="hover:text-amber-400 hover:underline">
                    @{sv.author}
                  </a>
                </span>
              </div>

              <Markdown text={sv.description} className="text-sm leading-relaxed" />

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800/80 text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium" suppressHydrationWarning>
                  <i className="fa-solid fa-calendar mr-1.5"></i> {fmtDate(sv.created_at)}
                </span>
                <div className="flex space-x-4">
                  <span>
                    <i className="fa-solid fa-heart mr-1"></i> {sv.likes_count || 0}
                  </span>
                  <span>
                    <i className="fa-solid fa-comments mr-1"></i> {sv.comments_count || 0}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination pageInfo={versesResult} basePath="/storyverses" />
    </>
  );
}
