"use client";

import { usePathname } from "next/navigation";
import type { User } from "@/lib/db";
import { t, type Language } from "@/lib/i18n";

interface HeaderProps {
  user: User | null;
  unreadNotifsCount: number;
  lang: Language;
}

// Header / Navbar + Mobile menu (client component — uses pathname for the
// active nav state and global helpers for menus/theme).
export default function Header({ user, unreadNotifsCount, lang }: HeaderProps) {
  const pathname = usePathname() || "/";
  const isAdmin = user ? user.is_admin || user.is_owner : false;

  const navLink = (href: string, startsWith: string, icon: string, label: string) => {
    const active = pathname === startsWith || pathname.startsWith(startsWith);
    return (
      <a
        href={href}
        className={`relative px-2 py-1 transition-colors hover:text-amber-400 ${active ? "text-amber-400" : "text-gray-700 dark:text-gray-300"} group`}
      >
        <i className={`fa-solid ${icon} mr-1.5`}></i> {label}
        <span
          className={`absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-300 group-hover:w-full ${active ? "w-full" : ""}`}
        ></span>
      </a>
    );
  };

  const mobileNavLink = (
    href: string,
    startsWith: string,
    icon: string,
    label: string,
    exact = false
  ) => {
    const active = exact ? pathname === startsWith : pathname.startsWith(startsWith);
    return (
      <a
        href={href}
        className={`group flex items-center px-3 py-2.5 rounded-xl text-base font-medium ${active ? "bg-gradient-to-r from-amber-500/10 to-yellow-400/10 text-amber-500 border border-amber-500/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"} transition-all duration-200`}
      >
        <i className={`fa-solid ${icon} w-6 text-center group-hover:scale-110 transition-transform`}></i>{" "}
        <span className="ml-3">{label}</span>
      </a>
    );
  };

  return (
    <>
      {/* Header / Navbar */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#161925]/80 glass-effect sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4 md:space-x-8">
            {/* Mobile Menu Button */}
            <button
              onClick={() => (window as any).toggleMobileMenu()}
              className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-amber-500 transition-colors focus:outline-none active:scale-95 transform"
            >
              <i className="fa-solid fa-bars text-xl"></i>
            </button>

            {/* Logo */}
            <a href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-yellow-500/20 group-hover:scale-105 group-hover:shadow-yellow-500/30 transition-all duration-300">
                S
              </div>
              <span className="text-xl font-bold tracking-wider gradient-text">Storybook</span>
            </a>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              {navLink("/", "/", "fa-house", t("nav.home", lang))}
              {navLink("/storybooks", "/storybooks", "fa-book", t("nav.storybooks", lang))}
              {navLink("/storyverses", "/storyverses", "fa-earth-asia", t("nav.storyverses", lang))}
              {navLink("/characters", "/characters", "fa-users", t("nav.characters", lang))}
            </nav>

            {/* Unified Search Bar */}
            <form action="/search" method="GET" className="hidden lg:flex items-center relative max-w-md flex-grow mx-4 group">
              <input
                type="text"
                name="q"
                placeholder={t("nav.search_placeholder", lang)}
                required
                className="w-full bg-gray-100/80 dark:bg-[#0f111a]/80 backdrop-blur border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 group-hover:bg-gray-100 dark:group-hover:bg-[#0f111a]"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 text-gray-500 text-sm group-focus-within:text-amber-500 transition-colors"></i>
            </form>
          </div>

          {/* User Auth Profile */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => (window as any).setNextTheme()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition-all duration-300 flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 transform"
              title={t("theme.toggle", lang)}
            >
              {/* className is mutated pre-paint by the theme bootstrap script */}
              <i id="theme-toggle-icon" className="fa-solid fa-desktop" suppressHydrationWarning />
            </button>
            {user ? (
              <div className="relative inline-block text-left" id="user-menu-container">
                <button onClick={() => (window as any).toggleUserMenu()} className="flex items-center space-x-3 group focus:outline-none">
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-amber-400 transition-colors">
                      {user.display_name}
                    </span>
                    <span className="text-xs text-amber-500 font-medium">
                      @{user.username} {user.is_owner ? "(Owner)" : user.is_admin ? "(Admin)" : ""}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-400 border-2 border-transparent flex items-center justify-center text-black font-bold uppercase shadow-lg shadow-yellow-500/20 group-hover:shadow-yellow-500/40 group-hover:scale-105 group-hover:border-amber-300 transition-all duration-300 cursor-pointer">
                    {user.display_name.charAt(0)}
                  </div>
                </button>

                {/* Dropdown menu */}
                <div
                  id="user-dropdown-menu"
                  className="hidden absolute right-0 mt-2 w-56 bg-white dark:bg-[#161925] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50 origin-top-right"
                >
                  <a
                    href={`/profile/${user.username}`}
                    className="group flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-yellow-400/10 hover:text-amber-500 transition-all duration-200"
                  >
                    <i className="fa-regular fa-user mr-3 w-4 text-center group-hover:scale-110 transition-transform"></i>{" "}
                    {t("menu.profile", lang)}
                  </a>
                  <a
                    href="/settings"
                    className="group flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-yellow-400/10 hover:text-amber-500 transition-all duration-200"
                  >
                    <i className="fa-solid fa-gear mr-3 w-4 text-center group-hover:rotate-90 transition-transform duration-300"></i>{" "}
                    {t("menu.settings", lang)}
                  </a>
                  {user.is_creator ? (
                    <a
                      href="/creator"
                      className="group flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-yellow-400/10 hover:text-amber-500 transition-all duration-200"
                    >
                      <i className="fa-solid fa-feather-pointed mr-3 w-4 text-center group-hover:scale-110 transition-transform"></i>{" "}
                      {t("menu.creator", lang)}
                    </a>
                  ) : null}
                  {isAdmin ? (
                    <a
                      href="/admin"
                      className="group flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-yellow-400/10 hover:text-amber-500 transition-all duration-200"
                    >
                      <i className="fa-solid fa-user-shield mr-3 w-4 text-center group-hover:scale-110 transition-transform"></i>{" "}
                      {t("menu.admin", lang)}
                    </a>
                  ) : null}
                  <a
                    href="/notifications"
                    className="group flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-yellow-400/10 hover:text-amber-500 transition-all duration-200 relative"
                  >
                    <i className={`fa-solid fa-bell mr-3 w-4 text-center ${unreadNotifsCount > 0 ? "notification-badge" : ""}`}></i>{" "}
                    {t("menu.notifications", lang)}
                    {unreadNotifsCount > 0 ? (
                      <span className="ml-auto inline-flex items-center justify-center bg-red-500 text-white font-bold text-xs px-2 py-0.5 rounded-full notification-badge">
                        {unreadNotifsCount}
                      </span>
                    ) : null}
                  </a>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <button
                    onClick={() => (window as any).logout()}
                    className="w-full group flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                  >
                    <i className="fa-solid fa-right-from-bracket mr-3 w-4 text-center group-hover:translate-x-1 transition-transform"></i>{" "}
                    {t("menu.logout", lang)}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => (window as any).openAuthModal("login")}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors active:scale-95 transform"
                >
                  {t("menu.login", lang)}
                </button>
                <button
                  onClick={() => (window as any).openAuthModal("register")}
                  className="px-5 py-2.5 text-sm font-semibold text-black bg-gradient-to-r from-amber-500 to-yellow-400 rounded-xl hover:brightness-110 hover:shadow-lg hover:shadow-yellow-500/25 active:scale-95 transform transition-all duration-300"
                >
                  {t("menu.signup", lang)}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu (Hidden by default) */}
      <div
        id="mobile-menu"
        className="hidden md:hidden border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#161925]/95 backdrop-blur px-4 py-3 space-y-2"
      >
        {/* Mobile Search Form */}
        <form action="/search" method="GET" className="flex items-center relative pb-2">
          <input
            type="text"
            name="q"
            placeholder={t("nav.search_placeholder", lang)}
            required
            className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300"
          />
          <i className="fa-solid fa-magnifying-glass absolute left-3 text-gray-500 text-sm"></i>
        </form>
        {mobileNavLink("/", "/", "fa-house", t("nav.home", lang), true)}
        {mobileNavLink("/storybooks", "/storybooks", "fa-book", t("nav.storybooks", lang))}
        {mobileNavLink("/storyverses", "/storyverses", "fa-earth-asia", t("nav.storyverses", lang))}
        {mobileNavLink("/characters", "/characters", "fa-users", t("nav.characters", lang))}
        {user && user.is_creator
          ? mobileNavLink("/creator", "/creator", "fa-feather-pointed", t("menu.creator", lang))
          : null}
        {isAdmin ? mobileNavLink("/admin", "/admin", "fa-user-shield", t("menu.admin", lang)) : null}
        {user ? (
          <a
            href="/notifications"
            className={`group flex items-center px-3 py-2.5 rounded-xl text-base font-medium ${pathname === "/notifications" ? "bg-gradient-to-r from-amber-500/10 to-yellow-400/10 text-amber-500 border border-amber-500/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"} transition-all duration-200 relative`}
          >
            <i className={`fa-solid fa-bell w-6 text-center ${unreadNotifsCount > 0 ? "notification-badge" : ""}`}></i>{" "}
            <span className="ml-3">{t("menu.notifications", lang)}</span>
            {unreadNotifsCount > 0 ? (
              <span className="ml-auto inline-flex items-center justify-center bg-red-500 text-white font-bold text-xs px-2 py-0.5 rounded-full notification-badge">
                {unreadNotifsCount}
              </span>
            ) : null}
          </a>
        ) : null}
      </div>
    </>
  );
}
