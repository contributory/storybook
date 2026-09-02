import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";
import { hasCreatorAccess } from "@/lib/guards";
import { jsonError } from "@/lib/api";

export async function GET() {
  await ensureReady();
  const books = await db.getAllStorybooks();
  const res = NextResponse.json({ success: true, storybooks: books });
  res.headers.set("Cache-Control", "public, max-age=60");
  return res;
}

export async function POST(req: Request) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Unauthorized", 401);
  // Only users with the "Nhà sáng tạo" permission can create storybooks
  if (!hasCreatorAccess(user)) {
    return jsonError("Forbidden: Bạn cần bật quyền Nhà sáng tạo trong cài đặt", 403);
  }

  try {
    const { id, title, description, categories, allow_other_author_edit, storyverse_id, characters } =
      await req.json();
    if (!id || !title || !description || !categories) {
      return jsonError("Missing required fields", 400);
    }

    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleanId) return jsonError("Invalid Storybook ID", 400);

    const exist = await db.getStorybookById(cleanId);
    if (exist) return jsonError("Storybook ID already exists", 400);

    const book = await db.createStorybook(
      cleanId,
      title.trim(),
      description.trim(),
      user.username, // Original author
      categories.trim(),
      !!allow_other_author_edit,
      storyverse_id || null,
      "",
      characters !== undefined
        ? typeof characters === "string"
          ? characters
          : JSON.stringify(characters)
        : "[]"
    );

    return NextResponse.json({ success: true, storybook: book });
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}
