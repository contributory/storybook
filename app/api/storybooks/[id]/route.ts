import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { ensureReady } from "@/lib/bootstrap";
import { getUserFromRequest } from "@/lib/session";
import { jsonError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  await ensureReady();
  const { id } = await params;
  const book = await db.getStorybookById(id);
  if (!book) return jsonError("Storybook not found", 404);
  const res = NextResponse.json({ success: true, storybook: book });
  res.headers.set("Cache-Control", "public, max-age=60");
  return res;
}

export async function PUT(req: Request, { params }: Params) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Unauthorized", 401);

  const { id: bookId } = await params;
  const book = await db.getStorybookById(bookId);
  if (!book) return jsonError("Storybook not found", 404);

  // Auth check: original creator, or system admin/owner, or other author if editing is allowed
  const isAuthor = book.authors.toLowerCase().includes(user.username.toLowerCase());
  const canEdit = isAuthor || user.is_admin || user.is_owner || book.allow_other_author_edit;

  if (!canEdit) {
    return jsonError("You don't have permission to edit this book", 403);
  }

  try {
    const { title, description, categories, allow_other_author_edit, storyverse_id, characters, ost } =
      await req.json();
    const updated = await db.updateStorybook(
      bookId,
      title || book.title,
      description || book.description,
      categories || book.categories,
      allow_other_author_edit !== undefined ? !!allow_other_author_edit : book.allow_other_author_edit,
      storyverse_id !== undefined ? storyverse_id || null : book.storyverse_id,
      undefined,
      characters !== undefined
        ? typeof characters === "string"
          ? characters
          : JSON.stringify(characters)
        : undefined,
      ost !== undefined ? (typeof ost === "string" ? ost : JSON.stringify(ost)) : undefined
    );

    // If another author is editing and not in authors list, append their name
    if (updated && !isAuthor && book.allow_other_author_edit) {
      const newAuthors = `${book.authors}, ${user.username}`;
      await db.executeQuery(`UPDATE storybooks SET authors = ? WHERE id = ?`, [newAuthors, bookId]);
    }

    return NextResponse.json({ success: true, message: "Storybook updated successfully" });
  } catch (err: any) {
    return jsonError(err.message, 500);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  await ensureReady();
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("Unauthorized", 401);

  const { id: bookId } = await params;
  const book = await db.getStorybookById(bookId);
  if (!book) return jsonError("Storybook not found", 404);

  const isAuthor = book.authors
    .toLowerCase()
    .split(",")
    .map((a) => a.trim())
    .includes(user.username.toLowerCase());
  const canDelete = isAuthor || user.is_admin || user.is_owner;

  if (!canDelete) return jsonError("Forbidden", 403);

  const success = await db.deleteStorybook(bookId);
  return NextResponse.json({ success, message: success ? "Storybook deleted" : "Failed to delete" });
}
