/** @jsxImportSource hono/jsx */
import { html } from "hono/html";

// Comments Feed and Form template (shared on book and storyverse detail pages)
export function renderCommentsArea(target_type: string, target_id: string) {
  return html`
    <div class="pt-8 border-t border-gray-200 dark:border-gray-800 text-left space-y-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white"><i class="fa-solid fa-comments mr-2 text-amber-500"></i> Bình luận cộng đồng</h2>

        <!-- Add Comment Form -->
        <form onsubmit="handleCommentSubmit(event, '${target_type}', '${target_id}')" class="space-y-3 bg-white dark:bg-[#161925]/40 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <textarea id="commentContent" required rows="3" class="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 focus:border-amber-500 text-gray-900 dark:text-white rounded-xl p-3 text-sm focus:outline-none transition-colors" placeholder="Viết bình luận của bạn tại đây..."></textarea>
            <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500 dark:text-gray-500">Bình luận văn minh lịch sự và tôn trọng người khác.</span>
                <button type="submit" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-lg transition-colors shadow">Bình luận</button>
            </div>
        </form>

        <!-- Nested Comments List -->
        <div id="commentsFeed" class="space-y-4">
            <p class="text-sm text-gray-500 dark:text-gray-500 italic">Đang tải bình luận...</p>
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
                        container.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-500 italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>';
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
            div.className = \`flex space-x-3 p-4 bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-xl \${isReply ? 'ml-8 bg-gray-100 dark:bg-[#0c0e16]/40' : ''}\`;

            let repliesHtml = '';
            if (c.replies && c.replies.length > 0) {
                repliesHtml = '<div class="space-y-3 mt-3 w-full">';
                c.replies.forEach(rep => {
                    repliesHtml += \`<div class="flex space-x-3 p-3 bg-gray-100 dark:bg-[#0c0e16]/50 border border-gray-200 dark:border-gray-850 rounded-lg ml-6">
                        <div class="flex-grow">
                            <div class="flex items-center justify-between text-[11px] mb-1">
                                <span class="font-bold text-gray-700 dark:text-gray-300">\${rep.author_display_name} <a href="/profile/\${rep.author}" class="text-amber-500 font-medium hover:underline">@\${rep.author}</a></span>
                                <span class="text-gray-500 dark:text-gray-500">\${new Date(rep.created_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <p class="text-xs text-gray-700 dark:text-gray-300">\${rep.content}</p>
                        </div>
                    </div>\`;
                });
                repliesHtml += '</div>';
            }

            div.innerHTML = \`
                <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center text-amber-400 font-bold text-xs uppercase flex-shrink-0">
                    \${c.author_display_name.charAt(0)}
                </div>
                <div class="flex-grow text-left">
                    <div class="flex items-center justify-between text-xs mb-1">
                        <span class="font-bold text-gray-700 dark:text-gray-300">\${c.author_display_name} <a href="/profile/\${c.author}" class="text-amber-500 font-medium hover:underline">@\${c.author}</a></span>
                        <span class="text-gray-500 dark:text-gray-500">\${new Date(c.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p class="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">\${c.content}</p>

                    <div class="flex items-center space-x-4 mt-2">
                        <button onclick="showReplyForm('\${c.id}', this)" class="text-[11px] text-gray-500 dark:text-gray-500 hover:text-amber-400 transition-colors font-medium"><i class="fa-solid fa-reply mr-1"></i> Trả lời</button>
                    </div>

                    <div id="replyFormContainer_\${c.id}" class="hidden mt-3">
                        <form onsubmit="handleCommentSubmit(event, '${target_type}', '${target_id}', '\${c.id}')" class="flex space-x-2">
                            <input type="text" id="replyContent_\${c.id}" required class="flex-grow bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-amber-500" placeholder="Viết phản hồi...">
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
