import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";
import { jsonError } from "@/lib/api";

type Params = { params: Promise<{ username: string }> };

export async function POST(req: Request, { params }: Params) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Unauthorized", 401);

  const { username: targetUser } = await params;
  const { action } = await req.json(); // "follow" or "unfollow"

  if (action === "follow") {
    const ok = await db.followUser(user.username, targetUser);
    return NextResponse.json({ success: ok, message: ok ? "Followed" : "Failed" });
  } else {
    const ok = await db.unfollowUser(user.username, targetUser);
    return NextResponse.json({ success: ok, message: ok ? "Unfollowed" : "Failed" });
  }
}
