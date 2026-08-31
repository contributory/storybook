import { randomUUID } from "node:crypto";
import type { AppType } from "../middleware.ts";
import * as db from "../db.ts";
import * as ui from "../ui.tsx";
import { renderWithLayout } from "../middleware.ts";
import { getCookie, setCookie } from "hono/cookie";
import { t, SUPPORTED_LANGUAGES, normalizeLanguage } from "../i18n.ts";

export function registerProfileRoutes(app: AppType) {
  // --- PROFILE ROUTES ---

  app.get("/profile", async c => {
    const user = c.get("user");
    if (!user) return c.redirect("/");
    return c.redirect(`/profile/${user.username}`);
  });

  app.get("/profile/:username", async c => {
    const currentUser = c.get("user");
    const targetUsername = c.req.param("username").toLowerCase();

    const profileUser = await db.getUserByUsername(targetUsername);
    if (!profileUser) return c.redirect("/");

    const bp = Number(c.req.query("bp")) || 1;
    const vp = Number(c.req.query("vp")) || 1;
    const cp = Number(c.req.query("cp")) || 1;
    const books = await db.getStorybooksByAuthorPaginated(targetUsername, bp, 10);
    const verses = await db.getStoryversesByAuthorPaginated(targetUsername, vp, 10);
    const characters = await db.getCharactersByAuthorPaginated(targetUsername, cp, 10);

    const followers = await db.getFollowers(targetUsername);
    const following = await db.getFollowing(targetUsername);
    const isFollowing = currentUser ? followers.includes(currentUser.username) : false;

    const rendered = ui.renderProfilePage(
      profileUser,
      currentUser ? currentUser.username === targetUsername : false,
      books,
      verses,
      characters,
      isFollowing,
      followers,
      following,
      currentUser
    );

    return await renderWithLayout(c, `Hồ sơ @${profileUser.username}`, rendered);
  });

  // --- SETTINGS ROUTES ---

  app.get("/settings", async c => {
    const user = c.get("user");
    if (!user) return c.redirect("/");

    // Get language from user preference or cookie (default to 'vi')
    const lang = user.language || getCookie(c, "lang") || "vi";
    const rendered = ui.renderSettingsPage(user, normalizeLanguage(lang));
    return await renderWithLayout(c, t("settings.title", normalizeLanguage(lang)), rendered, "/settings", normalizeLanguage(lang));
  });

  app.post("/api/settings", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

    try {
      const { display_name, is_creator, ai_author_name, des, avatar, language } = await c.req.json();
      if (!display_name) {
        return c.json({ success: false, error: "Display name is required" }, 400);
      }

      // Validate language if provided
      let validatedLanguage = undefined;
      if (language && SUPPORTED_LANGUAGES.includes(language)) {
        validatedLanguage = language;
      }

      const success = await db.updateUserSettings(
        user.username,
        display_name.trim(),
        !!is_creator,
        (ai_author_name || "").trim(),
        (des || "").trim(),
        (avatar || "").trim(),
        validatedLanguage
      );

      return c.json({ success });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  app.post("/api/settings/token", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

    try {
      const rawToken = `sb_tok_${randomUUID().replace(/-/g, "")}`;
      const success = await db.updateUserApiToken(user.username, rawToken);
      return c.json({ success, token: rawToken });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });
}
