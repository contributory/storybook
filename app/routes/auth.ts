import type { AppType } from "../middleware.js";
import * as db from "../db.js";
import { sha256, setAuthCookies, clearAuthCookies } from "../middleware.js";

export function registerAuthRoutes(app: AppType) {
  app.post("/api/auth/register", async c => {
    try {
      const { username, password, display_name } = await c.req.json();
      if (!username || !password) {
        return c.json({ success: false, error: "Username and Password are required" }, 400);
      }

      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername.length < 3 || password.length < 4) {
        return c.json({ success: false, error: "Username must be >= 3 chars, password >= 4 chars" }, 400);
      }

      const existingUser = await db.getUserByUsername(cleanUsername);
      if (existingUser) {
        return c.json({ success: false, error: "Username is already taken" }, 400);
      }

      const pwdHash = await sha256(password);
      const displayName = (display_name || username).trim();

      const newUser = await db.createUser(cleanUsername, displayName, pwdHash, false, false);

      // Auto login
      await setAuthCookies(c, newUser);

      return c.json({ success: true, user: { username: newUser.username, display_name: newUser.display_name, is_admin: false, is_owner: false } });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  app.post("/api/auth/login", async c => {
    try {
      const { username, password } = await c.req.json();
      if (!username || !password) {
        return c.json({ success: false, error: "Username and password required" }, 400);
      }

      const user = await db.getUserByUsername(username);
      if (!user) {
        return c.json({ success: false, error: "Incorrect username or password" }, 400);
      }

      const inputHash = await sha256(password);
      if (user.password_hash !== inputHash) {
        return c.json({ success: false, error: "Incorrect username or password" }, 400);
      }

      // Set permanent cookies
      await setAuthCookies(c, user);

      return c.json({
        success: true,
        user: {
          username: user.username,
          display_name: user.display_name,
          is_admin: user.is_admin,
          is_owner: user.is_owner,
        },
      });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  app.post("/api/auth/logout", async c => {
    clearAuthCookies(c);
    return c.json({ success: true });
  });

  app.get("/api/auth/me", async c => {
    const user = c.get("user");
    if (!user) return c.json({ success: false, user: null });
    return c.json({
      success: true,
      user: {
        username: user.username,
        display_name: user.display_name,
        is_admin: user.is_admin,
        is_owner: user.is_owner,
      },
    });
  });
}
