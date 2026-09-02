"use client";

import { t, type Language } from "@/lib/i18n";

// Auth Modal (login / register) — behavior lives in the global inline script
// (openAuthModal/closeAuthModal/toggleAuthType/handleAuthSubmit).
export default function AuthModal({ lang }: { lang: Language }) {
  const w = typeof window !== "undefined" ? (window as any) : undefined;

  return (
    <div
      id="authModal"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center hidden opacity-0 transition-opacity duration-300"
    >
      <div className="bg-white dark:bg-[#161925] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md p-8 relative shadow-2xl transform scale-95 transition-transform duration-300 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => w?.closeAuthModal()}
          className="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        <h3 id="modalTitle" className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {t("auth.login_title", lang)}
        </h3>

        <form id="authForm" onSubmit={(e) => w?.handleAuthSubmit(e)} className="space-y-4">
          <input type="hidden" id="authType" value="login" />

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              {t("auth.username", lang)}
            </label>
            <input
              type="text"
              id="authUsername"
              required
              minLength={3}
              className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
              placeholder={t("auth.email", lang)}
            />
          </div>

          <div id="displayNameGroup" className="hidden">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              {t("profile.display_name", lang)}
            </label>
            <input
              type="text"
              id="authDisplayName"
              className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
              placeholder={t("profile.display_name", lang)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              {t("auth.password", lang)}
            </label>
            <input
              type="password"
              id="authPassword"
              required
              minLength={4}
              className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div id="authError" className="text-red-400 text-sm hidden py-1"></div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10 mt-6"
          >
            {t("common.confirm", lang)}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800/60 pt-4">
          <span id="switchAuthPrompt">{t("auth.no_account", lang)}</span>
          <button
            onClick={() => w?.toggleAuthType()}
            id="switchAuthBtn"
            className="text-amber-400 font-semibold hover:underline ml-1"
          >
            {t("menu.signup", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
