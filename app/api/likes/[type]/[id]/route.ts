import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";

type Params = { params: Promise<{ type: string; id: string }> };

export async function GET(req: Request, { params }: Params) {
  await ensureReady();
  const { type, id } = await params;

  const user = await getUserFromRequest(req);
  const count = await db.getLikesCount(type as "storybook" | "storyverse" | "character", id);
  const liked = user
    ? await db.isLikedByUser(user.username, type as "storybook" | "storyverse" | "character", id)
    : false;

  const res = NextResponse.json({ success: true, count, liked });
  res.headers.set("Cache-Control", "public, max-age=30");
  return res;
}
