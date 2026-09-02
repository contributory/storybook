"use client";

import type { Chapter, Storybook, Storyverse } from "@/lib/db";

async function handleCreateBook(e: React.FormEvent) {
  e.preventDefault();
  const editId = (document.getElementById("bookEditId") as HTMLInputElement | null)?.value || "";
  const id = (document.getElementById("bookId") as HTMLInputElement).value.trim();
  const title = (document.getElementById("bookTitle") as HTMLInputElement).value.trim();
  const description = (document.getElementById("bookDescription") as HTMLTextAreaElement).value.trim();
  const categories = (document.getElementById("bookCategories") as HTMLInputElement).value.trim();
  const storyverse_id = (document.getElementById("bookStoryverseId") as HTMLSelectElement).value;
  const allow_other_author_edit = (document.getElementById("bookAllowEdit") as HTMLInputElement).checked;
  const errDiv = document.getElementById("newBookError");

  errDiv?.classList.add("hidden");

  try {
    const payload = { title, description, categories, storyverse_id, allow_other_author_edit };
    const isEdit = !!editId;
    const res = await fetch(isEdit ? `/api/storybooks/${editId}` : "/api/storybooks", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? payload : { id, ...payload }),
    });
    const data = await res.json();
    if (data.success) {
      window.location.href = "/storybook/" + (data.storybook ? data.storybook.id : editId);
    } else {
      if (errDiv) {
        errDiv.innerText = data.error || "Thất bại.";
        errDiv.classList.remove("hidden");
      }
    }
  } catch (err) {
    console.error(err);
    if (errDiv) {
      errDiv.innerText = "Có lỗi xảy ra, vui lòng thử lại.";
      errDiv.classList.remove("hidden");
    }
  }
}

async function handleCreateChapter(e: React.FormEvent) {
  e.preventDefault();
  const bookId = (document.getElementById("chapterBookId") as HTMLInputElement).value;
  const chapter_number = (document.getElementById("chapterNumber") as HTMLInputElement).value;
  const title = (document.getElementById("chapterTitle") as HTMLInputElement).value.trim();
  const summary = (document.getElementById("chapterSummary") as HTMLTextAreaElement).value.trim();
  const content = (document.getElementById("chapterContent") as HTMLTextAreaElement).value.trim();
  const errDiv = document.getElementById("newChapterError");

  errDiv?.classList.add("hidden");

  try {
    const res = await fetch(`/api/storybooks/${bookId}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapter_number, title, summary, content }),
    });
    const data = await res.json();
    if (data.success) {
      // Reload page to reset states and clear input, but keep in edit mode
      window.location.href = `/create/storybook?id=${bookId}`;
    } else {
      if (errDiv) {
        errDiv.innerText = data.error || "Thất bại.";
        errDiv.classList.remove("hidden");
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteChapter(bookId: string, num: number) {
  if (!confirm(`Xác nhận xóa Chương ${num}?`)) return;
  try {
    const res = await fetch(`/api/storybooks/${bookId}/chapters/${num}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      window.location.href = `/create/storybook?id=${bookId}`;
    } else {
      alert("Lỗi: " + (data.error || "Không thể xóa chương."));
    }
  } catch (err) {
    console.error(err);
  }
}

// Create / Edit Storybook view (with chapter editor when editing)
export default function CreateStorybookView({
  universes,
  book,
  chapters = [],
  editChapter = null,
}: {
  universes: Storyverse[];
  book: Storybook | null;
  chapters?: Omit<Chapter, "content">[];
  editChapter?: Chapter | null;
}) {
  const isEdit = !!book;
  const b = book;

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left">
      <div className="space-y-2">
        <a
          href={isEdit ? `/storybook/${b!.id}` : "/storybooks"}
          className="inline-flex items-center space-x-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-amber-400 transition-colors"
        >
          <i className="fa-solid fa-chevron-left"></i>
          <span>{isEdit ? "Quay lại truyện" : "Quay lại thư viện"}</span>
        </a>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
          <i className={`fa-solid ${isEdit ? "fa-pen-to-square" : "fa-book"} mr-2 text-amber-500`}></i>
          {isEdit ? `Sửa Bộ Truyện: ${b!.title}` : "Tạo Bộ Truyện Mới"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isEdit
            ? "Cập nhật thông tin bộ truyện và quản lý các chương truyện của bạn."
            : "Khai sinh bộ truyện mới của riêng bạn hoặc thuộc về một Vũ trụ dùng chung."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Main Form: Storybook Metadata */}
        <div className={`${isEdit ? "lg:col-span-2" : "lg:col-span-3"} space-y-6`}>
          <div className="bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-850 pb-2">
              <i className="fa-solid fa-circle-info text-amber-500 mr-2"></i> Thông tin cơ bản
            </h3>
            <form onSubmit={handleCreateBook} className="space-y-4">
              {isEdit ? <input type="hidden" id="bookEditId" value={b!.id} /> : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    ID bộ truyện (Không dấu/khoảng cách)
                  </label>
                  <input
                    type="text"
                    id="bookId"
                    required
                    readOnly={isEdit}
                    disabled={isEdit}
                    defaultValue={b ? b.id : ""}
                    className={`w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                    placeholder="tay-du-ky-ngoai-truyen"
                  />
                  {isEdit ? (
                    <span className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 block">
                      ID không thể thay đổi sau khi tạo.
                    </span>
                  ) : null}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Tiêu đề bộ truyện
                  </label>
                  <input
                    type="text"
                    id="bookTitle"
                    required
                    defaultValue={b ? b.title : ""}
                    className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Tây Du Ký: Ngoại Truyện"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Mô tả cốt truyện
                </label>
                <textarea
                  id="bookDescription"
                  required
                  rows={4}
                  defaultValue={b ? b.description : ""}
                  className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="Tóm lược nội dung cốt truyện chính, định hướng..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Thể loại (Ngăn cách bởi dấu phẩy)
                  </label>
                  <input
                    type="text"
                    id="bookCategories"
                    required
                    defaultValue={b ? b.categories : ""}
                    className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Huyền Huyễn, Tiên Hiệp, Phiêu Lưu"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Liên kết Vũ trụ (Storyverse)
                  </label>
                  <select
                    id="bookStoryverseId"
                    defaultValue={b?.storyverse_id || ""}
                    className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="">-- Độc lập --</option>
                    {universes.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="bookAllowEdit"
                  defaultChecked={!!(b && b.allow_other_author_edit)}
                  className="w-4 h-4 rounded border-gray-200 dark:border-gray-800 text-amber-500 focus:ring-amber-500 focus:ring-opacity-20 bg-gray-50 dark:bg-[#0f111a]"
                />
                <label
                  htmlFor="bookAllowEdit"
                  className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide"
                >
                  Cho phép người khác đồng sáng tác
                </label>
              </div>

              <div id="newBookError" className="text-red-400 text-xs hidden"></div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10"
              >
                {isEdit ? "Cập nhật thông tin truyện" : "Tạo truyện mới"}
              </button>
            </form>
          </div>

          {/* Chapter List (Only visible when editing an existing book) */}
          {isEdit ? (
            <div className="bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-850 pb-2">
                <i className="fa-solid fa-list-ol text-amber-500 mr-2"></i> Danh sách chương hiện tại (
                {chapters.length})
              </h3>

              {chapters.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-500 italic py-4">
                  Truyện này chưa có chương nào. Bạn có thể sử dụng biểu mẫu bên phải để thêm chương đầu tiên!
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
                  {chapters.map((ch) => (
                    <div
                      key={ch.chapter_number}
                      className="flex items-center justify-between p-3.5 bg-white dark:bg-[#161925]/50 border border-gray-200 dark:border-gray-800/80 hover:border-amber-500/30 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-900 transition-all"
                    >
                      <div className="text-left space-y-1">
                        <h4 className="font-bold text-sm text-gray-850 dark:text-gray-200">
                          Chương {ch.chapter_number}: {ch.title}
                        </h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-500 italic line-clamp-1">
                          Tóm tắt: {ch.summary || "Chưa có tóm tắt"}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <a
                          href={`?id=${b!.id}&chapter_number=${ch.chapter_number}#chapterForm`}
                          className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-450 rounded-lg hover:text-amber-500 hover:bg-amber-500/10 transition-all text-xs"
                          title="Sửa nội dung chương"
                        >
                          <i className="fa-solid fa-pen-to-square"></i> Sửa
                        </a>
                        <button
                          onClick={() => deleteChapter(b!.id, ch.chapter_number)}
                          className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-black transition-all text-xs"
                          title="Xóa chương"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Right Sidebar: Chapter Creator & Editor (Only when isEdit is true) */}
        {isEdit ? (
          <div className="lg:col-span-1 space-y-6">
            <div
              id="chapterForm"
              className="bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl space-y-4 sticky top-20"
            >
              <div className="border-b border-gray-200 dark:border-gray-850 pb-2 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  <i className="fa-solid fa-file-pen text-amber-500 mr-1.5"></i>
                  {editChapter ? `Sửa Chương ${editChapter.chapter_number}` : "Viết Chương Mới"}
                </h3>
                {editChapter ? (
                  <a href={`?id=${b!.id}`} className="text-[10px] text-amber-500 hover:underline">
                    Hủy sửa
                  </a>
                ) : null}
              </div>

              <form onSubmit={handleCreateChapter} className="space-y-4">
                <input type="hidden" id="chapterBookId" value={b!.id} />

                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Chương số
                  </label>
                  <input
                    type="number"
                    id="chapterNumber"
                    required
                    min={1}
                    readOnly={!!editChapter}
                    disabled={!!editChapter}
                    defaultValue={editChapter ? editChapter.chapter_number : chapters.length + 1}
                    className={`w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors text-sm ${editChapter ? "opacity-60 cursor-not-allowed" : ""}`}
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Tiêu đề chương
                  </label>
                  <input
                    type="text"
                    id="chapterTitle"
                    required
                    defaultValue={editChapter ? editChapter.title : ""}
                    className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors text-sm"
                    placeholder="Ví dụ: Khởi đầu mới"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Tóm tắt chương (Dành cho AI)
                  </label>
                  <textarea
                    id="chapterSummary"
                    required
                    rows={2}
                    defaultValue={editChapter ? editChapter.summary : ""}
                    className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors text-xs"
                    placeholder="Tóm tắt ngắn để AI đọc..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Nội dung chương
                  </label>
                  <textarea
                    id="chapterContent"
                    required
                    rows={10}
                    defaultValue={editChapter ? editChapter.content : ""}
                    className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 text-gray-900 dark:text-white font-serif focus:outline-none focus:border-amber-500 transition-colors text-sm leading-relaxed"
                    placeholder="Nội dung chi tiết chương truyện..."
                  ></textarea>
                </div>

                <div id="newChapterError" className="text-red-400 text-xs hidden"></div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-xs rounded-xl hover:brightness-110 transition-all shadow-md"
                >
                  {editChapter ? "Lưu chương" : "Lưu chương mới"}
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
