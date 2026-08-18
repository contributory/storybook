import type { AppType } from "../middleware.ts";
import * as db from "../db.ts";
import { hasCreatorAccess } from "../middleware.ts";

export function registerStoryverseRoutes(app: AppType) {
  // --- STORYVERSE API ---

  app.get("/api/storyverses", async c => {
    const universes = await db.getAllStoryverses();
    return c.json({ success: true, storyverses: universes }, 200, {
      "Cache-Control": "public, max-age=60"
    });
  });

  app.post("/api/storyverses", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);
    // Only users with the "Nhà sáng tạo" permission can create storyverses
    if (!hasCreatorAccess(user)) {
      return c.json({ success: false, error: "Forbidden: Bạn cần bật quyền Nhà sáng tạo trong cài đặt" }, 403);
    }

    try {
      const { id, title, description } = await c.req.json();
      if (!id || !title || !description) {
        return c.json({ success: false, error: "Missing fields" }, 400);
      }

      const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
      const exist = await db.getStoryverseById(cleanId);
      if (exist) return c.json({ success: false, error: "Storyverse ID already exists" }, 400);

      const universe = await db.createStoryverse(cleanId, title.trim(), description.trim(), user.username);
      return c.json({ success: true, storyverse: universe });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  app.get("/api/storyverses/:id", async c => {
    const universe = await db.getStoryverseById(c.req.param("id"));
    if (!universe) return c.json({ success: false, error: "Storyverse not found" }, 404);

    // Fetch shared characters in this storyverse
    const characters = await db.getCharactersByStoryverse(universe.id);

    return c.json({ success: true, storyverse: universe, characters }, 200, {
      "Cache-Control": "public, max-age=60"
    });
  });

  app.put("/api/storyverses/:id", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

    const universeId = c.req.param("id");
    const universe = await db.getStoryverseById(universeId);
    if (!universe) return c.json({ success: false, error: "Storyverse not found" }, 404);

    const canEdit = universe.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
    if (!canEdit) return c.json({ success: false, error: "Forbidden" }, 403);

    try {
      const { title, description } = await c.req.json();
      const success = await db.updateStoryverse(universeId, title || universe.title, description || universe.description);
      return c.json({ success, message: success ? "Storyverse updated" : "Failed" });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  app.delete("/api/storyverses/:id", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

    const universeId = c.req.param("id");
    const universe = await db.getStoryverseById(universeId);
    if (!universe) return c.json({ success: false, error: "Storyverse not found" }, 404);

    const canDelete = universe.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
    if (!canDelete) return c.json({ success: false, error: "Forbidden" }, 403);

    const success = await db.deleteStoryverse(universeId);
    return c.json({ success, message: success ? "Storyverse deleted" : "Failed" });
  });
}
