"use client";

import { useEffect } from "react";
import type { Character, Storybook, Storyverse, User } from "@/lib/db";

// Tab switching logic (identical DOM behavior to the previous inline script)
function switchCreatorTab(tabName: string) {
  // Hide all contents
  document.querySelectorAll(".creator-tab-content").forEach((c) => c.classList.add("hidden"));
  // Remove active style from all buttons
  document.querySelectorAll(".creator-tab-btn").forEach((b) => {
    (b as HTMLElement).className =
      "creator-tab-btn w-full p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-xl text-left flex items-center justify-between transition-all";
  });

  // Activate clicked
  document.getElementById("tabContent-" + tabName)?.classList.remove("hidden");
  const btn = document.getElementById("btn-" + tabName);
  if (btn) {
    if (tabName === "aiPromptExporter") {
      btn.className =
        "creator-tab-btn w-full p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 text-yellow-400 font-bold text-sm rounded-xl text-left flex items-center justify-between transition-all shadow-md";
    } else {
      btn.className =
        "creator-tab-btn w-full p-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-sm rounded-xl text-left flex items-center justify-between transition-all";
    }
  }

  if (tabName === "aiPromptExporter") {
    generateAiPrompt();
  }
}

async function deleteDashboardBook(id: string) {
  if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn bộ truyện này và toàn bộ chương liên quan?")) return;
  try {
    const res = await fetch(`/api/storybooks/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      window.location.reload();
    } else {
      alert("Lỗi: " + (data.error || "Thất bại."));
    }
  } catch (e) {
    console.error(e);
  }
}

async function deleteDashboardStoryverse(id: string) {
  if (!confirm("Bạn có chắc chắn muốn xóa vũ trụ này cùng tất cả các nhân vật thuộc về nó?")) return;
  try {
    const res = await fetch(`/api/storyverses/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      window.location.reload();
    } else {
      alert("Lỗi: " + (data.error || "Thất bại."));
    }
  } catch (e) {
    console.error(e);
  }
}

async function deleteDashboardCharacter(id: string) {
  if (!confirm("Bạn có chắc chắn muốn xóa nhân vật này?")) return;
  try {
    const res = await fetch(`/api/characters/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      window.location.reload();
    } else {
      alert("Lỗi: " + (data.error || "Thất bại."));
    }
  } catch (e) {
    console.error(e);
  }
}

async function generateAiPrompt() {
  const bookId = (document.getElementById("exportBookId") as HTMLSelectElement | null)?.value;
  const loader = document.getElementById("exportLoader");
  const resultBox = document.getElementById("exportResultContainer");
  const promptArea = document.getElementById("aiExportPromptText") as HTMLTextAreaElement | null;

  if (!bookId) {
    resultBox?.classList.add("hidden");
    return;
  }

  loader?.classList.remove("hidden");
  resultBox?.classList.add("hidden");

  try {
    // Call MCP JSON-RPC (session-cookie authenticated alias) to fetch summaries
    const mcpRes = await fetch("/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "get_storybook_chapters_summaries",
          arguments: { storybook_id: bookId },
        },
        id: 1,
      }),
    });

    // Get book details
    const bookRes = await fetch(`/api/storybooks/${bookId}`);
    const bookData = await bookRes.json();

    const mcpData = await mcpRes.json();
    const textResult = JSON.parse(mcpData.result.content[0].text);

    if (textResult.success && bookData.success && promptArea) {
      const book = bookData.storybook;
      const summaries = textResult.chapters_summaries;

      let prompt = `ROLE: Bạn là một nhà văn mạng chuyên nghiệp, xuất sắc nhất trong thể loại tiểu thuyết viễn tưởng/kiếm hiệp.
BỐI CẢNH TRUYỆN:
- Tựa truyện: ${book.title}
- Thể loại: ${book.categories}
- Mô tả chung: ${book.description}
- Các tác giả tham gia: ${book.authors}

LỊCH SỬ CỐT TRUYỆN QUA TÓM TẮT CÁC CHƯƠNG ĐÃ QUA:\n`;

      if (summaries.length === 0) {
        prompt += "(Chưa có chương nào được viết. Bạn đang sáng tác chương đầu tiên!)\n";
      } else {
        summaries.forEach((s: any) => {
          prompt += `- Chương ${s.chapter_number} [${s.title}]: ${s.summary}\n`;
        });
      }

      prompt += `\nNHIỆM VỤ CỦA BẠN:
Dựa trên bối cảnh và tóm tắt lịch sử cốt truyện ở trên, hãy tiếp thu logic các chương trước và viết tiếp CHƯƠNG KẾ TIẾP thật xuất sắc.
Hãy duy trì tính mạch lạc của nhân vật, giọng văn truyền cảm và tốc độ hợp lý.
YÊU CẦU: Xuất ra định dạng markdown, ghi rõ số chương, tựa đề chương, kèm theo một đoạn tóm tắt chương ngắn gọn (summary) ở cuối cùng để tôi nạp lại vào hệ thống.`;

      promptArea.value = prompt;
      resultBox?.classList.remove("hidden");
    }
  } catch (err) {
    console.error(err);
  } finally {
    loader?.classList.add("hidden");
  }
}

function copyExportPrompt() {
  const promptArea = document.getElementById("aiExportPromptText") as HTMLTextAreaElement | null;
  promptArea?.select();
  document.execCommand("copy");
  alert("Đã sao chép prompt sinh ngữ cảnh thành công vào Clipboard!");
}

// Creator Dashboard view
export default function CreatorPanel({
  books,
  universes,
  characters,
  user,
  prefillBookId = "",
}: {
  books: Storybook[];
  universes: Storyverse[];
  characters: Character[];
  user: User;
  prefillBookId?: string;
}) {
  const username = user.username.toLowerCase();

  // Filter user's own items or collaborative ones
  const myBooks = books.filter(
    (b) => b.authors.toLowerCase().includes(username) || b.allow_other_author_edit
  );
  const myUniverses = universes.filter((u) => u.author.toLowerCase() === username);
  const myCharacters = characters.filter((c) => c.author.toLowerCase() === username);

  // Prefill tab from ?book_id= (same as the previous inline script's URL check)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const prefill = urlParams.get("book_id");
    if (prefill) {
      switchCreatorTab("aiPromptExporter");
    }
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center">
            <i className="fa-solid fa-feather-pointed mr-3 text-amber-500"></i> Quản Lý Sáng Tạo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Không gian làm việc riêng của bạn để quản lý các tác phẩm, vũ trụ, nhân vật và biên soạn ngữ
            cảnh AI.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <a
            href="/create/storybook"
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-black font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/10 flex items-center space-x-1.5 transition-all"
          >
            <i className="fa-solid fa-book"></i>
            <span>Tạo bộ truyện</span>
          </a>
          <a
            href="/create/storyverse"
            className="px-4 py-2.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700/80 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all"
          >
            <i className="fa-solid fa-earth-asia"></i>
            <span>Tạo vũ trụ</span>
          </a>
          <a
            href="/create/character"
            className="px-4 py-2.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700/80 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all"
          >
            <i className="fa-solid fa-user-plus"></i>
            <span>Tạo nhân vật</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar tabs */}
        <div className="space-y-2 lg:col-span-1">
          <button
            onClick={() => switchCreatorTab("books")}
            id="btn-books"
            className="creator-tab-btn active w-full p-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-sm rounded-xl text-left flex items-center justify-between transition-all"
          >
            <span>
              <i className="fa-solid fa-book-open mr-2.5"></i> Bộ truyện của tôi
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px] text-amber-400 font-bold">
              {myBooks.length}
            </span>
          </button>
          <button
            onClick={() => switchCreatorTab("universes")}
            id="btn-universes"
            className="creator-tab-btn w-full p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-xl text-left flex items-center justify-between transition-all"
          >
            <span>
              <i className="fa-solid fa-earth-asia mr-2.5"></i> Vũ trụ của tôi
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-[10px] text-gray-500 dark:text-gray-400 font-bold">
              {myUniverses.length}
            </span>
          </button>
          <button
            onClick={() => switchCreatorTab("characters")}
            id="btn-characters"
            className="creator-tab-btn w-full p-4 bg-white dark:bg-[#161925]/40 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-xl text-left flex items-center justify-between transition-all"
          >
            <span>
              <i className="fa-solid fa-users mr-2.5"></i> Nhân vật đã tạo
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-[10px] text-gray-500 dark:text-gray-400 font-bold">
              {myCharacters.length}
            </span>
          </button>
          <button
            onClick={() => switchCreatorTab("aiPromptExporter")}
            id="btn-aiPromptExporter"
            className="creator-tab-btn w-full p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 text-yellow-400 font-bold text-sm rounded-xl text-left flex items-center justify-between hover:border-amber-500/40 transition-all shadow-md"
          >
            <span>
              <i className="fa-solid fa-robot mr-2.5"></i> AI Context Compiler 🌟
            </span>
            <i className="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </div>

        {/* Panel Forms */}
        <div className="lg:col-span-3 bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 relative min-h-[450px]">
          {/* Tab: My Books */}
          <div id="tabContent-books" className="creator-tab-content space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Bộ truyện của tôi</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Danh sách các truyện bạn đã viết hoặc có quyền đồng sáng tác.
                </p>
              </div>
            </div>

            {myBooks.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-gray-200 dark:border-gray-850 rounded-2xl">
                <i className="fa-solid fa-book-open-reader text-gray-600 text-4xl mb-4"></i>
                <p className="text-gray-500">Bạn chưa sở hữu hoặc tham gia viết bộ truyện nào.</p>
                <a
                  href="/create/storybook"
                  className="inline-block mt-4 px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl"
                >
                  Tạo truyện ngay
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {myBooks.map((b) => (
                  <div
                    key={b.id}
                    className="p-5 bg-white dark:bg-[#161925]/50 border border-gray-200 dark:border-gray-800/80 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-amber-500/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {b.thumbnail_url ? (
                        <img
                          src={b.thumbnail_url}
                          className="w-12 h-16 object-cover rounded-lg shadow border border-gray-100 dark:border-gray-850"
                        />
                      ) : (
                        <div className="w-12 h-16 rounded-lg bg-gradient-to-tr from-amber-500/10 to-yellow-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-lg font-bold">
                          📖
                        </div>
                      )}
                      <div className="text-left space-y-1">
                        <h4 className="font-bold text-gray-900 dark:text-gray-200 text-base hover:text-amber-400 transition-colors">
                          <a href={`/storybook/${b.id}`}>{b.title}</a>
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          Mã: <code className="text-amber-500/90 font-mono text-[11px]">{b.id}</code> &bull; Thể
                          loại: {b.categories}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          Chương:{" "}
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {b.chapters_count || 0}
                          </span>{" "}
                          &bull; Đồng sáng tác: {b.allow_other_author_edit ? "Có" : "Không"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto md:justify-end">
                      <a
                        href={`/create/storybook?id=${b.id}`}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                        <span>Sửa &amp; Chương</span>
                      </a>
                      <button
                        onClick={() => deleteDashboardBook(b.id)}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-550 text-red-400 hover:text-black text-xs font-bold rounded-lg transition-all flex items-center space-x-1"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tab: My Storyverses */}
          <div id="tabContent-universes" className="creator-tab-content space-y-6 hidden">
            <div className="border-b border-gray-200 dark:border-gray-800 pb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Vũ trụ cốt truyện của tôi</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Các thế giới bối cảnh do chính bạn xây dựng để nạp nhân vật dùng chung.
              </p>
            </div>

            {myUniverses.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-gray-200 dark:border-gray-850 rounded-2xl">
                <i className="fa-solid fa-earth-asia text-gray-600 text-4xl mb-4"></i>
                <p className="text-gray-500">Bạn chưa tạo bối cảnh vũ trụ nào.</p>
                <a
                  href="/create/storyverse"
                  className="inline-block mt-4 px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl"
                >
                  Khởi tạo thế giới mới
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {myUniverses.map((u) => (
                  <div
                    key={u.id}
                    className="p-5 bg-white dark:bg-[#161925]/50 border border-gray-200 dark:border-gray-800/80 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-amber-500/20 transition-all"
                  >
                    <div className="flex items-center gap-4 text-left">
                      {u.thumbnail_url ? (
                        <img
                          src={u.thumbnail_url}
                          className="w-12 h-12 object-cover rounded-xl shadow border border-gray-100 dark:border-gray-850"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/10 to-yellow-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-lg font-bold">
                          🌍
                        </div>
                      )}
                      <div className="space-y-1">
                        <h4 className="font-bold text-gray-900 dark:text-gray-200 text-base">
                          <a href={`/storyverses/${u.id}`} className="hover:text-amber-400 transition-colors">
                            {u.title}
                          </a>
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{u.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto md:justify-end">
                      <a
                        href={`/create/storyverse?id=${u.id}`}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                        <span>Sửa</span>
                      </a>
                      <button
                        onClick={() => deleteDashboardStoryverse(u.id)}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-550 text-red-400 hover:text-black text-xs font-bold rounded-lg transition-all flex items-center space-x-1"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tab: My Characters */}
          <div id="tabContent-characters" className="creator-tab-content space-y-6 hidden">
            <div className="border-b border-gray-200 dark:border-gray-800 pb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nhân vật đã tạo</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Các hồ sơ nhân vật dùng chung bạn đã đóng góp vào các bối cảnh vũ trụ.
              </p>
            </div>

            {myCharacters.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-gray-200 dark:border-gray-850 rounded-2xl">
                <i className="fa-solid fa-user-plus text-gray-600 text-4xl mb-4"></i>
                <p className="text-gray-500">Bạn chưa tạo hồ sơ nhân vật nào.</p>
                <a
                  href="/create/character"
                  className="inline-block mt-4 px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl"
                >
                  Tạo nhân vật ngay
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myCharacters.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 bg-white dark:bg-[#161925]/50 border border-gray-200 dark:border-gray-800/80 rounded-2xl flex justify-between items-center gap-3 hover:border-amber-500/20 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} className="w-10 h-10 object-cover rounded-full shadow" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500/10 to-yellow-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold">
                          👤
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-gray-250 text-sm">{c.name}</h4>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase block font-semibold">
                          Vũ trụ: {c.storyverse_id}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/create/character?id=${c.id}`}
                        className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-450 rounded-lg hover:text-amber-500 transition-colors"
                        title="Sửa"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </a>
                      <button
                        onClick={() => deleteDashboardCharacter(c.id)}
                        className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-black transition-all"
                        title="Xóa"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tab: AI Prompt Context Exporter */}
          <div id="tabContent-aiPromptExporter" className="creator-tab-content space-y-6 hidden">
            <div className="border-b border-gray-200 dark:border-gray-800 pb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <i className="fa-solid fa-wand-magic-sparkles mr-2 text-yellow-400 animate-pulse"></i> AI Context
                Compiler &amp; Prompt Exporter
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Chọn một bộ truyện và xem tóm tắt toàn bộ chương truyện dưới dạng prompt nạp trực tiếp vào AI
                (Claude / ChatGPT) để nó viết chương mới cực kỳ mạch lạc.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Chọn bộ truyện cần trích xuất
                </label>
                <select
                  id="exportBookId"
                  defaultValue={prefillBookId}
                  onChange={() => generateAiPrompt()}
                  className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="">-- Chọn một truyện --</option>
                  {myBooks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div
                id="exportLoader"
                className="hidden text-sm text-gray-600 dark:text-gray-400 italic py-2 text-left"
              >
                Đang tải và sinh ngữ cảnh...
              </div>

              <div id="exportResultContainer" className="hidden space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Ngữ cảnh prompt sinh ra:
                  </span>
                  <button
                    onClick={copyExportPrompt}
                    className="px-3 py-1 bg-amber-500 text-black font-semibold text-xs rounded hover:bg-amber-600 transition-colors flex items-center space-x-1"
                  >
                    <i className="fa-solid fa-copy"></i>
                    <span>Sao chép Prompt</span>
                  </button>
                </div>
                <textarea
                  id="aiExportPromptText"
                  readOnly
                  rows={12}
                  className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-xs font-mono text-amber-500/90 focus:outline-none focus:border-amber-500 leading-relaxed"
                ></textarea>
                <span className="text-[10px] text-gray-500 dark:text-gray-500 leading-relaxed block text-left">
                  * Lời khuyên: Sao chép prompt trên và dán trực tiếp vào Claude 3.5 Sonnet cùng với hướng dẫn
                  "Hãy viết chương tiếp theo dựa trên bối cảnh này".
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
