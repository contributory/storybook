/** @jsxImportSource hono/jsx */
import { html } from "hono/html";
import * as db from "../db.ts";

// Creator Dashboard View
export function renderCreatorPanel(
  books: db.Storybook[],
  universes: db.Storyverse[],
  characters: db.Character[],
  user: db.User,
  prefillBookId = ""
) {
  const username = user.username.toLowerCase();

  // Filter user's own items or collaborative ones
  const myBooks = books.filter(b => b.authors.toLowerCase().includes(username) || b.allow_other_author_edit);
  const myUniverses = universes.filter(u => u.author.toLowerCase() === username);
  const myCharacters = characters.filter(c => c.author.toLowerCase() === username);

  return html`
    <div class="max-w-5xl mx-auto space-y-8 text-left">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="space-y-1">
                <h1 class="text-3xl font-black text-gray-900 dark:text-white flex items-center">
                    <i class="fa-solid fa-feather-pointed mr-3 text-amber-500"></i> Quản Lý Sáng Tạo
                </h1>
                <p class="text-gray-600 dark:text-gray-400">Không gian làm việc riêng của bạn để quản lý các tác phẩm, vũ trụ, nhân vật và biên soạn ngữ cảnh AI.</p>
            </div>
            <div class="flex flex-wrap gap-2.5">
                <a href="/create/storybook" class="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-black font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/10 flex items-center space-x-1.5 transition-all">
                    <i class="fa-solid fa-book"></i>
                    <span>Tạo bộ truyện</span>
                </a>
                <a href="/create/storyverse" class="px-4 py-2.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700/80 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all">
                    <i class="fa-solid fa-earth-asia"></i>
                    <span>Tạo vũ trụ</span>
                </a>
                <a href="/create/character" class="px-4 py-2.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700/80 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all">
                    <i class="fa-solid fa-user-plus"></i>
                    <span>Tạo nhân vật</span>
                </a>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <!-- Navigation Sidebar tabs -->
            <div class="space-y-2 lg:col-span-1">
                <button onclick="switchCreatorTab('books')" id="btn-books" class="creator-tab-btn active w-full p-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-sm rounded-xl text-left flex items-center justify-between transition-all">
                    <span><i class="fa-solid fa-book-open mr-2.5"></i> Bộ truyện của tôi</span>
                    <span class="px-2 py-0.5 rounded bg-amber-500/20 text-[10px] text-amber-400 font-bold">${myBooks.length}</span>
                </button>
                <button onclick="switchCreatorTab('universes')" id="btn-universes" class="creator-tab-btn w-full p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-xl text-left flex items-center justify-between transition-all">
                    <span><i class="fa-solid fa-earth-asia mr-2.5"></i> Vũ trụ của tôi</span>
                    <span class="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-[10px] text-gray-500 dark:text-gray-400 font-bold">${myUniverses.length}</span>
                </button>
                <button onclick="switchCreatorTab('characters')" id="btn-characters" class="creator-tab-btn w-full p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-xl text-left flex items-center justify-between transition-all">
                    <span><i class="fa-solid fa-users mr-2.5"></i> Nhân vật đã tạo</span>
                    <span class="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-[10px] text-gray-500 dark:text-gray-400 font-bold">${myCharacters.length}</span>
                </button>
                <button onclick="switchCreatorTab('aiPromptExporter')" id="btn-aiPromptExporter" class="creator-tab-btn w-full p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 text-yellow-400 font-bold text-sm rounded-xl text-left flex items-center justify-between hover:border-amber-500/40 transition-all shadow-md">
                    <span><i class="fa-solid fa-robot mr-2.5"></i> AI Context Compiler 🌟</span>
                    <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
            </div>

            <!-- Panel Forms -->
            <div class="lg:col-span-3 bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 relative min-h-[450px]">

                <!-- Tab: My Books -->
                <div id="tabContent-books" class="creator-tab-content space-y-6">
                    <div class="border-b border-gray-200 dark:border-gray-800 pb-3 flex items-center justify-between">
                        <div>
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white">Bộ truyện của tôi</h3>
                            <p class="text-xs text-gray-600 dark:text-gray-400">Danh sách các truyện bạn đã viết hoặc có quyền đồng sáng tác.</p>
                        </div>
                    </div>

                    ${myBooks.length === 0 ? html`
                    <div class="p-12 text-center border border-dashed border-gray-200 dark:border-gray-850 rounded-2xl">
                        <i class="fa-solid fa-book-open-reader text-gray-600 text-4xl mb-4"></i>
                        <p class="text-gray-500">Bạn chưa sở hữu hoặc tham gia viết bộ truyện nào.</p>
                        <a href="/create/storybook" class="inline-block mt-4 px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl">Tạo truyện ngay</a>
                    </div>
                    ` : html`
                    <div class="space-y-4">
                        ${myBooks.map(b => html`
                        <div class="p-5 bg-white dark:bg-[#161925]/50 border border-gray-200 dark:border-gray-800/80 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-amber-500/20 transition-all">
                            <div class="flex items-center gap-4">
                                ${b.thumbnail_url ? html`
                                <img src="${b.thumbnail_url}" class="w-12 h-16 object-cover rounded-lg shadow border border-gray-100 dark:border-gray-850" />
                                ` : html`
                                <div class="w-12 h-16 rounded-lg bg-gradient-to-tr from-amber-500/10 to-yellow-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-lg font-bold">📖</div>
                                `}
                                <div class="text-left space-y-1">
                                    <h4 class="font-bold text-gray-900 dark:text-gray-200 text-base hover:text-amber-400 transition-colors">
                                        <a href="/storybook/${b.id}">${b.title}</a>
                                    </h4>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">Mã: <code class="text-amber-500/90 font-mono text-[11px]">${b.id}</code> &bull; Thể loại: ${b.categories}</p>
                                    <p class="text-[11px] text-gray-400 dark:text-gray-500">Chương: <span class="font-semibold text-gray-700 dark:text-gray-300">${b.chapters_count || 0}</span> &bull; Đồng sáng tác: ${b.allow_other_author_edit ? "Có" : "Không"}</p>
                                </div>
                            </div>
                            <div class="flex flex-wrap gap-2 w-full md:w-auto md:justify-end">
                                <a href="/create/storybook?id=${b.id}" class="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                    <span>Sửa & Chương</span>
                                </a>
                                <button onclick="deleteDashboardBook('${b.id}')" class="px-3 py-1.5 bg-red-500/10 hover:bg-red-550 text-red-400 hover:text-black text-xs font-bold rounded-lg transition-all flex items-center space-x-1">
                                    <i class="fa-solid fa-trash-can"></i>
                                    <span>Xóa</span>
                                </button>
                            </div>
                        </div>
                        `)}
                    </div>
                    `}
                </div>

                <!-- Tab: My Storyverses -->
                <div id="tabContent-universes" class="creator-tab-content space-y-6 hidden">
                    <div class="border-b border-gray-200 dark:border-gray-800 pb-3">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">Vũ trụ cốt truyện của tôi</h3>
                        <p class="text-xs text-gray-600 dark:text-gray-400">Các thế giới bối cảnh do chính bạn xây dựng để nạp nhân vật dùng chung.</p>
                    </div>

                    ${myUniverses.length === 0 ? html`
                    <div class="p-12 text-center border border-dashed border-gray-200 dark:border-gray-850 rounded-2xl">
                        <i class="fa-solid fa-earth-asia text-gray-600 text-4xl mb-4"></i>
                        <p class="text-gray-500">Bạn chưa tạo bối cảnh vũ trụ nào.</p>
                        <a href="/create/storyverse" class="inline-block mt-4 px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl">Khởi tạo thế giới mới</a>
                    </div>
                    ` : html`
                    <div class="space-y-4">
                        ${myUniverses.map(u => html`
                        <div class="p-5 bg-white dark:bg-[#161925]/50 border border-gray-200 dark:border-gray-800/80 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-amber-500/20 transition-all">
                            <div class="flex items-center gap-4 text-left">
                                ${u.thumbnail_url ? html`
                                <img src="${u.thumbnail_url}" class="w-12 h-12 object-cover rounded-xl shadow border border-gray-100 dark:border-gray-850" />
                                ` : html`
                                <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/10 to-yellow-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-lg font-bold">🌍</div>
                                `}
                                <div class="space-y-1">
                                    <h4 class="font-bold text-gray-900 dark:text-gray-200 text-base">
                                        <a href="/storyverses/${u.id}" class="hover:text-amber-400 transition-colors">${u.title}</a>
                                    </h4>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">${u.description}</p>
                                </div>
                            </div>
                            <div class="flex gap-2 w-full md:w-auto md:justify-end">
                                <a href="/create/storyverse?id=${u.id}" class="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                    <span>Sửa</span>
                                </a>
                                <button onclick="deleteDashboardStoryverse('${u.id}')" class="px-3 py-1.5 bg-red-500/10 hover:bg-red-550 text-red-400 hover:text-black text-xs font-bold rounded-lg transition-all flex items-center space-x-1">
                                    <i class="fa-solid fa-trash-can"></i>
                                    <span>Xóa</span>
                                </button>
                            </div>
                        </div>
                        `)}
                    </div>
                    `}
                </div>

                <!-- Tab: My Characters -->
                <div id="tabContent-characters" class="creator-tab-content space-y-6 hidden">
                    <div class="border-b border-gray-200 dark:border-gray-800 pb-3">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">Nhân vật đã tạo</h3>
                        <p class="text-xs text-gray-600 dark:text-gray-400">Các hồ sơ nhân vật dùng chung bạn đã đóng góp vào các bối cảnh vũ trụ.</p>
                    </div>

                    ${myCharacters.length === 0 ? html`
                    <div class="p-12 text-center border border-dashed border-gray-200 dark:border-gray-850 rounded-2xl">
                        <i class="fa-solid fa-user-plus text-gray-600 text-4xl mb-4"></i>
                        <p class="text-gray-500">Bạn chưa tạo hồ sơ nhân vật nào.</p>
                        <a href="/create/character" class="inline-block mt-4 px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl">Tạo nhân vật ngay</a>
                    </div>
                    ` : html`
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        ${myCharacters.map(c => html`
                        <div class="p-4 bg-white dark:bg-[#161925]/50 border border-gray-200 dark:border-gray-800/80 rounded-2xl flex justify-between items-center gap-3 hover:border-amber-500/20 transition-all text-left">
                            <div class="flex items-center gap-3">
                                ${c.thumbnail_url ? html`
                                <img src="${c.thumbnail_url}" class="w-10 h-10 object-cover rounded-full shadow" />
                                ` : html`
                                <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500/10 to-yellow-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold">👤</div>
                                `}
                                <div>
                                    <h4 class="font-bold text-gray-900 dark:text-gray-250 text-sm">${c.name}</h4>
                                    <span class="text-[10px] text-gray-500 dark:text-gray-400 uppercase block font-semibold">Vũ trụ: ${c.storyverse_id}</span>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <a href="/create/character?id=${c.id}" class="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-450 rounded-lg hover:text-amber-500 transition-colors" title="Sửa">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                </a>
                                <button onclick="deleteDashboardCharacter('${c.id}')" class="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-black transition-all" title="Xóa">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                        `)}
                    </div>
                    `}
                </div>

                <!-- Tab: AI Prompt Context Exporter -->
                <div id="tabContent-aiPromptExporter" class="creator-tab-content space-y-6 hidden">
                    <div class="border-b border-gray-200 dark:border-gray-800 pb-3">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                            <i class="fa-solid fa-wand-magic-sparkles mr-2 text-yellow-400 animate-pulse"></i> AI Context Compiler & Prompt Exporter
                        </h3>
                        <p class="text-xs text-gray-600 dark:text-gray-400">Chọn một bộ truyện và xem tóm tắt toàn bộ chương truyện dưới dạng prompt nạp trực tiếp vào AI (Claude / ChatGPT) để nó viết chương mới cực kỳ mạch lạc.</p>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Chọn bộ truyện cần trích xuất</label>
                            <select id="exportBookId" onchange="generateAiPrompt()" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-amber-500 transition-colors">
                                <option value="">-- Chọn một truyện --</option>
                                ${myBooks.map(b => html`<option value="${b.id}" ${prefillBookId === b.id ? "selected" : ""}>${b.title}</option>`)}
                            </select>
                        </div>

                        <div id="exportLoader" class="hidden text-sm text-gray-600 dark:text-gray-400 italic py-2 text-left">Đang tải và sinh ngữ cảnh...</div>

                        <div id="exportResultContainer" class="hidden space-y-4 text-left">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Ngữ cảnh prompt sinh ra:</span>
                                <button onclick="copyExportPrompt()" class="px-3 py-1 bg-amber-500 text-black font-semibold text-xs rounded hover:bg-amber-600 transition-colors flex items-center space-x-1">
                                    <i class="fa-solid fa-copy"></i>
                                    <span>Sao chép Prompt</span>
                                </button>
                            </div>
                            <textarea id="aiExportPromptText" readonly rows="12" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-xs font-mono text-amber-500/90 focus:outline-none focus:border-amber-500 leading-relaxed"></textarea>
                            <span class="text-[10px] text-gray-500 dark:text-gray-500 leading-relaxed block text-left">
                                * Lời khuyên: Sao chép prompt trên và dán trực tiếp vào Claude 3.5 Sonnet cùng với hướng dẫn "Hãy viết chương tiếp theo dựa trên bối cảnh này".
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
                b.className = 'creator-tab-btn w-full p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-xl text-left flex items-center justify-between transition-all';
            });

            // Active clicked
            document.getElementById('tabContent-' + tabName).classList.remove('hidden');
            const btn = document.getElementById('btn-' + tabName);
            if (tabName === 'aiPromptExporter') {
                btn.className = 'creator-tab-btn w-full p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 text-yellow-400 font-bold text-sm rounded-xl text-left flex items-center justify-between transition-all shadow-md';
            } else {
                btn.className = 'creator-tab-btn w-full p-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-sm rounded-xl text-left flex items-center justify-between transition-all';
            }

            if (tabName === 'aiPromptExporter') {
                generateAiPrompt();
            }
        }

        // Check prefill tab
        const urlParams = new URLSearchParams(window.location.search);
        const prefillBookId = urlParams.get('book_id');
        if (prefillBookId) {
            switchCreatorTab('aiPromptExporter');
        }

        async function deleteDashboardBook(id) {
            if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn bộ truyện này và toàn bộ chương liên quan?')) return;
            try {
                const res = await fetch(\`/api/storybooks/\${id}\`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                } else {
                    alert('Lỗi: ' + (data.error || 'Thất bại.'));
                }
            } catch(e) {
                console.error(e);
            }
        }

        async function deleteDashboardStoryverse(id) {
            if (!confirm('Bạn có chắc chắn muốn xóa vũ trụ này cùng tất cả các nhân vật thuộc về nó?')) return;
            try {
                const res = await fetch(\`/api/storyverses/\${id}\`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                } else {
                    alert('Lỗi: ' + (data.error || 'Thất bại.'));
                }
            } catch(e) {
                console.error(e);
            }
        }

        async function deleteDashboardCharacter(id) {
            if (!confirm('Bạn có chắc chắn muốn xóa nhân vật này?')) return;
            try {
                const res = await fetch(\`/api/characters/\${id}\`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                } else {
                    alert('Lỗi: ' + (data.error || 'Thất bại.'));
                }
            } catch(e) {
                console.error(e);
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

LỊCH SỬ CỐT TRUYỆN QUA TÓM TẮT CÁC CHƯƠNG ĐÃ QUA:\\n\`;

                    if (summaries.length === 0) {
                        prompt += "(Chưa có chương nào được viết. Bạn đang sáng tác chương đầu tiên!)\\n";
                    } else {
                        summaries.forEach(s => {
                            prompt += \`- Chương \${s.chapter_number} [\${s.title}]: \${s.summary}\\n\`;
                        });
                    }

                    prompt += \`\\nNHIỆM VỤ CỦA BẠN:
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
