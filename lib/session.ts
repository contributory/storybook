import { createHash } from "node:crypto";
import * as db from "./db";

// App Secret for Cookie signing (same value as the previous Hono middleware)
export const APP_SECRET = process.env.APP_SECRET || "hono-deno-storybook-secret-key-123456";

export const AUTH_COOKIE = "user_username";
export const SESSION_COOKIE = "user_session";

// 365-day permanent cookie, same as the original implementation
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// SHA-256 Hash Helper
export async function sha256(message: string): Promise<string> {
  return createHash("sha256").update(message, "utf8").digest("hex");
}

// Session Signature Helper
export async function generateSessionHash(username: string, passwordHash: string): Promise<string> {
  return sha256(`${username}:${passwordHash}:${APP_SECRET}`);
}

// Parse a raw `Cookie` header into a key/value map (works in route handlers
// without needing Next.js request-scoped APIs).
export function parseCookieHeader(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  }
  return out;
}

// Validate a username/session-hash pair against the stored password hash.
export async function authenticate(
  username: string | undefined | null,
  sessionHash: string | undefined | null
): Promise<db.User | null> {
  if (!username || !sessionHash) return null;
  const user = await db.getUserByUsername(username);
  if (!user) return null;
  const expectedHash = await generateSessionHash(user.username, user.password_hash);
  if (sessionHash !== expectedHash) return null;
  return user;
}

// Resolve the authenticated user from an incoming Request (Route Handlers).
export async function getUserFromRequest(req: Request): Promise<db.User | null> {
  const cookies = parseCookieHeader(req.headers.get("cookie"));
  return authenticate(cookies[AUTH_COOKIE], cookies[SESSION_COOKIE]);
}
