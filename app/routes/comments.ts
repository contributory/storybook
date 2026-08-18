import type { AppType } from "../middleware.ts";
import * as db from "../db.ts";

export function registerCommentRoutes(app: AppType) {
  // --- COMMENTS & LIKES API ---

  app.post("/api/comments", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

    try {
      const { content, target_type, target_id, reply_to } = await c.req.json();
      if (!content || !target_type || !target_id) {
        return c.json({ success: false, error: "Missing comment details" }, 400);
      }

      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const comment = await db.addComment(
        commentId,
        user.username,
        content.trim(),
        reply_to || null,
        target_type,
        target_id
      );

      // Create notifications for the relevant author(s)
      try {
        if (reply_to) {
          const parentRes = await db.executeQuery("SELECT author, content FROM comments WHERE id = ?", [reply_to]);
          if (parentRes.rows.length > 0) {
            const parentAuthor = parentRes.rows[0].author as string;
            if (parentAuthor.toLowerCase() !== user.username.toLowerCase()) {
              await db.createNotification(
                parentAuthor,
                user.username,
                "reply",
                target_type,
                target_id,
                commentId,
                `đã phản hồi bình luận của bạn: "${content.substring(0, 50)}..."`
              );
            }
          }
        } else {
          if (target_type === "storybook") {
            const book = await db.getStorybookById(target_id);
            if (book) {
              const authorsList = book.authors.split(",").map(a => a.trim().toLowerCase());
              for (const auth of authorsList) {
                if (auth && auth !== user.username.toLowerCase()) {
                  await db.createNotification(
                    auth,
                    user.username,
                    "comment",
                    "storybook",
                    target_id,
                    commentId,
                    `đã bình luận về truyện "${book.title}": "${content.substring(0, 50)}..."`
                  );
                }
              }
            }
          } else if (target_type === "storyverse") {
            const sv = await db.getStoryverseById(target_id);
            if (sv && sv.author.toLowerCase() !== user.username.toLowerCase()) {
              await db.createNotification(
                sv.author,
                user.username,
                "comment",
                "storyverse",
                target_id,
                commentId,
                `đã bình luận về bối cảnh "${sv.title}": "${content.substring(0, 50)}..."`
              );
            }
          } else if (target_type === "character") {
            const char = await db.getCharacterById(target_id);
            if (char && char.author.toLowerCase() !== user.username.toLowerCase()) {
              await db.createNotification(
                char.author,
                user.username,
                "comment",
                "character",
                target_id,
                commentId,
                `đã bình luận về nhân vật "${char.name}": "${content.substring(0, 50)}..."`
              );
            }
          }
        }
      } catch (notifErr) {
        console.error("Failed to create notification:", notifErr);
      }

      return c.json({ success: true, comment });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  app.get("/api/comments/:type/:id", async c => {
    const type = c.req.param("type") as "storybook" | "storyverse" | "character";
    const id = c.req.param("id");
    const comments = await db.getCommentsForTarget(type, id);
    return c.json({ success: true, comments }, 200, {
      "Cache-Control": "public, max-age=30"
    });
  });

  app.post("/api/likes", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

    try {
      const { target_type, target_id } = await c.req.json();
      if (!target_type || !target_id) {
        return c.json({ success: false, error: "Missing fields" }, 400);
      }

      const result = await db.toggleLike(user.username, target_type, target_id);
      const count = await db.getLikesCount(target_type, target_id);

      return c.json({ success: true, ...result, count });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  app.get("/api/likes/:type/:id", async c => {
    const type = c.req.param("type") as "storybook" | "storyverse" | "character";
    const id = c.req.param("id");

    const user = c.get("user");
    const count = await db.getLikesCount(type, id);
    const liked = user ? await db.isLikedByUser(user.username, type, id) : false;

    return c.json({ success: true, count, liked }, 200, {
      "Cache-Control": "public, max-age=30"
    });
  });
}
