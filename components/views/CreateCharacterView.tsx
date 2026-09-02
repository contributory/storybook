"use client";

import type { Character, Storyverse } from "@/lib/db";

async function handleCreateCharacter(e: React.FormEvent) {
  e.preventDefault();
  const editId = (document.getElementById("charEditId") as HTMLInputElement | null)?.value || "";
  const id = (document.getElementById("charId") as HTMLInputElement).value.trim();
  const name = (document.getElementById("charName") as HTMLInputElement).value.trim();
  const description = (document.getElementById("charInfo") as HTMLTextAreaElement).value.trim();
  const storyverseIdEl = document.getElementById("charStoryverseId") as HTMLSelectElement | null;
  const storyverse_id = storyverseIdEl?.value || "";
  const errDiv = document.getElementById("newCharError");

  errDiv?.classList.add("hidden");

  if (!storyverse_id && !editId) {
    if (errDiv) {
      errDiv.innerText = "Vui lòng chọn một vũ trụ cho nhân vật.";
      errDiv.classList.remove("hidden");
    }
    return;
  }

  try {
    const isEdit = !!editId;
    const res = await fetch(isEdit ? `/api/characters/${editId}` : "/api/characters", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { name, description } : { id, name, description, storyverse_id }),
    });
    const data = await res.json();
    if (data.success) {
      const hidden = document.getElementById("charStoryverseIdHidden") as HTMLInputElement | null;
      const svId = hidden?.value || storyverse_id;
      window.location.href = "/storyverses/" + svId;
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

// Create / Edit Character view
export default function CreateCharacterView({
  universes,
  char,
  prefillStoryverseId = "",
}: {
  universes: Storyverse[];
  char: Character | null;
  prefillStoryverseId?: string;
}) {
  const isEdit = !!char;
  const selectedSv = isEdit ? char!.storyverse_id : prefillStoryverseId;

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <div className="space-y-2">
        <a
          href={isEdit ? `/storyverses/${char!.storyverse_id}` : "/characters"}
          className="inline-flex items-center space-x-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-amber-400 transition-colors"
        >
          <i className="fa-solid fa-chevron-left"></i>
          <span>{isEdit ? "Quay lại vũ trụ" : "Quay lại danh sách nhân vật"}</span>
        </a>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
          <i className={`fa-solid ${isEdit ? "fa-pen-to-square" : "fa-user-plus"} mr-2 text-amber-500`}></i>
          {isEdit ? `Sửa Nhân Vật: ${char!.name}` : "Tạo Nhân Vật Mới"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isEdit
            ? "Cập nhật thông tin nhân vật dùng chung."
            : "Các nhân vật được tạo trong Vũ trụ có thể được sử dụng bởi bất kỳ tác phẩm nào cùng thuộc vũ trụ đó."}
        </p>
      </div>

      <div className="bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <form onSubmit={handleCreateCharacter} className="space-y-4">
          {isEdit ? <input type="hidden" id="charEditId" value={char!.id} /> : null}
          <input type="hidden" id="charStoryverseIdHidden" value={isEdit ? char!.storyverse_id : ""} />

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Chọn Vũ trụ (Storyverse) <span className="text-red-400">*</span>
            </label>
            <select
              id="charStoryverseId"
              required
              disabled={isEdit}
              defaultValue={selectedSv}
              className={`w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-amber-500 transition-colors ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <option value="">-- Chọn vũ trụ --</option>
              {universes.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.title}
                </option>
              ))}
            </select>
            {isEdit ? (
              <span className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 block">
                Vũ trụ của nhân vật không thể thay đổi.
              </span>
            ) : (
              <span className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 block">
                Mỗi nhân vật phải thuộc về một vũ trụ cốt truyện.
              </span>
            )}
            {!isEdit && universes.length === 0 ? (
              <span className="text-[10px] text-red-400 mt-1 block">
                Chưa có vũ trụ nào. Hãy{" "}
                <a href="/create/storyverse" className="underline font-bold">
                  tạo vũ trụ trước
                </a>
                .
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                ID nhân vật (không dấu)
              </label>
              <input
                type="text"
                id="charId"
                required
                readOnly={isEdit}
                disabled={isEdit}
                defaultValue={char ? char.id : ""}
                className={`w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                placeholder="ton-ngo-khong"
              />
              {isEdit ? (
                <span className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 block">
                  ID không thể thay đổi sau khi tạo.
                </span>
              ) : null}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Tên nhân vật
              </label>
              <input
                type="text"
                id="charName"
                required
                defaultValue={char ? char.name : ""}
                className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Tôn Ngộ Không"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Mô tả ngoại hình, tính cách, kỹ năng, pháp bảo (Định dạng tự do)
            </label>
            <textarea
              id="charInfo"
              required
              rows={5}
              defaultValue={char ? char.description : ""}
              className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="Mô tả kỹ năng, ngoại hình, điểm yếu, bối cảnh nhân vật để AI đọc hiểu..."
            ></textarea>
          </div>

          <div id="newCharError" className="text-red-400 text-xs hidden"></div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10"
          >
            {isEdit ? "Lưu thay đổi" : "Tạo nhân vật dùng chung"}
          </button>
        </form>
      </div>
    </div>
  );
}
