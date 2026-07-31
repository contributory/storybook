/** @jsxImportSource npm:hono@4.5.11/jsx */
import { html } from "npm:hono/html";
import * as db from "../db.ts";


// General HTML Layout Wrapper
export function layout(title: string, content: any, user: db.User | null, currentPath = "/", unreadNotifsCount = 0) {
  const isAdmin = user ? (user.is_admin || user.is_owner) : false;

  return html`<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Storybook</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        serif: ['Lora', 'Merriweather', 'Georgia', 'serif'],
                        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <!-- Google Fonts & FontAwesome Icons -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
        .reader-font {
            font-family: 'Lora', 'Merriweather', 'Georgia', serif;
        }
        /* Hide scrollbar but keep functionality */
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        /* Markdown rendered content */
        .md h1, .md h2, .md h3, .md h4, .md h5, .md h6 { font-weight: 800; line-height: 1.3; margin: 1.2em 0 0.5em; color: inherit; }
        .md h1 { font-size: 1.6em; }
        .md h2 { font-size: 1.35em; }
        .md h3 { font-size: 1.15em; }
        .md h4, .md h5, .md h6 { font-size: 1em; }
        .md p { margin: 0.6em 0; }
        .md ul, .md ol { margin: 0.6em 0; padding-left: 1.5em; }
        .md ul { list-style: disc; }
        .md ol { list-style: decimal; }
        .md li { margin: 0.25em 0; }
        .md a { color: #f59e0b; text-decoration: underline; text-underline-offset: 2px; }
        .md blockquote { border-left: 3px solid #f59e0b; padding-left: 1em; margin: 0.8em 0; font-style: italic; color: #6b7280; }
        .md code { background: rgba(245,158,11,.12); color: #d97706; padding: .15em .35em; border-radius: .375rem; font-size: .875em; }
        .md pre { background: #0f111a; color: #e5e7eb; padding: 1em; border-radius: .75rem; overflow-x: auto; margin: 1em 0; border: 1px solid rgba(255,255,255,.08); }
        .md pre code { background: transparent; color: inherit; padding: 0; font-size: .875em; }
        .md table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: .875em; }
        .md th, .md td { border: 1px solid rgba(107,114,128,.3); padding: .5em .75em; text-align: left; }
        .md th { background: rgba(245,158,11,.08); font-weight: 700; }
        .md img { max-width: 100%; border-radius: .75rem; margin: 1em 0; }
        .md hr { border: 0; border-top: 1px solid rgba(107,114,128,.3); margin: 1.5em 0; }
        .md > :first-child { margin-top: 0; }
        .md > :last-child { margin-bottom: 0; }
    </style>
    <script>
        function getTheme() {
            if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
                return localStorage.getItem('theme');
            }
            return 'system'; // Default to system
        }

        function applyTheme(theme) {
            let isDark = false;
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
        
        if (typeof window !== 'undefined') {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (getTheme() === 'system') applyTheme('system');
            });
        }

        applyTheme(getTheme());
        
        function setNextTheme() {
            const current = getTheme();
            const next = current === 'dark' ? 'light' : current === 'light' ? 'system' : 'dark';
            applyTheme(next);
        }

        function updateThemeUI(theme) {
            const icon = document.getElementById('theme-toggle-icon');
            const text = document.getElementById('theme-toggle-text');
            if (!icon) return;
            
            if (theme === 'dark') {
                icon.className = 'fa-solid fa-moon text-amber-300';
                if (text) text.innerText = 'Tối';
            } else if (theme === 'light') {
                icon.className = 'fa-solid fa-sun text-amber-500';
                if (text) text.innerText = 'Sáng';
            } else {
                icon.className = 'fa-solid fa-desktop text-gray-500 dark:text-gray-400';
                if (text) text.innerText = 'Hệ thống';
            }
        }
        
        window.addEventListener('DOMContentLoaded', () => {
            updateThemeUI(getTheme());
        });
    </script>
</head>
<body class="bg-gray-50 dark:bg-[#0f111a] text-gray-900 dark:text-gray-100 min-h-screen flex flex-col selection:bg-yellow-500 selection:text-black">

    <!-- Header / Navbar -->
    <header class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161925]/90 backdrop-blur sticky top-0 z-50 transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div class="flex items-center space-x-4 md:space-x-8">
                <!-- Mobile Menu Button -->
                <button onclick="toggleMobileMenu()" class="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-amber-500 transition-colors focus:outline-none">
                    <i class="fa-solid fa-bars text-xl"></i>
                </button>

                <!-- Logo -->
                <a href="/" class="flex items-center space-x-2 group">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-yellow-500/10 group-hover:scale-105 transition-transform">
                        S
                    </div>
                    <span class="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-gray-200 to-amber-400 bg-clip-text text-transparent">Storybook</span>
                </a>

                <!-- Navigation Links -->
                <nav class="hidden md:flex items-center space-x-6 text-sm font-medium">
                    <a href="/" class="transition-colors hover:text-amber-400 ${currentPath === "/" ? "text-amber-400" : "text-gray-700 dark:text-gray-300"}">
                        <i class="fa-solid fa-house mr-1.5"></i> Trang chủ
                    </a>
                    <a href="/storybooks" class="transition-colors hover:text-amber-400 ${currentPath.startsWith("/storybooks") ? "text-amber-400" : "text-gray-700 dark:text-gray-300"}">
                        <i class="fa-solid fa-book mr-1.5"></i> Bộ truyện
                    </a>
                    <a href="/storyverses" class="transition-colors hover:text-amber-400 ${currentPath.startsWith("/storyverses") ? "text-amber-400" : "text-gray-700 dark:text-gray-300"}">
                        <i class="fa-solid fa-earth-asia mr-1.5"></i> Vũ trụ truyện
                    </a>
                    <a href="/characters" class="transition-colors hover:text-amber-400 ${currentPath.startsWith("/characters") ? "text-amber-400" : "text-gray-700 dark:text-gray-300"}">
                        <i class="fa-solid fa-users mr-1.5"></i> Nhân vật
                    </a>
                    ${user && user.is_creator ? html`
                    <a href="/creator" class="transition-colors hover:text-amber-400 ${currentPath.startsWith("/creator") ? "text-amber-400" : "text-gray-700 dark:text-gray-300"}">
                        <i class="fa-solid fa-feather-pointed mr-1.5"></i> Nhà sáng tạo
                    </a>
                    ` : ""}
                    ${isAdmin ? html`
                    <a href="/admin" class="transition-colors hover:text-amber-400 ${currentPath.startsWith("/admin") ? "text-amber-400" : "text-gray-700 dark:text-gray-300"}">
                        <i class="fa-solid fa-user-shield mr-1.5"></i> Admin
                    </a>
                    ` : ""}
                    ${user ? html`
                    <a href="/notifications" class="transition-colors hover:text-amber-400 ${currentPath === "/notifications" ? "text-amber-400" : "text-gray-700 dark:text-gray-300"} relative">
                        <i class="fa-solid fa-bell mr-1.5"></i> Thông báo
                        ${unreadNotifsCount > 0 ? html`<span class="absolute -top-1.5 -right-2 bg-red-500 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">${unreadNotifsCount}</span>` : ""}
                    </a>
                    ` : ""}
                </nav>
            </div>

            <!-- User Auth Profile -->
            <div class="flex items-center space-x-4">
                <button onclick="setNextTheme()" class="p-2 text-gray-600 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" title="Chuyển chế độ giao diện">
                    <i id="theme-toggle-icon" class="fa-solid fa-desktop"></i>
                </button>
                ${user ? html`
                <div class="relative inline-block text-left" id="user-menu-container">
                    <button onclick="toggleUserMenu()" class="flex items-center space-x-3 group focus:outline-none">
                        <div class="hidden sm:flex flex-col items-end text-right">
                            <span class="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-amber-400 transition-colors">${user.display_name}</span>
                            <span class="text-xs text-amber-500 font-medium">@${user.username} ${user.is_owner ? "(Owner)" : user.is_admin ? "(Admin)" : ""}</span>
                        </div>
                        <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center text-amber-400 font-bold uppercase ring-2 ring-amber-500/20 group-hover:scale-105 transition-transform cursor-pointer">
                            ${user.display_name.charAt(0)}
                        </div>
                    </button>
                    
                    <!-- Dropdown menu -->
                    <div id="user-dropdown-menu" class="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-[#161925] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50 origin-top-right">
                        <a href="/profile/${user.username}" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-amber-500 transition-colors">
                            <i class="fa-regular fa-user mr-2 w-4 text-center"></i> Trang cá nhân
                        </a>
                        <a href="/settings" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-amber-500 transition-colors">
                            <i class="fa-solid fa-gear mr-2 w-4 text-center"></i> Cài đặt
                        </a>
                        <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                        <button onclick="logout()" class="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <i class="fa-solid fa-right-from-bracket mr-2 w-4 text-center"></i> Đăng xuất
                        </button>
                    </div>
                </div>
                ` : html`
                <div class="flex items-center space-x-3">
                    <button onclick="openAuthModal('login')" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white transition-colors">Đăng nhập</button>
                    <button onclick="openAuthModal('register')" class="px-4 py-2 text-sm font-semibold text-black bg-gradient-to-r from-amber-500 to-yellow-400 rounded-lg hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10">Đăng ký</button>
                </div>
                `}
            </div>
        </div>
    </header>

    <!-- Mobile Navigation Menu (Hidden by default) -->
    <div id="mobile-menu" class="hidden md:hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161925] px-4 py-2 space-y-1">
        <a href="/" class="block px-3 py-2 rounded-md text-base font-medium ${currentPath === "/" ? "bg-gray-100 dark:bg-gray-800 text-amber-500" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"}">
            <i class="fa-solid fa-house w-6 text-center"></i> Trang chủ
        </a>
        <a href="/storybooks" class="block px-3 py-2 rounded-md text-base font-medium ${currentPath.startsWith("/storybooks") ? "bg-gray-100 dark:bg-gray-800 text-amber-500" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"}">
            <i class="fa-solid fa-book w-6 text-center"></i> Bộ truyện
        </a>
        <a href="/storyverses" class="block px-3 py-2 rounded-md text-base font-medium ${currentPath.startsWith("/storyverses") ? "bg-gray-100 dark:bg-gray-800 text-amber-500" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"}">
            <i class="fa-solid fa-earth-asia w-6 text-center"></i> Vũ trụ truyện
        </a>
        <a href="/characters" class="block px-3 py-2 rounded-md text-base font-medium ${currentPath.startsWith("/characters") ? "bg-gray-100 dark:bg-gray-800 text-amber-500" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"}">
            <i class="fa-solid fa-users w-6 text-center"></i> Nhân vật
        </a>
        ${user && user.is_creator ? html`
        <a href="/creator" class="block px-3 py-2 rounded-md text-base font-medium ${currentPath.startsWith("/creator") ? "bg-gray-100 dark:bg-gray-800 text-amber-500" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"}">
            <i class="fa-solid fa-feather-pointed w-6 text-center"></i> Nhà sáng tạo
        </a>
        ` : ""}
        ${isAdmin ? html`
        <a href="/admin" class="block px-3 py-2 rounded-md text-base font-medium ${currentPath.startsWith("/admin") ? "bg-gray-100 dark:bg-gray-800 text-amber-500" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"}">
            <i class="fa-solid fa-user-shield w-6 text-center"></i> Admin
        </a>
        ` : ""}
        ${user ? html`
        <a href="/notifications" class="block px-3 py-2 rounded-md text-base font-medium ${currentPath === "/notifications" ? "bg-gray-100 dark:bg-gray-800 text-amber-500" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"}">
            <i class="fa-solid fa-bell w-6 text-center"></i> Thông báo
            ${unreadNotifsCount > 0 ? html`<span class="ml-2 inline-flex items-center justify-center bg-red-500 text-white font-bold text-xs px-2 py-0.5 rounded-full">${unreadNotifsCount}</span>` : ""}
        </a>
        ` : ""}
    </div>

    <!-- Main Container -->
    <main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        ${content}
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-[#0c0e16] py-8 text-center text-sm text-gray-500 dark:text-gray-500 mt-12">
        <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div class="flex items-center space-x-2">
                <span class="font-semibold text-gray-600 dark:text-gray-400">Storybook</span>
                <span>&copy; ${new Date().getFullYear()} - Nền tảng kể chuyện cộng tác hỗ trợ AI</span>
            </div>
            <div class="flex space-x-6">
                <a href="/mcp/sse" class="hover:text-amber-400 transition-colors" target="_blank"><i class="fa-solid fa-network-wired mr-1.5"></i> MCP Server</a>
            </div>
        </div>
    </footer>

    <!-- Auth Modal -->
    <div id="authModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center hidden opacity-0 transition-opacity duration-300">
        <div class="bg-white dark:bg-[#161925] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md p-8 relative shadow-2xl transform scale-95 transition-transform duration-300 max-h-[90vh] overflow-y-auto">
            <button onclick="closeAuthModal()" class="absolute top-4 right-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white">
                <i class="fa-solid fa-xmark text-xl"></i>
            </button>

            <h3 id="modalTitle" class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Đăng nhập</h3>

            <form id="authForm" onsubmit="handleAuthSubmit(event)" class="space-y-4">
                <input type="hidden" id="authType" value="login">

                <div>
                    <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Tài khoản (username)</label>
                    <input type="text" id="authUsername" required minlength="3" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Nhập tên tài khoản...">
                </div>

                <div id="displayNameGroup" class="hidden">
                    <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Tên hiển thị (display name)</label>
                    <input type="text" id="authDisplayName" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Tên hiển thị công khai...">
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Mật khẩu</label>
                    <input type="password" id="authPassword" required minlength="4" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="••••••••">
                </div>

                <div id="authError" class="text-red-400 text-sm hidden py-1"></div>

                <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10 mt-6">
                    Xác nhận
                </button>
            </form>

            <div class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800/60 pt-4">
                <span id="switchAuthPrompt">Chưa có tài khoản?</span>
                <button onclick="toggleAuthType()" id="switchAuthBtn" class="text-amber-400 font-semibold hover:underline ml-1">Đăng ký ngay</button>
            </div>
        </div>
    </div>

    <!-- Global Client Script -->
    <script>
        function toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu');
            if (menu) {
                menu.classList.toggle('hidden');
            }
        }

        function toggleUserMenu() {
            const menu = document.getElementById('user-dropdown-menu');
            if (menu) {
                menu.classList.toggle('hidden');
            }
        }
        
        if (typeof window !== 'undefined') {
            window.addEventListener('click', function(e) {
                const container = document.getElementById('user-menu-container');
                if (container && !container.contains(e.target)) {
                    const menu = document.getElementById('user-dropdown-menu');
                    if (menu && !menu.classList.contains('hidden')) {
                        menu.classList.add('hidden');
                    }
                }
            });
        }

        function openAuthModal(type = 'login') {
            const modal = document.getElementById('authModal');
            const typeInput = document.getElementById('authType');
            const title = document.getElementById('modalTitle');
            const nameGroup = document.getElementById('displayNameGroup');
            const prompt = document.getElementById('switchAuthPrompt');
            const switchBtn = document.getElementById('switchAuthBtn');
            const errDiv = document.getElementById('authError');

            errDiv.classList.add('hidden');
            typeInput.value = type;

            if (type === 'login') {
                title.innerText = 'Đăng nhập';
                nameGroup.classList.add('hidden');
                prompt.innerText = 'Chưa có tài khoản?';
                switchBtn.innerText = 'Đăng ký ngay';
            } else {
                title.innerText = 'Tạo tài khoản';
                nameGroup.classList.remove('hidden');
                prompt.innerText = 'Đã có tài khoản?';
                switchBtn.innerText = 'Đăng nhập';
            }

            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modal.querySelector('div').classList.remove('scale-95');
            }, 10);
        }

        function closeAuthModal() {
            const modal = document.getElementById('authModal');
            modal.classList.add('opacity-0');
            modal.querySelector('div').classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }

        function toggleAuthType() {
            const currentType = document.getElementById('authType').value;
            openAuthModal(currentType === 'login' ? 'register' : 'login');
        }

        async function handleAuthSubmit(e) {
            e.preventDefault();
            const type = document.getElementById('authType').value;
            const username = document.getElementById('authUsername').value;
            const password = document.getElementById('authPassword').value;
            const display_name = document.getElementById('authDisplayName').value;
            const errDiv = document.getElementById('authError');

            errDiv.classList.add('hidden');

            const url = type === 'login' ? '/api/auth/login' : '/api/auth/register';
            const body = { username, password };
            if (type === 'register' && display_name) body.display_name = display_name;

            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const data = await res.json();
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
                const res = await fetch('/api/likes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ target_type: type, target_id: id })
                });
                const data = await res.json();
                if (data.success) {
                    const icon = btnEl.querySelector('i');
                    const text = btnEl.querySelector('span');
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
    </script>
</body>
</html>`;
}
