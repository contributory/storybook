"use client";

import { useEffect } from "react";
import type { User } from "@/lib/db";
import { t, type Language } from "@/lib/i18n";

async function handleSaveSettings(e: React.FormEvent, lang: Language) {
  e.preventDefault();
  const displayName = (document.getElementById("settingsDisplayName") as HTMLInputElement).value.trim();
  const isCreator = (document.getElementById("settingsIsCreator") as HTMLInputElement).checked;
  const aiAuthorName = (document.getElementById("settingsAiAuthorName") as HTMLInputElement).value.trim();
  const des = (document.getElementById("settingsDes") as HTMLTextAreaElement).value.trim();
  const avatar = (document.getElementById("settingsAvatar") as HTMLInputElement).value.trim();
  const language = (document.getElementById("settingsLanguage") as HTMLSelectElement).value;
  const errDiv = document.getElementById("settingsError");
  const successDiv = document.getElementById("settingsSuccess");

  errDiv?.classList.add("hidden");
  successDiv?.classList.add("hidden");

  // Save language preference to localStorage
  localStorage.setItem("preferred_language", language);

  try {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: displayName,
        is_creator: isCreator,
        ai_author_name: aiAuthorName,
        des,
        avatar,
        language,
      }),
    });
    const data = await res.json();
    if (data.success) {
      if (successDiv) {
        successDiv.innerText = t("settings.success", lang);
        successDiv.classList.remove("hidden");
      }
      setTimeout(() => window.location.reload(), 1000);
    } else {
      if (errDiv) {
        errDiv.innerText = data.error || t("settings.error", lang);
        errDiv.classList.remove("hidden");
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function generateNewApiToken(lang: Language) {
  if (!confirm(t("settings.confirm_revoke", lang))) return;
  try {
    const res = await fetch("/api/settings/token", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      window.location.reload();
    } else {
      alert("Lỗi: " + (data.error || "Thao tác thất bại."));
    }
  } catch (err) {
    console.error(err);
  }
}

function copyApiToken(lang: Language) {
  const tokenInput = document.getElementById("settingsApiToken") as HTMLInputElement | null;
  tokenInput?.select();
  document.execCommand("copy");
  alert(t("settings.token_copied", lang));
}

// Personal settings page view
export default function SettingsPageView({ user, currentLang = "vi" }: { user: User; currentLang?: Language }) {
  // Load language preference from localStorage on mount (same as previous DOMContentLoaded handler)
  useEffect(() => {
    const savedLang = localStorage.getItem("preferred_language");
    if (savedLang) {
      const select = document.getElementById("settingsLanguage") as HTMLSelectElement | null;
      if (select) select.value = savedLang;
    }
  }, []);

  return (
    <div className="max-w-xl mx-auto space-y-8 text-left">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
          <i className="fa-solid fa-gear mr-2 text-amber-500"></i> {t("settings.title", currentLang)}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t("settings.description", currentLang)}</p>
      </div>

      {/* Profile update section */}
      <div className="bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-lg space-y-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
          {t("settings.account_info", currentLang)}
        </h3>

        <form onSubmit={(e) => handleSaveSettings(e, currentLang)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-650 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              {t("settings.display_name", currentLang)}
            </label>
            <input
              type="text"
              id="settingsDisplayName"
              required
              defaultValue={user.display_name}
              className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-650 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              {t("settings.language", currentLang)}
            </label>
            <select
              id="settingsLanguage"
              className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="vi">🇻🇳 Tiếng Việt</option>
              <option value="en">🇬🇧 English</option>
            </select>
            <span className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 block">
              {t("settings.language_desc", currentLang)}
            </span>
          </div>

          {/* Toggle Creator Mode */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#0f111a] rounded-xl border border-gray-200 dark:border-gray-800/80">
            <div className="space-y-0.5 pr-4">
              <span className="text-sm font-bold text-gray-850 dark:text-gray-200">
                {t("settings.creator_mode", currentLang)}
              </span>
              <p className="text-[11px] text-gray-500 dark:text-gray-450 leading-normal">
                {t("settings.creator_mode_desc", currentLang)}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="settingsIsCreator"
                defaultChecked={user.is_creator}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-350 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-650 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              {t("settings.ai_author_name", currentLang)}
            </label>
            <input
              type="text"
              id="settingsAiAuthorName"
              defaultValue={user.ai_author_name || "AI"}
              className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
              placeholder={t("settings.ai_author_name_desc", currentLang)}
            />
            <span className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 block">
              {t("settings.ai_author_name_desc", currentLang)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-650 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              {t("settings.bio", currentLang)}
            </label>
            <textarea
              id="settingsDes"
              rows={3}
              placeholder={t("settings.bio_placeholder", currentLang)}
              defaultValue={user.des || ""}
              className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-650 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              {t("settings.avatar", currentLang)}
            </label>
            <input
              type="text"
              id="settingsAvatar"
              defaultValue={user.avatar || ""}
              className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
              placeholder={t("settings.avatar_placeholder", currentLang)}
            />
          </div>

          <div id="settingsError" className="text-red-400 text-xs hidden"></div>
          <div id="settingsSuccess" className="text-green-400 text-xs hidden"></div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10"
          >
            {t("settings.save", currentLang)}
          </button>
        </form>
      </div>

      {/* API TOKEN management */}
      <div className="bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-lg space-y-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
          {t("settings.security", currentLang)}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          {t("settings.api_desc", currentLang)}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              {t("settings.current_token", currentLang)}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="settingsApiToken"
                readOnly
                defaultValue={user.api_token || t("settings.no_token", currentLang)}
                className="flex-grow bg-gray-100 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs font-mono text-amber-500/90 focus:outline-none"
              />
              {user.api_token ? (
                <button
                  onClick={() => copyApiToken(currentLang)}
                  className="px-4 py-2.5 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-750 hover:bg-gray-300 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors"
                >
                  {t("settings.copy_token", currentLang)}
                </button>
              ) : null}
            </div>
          </div>

          <button
            onClick={() => generateNewApiToken(currentLang)}
            className="w-full py-2.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700/80 border border-gray-300 dark:border-gray-700/60 rounded-xl text-xs font-bold transition-all text-center"
          >
            {user.api_token
              ? t("settings.regenerate_token", currentLang)
              : t("settings.generate_token", currentLang)}
          </button>
        </div>
      </div>
    </div>
  );
}
