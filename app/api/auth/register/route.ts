import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { sha256 } from "@/lib/session";
import { withAuthCookies, jsonError } from "@/lib/api";

export async function POST(req: Request) {
  await ensureReady();
  try {
    const { username, password, display_name } = await req.json();
    if (!username || !password) {
      return jsonError("Username and Password are required", 400);
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || password.length < 4) {
      return jsonError("Username must be >= 3 chars, password >= 4 chars", 400);
    }

    const existingUser = await db.getUserByUsername(cleanUsername);
    if (existingUser) {
      return jsonError("Username is already taken", 400);
    }

    const pwdHash = await sha256(password);
    const displayName = (display_name || username).trim();

    const newUser = await db.createUser(cleanUsername, displayName, pwdHash, false, false);

    // Auto login
    const res = NextResponse.json({
      success: true,
      user: { username: newUser.username, display_name: newUser.display_name, is_admin: false, is_owner: false },
    });
    return await withAuthCookies(res, newUser);
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}
