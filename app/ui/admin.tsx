/** @jsxImportSource hono/jsx */
import { html } from "hono/html";
import * as db from "../db.js";
import { renderPagination } from "./pagination.js";

// Admin panel View
export function renderAdminPanel(usersResult: db.PageResult<db.User>, currentUser: db.User | null = null) {
  const users = usersResult.items;
  const currentUsername = currentUser?.username?.toLowerCase() ?? "";
  const isEnvOwner = db.isEnvOwnerUsername(currentUsername);
  const rows = users.map(u => {
    const isSelf = currentUsername && u.username.toLowerCase() === currentUsername;
    // Env-var owner can manage anyone except themselves; admins can only manage non-owners
    const canManage = !isSelf && (!u.is_owner || isEnvOwner);
    return { u, isSelf, canManage };
  });
  return html`
    <div class="max-w-4xl mx-auto space-y-8 text-left">
        <div class="space-y-2">
            <h1 class="text-3xl font-black text-gray-900 dark:text-white"><i class="fa-solid fa-user-shield mr-2 text-amber-500"></i> Quản Trị Hệ Thống</h1>
            <p class="text-gray-600 dark:text-gray-400">Xem danh sách người dùng, thay đổi quyền lực hoặc dọn dẹp hệ thống.</p>
        </div>

        <div class="bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-3">Danh sách thành viên (${usersResult.total})</h3>

            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr class="border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                            <th class="py-3 px-4">Tên hiển thị</th>
                            <th class="py-3 px-4">Tài khoản</th>
                            <th class="py-3 px-4">Quyền hạn</th>
                            <th class="py-3 px-4">Ngày tham gia</th>
                            <th class="py-3 px-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-800/60">
                        ${rows.map(({ u, isSelf, canManage }) => html`
                        <tr class="hover:bg-gray-200 dark:bg-gray-800/10 transition-colors">
                            <td class="py-3.5 px-4 font-semibold text-gray-800 dark:text-gray-200"><a href="/profile/${u.username}" class="hover:underline hover:text-amber-500 transition-colors">${u.display_name}</a></td>
                            <td class="py-3.5 px-4 text-amber-500"><a href="/profile/${u.username}" class="hover:underline">@${u.username}</a></td>
                            <td class="py-3.5 px-4">
                                ${u.is_owner ? html`<span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px] font-bold">Owner</span>` :
                                  u.is_admin ? html`<span class="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20 text-[10px] font-bold">Admin</span>` :
                                  html`<span class="px-2 py-0.5 rounded bg-gray-500/10 text-gray-600 dark:text-gray-400 text-[10px] font-medium">User</span>`}
                            </td>
                            <td class="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-500">${new Date(u.join_date).toLocaleDateString("vi-VN")}</td>
                            <td class="py-3.5 px-4 text-right space-x-2">
                                ${canManage ? html`
                                <button onclick="toggleAdminRole('${u.username}', ${u.is_admin ? "false" : "true"})" class="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors">
                                    ${u.is_admin ? "Hạ quyền" : "Lên Admin"}
                                </button>
                                <button onclick="deleteUser('${u.username}')" class="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-black rounded-lg text-xs font-semibold transition-all">
                                    Xóa
                                </button>
                                ` : html`<span class="text-xs text-gray-600 italic">${isSelf ? "Chính bạn" : "Vô hiệu hóa"}</span>`}
                            </td>
                        </tr>
                        `)}
                    </tbody>
                </table>
            </div>

            ${renderPagination(usersResult, "/admin")}
        </div>
    </div>

    <script>
        async function toggleAdminRole(username, makeAdmin) {
            if (!confirm(\`Xác nhận thay đổi quyền của @\${username}?\`)) return;
            try {
                const res = await fetch(\`/api/admin/users/\${username}/role\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_admin: makeAdmin })
                });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                } else {
                    alert('Lỗi: ' + (data.error || 'Thao tác thất bại'));
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function deleteUser(username) {
            if (!confirm(\`CẢNH BÁO: Bạn có chắc muốn xóa vĩnh viễn tài khoản @\${username} cùng toàn bộ nội dung liên quan?\`)) return;
            try {
                const res = await fetch(\`/api/admin/users/\${username}\`, {
                    method: 'DELETE'
                });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                } else {
                    alert('Lỗi: ' + (data.error || 'Không thể xóa'));
                }
            } catch (err) {
                console.error(err);
            }
        }
    </script>
  `;
}
