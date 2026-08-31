import type { AppType } from "../middleware.js";
import * as db from "../db.js";
import { hasCreatorAccess } from "../middleware.js";

export function registerStorybookRoutes(app: AppType) {
  // --- STORYBOOK API ---

  app.get("/api/storybooks", async c => {
    const books = await db.getAllStorybooks();
    return c.json({ success: true, storybooks: books }, 200, {
      "Cache-Control": "public, max-age=60"
    });
  });

  app.post("/api/storybooks", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);
    // Only users with the "Nhà sáng tạo" permission can create storybooks
    if (!hasCreatorAccess(user)) {
      return c.json({ success: false, error: "Forbidden: Bạn cần bật quyền Nhà sáng tạo trong cài đặt" }, 403);
    }

    try {
      const { id, title, description, categories, allow_other_author_edit, storyverse_id, characters } = await c.req.json();
      if (!id || !title || !description || !categories) {
        return c.json({ success: false, error: "Missing required fields" }, 400);
      }

      const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (!cleanId) return c.json({ success: false, error: "Invalid Storybook ID" }, 400);

      const exist = await db.getStorybookById(cleanId);
      if (exist) return c.json({ success: false, error: "Storybook ID already exists" }, 400);

      const book = await db.createStorybook(
        cleanId,
        title.trim(),
        description.trim(),
        user.username, // Original author
        categories.trim(),
        !!allow_other_author_edit,
        storyverse_id || null,
        "",
        characters !== undefined ? (typeof characters === "string" ? characters : JSON.stringify(characters)) : "[]"
      );

      return c.json({ success: true, storybook: book });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  app.get("/api/storybooks/:id", async c => {
    const book = await db.getStorybookById(c.req.param("id"));
    if (!book) return c.json({ success: false, error: "Storybook not found" }, 404);
    return c.json({ success: true, storybook: book }, 200, {
      "Cache-Control": "public, max-age=60"
    });
  });

  app.put("/api/storybooks/:id", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

    const bookId = c.req.param("id");
    const book = await db.getStorybookById(bookId);
    if (!book) return c.json({ success: false, error: "Storybook not found" }, 404);

    // Auth check: original creator, or system admin/owner, or other author if editing is allowed
    const isAuthor = book.authors.toLowerCase().includes(user.username.toLowerCase());
    const canEdit = isAuthor || user.is_admin || user.is_owner || book.allow_other_author_edit;

    if (!canEdit) {
      return c.json({ success: false, error: "You don't have permission to edit this book" }, 403);
    }

    try {
      const { title, description, categories, allow_other_author_edit, storyverse_id, characters, ost } = await c.req.json();
      const updated = await db.updateStorybook(
        bookId,
        title || book.title,
        description || book.description,
        categories || book.categories,
        allow_other_author_edit !== undefined ? !!allow_other_author_edit : book.allow_other_author_edit,
        storyverse_id !== undefined ? (storyverse_id || null) : book.storyverse_id,
        undefined,
        characters !== undefined ? (typeof characters === "string" ? characters : JSON.stringify(characters)) : undefined,
        ost !== undefined ? (typeof ost === "string" ? ost : JSON.stringify(ost)) : undefined
      );

      // If another author is editing and not in authors list, append their name
      if (updated && !isAuthor && book.allow_other_author_edit) {
        const newAuthors = `${book.authors}, ${user.username}`;
        await db.executeQuery(`UPDATE storybooks SET authors = ? WHERE id = ?`, [newAuthors, bookId]);
      }

      return c.json({ success: true, message: "Storybook updated successfully" });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  app.delete("/api/storybooks/:id", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

    const bookId = c.req.param("id");
    const book = await db.getStorybookById(bookId);
    if (!book) return c.json({ success: false, error: "Storybook not found" }, 404);

    const isAuthor = book.authors.toLowerCase().split(",").map(a => a.trim()).includes(user.username.toLowerCase());
    const canDelete = isAuthor || user.is_admin || user.is_owner;

    if (!canDelete) return c.json({ success: false, error: "Forbidden" }, 403);

    const success = await db.deleteStorybook(bookId);
    return c.json({ success, message: success ? "Storybook deleted" : "Failed to delete" });
  });


  // --- CHAPTERS API ---

  app.get("/api/storybooks/:id/chapters", async c => {
    const list = await db.getChaptersList(c.req.param("id"));
    return c.json({ success: true, chapters: list }, 200, {
      "Cache-Control": "public, max-age=60"
    });
  });

  app.get("/api/storybooks/:id/chapters/:num", async c => {
    const bookId = c.req.param("id");
    const num = Number(c.req.param("num"));

    const user = c.get("user");
    const chapter = await db.getChapter(bookId, num);
    if (!chapter) return c.json({ success: false, error: "Chapter not found" }, 404);

    // Save reading progress if user is logged in
    if (user) {
      await db.saveReadingProgress(user.username, bookId, num);
    }

    return c.json({ success: true, chapter }, 200, {
      "Cache-Control": "public, max-age=60"
    });
  });

  app.post("/api/storybooks/:id/chapters", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

    const bookId = c.req.param("id");
    const book = await db.getStorybookById(bookId);
    if (!book) return c.json({ success: false, error: "Storybook not found" }, 404);

    const isAuthor = book.authors.toLowerCase().includes(user.username.toLowerCase());
    const canEdit = isAuthor || user.is_admin || user.is_owner || book.allow_other_author_edit;

    if (!canEdit) return c.json({ success: false, error: "Forbidden" }, 403);

    try {
      const { chapter_number, title, content, summary } = await c.req.json();
      if (!chapter_number || !title || !content) {
        return c.json({ success: false, error: "Missing chapter details" }, 400);
      }

      const chapter = await db.createOrEditChapter(
        bookId,
        Number(chapter_number),
        title.trim(),
        content.trim(),
        (summary || "").trim()
      );

      return c.json({ success: true, chapter });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  app.delete("/api/storybooks/:id/chapters/:num", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

    const bookId = c.req.param("id");
    const num = Number(c.req.param("num"));

    const book = await db.getStorybookById(bookId);
    if (!book) return c.json({ success: false, error: "Storybook not found" }, 404);

    const isAuthor = book.authors.toLowerCase().includes(user.username.toLowerCase());
    const canDelete = isAuthor || user.is_admin || user.is_owner;

    if (!canDelete) return c.json({ success: false, error: "Forbidden" }, 403);

    const success = await db.deleteChapter(bookId, num);
    return c.json({ success, message: success ? "Chapter deleted" : "Failed to delete" });
  });
}
