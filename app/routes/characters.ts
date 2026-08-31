import type { AppType } from "../middleware.js";
import * as db from "../db.js";
import { hasCreatorAccess } from "../middleware.js";

export function registerCharacterRoutes(app: AppType) {
  // --- CHARACTERS API ---

  app.get("/api/characters/:id", async c => {
    const char = await db.getCharacterById(c.req.param("id"));
    if (!char) return c.json({ success: false, error: "Character not found" }, 404);
    return c.json({ success: true, character: char }, 200, {
      "Cache-Control": "public, max-age=60"
    });
  });

  app.post("/api/characters", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);
    // Only users with the "Nhà sáng tạo" permission can create shared characters
    if (!hasCreatorAccess(user)) {
      return c.json({ success: false, error: "Forbidden: Bạn cần bật quyền Nhà sáng tạo trong cài đặt" }, 403);
    }

    try {
      const { id, name, description, storyverse_id } = await c.req.json();
      if (!id || !name || !storyverse_id) {
        return c.json({ success: false, error: "Missing fields" }, 400);
      }

      const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
      const exist = await db.getCharacterById(cleanId);
      if (exist) return c.json({ success: false, error: "Character ID already taken" }, 400);

      const character = await db.createCharacter(
        cleanId,
        name.trim(),
        typeof description === "object" ? JSON.stringify(description) : description,
        storyverse_id,
        user.username
      );

      return c.json({ success: true, character });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  app.put("/api/characters/:id", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

    const charId = c.req.param("id");
    const character = await db.getCharacterById(charId);
    if (!character) return c.json({ success: false, error: "Character not found" }, 404);

    const canEdit = character.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
    if (!canEdit) return c.json({ success: false, error: "Forbidden" }, 403);

    try {
      const { name, description } = await c.req.json();
      const success = await db.updateCharacter(
        charId,
        name || character.name,
        description !== undefined ? description : character.description
      );
      return c.json({ success, message: success ? "Character updated" : "Failed to update character" });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  app.delete("/api/characters/:id", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

    const charId = c.req.param("id");
    const character = await db.getCharacterById(charId);
    if (!character) return c.json({ success: false, error: "Character not found" }, 404);

    const canDelete = character.author.toLowerCase() === user.username.toLowerCase() || user.is_admin || user.is_owner;
    if (!canDelete) return c.json({ success: false, error: "Forbidden" }, 403);

    const success = await db.deleteCharacter(charId);
    return c.json({ success, message: success ? "Character deleted" : "Failed" });
  });
}
