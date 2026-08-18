import { getCookie, setCookie, deleteCookie } from "npm:hono/cookie";
import type { Hono } from "npm:hono";
import * as db from "./db.ts";
import * as ui from "./ui.tsx";

// Variables shared through the Hono context
export type AppVariables = {
  user: db.User | null;
};

export type AppType = Hono<{ Variables: AppVariables }>;

// App Secret for Cookie signing
const APP_SECRET = Deno.env.get("APP_SECRET") || "hono-deno-storybook-secret-key-123456";

// SHA-256 Hash Helper
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Session Signature Helper
async function generateSessionHash(username: string, passwordHash: string): Promise<string> {
  return await sha256(`${username}:${passwordHash}:${APP_SECRET}`);
}

// Initialize Owner account
export async function ensureOwnerAccount() {
  const ownerUsername = Deno.env.get("OWNER_USERNAME") || "owner";
  const ownerPassword = Deno.env.get("OWNER_PASSWORD") || "owner123";

  const existingOwner = await db.getUserByUsername(ownerUsername);
  const passwordHash = await sha256(ownerPassword);

  if (!existingOwner) {
    console.log(`Creating owner account with username: '${ownerUsername}'`);
    await db.createUser(ownerUsername, "System Owner", passwordHash, true, true);
  } else {
    // Keep password updated with env variables
    await db.executeQuery(
      `UPDATE users SET password_hash = ?, is_admin = 1, is_owner = 1 WHERE username = ?`,
      [passwordHash, ownerUsername.toLowerCase()]
    );
  }
}

// Authentication Middleware
export async function authMiddleware(c: any, next: () => Promise<void>) {
  const username = getCookie(c, "user_username");
  const sessionHash = getCookie(c, "user_session");

  if (!username || !sessionHash) {
    c.set("user", null);
    await next();
    return;
  }

  const user = await db.getUserByUsername(username);
  if (!user) {
    c.set("user", null);
    await next();
    return;
  }

  const expectedHash = await generateSessionHash(user.username, user.password_hash);
  if (sessionHash !== expectedHash) {
    c.set("user", null);
    await next();
    return;
  }

  c.set("user", user);
  await next();
}

// Helper to render layout with unread notifications count
export async function renderWithLayout(c: any, title: string, rendered: any, currentPath = "/") {
  const user = c.get("user");
  const count = user ? await db.getUnreadNotificationsCount(user.username) : 0;
  return c.html(ui.layout(title, rendered, user, currentPath, count));
}

// Helper: check whether the user has enabled the "Nhà sáng tạo" (creator) permission.
// Admins and the owner always bypass this check.
export function hasCreatorAccess(user: db.User | null): boolean {
  return !!user && (user.is_creator || user.is_admin || user.is_owner);
}

// Persist auth cookies for a freshly authenticated user (365-day permanent cookie)
export async function setAuthCookies(c: any, user: db.User) {
  const sessionHash = await generateSessionHash(user.username, user.password_hash);
  const maxAge = 60 * 60 * 24 * 365;
  setCookie(c, "user_username", user.username, { path: "/", maxAge });
  setCookie(c, "user_session", sessionHash, { path: "/", maxAge });
}

// Remove auth cookies (logout)
export function clearAuthCookies(c: any) {
  deleteCookie(c, "user_username", { path: "/" });
  deleteCookie(c, "user_session", { path: "/" });
}
