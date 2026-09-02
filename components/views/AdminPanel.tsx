"use client";

import type { PageResult, User } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import Pagination from "@/components/Pagination";

async function toggleAdminRole(username: string, makeAdmin: boolean) {
  if (!confirm(`Xác nhận thay đổi quyền của @${username}?`)) return;
  try {
    const res = await fetch(`/api/admin/users/${username}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_admin: makeAdmin }),
    });
    const data = await res.json();
    if (data.success) {
      window.location.reload();
    } else {
      alert("Lỗi: " + (data.error || "Thao tác thất bại"));
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteUser(username: string) {
  if (
    !confirm(
      `CẢNH BÁO: Bạn có chắc muốn xóa vĩnh viễn tài khoản @${username} cùng toàn bộ nội dung liên quan?`
    )
  )
    return;
  try {
    const res = await fetch(`/api/admin/users/${username}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      window.location.reload();
    } else {
      alert("Lỗi: " + (data.error || "Không thể xóa"));
    }
  } catch (err) {
    console.error(err);
  }
}

// Admin panel view
export default function AdminPanel({
  usersResult,
  currentUser,
  isEnvOwner,
}: {
  usersResult: PageResult<User>;
  currentUser: User | null;
  isEnvOwner: boolean;
}) {
  const users = usersResult.items;
  const currentUsername = currentUser?.username?.toLowerCase() ?? "";
  const rows = users.map((u) => {
    const isSelf = currentUsername && u.username.toLowerCase() === currentUsername;
    // Env-var owner can manage anyone except themselves; admins can only manage non-owners
    const canManage = !isSelf && (!u.is_owner || isEnvOwner);
    return { u, isSelf, canManage };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
          <i className="fa-solid fa-user-shield mr-2 text-amber-500"></i> Quản Trị Hệ Thống
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Xem danh sách người dùng, thay đổi quyền lực hoặc dọn dẹp hệ thống.
        </p>
      </div>

      <div className="bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-3">
          Danh sách thành viên ({usersResult.total})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Tên hiển thị</th>
                <th className="py-3 px-4">Tài khoản</th>
                <th className="py-3 px-4">Quyền hạn</th>
                <th className="py-3 px-4">Ngày tham gia</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {rows.map(({ u, isSelf, canManage }) => (
                <tr key={u.username} className="hover:bg-gray-200 dark:bg-gray-800/10 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-gray-800 dark:text-gray-200">
                    <a
                      href={`/profile/${u.username}`}
                      className="hover:underline hover:text-amber-500 transition-colors"
                    >
                      {u.display_name}
                    </a>
                  </td>
                  <td className="py-3.5 px-4 text-amber-500">
                    <a href={`/profile/${u.username}`} className="hover:underline">
                      @{u.username}
                    </a>
                  </td>
                  <td className="py-3.5 px-4">
                    {u.is_owner ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                        Owner
                      </span>
                    ) : u.is_admin ? (
                      <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                        Admin
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-gray-500/10 text-gray-600 dark:text-gray-400 text-[10px] font-medium">
                        User
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-500" suppressHydrationWarning>
                    {fmtDate(u.join_date)}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {canManage ? (
                      <>
                        <button
                          onClick={() => toggleAdminRole(u.username, !u.is_admin)}
                          className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors"
                        >
                          {u.is_admin ? "Hạ quyền" : "Lên Admin"}
                        </button>
                        <button
                          onClick={() => deleteUser(u.username)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-black rounded-lg text-xs font-semibold transition-all"
                        >
                          Xóa
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-600 italic">
                        {isSelf ? "Chính bạn" : "Vô hiệu hóa"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination pageInfo={usersResult} basePath="/admin" />
      </div>
    </div>
  );
}
