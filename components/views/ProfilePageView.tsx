"use client";

import type { Character, PageResult, Storyverse, Storybook, User } from "@/lib/db";
import { markdownToText } from "@/lib/markdown";
import { fmtDate } from "@/lib/format";
import Pagination from "@/components/Pagination";

async function toggleFollow(targetUsername: string, btn: HTMLButtonElement) {
  try {
    const currentText = btn.querySelector("span")?.innerText;
    const action = currentText === "Theo dõi" ? "follow" : "unfollow";

    const res = await fetch(`/api/users/${targetUsername}/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (data.success) {
      window.location.reload();
    } else {
      alert("Lỗi: " + (data.error || "Không thể thực hiện thao tác."));
    }
  } catch (err) {
    console.error(err);
  }
}

// Profile page view
export default function ProfilePageView({
  profileUser,
  isOwnProfile,
  booksResult,
  versesResult,
  charactersResult,
  isFollowing,
  followers,
  following,
  currentUser,
}: {
  profileUser: User;
  isOwnProfile: boolean;
  booksResult: PageResult<Storybook>;
  versesResult: PageResult<Storyverse>;
  charactersResult: PageResult<Character>;
  isFollowing: boolean;
  followers: string[];
  following: string[];
  currentUser: User | null;
}) {
  const books = booksResult.items;
  const verses = versesResult.items;
  const characters = charactersResult.items;

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left">
      {/* Profile Header Card */}
      <div className="p-8 bg-gradient-to-tr from-white dark:from-[#161925] via-gray-100 dark:via-slate-900 to-amber-950/10 border border-gray-200 dark:border-gray-800 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          {profileUser.avatar ? (
            <img
              src={profileUser.avatar}
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-[#161925] shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 border-4 border-white dark:border-[#161925] flex items-center justify-center text-black font-black text-4xl shadow-xl">
              {profileUser.display_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="text-center md:text-left space-y-2">
            <div className="flex items-center flex-wrap gap-2.5 justify-center md:justify-start">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                {profileUser.display_name}
              </h1>
              {profileUser.is_owner ? (
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                  Owner
                </span>
              ) : null}
              {profileUser.is_admin ? (
                <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                  Admin
                </span>
              ) : null}
              {profileUser.is_creator ? (
                <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20 text-[10px] font-bold">
                  Creator
                </span>
              ) : null}
            </div>
            <p className="text-sm text-gray-650 dark:text-gray-400 font-medium">@{profileUser.username}</p>
            {profileUser.des ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                {markdownToText(profileUser.des)}
              </p>
            ) : null}
            <p className="text-xs text-gray-500 dark:text-gray-500" suppressHydrationWarning>
              <i className="fa-solid fa-calendar mr-1">5</i> Tham gia ngày: {fmtDate(profileUser.join_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isOwnProfile ? (
            <a
              href="/settings"
              className="px-5 py-2.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700/80 border border-gray-300 dark:border-gray-700/60 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <i className="fa-solid fa-gear"></i>
              <span>Cài đặt cá nhân</span>
            </a>
          ) : currentUser ? (
            <button
              onClick={(e) => toggleFollow(profileUser.username, e.currentTarget)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/10 transition-all flex items-center space-x-1.5"
            >
              <i className={`fa-solid ${isFollowing ? "fa-user-minus" : "fa-user-plus"}`}></i>
              <span>{isFollowing ? "Bỏ theo dõi" : "Theo dõi"}</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Follower Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { value: followers.length, label: "Người theo dõi" },
          { value: following.length, label: "Đang theo dõi" },
          { value: booksResult.total, label: "Bộ truyện" },
          { value: versesResult.total, label: "Vũ trụ" },
          { value: charactersResult.total, label: "Nhân vật" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl text-center shadow"
          >
            <span className="text-2xl font-black text-amber-500 block">{stat.value}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Created Content Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Storybooks */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            <i className="fa-solid fa-book mr-2 text-amber-500"></i> Bộ truyện đã sáng tác
          </h2>
          {books && books.length > 0 ? (
            <div className="space-y-3">
              {books.map((b) => (
                <a
                  key={b.id}
                  href={`/storybook/${b.id}`}
                  className="block p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-amber-500/40 rounded-xl hover:bg-gray-100 dark:bg-[#1a1e2e]/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {b.thumbnail_url ? (
                      <img src={b.thumbnail_url} className="w-10 h-14 object-cover rounded shadow" />
                    ) : null}
                    <div>
                      <h4 className="font-bold text-gray-850 dark:text-gray-200">{b.title}</h4>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase block mt-0.5">
                        {b.categories}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-500 italic">Chưa có truyện nào.</p>
          )}
          <Pagination
            pageInfo={booksResult}
            basePath={`/profile/${profileUser.username}`}
            pageParam="bp"
          />
        </div>

        {/* Storyverses */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            <i className="fa-solid fa-earth-asia mr-2 text-amber-500"></i> Vũ trụ đã sáng tạo
          </h2>
          {verses && verses.length > 0 ? (
            <div className="space-y-3">
              {verses.map((sv) => (
                <a
                  key={sv.id}
                  href={`/storyverses/${sv.id}`}
                  className="block p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-amber-500/40 rounded-xl hover:bg-gray-100 dark:bg-[#1a1e2e]/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {sv.thumbnail_url ? (
                      <img src={sv.thumbnail_url} className="w-10 h-10 object-cover rounded shadow" />
                    ) : null}
                    <div>
                      <h4 className="font-bold text-gray-850 dark:text-gray-200">{sv.title}</h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {markdownToText(sv.description)}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-500 italic">Chưa có vũ trụ nào.</p>
          )}
          <Pagination
            pageInfo={versesResult}
            basePath={`/profile/${profileUser.username}`}
            pageParam="vp"
          />
        </div>
      </div>

      {/* Characters */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
          <i className="fa-solid fa-users mr-2 text-amber-500"></i> Nhân vật đã tạo{" "}
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            ({charactersResult.total})
          </span>
        </h2>
        {characters && characters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {characters.map((c) => (
              <a
                key={c.id}
                href={`/storyverses/${c.storyverse_id}`}
                className="block p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-amber-500/40 rounded-xl hover:bg-gray-100 dark:bg-[#1a1e2e]/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  {c.thumbnail_url ? (
                    <img src={c.thumbnail_url} className="w-10 h-10 object-cover rounded-xl shadow" />
                  ) : null}
                  <div>
                    <h4 className="font-bold text-gray-850 dark:text-gray-200">{c.name}</h4>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase block mt-0.5">
                      {c.storyverse_id}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-500 italic">Chưa tạo nhân vật nào.</p>
        )}
        <Pagination
          pageInfo={charactersResult}
          basePath={`/profile/${profileUser.username}`}
          pageParam="cp"
        />
      </div>

      {/* Followers & Following */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            <i className="fa-solid fa-user-group mr-2 text-amber-500"></i> Người theo dõi{" "}
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">({followers.length})</span>
          </h2>
          {followers && followers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {followers.map((f) => (
                <a
                  key={f}
                  href={`/profile/${f}`}
                  className="px-3 py-1.5 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 rounded-full text-xs font-semibold text-amber-500 hover:border-amber-500/40 hover:underline transition-colors"
                >
                  @{f}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-500 italic">Chưa có người theo dõi.</p>
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
            <i className="fa-solid fa-user-plus mr-2 text-amber-500"></i> Đang theo dõi{" "}
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">({following.length})</span>
          </h2>
          {following && following.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {following.map((f) => (
                <a
                  key={f}
                  href={`/profile/${f}`}
                  className="px-3 py-1.5 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 rounded-full text-xs font-semibold text-amber-500 hover:border-amber-500/40 hover:underline transition-colors"
                >
                  @{f}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-500 italic">Chưa theo dõi ai.</p>
          )}
        </div>
      </div>
    </div>
  );
}
