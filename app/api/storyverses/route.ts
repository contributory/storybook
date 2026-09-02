import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";
import { hasCreatorAccess } from "@/lib/guards";
import { jsonError } from "@/lib/api";

export async function GET() {
  await ensureReady();
  const universes = await db.getAllStoryverses();
  const res = NextResponse.json({ success: true, storyverses: universes });
  res.headers.set("Cache-Control", "public, max-age=60");
  return res;
}

export async function POST(req: Request) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Unauthorized", 401);
  // Only users with the "Nhà sáng tạo" permission can create storyverses
  if (!hasCreatorAccess(user)) {
    return jsonError("Forbidden: Bạn cần bật quyền Nhà sáng tạo trong cài đặt", 403);
  }

  try {
    const { id, title, description } = await req.json();
    if (!id || !title || !description) {
      return jsonError("Missing fields", 400);
    }

    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const exist = await db.getStoryverseById(cleanId);
    if (exist) return jsonError("Storyverse ID already exists", 400);

    const universe = await db.createStoryverse(cleanId, title.trim(), description.trim(), user.username);
    return NextResponse.json({ success: true, storyverse: universe });
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}
