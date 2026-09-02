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
    const { target_type, target_id } = await req.json();
    if (!target_type || !target_id) {
      return jsonError("Missing fields", 400);
    }

    const result = await db.toggleLike(user.username, target_type, target_id);
    const count = await db.getLikesCount(target_type, target_id);

    return NextResponse.json({ success: true, ...result, count });
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}
