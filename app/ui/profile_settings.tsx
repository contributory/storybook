/** @jsxImportSource npm:hono@4.5.11/jsx */
import { html } from "npm:hono/html";
import * as db from "../db.ts";
import { markdownToText } from "./markdown.ts";
import { renderPagination } from "./pagination.tsx";

export function renderProfilePage(
  profileUser: db.User,
  isOwnProfile: boolean,
  booksResult: db.PageResult<db.Storybook>,
  versesResult: db.PageResult<db.Storyverse>,
  charactersResult: db.PageResult<db.Character>,
  isFollowing: boolean,
  followers: string[],
  following: string[],
  currentUser: db.User | null
) {
  const books = booksResult.items;
  const verses = versesResult.items;
  const characters = charactersResult.items;
  return html`
    <div class="max-w-4xl mx-auto space-y-8 text-left">
        <!-- Profile Header Card -->
        <div class="p-8 bg-gradient-to-tr from-white dark:from-[#161925] via-gray-100 dark:via-slate-900 to-amber-950/10 border border-gray-200 dark:border-gray-800 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative shadow-xl">
            <div class="flex flex-col md:flex-row items-center gap-6">
                <!-- Avatar -->
                ${profileUser.avatar ? html`
                <img src="${profileUser.avatar}" alt="avatar" class="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-[#161925] shadow-xl">
                ` : html`
                <div class="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 border-4 border-white dark:border-[#161925] flex items-center justify-center text-black font-black text-4xl shadow-xl">
                    ${profileUser.display_name.charAt(0).toUpperCase()}
                </div>
                `}
                <div class="text-center md:text-left space-y-2">
                    <div class="flex items-center flex-wrap gap-2.5 justify-center md:justify-start">
                        <h1 class="text-3xl font-black text-gray-900 dark:text-white leading-tight">${profileUser.display_name}</h1>
                        ${profileUser.is_owner ? html`<span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px] font-bold">Owner</span>` : ""}
                        ${profileUser.is_admin ? html`<span class="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20 text-[10px] font-bold">Admin</span>` : ""}
                        ${profileUser.is_creator ? html`<span class="px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20 text-[10px] font-bold">Creator</span>` : ""}
                    </div>
                    <p class="text-sm text-gray-650 dark:text-gray-400 font-medium">@${profileUser.username}</p>
                    ${profileUser.des ? html`<p class="text-sm text-gray-600 dark:text-gray-400 max-w-md">${markdownToText(profileUser.des)}</p>` : ""}
                    <p class="text-xs text-gray-500 dark:text-gray-500"><i class="fa-solid fa-calendar mr-1">5</i> Tham gia ngày: ${new Date(profileUser.join_date).toLocaleDateString("vi-VN")}</p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                ${isOwnProfile ? html`
                <a href="/settings" class="px-5 py-2.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700/80 border border-gray-300 dark:border-gray-700/60 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5">
                    <i class="fa-solid fa-gear"></i>
                    <span>Cài đặt cá nhân</span>
                </a>
                ` : currentUser ? html`
                <button onclick="toggleFollow('${profileUser.username}', this)" class="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/10 transition-all flex items-center space-x-1.5">
                    <i class="fa-solid ${isFollowing ? "fa-user-minus" : "fa-user-plus"}"></i>
                    <span>${isFollowing ? "Bỏ theo dõi" : "Theo dõi"}</span>
                </button>
                ` : ""}
            </div>
        </div>

        <!-- Follower Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div class="p-4 bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl text-center shadow">
                <span class="text-2xl font-black text-amber-500 block">${followers.length}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Người theo dõi</span>
            </div>
            <div class="p-4 bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl text-center shadow">
                <span class="text-2xl font-black text-amber-500 block">${following.length}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Đang theo dõi</span>
            </div>
            <div class="p-4 bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl text-center shadow">
                <span class="text-2xl font-black text-amber-500 block">${booksResult.total}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Bộ truyện</span>
            </div>
            <div class="p-4 bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl text-center shadow">
                <span class="text-2xl font-black text-amber-500 block">${versesResult.total}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Vũ trụ</span>
            </div>
            <div class="p-4 bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl text-center shadow">
                <span class="text-2xl font-black text-amber-500 block">${charactersResult.total}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Nhân vật</span>
            </div>
        </div>

        <!-- Created Content Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Storybooks -->
            <div class="space-y-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2"><i class="fa-solid fa-book mr-2 text-amber-500"></i> Bộ truyện đã sáng tác</h2>
                ${books && books.length > 0 ? html`
                <div class="space-y-3">
                    ${books.map(b => html`
                    <a href="/storybook/${b.id}" class="block p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-amber-500/40 rounded-xl hover:bg-gray-100 dark:bg-[#1a1e2e]/30 transition-all">
                        <div class="flex items-center gap-3">
                            ${b.thumbnail_url ? html`<img src="${b.thumbnail_url}" class="w-10 h-14 object-cover rounded shadow" />` : ""}
                            <div>
                                <h4 class="font-bold text-gray-850 dark:text-gray-200">${b.title}</h4>
                                <span class="text-[10px] text-gray-500 dark:text-gray-400 uppercase block mt-0.5">${b.categories}</span>
                            </div>
                        </div>
                    </a>
                    `)}
                </div>
                ` : html`<p class="text-sm text-gray-500 dark:text-gray-500 italic">Chưa có truyện nào.</p>`}
                ${renderPagination(booksResult, `/profile/${profileUser.username}`, {}, "bp")}
            </div>

            <!-- Storyverses -->
            <div class="space-y-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2"><i class="fa-solid fa-earth-asia mr-2 text-amber-500"></i> Vũ trụ đã sáng tạo</h2>
                ${verses && verses.length > 0 ? html`
                <div class="space-y-3">
                    ${verses.map(sv => html`
                    <a href="/storyverses/${sv.id}" class="block p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-amber-500/40 rounded-xl hover:bg-gray-100 dark:bg-[#1a1e2e]/30 transition-all">
                        <div class="flex items-center gap-3">
                            ${sv.thumbnail_url ? html`<img src="${sv.thumbnail_url}" class="w-10 h-10 object-cover rounded shadow" />` : ""}
                            <div>
                                <h4 class="font-bold text-gray-850 dark:text-gray-200">${sv.title}</h4>
                                <span class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">${markdownToText(sv.description)}</span>
                            </div>
                        </div>
                    </a>
                    `)}
                </div>
                ` : html`<p class="text-sm text-gray-500 dark:text-gray-500 italic">Chưa có vũ trụ nào.</p>`}
                ${renderPagination(versesResult, `/profile/${profileUser.username}`, {}, "vp")}
            </div>
        </div>

        <!-- Characters -->
        <div class="space-y-4">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2"><i class="fa-solid fa-users mr-2 text-amber-500"></i> Nhân vật đã tạo <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">(${charactersResult.total})</span></h2>
            ${characters && characters.length > 0 ? html`
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${characters.map(c => html`
                <a href="/storyverses/${c.storyverse_id}" class="block p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-amber-500/40 rounded-xl hover:bg-gray-100 dark:bg-[#1a1e2e]/30 transition-all">
                    <div class="flex items-center gap-3">
                        ${c.thumbnail_url ? html`<img src="${c.thumbnail_url}" class="w-10 h-10 object-cover rounded-xl shadow" />` : ""}
                        <div>
                            <h4 class="font-bold text-gray-850 dark:text-gray-200">${c.name}</h4>
                            <span class="text-[10px] text-gray-500 dark:text-gray-400 uppercase block mt-0.5">${c.storyverse_id}</span>
                        </div>
                    </div>
                </a>
                `)}
            </div>
            ` : html`<p class="text-sm text-gray-500 dark:text-gray-500 italic">Chưa tạo nhân vật nào.</p>`}
            ${renderPagination(charactersResult, `/profile/${profileUser.username}`, {}, "cp")}
        </div>

        <!-- Followers & Following -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-3">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2"><i class="fa-solid fa-user-group mr-2 text-amber-500"></i> Người theo dõi <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">(${followers.length})</span></h2>
                ${followers && followers.length > 0 ? html`
                <div class="flex flex-wrap gap-2">
                    ${followers.map(f => html`
                    <a href="/profile/${f}" class="px-3 py-1.5 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 rounded-full text-xs font-semibold text-amber-500 hover:border-amber-500/40 hover:underline transition-colors">@${f}</a>
                    `)}
                </div>
                ` : html`<p class="text-sm text-gray-500 dark:text-gray-500 italic">Chưa có người theo dõi.</p>`}
            </div>
            <div class="space-y-3">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2"><i class="fa-solid fa-user-plus mr-2 text-amber-500"></i> Đang theo dõi <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">(${following.length})</span></h2>
                ${following && following.length > 0 ? html`
                <div class="flex flex-wrap gap-2">
                    ${following.map(f => html`
                    <a href="/profile/${f}" class="px-3 py-1.5 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 rounded-full text-xs font-semibold text-amber-500 hover:border-amber-500/40 hover:underline transition-colors">@${f}</a>
                    `)}
                </div>
                ` : html`<p class="text-sm text-gray-500 dark:text-gray-500 italic">Chưa theo dõi ai.</p>`}
            </div>
        </div>
    </div>

    <script>
        async function toggleFollow(targetUsername, btn) {
            try {
                const currentText = btn.querySelector('span').innerText;
                const action = currentText === 'Theo dõi' ? 'follow' : 'unfollow';

                const res = await fetch(\`/api/users/\${targetUsername}/follow\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action })
                });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                } else {
                    alert('Lỗi: ' + (data.error || 'Không thể thực hiện thao tác.'));
                }
            } catch (err) {
                console.error(err);
            }
        }
    </script>
  `;
}

import { t } from "../i18n.ts";

export function renderSettingsPage(user: db.User, currentLang: string = 'vi') {
  return html`
    <div class="max-w-xl mx-auto space-y-8 text-left">
        <div class="space-y-2">
            <h1 class="text-3xl font-black text-gray-900 dark:text-white"><i class="fa-solid fa-gear mr-2 text-amber-500"></i> ${t('settings.title', currentLang)}</h1>
            <p class="text-gray-600 dark:text-gray-400">${t('settings.description', currentLang)}</p>
        </div>

        <!-- Profile update section -->
        <div class="bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-lg space-y-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">${t('settings.account_info', currentLang)}</h3>

            <form onsubmit="handleSaveSettings(event)" class="space-y-5">
                <div>
                    <label class="block text-xs font-semibold text-gray-650 dark:text-gray-400 uppercase tracking-wider mb-1.5">${t('settings.display_name', currentLang)}</label>
                    <input type="text" id="settingsDisplayName" required value="${user.display_name}" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors">
                </div>

                <!-- Language Selection -->
                <div>
                    <label class="block text-xs font-semibold text-gray-650 dark:text-gray-400 uppercase tracking-wider mb-1.5">${t('settings.language', currentLang)}</label>
                    <select id="settingsLanguage" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors">
                        <option value="vi">${'🇻🇳 Tiếng Việt'}</option>
                        <option value="en">${'🇬🇧 English'}</option>
                    </select>
                    <span class="text-[10px] text-gray-500 dark:text-gray-500 mt-1 block">${t('settings.language_desc', currentLang)}</span>
                </div>

                <!-- Toggle Creator Mode -->
                <div class="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#0f111a] rounded-xl border border-gray-200 dark:border-gray-800/80">
                    <div class="space-y-0.5 pr-4">
                        <span class="text-sm font-bold text-gray-850 dark:text-gray-200">${t('settings.creator_mode', currentLang)}</span>
                        <p class="text-[11px] text-gray-500 dark:text-gray-450 leading-normal">${t('settings.creator_mode_desc', currentLang)}</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="settingsIsCreator" class="sr-only peer" ${user.is_creator ? "checked" : ""}>
                        <div class="w-11 h-6 bg-gray-350 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-650 dark:text-gray-400 uppercase tracking-wider mb-1.5">${t('settings.ai_author_name', currentLang)}</label>
                    <input type="text" id="settingsAiAuthorName" value="${user.ai_author_name || "AI"}" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="${t('settings.ai_author_name_desc', currentLang)}">
                    <span class="text-[10px] text-gray-500 dark:text-gray-500 mt-1 block">${t('settings.ai_author_name_desc', currentLang)}</span>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-650 dark:text-gray-400 uppercase tracking-wider mb-1.5">${t('settings.bio', currentLang)}</label>
                    <textarea id="settingsDes" rows="3" placeholder="${t('settings.bio_placeholder', currentLang)}" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors">${user.des || ""}</textarea>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-650 dark:text-gray-400 uppercase tracking-wider mb-1.5">${t('settings.avatar', currentLang)}</label>
                    <input type="text" id="settingsAvatar" value="${user.avatar || ""}" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="${t('settings.avatar_placeholder', currentLang)}">
                </div>

                <div id="settingsError" class="text-red-400 text-xs hidden"></div>
                <div id="settingsSuccess" class="text-green-400 text-xs hidden"></div>

                <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10">${t('settings.save', currentLang)}</button>
            </form>
        </div>

        <!-- API TOKEN management -->
        <div class="bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-lg space-y-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">${t('settings.security', currentLang)}</h3>
            <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">${t('settings.api_desc', currentLang)}</p>

            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">${t('settings.current_token', currentLang)}</label>
                    <div class="flex gap-2">
                        <input type="text" id="settingsApiToken" readonly value="${user.api_token || t('settings.no_token', currentLang)}" class="flex-grow bg-gray-100 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs font-mono text-amber-500/90 focus:outline-none">
                        ${user.api_token ? html`
                        <button onclick="copyApiToken()" class="px-4 py-2.5 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-750 hover:bg-gray-300 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors">${t('settings.copy_token', currentLang)}</button>
                        ` : ""}
                    </div>
                </div>

                <button onclick="generateNewApiToken()" class="w-full py-2.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700/80 border border-gray-300 dark:border-gray-700/60 rounded-xl text-xs font-bold transition-all text-center">
                    ${user.api_token ? t('settings.regenerate_token', currentLang) : t('settings.generate_token', currentLang)}
                </button>
            </div>
        </div>
    </div>

    <script>
        async function handleSaveSettings(e) {
            e.preventDefault();
            const displayName = document.getElementById('settingsDisplayName').value.trim();
            const isCreator = document.getElementById('settingsIsCreator').checked;
            const aiAuthorName = document.getElementById('settingsAiAuthorName').value.trim();
            const des = document.getElementById('settingsDes').value.trim();
            const avatar = document.getElementById('settingsAvatar').value.trim();
            const language = document.getElementById('settingsLanguage').value;
            const errDiv = document.getElementById('settingsError');
            const successDiv = document.getElementById('settingsSuccess');

            errDiv.classList.add('hidden');
            successDiv.classList.add('hidden');

            // Save language preference to localStorage
            localStorage.setItem('preferred_language', language);

            try {
                const res = await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ display_name: displayName, is_creator: isCreator, ai_author_name: aiAuthorName, des, avatar, language })
                });
                const data = await res.json();
                if (data.success) {
                    successDiv.innerText = '${t('settings.success', currentLang)}';
                    successDiv.classList.remove('hidden');
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    errDiv.innerText = data.error || '${t('settings.error', currentLang)}';
                    errDiv.classList.remove('hidden');
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function generateNewApiToken() {
            if (!confirm('${t('settings.confirm_revoke', currentLang)}')) return;
            try {
                const res = await fetch('/api/settings/token', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                } else {
                    alert('Lỗi: ' + (data.error || 'Thao tác thất bại.'));
                }
            } catch (err) {
                console.error(err);
            }
        }

        function copyApiToken() {
            const tokenInput = document.getElementById('settingsApiToken');
            tokenInput.select();
            document.execCommand('copy');
            alert('${t('settings.token_copied', currentLang)}');
        }

        // Load language preference from localStorage on page load
        document.addEventListener('DOMContentLoaded', function() {
            const savedLang = localStorage.getItem('preferred_language');
            if (savedLang && document.getElementById('settingsLanguage')) {
                document.getElementById('settingsLanguage').value = savedLang;
            }
        });
    </script>
  `;
}
