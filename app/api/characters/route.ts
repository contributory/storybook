import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";
import { hasCreatorAccess } from "@/lib/guards";
import { jsonError } from "@/lib/api";

export async function POST(req: Request) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Unauthorized", 401);
  // Only users with the "Nhà sáng tạo" permission can create shared characters
  if (!hasCreatorAccess(user)) {
    return jsonError("Forbidden: Bạn cần bật quyền Nhà sáng tạo trong cài đặt", 403);
  }

  try {
    const { id, name, description, storyverse_id } = await req.json();
    if (!id || !name || !storyverse_id) {
      return jsonError("Missing fields", 400);
    }

    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const exist = await db.getCharacterById(cleanId);
    if (exist) return jsonError("Character ID already taken", 400);

    const character = await db.createCharacter(
      cleanId,
      name.trim(),
      typeof description === "object" ? JSON.stringify(description) : description,
      storyverse_id,
      user.username
    );

    return NextResponse.json({ success: true, character });
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}
