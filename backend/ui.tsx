/** @jsxImportSource npm:hono@4.5.11/jsx */
import { html } from "npm:hono/html";
import * as db from "./db.ts";

// General HTML Layout Wrapper
export function layout(title: string, content: any, user: db.User | null, currentPath = "/") {
  const isAdmin = user ? (user.is_admin || user.is_owner) : false;

  return html`<!DOCTYPE html>
<html lang="vi" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | StoryWeave</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
                        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <!-- Google Fonts & FontAwesome Icons -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
        .reader-font {
            font-family: 'Georgia', serif;
        }
        /* Hide scrollbar but keep functionality */
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
</head>
<body class="bg-[#0f111a] text-gray-100 min-h-screen flex flex-col selection:bg-yellow-500 selection:text-black">

    <!-- Header / Navbar -->
    <header class="border-b border-gray-800 bg-[#161925]/90 backdrop-blur sticky top-0 z-50 transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div class="flex items-center space-x-8">
                <!-- Logo -->
                <a href="/" class="flex items-center space-x-2 group">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-yellow-500/10 group-hover:scale-105 transition-transform">
                        S
                    </div>
                    <span class="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-gray-200 to-amber-400 bg-clip-text text-transparent">StoryWeave</span>
                </a>

                <!-- Navigation Links -->
                <nav class="hidden md:flex items-center space-x-6 text-sm font-medium">
                    <a href="/" class="transition-colors hover:text-amber-400 ${currentPath === "/" ? "text-amber-400" : "text-gray-300"}">
                        <i class="fa-solid fa-house mr-1.5"></i> Trang chủ
                    </a>
                    <a href="/storyverses" class="transition-colors hover:text-amber-400 ${currentPath.startsWith("/storyverses") ? "text-amber-400" : "text-gray-300"}">
                        <i class="fa-solid fa-earth-asia mr-1.5"></i> Vũ trụ truyện
                    </a>
                    ${user ? html`
                    <a href="/creator" class="transition-colors hover:text-amber-400 ${currentPath.startsWith("/creator") ? "text-amber-400" : "text-gray-300"}">
                        <i class="fa-solid fa-feather-pointed mr-1.5"></i> Nhà sáng tạo
                    </a>
                    ` : ""}
                    ${isAdmin ? html`
                    <a href="/admin" class="transition-colors hover:text-amber-400 ${currentPath.startsWith("/admin") ? "text-amber-400" : "text-gray-300"}">
                        <i class="fa-solid fa-user-shield mr-1.5"></i> Admin
                    </a>
                    ` : ""}
                </nav>
            </div>

            <!-- User Auth Profile -->
            <div class="flex items-center space-x-4">
                ${user ? html`
                <div class="flex items-center space-x-3">
                    <div class="hidden sm:flex flex-col items-end text-right">
                        <span class="text-sm font-semibold text-gray-200">${user.display_name}</span>
                        <span class="text-xs text-amber-500 font-medium">@${user.username} ${user.is_owner ? "(Owner)" : user.is_admin ? "(Admin)" : ""}</span>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-amber-400 font-bold uppercase ring-2 ring-amber-500/20">
                        ${user.display_name.charAt(0)}
                    </div>
                    <button onclick="logout()" class="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Đăng xuất">
                        <i class="fa-solid fa-right-from-bracket text-lg"></i>
                    </button>
                </div>
                ` : html`
                <div class="flex items-center space-x-3">
                    <button onclick="openAuthModal('login')" class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Đăng nhập</button>
                    <button onclick="openAuthModal('register')" class="px-4 py-2 text-sm font-semibold text-black bg-gradient-to-r from-amber-500 to-yellow-400 rounded-lg hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10">Đăng ký</button>
                </div>
                `}
            </div>
        </div>
    </header>

    <!-- Main Container -->
    <main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        ${content}
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-800 bg-[#0c0e16] py-8 text-center text-sm text-gray-500 mt-12">
        <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div class="flex items-center space-x-2">
                <span class="font-semibold text-gray-400">StoryWeave</span>
                <span>&copy; ${new Date().getFullYear()} - Nền tảng kể chuyện cộng tác hỗ trợ AI</span>
            </div>
            <div class="flex space-x-6">
                <a href="/mcp/sse" class="hover:text-amber-400 transition-colors" target="_blank"><i class="fa-solid fa-network-wired mr-1.5"></i> MCP Server</a>
                <a href="https://val.town" class="hover:text-amber-400 transition-colors" target="_blank"><i class="fa-solid fa-code mr-1.5"></i> View Source</a>
            </div>
        </div>
    </footer>

    <!-- Auth Modal -->
    <div id="authModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center hidden opacity-0 transition-opacity duration-300">
        <div class="bg-[#161925] border border-gray-800 rounded-2xl w-full max-w-md p-8 relative shadow-2xl transform scale-95 transition-transform duration-300">
            <button onclick="closeAuthModal()" class="absolute top-4 right-4 text-gray-400 hover:text-white">
                <i class="fa-solid fa-xmark text-xl"></i>
            </button>

            <h3 id="modalTitle" class="text-2xl font-bold text-white mb-6">Đăng nhập</h3>

            <form id="authForm" onsubmit="handleAuthSubmit(event)" class="space-y-4">
                <input type="hidden" id="authType" value="login">

                <div>
                    <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tài khoản (username)</label>
                    <input type="text" id="authUsername" required minlength="3" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Nhập tên tài khoản...">
                </div>

                <div id="displayNameGroup" class="hidden">
                    <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tên hiển thị (display name)</label>
                    <input type="text" id="authDisplayName" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Tên hiển thị công khai...">
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mật khẩu</label>
                    <input type="password" id="authPassword" required minlength="4" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="••••••••">
                </div>

                <div id="authError" class="text-red-400 text-sm hidden py-1"></div>

                <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10 mt-6">
                    Xác nhận
                </button>
            </form>

            <div class="mt-6 text-center text-sm text-gray-400 border-t border-gray-800/60 pt-4">
                <span id="switchAuthPrompt">Chưa có tài khoản?</span>
                <button onclick="toggleAuthType()" id="switchAuthBtn" class="text-amber-400 font-semibold hover:underline ml-1">Đăng ký ngay</button>
            </div>
        </div>
    </div>

    <!-- Global Client Script -->
    <script>
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

// Homepage View
export function renderHomepage(storybooks: db.Storybook[], progress: db.ReadingProgress[], user: db.User | null) {
  // Compute Categories from books
  const allCategories = new Set<string>();
  storybooks.forEach(b => {
    b.categories.split(",").forEach(c => {
      const cat = c.trim();
      if (cat) allCategories.add(cat);
    });
  });

  return html`
    <!-- Hero Banner -->
    <section class="relative bg-gradient-to-r from-amber-600/10 via-yellow-500/5 to-transparent border border-amber-500/10 rounded-3xl p-8 sm:p-12 mb-12 flex flex-col md:flex-row items-center justify-between overflow-hidden">
        <div class="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none"></div>

        <div class="space-y-6 max-w-2xl text-left">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <i class="fa-solid fa-sparkles mr-1.5"></i> Kỷ Nguyên Kể Chuyện Cộng Tác
            </span>
            <h1 class="text-4xl sm:text-5xl font-black text-white leading-tight">
                Nơi Thế Giới Truyện Được <span class="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">Dệt Nên</span> Cùng Nhau
            </h1>
            <p class="text-gray-400 text-lg leading-relaxed">
                Đọc, sáng tạo và mở rộng các vũ trụ cốt truyện đa chiều. Kết hợp giữa trí tuệ cộng đồng và AI Assistant thông minh để tạo nên những tác phẩm bất hủ.
            </p>
            <div class="flex flex-wrap gap-4 pt-2">
                <a href="#discover" class="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl shadow-lg shadow-yellow-500/15 hover:brightness-110 transition-all flex items-center space-x-2">
                    <span>Khám phá ngay</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </a>
                <a href="/storyverses" class="px-6 py-3 bg-gray-800 border border-gray-700 text-white font-semibold rounded-xl hover:bg-gray-700/80 transition-all flex items-center space-x-2">
                    <i class="fa-solid fa-earth-asia"></i>
                    <span>Xem các vũ trụ</span>
                </a>
            </div>
        </div>

        <!-- Decorative Book Stack / Illustration -->
        <div class="hidden lg:block relative w-80 h-64">
            <img src="https://maxm-imggenurl.web.val.run/a-beautiful-mystical-golden-book-opening-with-stardust-and-constellations-fantasy-dark-background" alt="Mystical Book" class="w-full h-full object-cover rounded-2xl shadow-2xl border border-gray-800/80 hover:rotate-2 transition-transform duration-500">
        </div>
    </section>

    <!-- Reading Progress Section (Đọc tiếp) -->
    ${progress && progress.length > 0 ? html`
    <section class="mb-12">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl sm:text-2xl font-bold flex items-center text-white">
                <i class="fa-solid fa-clock-rotate-left mr-2.5 text-amber-500"></i> Đọc tiếp
            </h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            ${progress.map(p => html`
            <a href="/storybook/${p.storybook_id}/chapter/${p.chapter_number}" class="group p-5 bg-[#161925] border border-gray-800 rounded-2xl hover:border-amber-500/40 hover:bg-[#1a1e2e]/90 transition-all flex justify-between items-center shadow-lg">
                <div class="space-y-1.5 flex-grow pr-4">
                    <h3 class="font-bold text-gray-200 group-hover:text-amber-400 transition-colors line-clamp-1">${p.storybook_title}</h3>
                    <p class="text-xs text-gray-400">Đang đọc Chương ${p.chapter_number}</p>
                    <span class="text-[10px] text-gray-500 block">Cập nhật: ${new Date(p.updated_at).toLocaleDateString("vi-VN")}</span>
                </div>
                <div class="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-colors">
                    <i class="fa-solid fa-play ml-0.5 text-sm"></i>
                </div>
            </a>
            `)}
        </div>
    </section>
    ` : ""}

    <!-- Categories Filters -->
    <section id="discover" class="mb-10">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div class="space-y-1">
                <h2 class="text-2xl sm:text-3xl font-extrabold text-white">Khám Phá Tác Phẩm</h2>
                <p class="text-sm text-gray-400">Lọc qua các bộ truyện độc đáo được đóng góp bởi cộng đồng.</p>
            </div>

            <!-- Category Chips -->
            <div class="flex flex-wrap gap-2.5 max-w-xl">
                <button onclick="filterCategory('All')" class="category-chip px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-black border border-amber-500 transition-all">Tất cả</button>
                ${Array.from(allCategories).map(cat => html`
                <button onclick="filterCategory('${cat}')" class="category-chip px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-800 text-gray-300 border border-gray-700/80 hover:bg-gray-700 hover:text-white transition-all">${cat}</button>
                `)}
            </div>
        </div>

        <!-- Storybooks Grid -->
        <div id="booksGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${storybooks.map(b => html`
            <article data-categories="${b.categories}" class="book-card group bg-[#161925]/40 border border-gray-800 hover:border-gray-700/80 rounded-2xl overflow-hidden flex flex-col hover:translate-y-[-4px] transition-all duration-300 shadow-xl">
                <!-- Cover Image Placeholder (gradient-mesh style) -->
                <div class="h-40 bg-gradient-to-br from-amber-600/20 via-slate-800 to-yellow-600/10 p-6 flex flex-col justify-end relative overflow-hidden border-b border-gray-800">
                    <div class="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-cover" style="background-image: url('https://maxm-imggenurl.web.val.run/a-minimalistic-fantasy-novel-cover-illustration-art-style')"></div>
                    <div class="absolute top-4 right-4 flex space-x-1.5">
                        ${b.allow_other_author_edit ? html`
                        <span class="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold" title="Những người dùng khác được phép đồng sáng tác"><i class="fa-solid fa-users mr-1"></i> Cộng tác</span>
                        ` : html`
                        <span class="px-2 py-0.5 rounded bg-gray-500/20 text-gray-400 text-[10px] font-bold"><i class="fa-solid fa-lock mr-1"></i> Đóng</span>
                        `}
                    </div>

                    <div class="flex flex-wrap gap-1.5 mb-2">
                        ${b.categories.split(",").map(cat => html`
                        <span class="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">${cat.trim()}</span>
                        `)}
                    </div>
                </div>

                <!-- Book Body -->
                <div class="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div class="space-y-2 text-left">
                        <a href="/storybook/${b.id}">
                            <h3 class="text-xl font-bold text-gray-100 group-hover:text-amber-400 transition-colors line-clamp-1">${b.title}</h3>
                        </a>
                        <p class="text-sm text-gray-400 line-clamp-3 leading-relaxed">${b.description}</p>
                    </div>

                    <div class="pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                        <span class="font-medium text-gray-300"><i class="fa-solid fa-pen-nib mr-1.5 text-amber-500/80"></i>${b.authors.split(",")[0]}</span>
                        <div class="flex items-center space-x-3">
                            <span><i class="fa-solid fa-book-open mr-1"></i> ${b.chapters_count || 0} ch</span>
                            <button onclick="toggleLike('storybook', '${b.id}', this)" class="hover:text-red-400 transition-colors flex items-center space-x-1">
                                <i class="fa-regular fa-heart"></i>
                                <span>${b.likes_count || 0}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </article>
            `)}
        </div>
    </section>

    <script>
        function filterCategory(cat) {
            // Update chips active state
            const chips = document.querySelectorAll('.category-chip');
            chips.forEach(chip => {
                if (chip.innerText === cat || (cat === 'All' && chip.innerText === 'Tất cả')) {
                    chip.className = 'category-chip px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-black border border-amber-500 transition-all';
                } else {
                    chip.className = 'category-chip px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-800 text-gray-300 border border-gray-700/80 hover:bg-gray-700 hover:text-white transition-all';
                }
            });

            // Filter cards
            const cards = document.querySelectorAll('.book-card');
            cards.forEach(card => {
                if (cat === 'All') {
                    card.style.display = 'flex';
                } else {
                    const cats = card.getAttribute('data-categories') || '';
                    if (cats.includes(cat)) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        }
    </script>
  `;
}

// Storyverses directory list view
export function renderStoryverses(storyverses: db.Storyverse[]) {
  return html`
    <div class="space-y-4 text-left max-w-4xl mx-auto mb-10">
        <h1 class="text-3xl font-black text-white">Vũ Trụ Cốt Truyện</h1>
        <p class="text-gray-400">Các vũ trụ cốt truyện (Storyverses) là nơi kết nối nhiều bộ truyện và chia sẻ chung một dàn nhân vật phong phú.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        ${storyverses.map(sv => html`
        <div class="p-6 bg-[#161925]/60 border border-gray-800 rounded-2xl space-y-4 text-left shadow-lg">
            <div class="space-y-1">
                <a href="/storyverses/${sv.id}">
                    <h3 class="text-2xl font-bold text-amber-400 hover:underline">${sv.title}</h3>
                </a>
                <span class="text-xs text-gray-500 block">Sáng lập bởi: @${sv.author}</span>
            </div>

            <p class="text-gray-300 text-sm leading-relaxed">${sv.description}</p>

            <div class="flex items-center justify-between pt-4 border-t border-gray-800/80 text-xs text-gray-400">
                <span class="font-medium"><i class="fa-solid fa-calendar mr-1.5"></i> ${new Date(sv.created_at).toLocaleDateString("vi-VN")}</span>
                <div class="flex space-x-4">
                    <span><i class="fa-solid fa-heart mr-1"></i> ${sv.likes_count || 0}</span>
                    <span><i class="fa-solid fa-comments mr-1"></i> ${sv.comments_count || 0}</span>
                </div>
            </div>
        </div>
        `)}
    </div>
  `;
}

// Individual Storyverse view with Characters & Books
export function renderStoryverseDetail(sv: db.Storyverse, characters: db.SharedCharacter[]) {
  return html`
    <div class="max-w-4xl mx-auto space-y-8 text-left">
        <!-- Header -->
        <div class="p-8 bg-gradient-to-tr from-[#161925] via-[#10131f] to-amber-900/10 border border-gray-800 rounded-3xl relative">
            <span class="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-md text-xs font-semibold"><i class="fa-solid fa-earth-asia mr-1"></i> Vũ trụ cốt truyện</span>
            <h1 class="text-4xl font-extrabold text-white mt-4 mb-2">${sv.title}</h1>
            <p class="text-sm text-gray-400">Sáng tạo bởi: <span class="text-gray-200">@${sv.author}</span> &bull; ${new Date(sv.created_at).toLocaleDateString("vi-VN")}</p>
            <p class="text-gray-300 text-base mt-4 leading-relaxed">${sv.description}</p>

            <button onclick="toggleLike('storyverse', '${sv.id}', this)" class="absolute top-8 right-8 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700/60 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all">
                <i class="fa-regular fa-heart"></i>
                <span>${sv.likes_count || 0} thích</span>
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Books in Universe -->
            <div class="space-y-4">
                <h2 class="text-xl font-bold text-white border-b border-gray-800 pb-2"><i class="fa-solid fa-book mr-2 text-amber-500"></i> Các bộ truyện liên quan</h2>
                ${sv.storybook_list && sv.storybook_list.length > 0 ? html`
                <div class="space-y-3">
                    ${sv.storybook_list.map(b => html`
                    <a href="/storybook/${b.id}" class="block p-4 bg-[#161925]/40 border border-gray-800 hover:border-amber-500/40 rounded-xl hover:bg-[#1a1e2e]/30 transition-all">
                        <h4 class="font-bold text-gray-200">${b.title}</h4>
                        <span class="text-xs text-gray-400 block mt-1">Tác giả: ${b.authors}</span>
                    </a>
                    `)}
                </div>
                ` : html`<p class="text-sm text-gray-500 italic">Chưa có truyện nào thuộc vũ trụ này.</p>`}
            </div>

            <!-- Shared Characters in Universe -->
            <div class="space-y-4">
                <h2 class="text-xl font-bold text-white border-b border-gray-800 pb-2"><i class="fa-solid fa-users mr-2 text-amber-500"></i> Nhân vật dùng chung</h2>
                ${characters && characters.length > 0 ? html`
                <div class="space-y-3">
                    ${characters.map(c => html`
                    <div class="p-4 bg-[#161925]/40 border border-gray-800 rounded-xl">
                        <h4 class="font-bold text-amber-400">${c.name}</h4>
                        <span class="text-[10px] text-gray-500 block">Tạo bởi: @${c.author}</span>
                        <p class="text-xs text-gray-300 mt-2 whitespace-pre-wrap">${c.other_info}</p>
                    </div>
                    `)}
                </div>
                ` : html`<p class="text-sm text-gray-500 italic">Chưa có nhân vật nào trong vũ trụ này.</p>`}
            </div>
        </div>

        <!-- Comments Area -->
        ${renderCommentsArea("storyverse", sv.id)}
    </div>
  `;
}

// Comments Feed and Form template (shared on book and storyverse detail pages)
function renderCommentsArea(target_type: string, target_id: string) {
  return html`
    <div class="pt-8 border-t border-gray-800 text-left space-y-6">
        <h2 class="text-xl font-bold text-white"><i class="fa-solid fa-comments mr-2 text-amber-500"></i> Bình luận cộng đồng</h2>

        <!-- Add Comment Form -->
        <form onsubmit="handleCommentSubmit(event, '${target_type}', '${target_id}')" class="space-y-3 bg-[#161925]/40 p-4 rounded-xl border border-gray-800">
            <textarea id="commentContent" required rows="3" class="w-full bg-[#0f111a] border border-gray-800 focus:border-amber-500 text-white rounded-xl p-3 text-sm focus:outline-none transition-colors" placeholder="Viết bình luận của bạn tại đây..."></textarea>
            <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">Bình luận văn minh lịch sự và tôn trọng người khác.</span>
                <button type="submit" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-lg transition-colors shadow">Bình luận</button>
            </div>
        </form>

        <!-- Nested Comments List -->
        <div id="commentsFeed" class="space-y-4">
            <p class="text-sm text-gray-500 italic">Đang tải bình luận...</p>
        </div>
    </div>

    <script>
        // Load Comments on page load
        async function loadComments() {
            try {
                const res = await fetch('/api/comments/${target_type}/${target_id}');
                const data = await res.json();
                if (data.success) {
                    const container = document.getElementById('commentsFeed');
                    if (data.comments.length === 0) {
                        container.innerHTML = '<p class="text-sm text-gray-500 italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>';
                        return;
                    }

                    container.innerHTML = '';
                    data.comments.forEach(c => {
                        container.appendChild(createCommentElement(c));
                    });
                }
            } catch (err) {
                console.error(err);
            }
        }

        function createCommentElement(c, isReply = false) {
            const div = document.createElement('div');
            div.className = \`flex space-x-3 p-4 bg-[#161925]/30 border border-gray-800 rounded-xl \${isReply ? 'ml-8 bg-[#0c0e16]/40' : ''}\`;

            let repliesHtml = '';
            if (c.replies && c.replies.length > 0) {
                repliesHtml = '<div class="space-y-3 mt-3 w-full">';
                c.replies.forEach(rep => {
                    repliesHtml += \`<div class="flex space-x-3 p-3 bg-[#0c0e16]/50 border border-gray-850 rounded-lg ml-6">
                        <div class="flex-grow">
                            <div class="flex items-center justify-between text-[11px] mb-1">
                                <span class="font-bold text-gray-300">\${rep.author_display_name} <span class="text-amber-500 font-medium">@\${rep.author}</span></span>
                                <span class="text-gray-500">\${new Date(rep.created_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <p class="text-xs text-gray-300">\${rep.content}</p>
                        </div>
                    </div>\`;
                });
                repliesHtml += '</div>';
            }

            div.innerHTML = \`
                <div class="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-amber-400 font-bold text-xs uppercase flex-shrink-0">
                    \${c.author_display_name.charAt(0)}
                </div>
                <div class="flex-grow text-left">
                    <div class="flex items-center justify-between text-xs mb-1">
                        <span class="font-bold text-gray-300">\${c.author_display_name} <span class="text-amber-500 font-medium">@\${c.author}</span></span>
                        <span class="text-gray-500">\${new Date(c.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p class="text-sm text-gray-200 leading-relaxed">\${c.content}</p>

                    <div class="flex items-center space-x-4 mt-2">
                        <button onclick="showReplyForm('\${c.id}', this)" class="text-[11px] text-gray-500 hover:text-amber-400 transition-colors font-medium"><i class="fa-solid fa-reply mr-1"></i> Trả lời</button>
                    </div>

                    <div id="replyFormContainer_\${c.id}" class="hidden mt-3">
                        <form onsubmit="handleCommentSubmit(event, '${target_type}', '${target_id}', '\${c.id}')" class="flex space-x-2">
                            <input type="text" id="replyContent_\${c.id}" required class="flex-grow bg-[#0f111a] border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500" placeholder="Viết phản hồi...">
                            <button type="submit" class="px-3 py-1.5 bg-amber-500 text-black font-semibold text-xs rounded-lg hover:bg-amber-600 transition-colors">Gửi</button>
                        </form>
                    </div>

                    \${repliesHtml}
                </div>
            \`;
            return div;
        }

        function showReplyForm(commentId, btn) {
            const container = document.getElementById(\`replyFormContainer_\${commentId}\`);
            container.classList.toggle('hidden');
        }

        async function handleCommentSubmit(e, type, id, replyTo = '') {
            e.preventDefault();
            const textarea = replyTo ? document.getElementById(\`replyContent_\${replyTo}\`) : document.getElementById('commentContent');
            const content = textarea.value.trim();
            if (!content) return;

            try {
                const res = await fetch('/api/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, target_type: type, target_id: id, reply_to: replyTo || null })
                });
                const data = await res.json();
                if (data.success) {
                    textarea.value = '';
                    if (replyTo) {
                        document.getElementById(\`replyFormContainer_\${replyTo}\`).classList.add('hidden');
                    }
                    loadComments();
                } else {
                    openAuthModal('login');
                }
            } catch (err) {
                console.error(err);
            }
        }

        // Load comments on ready
        setTimeout(loadComments, 100);
    </script>
  `;
}

// Storybook detail page View
export function renderStorybookDetail(book: db.Storybook, chapters: Omit<db.Chapter, "content">[], user: db.User | null) {
  const allowEdit = book.allow_other_author_edit;

  return html`
    <div class="max-w-4xl mx-auto space-y-8 text-left">
        <!-- Breadcrumb / Header Cover -->
        <div class="p-8 bg-gradient-to-br from-[#161925] via-slate-900 to-amber-950/20 border border-gray-800 rounded-3xl relative">
            <div class="flex flex-wrap gap-1.5 mb-3">
                ${book.categories.split(",").map(c => html`
                <span class="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">${c.trim()}</span>
                `)}
            </div>

            <h1 class="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-2">${book.title}</h1>
            <p class="text-sm text-gray-400 mb-4">
                Bởi: <span class="font-medium text-gray-300">${book.authors}</span> &bull; Phát hành: ${new Date(book.created_at).toLocaleDateString("vi-VN")}
            </p>

            <p class="text-gray-300 text-sm leading-relaxed">${book.description}</p>

            <div class="flex flex-wrap gap-3 mt-6">
                ${chapters && chapters.length > 0 ? html`
                <a href="/storybook/${book.id}/chapter/1" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl shadow-lg shadow-yellow-500/10 flex items-center space-x-1.5 transition-colors">
                    <i class="fa-solid fa-book-open"></i>
                    <span>Đọc từ đầu (Chương 1)</span>
                </a>
                ` : html`
                <button class="px-4 py-2 bg-gray-800 text-gray-500 text-xs rounded-xl cursor-not-allowed font-semibold" disabled>Chưa có chương</button>
                `}

                ${book.storyverse_id ? html`
                <a href="/storyverses/${book.storyverse_id}" class="px-4 py-2 bg-gray-800 border border-gray-700 hover:bg-gray-700/80 text-white font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1.5">
                    <i class="fa-solid fa-earth-asia text-amber-400"></i>
                    <span>Vũ trụ cốt truyện</span>
                </a>
                ` : ""}
            </div>

            <!-- Side action floats -->
            <div class="absolute top-8 right-8 flex flex-col space-y-2">
                <button onclick="toggleLike('storybook', '${book.id}', this)" class="px-3.5 py-1.5 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700/60 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all">
                    <i class="fa-regular fa-heart"></i>
                    <span>${book.likes_count || 0}</span>
                </button>

                ${allowEdit ? html`
                <span class="px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold text-center"><i class="fa-solid fa-users mr-1"></i> Cho phép đồng tác giả</span>
                ` : ""}
            </div>
        </div>

        <!-- Chapters & Summary Area -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Side: Chapters List -->
            <div class="lg:col-span-2 space-y-4">
                <h3 class="text-xl font-bold text-white border-b border-gray-800 pb-2"><i class="fa-solid fa-list mr-2 text-amber-500"></i> Mục lục chương (${chapters.length})</h3>

                ${chapters && chapters.length > 0 ? html`
                <div class="space-y-2">
                    ${chapters.map(ch => html`
                    <a href="/storybook/${book.id}/chapter/${ch.chapter_number}" class="flex items-center justify-between p-4 bg-[#161925]/40 border border-gray-800 hover:border-amber-500/40 rounded-xl hover:bg-[#1a1e2e]/30 transition-all group">
                        <div class="text-left space-y-1">
                            <h4 class="font-bold text-gray-200 group-hover:text-amber-400 transition-colors">Chương ${ch.chapter_number}: ${ch.title}</h4>
                            <p class="text-xs text-gray-400 line-clamp-1 italic">Tóm tắt: ${ch.summary || "Chưa có tóm tắt"}</p>
                        </div>
                        <i class="fa-solid fa-chevron-right text-gray-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all"></i>
                    </a>
                    `)}
                </div>
                ` : html`
                <div class="p-8 text-center border border-dashed border-gray-800 rounded-2xl">
                    <i class="fa-solid fa-book-open-reader text-gray-600 text-3xl mb-3"></i>
                    <p class="text-sm text-gray-500">Truyện này chưa có chương nào được viết.</p>
                </div>
                `}
            </div>

            <!-- Right Side: Collaboration / AI context card -->
            <div class="space-y-4">
                <div class="p-5 bg-gradient-to-tr from-[#161925] to-[#1d2133] border border-gray-800 rounded-2xl text-left space-y-4 shadow-lg">
                    <h4 class="font-bold text-amber-400 flex items-center">
                        <i class="fa-solid fa-robot mr-2"></i> Trợ lý viết tiếp (AI)
                    </h4>
                    <p class="text-xs text-gray-300 leading-relaxed">
                        Bạn có muốn viết tiếp cho bộ truyện này? Hệ thống của chúng tôi hỗ trợ tự động **gói tóm tắt các chương** trước đó và gửi trực tiếp sang AI để nó tiếp thu cốt truyện nhanh nhất mà không bị quá tải ngữ cảnh.
                    </p>
                    <div class="p-3 bg-[#0f111a] rounded-lg border border-gray-850">
                        <span class="text-[10px] uppercase font-semibold text-gray-500 block">Lợi thế tóm tắt:</span>
                        <p class="text-[11px] text-amber-500/90 mt-1"><i class="fa-solid fa-check mr-1"></i> Tiết kiệm 90% dung lượng Token.</p>
                        <p class="text-[11px] text-amber-500/90 mt-0.5"><i class="fa-solid fa-check mr-1"></i> Logic cốt truyện được duy trì hoàn hảo.</p>
                    </div>
                    ${allowEdit || (user && book.authors.toLowerCase().includes(user.username.toLowerCase())) ? html`
                    <a href="/creator?book_id=${book.id}" class="block w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-center font-bold text-xs rounded-lg hover:brightness-110 transition-all">
                        <i class="fa-solid fa-feather-pointed mr-1"></i> Viết chương mới
                    </a>
                    ` : ""}
                </div>
            </div>
        </div>

        <!-- Comments Area -->
        ${renderCommentsArea("storybook", book.id)}
    </div>
  `;
}

// Chapter Reader Page
export function renderChapterReader(book: db.Storybook, chapter: db.Chapter, nextNum: number | null, prevNum: number | null) {
  return html`
    <div class="max-w-3xl mx-auto space-y-8">

        <!-- Breadcrumbs & Actions -->
        <div class="flex items-center justify-between text-xs text-gray-400 border-b border-gray-800 pb-4">
            <a href="/storybook/${book.id}" class="hover:text-amber-400 transition-colors flex items-center space-x-1.5">
                <i class="fa-solid fa-chevron-left"></i>
                <span class="font-semibold text-gray-300">Quay lại: ${book.title}</span>
            </a>

            <div class="flex items-center space-x-3">
                <button onclick="toggleTheme()" class="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors" title="Đổi màu nền">
                    <i class="fa-solid fa-circle-half-stroke"></i>
                </button>
            </div>
        </div>

        <!-- Book & Chapter Title -->
        <div class="text-center space-y-3 pt-4">
            <span class="text-xs uppercase tracking-widest font-semibold text-amber-500">Chương ${chapter.chapter_number}</span>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-white leading-tight font-serif">${chapter.title}</h1>
            <p class="text-xs text-gray-500">Người viết: ${book.authors} &bull; Cập nhật: ${new Date(chapter.created_at).toLocaleDateString("vi-VN")}</p>
        </div>

        <!-- AI Summary Infobox -->
        ${chapter.summary ? html`
        <div class="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-left space-y-2 relative overflow-hidden">
            <div class="absolute -right-8 -bottom-8 text-amber-500/5 text-6xl pointer-events-none">
                <i class="fa-solid fa-robot"></i>
            </div>
            <h4 class="text-xs uppercase tracking-wider font-bold text-amber-400 flex items-center">
                <i class="fa-solid fa-robot mr-1.5"></i> Tóm tắt hỗ trợ AI (AI Summary)
            </h4>
            <p class="text-xs text-gray-300 leading-relaxed italic">${chapter.summary}</p>
        </div>
        ` : ""}

        <!-- Reading Content Box -->
        <article id="readerContent" class="reader-font bg-[#161925]/25 border border-gray-800/50 rounded-3xl p-6 sm:p-10 text-gray-200 text-lg sm:text-xl leading-loose text-justify whitespace-pre-wrap selection:bg-amber-500/20">
            ${chapter.content}
        </article>

        <!-- Chapter Navigation Bar -->
        <div class="flex items-center justify-between pt-8 border-t border-gray-800">
            ${prevNum ? html`
            <a href="/storybook/${book.id}/chapter/${prevNum}" class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5">
                <i class="fa-solid fa-arrow-left"></i>
                <span>Chương trước</span>
            </a>
            ` : html`<span class="text-gray-600 text-xs italic">Chương đầu tiên</span>`}

            <a href="/storybook/${book.id}" class="px-4 py-2 bg-[#161925] border border-gray-800 hover:border-amber-500/30 text-gray-300 text-xs font-semibold rounded-xl transition-all">
                <i class="fa-solid fa-list mr-1"></i> Mục lục
            </a>

            ${nextNum ? html`
            <a href="/storybook/${book.id}/chapter/${nextNum}" class="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-bold rounded-xl shadow shadow-yellow-500/10 hover:brightness-110 transition-all flex items-center space-x-1.5">
                <span>Chương tiếp</span>
                <i class="fa-solid fa-arrow-right"></i>
            </a>
            ` : html`
            <div class="text-right space-y-1">
                <span class="text-xs text-amber-500/80 font-bold block"><i class="fa-solid fa-check-double mr-1"></i> Hết chương</span>
                ${book.allow_other_author_edit ? html`
                <a href="/creator?book_id=${book.id}" class="text-[10px] text-gray-400 hover:text-white transition-colors underline block">Đóng góp chương tiếp?</a>
                ` : ""}
            </div>
            `}
        </div>
    </div>

    <script>
        function toggleTheme() {
            const article = document.getElementById('readerContent');
            if (article.classList.contains('bg-[#161925]/25')) {
                // Light Sepia reading theme
                article.className = 'reader-font bg-[#fdfaf2] border border-amber-200 text-[#2b2b2b] rounded-3xl p-6 sm:p-10 text-lg sm:text-xl leading-loose text-justify whitespace-pre-wrap';
            } else {
                // Back to Dark theme
                article.className = 'reader-font bg-[#161925]/25 border border-gray-800/50 rounded-3xl p-6 sm:p-10 text-gray-200 text-lg sm:text-xl leading-loose text-justify whitespace-pre-wrap selection:bg-amber-500/20';
            }
        }
    </script>
  `;
}

// Creator Dashboard View
export function renderCreatorPanel(books: db.Storybook[], universes: db.Storyverse[], prefillBookId = "") {
  return html`
    <div class="max-w-5xl mx-auto space-y-8 text-left">
        <div class="space-y-2">
            <h1 class="text-3xl font-black text-white"><i class="fa-solid fa-feather-pointed mr-2 text-amber-500"></i> Nhà Sáng Tạo</h1>
            <p class="text-gray-400">Tự do xây dựng tác phẩm, tóm tắt cốt truyện và xuất khẩu dữ liệu phục vụ sáng tác cùng AI.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Navigation Sidebar tabs -->
            <div class="space-y-3 lg:col-span-1">
                <button onclick="switchCreatorTab('newBook')" id="btn-newBook" class="creator-tab-btn w-full p-4 bg-[#161925] border border-amber-500 text-amber-400 font-bold text-sm rounded-xl text-left flex items-center justify-between transition-all">
                    <span><i class="fa-solid fa-book mr-2"></i> Tạo bộ truyện mới</span>
                    <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
                <button onclick="switchCreatorTab('newChapter')" id="btn-newChapter" class="creator-tab-btn w-full p-4 bg-[#161925]/40 border border-gray-800 hover:border-gray-700 text-gray-300 font-semibold text-sm rounded-xl text-left flex items-center justify-between transition-all">
                    <span><i class="fa-solid fa-file-pen mr-2"></i> Thêm/Sửa chương truyện</span>
                    <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
                <button onclick="switchCreatorTab('newUniverse')" id="btn-newUniverse" class="creator-tab-btn w-full p-4 bg-[#161925]/40 border border-gray-800 hover:border-gray-700 text-gray-300 font-semibold text-sm rounded-xl text-left flex items-center justify-between transition-all">
                    <span><i class="fa-solid fa-earth-asia mr-2"></i> Tạo vũ trụ cốt truyện</span>
                    <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
                <button onclick="switchCreatorTab('newCharacter')" id="btn-newCharacter" class="creator-tab-btn w-full p-4 bg-[#161925]/40 border border-gray-800 hover:border-gray-700 text-gray-300 font-semibold text-sm rounded-xl text-left flex items-center justify-between transition-all">
                    <span><i class="fa-solid fa-user-plus mr-2"></i> Tạo nhân vật dùng chung</span>
                    <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
                <button onclick="switchCreatorTab('aiPromptExporter')" id="btn-aiPromptExporter" class="creator-tab-btn w-full p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 text-yellow-400 font-bold text-sm rounded-xl text-left flex items-center justify-between hover:border-amber-500/40 transition-all shadow-md">
                    <span><i class="fa-solid fa-robot mr-2"></i> AI Context Compiler 🌟</span>
                    <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
            </div>

            <!-- Panel Forms -->
            <div class="lg:col-span-2 bg-[#161925]/30 border border-gray-800 rounded-2xl p-6 sm:p-8 relative min-h-[450px]">

                <!-- Tab: Create Storybook -->
                <div id="tabContent-newBook" class="creator-tab-content space-y-6">
                    <div class="border-b border-gray-800 pb-3">
                        <h3 class="text-xl font-bold text-white">Tạo Bộ Truyện Mới</h3>
                        <p class="text-xs text-gray-400">Khai sinh bộ truyện mới của riêng bạn hoặc thuộc về một Vũ trụ dùng chung.</p>
                    </div>
                    <form onsubmit="handleCreateBook(event)" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">ID bộ truyện (Không dấu/khoảng cách)</label>
                                <input type="text" id="bookId" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="tay-du-ky-ngoai-truyen">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tiêu đề bộ truyện</label>
                                <input type="text" id="bookTitle" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Tây Du Ký: Ngoại Truyện">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mô tả cốt truyện</label>
                            <textarea id="bookDescription" required rows="3" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Tóm lược nội dung cốt truyện chính, định hướng..."></textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Thể loại (Ngăn cách bởi dấu phẩy)</label>
                                <input type="text" id="bookCategories" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Huyền Huyễn, Tiên Hiệp, Phiêu Lưu">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Liên kết Vũ trụ (Storyverse)</label>
                                <select id="bookStoryverseId" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-gray-300 focus:outline-none focus:border-amber-500 transition-colors">
                                    <option value="">-- Độc lập --</option>
                                    ${universes.map(u => html`<option value="${u.id}">${u.title}</option>`)}
                                </select>
                            </div>
                        </div>
                        <div class="flex items-center space-x-3 pt-2">
                            <input type="checkbox" id="bookAllowEdit" class="w-4 h-4 rounded border-gray-800 text-amber-500 focus:ring-amber-500 focus:ring-opacity-20 bg-[#0f111a]">
                            <label for="bookAllowEdit" class="text-xs font-semibold text-gray-300 uppercase tracking-wide">Cho phép những người dùng khác cùng viết truyện này (Đồng sáng tác)</label>
                        </div>
                        <div id="newBookError" class="text-red-400 text-xs hidden"></div>
                        <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10">Tạo truyện mới</button>
                    </form>
                </div>

                <!-- Tab: Add/Edit Chapter -->
                <div id="tabContent-newChapter" class="creator-tab-content space-y-6 hidden">
                    <div class="border-b border-gray-800 pb-3">
                        <h3 class="text-xl font-bold text-white">Thêm hoặc Cập nhật Chương truyện</h3>
                        <p class="text-xs text-gray-400">Viết chương mới hoặc hiệu chỉnh chương cũ. Nếu đã tồn tại chương số tương tự, hệ thống sẽ tự động cập nhật.</p>
                    </div>
                    <form onsubmit="handleCreateChapter(event)" class="space-y-4">
                        <div class="grid grid-cols-3 gap-4">
                            <div class="col-span-2">
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Chọn bộ truyện</label>
                                <select id="chapterBookId" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-gray-300 focus:outline-none focus:border-amber-500 transition-colors">
                                    ${books.map(b => html`<option value="${b.id}" ${prefillBookId === b.id ? "selected" : ""}>${b.title}</option>`)}
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Chương số</label>
                                <input type="number" id="chapterNumber" required min="1" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="1">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tiêu đề chương</label>
                            <input type="text" id="chapterTitle" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Đại náo thiên cung">
                        </div>
                        <div>
                            <div class="flex items-center justify-between mb-1.5">
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Tóm tắt chương truyện (Tối quan trọng cho AI)</label>
                                <span class="text-[10px] text-amber-500 font-medium">Giúp AI ghi nhớ cốt truyện nhanh mà không tốn token</span>
                            </div>
                            <textarea id="chapterSummary" required rows="2" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Ví dụ: Tôn Ngộ Không náo loạn điện Ngọc Đế, ăn trộm linh đơn của Thái Thượng Lão Quân, trốn về Hoa Quả Sơn..."></textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Nội dung chương</label>
                            <textarea id="chapterContent" required rows="8" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl p-3 text-white font-serif focus:outline-none focus:border-amber-500 transition-colors" placeholder="Nội dung chương truyện chính..."></textarea>
                        </div>
                        <div id="newChapterError" class="text-red-400 text-xs hidden"></div>
                        <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10">Lưu chương truyện</button>
                    </form>
                </div>

                <!-- Tab: Create Storyverse -->
                <div id="tabContent-newUniverse" class="creator-tab-content space-y-6 hidden">
                    <div class="border-b border-gray-800 pb-3">
                        <h3 class="text-xl font-bold text-white">Tạo Vũ Trụ Cốt Truyện</h3>
                        <p class="text-xs text-gray-400">Vũ trụ đóng vai trò làm không gian chung kết nối nhiều tác phẩm độc lập hoặc chia sẻ các nhân vật.</p>
                    </div>
                    <form onsubmit="handleCreateUniverse(event)" class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">ID vũ trụ (không dấu, viết liền)</label>
                            <input type="text" id="universeId" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="tay-du-saga">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tên vũ trụ</label>
                            <input type="text" id="universeTitle" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Tây Du Saga">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mô tả bối cảnh và quy luật thế giới</label>
                            <textarea id="universeDescription" required rows="4" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Mô tả ranh giới thế giới, pháp lực, chủng tộc, quy luật siêu nhiên giúp định hình cốt truyện..."></textarea>
                        </div>
                        <div id="newUniverseError" class="text-red-400 text-xs hidden"></div>
                        <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10">Tạo vũ trụ cốt truyện</button>
                    </form>
                </div>

                <!-- Tab: Create Character -->
                <div id="tabContent-newCharacter" class="creator-tab-content space-y-6 hidden">
                    <div class="border-b border-gray-800 pb-3">
                        <h3 class="text-xl font-bold text-white">Tạo Nhân Vật Dùng Chung</h3>
                        <p class="text-xs text-gray-400">Các nhân vật được tạo trong Vũ trụ có thể được sử dụng bởi bất kỳ tác phẩm nào cùng thuộc vũ trụ đó.</p>
                    </div>
                    <form onsubmit="handleCreateCharacter(event)" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Chọn Vũ trụ (Storyverse)</label>
                                <select id="charStoryverseId" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-gray-300 focus:outline-none focus:border-amber-500 transition-colors">
                                    ${universes.map(u => html`<option value="${u.id}">${u.title}</option>`)}
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">ID nhân vật (không dấu)</label>
                                <input type="text" id="charId" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="ton-ngo-khong">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tên nhân vật</label>
                            <input type="text" id="charName" required class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Tôn Ngộ Không">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mô tả ngoại hình, tính cách, kỹ năng, pháp bảo (Định dạng tự do)</label>
                            <textarea id="charInfo" required rows="4" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Mô tả kỹ năng, ngoại hình, điểm yếu, bối cảnh nhân vật để AI đọc hiểu..."></textarea>
                        </div>
                        <div id="newCharError" class="text-red-400 text-xs hidden"></div>
                        <button type="submit" class="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-yellow-500/10">Tạo nhân vật dùng chung</button>
                    </form>
                </div>

                <!-- Tab: AI Prompt Context Exporter -->
                <div id="tabContent-aiPromptExporter" class="creator-tab-content space-y-6 hidden">
                    <div class="border-b border-gray-800 pb-3">
                        <h3 class="text-xl font-bold text-white flex items-center">
                            <i class="fa-solid fa-wand-magic-sparkles mr-2 text-yellow-400 animate-pulse"></i> AI Context Compiler & Prompt Exporter
                        </h3>
                        <p class="text-xs text-gray-400">Chọn một bộ truyện và xem tóm tắt toàn bộ chương truyện dưới dạng prompt nạp trực tiếp vào AI (Claude / ChatGPT) để nó viết chương mới cực kỳ mạch lạc.</p>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Chọn bộ truyện cần trích xuất</label>
                            <select id="exportBookId" onchange="generateAiPrompt()" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl px-4 py-2.5 text-gray-300 focus:outline-none focus:border-amber-500 transition-colors">
                                <option value="">-- Chọn một truyện --</option>
                                ${books.map(b => html`<option value="${b.id}">${b.title}</option>`)}
                            </select>
                        </div>

                        <div id="exportLoader" class="hidden text-sm text-gray-400 italic py-2">Đang tải và sinh ngữ cảnh...</div>

                        <div id="exportResultContainer" class="hidden space-y-4 text-left">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Ngữ cảnh prompt sinh ra:</span>
                                <button onclick="copyExportPrompt()" class="px-3 py-1 bg-amber-500 text-black font-semibold text-xs rounded hover:bg-amber-600 transition-colors flex items-center space-x-1">
                                    <i class="fa-solid fa-copy"></i>
                                    <span>Sao chép Prompt</span>
                                </button>
                            </div>
                            <textarea id="aiExportPromptText" readonly rows="12" class="w-full bg-[#0f111a] border border-gray-800 rounded-xl p-4 text-xs font-mono text-amber-500/90 focus:outline-none focus:border-amber-500 leading-relaxed"></textarea>
                            <span class="text-[10px] text-gray-500 leading-relaxed block">
                                * Lời khuyên: Sao chép prompt trên và dán trực tiếp vào Claude 3.5 Sonnet cùng với hướng dẫn "Hãy viết chương tiếp theo [Chương số] với tựa đề [Tựa đề] dựa trên bối cảnh này".
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- Client Script for Tab handling and Submissions -->
    <script>
        // Tab routing
        function switchCreatorTab(tabName) {
            // Hide all contents
            document.querySelectorAll('.creator-tab-content').forEach(c => c.classList.add('hidden'));
            // Remove active style from all buttons
            document.querySelectorAll('.creator-tab-btn').forEach(b => {
                b.className = 'creator-tab-btn w-full p-4 bg-[#161925]/40 border border-gray-800 hover:border-gray-700 text-gray-300 font-semibold text-sm rounded-xl text-left flex items-center justify-between transition-all';
            });

            // Active clicked
            document.getElementById('tabContent-' + tabName).classList.remove('hidden');
            const btn = document.getElementById('btn-' + tabName);
            if (tabName === 'aiPromptExporter') {
                btn.className = 'creator-tab-btn w-full p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 text-yellow-400 font-bold text-sm rounded-xl text-left flex items-center justify-between transition-all shadow-md';
            } else {
                btn.className = 'creator-tab-btn w-full p-4 bg-[#161925] border border-amber-500 text-amber-400 font-bold text-sm rounded-xl text-left flex items-center justify-between transition-all';
            }

            if (tabName === 'aiPromptExporter') {
                generateAiPrompt();
            }
        }

        // Check prefill tab
        const urlParams = new URLSearchParams(window.location.search);
        const prefillBookId = urlParams.get('book_id');
        if (prefillBookId) {
            switchCreatorTab('newChapter');
        }

        // Submissions
        async function handleCreateBook(e) {
            e.preventDefault();
            const id = document.getElementById('bookId').value.trim();
            const title = document.getElementById('bookTitle').value.trim();
            const description = document.getElementById('bookDescription').value.trim();
            const categories = document.getElementById('bookCategories').value.trim();
            const storyverse_id = document.getElementById('bookStoryverseId').value;
            const allow_other_author_edit = document.getElementById('bookAllowEdit').checked;
            const errDiv = document.getElementById('newBookError');

            errDiv.classList.add('hidden');

            try {
                const res = await fetch('/api/storybooks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, title, description, categories, storyverse_id, allow_other_author_edit })
                });
                const data = await res.json();
                if (data.success) {
                    window.location.href = '/storybook/' + data.storybook.id;
                } else {
                    errDiv.innerText = data.error || 'Thất bại.';
                    errDiv.classList.remove('hidden');
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function handleCreateChapter(e) {
            e.preventDefault();
            const bookId = document.getElementById('chapterBookId').value;
            const chapter_number = document.getElementById('chapterNumber').value;
            const title = document.getElementById('chapterTitle').value.trim();
            const summary = document.getElementById('chapterSummary').value.trim();
            const content = document.getElementById('chapterContent').value.trim();
            const errDiv = document.getElementById('newChapterError');

            errDiv.classList.add('hidden');

            try {
                const res = await fetch(\`/api/storybooks/\${bookId}/chapters\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chapter_number, title, summary, content })
                });
                const data = await res.json();
                if (data.success) {
                    window.location.href = \`/storybook/\${bookId}/chapter/\${chapter_number}\`;
                } else {
                    errDiv.innerText = data.error || 'Thất bại.';
                    errDiv.classList.remove('hidden');
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function handleCreateUniverse(e) {
            e.preventDefault();
            const id = document.getElementById('universeId').value.trim();
            const title = document.getElementById('universeTitle').value.trim();
            const description = document.getElementById('universeDescription').value.trim();
            const errDiv = document.getElementById('newUniverseError');

            errDiv.classList.add('hidden');

            try {
                const res = await fetch('/api/storyverses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, title, description })
                });
                const data = await res.json();
                if (data.success) {
                    window.location.href = '/storyverses/' + data.storyverse.id;
                } else {
                    errDiv.innerText = data.error || 'Thất bại.';
                    errDiv.classList.remove('hidden');
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function handleCreateCharacter(e) {
            e.preventDefault();
            const id = document.getElementById('charId').value.trim();
            const name = document.getElementById('charName').value.trim();
            const other_info = document.getElementById('charInfo').value.trim();
            const storyverse_id = document.getElementById('charStoryverseId').value;
            const errDiv = document.getElementById('newCharError');

            errDiv.classList.add('hidden');

            try {
                const res = await fetch('/api/characters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, name, other_info, storyverse_id })
                });
                const data = await res.json();
                if (data.success) {
                    window.location.href = '/storyverses/' + storyverse_id;
                } else {
                    errDiv.innerText = data.error || 'Thất bại.';
                    errDiv.classList.remove('hidden');
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function generateAiPrompt() {
            const bookId = document.getElementById('exportBookId').value;
            const loader = document.getElementById('exportLoader');
            const resultBox = document.getElementById('exportResultContainer');
            const promptArea = document.getElementById('aiExportPromptText');

            if (!bookId) {
                resultBox.classList.add('hidden');
                return;
            }

            loader.classList.remove('hidden');
            resultBox.classList.add('hidden');

            try {
                // Call MCP custom JSON-RPC to fetch summaries
                const mcpRes = await fetch('/api/mcp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'tools/call',
                        params: {
                            name: 'get_storybook_chapters_summaries',
                            arguments: { storybook_id: bookId }
                        },
                        id: 1
                    })
                });

                // Get book details
                const bookRes = await fetch(\`/api/storybooks/\${bookId}\`);
                const bookData = await bookRes.json();

                const mcpData = await mcpRes.json();
                const textResult = JSON.parse(mcpData.result.content[0].text);

                if (textResult.success && bookData.success) {
                    const book = bookData.storybook;
                    const summaries = textResult.chapters_summaries;

                    let prompt = \`ROLE: Bạn là một nhà văn mạng chuyên nghiệp, xuất sắc nhất trong thể loại tiểu thuyết viễn tưởng/kiếm hiệp.
BỐI CẢNH TRUYỆN:
- Tựa truyện: \${book.title}
- Thể loại: \${book.categories}
- Mô tả chung: \${book.description}
- Các tác giả tham gia: \${book.authors}

LỊCH SỬ CỐT TRUYỆN QUA TÓM TẮT CÁC CHƯƠNG ĐÃ QUA:\n\`;

                    if (summaries.length === 0) {
                        prompt += "(Chưa có chương nào được viết. Bạn đang sáng tác chương đầu tiên!)\\n";
                    } else {
                        summaries.forEach(s => {
                            prompt += \`- Chương \${s.chapter_number} [\${s.title}]: \${s.summary}\\n\`;
                        });
                    }

                    prompt += \`\nNHIỆM VỤ CỦA BẠN:
Dựa trên bối cảnh và tóm tắt lịch sử cốt truyện ở trên, hãy tiếp thu logic các chương trước và viết tiếp CHƯƠNG KẾ TIẾP thật xuất sắc.
Hãy duy trì tính mạch lạc của nhân vật, giọng văn truyền cảm và tốc độ hợp lý.
YÊU CẦU: Xuất ra định dạng markdown, ghi rõ số chương, tựa đề chương, kèm theo một đoạn tóm tắt chương ngắn gọn (summary) ở cuối cùng để tôi nạp lại vào hệ thống.\`;

                    promptArea.value = prompt;
                    resultBox.classList.remove('hidden');
                }
            } catch (err) {
                console.error(err);
            } finally {
                loader.classList.add('hidden');
            }
        }

        function copyExportPrompt() {
            const promptArea = document.getElementById('aiExportPromptText');
            promptArea.select();
            document.execCommand('copy');
            alert('Đã sao chép prompt sinh ngữ cảnh thành công vào Clipboard!');
        }
    </script>
  `;
}

// Admin panel View
export function renderAdminPanel(users: db.User[]) {
  return html`
    <div class="max-w-4xl mx-auto space-y-8 text-left">
        <div class="space-y-2">
            <h1 class="text-3xl font-black text-white"><i class="fa-solid fa-user-shield mr-2 text-amber-500"></i> Quản Trị Hệ Thống</h1>
            <p class="text-gray-400">Xem danh sách người dùng, thay đổi quyền lực hoặc dọn dẹp hệ thống.</p>
        </div>

        <div class="bg-[#161925]/30 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 class="text-xl font-bold text-white border-b border-gray-800 pb-3">Danh sách thành viên (${users.length})</h3>

            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr class="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                            <th class="py-3 px-4">Tên hiển thị</th>
                            <th class="py-3 px-4">Tài khoản</th>
                            <th class="py-3 px-4">Quyền hạn</th>
                            <th class="py-3 px-4">Ngày tham gia</th>
                            <th class="py-3 px-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-800/60">
                        ${users.map(u => html`
                        <tr class="hover:bg-gray-800/10 transition-colors">
                            <td class="py-3.5 px-4 font-semibold text-gray-200">${u.display_name}</td>
                            <td class="py-3.5 px-4 text-amber-500">@${u.username}</td>
                            <td class="py-3.5 px-4">
                                ${u.is_owner ? html`<span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px] font-bold">Owner</span>` :
                                  u.is_admin ? html`<span class="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20 text-[10px] font-bold">Admin</span>` :
                                  html`<span class="px-2 py-0.5 rounded bg-gray-500/10 text-gray-400 text-[10px] font-medium">User</span>`}
                            </td>
                            <td class="py-3.5 px-4 text-xs text-gray-500">${new Date(u.join_date).toLocaleDateString("vi-VN")}</td>
                            <td class="py-3.5 px-4 text-right space-x-2">
                                ${!u.is_owner ? html`
                                <button onclick="toggleAdminRole('${u.username}', ${u.is_admin ? "false" : "true"})" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold transition-colors">
                                    ${u.is_admin ? "Hạ quyền" : "Lên Admin"}
                                </button>
                                <button onclick="deleteUser('${u.username}')" class="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-black rounded-lg text-xs font-semibold transition-all">
                                    Xóa
                                </button>
                                ` : html`<span class="text-xs text-gray-600 italic">Vô hiệu hóa</span>`}
                            </td>
                        </tr>
                        `)}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        async function toggleAdminRole(username, makeAdmin) {
            if (!confirm(\`Xác nhận thay đổi quyền của @\${username}?\`)) return;
            try {
                const res = await fetch(\`/api/admin/users/\${username}/role\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_admin: makeAdmin })
                });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                } else {
                    alert('Lỗi: ' + (data.error || 'Thao tác thất bại'));
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function deleteUser(username) {
            if (!confirm(\`CẢNH BÁO: Bạn có chắc muốn xóa vĩnh viễn tài khoản @\${username} cùng toàn bộ nội dung liên quan?\`)) return;
            try {
                const res = await fetch(\`/api/admin/users/\${username}\`, {
                    method: 'DELETE'
                });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                } else {
                    alert('Lỗi: ' + (data.error || 'Không thể xóa'));
                }
            } catch (err) {
                console.error(err);
            }
        }
    </script>
  `;
}
