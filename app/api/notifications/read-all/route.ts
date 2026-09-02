import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";
import { jsonError } from "@/lib/api";

export async function POST(req: Request) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Unauthorized", 401);

  try {
    await db.executeQuery("UPDATE notifications SET is_read = 1 WHERE username = ?", [
      user.username.toLowerCase(),
    ]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}
