/** @jsxImportSource npm:hono@4.5.11/jsx */
import { html } from "npm:hono/html";
import * as db from "../db.ts";

export function renderCreateStorybook(universes: db.Storyverse[], book: db.Storybook | null) {
  const isEdit = !!book;
  const b = book;

  return html`
    <div class="max-w-2xl mx-auto space-y-6 text-left">
        <div class="space-y-2">
            <a href="${isEdit ? `/storybook/${b!.id}` : "/storybooks"}" class="inline-flex items-center space-x-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-amber-400 transition-colors">
                <i class="fa-solid fa-chevron-left"></i>
                <span>${isEdit ? "Quay lại truyện" : "Quay lại thư viện"}</span>
            </a>
            <h1 class="text-3xl font-black text-gray-900 dark:text-white">
                <i class="fa-solid ${isEdit ? "fa-pen-to-square" : "fa-book"} mr-2 text-amber-500"></i>
                ${isEdit ? `Sửa Bộ Truyện: ${b!.title}` : "Tạo Bộ Truyện Mới"}
            </h1>
            <p class="text-gray-600 dark:text-gray-400">${isEdit ? "Cập nhật thông tin bộ truyện của bạn." : "Khai sinh bộ truyện mới của riêng bạn hoặc thuộc về một Vũ trụ dùng chung."}</p>
        </div>

        <div class="bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <form onsubmit="handleCreateBook(event)" class="space-y-4">
                ${isEdit ? html`<input type="hidden" id="bookEditId" value="${b!.id}">` : ""}

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">ID bộ truyện (Không dấu/khoảng cách)</label>
                        <input type="text" id="bookId" required ${isEdit ? "readonly disabled" : ""} value="${b ? b.id : ""}" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors ${isEdit ? "opacity-60 cursor-not-allowed" : ""}" placeholder="tay-du-ky-ngoai-truyen">
                        ${isEdit ? html`<span class="text-[10px] text-gray-500 dark:text-gray-500 mt-1 block">ID không thể thay đổi sau khi tạo.</span>` : ""}
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Tiêu đề bộ truyện</label>
                        <input type="text" id="bookTitle" required value="${b ? b.title : ""}" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Tây Du Ký: Ngoại Truyện">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Mô tả cốt truyện</label>
                    <textarea id="bookDescription" required rows="4" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Tóm lược nội dung cốt truyện chính, định hướng...">${b ? b.description : ""}</textarea>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Thể loại (Ngăn cách bởi dấu phẩy)</label>
                        <input type="text" id="bookCategories" required value="${b ? b.categories : ""}" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Huyền Huyễn, Tiên Hiệp, Phiêu Lưu">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Liên kết Vũ trụ (Storyverse)</label>
                        <select id="bookStoryverseId" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-amber-500 transition-colors">
                            <option value="">-- Độc lập --</option>
                            ${universes.map(u => html`<option value="${u.id}" ${b && b.storyverse_id === u.id ? "selected" : ""}>${u.title}</option>`)}
                        </select>
                    </div>
                </div>

                <div class="flex items-center space-x-3 pt-2">
                    <input type="checkbox" id="bookAllowEdit" ${b && b.allow_other_author_edit ? "checked" : ""} class="w-4 h-4 rounded border-gray-200 dark:border-gray-800 text-amber-500 focus:ring-amber-500 focus:ring-opacity-20 bg-gray-50 dark:bg-[#0f111a]">
                    <label for="bookAllowEdit" class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Cho phép những người dùng khác cùng viết truyện này (Đồng sáng tác)</label>
                </div>

                <div id="newBookError" class="text-red-400 text-xs hidden"></div>

                <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10">
                    ${isEdit ? "Lưu thay đổi" : "Tạo truyện mới"}
                </button>
            </form>
        </div>
    </div>

    <script>
        async function handleCreateBook(e) {
            e.preventDefault();
            const editId = document.getElementById('bookEditId') ? document.getElementById('bookEditId').value : '';
            const id = document.getElementById('bookId').value.trim();
            const title = document.getElementById('bookTitle').value.trim();
            const description = document.getElementById('bookDescription').value.trim();
            const categories = document.getElementById('bookCategories').value.trim();
            const storyverse_id = document.getElementById('bookStoryverseId').value;
            const allow_other_author_edit = document.getElementById('bookAllowEdit').checked;
            const errDiv = document.getElementById('newBookError');

            errDiv.classList.add('hidden');

            try {
                const payload = { title, description, categories, storyverse_id, allow_other_author_edit };
                const isEdit = !!editId;
                const res = await fetch(isEdit ? \`/api/storybooks/\${editId}\` : '/api/storybooks', {
                    method: isEdit ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(isEdit ? payload : { id, ...payload })
                });
                const data = await res.json();
                if (data.success) {
                    window.location.href = '/storybook/' + (data.storybook ? data.storybook.id : editId);
                } else {
                    errDiv.innerText = data.error || 'Thất bại.';
                    errDiv.classList.remove('hidden');
                }
            } catch (err) {
                console.error(err);
                errDiv.innerText = 'Có lỗi xảy ra, vui lòng thử lại.';
                errDiv.classList.remove('hidden');
            }
        }
    </script>
  `;
}
