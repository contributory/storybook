import { NextResponse } from "next/server";
import * as db from "./db";
import { AUTH_COOKIE, SESSION_COOKIE, COOKIE_MAX_AGE, generateSessionHash } from "./session";

// JSON error response with the same shape as the previous Hono handlers
export function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// Persist auth cookies on a response (365-day permanent cookie, same as before)
export async function withAuthCookies<T extends NextResponse>(res: T, user: db.User): Promise<T> {
  const sessionHash = await generateSessionHash(user.username, user.password_hash);
  res.cookies.set(AUTH_COOKIE, user.username, { path: "/", maxAge: COOKIE_MAX_AGE });
  res.cookies.set(SESSION_COOKIE, sessionHash, { path: "/", maxAge: COOKIE_MAX_AGE });
  return res;
}

// Remove auth cookies (logout)
export function clearAuthCookies<T extends NextResponse>(res: T): T {
  res.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

// Require an authenticated user for a Route Handler; returns null when
// unauthorized (caller should return the 401 response).
export async function requireUser(req: Request): Promise<{ user: db.User } | { res: NextResponse }> {
  const { getUserFromRequest } = await import("./session");
  const user = await getUserFromRequest(req);
  if (!user) {
    return { res: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}
