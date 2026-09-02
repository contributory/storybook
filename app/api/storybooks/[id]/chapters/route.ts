import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";
import { jsonError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  await ensureReady();
  const { id } = await params;
  const list = await db.getChaptersList(id);
  const res = NextResponse.json({ success: true, chapters: list });
  res.headers.set("Cache-Control", "public, max-age=60");
  return res;
}

export async function POST(req: Request, { params }: Params) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Unauthorized", 401);

  const { id: bookId } = await params;
  const book = await db.getStorybookById(bookId);
  if (!book) return jsonError("Storybook not found", 404);

  const isAuthor = book.authors.toLowerCase().includes(user.username.toLowerCase());
  const canEdit = isAuthor || user.is_admin || user.is_owner || book.allow_other_author_edit;

  if (!canEdit) return jsonError("Forbidden", 403);

  try {
    const { chapter_number, title, content, summary } = await req.json();
    if (!chapter_number || !title || !content) {
      return jsonError("Missing chapter details", 400);
    }

    const chapter = await db.createOrEditChapter(
      bookId,
      Number(chapter_number),
      title.trim(),
      content.trim(),
      (summary || "").trim()
    );

    return NextResponse.json({ success: true, chapter });
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}
