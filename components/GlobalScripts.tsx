import type { Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";

/**
 * Global client-side bootstrap, rendered as an inline script at the top of
 * <body> (executes pre-paint, exactly like the previous Hono layout script).
 *
 * Provides: theme handling, fetch caching interceptor, mobile/user menus,
 * auth modal, logout and the global like toggle. View components invoke these
 * helpers through `window.*` from React event handlers.
 */
export default function GlobalScripts({ lang }: { lang: Language }) {
  // Server-computed i18n strings used by the client helpers
  const i18n = {
    theme_dark: t("theme.dark", lang),
    theme_light: t("theme.light", lang),
    theme_system: t("theme.system", lang),
    auth_login_title: t("auth.login_title", lang),
    auth_signup_title: t("auth.signup_title", lang),
    auth_no_account: t("auth.no_account", lang),
    auth_have_account: t("auth.have_account", lang),
    menu_login: t("menu.login", lang),
    menu_signup: t("menu.signup", lang),
  };

  const script = `
(function () {
  var I18N = ${JSON.stringify(i18n)};

  function getTheme() {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme');
    }
    return 'system'; // Default to system
  }

  function applyTheme(theme) {
    var isDark = false;
    if (theme === 'dark') {
      isDark = true;
    } else if (theme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }

    updateThemeUI(theme);
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (getTheme() === 'system') applyTheme('system');
  });

  applyTheme(getTheme());

  function setNextTheme() {
    var current = getTheme();
    var next = current === 'dark' ? 'light' : current === 'light' ? 'system' : 'dark';
    applyTheme(next);
  }

  function updateThemeUI(theme) {
    var icon = document.getElementById('theme-toggle-icon');
    var text = document.getElementById('theme-toggle-text');
    if (!icon) return;

    if (theme === 'dark') {
      icon.className = 'fa-solid fa-moon text-amber-300';
      if (text) text.innerText = I18N.theme_dark;
    } else if (theme === 'light') {
      icon.className = 'fa-solid fa-sun text-amber-500';
      if (text) text.innerText = I18N.theme_light;
    } else {
      icon.className = 'fa-solid fa-desktop text-gray-500 dark:text-gray-400';
      if (text) text.innerText = I18N.theme_system;
    }
  }

  window.addEventListener('DOMContentLoaded', function () {
    updateThemeUI(getTheme());
  });

  // --- CLIENT-SIDE FETCH CACHING INTERCEPTOR ---
  var _originalFetch = window.fetch;
  var apiCache = new Map();
  var CACHE_TTL = 60000; // 1 minute TTL for cache entries

  window.fetch = async function (url, options) {
    var method = (options && options.method) ? String(options.method).toUpperCase() : 'GET';
    // Next.js internal router passes URL/Request objects — normalize to string
    var urlStr = typeof url === 'string'
      ? url
      : (url && typeof url.url === 'string')
        ? url.url
        : (url && typeof url.href === 'string')
          ? url.href
          : String(url);

    // Only intercept GET requests for API endpoints
    var isGetApi = method === 'GET' && (
      urlStr.includes('/api/comments') ||
      urlStr.includes('/api/likes') ||
      urlStr.includes('/api/storybooks') ||
      urlStr.includes('/api/storyverses') ||
      urlStr.includes('/api/characters')
    );

    if (isGetApi) {
      var cached = apiCache.get(url);
      if (cached && Date.now() < cached.expiry) {
        return cached.response.clone();
      }
      var response = await _originalFetch(url, options);
      if (response.ok) {
        apiCache.set(url, {
          response: response.clone(),
          expiry: Date.now() + CACHE_TTL
        });
      }
      return response;
    }

    // If mutation request (POST/PUT/DELETE), clear the cache
    if (method !== 'GET') {
      apiCache.clear();
    }

    return _originalFetch(url, options);
  };

  // --- UI helpers ---
  function toggleMobileMenu() {
    var menu = document.getElementById('mobile-menu');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  }

  function toggleUserMenu() {
    var menu = document.getElementById('user-dropdown-menu');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  }

  window.addEventListener('click', function (e) {
    var container = document.getElementById('user-menu-container');
    if (container && !container.contains(e.target)) {
      var menu = document.getElementById('user-dropdown-menu');
      if (menu && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
      }
    }
  });

  function openAuthModal(type) {
    type = type || 'login';
    var modal = document.getElementById('authModal');
    var typeInput = document.getElementById('authType');
    var title = document.getElementById('modalTitle');
    var nameGroup = document.getElementById('displayNameGroup');
    var prompt = document.getElementById('switchAuthPrompt');
    var switchBtn = document.getElementById('switchAuthBtn');
    var errDiv = document.getElementById('authError');

    errDiv.classList.add('hidden');
    typeInput.value = type;

    if (type === 'login') {
      title.innerText = I18N.auth_login_title;
      nameGroup.classList.add('hidden');
      prompt.innerText = I18N.auth_no_account;
      switchBtn.innerText = I18N.menu_signup;
    } else {
      title.innerText = I18N.auth_signup_title;
      nameGroup.classList.remove('hidden');
      prompt.innerText = I18N.auth_have_account;
      switchBtn.innerText = I18N.menu_login;
    }

    modal.classList.remove('hidden');
    setTimeout(function () {
      modal.classList.remove('opacity-0');
      modal.querySelector('div').classList.remove('scale-95');
    }, 10);
  }

  function closeAuthModal() {
    var modal = document.getElementById('authModal');
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(function () { modal.classList.add('hidden'); }, 300);
  }

  function toggleAuthType() {
    var currentType = document.getElementById('authType').value;
    openAuthModal(currentType === 'login' ? 'register' : 'login');
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    var type = document.getElementById('authType').value;
    var username = document.getElementById('authUsername').value;
    var password = document.getElementById('authPassword').value;
    var display_name = document.getElementById('authDisplayName').value;
    var errDiv = document.getElementById('authError');

    errDiv.classList.add('hidden');

    var url = type === 'login' ? '/api/auth/login' : '/api/auth/register';
    var body = { username: username, password: password };
    if (type === 'register' && display_name) body.display_name = display_name;

    try {
      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      var data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        errDiv.innerText = data.error || 'Có lỗi xảy ra, vui lòng thử lại.';
        errDiv.classList.remove('hidden');
      }
    } catch (err) {
      errDiv.innerText = 'Không thể kết nối đến máy chủ.';
      errDiv.classList.remove('hidden');
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  async function toggleLike(type, id, btnEl) {
    try {
      var res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: type, target_id: id })
      });
      var data = await res.json();
      if (data.success) {
        var icon = btnEl.querySelector('i');
        var text = btnEl.querySelector('span');
        if (data.liked) {
          icon.classList.remove('fa-regular');
          icon.classList.add('fa-solid', 'text-red-500');
        } else {
          icon.classList.remove('fa-solid', 'text-red-500');
          icon.classList.add('fa-regular');
        }
        if (text) text.innerText = data.count + ' thích';
      } else {
        openAuthModal('login');
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Expose as globals for React onClick handlers
  window.setNextTheme = setNextTheme;
  window.toggleMobileMenu = toggleMobileMenu;
  window.toggleUserMenu = toggleUserMenu;
  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;
  window.toggleAuthType = toggleAuthType;
  window.handleAuthSubmit = handleAuthSubmit;
  window.logout = logout;
  window.toggleLike = toggleLike;
})();
`.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
