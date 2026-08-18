import type { AppType } from "../middleware.ts";
import * as db from "../db.ts";

// --- ADMIN API ---
export function registerAdminRoutes(app: AppType) {
  app.get("/api/admin/users", async (c) => {
    const user = c.get("user");
    if (!user || (!user.is_admin && !user.is_owner)) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }

    const users = await db.getAllUsers();
    return c.json({ success: true, users });
  });

  app.put("/api/admin/users/:username/role", async (c) => {
    const user = c.get("user");
    if (!user || (!user.is_admin && !user.is_owner)) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }

    const target = c.req.param("username");
    const { is_admin } = await c.req.json();

    const ok = await db.updateUserRole(user.username, target, !!is_admin);
    return c.json({ success: ok, message: ok ? "User role updated" : "Failed" });
  });

  app.delete("/api/admin/users/:username", async (c) => {
    const user = c.get("user");
    if (!user || (!user.is_admin && !user.is_owner)) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }

    const target = c.req.param("username");
    const ok = await db.deleteUser(user.username, target);
    return c.json({ success: ok, message: ok ? "User deleted" : "Failed" });
  });

  app.delete("/api/admin/comments/:id", async (c) => {
    const user = c.get("user");
    if (!user || (!user.is_admin && !user.is_owner)) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }

    const commentId = c.req.param("id");
    const ok = await db.deleteComment(commentId);
    return c.json({ success: ok, message: ok ? "Comment deleted" : "Failed" });
  });
}
