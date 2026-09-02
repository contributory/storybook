"use client";

import type { Character, Storyverse, User } from "@/lib/db";
import Markdown from "@/components/Markdown";
import CommentsArea from "@/components/CommentsArea";
import { fmtDate } from "@/lib/format";

// Delete helpers (ported from the previous inline script)
async function deleteUniverse(universeId: string) {
  if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn vũ trụ này? Các bộ truyện thuộc vũ trụ sẽ mất liên kết."))
    return;
  try {
    const res = await fetch(`/api/storyverses/${universeId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      window.location.href = "/storyverses";
    } else {
      alert("Lỗi: " + (data.error || "Không thể xóa."));
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteCharacter(charId: string) {
  if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn nhân vật này?")) return;
  try {
    const res = await fetch(`/api/characters/${charId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      window.location.reload();
    } else {
      alert("Lỗi: " + (data.error || "Không thể xóa."));
    }
  } catch (err) {
    console.error(err);
  }
}

// Individual Storyverse view with Characters & Books
export default function StoryverseDetailView({
  sv,
  characters,
  user,
}: {
  sv: Storyverse;
  characters: Character[];
  user: User | null;
}) {
  const isCreator = user ? user.is_creator || user.is_admin || user.is_owner : false;
  const canManage =
    user && (sv.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner);

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left">
      {/* Header */}
      <div className="p-8 bg-gradient-to-tr from-white dark:from-[#161925] via-[#10131f] to-amber-900/10 border border-gray-200 dark:border-gray-800 rounded-3xl relative flex flex-col md:flex-row gap-6">
        {sv.thumbnail_url ? (
          <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800 flex-shrink-0">
            <img src={sv.thumbnail_url} className="w-full h-full object-cover" />
          </div>
        ) : null}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-4">
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-md text-xs font-semibold">
              <i className="fa-solid fa-earth-asia mr-1"></i> Vũ trụ cốt truyện
            </span>
            {/* Side action buttons (in flow so they never overlap the content) */}
            <div className="flex flex-col space-y-2 items-end flex-shrink-0">
              <button
                onClick={(e) => (window as any).toggleLike("storyverse", sv.id, e.currentTarget)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700/80 border border-gray-300 dark:border-gray-700/60 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all"
              >
                <i className="fa-regular fa-heart"></i>
                <span>{sv.likes_count || 0} thích</span>
              </button>
              {isCreator ? (
                <a
                  href={`/create/character?storyverse_id=${sv.id}`}
                  className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 hover:text-black text-amber-400 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
                >
                  <i className="fa-solid fa-user-plus"></i>
                  <span>Tạo nhân vật</span>
                </a>
              ) : null}
              {canManage ? (
                <>
                  <a
                    href={`/create/storyverse?id=${sv.id}`}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                    <span>Sửa vũ trụ</span>
                  </a>
                  <button
                    onClick={() => deleteUniverse(sv.id)}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:text-black text-red-400 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    <span>Xóa vũ trụ</span>
                  </button>
                </>
              ) : null}
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mt-4 mb-2">{sv.title}</h1>
          <p className="text-sm text-gray-650 dark:text-gray-400 font-medium" suppressHydrationWarning>
            Sáng tạo bởi:{" "}
            <a
              href={`/profile/${sv.author}`}
              className="text-gray-805 dark:text-gray-200 hover:text-amber-400 hover:underline"
            >
              @{sv.author}
            </a>{" "}
            &bull; {fmtDate(sv.created_at)}
          </p>
          <Markdown text={sv.description} className="text-base mt-4 leading-relaxed" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Books in Universe */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            <i className="fa-solid fa-book mr-2 text-amber-500"></i> Các bộ truyện liên quan
          </h2>
          {sv.storybook_list && sv.storybook_list.length > 0 ? (
            <div className="space-y-3">
              {sv.storybook_list.map((b) => (
                <div
                  key={b.id}
                  className="block p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-100 dark:bg-[#1a1e2e]/30 transition-all"
                >
                  <h4 className="font-bold text-gray-850 dark:text-gray-200 hover:text-amber-400 transition-colors">
                    <a href={`/storybook/${b.id}`}>{b.title}</a>
                  </h4>
                  <span className="text-xs text-gray-600 dark:text-gray-400 block mt-1">
                    Tác giả:
                    {b.authors.split(",").map((auth, idx) => {
                      const a = auth.trim();
                      return (
                        <span key={idx}>
                          {" "}
                          <a href={`/profile/${a}`} className="hover:underline text-amber-500 font-semibold">
                            @{a}
                          </a>
                          {idx < b.authors.split(",").length - 1 ? ", " : ""}
                        </span>
                      );
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-500 italic">
              Chưa có truyện nào thuộc vũ trụ này.
            </p>
          )}
        </div>

        {/* Characters in Universe */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            <i className="fa-solid fa-users mr-2 text-amber-500"></i> Nhân Vật
          </h2>
          {characters && characters.length > 0 ? (
            <div className="space-y-3">
              {characters.map((c) => {
                const canEditChar =
                  user &&
                  (c.author.toLowerCase() === user.username.toLowerCase() ||
                    user.is_admin ||
                    user.is_owner);
                return (
                  <div
                    key={c.id}
                    className="p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 rounded-xl flex gap-4"
                  >
                    {c.thumbnail_url ? (
                      <img
                        src={c.thumbnail_url}
                        className="w-12 h-12 object-cover rounded-xl shadow border border-gray-200 dark:border-gray-800 flex-shrink-0"
                      />
                    ) : null}
                    <div className="flex-grow text-left">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-amber-400">{c.name}</h4>
                        <div className="flex items-center space-x-2">
                          {canEditChar ? (
                            <>
                              <a
                                href={`/create/character?id=${c.id}`}
                                className="p-1 text-gray-500 hover:text-amber-500 transition-colors"
                                title="Sửa nhân vật"
                              >
                                <i className="fa-solid fa-user-pen"></i>
                              </a>
                              <button
                                onClick={() => deleteCharacter(c.id)}
                                className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                                title="Xóa nhân vật"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-500 block">
                        Tạo bởi:{" "}
                        <a href={`/profile/${c.author}`} className="hover:text-amber-400 hover:underline">
                          @{c.author}
                        </a>
                      </span>
                      <Markdown text={c.description} className="text-xs mt-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-500 italic">
              Chưa có nhân vật nào trong vũ trụ này.
            </p>
          )}
        </div>
      </div>

      {/* Comments Area */}
      <CommentsArea targetType="storyverse" targetId={sv.id} />
    </div>
  );
}
