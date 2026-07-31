/** @jsxImportSource npm:hono@4.5.11/jsx */
import { html } from "npm:hono/html";
import * as db from "../db.ts";

// Creator Dashboard View
export function renderCreatorPanel(books: db.Storybook[], universes: db.Storyverse[], prefillBookId = "") {
  return html`
    <div class="max-w-5xl mx-auto space-y-8 text-left">
        <div class="space-y-2">
            <h1 class="text-3xl font-black text-white"><i class="fa-solid fa-feather-pointed mr-2 text-amber-500"></i> Nhà Sáng Tạo</h1>
            <p class="text-gray-400">Tự do xây dựng tác phẩm, tóm tắt cốt truyện và xuất khẩu dữ liệu phục vụ sáng tác cùng AI.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Navigation Sidebar tabs -->
            <div class="space-y-3 lg:col-span-1">
                <button onclick="switchCreatorTab('newBook')" id="btn-newBook" class="creator-tab-btn w-full p-4 bg-[#161925] border border-amber-500 text-amber-400 font-bold text-sm rounded-xl text-left flex items-center justify-between transition-all">
                    <span><i class="fa-solid fa-book mr-2"></i> Tạo bộ truyện mới</span>
                    <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
                <button onclick="switchCreatorTab('newChapter')" id="btn-newChapter" class="creator-tab-btn w-full p-4 bg-[#161925]/40 border border-gray-800 hover:border-gray-700 text-gray-300 font-semibold text-sm rounded-xl text-left flex items-center justify-between transition-all">
                    <span><i class="fa-solid fa-file-pen mr-2"></i> Thêm/Sửa chương truyện</span>
                    <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
                <button onclick="switchCreatorTab('newUniverse')" id="btn-newUniverse" class="creator-tab-btn w-full p-4 bg-[#161925]/40 border border-gray-800 hover:border-gray-700 text-gray-300 font-semibold text-sm rounded-xl text-left flex items-center justify-between transition-all">
                    <span><i class="fa-solid fa-earth-asia mr-2"></i> Tạo vũ trụ cốt truyện</span>
                    <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
                <button onclick="switchCreatorTab('newCharacter')" id="btn-newCharacter" class="creator-tab-btn w-full p-4 bg-[#161925]/40 border border-gray-800 hover:border-gray-700 text-gray-300 font-semibold text-sm rounded-xl text-left flex items-center justify-between transition-all">
                    <span><i class="fa-solid fa-user-plus mr-2"></i> Tạo nhân vật dùng chung</span>
                    <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
                <button onclick="switchCreatorTab('aiPromptExporter')" id="btn-aiPromptExporter" class="creator-tab-btn w-full p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 text-yellow-400 font-bold text-sm rounded-xl text-left flex items-center justify-between hover:border-amber-500/40 transition-all shadow-md">
                    <span><i class="fa-solid fa-robot mr-2"></i> AI Context Compiler 🌟</span>
                    <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
            </div>

            <!-- Panel Forms -->
            <div class="lg:col-span-2 bg-[#161925]/30 border border-gray-800 rounded-2xl p-6 sm:p-8 relative min-h-[450px]">

                <!-- Tab: Create Storybook -->
                <div id="tabContent-newBook" class="creator-tab-content space-y-6">
                    <div class="border-b border-gray-800 pb-3">
                        <h3 class="text-xl font-bold text-white">Tạo Bộ Truyện Mới</h3>
                        <p class="text-xs text-gray-400">Khai sinh bộ truyện mới của riêng bạn hoặc thuộc về một Vũ trụ dùng chung.</p>
                    </div>
                    <form onsubmit="handleCreateBook(event)" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">ID bộ truyện (Không dấu/khoảng cách)</label>
                                <input type="text" id="bookId" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="tay-du-ky-ngoai-truyen">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tiêu đề bộ truyện</label>
                                <input type="text" id="bookTitle" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Tây Du Ký: Ngoại Truyện">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mô tả cốt truyện</label>
                            <textarea id="bookDescription" required rows="3" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Tóm lược nội dung cốt truyện chính, định hướng..."></textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Thể loại (Ngăn cách bởi dấu phẩy)</label>
                                <input type="text" id="bookCategories" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Huyền Huyễn, Tiên Hiệp, Phiêu Lưu">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Liên kết Vũ trụ (Storyverse)</label>
                                <select id="bookStoryverseId" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-gray-300 focus:outline-none focus:border-amber-500 transition-colors">
                                    <option value="">-- Độc lập --</option>
                                    ${universes.map(u => html`<option value="${u.id}">${u.title}</option>`)}
                                </select>
                            </div>
                        </div>
                        <div class="flex items-center space-x-3 pt-2">
                            <input type="checkbox" id="bookAllowEdit" class="w-4 h-4 rounded border-gray-800 text-amber-500 focus:ring-amber-500 focus:ring-opacity-20 bg-[#0f111a]">
                            <label for="bookAllowEdit" class="text-xs font-semibold text-gray-300 uppercase tracking-wide">Cho phép những người dùng khác cùng viết truyện này (Đồng sáng tác)</label>
                        </div>
                        <div id="newBookError" class="text-red-400 text-xs hidden"></div>
                        <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10">Tạo truyện mới</button>
                    </form>
                </div>

                <!-- Tab: Add/Edit Chapter -->
                <div id="tabContent-newChapter" class="creator-tab-content space-y-6 hidden">
                    <div class="border-b border-gray-800 pb-3">
                        <h3 class="text-xl font-bold text-white">Thêm hoặc Cập nhật Chương truyện</h3>
                        <p class="text-xs text-gray-400">Viết chương mới hoặc hiệu chỉnh chương cũ. Nếu đã tồn tại chương số tương tự, hệ thống sẽ tự động cập nhật.</p>
                    </div>
                    <form onsubmit="handleCreateChapter(event)" class="space-y-4">
                        <div class="grid grid-cols-3 gap-4">
                            <div class="col-span-2">
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Chọn bộ truyện</label>
                                <select id="chapterBookId" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-gray-300 focus:outline-none focus:border-amber-500 transition-colors">
                                    ${books.map(b => html`<option value="${b.id}" ${prefillBookId === b.id ? "selected" : ""}>${b.title}</option>`)}
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Chương số</label>
                                <input type="number" id="chapterNumber" required min="1" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="1">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tiêu đề chương</label>
                            <input type="text" id="chapterTitle" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Đại náo thiên cung">
                        </div>
                        <div>
                            <div class="flex items-center justify-between mb-1.5">
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Tóm tắt chương truyện (Tối quan trọng cho AI)</label>
                                <span class="text-[10px] text-amber-500 font-medium">Giúp AI ghi nhớ cốt truyện nhanh mà không tốn token</span>
                            </div>
                            <textarea id="chapterSummary" required rows="2" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Ví dụ: Tôn Ngộ Không náo loạn điện Ngọc Đế, ăn trộm linh đơn của Thái Thượng Lão Quân, trốn về Hoa Quả Sơn..."></textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Nội dung chương</label>
                            <textarea id="chapterContent" required rows="8" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl p-3 text-white font-serif focus:outline-none focus:border-amber-500 transition-colors" placeholder="Nội dung chương truyện chính..."></textarea>
                        </div>
                        <div id="newChapterError" class="text-red-400 text-xs hidden"></div>
                        <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10">Lưu chương truyện</button>
                    </form>
                </div>

                <!-- Tab: Create Storyverse -->
                <div id="tabContent-newUniverse" class="creator-tab-content space-y-6 hidden">
                    <div class="border-b border-gray-800 pb-3">
                        <h3 class="text-xl font-bold text-white">Tạo Vũ Trụ Cốt Truyện</h3>
                        <p class="text-xs text-gray-400">Vũ trụ đóng vai trò làm không gian chung kết nối nhiều tác phẩm độc lập hoặc chia sẻ các nhân vật.</p>
                    </div>
                    <form onsubmit="handleCreateUniverse(event)" class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">ID vũ trụ (không dấu, viết liền)</label>
                            <input type="text" id="universeId" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="tay-du-saga">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tên vũ trụ</label>
                            <input type="text" id="universeTitle" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Tây Du Saga">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mô tả bối cảnh và quy luật thế giới</label>
                            <textarea id="universeDescription" required rows="4" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Mô tả ranh giới thế giới, pháp lực, chủng tộc, quy luật siêu nhiên giúp định hình cốt truyện..."></textarea>
                        </div>
                        <div id="newUniverseError" class="text-red-400 text-xs hidden"></div>
                        <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10">Tạo vũ trụ cốt truyện</button>
                    </form>
                </div>

                <!-- Tab: Create Character -->
                <div id="tabContent-newCharacter" class="creator-tab-content space-y-6 hidden">
                    <div class="border-b border-gray-800 pb-3">
                        <h3 class="text-xl font-bold text-white">Tạo Nhân Vật Dùng Chung</h3>
                        <p class="text-xs text-gray-400">Các nhân vật được tạo trong Vũ trụ có thể được sử dụng bởi bất kỳ tác phẩm nào cùng thuộc vũ trụ đó.</p>
                    </div>
                    <form onsubmit="handleCreateCharacter(event)" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Chọn Vũ trụ (Storyverse)</label>
                                <select id="charStoryverseId" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-gray-300 focus:outline-none focus:border-amber-500 transition-colors">
                                    ${universes.map(u => html`<option value="${u.id}">${u.title}</option>`)}
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">ID nhân vật (không dấu)</label>
                                <input type="text" id="charId" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="ton-ngo-khong">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tên nhân vật</label>
                            <input type="text" id="charName" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Tôn Ngộ Không">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mô tả ngoại hình, tính cách, kỹ năng, pháp bảo (Định dạng tự do)</label>
                            <textarea id="charInfo" required rows="4" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Mô tả kỹ năng, ngoại hình, điểm yếu, bối cảnh nhân vật để AI đọc hiểu..."></textarea>
                        </div>
                        <div id="newCharError" class="text-red-400 text-xs hidden"></div>
                        <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10">Tạo nhân vật dùng chung</button>
                    </form>
                </div>

                <!-- Tab: AI Prompt Context Exporter -->
                <div id="tabContent-aiPromptExporter" class="creator-tab-content space-y-6 hidden">
                    <div class="border-b border-gray-800 pb-3">
                        <h3 class="text-xl font-bold text-white flex items-center">
                            <i class="fa-solid fa-wand-magic-sparkles mr-2 text-yellow-400 animate-pulse"></i> AI Context Compiler & Prompt Exporter
                        </h3>
                        <p class="text-xs text-gray-400">Chọn một bộ truyện và xem tóm tắt toàn bộ chương truyện dưới dạng prompt nạp trực tiếp vào AI (Claude / ChatGPT) để nó viết chương mới cực kỳ mạch lạc.</p>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Chọn bộ truyện cần trích xuất</label>
                            <select id="exportBookId" onchange="generateAiPrompt()" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-gray-300 focus:outline-none focus:border-amber-500 transition-colors">
                                <option value="">-- Chọn một truyện --</option>
                                ${books.map(b => html`<option value="${b.id}">${b.title}</option>`)}
                            </select>
                        </div>

                        <div id="exportLoader" class="hidden text-sm text-gray-400 italic py-2">Đang tải và sinh ngữ cảnh...</div>

                        <div id="exportResultContainer" class="hidden space-y-4 text-left">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Ngữ cảnh prompt sinh ra:</span>
                                <button onclick="copyExportPrompt()" class="px-3 py-1 bg-amber-500 text-black font-semibold text-xs rounded hover:bg-amber-600 transition-colors flex items-center space-x-1">
                                    <i class="fa-solid fa-copy"></i>
                                    <span>Sao chép Prompt</span>
                                </button>
                            </div>
                            <textarea id="aiExportPromptText" readonly rows="12" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl p-4 text-xs font-mono text-amber-500/90 focus:outline-none focus:border-amber-500 leading-relaxed"></textarea>
                            <span class="text-[10px] text-gray-500 leading-relaxed block">
                                * Lời khuyên: Sao chép prompt trên và dán trực tiếp vào Claude 3.5 Sonnet cùng với hướng dẫn "Hãy viết chương tiếp theo [Chương số] với tựa đề [Tựa đề] dựa trên bối cảnh này".
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- Client Script for Tab handling and Submissions -->
    <script>
        // Tab routing
        function switchCreatorTab(tabName) {
            // Hide all contents
            document.querySelectorAll('.creator-tab-content').forEach(c => c.classList.add('hidden'));
            // Remove active style from all buttons
            document.querySelectorAll('.creator-tab-btn').forEach(b => {
                b.className = 'creator-tab-btn w-full p-4 bg-[#161925]/40 border border-gray-800 hover:border-gray-700 text-gray-300 font-semibold text-sm rounded-xl text-left flex items-center justify-between transition-all';
            });

            // Active clicked
            document.getElementById('tabContent-' + tabName).classList.remove('hidden');
            const btn = document.getElementById('btn-' + tabName);
            if (tabName === 'aiPromptExporter') {
                btn.className = 'creator-tab-btn w-full p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 text-yellow-400 font-bold text-sm rounded-xl text-left flex items-center justify-between transition-all shadow-md';
            } else {
                btn.className = 'creator-tab-btn w-full p-4 bg-[#161925] border border-amber-500 text-amber-400 font-bold text-sm rounded-xl text-left flex items-center justify-between transition-all';
            }

            if (tabName === 'aiPromptExporter') {
                generateAiPrompt();
            }
        }

        // Check prefill tab
        const urlParams = new URLSearchParams(window.location.search);
        const prefillBookId = urlParams.get('book_id');
        if (prefillBookId) {
            switchCreatorTab('newChapter');
        }

        // Submissions
        async function handleCreateBook(e) {
            e.preventDefault();
            const id = document.getElementById('bookId').value.trim();
            const title = document.getElementById('bookTitle').value.trim();
            const description = document.getElementById('bookDescription').value.trim();
            const categories = document.getElementById('bookCategories').value.trim();
            const storyverse_id = document.getElementById('bookStoryverseId').value;
            const allow_other_author_edit = document.getElementById('bookAllowEdit').checked;
            const errDiv = document.getElementById('newBookError');

            errDiv.classList.add('hidden');

            try {
                const res = await fetch('/api/storybooks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, title, description, categories, storyverse_id, allow_other_author_edit })
                });
                const data = await res.json();
                if (data.success) {
                    window.location.href = '/storybook/' + data.storybook.id;
                } else {
                    errDiv.innerText = data.error || 'Thất bại.';
                    errDiv.classList.remove('hidden');
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function handleCreateChapter(e) {
            e.preventDefault();
            const bookId = document.getElementById('chapterBookId').value;
            const chapter_number = document.getElementById('chapterNumber').value;
            const title = document.getElementById('chapterTitle').value.trim();
            const summary = document.getElementById('chapterSummary').value.trim();
            const content = document.getElementById('chapterContent').value.trim();
            const errDiv = document.getElementById('newChapterError');

            errDiv.classList.add('hidden');

            try {
                const res = await fetch(\`/api/storybooks/\${bookId}/chapters\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chapter_number, title, summary, content })
                });
                const data = await res.json();
                if (data.success) {
                    window.location.href = \`/storybook/\${bookId}/chapter/\${chapter_number}\`;
                } else {
                    errDiv.innerText = data.error || 'Thất bại.';
                    errDiv.classList.remove('hidden');
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function handleCreateUniverse(e) {
            e.preventDefault();
            const id = document.getElementById('universeId').value.trim();
            const title = document.getElementById('universeTitle').value.trim();
            const description = document.getElementById('universeDescription').value.trim();
            const errDiv = document.getElementById('newUniverseError');

            errDiv.classList.add('hidden');

            try {
                const res = await fetch('/api/storyverses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, title, description })
                });
                const data = await res.json();
                if (data.success) {
                    window.location.href = '/storyverses/' + data.storyverse.id;
                } else {
                    errDiv.innerText = data.error || 'Thất bại.';
                    errDiv.classList.remove('hidden');
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function handleCreateCharacter(e) {
            e.preventDefault();
            const id = document.getElementById('charId').value.trim();
            const name = document.getElementById('charName').value.trim();
            const other_info = document.getElementById('charInfo').value.trim();
            const storyverse_id = document.getElementById('charStoryverseId').value;
            const errDiv = document.getElementById('newCharError');

            errDiv.classList.add('hidden');

            try {
                const res = await fetch('/api/characters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, name, other_info, storyverse_id })
                });
                const data = await res.json();
                if (data.success) {
                    window.location.href = '/storyverses/' + storyverse_id;
                } else {
                    errDiv.innerText = data.error || 'Thất bại.';
                    errDiv.classList.remove('hidden');
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function generateAiPrompt() {
            const bookId = document.getElementById('exportBookId').value;
            const loader = document.getElementById('exportLoader');
            const resultBox = document.getElementById('exportResultContainer');
            const promptArea = document.getElementById('aiExportPromptText');

            if (!bookId) {
                resultBox.classList.add('hidden');
                return;
            }

            loader.classList.remove('hidden');
            resultBox.classList.add('hidden');

            try {
                // Call MCP custom JSON-RPC to fetch summaries
                const mcpRes = await fetch('/api/mcp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'tools/call',
                        params: {
                            name: 'get_storybook_chapters_summaries',
                            arguments: { storybook_id: bookId }
                        },
                        id: 1
                    })
                });

                // Get book details
                const bookRes = await fetch(\`/api/storybooks/\${bookId}\`);
                const bookData = await bookRes.json();

                const mcpData = await mcpRes.json();
                const textResult = JSON.parse(mcpData.result.content[0].text);

                if (textResult.success && bookData.success) {
                    const book = bookData.storybook;
                    const summaries = textResult.chapters_summaries;

                    let prompt = \`ROLE: Bạn là một nhà văn mạng chuyên nghiệp, xuất sắc nhất trong thể loại tiểu thuyết viễn tưởng/kiếm hiệp.
BỐI CẢNH TRUYỆN:
- Tựa truyện: \${book.title}
- Thể loại: \${book.categories}
- Mô tả chung: \${book.description}
- Các tác giả tham gia: \${book.authors}

LỊCH SỬ CỐT TRUYỆN QUA TÓM TẮT CÁC CHƯƠNG ĐÃ QUA:\n\`;

                    if (summaries.length === 0) {
                        prompt += "(Chưa có chương nào được viết. Bạn đang sáng tác chương đầu tiên!)\\n";
                    } else {
                        summaries.forEach(s => {
                            prompt += \`- Chương \${s.chapter_number} [\${s.title}]: \${s.summary}\\n\`;
                        });
                    }

                    prompt += \`\nNHIỆM VỤ CỦA BẠN:
Dựa trên bối cảnh và tóm tắt lịch sử cốt truyện ở trên, hãy tiếp thu logic các chương trước và viết tiếp CHƯƠNG KẾ TIẾP thật xuất sắc.
Hãy duy trì tính mạch lạc của nhân vật, giọng văn truyền cảm và tốc độ hợp lý.
YÊU CẦU: Xuất ra định dạng markdown, ghi rõ số chương, tựa đề chương, kèm theo một đoạn tóm tắt chương ngắn gọn (summary) ở cuối cùng để tôi nạp lại vào hệ thống.\`;

                    promptArea.value = prompt;
                    resultBox.classList.remove('hidden');
                }
            } catch (err) {
                console.error(err);
            } finally {
                loader.classList.add('hidden');
            }
        }

        function copyExportPrompt() {
            const promptArea = document.getElementById('aiExportPromptText');
            promptArea.select();
            document.execCommand('copy');
            alert('Đã sao chép prompt sinh ngữ cảnh thành công vào Clipboard!');
        }
    </script>
  `;
}
