import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";
import { jsonError } from "@/lib/api";

export async function POST(req: Request) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const { content, target_type, target_id, reply_to } = await req.json();
    if (!content || !target_type || !target_id) {
      return jsonError("Missing comment details", 400);
    }

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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
        const parentRes = await db.executeQuery("SELECT author, content FROM comments WHERE id = ?", [
          reply_to,
        ]);
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
            const authorsList = book.authors.split(",").map((a) => a.trim().toLowerCase());
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

    return NextResponse.json({ success: true, comment });
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}
