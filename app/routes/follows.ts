import type { AppType } from "../middleware.js";
import * as db from "../db.js";

export function registerFollowRoutes(app: AppType) {
  // --- FOLLOWS API ---

  app.post("/api/users/:username/follow", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

    const targetUser = c.req.param("username");
    const { action } = await c.req.json(); // "follow" or "unfollow"

    if (action === "follow") {
      const ok = await db.followUser(user.username, targetUser);
      return c.json({ success: ok, message: ok ? "Followed" : "Failed" });
    } else {
      const ok = await db.unfollowUser(user.username, targetUser);
      return c.json({ success: ok, message: ok ? "Unfollowed" : "Failed" });
    }
  });
}
