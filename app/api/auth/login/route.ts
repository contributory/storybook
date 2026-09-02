import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { sha256 } from "@/lib/session";
import { withAuthCookies, jsonError } from "@/lib/api";

export async function POST(req: Request) {
  await ensureReady();
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return jsonError("Username and password required", 400);
    }

    const user = await db.getUserByUsername(username);
    if (!user) {
      return jsonError("Incorrect username or password", 400);
    }

    const inputHash = await sha256(password);
    if (user.password_hash !== inputHash) {
      return jsonError("Incorrect username or password", 400);
    }

    // Set permanent cookies
    const res = NextResponse.json({
      success: true,
      user: {
        username: user.username,
        display_name: user.display_name,
        is_admin: user.is_admin,
        is_owner: user.is_owner,
      },
    });
    return await withAuthCookies(res, user);
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}
