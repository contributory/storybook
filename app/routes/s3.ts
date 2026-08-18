import type { AppType } from "../middleware.ts";
import * as db from "../db.ts";

export function registerS3Routes(app: AppType) {
  // --- S3 PROXY ---
  app.get("/api/s3-proxy", async c => {
    const key = c.req.query("key");
    if (!key) return c.json({ error: "Missing key" }, 400);
    const obj = await db.getS3Object(key);
    if (!obj) return c.json({ error: "File not found" }, 404);
    return c.body(obj.body as any, 200, {
      "Content-Type": obj.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    });
  });

  // --- UPLOAD THUMBNAIL ---
  app.post("/api/upload-thumbnail", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

    try {
      const body = await c.req.parseBody();
      const file = body["file"];
      const type = body["type"] as string;
      const id = body["id"] as string;

      if (!file || !type || !id) {
        return c.json({ success: false, error: "Missing file, type or id" }, 400);
      }

      // Permission checks
      if (type === "storybook") {
        const book = await db.getStorybookById(id);
        if (!book) return c.json({ success: false, error: "Storybook not found" }, 404);
        const isAuthor = book.authors.toLowerCase().includes(user.username.toLowerCase());
        const canEdit = isAuthor || user.is_admin || user.is_owner || book.allow_other_author_edit;
        if (!canEdit) return c.json({ success: false, error: "Forbidden" }, 403);
      } else if (type === "storyverse") {
        const sv = await db.getStoryverseById(id);
        if (!sv) return c.json({ success: false, error: "Storyverse not found" }, 404);
        const canEdit = sv.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
        if (!canEdit) return c.json({ success: false, error: "Forbidden" }, 403);
      } else if (type === "character") {
        const char = await db.getCharacterById(id);
        if (!char) return c.json({ success: false, error: "Character not found" }, 404);
        const canEdit = char.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
        if (!canEdit) return c.json({ success: false, error: "Forbidden" }, 403);
      } else {
        return c.json({ success: false, error: "Invalid type" }, 400);
      }

      const url = await db.uploadThumbnail(type, id, file);

      // Save in DB
      if (type === "storybook") {
        await db.executeQuery("UPDATE storybooks SET thumbnail_url = ? WHERE id = ?", [url, id]);
      } else if (type === "storyverse") {
        await db.executeQuery("UPDATE storyverses SET thumbnail_url = ? WHERE id = ?", [url, id]);
      } else if (type === "character") {
        await db.executeQuery("UPDATE shared_characters SET thumbnail_url = ? WHERE id = ?", [url, id]);
      }

      return c.json({ success: true, url });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });
}
