/** @jsxImportSource npm:hono@4.5.11/jsx */
import { html } from "npm:hono/html";
import * as db from "../db.ts";
import { renderPagination } from "./pagination.tsx";

export function renderNotificationsPage(notifsResult: db.PageResult<db.Notification>) {
  const notifications = notifsResult.items;
  return html`
    <div class="max-w-2xl mx-auto space-y-6 text-left">
        <div class="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
            <h1 class="text-2xl font-black text-gray-900 dark:text-white"><i class="fa-solid fa-bell mr-2.5 text-amber-500"></i> Thông Báo Của Bạn</h1>
            ${notifications.some(n => !n.is_read) ? html`
            <button onclick="markAllNotificationsAsRead()" class="text-xs font-semibold text-amber-500 hover:underline">Đánh dấu tất cả đã đọc</button>
            ` : ""}
        </div>

        <div class="space-y-3">
            ${notifications.length === 0 ? html`
            <div class="p-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                <i class="fa-solid fa-bell-slash text-gray-500 text-3xl mb-3"></i>
                <p class="text-sm text-gray-500 dark:text-gray-550">Bạn chưa có thông báo nào mới.</p>
            </div>
            ` : html`
            <div class="divide-y divide-gray-200 dark:divide-gray-800/80 bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-lg">
                ${notifications.map(n => html`
                <a href="/notifications/${n.id}/click" class="block p-4.5 transition-all hover:bg-gray-100 dark:hover:bg-[#1c2133]/45 flex items-start space-x-3.5 ${!n.is_read ? "bg-amber-500/5 border-l-4 border-amber-500 pl-3.5" : "pl-4.5"}">
                    <div class="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center text-amber-400 font-bold uppercase text-sm flex-shrink-0">
                        ${n.sender_display_name?.charAt(0).toUpperCase() || "S"}
                    </div>
                    <div class="flex-grow space-y-1">
                        <p class="text-sm text-gray-800 dark:text-gray-250 leading-relaxed">
                            <span class="font-bold text-gray-950 dark:text-white">${n.sender_display_name} (@${n.sender})</span>
                            ${n.content}
                        </p>
                        <div class="flex items-center space-x-2 text-[10px] text-gray-500 dark:text-gray-500 font-medium">
                            <span><i class="fa-solid ${n.type === "reply" ? "fa-reply" : "fa-comment"} mr-1 text-amber-500/80"></i> ${n.target_title}</span>
                            <span>&bull;</span>
                            <span>${new Date(n.created_at).toLocaleDateString("vi-VN")} ${new Date(n.created_at).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </a>
                `)}
            </div>
            `}
        </div>

        ${renderPagination(notifsResult, "/notifications")}
    </div>

    <script>
        async function markAllNotificationsAsRead() {
            try {
                const res = await fetch('/api/notifications/read-all', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                }
            } catch (err) {
                console.error(err);
            }
        }
    </script>
  `;
}
