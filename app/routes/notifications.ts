import type { AppType } from "../middleware.js";
import * as db from "../db.js";
import * as ui from "../ui.js";
import { renderWithLayout } from "../middleware.js";

export function registerNotificationRoutes(app: AppType) {
  // --- NOTIFICATIONS VIEW & API ---

  app.get("/notifications", async c => {
    const user = c.get("user");
    if (!user) return c.redirect("/");

    const page = Number(c.req.query("page")) || 1;
    const list = await db.getNotificationsPaginated(user.username, page, 15);
    const rendered = ui.renderNotificationsPage(list);
    return await renderWithLayout(c, "Thông báo của bạn", rendered, "/notifications");
  });

  app.get("/notifications/:id/click", async c => {
    const user = c.get("user");
    if (!user) return c.redirect("/");

    const id = c.req.param("id");
    await db.markNotificationAsRead(id);

    const res = await db.executeQuery("SELECT target_type, target_id FROM notifications WHERE id = ?", [id]);
    if (res.rows.length === 0) return c.redirect("/notifications");

    const type = res.rows[0].target_type as string;
    const targetId = res.rows[0].target_id as string;

    if (type === "storybook") {
      return c.redirect(`/storybook/${targetId}`);
    } else if (type === "storyverse") {
      return c.redirect(`/storyverses/${targetId}`);
    } else if (type === "character") {
      const char = await db.getCharacterById(targetId);
      if (char) {
        return c.redirect(`/storyverses/${char.storyverse_id}`);
      }
      return c.redirect("/storyverses");
    }

    return c.redirect("/notifications");
  });

  app.post("/api/notifications/read-all", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

    try {
      await db.executeQuery("UPDATE notifications SET is_read = 1 WHERE username = ?", [user.username.toLowerCase()]);
      return c.json({ success: true });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });
}
