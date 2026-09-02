"use client";

import type { PageResult, Notification } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import Pagination from "@/components/Pagination";

async function markAllNotificationsAsRead() {
  try {
    const res = await fetch("/api/notifications/read-all", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      window.location.reload();
    }
  } catch (err) {
    console.error(err);
  }
}

// Notifications page view
export default function NotificationsPageView({
  notifsResult,
}: {
  notifsResult: PageResult<Notification>;
}) {
  const notifications = notifsResult.items;

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          <i className="fa-solid fa-bell mr-2.5 text-amber-500"></i> Thông Báo Của Bạn
        </h1>
        {notifications.some((n) => !n.is_read) ? (
          <button
            onClick={markAllNotificationsAsRead}
            className="text-xs font-semibold text-amber-500 hover:underline"
          >
            Đánh dấu tất cả đã đọc
          </button>
        ) : null}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <i className="fa-solid fa-bell-slash text-gray-500 text-3xl mb-3"></i>
            <p className="text-sm text-gray-500 dark:text-gray-550">Bạn chưa có thông báo nào mới.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800/80 bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-lg">
            {notifications.map((n) => (
              <a
                key={n.id}
                href={`/notifications/${n.id}/click`}
                className={`block p-4.5 transition-all hover:bg-gray-100 dark:hover:bg-[#1c2133]/45 flex items-start space-x-3.5 ${
                  !n.is_read ? "bg-amber-500/5 border-l-4 border-amber-500 pl-3.5" : "pl-4.5"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center text-amber-400 font-bold uppercase text-sm flex-shrink-0">
                  {n.sender_display_name?.charAt(0).toUpperCase() || "S"}
                </div>
                <div className="flex-grow space-y-1">
                  <p className="text-sm text-gray-800 dark:text-gray-250 leading-relaxed">
                    <span className="font-bold text-gray-950 dark:text-white">
                      {n.sender_display_name} (@{n.sender})
                    </span>{" "}
                    {n.content}
                  </p>
                  <div className="flex items-center space-x-2 text-[10px] text-gray-500 dark:text-gray-500 font-medium">
                    <span>
                      <i
                        className={`fa-solid ${n.type === "reply" ? "fa-reply" : "fa-comment"} mr-1 text-amber-500/80`}
                      ></i>{" "}
                      {n.target_title}
                    </span>
                    <span>&bull;</span>
                    <span suppressHydrationWarning>{fmtDateTime(n.created_at)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <Pagination pageInfo={notifsResult} basePath="/notifications" />
    </div>
  );
}
