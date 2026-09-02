import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";
import { jsonError } from "@/lib/api";

type Params = { params: Promise<{ id: string; num: string }> };

export async function GET(req: Request, { params }: Params) {
  await ensureReady();
  const { id: bookId, num: numParam } = await params;
  const num = Number(numParam);

  const user = await getUserFromRequest(req);
  const chapter = await db.getChapter(bookId, num);
  if (!chapter) return jsonError("Chapter not found", 404);

  // Save reading progress if user is logged in
  if (user) {
    await db.saveReadingProgress(user.username, bookId, num);
  }

  const res = NextResponse.json({ success: true, chapter });
  res.headers.set("Cache-Control", "public, max-age=60");
  return res;
}

export async function DELETE(req: Request, { params }: Params) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Unauthorized", 401);

  const { id: bookId, num: numParam } = await params;
  const num = Number(numParam);

  const book = await db.getStorybookById(bookId);
  if (!book) return jsonError("Storybook not found", 404);

  const isAuthor = book.authors.toLowerCase().includes(user.username.toLowerCase());
  const canDelete = isAuthor || user.is_admin || user.is_owner;

  if (!canDelete) return jsonError("Forbidden", 403);

  const success = await db.deleteChapter(bookId, num);
  return NextResponse.json({ success, message: success ? "Chapter deleted" : "Failed to delete" });
}
