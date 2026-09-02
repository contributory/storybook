"use client";

import type { Chapter, Storybook, User } from "@/lib/db";
import AuthorsList from "@/components/AuthorsList";
import Markdown from "@/components/Markdown";
import CommentsArea from "@/components/CommentsArea";
import { fmtDate } from "@/lib/format";

async function deleteBook(bookId: string) {
  if (
    !confirm(
      "Bạn có chắc chắn muốn xóa vĩnh viễn bộ truyện này cùng tất cả các chương? Thao tác này không thể hoàn tác!"
    )
  )
    return;
  try {
    const res = await fetch(`/api/storybooks/${bookId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      window.location.href = "/";
    } else {
      alert("Lỗi: " + (data.error || "Không thể xóa."));
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteChapter(bookId: string, num: number) {
  if (!confirm(`Xác nhận xóa Chương ${num}?`)) return;
  try {
    const res = await fetch(`/api/storybooks/${bookId}/chapters/${num}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      window.location.reload();
    } else {
      alert("Lỗi: " + (data.error || "Không thể xóa chương."));
    }
  } catch (err) {
    console.error(err);
  }
}

// Storybook detail page view
export default function StorybookDetailView({
  book,
  chapters,
  user,
}: {
  book: Storybook;
  chapters: Omit<Chapter, "content">[];
  user: User | null;
}) {
  const allowEdit = book.allow_other_author_edit;
  const isAuthor = user && book.authors.toLowerCase().includes(user.username.toLowerCase());
  const isAdminOrOwner = user && (user.is_admin || user.is_owner);

  // Characters stored as a JSON string on the storybook
  let bookChars: any[] = [];
  try {
    bookChars = JSON.parse(book.characters || "[]");
  } catch (_) {
    /* malformed JSON → treated as empty */
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left">
      {/* Breadcrumb / Header Cover */}
      <div className="p-8 bg-gradient-to-br from-white dark:from-[#161925] via-gray-100 dark:via-slate-900 to-amber-950/20 border border-gray-200 dark:border-gray-800 rounded-3xl relative flex flex-col md:flex-row gap-6">
        {book.thumbnail_url ? (
          <div className="w-32 h-44 rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800 flex-shrink-0">
            <img src={book.thumbnail_url} className="w-full h-full object-cover" />
          </div>
        ) : null}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex flex-wrap gap-1.5">
              {book.categories.split(",").map((c, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold"
                >
                  {c.trim()}
                </span>
              ))}
            </div>

            {/* Side action buttons (in flow so they never overlap the title/description) */}
            <div className="flex flex-col space-y-2 items-end flex-shrink-0">
              <button
                onClick={(e) => (window as any).toggleLike("storybook", book.id, e.currentTarget)}
                className="px-3.5 py-1.5 bg-gray-200 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700/80 border border-gray-300 dark:border-gray-700/60 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                <i className="fa-regular fa-heart"></i>
                <span>{book.likes_count || 0}</span>
              </button>

              {allowEdit ? (
                <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold text-center">
                  <i className="fa-solid fa-users mr-1"></i> Cho phép đồng tác giả
                </span>
              ) : null}
              {book.storyverse_id ? (
                <a
                  href={`/create/character?storyverse_id=${book.storyverse_id}`}
                  className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 hover:text-black text-amber-400 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all"
                >
                  <i className="fa-solid fa-user-plus"></i>
                  <span>Tạo nhân vật</span>
                </a>
              ) : null}
              {user && (isAuthor || isAdminOrOwner) ? (
                <>
                  <a
                    href={`/create/storybook?id=${book.id}`}
                    className="px-3.5 py-1.5 bg-gray-250 dark:bg-gray-800 border border-gray-300 dark:border-gray-700/60 hover:bg-gray-300 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all"
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                    <span>Sửa truyện</span>
                  </a>
                  <button
                    onClick={() => deleteBook(book.id)}
                    className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-550 border border-red-500/20 text-red-400 hover:text-black rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    <span>Xóa truyện</span>
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-2">
            {book.title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4" suppressHydrationWarning>
            Bởi: <span className="font-medium text-gray-700 dark:text-gray-300"><AuthorsList authorsStr={book.authors} /></span>{" "}
            &bull; Phát hành: {fmtDate(book.created_at)}
          </p>

          <Markdown text={book.description} className="text-sm leading-relaxed" />

          <div className="flex flex-wrap gap-3 mt-6">
            {chapters && chapters.length > 0 ? (
              <a
                href={`/storybook/${book.id}/chapter/1`}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/10 flex items-center space-x-1.5 transition-colors"
              >
                <i className="fa-solid fa-book-open"></i>
                <span>Đọc từ đầu (Chương 1)</span>
              </a>
            ) : (
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 text-xs rounded-xl cursor-not-allowed font-semibold"
                disabled
              >
                Chưa có chương
              </button>
            )}

            {book.storyverse_id ? (
              <a
                href={`/storyverses/${book.storyverse_id}`}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-700/80 text-gray-900 dark:text-white font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1.5"
              >
                <i className="fa-solid fa-earth-asia text-amber-400"></i>
                <span>Vũ trụ cốt truyện</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Chapters & Summary Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Chapters List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            <i className="fa-solid fa-list mr-2 text-amber-500"></i> Mục lục chương ({chapters.length})
          </h3>

          {chapters && chapters.length > 0 ? (
            <div className="space-y-2">
              {chapters.map((ch) => {
                const canDelCh = isAuthor || isAdminOrOwner;
                const canEditCh = isAuthor || isAdminOrOwner || (user && book.allow_other_author_edit);
                return (
                  <div
                    key={ch.chapter_number}
                    className="flex items-center justify-between p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-amber-500/40 rounded-xl hover:bg-gray-100 dark:bg-[#1a1e2e]/30 transition-all group"
                  >
                    <a
                      href={`/storybook/${book.id}/chapter/${ch.chapter_number}`}
                      className="flex-grow text-left space-y-1"
                    >
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-amber-400 transition-colors">
                        Chương {ch.chapter_number}: {ch.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 italic">
                        Tóm tắt: {ch.summary || "Chưa có tóm tắt"}
                      </p>
                    </a>
                    <div className="flex items-center space-x-3 ml-4">
                      {canEditCh ? (
                        <a
                          href={`/create/storybook?id=${book.id}&chapter_number=${ch.chapter_number}`}
                          className="p-2 text-gray-500 hover:text-amber-500 transition-colors"
                          title="Sửa chương này"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </a>
                      ) : null}
                      {canDelCh ? (
                        <button
                          onClick={() => deleteChapter(book.id, ch.chapter_number)}
                          className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                          title="Xóa chương này"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      ) : null}
                      <a
                        href={`/storybook/${book.id}/chapter/${ch.chapter_number}`}
                        className="text-gray-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all"
                      >
                        <i className="fa-solid fa-chevron-right"></i>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              <i className="fa-solid fa-book-open-reader text-gray-600 text-3xl mb-3"></i>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Truyện này chưa có chương nào được viết.
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Collaboration / AI context card */}
        <div className="space-y-4">
          <div className="p-5 bg-gradient-to-tr from-white dark:from-[#161925] to-gray-100 dark:to-[#1d2133] border border-gray-200 dark:border-gray-800 rounded-2xl text-left space-y-4 shadow-lg">
            <h4 className="font-bold text-amber-400 flex items-center">
              <i className="fa-solid fa-robot mr-2"></i> Trợ lý viết tiếp (AI)
            </h4>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
              Bạn có muốn viết tiếp cho bộ truyện này? Hệ thống của chúng tôi hỗ trợ tự động **gói tóm tắt
              các chương** trước đó và gửi trực tiếp sang AI để nó tiếp thu cốt truyện nhanh nhất mà không
              bị quá tải ngữ cảnh.
            </p>
            <div className="p-3 bg-gray-50 dark:bg-[#0f111a] rounded-lg border border-gray-200 dark:border-gray-850">
              <span className="text-[10px] uppercase font-semibold text-gray-500 dark:text-gray-500 block">
                Lợi thế tóm tắt:
              </span>
              <p className="text-[11px] text-amber-500/90 mt-1">
                <i className="fa-solid fa-check mr-1"></i> Tiết kiệm 90% dung lượng Token.
              </p>
              <p className="text-[11px] text-amber-500/90 mt-0.5">
                <i className="fa-solid fa-check mr-1"></i> Logic cốt truyện được duy trì hoàn hảo.
              </p>
            </div>
            {allowEdit || isAuthor ? (
              <a
                href={`/creator?book_id=${book.id}`}
                className="block w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-center font-bold text-xs rounded-lg hover:brightness-110 transition-all"
              >
                <i className="fa-solid fa-feather-pointed mr-1"></i> Viết chương mới
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Characters Section */}
      {bookChars.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            <i className="fa-solid fa-users mr-2 text-amber-500"></i> Nhân vật chính ({bookChars.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bookChars.map((c: any, i: number) => (
              <div
                key={i}
                className="p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <h4 className="font-bold text-gray-800 dark:text-gray-250">{c.name}</h4>
                  {c.role ? (
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider">
                      {c.role}
                    </span>
                  ) : null}
                </div>
                {c.id ? (
                  <div className="mt-1">
                    {book.storyverse_id ? (
                      <a
                        href={`/storyverses/${book.storyverse_id}`}
                        className="inline-flex items-center px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold hover:underline"
                      >
                        <i className="fa-solid fa-link mr-1"></i> Nhân vật liên kết: @{c.id}
                      </a>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-500/20 text-gray-500 text-[9px] font-bold">
                        <i className="fa-solid fa-link mr-1"></i> Nhân vật liên kết: @{c.id}
                      </span>
                    )}
                  </div>
                ) : null}
                {c.description ? (
                  <p className="text-xs text-gray-650 dark:text-gray-400 leading-relaxed">{c.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Comments Area */}
      <CommentsArea targetType="storybook" targetId={book.id} />
    </div>
  );
}
