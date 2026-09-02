"use client";

import { useCallback, useEffect, useState } from "react";
import { fmtDate } from "@/lib/format";

interface CommentItem {
  id: string;
  author: string;
  created_at: string;
  content: string;
  author_display_name?: string;
  replies?: CommentItem[];
}

// Comments Feed and Form (shared on book and storyverse detail pages).
// Logic ported from the previous inline script into React state.
export default function CommentsArea({
  targetType,
  targetId,
}: {
  targetType: string;
  targetId: string;
}) {
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [content, setContent] = useState("");
  const [replyContents, setReplyContents] = useState<Record<string, string>>({});
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments/${targetType}/${targetId}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error(err);
    }
  }, [targetType, targetId]);

  // Load comments on mount
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleCommentSubmit(e: React.FormEvent, replyTo = "") {
    e.preventDefault();
    const value = replyTo ? replyContents[replyTo] : content;
    const trimmed = (value || "").trim();
    if (!trimmed) return;

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmed,
          target_type: targetType,
          target_id: targetId,
          reply_to: replyTo || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (replyTo) {
          setReplyContents((prev) => ({ ...prev, [replyTo]: "" }));
          setOpenReplies((prev) => ({ ...prev, [replyTo]: false }));
        } else {
          setContent("");
        }
        loadComments();
      } else {
        (window as any).openAuthModal("login");
      }
    } catch (err) {
      console.error(err);
    }
  }

  function showReplyForm(commentId: string) {
    setOpenReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  }

  return (
    <div className="pt-8 border-t border-gray-200 dark:border-gray-800 text-left space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        <i className="fa-solid fa-comments mr-2 text-amber-500"></i> Bình luận cộng đồng
      </h2>

      {/* Add Comment Form */}
      <form
        onSubmit={(e) => handleCommentSubmit(e)}
        className="space-y-3 bg-white dark:bg-[#161925]/40 p-4 rounded-xl border border-gray-200 dark:border-gray-800"
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={3}
          className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 focus:border-amber-500 text-gray-900 dark:text-white rounded-xl p-3 text-sm focus:outline-none transition-colors"
          placeholder="Viết bình luận của bạn tại đây..."
        ></textarea>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-500">
            Bình luận văn minh lịch sự và tôn trọng người khác.
          </span>
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-lg transition-colors shadow"
          >
            Bình luận
          </button>
        </div>
      </form>

      {/* Nested Comments List */}
      <div id="commentsFeed" className="space-y-4">
        {comments === null ? (
          <p className="text-sm text-gray-500 dark:text-gray-500 italic">Đang tải bình luận...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-500 italic">
            Chưa có bình luận nào. Hãy là người đầu tiên!
          </p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="flex space-x-3 p-4 bg-white dark:bg-[#161925]/30 border border-gray-200 dark:border-gray-800 rounded-xl"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center text-amber-400 font-bold text-xs uppercase flex-shrink-0">
                {(c.author_display_name || c.author).charAt(0)}
              </div>
              <div className="flex-grow text-left">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {c.author_display_name || c.author}{" "}
                    <a href={`/profile/${c.author}`} className="text-amber-500 font-medium hover:underline">
                      @{c.author}
                    </a>
                  </span>
                  <span className="text-gray-500 dark:text-gray-500">{fmtDate(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{c.content}</p>

                <div className="flex items-center space-x-4 mt-2">
                  <button
                    onClick={() => showReplyForm(c.id)}
                    className="text-[11px] text-gray-500 dark:text-gray-500 hover:text-amber-400 transition-colors font-medium"
                  >
                    <i className="fa-solid fa-reply mr-1"></i> Trả lời
                  </button>
                </div>

                {openReplies[c.id] ? (
                  <div className="mt-3">
                    <form onSubmit={(e) => handleCommentSubmit(e, c.id)} className="flex space-x-2">
                      <input
                        type="text"
                        value={replyContents[c.id] || ""}
                        onChange={(e) =>
                          setReplyContents((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        required
                        className="flex-grow bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-amber-500"
                        placeholder="Viết phản hồi..."
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-amber-500 text-black font-semibold text-xs rounded-lg hover:bg-amber-600 transition-colors"
                      >
                        Gửi
                      </button>
                    </form>
                  </div>
                ) : null}

                {c.replies && c.replies.length > 0 ? (
                  <div className="space-y-3 mt-3 w-full">
                    {c.replies.map((rep) => (
                      <div
                        key={rep.id}
                        className="flex space-x-3 p-3 bg-gray-100 dark:bg-[#0c0e16]/50 border border-gray-200 dark:border-gray-850 rounded-lg ml-6"
                      >
                        <div className="flex-grow">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-gray-700 dark:text-gray-300">
                              {rep.author_display_name || rep.author}{" "}
                              <a href={`/profile/${rep.author}`} className="text-amber-500 font-medium hover:underline">
                                @{rep.author}
                              </a>
                            </span>
                            <span className="text-gray-500 dark:text-gray-500">{fmtDate(rep.created_at)}</span>
                          </div>
                          <p className="text-xs text-gray-700 dark:text-gray-300">{rep.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
