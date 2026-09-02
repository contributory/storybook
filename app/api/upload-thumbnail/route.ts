import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";
import { jsonError } from "@/lib/api";

// --- UPLOAD THUMBNAIL ---
export async function POST(req: Request) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const body = await req.formData();
    const file = body.get("file");
    const type = body.get("type") as string | null;
    const id = body.get("id") as string | null;

    if (!file || !type || !id) {
      return jsonError("Missing file, type or id", 400);
    }

    // Permission checks
    if (type === "storybook") {
      const book = await db.getStorybookById(id);
      if (!book) return jsonError("Storybook not found", 404);
      const isAuthor = book.authors.toLowerCase().includes(user.username.toLowerCase());
      const canEdit = isAuthor || user.is_admin || user.is_owner || book.allow_other_author_edit;
      if (!canEdit) return jsonError("Forbidden", 403);
    } else if (type === "storyverse") {
      const sv = await db.getStoryverseById(id);
      if (!sv) return jsonError("Storyverse not found", 404);
      const canEdit =
        sv.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
      if (!canEdit) return jsonError("Forbidden", 403);
    } else if (type === "character") {
      const char = await db.getCharacterById(id);
      if (!char) return jsonError("Character not found", 404);
      const canEdit =
        char.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
      if (!canEdit) return jsonError("Forbidden", 403);
    } else {
      return jsonError("Invalid type", 400);
    }

    const url = await db.uploadThumbnail(type, id, file as File);

    // Save in DB
    if (type === "storybook") {
      await db.executeQuery("UPDATE storybooks SET thumbnail_url = ? WHERE id = ?", [url, id]);
    } else if (type === "storyverse") {
      await db.executeQuery("UPDATE storyverses SET thumbnail_url = ? WHERE id = ?", [url, id]);
    } else if (type === "character") {
      await db.executeQuery("UPDATE shared_characters SET thumbnail_url = ? WHERE id = ?", [url, id]);
    }

    return NextResponse.json({ success: true, url });
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}
