/** @jsxImportSource npm:hono@4.5.11/jsx */
import { html } from "npm:hono/html";
import * as db from "../db.ts";

import { renderCommentsArea } from "./comments.tsx";

// Storyverses directory list view
export function renderStoryverses(storyverses: db.Storyverse[]) {
  return html`
    <div class="space-y-4 text-left max-w-4xl mx-auto mb-10">
        <h1 class="text-3xl font-black text-gray-900 dark:text-white">Vũ Trụ Cốt Truyện</h1>
        <p class="text-gray-600 dark:text-gray-400">Các vũ trụ cốt truyện (Storyverses) là nơi kết nối nhiều bộ truyện và chia sẻ chung một dàn nhân vật phong phú.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        ${storyverses.map(sv => html`
        <div class="p-6 bg-white dark:bg-[#161925]/60 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-4 text-left shadow-lg">
            <div class="space-y-1">
                <a href="/storyverses/${sv.id}">
                    <h3 class="text-2xl font-bold text-amber-400 hover:underline">${sv.title}</h3>
                </a>
                <span class="text-xs text-gray-500 dark:text-gray-500 block">Sáng lập bởi: @${sv.author}</span>
            </div>

            <p class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">${sv.description}</p>

            <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800/80 text-xs text-gray-600 dark:text-gray-400">
                <span class="font-medium"><i class="fa-solid fa-calendar mr-1.5"></i> ${new Date(sv.created_at).toLocaleDateString("vi-VN")}</span>
                <div class="flex space-x-4">
                    <span><i class="fa-solid fa-heart mr-1"></i> ${sv.likes_count || 0}</span>
                    <span><i class="fa-solid fa-comments mr-1"></i> ${sv.comments_count || 0}</span>
                </div>
            </div>
        </div>
        `)}
    </div>
  `;
}

// Individual Storyverse view with Characters & Books
export function renderStoryverseDetail(sv: db.Storyverse, characters: db.SharedCharacter[], user: db.User | null) {
  return html`
    <div class="max-w-4xl mx-auto space-y-8 text-left">
        <!-- Header -->
        <div class="p-8 bg-gradient-to-tr from-white dark:from-[#161925] via-[#10131f] to-amber-900/10 border border-gray-200 dark:border-gray-800 rounded-3xl relative flex flex-col md:flex-row gap-6">
            ${sv.thumbnail_url ? html`
            <div class="w-24 h-24 rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800 flex-shrink-0">
                <img src="${sv.thumbnail_url}" class="w-full h-full object-cover" />
            </div>
            ` : ""}
            <div class="flex-grow">
                <span class="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-md text-xs font-semibold"><i class="fa-solid fa-earth-asia mr-1"></i> Vũ trụ cốt truyện</span>
                <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mt-4 mb-2">${sv.title}</h1>
                <p class="text-sm text-gray-650 dark:text-gray-400 font-medium">Sáng tạo bởi: <span class="text-gray-805 dark:text-gray-200">@${sv.author}</span> &bull; ${new Date(sv.created_at).toLocaleDateString("vi-VN")}</p>
                <p class="text-gray-700 dark:text-gray-300 text-base mt-4 leading-relaxed">${sv.description}</p>

            </div>
            <div class="absolute top-8 right-8 flex flex-col space-y-2 items-end">
                <button onclick="toggleLike('storyverse', '${sv.id}', this)" class="px-4 py-2 bg-gray-200 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700/80 border border-gray-300 dark:border-gray-700/60 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all">
                    <i class="fa-regular fa-heart"></i>
                    <span>${sv.likes_count || 0} thích</span>
                </button>
                ${user && (sv.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner) ? html`
                <button onclick="openEditUniverseModal()" class="px-4 py-2 bg-gray-205 dark:bg-gray-800 border border-gray-300 dark:border-gray-750 hover:bg-gray-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all">
                    <i class="fa-solid fa-pen-to-square"></i>
                    <span>Sửa vũ trụ</span>
                </button>
                <button onclick="deleteUniverse('${sv.id}')" class="px-4 py-2 bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:text-black text-red-400 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all">
                    <i class="fa-solid fa-trash-can"></i>
                    <span>Xóa vũ trụ</span>
                </button>
                ` : ""}
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Books in Universe -->
            <div class="space-y-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2"><i class="fa-solid fa-book mr-2 text-amber-500"></i> Các bộ truyện liên quan</h2>
                ${sv.storybook_list && sv.storybook_list.length > 0 ? html`
                <div class="space-y-3">
                    ${sv.storybook_list.map(b => html`
                    <a href="/storybook/${b.id}" class="block p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-amber-500/40 rounded-xl hover:bg-gray-100 dark:bg-[#1a1e2e]/30 transition-all">
                        <h4 class="font-bold text-gray-800 dark:text-gray-200">${b.title}</h4>
                        <span class="text-xs text-gray-600 dark:text-gray-400 block mt-1">Tác giả: ${b.authors}</span>
                    </a>
                    `)}
                </div>
                ` : html`<p class="text-sm text-gray-500 dark:text-gray-500 italic">Chưa có truyện nào thuộc vũ trụ này.</p>`}
            </div>

            <!-- Shared Characters in Universe -->
            <div class="space-y-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2"><i class="fa-solid fa-users mr-2 text-amber-500"></i> Nhân vật dùng chung</h2>
                ${characters && characters.length > 0 ? html`
                <div class="space-y-3">
                    ${characters.map(c => {
                      const canEditChar = user && (c.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner);
                      return html`
                    <div class="p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 rounded-xl flex gap-4">
                        ${c.thumbnail_url ? html`<img src="${c.thumbnail_url}" class="w-12 h-12 object-cover rounded-xl shadow border border-gray-200 dark:border-gray-800 flex-shrink-0" />` : ""}
                        <div class="flex-grow text-left">
                            <div class="flex items-center justify-between">
                                <h4 class="font-bold text-amber-400">${c.name}</h4>
                                <div class="flex items-center space-x-2">
                                    ${canEditChar ? html`
                                    <button onclick="openEditCharModal('${c.id}', '${c.name}', \`${c.other_info.replace(/`/g, '\`').replace(/\$/g, '\$')}\`)" class="p-1 text-gray-500 hover:text-amber-500 transition-colors" title="Sửa nhân vật">
                                        <i class="fa-solid fa-user-pen"></i>
                                    </button>
                                    <button onclick="deleteCharacter('${c.id}')" class="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Xóa nhân vật">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                    ` : ""}
                                </div>
                            </div>
                            <span class="text-[10px] text-gray-500 dark:text-gray-500 block">Tạo bởi: @${c.author}</span>
                            <p class="text-xs text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">${c.other_info}</p>
                        </div>
                    </div>
                    `;})}
                </div>
                ` : html`<p class="text-sm text-gray-500 dark:text-gray-500 italic">Chưa có nhân vật nào trong vũ trụ này.</p>`}
            </div>
        </div>


    <!-- Edit Universe Modal -->
    <div id="editUniverseModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center hidden opacity-0 transition-opacity duration-300">
        <div class="bg-white dark:bg-[#161925] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md p-8 relative shadow-2xl transform scale-95 transition-transform duration-300 text-left max-h-[90vh] overflow-y-auto">
            <button onclick="closeEditUniverseModal()" class="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white">
                <i class="fa-solid fa-xmark text-xl"></i>
            </button>

            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Chỉnh sửa vũ trụ</h3>

            <form onsubmit="handleEditUniverseSubmit(event, '${sv.id}')" class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Tên vũ trụ</label>
                    <input type="text" id="editSvTitle" required value="${sv.title}" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Mô tả bối cảnh</label>
                    <textarea id="editSvDescription" required rows="4" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors">${sv.description}</textarea>
                </div>

                <!-- Thumbnail Upload -->
                <div class="border-t border-gray-200 dark:border-gray-800/80 pt-4 mt-2">
                    <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Upload ảnh bìa (Thumbnail)</label>
                    <input type="file" id="editSvFile" accept="image/*" class="w-full text-xs text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500/10 file:text-amber-400 hover:file:bg-amber-500/20">
                </div>

                <div id="editSvError" class="text-red-400 text-xs hidden"></div>

                <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10 mt-6">
                    Lưu thay đổi
                </button>
            </form>
        </div>
    </div>

    <!-- Edit Shared Character Modal -->
    <div id="editCharModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center hidden opacity-0 transition-opacity duration-300">
        <div class="bg-white dark:bg-[#161925] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md p-8 relative shadow-2xl transform scale-95 transition-transform duration-300 text-left max-h-[90vh] overflow-y-auto">
            <button onclick="closeEditCharModal()" class="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white">
                <i class="fa-solid fa-xmark text-xl"></i>
            </button>

            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Chỉnh sửa nhân vật</h3>

            <form onsubmit="handleEditCharSubmit(event)" class="space-y-4">
                <input type="hidden" id="editCharId">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Tên nhân vật</label>
                    <input type="text" id="editCharName" required class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Mô tả chi tiết</label>
                    <textarea id="editCharInfo" required rows="4" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"></textarea>
                </div>

                <!-- Thumbnail Upload -->
                <div class="border-t border-gray-200 dark:border-gray-800/80 pt-4 mt-2">
                    <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Upload ảnh chân dung (Thumbnail)</label>
                    <input type="file" id="editCharFile" accept="image/*" class="w-full text-xs text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500/10 file:text-amber-400 hover:file:bg-amber-500/20">
                </div>

                <div id="editCharError" class="text-red-400 text-xs hidden"></div>

                <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10 mt-6">
                    Lưu thay đổi
                </button>
            </form>
        </div>
    </div>

    <script>
        function openEditUniverseModal() {
            const modal = document.getElementById('editUniverseModal');
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modal.querySelector('div').classList.remove('scale-95');
            }, 10);
        }

        function closeEditUniverseModal() {
            const modal = document.getElementById('editUniverseModal');
            modal.classList.add('opacity-0');
            modal.querySelector('div').classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }

        async function handleEditUniverseSubmit(e, universeId) {
            e.preventDefault();
            const title = document.getElementById('editSvTitle').value.trim();
            const description = document.getElementById('editSvDescription').value.trim();
            const fileInput = document.getElementById('editSvFile');
            const errDiv = document.getElementById('editSvError');

            errDiv.classList.add('hidden');

            try {
                // Update metadata
                const res = await fetch(\`/api/storyverses/\${universeId}\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description })
                });
                const data = await res.json();
                if (!data.success) {
                    errDiv.innerText = data.error || 'Có lỗi xảy ra.';
                    errDiv.classList.remove('hidden');
                    return;
                }

                // Handle thumbnail upload if file exists
                if (fileInput.files.length > 0) {
                    const formData = new FormData();
                    formData.append('file', fileInput.files[0]);
                    formData.append('type', 'storyverse');
                    formData.append('id', universeId);

                    const uploadRes = await fetch('/api/upload-thumbnail', {
                        method: 'POST',
                        body: formData
                    });
                    const uploadData = await uploadRes.json();
                    if (!uploadData.success) {
                        errDiv.innerText = 'Cập nhật bối cảnh thành công nhưng upload ảnh thất bại: ' + uploadData.error;
                        errDiv.classList.remove('hidden');
                        return;
                    }
                }

                window.location.reload();
            } catch (err) {
                console.error(err);
            }
        }

        async function deleteUniverse(universeId) {
            if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn vũ trụ này? Các bộ truyện thuộc vũ trụ sẽ mất liên kết.')) return;
            try {
                const res = await fetch(\`/api/storyverses/\${universeId}\`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    window.location.href = '/storyverses';
                } else {
                    alert('Lỗi: ' + (data.error || 'Không thể xóa.'));
                }
            } catch (err) {
                console.error(err);
            }
        }

        // Characters Edit / Delete handling
        function openEditCharModal(charId, name, info) {
            document.getElementById('editCharId').value = charId;
            document.getElementById('editCharName').value = name;
            document.getElementById('editCharInfo').value = info;

            const modal = document.getElementById('editCharModal');
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modal.querySelector('div').classList.remove('scale-95');
            }, 10);
        }

        function closeEditCharModal() {
            const modal = document.getElementById('editCharModal');
            modal.classList.add('opacity-0');
            modal.querySelector('div').classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }

        async function handleEditCharSubmit(e) {
            e.preventDefault();
            const charId = document.getElementById('editCharId').value;
            const name = document.getElementById('editCharName').value.trim();
            const other_info = document.getElementById('editCharInfo').value.trim();
            const fileInput = document.getElementById('editCharFile');
            const errDiv = document.getElementById('editCharError');

            errDiv.classList.add('hidden');

            try {
                // Update character metadata using a safe POST API endpoint or inline updates
                const res = await fetch(\`/api/characters/\${charId}\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, other_info })
                });
                const data = await res.json();
                if (!data.success) {
                    errDiv.innerText = data.error || 'Có lỗi xảy ra.';
                    errDiv.classList.remove('hidden');
                    return;
                }

                // Handle thumbnail upload if file exists
                if (fileInput.files.length > 0) {
                    const formData = new FormData();
                    formData.append('file', fileInput.files[0]);
                    formData.append('type', 'character');
                    formData.append('id', charId);

                    const uploadRes = await fetch('/api/upload-thumbnail', {
                        method: 'POST',
                        body: formData
                    });
                    const uploadData = await uploadRes.json();
                    if (!uploadData.success) {
                        errDiv.innerText = 'Cập nhật nhân vật thành công nhưng upload ảnh thất bại: ' + uploadData.error;
                        errDiv.classList.remove('hidden');
                        return;
                    }
                }

                window.location.reload();
            } catch (err) {
                console.error(err);
            }
        }

        async function deleteCharacter(charId) {
            if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn nhân vật này?')) return;
            try {
                const res = await fetch(\`/api/characters/\${charId}\`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                } else {
                    alert('Lỗi: ' + (data.error || 'Không thể xóa.'));
                }
            } catch (err) {
                console.error(err);
            }
        }
    </script>

        <!-- Comments Area -->
        ${renderCommentsArea("storyverse", sv.id)}
    </div>
  `;
}
