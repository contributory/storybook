"use client";

import type { Chapter, Storybook } from "@/lib/db";
import AuthorsList from "@/components/AuthorsList";
import Markdown from "@/components/Markdown";
import { fmtDate } from "@/lib/format";

// TTS state (module-scoped, same behavior as the previous inline script)
let ttsUtterance: SpeechSynthesisUtterance | null = null;
let ttsPlaying = false;
let ttsPaused = false;

function resetTTSUI() {
  ttsUtterance = null;
  ttsPlaying = false;
  ttsPaused = false;

  const toggleBtn = document.getElementById("btn-tts-toggle");
  const toggleText = document.getElementById("tts-toggle-text");
  const stopBtn = document.getElementById("btn-tts-stop");
  const icon = toggleBtn?.querySelector("i");

  if (icon) icon.className = "fa-solid fa-play";
  if (toggleText) toggleText.innerText = "Đọc Chương (TTS)";
  if (stopBtn) stopBtn.classList.add("hidden");
}

function toggleTTS() {
  const toggleBtn = document.getElementById("btn-tts-toggle");
  const toggleText = document.getElementById("tts-toggle-text");
  const stopBtn = document.getElementById("btn-tts-stop");
  const icon = toggleBtn?.querySelector("i");

  if (!("speechSynthesis" in window)) {
    alert("Trình duyệt của bạn không hỗ trợ Text-to-Speech.");
    return;
  }

  if (!ttsUtterance) {
    // Extract clean text directly from the rendered HTML using innerText, bypassing markdown markers
    const contentText = document.getElementById("readerContent")?.innerText.trim();
    if (!contentText) {
      alert("Chương này không có nội dung để đọc.");
      return;
    }

    ttsUtterance = new SpeechSynthesisUtterance(contentText);
    ttsUtterance.lang = "vi-VN";

    ttsUtterance.onend = () => resetTTSUI();
    ttsUtterance.onerror = () => resetTTSUI();

    window.speechSynthesis.speak(ttsUtterance);
    ttsPlaying = true;
    ttsPaused = false;

    // Update UI to show Playing State
    if (icon) icon.className = "fa-solid fa-pause";
    if (toggleText) toggleText.innerText = "Tạm dừng đọc";
    if (stopBtn) stopBtn.classList.remove("hidden");
  } else {
    if (ttsPaused) {
      window.speechSynthesis.resume();
      ttsPaused = false;
      ttsPlaying = true;
      if (icon) icon.className = "fa-solid fa-pause";
      if (toggleText) toggleText.innerText = "Tạm dừng đọc";
    } else if (ttsPlaying) {
      window.speechSynthesis.pause();
      ttsPaused = true;
      ttsPlaying = false;
      if (icon) icon.className = "fa-solid fa-play";
      if (toggleText) toggleText.innerText = "Tiếp tục đọc";
    }
  }
}

function stopTTS() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  resetTTSUI();
}

// Chapter Reader Page
export default function ChapterReaderView({
  book,
  chapter,
  nextNum,
  prevNum,
}: {
  book: Storybook;
  chapter: Chapter;
  nextNum: number | null;
  prevNum: number | null;
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Breadcrumbs & Actions */}
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 pb-4">
        <a
          href={`/storybook/${book.id}`}
          className="hover:text-amber-400 transition-colors flex items-center space-x-1.5"
        >
          <i className="fa-solid fa-chevron-left"></i>
          <span className="font-semibold text-gray-700 dark:text-gray-300">Quay lại: {book.title}</span>
        </a>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => (window as any).setNextTheme()}
            className="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            title="Đổi màu nền toàn trang"
          >
            <i className="fa-solid fa-circle-half-stroke"></i>
          </button>
        </div>
      </div>

      {/* Book & Chapter Title */}
      <div className="text-center space-y-3 pt-4">
        <span className="text-xs uppercase tracking-widest font-semibold text-amber-500">
          Chương {chapter.chapter_number}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight font-serif">
          {chapter.title}
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-500" suppressHydrationWarning>
          Người viết: <AuthorsList authorsStr={book.authors} /> &bull; Cập nhật: {fmtDate(chapter.created_at)}
        </p>

        {/* TTS Reader Controls */}
        <div className="inline-flex items-center space-x-2 bg-white dark:bg-[#161925] border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-2xl shadow-sm mt-3">
          <button
            onClick={toggleTTS}
            id="btn-tts-toggle"
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
          >
            <i className="fa-solid fa-play"></i>
            <span id="tts-toggle-text">Đọc Chương (TTS)</span>
          </button>
          <button
            onClick={stopTTS}
            id="btn-tts-stop"
            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors hidden"
          >
            <i className="fa-solid fa-square"></i>
            <span>Dừng</span>
          </button>
        </div>
      </div>

      {/* Reading Content Box */}
      <article
        id="readerContent"
        className="reader-font md bg-white dark:bg-[#161925]/25 border border-gray-200 dark:border-gray-800/50 rounded-3xl p-6 sm:p-10 text-gray-800 dark:text-gray-200 text-lg sm:text-xl leading-loose text-justify selection:bg-amber-500/20"
      >
        <Markdown text={chapter.content} />
      </article>

      {/* Chapter Navigation Bar */}
      <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-800">
        {prevNum ? (
          <a
            href={`/storybook/${book.id}/chapter/${prevNum}`}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Chương trước</span>
          </a>
        ) : (
          <span className="text-gray-600 text-xs italic">Chương đầu tiên</span>
        )}

        <a
          href={`/storybook/${book.id}`}
          className="px-4 py-2 bg-white dark:bg-[#161925] border border-gray-200 dark:border-gray-800 hover:border-amber-500/30 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-all"
        >
          <i className="fa-solid fa-list mr-1"></i> Mục lục
        </a>

        {nextNum ? (
          <a
            href={`/storybook/${book.id}/chapter/${nextNum}`}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-bold rounded-xl shadow shadow-yellow-500/10 hover:brightness-110 transition-all flex items-center space-x-1.5"
          >
            <span>Chương tiếp</span>
            <i className="fa-solid fa-arrow-right"></i>
          </a>
        ) : (
          <div className="text-right space-y-1">
            <span className="text-xs text-amber-500/80 font-bold block">
              <i className="fa-solid fa-check-double mr-1"></i> Hết chương
            </span>
            {book.allow_other_author_edit ? (
              <a
                href={`/creator?book_id=${book.id}`}
                className="text-[10px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors underline block"
              >
                Đóng góp chương tiếp?
              </a>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
