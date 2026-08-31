/** @jsxImportSource hono/jsx */
import { html } from "hono/html";
import * as db from "../db.js";

export function renderCreateStoryverse(sv: db.Storyverse | null) {
  const isEdit = !!sv;

  return html`
    <div class="max-w-2xl mx-auto space-y-6 text-left">
        <div class="space-y-2">
            <a href="${isEdit ? `/storyverses/${sv!.id}` : "/storyverses"}" class="inline-flex items-center space-x-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-amber-400 transition-colors">
                <i class="fa-solid fa-chevron-left"></i>
                <span>${isEdit ? "Quay lại vũ trụ" : "Quay lại danh sách vũ trụ"}</span>
            </a>
            <h1 class="text-3xl font-black text-gray-900 dark:text-white">
                <i class="fa-solid ${isEdit ? "fa-pen-to-square" : "fa-earth-asia"} mr-2 text-amber-500"></i>
                ${isEdit ? `Sửa Vũ Trụ: ${sv!.title}` : "Tạo Vũ Trụ Cốt Truyện"}
            </h1>
            <p class="text-gray-600 dark:text-gray-400">${isEdit ? "Cập nhật bối cảnh và quy luật thế giới của vũ trụ." : "Vũ trụ đóng vai trò làm không gian chung kết nối nhiều tác phẩm độc lập hoặc chia sẻ các nhân vật."}</p>
        </div>

        <div class="bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <form onsubmit="handleCreateUniverse(event)" class="space-y-4">
                ${isEdit ? html`<input type="hidden" id="universeEditId" value="${sv!.id}">` : ""}

                <div>
                    <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">ID vũ trụ (không dấu, viết liền)</label>
                    <input type="text" id="universeId" required ${isEdit ? "readonly disabled" : ""} value="${sv ? sv.id : ""}" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors ${isEdit ? "opacity-60 cursor-not-allowed" : ""}" placeholder="tay-du-saga">
                    ${isEdit ? html`<span class="text-[10px] text-gray-500 dark:text-gray-500 mt-1 block">ID không thể thay đổi sau khi tạo.</span>` : ""}
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Tên vũ trụ</label>
                    <input type="text" id="universeTitle" required value="${sv ? sv.title : ""}" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Tây Du Saga">
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Mô tả bối cảnh và quy luật thế giới</label>
                    <textarea id="universeDescription" required rows="5" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Mô tả ranh giới thế giới, pháp lực, chủng tộc, quy luật siêu nhiên giúp định hình cốt truyện...">${sv ? sv.description : ""}</textarea>
                </div>

                <div id="newUniverseError" class="text-red-400 text-xs hidden"></div>

                <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10">
                    ${isEdit ? "Lưu thay đổi" : "Tạo vũ trụ cốt truyện"}
                </button>
            </form>
        </div>
    </div>

    <script>
        async function handleCreateUniverse(e) {
            e.preventDefault();
            const editId = document.getElementById('universeEditId') ? document.getElementById('universeEditId').value : '';
            const id = document.getElementById('universeId').value.trim();
            const title = document.getElementById('universeTitle').value.trim();
            const description = document.getElementById('universeDescription').value.trim();
            const errDiv = document.getElementById('newUniverseError');

            errDiv.classList.add('hidden');

            try {
                const payload = { title, description };
                const isEdit = !!editId;
                const res = await fetch(isEdit ? \`/api/storyverses/\${editId}\` : '/api/storyverses', {
                    method: isEdit ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(isEdit ? payload : { id, ...payload })
                });
                const data = await res.json();
                if (data.success) {
                    window.location.href = '/storyverses/' + (data.storyverse ? data.storyverse.id : editId);
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
