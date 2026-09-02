"use client";

import type { Storyverse } from "@/lib/db";

async function handleCreateUniverse(e: React.FormEvent) {
  e.preventDefault();
  const editId = (document.getElementById("universeEditId") as HTMLInputElement | null)?.value || "";
  const id = (document.getElementById("universeId") as HTMLInputElement).value.trim();
  const title = (document.getElementById("universeTitle") as HTMLInputElement).value.trim();
  const description = (document.getElementById("universeDescription") as HTMLTextAreaElement).value.trim();
  const errDiv = document.getElementById("newUniverseError");

  errDiv?.classList.add("hidden");

  try {
    const payload = { title, description };
    const isEdit = !!editId;
    const res = await fetch(isEdit ? `/api/storyverses/${editId}` : "/api/storyverses", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? payload : { id, ...payload }),
    });
    const data = await res.json();
    if (data.success) {
      window.location.href = "/storyverses/" + (data.storyverse ? data.storyverse.id : editId);
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

// Create / Edit Storyverse view
export default function CreateStoryverseView({ sv }: { sv: Storyverse | null }) {
  const isEdit = !!sv;

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <div className="space-y-2">
        <a
          href={isEdit ? `/storyverses/${sv!.id}` : "/storyverses"}
          className="inline-flex items-center space-x-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-amber-400 transition-colors"
        >
          <i className="fa-solid fa-chevron-left"></i>
          <span>{isEdit ? "Quay lại vũ trụ" : "Quay lại danh sách vũ trụ"}</span>
        </a>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
          <i className={`fa-solid ${isEdit ? "fa-pen-to-square" : "fa-earth-asia"} mr-2 text-amber-500`}></i>
          {isEdit ? `Sửa Vũ Trụ: ${sv!.title}` : "Tạo Vũ Trụ Cốt Truyện"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isEdit
            ? "Cập nhật bối cảnh và quy luật thế giới của vũ trụ."
            : "Vũ trụ đóng vai trò làm không gian chung kết nối nhiều tác phẩm độc lập hoặc chia sẻ các nhân vật."}
        </p>
      </div>

      <div className="bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <form onSubmit={handleCreateUniverse} className="space-y-4">
          {isEdit ? <input type="hidden" id="universeEditId" value={sv!.id} /> : null}

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              ID vũ trụ (không dấu, viết liền)
            </label>
            <input
              type="text"
              id="universeId"
              required
              readOnly={isEdit}
              disabled={isEdit}
              defaultValue={sv ? sv.id : ""}
              className={`w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
              placeholder="tay-du-saga"
            />
            {isEdit ? (
              <span className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 block">
                ID không thể thay đổi sau khi tạo.
              </span>
            ) : null}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Tên vũ trụ
            </label>
            <input
              type="text"
              id="universeTitle"
              required
              defaultValue={sv ? sv.title : ""}
              className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="Tây Du Saga"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Mô tả bối cảnh và quy luật thế giới
            </label>
            <textarea
              id="universeDescription"
              required
              rows={5}
              defaultValue={sv ? sv.description : ""}
              className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="Mô tả ranh giới thế giới, pháp lực, chủng tộc, quy luật siêu nhiên giúp định hình cốt truyện..."
            ></textarea>
          </div>

          <div id="newUniverseError" className="text-red-400 text-xs hidden"></div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10"
          >
            {isEdit ? "Lưu thay đổi" : "Tạo vũ trụ cốt truyện"}
          </button>
        </form>
      </div>
    </div>
  );
}
